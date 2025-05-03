// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

contract Assets is OwnableUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable {
    
    enum AssetType { ONCHAIN, OFFCHAIN }

    struct Asset {
        string id;
        string name;
        string symbol;
        string metadata;
        AssetType assetType;
        address contractAddress;
        bool isActive;
        bytes4[] selectors;
        mapping(bytes4 => bytes) abis;

        address creator;
    }

    mapping(string => Asset) public assets;
    mapping(address => bool) public assetManagers;
    string[] public assetIds;

    event AssetCreated(
        string indexed id,
        string name,
        string symbol,
        string metadata,
        AssetType assetType,
        address contractAddress,
        address creator
    );
    event AssetUpdated(string indexed id, address updatedBy);
    event AssetFunctionAdded(string indexed id, bytes4 selector);
    event AssetStatusChanged(string indexed id, bool isActive);
    event AssetDeleted(string indexed id, address deletedBy);
    event AssetManagerAdded(address indexed manager);
    event AssetManagerRemoved(address indexed manager);
    event AssetTransactionExecuted(
        string indexed assetId,
        bytes4 selector,
        bytes data,
        bool success,
        bytes result
    );
    event AirdropExecuted(
        string indexed id,
        address[] receivers,
        uint256[] amounts
    );

     modifier onlyAssetManager() {
        require(assetManagers[msg.sender], "NOT_MANAGER");
        _;
    }

    function initialize() public initializer {
        __Ownable_init(msg.sender);
        __Pausable_init();
        __ReentrancyGuard_init();
        assetManagers[msg.sender] = true;
        emit AssetManagerAdded(msg.sender);
    }

    function _assetExists(string memory id) internal view returns (bool) {
        return bytes(assets[id].id).length > 0;
    }

    function createAsset(
        string memory id,
        string memory name,
        string memory symbol,
        string memory metadata,
        AssetType assetType,
        address contractAddress
    ) external onlyAssetManager whenNotPaused returns (string memory) {
        require(bytes(id).length > 0, "INVALID_ID");
        require(!_assetExists(id), "ASSET_ALREADY_EXISTS");
        require(
            assetType == AssetType.OFFCHAIN || contractAddress != address(0),
            "INVALID_ASSET_TYPE"
        );

        Asset storage asset = assets[id];
        asset.id = id;
        asset.name = name;
        asset.symbol = symbol;
        asset.metadata = metadata;
        asset.assetType = assetType;
        asset.contractAddress = contractAddress;
        asset.isActive = true;
        asset.creator = msg.sender;

        assetIds.push(id);

        emit AssetCreated(
            id, 
            name, 
            symbol, 
            metadata,
            assetType, 
            contractAddress,
            msg.sender
        );

        return id;
    }

    function updateAsset(
        string memory id,
        string memory name,
        string memory symbol,
        string memory metadata
    ) external onlyAssetManager whenNotPaused {
        require(_assetExists(id), "ASSET_NOT_FOUND");
        Asset storage asset = assets[id];
        
        asset.name = name;
        asset.symbol = symbol;
        asset.metadata = metadata;

        emit AssetUpdated(id, msg.sender);
    }

    function addAssetFunction(
        string memory id,
        bytes4 selector,
        bytes calldata functionAbi
    ) external onlyAssetManager whenNotPaused {
        require(_assetExists(id), "ASSET_NOT_FOUND");
        Asset storage asset = assets[id];
        require(asset.assetType == AssetType.ONCHAIN, "INVALID_ASSET_TYPE");
        require(!_containsSelector(asset.selectors, selector), "SELECTOR_EXISTS");

        asset.selectors.push(selector);
        asset.abis[selector] = functionAbi;

        emit AssetFunctionAdded(id, selector);
    }

    function getAsset(string memory id) external view returns (
        string memory name,
        string memory symbol,
        string memory metadata,
        AssetType assetType,
        address contractAddress,
        bool isActive,
        address creator,
        bytes4[] memory selectors
    ) {
        require(_assetExists(id), "ASSET_NOT_FOUND");
        Asset storage asset = assets[id];
        
        return (
            asset.name,
            asset.symbol,
            asset.metadata,
            asset.assetType,
            asset.contractAddress,
            asset.isActive,
            asset.creator,
            asset.selectors
        );
    }

    function getAssetFunction(
        string memory id,
        bytes4 selector
    ) external view returns (bytes memory) {
        require(_assetExists(id), "ASSET_NOT_FOUND");
        require(_containsSelector(assets[id].selectors, selector), "INVALID_SELECTOR");
        return assets[id].abis[selector];
    }

    function setAssetStatus(
        string memory id,
        bool isActive
    ) external onlyAssetManager whenNotPaused {
        require(_assetExists(id), "ASSET_NOT_FOUND");
        assets[id].isActive = isActive;
        emit AssetStatusChanged(id, isActive);
    }

    function setAssetManager(
        address manager,
        bool isActive
    ) external onlyOwner {
        require(manager != address(0), "INVALID_ADDRESS");
        assetManagers[manager] = isActive;
        if (isActive) {
            emit AssetManagerAdded(manager);
        } else {
            emit AssetManagerRemoved(manager);
        }
    }

    function executeAssetFunction(
        string memory assetId,
        bytes4 selector,
        bytes calldata data,
        uint256 gasLimit
    ) external onlyAssetManager whenNotPaused nonReentrant returns (bool, bytes memory) {
        Asset storage asset = assets[assetId];
        require(asset.isActive, "ASSET_NOT_ACTIVE");
        require(asset.assetType == AssetType.ONCHAIN, "INVALID_ASSET_TYPE");
        require(_containsSelector(asset.selectors, selector), "INVALID_SELECTOR");
        require(gasLimit > 0 && gasLimit <= block.gaslimit, "INVALID_GAS_LIMIT");

        (bool success, bytes memory result) = asset.contractAddress.call{
            gas: gasLimit
        }(abi.encodePacked(selector, data));

        emit AssetTransactionExecuted(
            assetId,
            selector,
            data,
            success,
            result
        );

        return (success, result);
    }

    function _containsSelector(bytes4[] memory selectors, bytes4 selector) internal pure returns (bool) {
        for (uint256 i = 0; i < selectors.length; i++) {
            if (selectors[i] == selector) return true;
        }
        return false;
    }

    function getAssetIds() external view returns (string[] memory) {
        return assetIds;
    }

    function deleteAsset(string memory id) external onlyAssetManager whenNotPaused {
        require(_assetExists(id), "ASSET_NOT_FOUND");
        require(!assets[id].isActive, "ASSET_MUST_BE_INACTIVE");
        
        for (uint i = 0; i < assetIds.length; i++) {
            if (keccak256(bytes(assetIds[i])) == keccak256(bytes(id))) {
                assetIds[i] = assetIds[assetIds.length - 1];
                assetIds.pop();
                break;
            }
        }
        
        delete assets[id];
        emit AssetDeleted(id, msg.sender);
    }

    function airdrop(
        string memory id,
        bytes4 transferSelector,
        address[] calldata receivers,
        uint256[] calldata amounts,
        uint256 gasLimitPerTransfer
    ) external onlyAssetManager whenNotPaused nonReentrant {
        require(_assetExists(id), "ASSET_NOT_FOUND");
        require(receivers.length > 0 && receivers.length == amounts.length, "INVALID_ARRAY_LENGTH");
        
        Asset storage asset = assets[id];
        require(asset.isActive, "ASSET_NOT_ACTIVE");
        require(asset.assetType == AssetType.ONCHAIN, "INVALID_ASSET_TYPE");
        require(_containsSelector(asset.selectors, transferSelector), "INVALID_SELECTOR");
        require(gasLimitPerTransfer > 0 && gasLimitPerTransfer <= block.gaslimit, "INVALID_GAS_LIMIT");

        for (uint256 i = 0; i < receivers.length; i++) {
            require(receivers[i] != address(0), "INVALID_RECEIVER");
            (bool success,) = asset.contractAddress.call{
                gas: gasLimitPerTransfer
            }(abi.encodePacked(
                transferSelector,
                abi.encode(receivers[i], amounts[i])
            ));
            require(success, "TRANSFER_FAILED");
        }

        emit AirdropExecuted(id, receivers, amounts);
    }
}