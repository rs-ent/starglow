// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./Collection.sol";
import "./Assets.sol";

contract StakingManager is
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{

    struct DistributedReward {
        address asset;
        uint256 amount;
        uint256 timestamp;
    }

    struct ClaimedReward {
        address asset;
        uint256 amount;
        uint256 timestamp;
    }

    struct StakeInfo {
        address collectionAddress;
        uint256 tokenId;
        uint256 stakedAt;
        uint256 unstakeScheduledAt;
        bool isStaked;
        address owner;
        DistributedReward[] distributedRewards;
        ClaimedReward[] claimedRewards;
    }

    Assets public assets;

    // NFT 컬렉션 => 토큰 ID => 스테이크 정보
    mapping(address => mapping(uint256 => StakeInfo)) public stakes;
    // 사용자 주소 => 컬렉션 => 토큰 ID
    mapping(address => mapping(address => mapping(uint256 => bool))) public userStakedTokens;

    // 이벤트
    event TokenStaked(
        address indexed collection,
        uint256 indexed tokenId,
        address indexed owner,
        uint256 stakedAt,
        uint256 unstakeScheduledAt
    );

    event TokenUnstaked(
        address indexed collection,
        uint256 indexed tokenId,
        address indexed owner,
        uint256 unstakedAt
    );

    event RewardDistributed(
        address indexed collection,
        uint256 indexed tokenId,
        address indexed owner,
        address asset,
        uint256 amount,
        uint256 timestamp
    );

    event RewardClaimed(
        address indexed collection,
        uint256 indexed tokenId,
        address indexed owner,
        address asset,
        uint256 amount,
        uint256 timestamp
    );

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        _transferOwnership(initialOwner);
    }

    function stakeToken(
        address collection,
        uint256[] calldata tokenIds,
        uint256 unstakeScheduledAt
    ) external whenNotPaused nonReentrant {
        require(tokenIds.length > 0, "NO_TOKENS");
        require(unstakeScheduledAt > block.timestamp, "INVALID_UNSTAKE_TIME");

        Collection nftCollection = Collection(collection);
        nftCollection.lockTokens(tokenIds, unstakeScheduledAt);

        address tokenOwner = nftCollection.ownerOf(tokenIds[0]);

        for (uint256 i = 0; i< tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];

            require(
                msg.sender == tokenOwner ||
                msg.sender == nftCollection.getApproved(tokenId) ||
                nftCollection.isApprovedForAll(tokenOwner, msg.sender) ||
                nftCollection.isEscrowWallet(msg.sender) ||
                owner() == msg.sender,
                "NOT_AUTHORIZED"
            );

            require(!stakes[collection][tokenId].isStaked, "ALREADY_STAKED");

            stakes[collection][tokenId] = StakeInfo({
                collectionAddress: collection,
                tokenId: tokenId,
                stakedAt: block.timestamp,
                unstakeScheduledAt: unstakeScheduledAt,
                isStaked: true,
                owner: tokenOwner,
                distributedRewards: new DistributedReward[](0),
                claimedRewards: new ClaimedReward[](0)
            });

            userStakedTokens[tokenOwner][collection][tokenId] = true;

            emit TokenStaked(
                collection,
                tokenId,
                tokenOwner,
                block.timestamp,
                unstakeScheduledAt
            );
        }
    }

    function unstakeToken(
        address collection,
        uint256[] calldata tokenIds,
        bool forceUnstake
    ) external whenNotPaused nonReentrant {
        require(tokenIds.length > 0, "NO_TOKENS");

        Collection nftCollection = Collection(collection);

        address tokenOwner = nftCollection.ownerOf(tokenIds[0]);
        uint256[] memory tokenToUnlock = new uint256[](tokenIds.length);
        for (uint256 i = 0; i< tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            StakeInfo storage stakeInfo = stakes[collection][tokenId];

            require(stakeInfo.isStaked, "NOT_STAKED");
            require(
                msg.sender == stakeInfo.owner ||
                nftCollection.isEscrowWallet(msg.sender) ||
                owner() == msg.sender,
                "NOT_AUTHORIZED"
            );

            if (!forceUnstake) {
                require(
                    block.timestamp >= stakeInfo.unstakeScheduledAt,
                    "UNSTAKE_NOT_SCHEDULED"
                );
            }

            tokenToUnlock[i] = tokenId;
            stakeInfo.isStaked = false;

            userStakedTokens[tokenOwner][collection][tokenId] = false;

            emit TokenUnstaked(
                collection,
                tokenId,
                tokenOwner,
                block.timestamp
            );
        }

        nftCollection.unlockTokens(tokenToUnlock, forceUnstake);
    }

    function distributeReward(
        address collection,
        uint256 tokenId,
        address asset,
        uint256 amount
    ) external onlyOwner whenNotPaused nonReentrant {
        StakeInfo storage stakeInfo = stakes[collection][tokenId];
        require(stakeInfo.isStaked, "NOT_STAKED");

        stakeInfo.distributedRewards.push(DistributedReward({
            asset: asset,
            amount: amount,
            timestamp: block.timestamp
        }));

        emit RewardDistributed(
            collection,
            tokenId,
            stakeInfo.owner,
            asset,
            amount,
            block.timestamp
        );
    }

}
