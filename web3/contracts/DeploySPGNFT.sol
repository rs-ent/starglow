// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./SPGNFTCollection.sol";

/**
 * @title DeploySPGNFT
 * @dev Factory contract for deploying Story Protocol Gateway NFT collections
 */
contract DeploySPGNFT {
    event CollectionDeployed(
        address indexed collection,
        address indexed owner,
        string name,
        string symbol
    );

    /**
     * @dev Deploy a new SPGNFTCollection
     * @param params Initialization parameters for the collection
     * @return collection The address of the deployed collection
     */
    function deployCollection(
        ISPGNFT.InitParams memory params
    ) external returns (address collection) {
        SPGNFTCollection newCollection = new SPGNFTCollection(params);
        collection = address(newCollection);
        
        emit CollectionDeployed(collection, params.owner, params.name, params.symbol);
        
        return collection;
    }

    /**
     * @dev Deploy a new Story Protocol NFT collection
     * @param name Collection name
     * @param symbol Collection symbol  
     * @param baseURI Base URI for token metadata
     * @param contractURI Contract metadata URI
     * @param owner Owner address
     * @return collection Address of deployed collection
     */
    function deployStoryCollection(
        string memory name,
        string memory symbol,
        string memory baseURI,
        string memory contractURI,
        address owner
    ) external returns (address collection) {
        ISPGNFT.InitParams memory params = ISPGNFT.InitParams({
            name: name,
            symbol: symbol,
            baseURI: baseURI,
            contractURI: contractURI,
            maxSupply: 10000,  // Default max supply
            mintFee: 0,         // No mint fee by default
            mintFeeToken: address(0), // ETH payment
            mintFeeRecipient: owner,
            owner: owner,
            mintOpen: true,     // Minting open by default
            isPublicMinting: false  // Not public by default
        });
        
        return this.deployCollection(params);
    }
} 