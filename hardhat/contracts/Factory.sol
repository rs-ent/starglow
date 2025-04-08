// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

/*
*   @title StarglowFactory
*/
contract StarglowFactory is AccessControl, ReentrancyGuard {
    using Address for address;
    using Clones for address;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ESCROW_ROLE = keccak256("ESCROW_ROLE");
    
    address public collectionImplementation;

    struct Collection {
        string name;
        string symbol;
        address contractAddress;
        uint256 maxSupply;
        uint256 createdAt;
        bool active;
    }

    Collection[] public collections;
    mapping(address => bool) public isStarglowCollection;
    mapping(string => address) public collectionAddressByName;
    mapping(address => uint256) private _collectionIndexes;

    event CollectionCreated(
        string name,
        string symbol,
        address contractAddress,
        uint256 maxSupply,
        uint256 timestamp
    );

    event CollectionStatusUpdated(address contractAddress, bool active);
    event EmergencyShutdown(bool enabled);
    event ImplementationUpdated(address newImplementation);
    event EscrowRoleGranted(address collection, address escrow);

    bool public emergencyShutdownEnabled = false;

    /*
    * @notice Constructor to initialize the factory contract
    */
    constructor(address _collectionImplementation) {
        require(_collectionImplementation != address(0), "Invalid implementation address");
        require(_collectionImplementation.isContract(), "Implementation must be a contract");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(ESCROW_ROLE, msg.sender);

        collectionImplementation = _collectionImplementation;
    }

    /*
    * @notice Create a new collection
    */
    function createCollection(
        string memory name,
        string memory symbol,
        uint256 maxSupply,
        uint256 initialMintPrice,
        string memory baseURI,
        string memory contractURI_,
        address royaltyReceiver,
        uint96 royaltyBasisPoints
    ) external onlyRole(ADMIN_ROLE) nonReentrant returns (address) {
        require(!emergencyShutdownEnabled, "Emergency shutdown is active");
        require(bytes(name).length > 0, "Name must be non-empty");
        require(bytes(symbol).length > 0, "Symbol must be non-empty");
        require(maxSupply > 0, "Max supply must be greater than 0");
        require(collectionAddressByName[name] == address(0), "Collection with this name already exists");

        address clonedCollection = Clones.clone(collectionImplementation);

        StarglowCollection(clonedCollection).initialize(
            name,
            symbol,
            maxSupply,
            initialMintPrice,
            baseURI,
            contractURI_,
            royaltyReceiver,
            royaltyBasisPoints,
            msg.sender
        );

        StarglowCollection(clonedCollection).grantRole(ADMIN_ROLE, msg.sender);

        uint256 newIndex = collections.length;
        
        collections.push(Collection({
            name: name,
            symbol: symbol,
            contractAddress: clonedCollection,
            maxSupply: maxSupply,
            createdAt: block.timestamp,
            active: true
        }));

        isStarglowCollection[clonedCollection] = true;
        collectionAddressByName[name] = clonedCollection;
        _collectionIndexes[clonedCollection] = newIndex;

        emit CollectionCreated(
            name,
            symbol,
            clonedCollection,
            maxSupply,
            block.timestamp
        );

        return clonedCollection;
   }

   /*
   * @notice Updates a collection's active status
   */
    function setCollectionStatus(address collectionAddress, bool active)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(isStarglowCollection[collectionAddress], "Collection not found");

        uint256 collectionIndex = _collectionIndexes[collectionAddress];
        collections[collectionIndex].active = active;

        if (!active) {
            try StarglowCollection(collectionAddress).pause() {} catch {}
        } else {
            try StarglowCollection(collectionAddress).unpause() {} catch {}
        }

        emit CollectionStatusUpdated(collectionAddress, active);
    }
    
    /*
    * @notice Sets Global emergency shutdown status
    */

    function setEmergencyShutdown(bool enabled) external onlyRole(ADMIN_ROLE) {
        emergencyShutdownEnabled = enabled;

        if(enabled) {
            for (uint256 i = 0; i < collections.length; i++) {
                address collectionAddress = collections[i].contractAddress;
                if(collections[i].active) {
                    try StarglowCollection(collectionAddress).pause() {} catch {}
                }
            }
        }

        emit EmergencyShutdown(enabled);
    }
    
    /*
    * @notice Update the collection implementation address
    */

    function updateImplementation(address newImplementation) external onlyRole(ADMIN_ROLE) {
        require(newImplementation != address(0), "Invalid implementation address");
        require(newImplementation.isContract(), "Implementation must be a contract");

        collectionImplementation = newImplementation;
        emit ImplementationUpdated(newImplementation);
    }

    /*
    * @notice Grant ESCROW_ROLE to an address for a specific collection
    */
    function grantEscrowRole(address collectionAddress, address escrowAddress)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(isStarglowCollection[collectionAddress], "Collection not found");
        
        bytes32 ESCROW_ROLE_HASH = keccak256("ESCROW_ROLE");
        StarglowCollection(collectionAddress).grantRole(ESCROW_ROLE_HASH, escrowAddress);
        
        emit EscrowRoleGranted(collectionAddress, escrowAddress);
    }

    /*
    * @notice Get the total number of collections
    */
    function getCollectionCount() external view returns (uint256) {
        return collections.length;
    }

    /*
    * @notice Validate if a collection is a Starglow collection
    */
    function validateCollection(address collectionAddress) external view returns (bool) {
        if (!isStarglowCollection[collectionAddress]) {
            return false;
        }

        uint256 collectionIndex = _collectionIndexes[collectionAddress];
        return collections[collectionIndex].active;
    }

    /*
    * @notice Get the collection address by name
    */
    function getCollectionByName(string memory name) external view returns (address) {
        return collectionAddressByName[name];
    }

    /*
    * @notice Get collection details by address
    */
    function getCollectionDetails(address collectionAddress) 
        external 
        view 
        returns (
            string memory name,
            string memory symbol,
            uint256 maxSupply,
            uint256 createdAt,
            bool active
        )
    {
        require(isStarglowCollection[collectionAddress], "Collection not found");
        
        uint256 collectionIndex = _collectionIndexes[collectionAddress];
        Collection storage collection = collections[collectionIndex];
        
        return (
            collection.name,
            collection.symbol,
            collection.maxSupply,
            collection.createdAt,
            collection.active
        );
    }

    function getCollections(uint256 offset, uint256 limit)
        external
        view
        returns (address[] memory)
    {
        if (offset >= collections.length) {
            return new address[](0);
        }

        uint256 end = offset + limit;
        if (end > collections.length) {
            end = collections.length;
        }

        uint256 resultLength = end - offset;
        address[] memory result = new address[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = collections[offset + i].contractAddress;
        }

        return result;
    }
}

interface StarglowCollection {
    function initialize(
        string memory name,
        string memory symbol,
        uint256 maxSupply,
        uint256 initialMintPrice,
        string memory baseURI,
        string memory contractURI_,
        address royaltyReceiver,
        uint96 royaltyBasisPoints,
        address admin
    ) external;

    function grantRole(bytes32 role, address account) external;
    function pause() external;
    function unpause() external;
}


