// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./Collection.sol";

contract CollectionFactory is OwnableUpgradeable {
    address[] public collections;
    mapping(string => bool) private _usedNames;
    mapping(address => uint256) private _collectionIndex;

    event CollectionCreated(address indexed collectionAddress);
    event CollectionDeleted(address indexed collectionAddress);

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        _transferOwnership(initialOwner);
    }

    function createCollection(
        string memory name,
        string memory symbol,
        uint256 maxSupply,
        uint256 mintPrice,
        string memory baseURI,
        string memory contractURI_
    ) external onlyOwner returns (address) {
        require(!_usedNames[name], "NAME_TAKEN");

        Collection newCollection = new Collection();
        newCollection.initialize(
            name,
            symbol,
            msg.sender,
            maxSupply,
            mintPrice,
            baseURI,
            contractURI_
        );

        address collectionAddress = address(newCollection);
        collections.push(collectionAddress);
        _usedNames[name] = true;
        _collectionIndex[collectionAddress] = collections.length - 1;

        emit CollectionCreated(collectionAddress);
        return collectionAddress;
    }

    function deleteCollection(address collectionAddress) external onlyOwner {
        uint256 index = _collectionIndex[collectionAddress];
        require(collections[index] == collectionAddress, "NOT_FOUND");

        uint256 lastIndex = collections.length - 1;
        if (index != lastIndex) {
            address lastCollection = collections[lastIndex];
            collections[index] = lastCollection;
            _collectionIndex[lastCollection] = index;
        }

        collections.pop();
        delete _collectionIndex[collectionAddress];
        delete _usedNames[Collection(collectionAddress).name()];

        emit CollectionDeleted(collectionAddress);
    }

    function getCollections() external view returns (address[] memory) {
        return collections;
    }
}