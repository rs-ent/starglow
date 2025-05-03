// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./Collection.sol";
import "./Assets.sol";

contract Staking is OwnableUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable {
    Collection public collection;
    Assets public assets;

    struct StakeInfo {
        uint256 tokenId;
        uint256 stakedAt;
        uint256 unstakeScheduledAt;
        uint256 unstakedAt;
        bool isStaked;
    }

    struct RewardInfo {
        string assetId;
        bytes4 selector;
        uint256 rewardAmount;
        uint256 requiredStakeTime;
        bool isActive;
    }

    mapping(uint256 => StakeInfo) public stakeInfo;
    mapping(uint256 => RewardInfo) public rewards;
    uint256 private nextRewardId;
    mapping(uint256 => mapping(uint256 => bool)) public claimedRewards;

    event Staked(uint256 indexed tokenId);
    event Unstaked(uint256 indexed tokenId);
    event RewardAdded(uint256 indexed rewardId, string indexed assetId, bytes4 selector, uint256 rewardAmount, uint256 requiredStakeTime);
    event RewardUpdated(uint256 indexed rewardId);
    event RewardStatusChanged(uint256 indexed rewardId, bool isActive);
    event RewardClaimed(uint256 indexed tokenId, uint256 indexed rewardId, address indexed receiver, uint256 amount);

    function initialize(
        address collectionAddress,
        address assetsAddress
    ) public initializer {
        __Ownable_init(msg.sender);
        __Pausable_init();
        __ReentrancyGuard_init();

        collection = Collection(collectionAddress);
        assets = Assets(assetsAddress);
    }

    function _isApproved(address user, uint256 tokenId) internal view returns (bool) {
        return collection.isEscrowWallet(user) || 
            user == collection.owner() || 
            user == collection.getApproved(tokenId) || 
            user == collection.ownerOf(tokenId);
    }

    function stake(
        uint256[] memory tokenIds,
        uint256 unstakeScheduledAt
    ) external whenNotPaused nonReentrant {
        require(tokenIds.length > 0, "INVALID_TOKENS");
        require(unstakeScheduledAt > block.timestamp, "INVALID_UNSTAKE_TIME");
        require(_isApproved(msg.sender, tokenIds[0]), "NOT_APPROVED");

        collection.lockTokens(tokenIds, unstakeScheduledAt);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            StakeInfo storage info = stakeInfo[tokenIds[i]];
            info.tokenId = tokenIds[i];
            info.stakedAt = block.timestamp;
            info.unstakeScheduledAt = unstakeScheduledAt;
            info.isStaked = true;

            emit Staked(tokenIds[i]);
        }
    }

    function unstake(
        uint256[] memory tokenIds,
        bool forceUnstake
    ) external whenNotPaused nonReentrant {
        require(tokenIds.length > 0, "INVALID_TOKENS");
        require(_isApproved(msg.sender, tokenIds[0]), "NOT_APPROVED");

        collection.unlockTokens(tokenIds, forceUnstake);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            StakeInfo storage info = stakeInfo[tokenIds[i]];
            require(info.isStaked, "NOT_STAKED");

            info.unstakedAt = block.timestamp;
            info.isStaked = false;

            emit Unstaked(tokenIds[i]);
        }
    }

    function addReward(
        string memory assetId,
        bytes4 selector,
        uint256 rewardAmount,
        uint256 requiredStakeTime
    ) external onlyOwner {
        require(rewardAmount > 0, "INVALID_AMOUNT");
        require(requiredStakeTime > 0, "INVALID_TIME");

        (
            ,  // name
            ,  // symbol
            ,  // metadata
            ,  // assetType
            address contractAddress,
            bool isActive,
            ,  // creator
            bytes4[] memory selectors
        ) = assets.getAsset(assetId);

        require(isActive, "ASSET_NOT_ACTIVE");
        require(contractAddress != address(0), "INVALID_CONTRACT");
        
        bool validSelector = false;
        for (uint i = 0; i < selectors.length; i++) {
            if (selectors[i] == selector) {
                validSelector = true;
                break;
            }
        }
        require(validSelector, "INVALID_SELECTOR");

        uint256 rewardId = nextRewardId++;
        rewards[rewardId] = RewardInfo({
            assetId: assetId,
            selector: selector,
            rewardAmount: rewardAmount,
            requiredStakeTime: requiredStakeTime,
            isActive: true
        });

        emit RewardAdded(rewardId, assetId, selector, rewardAmount, requiredStakeTime);
    }

    function _validateClaim(
        uint256 tokenId,
        uint256 rewardId
    ) internal view returns (
        StakeInfo storage stakeInfo_,
        RewardInfo storage reward,
        bool isOnchain
    ) {
        stakeInfo_ = stakeInfo[tokenId];
        require(
            collection.isEscrowWallet(msg.sender) || 
            msg.sender == collection.owner() || 
            msg.sender == collection.ownerOf(tokenId), 
            "NOT_APPROVED"
        );

        require(stakeInfo_.stakedAt > 0, "TOKEN_NEVER_STAKED");

        reward = rewards[rewardId];
        require(reward.isActive, "REWARD_NOT_ACTIVE");

        // Assets 컨트랙트의 새로운 구조에 맞춰 수정
        (
            ,  // name
            ,  // symbol
            ,  // metadata
            Assets.AssetType assetType,
            address _contractAddress,
            bool isActive,
            ,  // creator
            bytes4[] memory selectors
        ) = assets.getAsset(reward.assetId);

        require(isActive, "ASSET_NOT_ACTIVE");
        require(_contractAddress != address(0), "INVALID_CONTRACT");

        bool validSelector = false;
        for (uint i = 0; i < selectors.length; i++) {
            if (selectors[i] == reward.selector) {
                validSelector = true;
                break;
            }
        }
        require(validSelector, "INVALID_SELECTOR");

        require(!claimedRewards[tokenId][rewardId], "ALREADY_CLAIMED");
        
        uint256 stakedDuration = stakeInfo_.isStaked ? 
            block.timestamp - stakeInfo_.stakedAt : 
            stakeInfo_.unstakedAt - stakeInfo_.stakedAt;
        require(stakedDuration >= reward.requiredStakeTime, "INSUFFICIENT_STAKE_TIME");

        return (stakeInfo_, reward, assetType == Assets.AssetType.ONCHAIN);
    }

    function claimOnChainReward(
        uint256 tokenId,
        uint256 rewardId,
        uint256 gasLimit
    ) external whenNotPaused nonReentrant {
        (
            ,  // stakeInfo
            RewardInfo storage reward,
            bool isOnchain
        ) = _validateClaim(tokenId, rewardId);

        require(isOnchain, "INVALID_ASSET_TYPE");
        require(gasLimit > 0 && gasLimit <= block.gaslimit, "INVALID_GAS_LIMIT");

        (bool success,) = assets.executeAssetFunction(
            reward.assetId,
            reward.selector,
            abi.encode(collection.ownerOf(tokenId), reward.rewardAmount),
            gasLimit
        );
        require(success, "REWARD_TRANSFER_FAILED");
        
        claimedRewards[tokenId][rewardId] = true;

        emit RewardClaimed(
            tokenId,
            rewardId,
            collection.ownerOf(tokenId),
            reward.rewardAmount
        );
    }

    function claimOffChainReward(
        uint256 tokenId,
        uint256 rewardId
    ) external whenNotPaused nonReentrant {
        (
            ,
            RewardInfo storage reward,
            bool isOnchain
        ) = _validateClaim(tokenId, rewardId);

        require(!isOnchain, "INVALID_ASSET_TYPE");
        
        claimedRewards[tokenId][rewardId] = true;

        emit RewardClaimed(
            tokenId,
            rewardId,
            collection.ownerOf(tokenId),
            reward.rewardAmount
        );
    }
}


