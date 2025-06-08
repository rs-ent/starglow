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
 * @title IERC6551Registry
 * @dev Interface for ERC6551 registry
 */
interface IERC6551Registry {

    function account(
        address implementation,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId,
        uint256 salt
    ) external view returns (address);
}

contract SPGNFTCollection is ERC721A, ISPGNFT, Ownable, Pausable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    uint256 private constant MAX_BATCH_SIZE = 100;
    uint256 private constant SAFE_BATCH_SIZE = 50;
    
    bytes32 public constant TRANSFER_PERMIT_TYPEHASH = keccak256(
        "TransferPermit(address owner,address to,uint256[] tokenIds,uint256 nonce,uint256 deadline)"
    );
    
    bytes32 public constant BATCH_TRANSFER_TYPEHASH = keccak256(
        "BatchTransferPermit(address owner,address to,uint256 startTokenId,uint256 quantity,uint256 nonce,uint256 deadline)"
    );

    struct TransferPermit {
        address owner;
        address to;
        uint256[] tokenIds;
        uint256 nonce;
        uint256 deadline;
    }

    struct BatchTransferPermit {
        address owner;
        address to;
        uint256 startTokenId;
        uint256 quantity;
        uint256 nonce;
        uint256 deadline;
    }

    IERC6551Registry public immutable TBARegistry;
    address public immutable TBAImplementation;

    string private _baseTokenURI;
    string public contractURI;
    uint256 public maxSupply;
    uint256 public mintFee;
    address public mintFeeToken;
    address public mintFeeRecipient;
    bool public mintOpen;
    bool public isPublicMinting;

    mapping(uint256 => string) private _tokenURIs;
    mapping(address => bool) public minters;
    mapping(address => bool) public isEscrowWallet;
    mapping(address => uint256) public nonces;

    event Minted(address indexed to, uint256 indexed tokenId);
    event BatchMinted(address indexed to, uint256 indexed startTokenId, uint256 quantity);
    event MintStatusChanged(bool open);
    event PublicMintingStatusChanged(bool isPublic);
    event MintFeeChanged(uint256 fee);
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event EscrowWalletAdded(address indexed wallet);
    event EscrowWalletRemoved(address indexed wallet);
    event EscrowTransfer(address indexed from, address indexed to, uint256[] tokenIds, address indexed executor);
    event BatchEscrowTransfer(address indexed from, address indexed to, uint256 startTokenId, uint256 quantity, address indexed executor);

    constructor(
        InitParams memory params,
        address _TBARegistry,
        address _TBAImplementation
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

        isEscrowWallet[msg.sender] = true;

        TBARegistry = IERC6551Registry(_TBARegistry);
        TBAImplementation = _TBAImplementation;
    }

    function getTBA(uint256 tokenId) public view returns (address) {
        return TBARegistry.account(
            TBAImplementation,
            block.chainid,
            address(this),
            tokenId,
            0
        );
    }
    
    function mint(address to, uint256 quantity, string[] calldata tokenURIs) external payable nonReentrant whenNotPaused returns (uint256) {
        require(mintOpen, "Minting is closed");
        require(totalSupply() + quantity <= maxSupply, "Max supply exceeded");
        require(tokenURIs.length == quantity, "TokenURI count mismatch");
        require(quantity <= MAX_BATCH_SIZE, "Batch too large");
        
        if (!isPublicMinting) {
            require(minters[msg.sender] || owner() == msg.sender, "Not authorized to mint");
        }

        if (mintFee > 0) {
            _processMintFee(quantity);
        }

        uint256 startTokenId = _nextTokenId();
        _mint(to, quantity);

        unchecked {
            for (uint256 i = 0; i < quantity; ++i) {
                if (bytes(tokenURIs[i]).length > 0) {
                    _tokenURIs[startTokenId + i] = tokenURIs[i];
                }
            }
        }

        emit BatchMinted(to, startTokenId, quantity);
        return startTokenId;
    }

    function mint(address to, uint256 quantity) external payable returns (uint256) {
        string[] memory tokenURIs = new string[](quantity);
        return _mintWithURIs(to, quantity, tokenURIs);
    }
    
    function mint(address to) external payable returns (uint256) {
        string[] memory tokenURIs = new string[](1);
        return _mintWithURIs(to, 1, tokenURIs);
    }

    function _mintWithURIs(address to, uint256 quantity, string[] memory tokenURIs) internal nonReentrant whenNotPaused returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(mintOpen, "Minting is closed");
        require(totalSupply() + quantity <= maxSupply, "Max supply exceeded");
        require(tokenURIs.length == 0 || tokenURIs.length == quantity, "TokenURI count mismatch");
        require(quantity > 0 && quantity <= MAX_BATCH_SIZE, "Invalid quantity");
        
        if (!isPublicMinting) {
            require(minters[msg.sender] || owner() == msg.sender, "Not authorized to mint");
        }

        if (mintFee > 0) {
            _processMintFee(quantity);
        }

        uint256 startTokenId = _nextTokenId();
        _mint(to, quantity);

        if (tokenURIs.length > 0) {
            unchecked {
                for (uint256 i = 0; i < quantity; ++i) {
                    if (bytes(tokenURIs[i]).length > 0) {
                        _tokenURIs[startTokenId + i] = tokenURIs[i];
                    }
                }
            }
        }

        emit BatchMinted(to, startTokenId, quantity);
        return startTokenId;
    }
    
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
        require(to != address(0), "Cannot transfer to zero address");
        require(owner != address(0), "Invalid owner address");
        require(block.timestamp <= deadline, "Signature expired");
        require(tokenIds.length > 0 && tokenIds.length <= SAFE_BATCH_SIZE, "Invalid batch size");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(_exists(tokenIds[i]), "Token does not exist");
            require(ownerOf(tokenIds[i]) == owner, "Not token owner");
        }

        TransferPermit memory permit = TransferPermit({
            owner: owner,
            to: to,
            tokenIds: tokenIds,
            nonce: nonces[owner],
            deadline: deadline
        });

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

        unchecked {
            nonces[owner]++;
        }

        for (uint256 i = 0; i < tokenIds.length; i++) {
            super.safeTransferFrom(owner, to, tokenIds[i]);
        }

        emit EscrowTransfer(owner, to, tokenIds, msg.sender);
    }

    function escrowTransferWithSignature(
        address owner,
        address to,
        uint256[] calldata tokenIds,
        uint256 deadline,
        bytes calldata signature
    ) external nonReentrant whenNotPaused {
        require(isEscrowWallet[msg.sender], "Not authorized escrow wallet");
        require(to != address(0), "Cannot transfer to zero address");
        require(owner != address(0), "Invalid owner address");
        require(block.timestamp <= deadline, "Signature expired");
        require(tokenIds.length > 0 && tokenIds.length <= SAFE_BATCH_SIZE, "Invalid batch size");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(_exists(tokenIds[i]), "Token does not exist");
            require(ownerOf(tokenIds[i]) == owner, "Not token owner");
        }

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

        unchecked {
            nonces[owner]++;
        }

        for (uint256 i = 0; i < tokenIds.length; i++) {
            super.safeTransferFrom(owner, to, tokenIds[i]);
        }

        emit EscrowTransfer(owner, to, tokenIds, msg.sender);
    }

    function escrowTransferBatch(
        address owner,
        address to,
        uint256 startTokenId,
        uint256 quantity,
        uint256 deadline,
        bytes calldata signature
    ) external nonReentrant whenNotPaused {
        require(isEscrowWallet[msg.sender], "Not authorized escrow wallet");
        require(to != address(0), "Cannot transfer to zero address");
        require(owner != address(0), "Invalid owner address");
        require(block.timestamp <= deadline, "Signature expired");
        
        uint256 maxBatch = quantity > 20 ? SAFE_BATCH_SIZE : MAX_BATCH_SIZE;
        require(quantity > 0 && quantity <= maxBatch, "Invalid quantity");
        
        _verifyConsecutiveOwnership(owner, startTokenId, quantity);
        
        BatchTransferPermit memory permit = BatchTransferPermit({
            owner: owner,
            to: to,
            startTokenId: startTokenId,
            quantity: quantity,
            nonce: nonces[owner],
            deadline: deadline
        });
        
        bytes32 structHash = keccak256(
            abi.encode(
                BATCH_TRANSFER_TYPEHASH,
                permit.owner,
                permit.to,
                permit.startTokenId,
                permit.quantity,
                permit.nonce,
                permit.deadline
            )
        );
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, signature);
        require(signer == owner, "Invalid signature");
        
        unchecked {
            nonces[owner]++;
        }
        
        _batchTransferFrom(owner, to, startTokenId, quantity);
        
        emit BatchEscrowTransfer(owner, to, startTokenId, quantity, msg.sender);
    }

    function _batchTransferFrom(
        address from,
        address to,
        uint256 startTokenId,
        uint256 quantity
    ) internal {
        unchecked {
            for (uint256 i = 0; i < quantity; ++i) {
                safeTransferFrom(from, to, startTokenId + i);
            }
        }
    }

    function _verifyConsecutiveOwnership(
        address owner,
        uint256 startTokenId,
        uint256 quantity
    ) internal view {
        unchecked {
            uint256 end = startTokenId + quantity;
            for (uint256 i = startTokenId; i < end; ++i) {
                require(_ownershipOf(i).addr == owner, "Not consecutive owner");
            }
        }
    }

    function _processMintFee(uint256 quantity) internal {
        uint256 totalFee;
        unchecked {
            totalFee = mintFee * quantity;
        }
        
        if (mintFeeToken == address(0)) {
            require(msg.value >= totalFee, "Insufficient payment");
            
            if (mintFeeRecipient != address(0) && totalFee > 0) {
                (bool success, ) = mintFeeRecipient.call{value: totalFee, gas: 30000}("");
                if (!success) {
                    (bool refundSuccess, ) = msg.sender.call{value: totalFee}("");
                    require(refundSuccess, "Fee handling failed");
                }
            }
            
            unchecked {
                uint256 excess = msg.value - totalFee;
                if (excess > 0) {
                    (bool refundSuccess, ) = msg.sender.call{value: excess}("");
                    require(refundSuccess, "Refund failed");
                }
            }
        } else {
            revert("ERC20 payment not implemented");
        }
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");
        
        string memory _tokenURI = _tokenURIs[tokenId];
        if (bytes(_tokenURI).length > 0) {
            return _tokenURI;
        }
        
        return super.tokenURI(tokenId);
    }

    function setTokenURI(uint256 tokenId, string calldata _tokenURI) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        _tokenURIs[tokenId] = _tokenURI;
    }

    function addEscrowWallet(address wallet) external onlyOwner {
        require(wallet != address(0), "Invalid address");
        isEscrowWallet[wallet] = true;
        emit EscrowWalletAdded(wallet);
    }

    function removeEscrowWallet(address wallet) external onlyOwner {
        isEscrowWallet[wallet] = false;
        emit EscrowWalletRemoved(wallet);
    }

    function setMintOpen(bool _mintOpen) external onlyOwner {
        mintOpen = _mintOpen;
        emit MintStatusChanged(_mintOpen);
    }

    function setPublicMinting(bool _isPublic) external onlyOwner {
        isPublicMinting = _isPublic;
        emit PublicMintingStatusChanged(_isPublic);
    }

    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
        emit MinterAdded(minter);
    }

    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }

    function setMintFee(uint256 _mintFee) external onlyOwner {
        mintFee = _mintFee;
        emit MintFeeChanged(_mintFee);
    }

    function setBaseURI(string calldata baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    function setContractURI(string calldata _contractURI) external onlyOwner {
        contractURI = _contractURI;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function canMint(address account) external view returns (bool) {
        if (isPublicMinting) return true;
        return minters[account] || owner() == account;
    }

    function getMintPrice(uint256 quantity) external view returns (uint256) {
        return mintFee * quantity;
    }

    function availableSupply() external view returns (uint256) {
        return maxSupply - totalSupply();
    }

    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721A) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

