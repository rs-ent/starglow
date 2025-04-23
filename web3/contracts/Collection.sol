// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "erc721a-upgradeable/contracts/ERC721AUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

contract Collection is ERC721AUpgradeable, OwnableUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable {
    string private _baseTokenURI;
    string private _contractURI;
    uint256 public maxSupply;
    uint256 public mintPrice;
    bool public mintingEnabled;

    struct Lockup {
        uint256 lockedAt;
        uint256 unlockScheduledAt;
        uint256 unlockedAt;
        bool isLocked;
    }
    mapping(uint256 => Lockup) public lockups;

    event TokenMinted(uint256 indexed tokenId);
    event TokenBurned(uint256 indexed tokenId);
    event BaseURIUpdated(string indexed newBaseURI);
    event ContractURIUpdated(string indexed newContractURI);
    event MintingEnabled(bool enabled);
    event MintPriceUpdated(uint256 newMintPrice);
    event BatchMinted(address indexed minter, uint256 quantity, uint256 gasPrice);
    event TokenLocked(uint256 indexed tokenId, uint256 lockedAt, uint256 unlockScheduledAt);
    event TokenUnlocked(uint256 indexed tokenId, uint256 lockedAt, uint256 unlockScheduledAt, uint256 unlockedAt);

    function initialize(
        string memory name,
        string memory symbol,
        address initialOwner,
        uint256 _maxSupply,
        uint256 initialMintPrice,
        string memory baseURI,
        string memory contractURI_
    ) public initializer {
        __ERC721A_init(name, symbol);
        __Ownable_init(initialOwner);
        __Pausable_init();
        __ReentrancyGuard_init();

        _transferOwnership(initialOwner);
        maxSupply = _maxSupply;
        mintPrice = initialMintPrice;
        _baseTokenURI = baseURI;
        _contractURI = contractURI_;
        mintingEnabled = true;
    }

    function mint(uint256 quantity, uint256 gasFee) external onlyOwner whenNotPaused nonReentrant {
        require(mintingEnabled, "MINT_NOT_ENABLED");
        require(_totalMinted() + quantity <= maxSupply, "MAX_EXCEEDED");
        require(quantity > 0, "INVALID_QUANTITY");
        require(gasFee >= 0, "INVALID_GAS_FEE");

        uint256 gasPrice = gasFee * 1e9;
        uint256 startTokenId = _nextTokenId();
        _mint(msg.sender, quantity);

        for (uint256 i = 0; i < quantity; i++) {
            emit TokenMinted(startTokenId + i);
        }

        emit BatchMinted(msg.sender, quantity, gasPrice);
    }

    function burn(uint256[] memory tokenIds) external onlyOwner whenNotPaused nonReentrant {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(_exists(tokenIds[i]), "TOKEN_DOES_NOT_EXIST");
            require(_isApprovedOrOwner(tokenIds[i], msg.sender), "NOT_APPROVED");

            _burn(tokenIds[i]);
            emit TokenBurned(tokenIds[i]);
        }
    }

    function isTokenLocked(uint256 tokenId) public view returns (bool) {
        return lockups[tokenId].isLocked;
    }

    function lockTokens(uint256[] memory tokenIds, uint256 unlockScheduledAt) external onlyOwner whenNotPaused nonReentrant {
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

    function unlockTokens(uint256[] memory tokenIds, bool forceUnlock) external onlyOwner whenNotPaused nonReentrant {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(lockups[tokenIds[i]].isLocked, "NOT_LOCKED");
            require(forceUnlock || block.timestamp >= lockups[tokenIds[i]].unlockScheduledAt, "SCHEDULED_LOCKUP");

            lockups[tokenIds[i]].unlockedAt = block.timestamp;
            lockups[tokenIds[i]].isLocked = false;

            emit TokenUnlocked(tokenIds[i], lockups[tokenIds[i]].lockedAt, lockups[tokenIds[i]].unlockScheduledAt, block.timestamp);
        }
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        require(!isTokenLocked(tokenId), "TOKEN_LOCKED");
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string memory baseURI_) external onlyOwner {
        _baseTokenURI = baseURI_;
        emit BaseURIUpdated(baseURI_);
    }

    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    function setContractURI(string memory contractURI_) external onlyOwner {
        _contractURI = contractURI_;
        emit ContractURIUpdated(contractURI_);
    }

    function setMintingEnabled(bool enabled) external onlyOwner {
        mintingEnabled = enabled;
        emit MintingEnabled(enabled);
    }

    function setMintPrice(uint256 newMintPrice) external onlyOwner {
        mintPrice = newMintPrice;
        emit MintPriceUpdated(newMintPrice);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
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
}