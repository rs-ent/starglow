// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Collection.sol";

/**
 * @title CollectionFactory
 * @dev 컬렉션 생성 팩토리 컨트랙트
 */
contract CollectionFactory is Ownable {
    // 컬렉션 주소 배열
    address[] public collections;

    // 이름으로 컬렉션 조회
    mapping(string => address) public collectionsByName;

    // 이벤트
    event CollectionCreated(
        address indexed collectionAddress,
        string name,
        string symbol,
        address indexed owner
    );

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev 새로운 NFT 컬렉션 생성
     */
    function createCollection(
        string memory name,
        string memory symbol,
        uint256 maxSupply,
        uint256 mintPrice,
        string memory baseURI,
        string memory contractURI_
    ) external onlyOwner returns (address) {
        // 중복 이름 체크
        require(collectionsByName[name] == address(0), "Collection already exists");

        // 새로운 Collection 컨트랙트 배포
        Collection newCollection = new Collection(
            name,
            symbol,
            msg.sender,
            maxSupply,
            mintPrice,
            baseURI,
            contractURI_
        );

        address collectionAddress = address(newCollection);

        // 상태 업데이트
        collections.push(collectionAddress);
        collectionsByName[name] = collectionAddress;

        // 이벤트 발생
        emit CollectionCreated(
            collectionAddress,
            name,
            symbol,
            msg.sender
        );

        return collectionAddress;
    }

    /**
     * @dev 생성된 모든 컬렉션 주소 조회
     */
    function getCollections() external view returns (address[] memory) {
        return collections;
    }
}



