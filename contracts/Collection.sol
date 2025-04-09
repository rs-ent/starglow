// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

/**
 * @title Collection
 * @dev 배치 민팅 기능을 구현한 NFT 컬렉션 컨트랙트
 */
contract Collection is ERC721A, Ownable, Pausable, ReentrancyGuard, AccessControl, ERC2981 {
    using Strings for uint256;

    // 역할 정의
    bytes32 public constant ESCROW_ROLE = keccak256("ESCROW_ROLE");
    
    // EIP-712 타입 해시
    bytes32 private constant _TYPE_HASH = keccak256("Transfer(address from,address to,uint256 tokenId,address verifyingContract,uint256 nonce,uint256 chainId)");
    
    // EIP-712 도메인 분리자
    bytes32 private _DOMAIN_SEPARATOR;
    
    // 평균 블록 시간 (초 단위)
    uint256 public averageBlockTime;
    
    // 상태 변수
    string private _baseTokenURI;
    string private _contractURI;
    bool public mintingEnabled;
    uint256 public maxSupply;
    uint256 public mintPrice;
    mapping(address => uint256) private _nonces;

    // 이벤트 정의
    event BatchMinted(address indexed to, uint256 startTokenId, uint256 quantity, uint256 gasPrice);
    event TokenBurned(address indexed owner, uint256 tokenId);
    event RoyaltyInfoUpdated(address indexed receiver, uint96 basisPoints);
    event BaseURIUpdated(string baseURI);
    event ContractURIUpdated(string contractURI);
    event MintingStatusUpdated(bool enabled);
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event GlobalLockupPeriodUpdated(uint256 period);
    event TokenLockupUpdated(uint256 indexed tokenId, uint256 unlockTime);
    event EscrowRoleGranted(address indexed account);
    event EscrowRoleRevoked(address indexed account);
    event EscrowTransferred(address indexed from, address indexed to, uint256 tokenId, uint256 gasPrice);

    // 락업 관련 변수
    uint256 public globalLockupPeriod; // 전체 컬렉션 락업 기간 (초 단위)
    mapping(uint256 => uint256) public tokenLockupExpiry; // 토큰별 락업 만료 시간
    
    // 배치 민팅 이벤트
    event BatchMintGasInfo(address indexed to, uint256 quantity, uint256 gasPrice, uint256 estimatedTime);
    event AverageBlockTimeUpdated(uint256 oldBlockTime, uint256 newBlockTime);
    event EscrowBatchMinted(address indexed escrow, address indexed to, uint256 fromTokenId, uint256 quantity, uint256 gasPrice);

    // 생성자 - 컬렉션 생성
    constructor(
        string memory name,
        string memory symbol,
        address initialOwner,
        uint256 _maxSupply,
        uint256 initialMintPrice,
        string memory baseURI,
        string memory contractURI_
    ) ERC721A(name, symbol) Ownable(initialOwner) {
        maxSupply = _maxSupply;
        mintPrice = initialMintPrice;
        _baseTokenURI = baseURI;
        _contractURI = contractURI_;
        mintingEnabled = false;
        globalLockupPeriod = 0;

        // 초기 소유자에게 ESCROW 역할 부여 (모든 관리 권한)
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(ESCROW_ROLE, initialOwner);
        
        // EIP-712 도메인 분리자 생성
        _DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes(name)),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
        
        // 기본 로열티 설정 (0%)
        _setDefaultRoyalty(initialOwner, 0);
    }
    
    /**
     * @dev ESCROW 역할 부여
     * @param account: ESCROW 역할을 부여할 계정
     */
    function grantEscrowRole(address account) external onlyRole(ESCROW_ROLE) {
        grantRole(ESCROW_ROLE, account);
        emit EscrowRoleGranted(account);
    }
    
    /**
     * @dev ESCROW 역할 박탈
     * @param account: ESCROW 역할을 박탈할 계정
     */
    function revokeEscrowRole(address account) external onlyRole(ESCROW_ROLE) {
        revokeRole(ESCROW_ROLE, account);
        emit EscrowRoleRevoked(account);
    }
    
    /**
     * @dev 전체 컬렉션 락업 기간 설정
     * @param period: 락업 기간 (초 단위)
     */
    function setGlobalLockupPeriod(uint256 period) external onlyRole(ESCROW_ROLE) {
        globalLockupPeriod = period;
        emit GlobalLockupPeriodUpdated(period);
    }
    
    /**
     * @dev 특정 토큰 락업 설정
     * @param tokenId: 토큰 ID
     * @param unlockTime: 락업 만료 시간 (타임스탬프)
     */
    function setTokenLockup(uint256 tokenId, uint256 unlockTime) external onlyRole(ESCROW_ROLE) {
        require(_exists(tokenId), "Token does not exist");
        tokenLockupExpiry[tokenId] = unlockTime;
        emit TokenLockupUpdated(tokenId, unlockTime);
    }
    
    /**
     * @dev 여러 토큰 락업 설정
     * @param tokenIds: 토큰 ID 배열
     * @param unlockTime: 락업 만료 시간 (타임스탬프)
     */
    function setTokenLockupBatch(uint256[] calldata tokenIds, uint256 unlockTime) external onlyRole(ESCROW_ROLE) {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(_exists(tokenIds[i]), "Token does not exist");
            tokenLockupExpiry[tokenIds[i]] = unlockTime;
            emit TokenLockupUpdated(tokenIds[i], unlockTime);
        }
    }
    
    /**
     * @dev 토큰 락업 상태 확인
     * @param tokenId: 토큰 ID
     * @return 락업 상태 (true: 락업, false: 락업 해제)
     */
    function isTokenLocked(uint256 tokenId) public view returns (bool) {
        if (!_exists(tokenId)) {
            return false;
        }

        uint256 tokenLockup = tokenLockupExpiry[tokenId];
        uint256 lockupTime = tokenLockup > 0 ? tokenLockup : block.timestamp + globalLockupPeriod;
        
        return block.timestamp < lockupTime;
    }
    
    /**
     * @dev 사용자의 현재 Nonce 조회
     * @param owner: 사용자 주소
     * @return 사용자의 현재 Nonce
     */
    function nonce(address owner) public view returns (uint256) {
        return _nonces[owner];
    }
    
    /**
     * @dev 도메인 분리자 조회
     * @return 도메인 분리자
     */
    function domainSeparator() public view returns (bytes32) {
        return _DOMAIN_SEPARATOR;
    }
    
    /**
     * @dev 서명 검증
     * @param signer: 서명자 주소
     * @param messageHash: 메시지 해시
     * @param signature: 서명 데이터
     * @return 유효한 서명 여부
     */
    function verifySignature(
        address signer,
        bytes32 messageHash,
        bytes memory signature
    ) internal pure returns (bool) {
        bytes32 ethSignedMessageHash = keccak256(
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
    
    /**
     * @dev 서명 분리
     * @param signature: 서명 데이터
     */
    function splitSignature(bytes memory signature)
        internal pure returns (bytes32 r, bytes32 s, uint8 v) 
    {
        require(signature.length == 65, "Invalid signature length");

        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        if (v < 27) {
            v += 27;
        }

        require(v == 27 || v == 28, "Invalid signature 'v' value");

        return (r, s, v);
    }
    
    /**
     * @dev 메시지 해시 생성 (프론트엔드 서명에 활용)
     * @param from: 보내는 주소
     * @param to: 받는 주소
     * @param tokenId: 토큰 ID
     * @return 메시지 해시
     */
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

        // EIP-712 도메인 분리자와 함께 해시 결합
        return keccak256(
            abi.encodePacked(
                "\x19\x01",
                _DOMAIN_SEPARATOR,
                structHash
            )
        );
    }
    
    /**
     * @dev 배치 민팅 NFTs
     * @param to: 민팅할 주소
     * @param quantity: 민팅할 토큰 수
     * @param gasFee: 트랜잭션 가스비 (gwei 단위)
     */
    function batchMint(address to, uint256 quantity, uint256 gasFee)
        external
        nonReentrant
        whenNotPaused
    {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()) || hasRole(ESCROW_ROLE, _msgSender()), 
                "Caller is not an ADMIN or ESCROW");
        require(mintingEnabled, "Minting is not enabled");
        require(_totalMinted() + quantity <= maxSupply, "Max supply reached");
        require(to != address(0), "Invalid address");
        require(quantity > 0, "Invalid quantity");
        require(gasFee > 0, "Gas fee must be greater than 0");

        // gasFee는 gwei 단위로 입력 받음 (1 gwei = 10^9 wei)
        uint256 gasPrice = gasFee * 1e9;
        
        uint256 startTokenId = _nextTokenId();
        _mint(to, quantity);
        
        emit BatchMinted(to, startTokenId, quantity, gasPrice);
    }

    /**
     * @dev 토큰 URI 조회 (컴퓨팅)
     * @return 토큰 URI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev 토큰 URI 조회 (사용자)
     * @param tokenId: 토큰 ID
     * @return 토큰 URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");

        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString())) : "";
    }

    /**
     * @dev 현재 총 공급량 조회
     * @return 총 토큰 수
     */
    function totalSupply() public view override returns (uint256) {
        return _totalMinted();
    }
    
    /**
     * @dev 토큰 전송 전 실행되는 훅
     * @param from: 보내는 주소
     * @param to: 받는 주소
     * @param startTokenId: 시작 토큰 ID
     * @param quantity: 토큰 수
     */
    function _beforeTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 quantity
    ) internal override whenNotPaused {
        super._beforeTokenTransfers(from, to, startTokenId, quantity);
        
        // 민팅과 소각은 락업 체크에서 제외
        if (from != address(0) && to != address(0)) {
            // 배치 전송에서는 모든 토큰을 체크
            for (uint256 i = 0; i < quantity; i++) {
                uint256 tokenId = startTokenId + i;
                // ESCROW_ROLE이 있거나 락업되지 않은 경우에만 전송 허용
                if (!hasRole(ESCROW_ROLE, _msgSender())) {
                    require(!isTokenLocked(tokenId), "Token is locked");
                    require(_isApprovedOrOwner(tokenId, _msgSender()), "Transfer caller is not owner nor approved");
                }
            }
        }
    }
    
    /**
     * @dev 인터페이스 지원 여부 확인 (ERC165)
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721A, AccessControl, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function burn(uint256 tokenId) external {
        require(_isApprovedOrOwner(tokenId, _msgSender()), "Caller is not owner nor approved");
        _burn(tokenId);
        emit TokenBurned(_msgSender(), tokenId);
    }

    function setDefaultRoyalty(address receiver, uint96 basisPoints) external onlyRole(ESCROW_ROLE) {
        require(basisPoints <= 1000, "Royalty cannot exceed 10%");
        _setDefaultRoyalty(receiver, basisPoints);
        emit RoyaltyInfoUpdated(receiver, basisPoints);
    }

    function setTokenRoyalty(uint256 tokenId, address receiver, uint96 basisPoints) 
        external 
        onlyRole(ESCROW_ROLE) 
    {
        require(basisPoints <= 1000, "Royalty cannot exceed 10%");
        require(_exists(tokenId), "Token does not exist");
        _setTokenRoyalty(tokenId, receiver, basisPoints);
        emit RoyaltyInfoUpdated(receiver, basisPoints);
    }

    function setBaseURI(string memory baseURI_) external onlyRole(ESCROW_ROLE) {
        _baseTokenURI = baseURI_;
        emit BaseURIUpdated(baseURI_);
    }

    function setContractURI(string memory contractURI_) external onlyRole(ESCROW_ROLE) {
        _contractURI = contractURI_;
        emit ContractURIUpdated(contractURI_);
    }

    function setMintingEnabled(bool enabled) external onlyRole(ESCROW_ROLE) {
        mintingEnabled = enabled;
        emit MintingStatusUpdated(enabled);
    }

    function pause() external onlyRole(ESCROW_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ESCROW_ROLE) {
        _unpause();
    }

    /**
     * @dev 평균 블록 시간 설정
     * @param blockTime: 블록 시간 (초 단위)
     */
    function setAverageBlockTime(uint256 blockTime) external onlyRole(ESCROW_ROLE) {
        require(blockTime > 0, "Block time must be greater than 0");
        uint256 oldBlockTime = averageBlockTime;
        averageBlockTime = blockTime;
        emit AverageBlockTimeUpdated(oldBlockTime, blockTime);
    }

    /**
     * @dev 에스크로 전송 (서명 기반)
     * @notice 가스비를 ESCROW_ROLE이 대신 지불하는 전송 방식
     * @param from: 토큰 소유자 주소
     * @param to: 받는 주소
     * @param tokenId: 전송할 토큰 ID
     * @param signature: 소유자의 서명
     * @param gasFee: 트랜잭션 가스비 (gwei 단위)
     */
    function escrowTransfer(
        address from,
        address to,
        uint256 tokenId,
        bytes memory signature,
        uint256 gasFee
    ) external whenNotPaused onlyRole(ESCROW_ROLE) {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == from, "From address is not the owner");
        require(to != address(0), "Cannot transfer to zero address");
        require(!isTokenLocked(tokenId), "Token is locked");
        require(gasFee > 0, "Gas fee must be greater than 0");

        // gasFee는 gwei 단위로 입력 받음 (1 gwei = 10^9 wei)
        uint256 gasPrice = gasFee * 1e9;

        // 메시지 해시 생성
        uint256 currentNonce = _nonces[from];
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

        // 서명 검증
        require(verifySignature(from, messageHash, signature), "Invalid signature");

        // Nonce 증가
        _nonces[from]++;

        // ESCROW_ROLE을 가진 계정에게 특정 토큰 전송 권한 부여
        _approve(_msgSender(), tokenId, false);
        
        // 토큰 전송 (가스비는 함수 호출자인 ESCROW_ROLE이 지불)
        transferFrom(from, to, tokenId);
        
        // 가스비 관련 이벤트 발생
        emit EscrowTransferred(from, to, tokenId, gasPrice);
    }

    /**
     * @dev EIP-712 도메인 분리자 조회
     * @return 도메인 분리자
     */
    function getDomainSeparator() public view returns (bytes32) {
        return _DOMAIN_SEPARATOR;
    }

    /**
     * @dev 토큰 소유자 또는 승인된 주소인지 확인
     * @param tokenId: 토큰 ID
     * @param spender: 확인할 주소
     * @return 승인 여부
     */
    function _isApprovedOrOwner(uint256 tokenId, address spender) internal view returns (bool) {
        address owner = ownerOf(tokenId);
        return (spender == owner || isApprovedForAll(owner, spender) || getApproved(tokenId) == spender);
    }

    /**
     * @dev 특정 토큰 락업 해제
     * @param tokenId: 토큰 ID
     */
    function removeTokenLockup(uint256 tokenId) external onlyRole(ESCROW_ROLE) {
        require(_exists(tokenId), "Token does not exist");
        tokenLockupExpiry[tokenId] = 0;
        emit TokenLockupUpdated(tokenId, 0);
    }
    
    /**
     * @dev 여러 토큰 락업 해제
     * @param tokenIds: 토큰 ID 배열
     */
    function removeTokenLockupBatch(uint256[] calldata tokenIds) external onlyRole(ESCROW_ROLE) {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(_exists(tokenIds[i]), "Token does not exist");
            tokenLockupExpiry[tokenIds[i]] = 0;
            emit TokenLockupUpdated(tokenIds[i], 0);
        }
    }
}
