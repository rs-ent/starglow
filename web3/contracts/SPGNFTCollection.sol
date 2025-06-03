// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title ISPGNFT
 * @dev Interface for Story Protocol Gateway NFT
 */
interface ISPGNFT {
    struct InitParams {
        string name;
        string symbol;
        string baseURI;
        string contractURI;
        uint256 maxSupply;
        uint256 mintFee;
        address mintFeeToken;
        address mintFeeRecipient;
        address owner;
        bool mintOpen;
        bool isPublicMinting;
    }

    function mint(address to) external payable returns (uint256);
    function mint(address to, uint256 quantity) external payable returns (uint256);
}

/**
 * @title SPGNFTCollection
 * @dev Custom SPG NFT Collection for Story Protocol integration
 * @notice This contract implements ISPGNFT interface for Story Protocol's mintAndRegisterIp function
 */
contract SPGNFTCollection is ERC721A, ISPGNFT, Ownable, Pausable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    // Structs
    // Using ISPGNFT.InitParams from interface

    struct TransferPermit {
        address owner;
        address to;
        uint256[] tokenIds;
        uint256 nonce;
        uint256 deadline;
    }

    // State variables
    string private _baseTokenURI;
    string public contractURI;
    uint256 public maxSupply;
    uint256 public mintFee;
    address public mintFeeToken;
    address public mintFeeRecipient;
    bool public mintOpen;
    bool public isPublicMinting;

    // Individual token URI storage for Story Protocol compatibility
    mapping(uint256 => string) private _tokenURIs;

    // Whitelist management
    mapping(address => uint256) public mintAllowance;
    mapping(address => bool) public minters;

    // Escrow management
    mapping(address => bool) public isEscrowWallet;
    mapping(address => uint256) public nonces; // For replay protection

    // EIP-712 typehash for escrow transfer
    bytes32 public constant TRANSFER_PERMIT_TYPEHASH = keccak256(
        "TransferPermit(address owner,address to,uint256[] tokenIds,uint256 nonce,uint256 deadline)"
    );

    // Events
    event Minted(address indexed to, uint256 indexed tokenId);
    event MintStatusChanged(bool open);
    event PublicMintingStatusChanged(bool isPublic);
    event MintFeeChanged(uint256 fee);
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event EscrowWalletAdded(address indexed wallet);
    event EscrowWalletRemoved(address indexed wallet);
    event EscrowTransfer(address indexed from, address indexed to, uint256[] tokenIds, address indexed executor);

    /**
     * @dev Constructor
     */
    constructor(
        InitParams memory params
    ) 
        ERC721A(params.name, params.symbol) 
        EIP712("SPGNFTCollection", "1")
        Ownable(params.owner)
    {
        _baseTokenURI = params.baseURI;
        contractURI = params.contractURI;
        maxSupply = params.maxSupply;
        mintFee = params.mintFee;
        mintFeeToken = params.mintFeeToken;
        mintFeeRecipient = params.mintFeeRecipient;
        mintOpen = params.mintOpen;
        isPublicMinting = params.isPublicMinting;
    }

    /**
     * @dev Main minting function for Story Protocol integration with individual tokenURI
     * @param to Address to mint the NFT to
     * @param quantity Number of NFTs to mint
     * @param tokenURIs Array of tokenURIs for each NFT
     * @return tokenId The ID of the first minted token
     */
    function mint(address to, uint256 quantity, string[] calldata tokenURIs) external payable nonReentrant whenNotPaused returns (uint256) {
        require(mintOpen, "Minting is closed");
        require(totalSupply() + quantity <= maxSupply, "Max supply exceeded");
        require(tokenURIs.length == quantity, "TokenURI count mismatch");
        
        // Check minting permissions
        if (!isPublicMinting) {
            require(minters[msg.sender] || owner() == msg.sender, "Not authorized to mint");
        }

        // Handle mint fee
        if (mintFee > 0) {
            uint256 totalFee = mintFee * quantity;
            if (mintFeeToken == address(0)) {
                require(msg.value >= totalFee, "Insufficient payment");
                if (mintFeeRecipient != address(0)) {
                    (bool success, ) = mintFeeRecipient.call{value: totalFee}("");
                    require(success, "Fee transfer failed");
                }
                // Refund excess payment
                if (msg.value > totalFee) {
                    (bool refundSuccess, ) = msg.sender.call{value: msg.value - totalFee}("");
                    require(refundSuccess, "Refund failed");
                }
            } else {
                revert("ERC20 payment not implemented");
            }
        }

        uint256 startTokenId = _nextTokenId();
        _mint(to, quantity);

        // Set individual tokenURIs for Story Protocol
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = startTokenId + i;
            _tokenURIs[tokenId] = tokenURIs[i];
        }

        for (uint256 i = 0; i < quantity; i++) {
            emit Minted(to, startTokenId + i);
        }

        return startTokenId;
    }

    /**
     * @dev Overloaded mint function for ISPGNFT interface compatibility
     * @param to Address to mint the NFT to
     * @param quantity Number of NFTs to mint
     * @return tokenId The ID of the first minted token
     */
    function mint(address to, uint256 quantity) external payable returns (uint256) {
        // Create array of empty tokenURIs for backward compatibility
        string[] memory tokenURIs = new string[](quantity);
        for (uint256 i = 0; i < quantity; i++) {
            tokenURIs[i] = "";
        }
        return this.mint(to, quantity, tokenURIs);
    }

    /**
     * @dev Simplified mint function for ISPGNFT interface (single NFT)
     * @param to Address to mint the NFT to
     * @return tokenId The ID of the minted token
     */
    function mint(address to) external payable returns (uint256) {
        return this.mint(to, 1);
    }



    /**
     * @dev Escrow transfer with EIP-712 signature verification
     * @param owner The current owner of the tokens
     * @param to The recipient address
     * @param tokenIds Array of token IDs to transfer
     * @param deadline Expiration time of the signature
     * @param v Recovery byte of the signature
     * @param r Half of the ECDSA signature pair
     * @param s Half of the ECDSA signature pair
     */
    function escrowTransfer(
        address owner,
        address to,
        uint256[] calldata tokenIds,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant whenNotPaused {
        require(isEscrowWallet[msg.sender], "Not authorized escrow wallet");
        require(block.timestamp <= deadline, "Signature expired");
        require(tokenIds.length > 0, "No tokens to transfer");

        // Verify ownership and prepare transfer
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(_exists(tokenIds[i]), "Token does not exist");
            require(ownerOf(tokenIds[i]) == owner, "Not token owner");
        }

        // Create permit struct
        TransferPermit memory permit = TransferPermit({
            owner: owner,
            to: to,
            tokenIds: tokenIds,
            nonce: nonces[owner],
            deadline: deadline
        });

        // Verify signature
        bytes32 structHash = keccak256(
            abi.encode(
                TRANSFER_PERMIT_TYPEHASH,
                permit.owner,
                permit.to,
                keccak256(abi.encodePacked(permit.tokenIds)),
                permit.nonce,
                permit.deadline
            )
        );

        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, v, r, s);
        
        require(signer == owner, "Invalid signature");

        // Update nonce to prevent replay
        nonces[owner]++;

        // Execute transfers
        for (uint256 i = 0; i < tokenIds.length; i++) {
            super.safeTransferFrom(owner, to, tokenIds[i]);
        }

        emit EscrowTransfer(owner, to, tokenIds, msg.sender);
    }

    /**
     * @dev Alternative escrow transfer using compact signature
     */
    function escrowTransferWithSignature(
        address owner,
        address to,
        uint256[] calldata tokenIds,
        uint256 deadline,
        bytes calldata signature
    ) external nonReentrant whenNotPaused {
        require(isEscrowWallet[msg.sender], "Not authorized escrow wallet");
        require(block.timestamp <= deadline, "Signature expired");
        require(tokenIds.length > 0, "No tokens to transfer");

        // Verify ownership
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(_exists(tokenIds[i]), "Token does not exist");
            require(ownerOf(tokenIds[i]) == owner, "Not token owner");
        }

        // Create and verify signature
        bytes32 structHash = keccak256(
            abi.encode(
                TRANSFER_PERMIT_TYPEHASH,
                owner,
                to,
                keccak256(abi.encodePacked(tokenIds)),
                nonces[owner],
                deadline
            )
        );

        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, signature);
        
        require(signer == owner, "Invalid signature");

        // Update nonce
        nonces[owner]++;

        // Execute transfers
        for (uint256 i = 0; i < tokenIds.length; i++) {
            super.safeTransferFrom(owner, to, tokenIds[i]);
        }

        emit EscrowTransfer(owner, to, tokenIds, msg.sender);
    }

    // Admin functions
    
    /**
     * @dev Add an escrow wallet
     */
    function addEscrowWallet(address wallet) external onlyOwner {
        require(wallet != address(0), "Invalid address");
        isEscrowWallet[wallet] = true;
        emit EscrowWalletAdded(wallet);
    }

    /**
     * @dev Remove an escrow wallet
     */
    function removeEscrowWallet(address wallet) external onlyOwner {
        isEscrowWallet[wallet] = false;
        emit EscrowWalletRemoved(wallet);
    }

    /**
     * @dev Set mint open status
     */
    function setMintOpen(bool _mintOpen) external onlyOwner {
        mintOpen = _mintOpen;
        emit MintStatusChanged(_mintOpen);
    }

    /**
     * @dev Set public minting status
     */
    function setPublicMinting(bool _isPublic) external onlyOwner {
        isPublicMinting = _isPublic;
        emit PublicMintingStatusChanged(_isPublic);
    }

    /**
     * @dev Add a minter (for restricted minting)
     */
    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
        emit MinterAdded(minter);
    }

    /**
     * @dev Remove a minter
     */
    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }

    /**
     * @dev Update mint fee
     */
    function setMintFee(uint256 _mintFee) external onlyOwner {
        mintFee = _mintFee;
        emit MintFeeChanged(_mintFee);
    }

    /**
     * @dev Update base URI
     */
    function setBaseURI(string calldata baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    /**
     * @dev Update contract URI
     */
    function setContractURI(string calldata _contractURI) external onlyOwner {
        contractURI = _contractURI;
    }

    /**
     * @dev Pause minting
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause minting
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Update tokenURI for a specific token (only owner)
     * @param tokenId The token ID to update
     * @param _tokenURI The new URI for the token
     */
    function setTokenURI(uint256 tokenId, string calldata _tokenURI) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        _tokenURIs[tokenId] = _tokenURI;
    }

    // View functions

    /**
     * @dev Get base URI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Check if an address can mint
     */
    function canMint(address account) external view returns (bool) {
        if (isPublicMinting) return true;
        return minters[account] || owner() == account;
    }

    /**
     * @dev Get mint price for a quantity
     */
    function getMintPrice(uint256 quantity) external view returns (uint256) {
        return mintFee * quantity;
    }

    /**
     * @dev Check total supply vs max supply
     */
    function availableSupply() external view returns (uint256) {
        return maxSupply - totalSupply();
    }

    /**
     * @dev Get current nonce for an address
     */
    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }

    /**
     * @dev Get tokenURI - returns individual URI if set, otherwise baseURI + tokenId
     * @param tokenId The token ID to query
     * @return The token URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");
        
        string memory _tokenURI = _tokenURIs[tokenId];
        if (bytes(_tokenURI).length > 0) {
            return _tokenURI;
        }
        
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Required for Story Protocol compatibility
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721A) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

