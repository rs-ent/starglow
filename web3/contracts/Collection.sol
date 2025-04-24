// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

interface IERC721Permit {
    function permit(
        address owner,
        address spender,
        uint256 tokenId,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}

contract Collection is 
    ERC721A, 
    Ownable, 
    Pausable, 
    ReentrancyGuard, 
    EIP712 
{
    string private _baseTokenURI;
    string private _contractURI;
    uint256 public maxSupply;
    uint256 public mintPrice;
    
    uint256 private _flags;
    uint256 private constant MINTING_ENABLED_FLAG = 1;
    mapping(address => bool) private _isEscrowWallet;

    struct Lockup {
        uint256 lockedAt;
        uint256 unlockScheduledAt;
        uint256 unlockedAt;
        bool isLocked;
    }
    mapping(uint256 => Lockup) public lockups;

    event TokenMinted(uint256 indexed startTokenId, uint256 quantity, uint256 mintedAt);
    event TokenBurned(uint256 indexed tokenId, uint256 burnedAt);
    event BaseURIUpdated(string indexed newBaseURI);
    event ContractURIUpdated(string indexed newContractURI);
    event MintPriceUpdated(uint256 newMintPrice);

    event Transferred(address indexed from, address indexed to, uint256[] tokenIds);

    event EscrowWalletAdded(address indexed wallet);
    event EscrowWalletRemoved(address indexed wallet);

    event TokenLocked(uint256 indexed tokenId, uint256 lockedAt, uint256 unlockScheduledAt);
    event TokenUnlocked(uint256 indexed tokenId, uint256 lockedAt, uint256 unlockScheduledAt, uint256 unlockedAt);

    mapping(address => uint256) public nonces;
    bytes32 public constant PERMIT_TYPEHASH = keccak256(
        "Permit(address owner,address spender,address to,uint256 tokenId,uint256 nonce,uint256 deadline)"
    );

    constructor(
        string memory name,
        string memory symbol,
        address initialOwner,
        uint256 _maxSupply,
        uint256 initialMintPrice,
        string memory baseURI,
        string memory contractURI_
    ) ERC721A(name, symbol) Ownable(initialOwner) EIP712(name, "1") {
        maxSupply = _maxSupply;
        mintPrice = initialMintPrice;
        _baseTokenURI = baseURI;
        _contractURI = contractURI_;
        _setMintingEnabled(true);
        _isEscrowWallet[initialOwner] = true;
        emit EscrowWalletAdded(initialOwner);
    }
    
    function mintingEnabled() public view returns (bool) {
        return _flags & MINTING_ENABLED_FLAG != 0;
    }

    function _setMintingEnabled(bool enabled) internal {
        if (enabled) {
            _flags |= MINTING_ENABLED_FLAG;
        } else {
            _flags &= ~MINTING_ENABLED_FLAG;
        }
    }

    function isEscrowWallet(address wallet) public view returns (bool) {
        return _isEscrowWallet[wallet];
    }

    function addEscrowWallet(address wallet) external {
        require(msg.sender == owner() || _isEscrowWallet[msg.sender], "NOT_ALLOWED");
        require(!_isEscrowWallet[wallet], "ALREADY_ADDED");
        _isEscrowWallet[wallet] = true;
        emit EscrowWalletAdded(wallet);
    }

    function removeEscrowWallet(address wallet) external {
        require(msg.sender == owner() || _isEscrowWallet[msg.sender], "NOT_ALLOWED");
        require(_isEscrowWallet[wallet], "NOT_FOUND");
        _isEscrowWallet[wallet] = false;
        emit EscrowWalletRemoved(wallet);
    }
    
    function mint(uint256 quantity) external whenNotPaused nonReentrant {
        require(quantity > 0, "INVALID_QUANTITY");
        require(_isEscrowWallet[msg.sender] || msg.sender == owner(), "NOT_ALLOWED");
        require(mintingEnabled(), "MINT_NOT_ENABLED");
        require(_totalMinted() + quantity <= maxSupply, "MAX_EXCEEDED");

        uint256 startTokenId = _nextTokenId();
        _mint(msg.sender, quantity);

        emit TokenMinted(startTokenId, quantity, block.timestamp);
    }

    function burn(uint256[] memory tokenIds) external whenNotPaused nonReentrant {
        require(_isEscrowWallet[msg.sender] || msg.sender == owner(), "NOT_ALLOWED");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(_exists(tokenIds[i]), "TOKEN_DOES_NOT_EXIST");
            require(_isApprovedOrOwner(tokenIds[i], msg.sender), "NOT_APPROVED");

            _burn(tokenIds[i]);
            emit TokenBurned(tokenIds[i], block.timestamp);
        }
    }

    function isTokenLocked(uint256 tokenId) public view returns (bool) {
        return lockups[tokenId].isLocked;
    }

