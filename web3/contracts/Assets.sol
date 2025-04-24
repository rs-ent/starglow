// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

contract Assets is OwnableUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable {
    
    enum AssetType { ONCHAIN, OFFCHAIN }

    struct Asset {
        string name;
        string symbol;
        string metadata;
        AssetType assetType;
        address contractAddress;
        bool isActive;
        bytes4[] selectors;
        mapping(bytes4 => bytes) abis;
    }

    mapping(uint256 => Asset) public assets;
    uint256 public nextAssetId;

    mapping(address => bool) public assetManagers;

    event AssetCreated(
        uint256 indexed assetId,
        string name,
        string symbol,
        AssetType assetType,
        address contractAddress,
        string metadata
    );

    event AssetUpdated(uint256 indexed assetId);
    event AssetFunctionAdded(uint256 indexed assetId, bytes4 selector, bytes abi);

    event AssetManagerAdded(address indexed manager);
    event AssetManagerRemoved(address indexed manager);

    event AssetStatusChanged(uint256 indexed assetId, bool isActive);

    event AirdropExecuted(
        uint256 indexed assetId,
        address[] receivers,
        uint256[] amounts,
        uint256 timestamp
    );
    
    modifier onlyAssetManager() {
        require(assetManagers[msg.sender], "NOT_MANAGER");
        _;
    }

    function initialize() public initializer {
        __Ownable_init(msg.sender);
        __Pausable_init();
        nextAssetId = 1;
        assetManagers[msg.sender] = true;
        emit AssetManagerAdded(msg.sender);
    }

    function createAsset(
        string memory name,
        string memory symbol,
        AssetType assetType,
        address contractAddress,
        string memory metadata
    ) external onlyAssetManager returns (uint256) {
        require(
            assetType == AssetType.OFFCHAIN || contractAddress != address(0),
            "INVALID_ASSET_TYPE"
        );

        uint256 assetId = nextAssetId++;
        Asset storage asset = assets[assetId];
        asset.name = name;
        asset.symbol = symbol;
        asset.assetType = assetType;
        asset.contractAddress = contractAddress;
        asset.isActive = true;
        asset.metadata = metadata;

        emit AssetCreated(assetId, name, symbol, assetType, contractAddress, metadata);

        return assetId;
    }

    function addAssetFunction(
        uint256 assetId,
        bytes4 selector,
        bytes calldata _abi
    ) external onlyAssetManager {
        Asset storage asset = assets[assetId];
        require(asset.assetType == AssetType.ONCHAIN, "INVALID_ASSET_TYPE");

        asset.selectors.push(selector);
        asset.abis[selector] = _abi;

        emit AssetFunctionAdded(assetId, selector, _abi);
    }

    function getAssetFunction(
        uint256 assetId,
        bytes4 selector
    ) external view returns (bytes memory) {
        return assets[assetId].abis[selector];
    }

    function getAssetSelectors(
        uint256 assetId
    ) external view returns (bytes4[] memory) {
        return assets[assetId].selectors;
    }

    function getAssetMetadata(
        uint256 assetId
    ) external view returns (string memory) {
        return assets[assetId].metadata;
    }

    function setAssetStatus(
        uint256 assetId,
        bool isActive
    ) external onlyAssetManager {
        assets[assetId].isActive = isActive;
        emit AssetStatusChanged(assetId, isActive);
    }

    function setAssetManager(
        address manager,
        bool isActive
    ) external onlyOwner {
        assetManagers[manager] = isActive;
        if (isActive) {
            emit AssetManagerAdded(manager);
        } else {
            emit AssetManagerRemoved(manager);
        }
    }

    function executeAssetFunction(
        uint256 assetId,
        bytes4 selector,
        bytes calldata data
    ) external onlyAssetManager returns (bool, bytes memory) {
        Asset storage asset = assets[assetId];
        require(asset.isActive, "ASSET_NOT_ACTIVE");
        require(asset.assetType == AssetType.ONCHAIN, "INVALID_ASSET_TYPE");

        (bool success, bytes memory result) = asset.contractAddress.call(
            abi.encodePacked(selector, data)
        );

        return (success, result);
    }

    function getAssetStatus(
        uint256 assetId
    ) external view returns (bool) {
        return assets[assetId].isActive;
    }

    function getAssetAbi(
        uint256 assetId,
        bytes4 selector
    ) external view returns (bytes memory) {
        return assets[assetId].abis[selector];
    }

    function _containsSelector(bytes4[] memory selectors, bytes4 selector) internal pure returns (bool) {
        for (uint256 i = 0; i < selectors.length; i++) {
            if (selectors[i] == selector) return true;
        }
        return false;
    }

    function Airdrop(
        uint256 assetId,
        bytes4 transferSelector,
        address[] calldata receivers,
        uint256[] calldata amounts
    ) external onlyAssetManager whenNotPaused nonReentrant {
        require(receivers.length > 0, "INVALID_RECEIVERS");
        require(receivers.length == amounts.length, "INVALID_AMOUNTS");
        require(assets[assetId].isActive, "ASSET_NOT_ACTIVE");
        require(assets[assetId].assetType == AssetType.ONCHAIN, "INVALID_ASSET_TYPE");
        require(_containsSelector(assets[assetId].selectors, transferSelector), "INVALID_SELECTOR");

        for (uint256 i = 0; i < receivers.length; i++) {
            (bool success,) = assets[assetId].contractAddress.call(
                abi.encodePacked(
                    transferSelector,
                    abi.encode(receivers[i], amounts[i])
                )
            );

            require(success, "TRANSFER_FAILED");
        }

        emit AirdropExecuted(assetId, receivers, amounts, block.timestamp);
    }
}