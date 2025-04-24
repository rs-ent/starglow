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
        uint256 assetId;
        bytes4 selector;
        uint256 rewardAmount;
        uint256 requiredStakeTime;
        bool isActive;
    }

    mapping(uint256 => StakeInfo) public stakeInfo;
    event Staked(uint256 indexed tokenId, uint256 stakeTime);
    event Unstaked(uint256 indexed tokenId, uint256 unstakeTime);

    mapping(uint256 => RewardInfo) public rewards;
    uint256 private nextRewardId;
    mapping(uint256 => mapping(uint256 => bool)) public claimedRewards;
    event RewardAdded(uint256 indexed rewardId, uint256 assetId, bytes4 selector, uint256 rewardAmount, uint256 requiredStakeTime);
    event RewardUpdated(uint256 indexed rewardId);
    event RewardStatusChanged(uint256 indexed rewardId, bool isActive);
    event RewardClaimed(uint256 indexed tokenId, uint256 indexed rewardId, address indexed receiver, uint256 amount, uint256 timestamp);

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

    function stake(
        uint256[] memory tokenIds,
        uint256 unstakeScheduledAt
    ) external whenNotPaused nonReentrant {
        require(tokenIds.length > 0, "INVALID_TOKENS");
        require(unstakeScheduledAt > block.timestamp, "INVALID_UNSTAKE_TIME");
        require(collection.isEscrowWallet(msg.sender) || msg.sender == collection.owner() || msg.sender == collection.getApproved(tokenIds[0]) || msg.sender == collection.ownerOf(tokenIds[0]), "NOT_APPROVED");

        collection.lockTokens(tokenIds, unstakeScheduledAt);

        uint256 currentTime = block.timestamp;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            StakeInfo storage info = stakeInfo[tokenIds[i]];
            info.tokenId = tokenIds[i];
            info.stakedAt = currentTime;
            info.unstakeScheduledAt = unstakeScheduledAt;
            info.isStaked = true;

            emit Staked(tokenIds[i], currentTime);
        }
    }

    function unstake(
        uint256[] memory tokenIds,
        bool forceUnstake
    ) external whenNotPaused nonReentrant {
        require(tokenIds.length > 0, "INVALID_TOKENS");
        require(
            collection.isEscrowWallet(msg.sender) || 
            msg.sender == collection.owner() || 
            msg.sender == collection.getApproved(tokenIds[0]) || 
            msg.sender == collection.ownerOf(tokenIds[0]), 
            "NOT_APPROVED"
        );


        collection.unlockTokens(tokenIds, forceUnstake);

        uint256 currentTime = block.timestamp;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            StakeInfo storage info = stakeInfo[tokenIds[i]];
            require(info.isStaked, "NOT_STAKED");

            info.unstakedAt = currentTime;
            info.isStaked = false;

            emit Unstaked(tokenIds[i], currentTime);
            unchecked {
                ++i;
            }
        }
    }

    function _containsSelector(bytes4[] memory selectors, bytes4 selector) internal pure returns (bool) {
        for (uint i = 0; i < selectors.length; i++) {
            if (selectors[i] == selector) return true;
        }
        return false;
    }

    function addReward(
        uint256 assetId,
        bytes4 selector,
        uint256 rewardAmount,
        uint256 requiredStakeTime
    ) external onlyOwner {
        require(rewardAmount > 0, "INVALID_AMOUNT");
        require(requiredStakeTime > 0, "INVALID_TIME");
        require(assets.getAssetStatus(assetId), "INVALID_ASSET");
        require(_containsSelector(assets.getAssetSelectors(assetId), selector), "INVALID_SELECTOR");

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

    function updateReward(
        uint256 rewardId,
        bytes4 newSelector,
        uint256 newRewardAmount,
        uint256 newRequiredStakeTime
    ) external onlyOwner {
        require(newRewardAmount > 0, "INVALID_AMOUNT");
        require(newRequiredStakeTime > 0, "INVALID_TIME");
        
        RewardInfo storage reward = rewards[rewardId];
        require(_containsSelector(assets.getAssetSelectors(reward.assetId), newSelector), "INVALID_SELECTOR");
        reward.selector = newSelector;
        reward.rewardAmount = newRewardAmount;
        reward.requiredStakeTime = newRequiredStakeTime;

        emit RewardUpdated(rewardId);
    }

    function setRewardStatus(
        uint256 rewardId,
        bool isActive
    ) external onlyOwner {
        rewards[rewardId].isActive = isActive;
        emit RewardStatusChanged(rewardId, isActive);
    }

    function claimReward(
        uint256 tokenId,
        uint256 rewardId
    ) external whenNotPaused nonReentrant {
        StakeInfo storage info = stakeInfo[tokenId];
        require(
            collection.isEscrowWallet(msg.sender) || 
            msg.sender == collection.owner() || 
            msg.sender == collection.ownerOf(tokenId), 
            "NOT_APPROVED"
        );

        RewardInfo storage reward = rewards[rewardId];
        require(reward.isActive, "REWARD_NOT_ACTIVE");
        require(!claimedRewards[tokenId][rewardId], "ALREADY_CLAIMED");

        uint256 stakedDuration = info.isStaked ? block.timestamp - info.stakedAt : info.unstakedAt - info.stakedAt;
        require(stakedDuration >= reward.requiredStakeTime, "INSUFFICIENT_STAKE_TIME");
        
        claimedRewards[tokenId][rewardId] = true;

        emit RewardClaimed(
            tokenId,
            rewardId,
            collection.ownerOf(tokenId),
            reward.rewardAmount,
            block.timestamp
        );
    }
}


