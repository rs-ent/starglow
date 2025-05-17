/// components/user/User.NFT.Detail.Staking.tsx

"use client";

import { useStakingGet, useStakingSet } from "@/app/hooks/useStaking";
import { Player } from "@prisma/client";
import { User } from "next-auth";
import PartialLoading from "../atoms/PartialLoading";

import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

interface UserNFTStakingProps {
    user: User | null;
    player: Player | null;
}

export default function UserNFTStaking({ user, player }: UserNFTStakingProps) {
    const {
        userStakingTokens,
        isUserStakingTokensLoading,
        userStakingTokensError,
    } = useStakingGet({
        getUserStakingTokensInput: { userId: user?.id ?? "" },
    });

    console.log("User Staking Tokens", userStakingTokens);

    return (
        <div className="w-full flex flex-col items-center justify-center">
            {isUserStakingTokensLoading ? (
                <PartialLoading text="Loading..." size="sm" />
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
                            <p className="font-semibold">End Date</p>
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
                            <p className="font-semibold">Staked NFT</p>
                            <p className="flex-1 text-[rgba(255,255,255,0.6)]">
                                {userStakingTokens?.[0]?.stakedAt
                                    ? new Date(
                                          userStakingTokens?.[0]?.stakedAt
                                      ).toLocaleDateString()
                                    : "Not staked yet"}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
