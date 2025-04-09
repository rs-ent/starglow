// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./Collection.sol";

/**
 * @title Factory
 * @dev Collection 컨트랙트를 생성하고 관리하는 Factory 컨트랙트
 */
contract Factory is Initializable, AccessControlUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable, OwnableUpgradeable {
    // 역할, 상태, 매핑
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    address[] public collections;
    mapping(string => address) public collectionsByName;
    mapping(address => bool) public isValidCollection;
    mapping(address => uint256) public collectionCreationTime;
    mapping(address => uint8) public collectionStatus; // 0:활성, 1:중지
    
    // 이벤트
    event CollectionCreated(address indexed collection, string name, string symbol);
    event FactoryPaused(bool paused);
    event CollectionPaused(address indexed collection, bool paused);
    
    function initialize() public initializer {
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __Ownable_init(msg.sender);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    // 컬렉션 생성
    function createCollection(
        string memory name,
        string memory symbol,
        uint256 maxSupply,
        uint256 initialMintPrice,
        string memory baseURI,
        string memory contractURI_
    ) external nonReentrant onlyRole(ADMIN_ROLE) returns (address) {
        require(!paused(), "Paused");
        require(collectionsByName[name] == address(0), "Exists");
        
        Collection newCollection = new Collection(
            name, symbol, msg.sender, maxSupply,
            initialMintPrice, baseURI, contractURI_
        );
        
        address addr = address(newCollection);
        
        collections.push(addr);
        collectionsByName[name] = addr;
        isValidCollection[addr] = true;
        collectionCreationTime[addr] = block.timestamp;
        collectionStatus[addr] = 0;
        
        emit CollectionCreated(addr, name, symbol);
        return addr;
    }
    
    /**
     * @dev Factory 일시 중지/해제
     * @param pause_ 일시 중지 여부
     */
    function pauseFactory(bool pause_) external onlyRole(ADMIN_ROLE) {
        if (pause_) {
            _pause();
        } else {
            _unpause();
        }
        emit FactoryPaused(pause_);
    }
    
    // 조회 함수
    function getAllCollections() external view returns (address[] memory) {
        return collections;
    }
    
    function getCollectionCount() external view returns (uint256) {
        return collections.length;
    }
    
    function isValidStarglowCollection(address collection) external view returns (bool) {
        return isValidCollection[collection];
    }
    
    function getCollectionCreationTime(address collection) external view returns (uint256) {
        require(isValidCollection[collection], "Invalid");
        return collectionCreationTime[collection];
    }
    
    /**
     * @dev Collection 관리 (ESCROW 역할, 일시 중지)
     * @param collection 컬렉션 주소
     * @param opType 작업 유형 (0=ESCROW부여, 1=ESCROW회수, 2=일시중지, 3=일시중지해제)
     * @param account 계정 주소 (opType 0,1인 경우만 사용)
     */
    function manageCollection(address collection, uint8 opType, address account) 
        external onlyRole(ADMIN_ROLE) 
    {
        require(isValidCollection[collection], "Invalid");
        Collection colContract = Collection(collection);
        
        if (opType <= 1) {
            if (opType == 0) {
                colContract.grantEscrowRole(account);
            } else {
                colContract.revokeEscrowRole(account);
            }
        } else {
            bool pause_ = opType == 2;
            if (pause_) {
                colContract.pause();
                collectionStatus[collection] = 1;
            } else {
                colContract.unpause();
                collectionStatus[collection] = 0;
            }
            emit CollectionPaused(collection, pause_);
        }
    }
}
