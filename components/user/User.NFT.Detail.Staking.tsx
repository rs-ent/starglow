/// components/user/User.NFT.Detail.Staking.tsx

"use client";

import { useStakingGet, useStakingSet } from "@/app/hooks/useStaking";
import {
    Player,
    CollectionContract,
    NFT,
    StakeRewardLog,
    Asset,
} from "@prisma/client";
import { User } from "next-auth";
import PartialLoading from "../atoms/PartialLoading";
import { TokenGateResult } from "@/app/actions/blockchain";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { Button } from "../ui/button";
import { useToast } from "@/app/hooks/useToast";
import Popup from "../atoms/Popup";
import { useState, useMemo } from "react";
import { useLoading } from "@/app/hooks/useLoading";

interface UserNFTStakingProps {
    user: User | null;
    player: Player | null;
    collection: CollectionContract;
    tokenGateResult: TokenGateResult;
}

export default function UserNFTStaking({
    user,
    player,
    collection,
    tokenGateResult,
}: UserNFTStakingProps) {
    const {
        stakeRewards,
        userStakingTokens,
        isUserStakingTokensLoading,
        userStakeRewardLogs,
        userStakingTokensError,
    } = useStakingGet({
        getStakeRewardInput: {
            collectionAddress: collection.address,
        },
        getUserStakingTokensInput: { userId: user?.id ?? "" },
        getUserStakeRewardLogsInput: {
            userId: user?.id ?? "",
        },
    });

    console.log("User Stake Reward Logs", userStakeRewardLogs);

    const { stake, unstake, claimStakeReward } = useStakingSet();

    const toast = useToast();
    const { startLoading, endLoading } = useLoading();

    const [openStakePopup, setOpenStakePopup] = useState(false);
    const [openUnstakePopup, setOpenUnstakePopup] = useState(false);
    const [showClaimedRewards, setShowClaimedRewards] = useState(false);
    const [claimedAssets, setClaimedAssets] = useState<
        { asset: Asset | null; amount: number }[]
    >([]);

    const nextNotDistributedReward = useMemo(() => {
        const rewardable = stakeRewards
            ?.filter((r) => {
                const index = userStakeRewardLogs?.findIndex(
                    (l) => l.stakeRewardId === r.id
                );

                const isRewardable = index === -1;
                return isRewardable;
            })
            .sort((a, b) => Number(a.stakeDuration) - Number(b.stakeDuration));

        return rewardable?.[0];
    }, [stakeRewards, userStakeRewardLogs]);

    const canClaimReward = useMemo(() => {
        return (
            userStakeRewardLogs &&
            userStakeRewardLogs.filter((l: StakeRewardLog) => !l.isClaimed)
                .length > 0
        );
    }, [userStakeRewardLogs]);

    const handleClaimReward = async () => {
        if (!player) {
            toast.error("Player not found");
            return;
        }
        if (!userStakeRewardLogs || userStakeRewardLogs.length === 0) {
            toast.error("No reward logs to claim");
            return;
        }

        startLoading();
        try {
            console.log("Claim Reward", {
                player,
                stakeRewardLogs: userStakeRewardLogs,
            });
            const result = await claimStakeReward({
                player,
                stakeRewardLogs: userStakeRewardLogs,
            });

            console.log("Claim Reward Result", result);

            if (result.error) {
                toast.error(result.error);
            } else {
                setClaimedAssets(result.rewardedAssets);
                setShowClaimedRewards(true);
                toast.success(`Reward ${result.totalRewardAmount} claimed`);
            }
        } catch (e) {
            toast.error("Error claiming reward");
        }
        endLoading();
    };

    const handleStake = async () => {
        startLoading();
        if (!user || !user.id || !player) {
            endLoading();
            toast.error(
                "Please login to stake your NFTs. If you have already logged in, please refresh the page."
            );
            return;
        }

        const tokenIds = tokenGateResult.data?.tokenIds ?? [];
        const collectionAddress = collection.address;

        if (!tokenIds || tokenIds.length === 0 || !collectionAddress) {
            endLoading();
            toast.error(
                "Cannot find any tokens for staking. Please purchase the NFT first. If you have already purchased the NFT, please contact support."
            );
            return;
        }

        const stakeResult = await stake({
            userId: user.id,
            collectionAddress,
            tokenIds,
        });

        if (stakeResult.success) {
            toast.success(
                `${tokenIds.length} NFTs staked successfully! You can now start earning rewards.`
            );
        } else {
            toast.error(stakeResult.message ?? "Failed to stake NFTs.");
        }
        endLoading();
    };

    const handleUnstake = async () => {
        startLoading();
        setOpenUnstakePopup(false);
        if (!user || !user.id || !player) {
            endLoading();
            toast.error(
                "Please login to unstake your NFTs. If you have already logged in, please refresh the page."
            );
            return;
        }
        const tokenIds =
            userStakingTokens?.map(
                (t: NFT & { stakeRewardLogs: StakeRewardLog[] }) => t.tokenId
            ) ?? [];
        const collectionAddress = collection.address;

        if (!tokenIds.length || !collectionAddress) {
            endLoading();
            toast.error("No staked tokens found.");
            return;
        }

        const unstakeResult = await unstake({
            userId: user.id,
            collectionAddress,
            tokenIds,
        });

        if (unstakeResult.success) {
            toast.success("NFTs unstaked successfully!");
        } else {
            toast.error(unstakeResult.message ?? "Failed to unstake NFTs.");
        }
        endLoading();
    };

    return (
        <div className="w-full flex flex-col items-center justify-center">
            <Popup
                open={showClaimedRewards}
                onClose={() => setShowClaimedRewards(false)}
                width="400px"
            >
                <div className="flex flex-col items-center py-6">
                    <h2 className="text-2xl font-bold mb-4 text-yellow-400 animate-bounce">
                        🎉 Reward Claimed! 🎉
                    </h2>
                    <div className="flex flex-col gap-4 w-full">
                        {claimedAssets.map(({ asset, amount }, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-3 bg-gray-800 rounded-lg p-3 shadow-md"
                            >
                                {asset?.iconUrl ? (
                                    <img
                                        src={asset.iconUrl}
                                        alt={asset.name}
                                        className="w-10 h-10 rounded-full border-2 border-yellow-300"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-2xl">
                                        ❓
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="font-semibold text-lg text-white">
                                        {asset?.name ?? "Unknown Asset"}
                                    </div>
                                    <div className="text-yellow-300 font-bold text-xl">
                                        +{amount}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        className="mt-6 px-6 py-2 bg-yellow-400 text-black font-bold rounded-full shadow-lg hover:bg-yellow-300 transition"
                        onClick={() => setShowClaimedRewards(false)}
                    >
                        Close
                    </button>
                </div>
            </Popup>
            <Popup
                open={openUnstakePopup}
                onClose={() => setOpenUnstakePopup(false)}
                width="500px"
            >
                <div className="w-full flex flex-col items-center justify-center px-4 py-6">
                    <h2 className="w-full text-center text-2xl font-extrabold mb-4 tracking-tight">
                        Unstake NFTs
                    </h2>
                    <div className="w-full flex flex-col gap-4 bg-[rgba(255,255,255,0.07)] rounded-xl p-5 shadow-inner border border-[rgba(255,255,255,0.08)]">
                        <div className="flex items-start gap-3">
                            <span className="text-blue-400 text-xl mt-0.5">
                                🔓
                            </span>
                            <div>
                                <span className="font-semibold text-blue-300">
                                    Unstake Warning
                                </span>
                                <div className="text-sm text-gray-200 mt-0.5">
                                    If you unstake now,{" "}
                                    <b>you will not receive rewards</b> for this
                                    period.
                                    <br />
                                    Are you sure you want to unstake your NFTs?
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="w-full flex flex-row gap-3 mt-5">
                        <Button
                            className="flex-1 rounded-full"
                            variant="outline"
                            onClick={() => setOpenUnstakePopup(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 rounded-full"
                            onClick={handleUnstake}
                        >
                            Unstake
                        </Button>
                    </div>
                </div>
            </Popup>
            <Popup
                open={openStakePopup}
                onClose={() => setOpenStakePopup(false)}
                width="500px"
            >
                <div className="w-full flex flex-col items-center justify-center px-4 py-6">
                    <h2 className="w-full text-center text-2xl font-extrabold mb-4 tracking-tight">
                        Stake Your NFTs
                    </h2>
                    <div className="w-full flex flex-col gap-4 bg-[rgba(255,255,255,0.07)] rounded-xl p-5 shadow-inner border border-[rgba(255,255,255,0.08)]">
                        <div className="flex items-start gap-3">
                            <span className="text-yellow-400 text-xl mt-0.5">
                                ⏳
                            </span>
                            <div>
                                <span className="font-semibold text-yellow-300">
                                    Instant Lockup
                                </span>
                                <div className="text-sm text-gray-200 mt-0.5">
                                    Staking starts immediately, and the NFT is{" "}
                                    <b>locked</b>.<br />
                                    <span className="text-yellow-200">
                                        Transfer is not possible.
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-green-400 text-xl mt-0.5">
                                🎁
                            </span>
                            <div>
                                <span className="font-semibold text-green-300">
                                    Reward
                                </span>
                                <div className="text-sm text-gray-200 mt-0.5">
                                    You can receive <b>rewards</b> based on the
                                    staking period.
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-blue-400 text-xl mt-0.5">
                                🔓
                            </span>
                            <div>
                                <span className="font-semibold text-blue-300">
                                    Unstake Anytime
                                </span>
                                <div className="text-sm text-gray-200 mt-0.5">
                                    You can <b>Unstake</b> at any time,
                                    <br />
                                    <span className="text-blue-200">
                                        but you will <b>not receive rewards</b>{" "}
                                        if you unstake early.
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="w-full h-[1px] bg-[rgba(255,255,255,0.12)] my-5" />
                    <div className="w-full flex flex-col items-center">
                        <div className="text-xs text-gray-400 mb-3 text-center">
                            * Please check the staking policy before proceeding.
                        </div>
                        <Button
                            className="w-full rounded-full py-3 text-lg font-bold shadow-md"
                            onClick={handleStake}
                        >
                            Stake
                        </Button>
                    </div>
                </div>
            </Popup>
            {isUserStakingTokensLoading ? (
                <PartialLoading text="Loading..." size="sm" />
            ) : userStakingTokensError ? (
                <div className="w-full flex flex-col items-center justify-center">
                    <p className="text-red-500">Error loading staking tokens</p>
                </div>
            ) : (
                <div
                    className={cn(
                        "w-full flex flex-col",
                        getResponsiveClass(25).textClass
                    )}
                >
                    <h2 className="text-left">Staking</h2>
                    <div
                        className={cn(
                            "w-full flex flex-col p-3",
                            getResponsiveClass(15).textClass
                        )}
                    >
                        <div className="h-[1px] w-full bg-[rgba(255,255,255,0.5)] my-3" />
                        <div className={cn("w-full flex flex-row", "gap-3")}>
                            <p className="font-semibold">Start Date</p>
                            <p className="flex-1 text-[rgba(255,255,255,0.6)]">
                                {userStakingTokens?.[0]?.stakedAt
                                    ? new Date(
                                          userStakingTokens?.[0]?.stakedAt
                                      ).toLocaleDateString()
                                    : "Not staked yet"}
                            </p>
                        </div>
                        <div className="h-[1px] w-full bg-[rgba(255,255,255,0.5)] my-3" />
                        <div className={cn("w-full flex flex-row", "gap-3")}>
                            <p className="font-semibold">Next Reward Date</p>
                            <p className="flex-1 text-[rgba(255,255,255,0.6)]">
                                {userStakingTokens?.[0]?.stakedAt &&
                                nextNotDistributedReward
                                    ? new Date(
                                          userStakingTokens[0].stakedAt.getTime() +
                                              Number(
                                                  nextNotDistributedReward.stakeDuration
                                              )
                                      ).toLocaleDateString()
                                    : "Not staked yet"}
                            </p>
                        </div>
                        <div className="h-[1px] w-full bg-[rgba(255,255,255,0.5)] my-3" />
                        <div className={cn("w-full flex flex-row", "gap-3")}>
                            <p className="font-semibold">Reward Amount</p>
                            <p className="flex-1 text-[rgba(255,255,255,0.6)]">
                                {nextNotDistributedReward
                                    ? nextNotDistributedReward.amount
                                    : "Not staked yet"}
                            </p>
                        </div>
                    </div>

                    <div className="w-full flex flex-col gap-3 mt-3">
                        {userStakingTokens && userStakingTokens.length > 0 ? (
                            <>
                                <Button
                                    className={cn(
                                        "w-full rounded-full",
                                        !canClaimReward && "opacity-50",
                                        canClaimReward &&
                                            "animate-pulse bg-orange-600"
                                    )}
                                    onClick={() => {
                                        handleClaimReward();
                                    }}
                                    disabled={
                                        !canClaimReward ||
                                        claimedAssets.length > 0
                                    }
                                >
                                    Claim Reward
                                </Button>
                                <Button
                                    className="w-full rounded-full"
                                    onClick={() => {
                                        setOpenUnstakePopup(true);
                                    }}
                                >
                                    Unstake
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    className="w-full rounded-full"
                                    onClick={() => {
                                        setOpenStakePopup(true);
                                    }}
                                >
                                    Stake
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
