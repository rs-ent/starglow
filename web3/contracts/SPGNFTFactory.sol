// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./SPGNFTCollection.sol";

contract SPGNFTFactory {
    mapping(address => address[]) public deployedCollections;
    address[] public allCollections;
    
    event CollectionDeployed(
        address indexed collection,
        address indexed owner,
        address indexed deployer,
        string name,
        string symbol
    );
    
    function deployCollection(
        ISPGNFT.InitParams memory params,
        address tbaRegistry,
        address tbaImplementation
    ) public returns (address collection) {
        // Validate inputs
        require(bytes(params.name).length > 0);
        require(bytes(params.symbol).length > 0);
        require(params.owner != address(0));
        require(params.maxSupply > 0);
        require(tbaRegistry != address(0));
        require(tbaImplementation != address(0));
        
        if (params.mintFee > 0) {
            require(params.mintFeeRecipient != address(0));
        }
        
        SPGNFTCollection newCollection = new SPGNFTCollection(
            params,
            tbaRegistry,
            tbaImplementation
        );
        collection = address(newCollection);
        
        deployedCollections[params.owner].push(collection);
        allCollections.push(collection);
        
        emit CollectionDeployed(collection, params.owner, msg.sender, params.name, params.symbol);
        return collection;
    }

    function deployStoryCollection(
        string memory name,
        string memory symbol,
        string memory baseURI,
        string memory contractURI,
        address owner,
        address tbaRegistry,
        address tbaImplementation
    ) external returns (address collection) {
        ISPGNFT.InitParams memory params = ISPGNFT.InitParams({
            name: name,
            symbol: symbol,
            baseURI: baseURI,
            contractURI: contractURI,
            maxSupply: 10000,
            mintFee: 0,
            mintFeeToken: address(0),
            mintFeeRecipient: owner,
            owner: owner,
            mintOpen: true,
            isPublicMinting: false
        });
        return deployCollection(params, tbaRegistry, tbaImplementation);
    }
    
    function getDeployedCollections(address owner) external view returns (address[] memory) {
        return deployedCollections[owner];
    }
    
    function getAllCollectionsCount() external view returns (uint256) {
        return allCollections.length;
    }
    
    function getCollectionAt(uint256 index) external view returns (address) {
        require(index < allCollections.length);
        return allCollections[index];
    }
} 