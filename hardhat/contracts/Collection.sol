// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "erc721a-upgradeable/contracts/ERC721AUpgradeable.sol";

/*
* @title StarglowCollection
*/
contract StarglowCollection is
    Initializable,
    ERC721AUpgradeable,
    ERC2981Upgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    ContextUpgradeable
{
    using Address for address;
    using Strings for uint256;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ESCROW_ROLE = keccak256("ESCROW_ROLE");

    uint256 public maxSupply;
    uint256 public mintPrice;
    bool public mintingEnabled;

    string private _baseTokenURI;
    string private _contractURI;

    uint256 public globalLockupPeriod;
    mapping(uint256 => uint256) public tokenLockupExpiry;
    mapping(address => uint256) private _nonces;

    uint256 public burnedTokens;

    // EIP-712 도메인 분리자
    bytes32 private _DOMAIN_SEPARATOR;
    // EIP-712 타입 해시
    bytes32 private constant _TYPE_HASH = keccak256("EIP712Transfer(address from,address to,uint256 tokenId,address verifyingContract,uint256 nonce,uint256 chainId)");

    // 이벤트 정의 - 이름을 통일하여 수정
    event BatchMinted(address indexed to, uint256 fromTokenId, uint256 quantity);
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event MintingStatusUpdated(bool enabled);
    event BaseURIUpdated(string baseURI);
    event ContractURIUpdated(string contractURI);
    event RoyaltyInfoUpdated(address receiver, uint96 basisPoints);
    event GlobalLockupPeriodUpdated(uint256 period);
    event TokenLockupUpdated(uint256 indexed tokenId, uint256 unlockTime);
    event TokensBurned(address indexed burner, uint256[] tokenIds);
    event WithdrawFunds(address indexed to, uint256 amount);
    event MaxSupplyUpdated(uint256 oldSupply, uint256 newSupply);
    event EscrowTransfer(address indexed from, address indexed to, uint256 tokenId, uint256 nonce, address escrow);

    /*
    * @notice 컬렉션 초기화 함수
    */
    function initialize(
        string memory name,
        string memory symbol,
        uint256 _maxSupply,
        uint256 initialMintPrice,
        string memory baseURI,
        string memory contractURI_,
        address royaltyReceiver,
        uint96 royaltyBasisPoints,
        address admin
    ) external initializer {
        __ERC721A_init(name, symbol);
        __ERC2981_init();
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __Context_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(ESCROW_ROLE, admin);

        maxSupply = _maxSupply;
        mintPrice = initialMintPrice;
        mintingEnabled = false;

        _baseTokenURI = baseURI;
        _contractURI = contractURI_;

        require(royaltyBasisPoints <= 1000, "Royalty cannot be more than 10%");
        _setDefaultRoyalty(royaltyReceiver, royaltyBasisPoints);

        // EIP-712 도메인 분리자 설정
        _DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes(name)),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    function batchMint(address to, uint256 quantity)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        require(mintingEnabled, "Minting is not enabled");
        require(_totalMinted() + quantity <= maxSupply, "Minting would exceed max supply");
        require(to != address(0), "Cannot mint to zero address");

        if (!hasRole(MINTER_ROLE, _msgSender())) {
            require(msg.value >= mintPrice * quantity, "Insufficient funds sent");
        }

        uint256 startTokenId = _nextTokenId();
        _mint(to, quantity);

        emit BatchMinted(to, startTokenId, quantity);
    }

    function mint() 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        require(mintingEnabled, "Minting is currently disabled");
        require(_totalMinted() + 1 <= maxSupply, "Would exceed max supply");
        require(msg.value >= mintPrice, "Insufficient payment");
        
        _mint(_msgSender(), 1);
        
        emit BatchMinted(_msgSender(), _nextTokenId() - 1, 1);
    }

    function transferWithEscrow(
        address from, 
        address to, 
        uint256 tokenId, 
        bytes memory signature
    ) external onlyRole(ESCROW_ROLE) whenNotPaused nonReentrant {
        require(_isOwnerOf(tokenId, from), "Sender is not owner");
        require(to != address(0), "Cannot transfer to zero address");

        uint256 currentNonce = _nonces[from];

        // EIP-712 메시지 해시 생성
        bytes32 structHash = keccak256(
            abi.encode(
                _TYPE_HASH,
                from,
                to,
                tokenId,
                address(this),
                currentNonce,
                block.chainid
            )
        );

        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "\x19\x01",
                _DOMAIN_SEPARATOR,
                structHash
            )
        );

        require(verifySignature(from, messageHash, signature), "Invalid signature");
        require(!isTokenLocked(tokenId), "Token is locked");

        _nonces[from] = currentNonce + 1;

        _transfer(from, to, tokenId);

        emit EscrowTransfer(from, to, tokenId, currentNonce, _msgSender());
    }

    function nonceOf(address owner) external view returns (uint256) {
        return _nonces[owner];
    }

    function verifySignature(
        address signer,
        bytes32 messageHash,
        bytes memory signature
    ) internal pure returns (bool) {
        bytes32 ethSignedMessageHash = 
            keccak256(
                abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    messageHash
                )
            );
        
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);
        
        // s 값 검사 (EIP-2 규정)
        require(uint256(s) <= 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0, "Invalid signature 's' value");
    
        address recoveredSigner = ecrecover(ethSignedMessageHash, v, r, s);
        require(recoveredSigner != address(0), "Invalid signature");

        return recoveredSigner == signer;
    }

    function splitSignature(bytes memory signature)
        internal pure returns (bytes32 r, bytes32 s, uint8 v) 
    {
        require(signature.length == 65, "Invalid signature length");

        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        // v 값 검사
        if (v < 27) v += 27;
        require(v == 27 || v == 28, "Invalid signature 'v' value");

        return (r, s, v);
    }

    function getMessageHash(
        address from,
        address to,
        uint256 tokenId
    ) external view returns (bytes32) {
        uint256 currentNonce = _nonces[from];

        // EIP-712 메시지 해시 생성
        bytes32 structHash = keccak256(
            abi.encode(
                _TYPE_HASH,
                from,
                to,
                tokenId,
                address(this),
                currentNonce,
                block.chainid
            )
        );

        return keccak256(
            abi.encodePacked(
                "\x19\x01",
                _DOMAIN_SEPARATOR,
                structHash
            )
        );
    }

    function getDomainSeparator() public view returns (bytes32) {
        return _DOMAIN_SEPARATOR;
    }

    function getEIP712Domain() external view returns (
        bytes32 domainSeparator,
        string memory name,
        string memory version,
        uint256 chainId,
        address verifyingContract
    ) {
        string memory _name = name();
        string memory _version = "1";
        uint256 _chainId = block.chainid;

        domainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes(_name)),
                keccak256(bytes(_version)),
                _chainId,
                address(this)
            )
        );
        
        return (domainSeparator, _name, _version, _chainId, address(this));
    }

    function burn(uint256 tokenId)
        external
        nonReentrant
    {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "Not owner or approved");
        _burn(tokenId);
        burnedTokens++;

        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = tokenId;
        emit TokensBurned(_msgSender(), tokenIds);
    }

    function burnBatch(uint256[] calldata tokenIds)
        external
        nonReentrant
    {
        require(tokenIds.length > 0, "No tokens to burn");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(_isApprovedOrOwner(_msgSender(), tokenIds[i]), "Not owner or approved");
            _burn(tokenIds[i]);
        }

        burnedTokens += tokenIds.length;
        emit TokensBurned(_msgSender(), tokenIds);
    }

    function setGlobalLockupPeriod(uint256 period)
        external
        onlyRole(ADMIN_ROLE)
    {
        globalLockupPeriod = period;
        emit GlobalLockupPeriodUpdated(period);
    }

    function setTokenLockup(uint256 tokenId, uint256 unlockTime) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(_exists(tokenId), "Token does not exist");
        tokenLockupExpiry[tokenId] = unlockTime;
        emit TokenLockupUpdated(tokenId, unlockTime);
    }

    function setTokenLockupBatch(uint256[] calldata tokenIds, uint256 unlockTime) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(_exists(tokenIds[i]), "Token does not exist");
            tokenLockupExpiry[tokenIds[i]] = unlockTime;
            emit TokenLockupUpdated(tokenIds[i], unlockTime);
        }
    }

    function isTokenLocked(uint256 tokenId) public view returns (bool) {
        if (!_exists(tokenId)) return false;
        
        uint256 tokenLockup = tokenLockupExpiry[tokenId];
        uint256 lockupTime = tokenLockup > 0 ? tokenLockup : block.timestamp + globalLockupPeriod;
        
        return block.timestamp < lockupTime;
    }

    function updateMaxSupply(uint256 newMaxSupply) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(newMaxSupply > maxSupply, "Can only increase max supply");
        
        emit MaxSupplyUpdated(maxSupply, newMaxSupply);
        maxSupply = newMaxSupply;
    }

    function setMintPrice(uint256 newPrice) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        emit MintPriceUpdated(mintPrice, newPrice);
        mintPrice = newPrice;
    }

    function setMintingEnabled(bool enabled) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        mintingEnabled = enabled;
        emit MintingStatusUpdated(enabled);
    }

    function setBaseURI(string memory baseURI_) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        _baseTokenURI = baseURI_;
        emit BaseURIUpdated(baseURI_);
    }

     function setContractURI(string memory contractURI_) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        _contractURI = contractURI_;
        emit ContractURIUpdated(contractURI_);
    }

    function setDefaultRoyalty(address receiver, uint96 basisPoints) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(basisPoints <= 1000, "Royalty cannot exceed 10%");
        _setDefaultRoyalty(receiver, basisPoints);
        emit RoyaltyInfoUpdated(receiver, basisPoints);
    }

    function setTokenRoyalty(uint256 tokenId, address receiver, uint96 basisPoints) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(basisPoints <= 1000, "Royalty cannot exceed 10%");
        require(_exists(tokenId), "Token does not exist");
        _setTokenRoyalty(tokenId, receiver, basisPoints);
        emit RoyaltyInfoUpdated(receiver, basisPoints);
    }

    function pause() 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        _pause();
    }

    function unpause() 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        _unpause();
    }

    function withdraw(address payable to) 
        external 
        onlyRole(ADMIN_ROLE) 
        nonReentrant 
    {
        require(to != address(0), "Cannot withdraw to zero address");
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = to.call{value: balance}("");
        require(success, "Withdrawal failed");
        emit WithdrawFunds(to, balance);
    }

    function totalSupply() public view override returns (uint256) {
        return _totalMinted() - burnedTokens;
    }

    function totalMinted() public view returns (uint256) {
        return _totalMinted();
    }

    function remainingSupply() public view returns (uint256) {
        return maxSupply - _totalMinted();
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }


    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");
        
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString())) : "";
    }

    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function _beforeTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 quantity
    ) internal override whenNotPaused {
        super._beforeTokenTransfers(from, to, startTokenId, quantity);
        
        // Skip lockup check for minting (from == 0) and burning (to == 0)
        if (from != address(0) && to != address(0)) {
            for (uint256 i = 0; i < quantity; i++) {
                uint256 tokenId = startTokenId + i;
                uint256 tokenLockup = tokenLockupExpiry[tokenId];
                uint256 lockupTime = tokenLockup > 0 ? tokenLockup : globalLockupPeriod + block.timestamp;
                
                require(block.timestamp >= lockupTime, "Token is locked");
            }
        }
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721AUpgradeable, ERC2981Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function owner() public view returns (address) {
        return getRoleMember(DEFAULT_ADMIN_ROLE, 0);
    }
}