    function lockTokens(uint256[] memory tokenIds, uint256 unlockScheduledAt) external whenNotPaused nonReentrant {
        require(_isEscrowWallet[msg.sender] || msg.sender == owner() || ownerOf(tokenIds[0]) == msg.sender, "NOT_ALLOWED");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(_exists(tokenIds[i]), "TOKEN_NOT_EXIST");
            require(!lockups[tokenIds[i]].isLocked, "ALREADY_LOCKED");

            lockups[tokenIds[i]] = Lockup({
                lockedAt: block.timestamp,
                unlockScheduledAt: unlockScheduledAt,
                unlockedAt: 0,
                isLocked: true
            });

            emit TokenLocked(tokenIds[i], block.timestamp, unlockScheduledAt);
        }
    }

    function unlockTokens(uint256[] memory tokenIds, bool forceUnlock) external whenNotPaused nonReentrant {
        require(_isEscrowWallet[msg.sender] || msg.sender == owner() || ownerOf(tokenIds[0]) == msg.sender, "NOT_ALLOWED");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(lockups[tokenIds[i]].isLocked, "NOT_LOCKED");
            require(forceUnlock || block.timestamp >= lockups[tokenIds[i]].unlockScheduledAt, "SCHEDULED_LOCKUP");

            lockups[tokenIds[i]].unlockedAt = block.timestamp;
            lockups[tokenIds[i]].isLocked = false;

            emit TokenUnlocked(tokenIds[i], lockups[tokenIds[i]].lockedAt, lockups[tokenIds[i]].unlockScheduledAt, block.timestamp);
        }
    }

    function _beforeTokenTransfers(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override {
        require(!isTokenLocked(firstTokenId), "TOKEN_LOCKED");
        super._beforeTokenTransfers(from, to, firstTokenId, batchSize);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string memory baseURI_) external {
        require(msg.sender == owner() || _isEscrowWallet[msg.sender], "NOT_ALLOWED");
        _baseTokenURI = baseURI_;
        emit BaseURIUpdated(baseURI_);
    }

    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    function setContractURI(string memory contractURI_) external {
        require(msg.sender == owner() || _isEscrowWallet[msg.sender], "NOT_ALLOWED");
        _contractURI = contractURI_;
        emit ContractURIUpdated(contractURI_);
    }

    function setMintPrice(uint256 newMintPrice) external {
        require(msg.sender == owner() || _isEscrowWallet[msg.sender], "NOT_ALLOWED");
        mintPrice = newMintPrice;
        emit MintPriceUpdated(newMintPrice);
    }

    function pause() external {
        require(msg.sender == owner() || _isEscrowWallet[msg.sender], "NOT_ALLOWED");
        _pause();
    }

    function unpause() external {
        require(msg.sender == owner() || _isEscrowWallet[msg.sender], "NOT_ALLOWED");
        _unpause();
    }

    function _isApprovedOrOwner(uint256 tokenId, address caller)
        internal
        view
        returns (bool)
    {
        address owner = ownerOf(tokenId);
        return (owner == caller || isApprovedForAll(owner, caller) || getApproved(tokenId) == caller);
    }

    function _exists(uint256 tokenId) internal view override returns (bool) {
        return _startTokenId() <= tokenId && tokenId < _nextTokenId();
    }

    function escrowTransfer(
        address owner,
        address spender,
        address to,
        uint256[] calldata tokenIds,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external whenNotPaused nonReentrant {
        require(_isEscrowWallet[spender] || msg.sender == spender, "NOT_ALLOWED");
        require(block.timestamp < deadline, "EXPIRED");
        require(tokenIds.length > 0, "EMPTY_TX");

        uint256 currentNonce = nonces[owner]++;

        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Transfer(address owner,address spender,address to,uint256[] tokenIds,uint256 nonce,uint256 deadline)"),
                owner,
                spender,
                to,
                keccak256(abi.encodePacked(tokenIds)),
                currentNonce,
                deadline
            )
        );

        require(ECDSA.recover(_hashTypedDataV4(structHash), v, r, s) == owner, "INVALID_SIG");

        uint256 length = tokenIds.length;
        uint256[] memory batchStarts = new uint256[](length);
        uint256[] memory batchSizes = new uint256[](length);
        uint256 batchCount;

        {
            uint256 batchStart = tokenIds[0];
            uint256 batchSize = 1;
            uint256 lastTokenId = tokenIds[0];
            
            require(_exists(lastTokenId), "TOKEN_NOT_EXIST");
            require(ownerOf(lastTokenId) == owner, "NOT_OWNER");
            require(!isTokenLocked(lastTokenId), "TOKEN_LOCKED");

            for (uint256 i = 1; i < length; i++) {
                uint256 currTokenId = tokenIds[i];
                require(_exists(currTokenId), "TOKEN_NOT_EXIST");
                require(ownerOf(currTokenId) == owner, "NOT_OWNER");
                require(!isTokenLocked(currTokenId), "TOKEN_LOCKED");

                if (currTokenId == lastTokenId + 1) {
                    batchSize++;
                } else {
                    batchStarts[batchCount] = batchStart;
                    batchSizes[batchCount] = batchSize;
                    batchCount++;
                    batchStart = currTokenId;
                    batchSize = 1;
                }
                lastTokenId = currTokenId;
            }
            
            // 마지막 배치 처리
            batchStarts[batchCount] = batchStart;
            batchSizes[batchCount] = batchSize;
            batchCount++;
        }

        for (uint256 i = 0; i < batchCount; i++) {
            _beforeTokenTransfers(owner, to, batchStarts[i], batchSizes[i]);
            _transferBatch(owner, to, batchStarts[i], batchSizes[i]);
        }

        emit Transferred(owner, to, tokenIds);
    }

    function _transferBatch(
        address from,
        address to,
        uint256 startTokenId,
        uint256 quantity
    ) internal virtual {
        // 배치 전체에 대해 한 번만 호출
        _beforeTokenTransfers(from, to, startTokenId, quantity);
        
        unchecked {
            for(uint256 i = 0; i < quantity; i++) {
                safeTransferFrom(from, to, startTokenId + i);
            }
        }
    }
}