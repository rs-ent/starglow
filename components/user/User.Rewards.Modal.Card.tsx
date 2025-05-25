/// components/user/User.Rewards.Modal.Card.tsx

import { useState } from "react";
import { PlayerAssetWithAsset } from "./User.Rewards";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { XIcon } from "lucide-react";
import Funds from "../atoms/Funds";
import { Button } from "../ui/button";
import { useRewardsLogsGet } from "@/app/hooks/useRewardsLogs";
import { Player } from "@prisma/client";
import PartialLoading from "../atoms/PartialLoading";

interface UserRewardsModalCardProps {
    player: Player | null;
    reward: PlayerAssetWithAsset;
    closeModal: () => void;
}

export default function UserRewardsModalCard({
    player,
    reward,
    closeModal,
}: UserRewardsModalCardProps) {
    const [showPointsMissing, setShowPointsMissing] = useState(false);

    const { rewardsLogs, isRewardsLogsLoading, rewardsLogsError } =
        useRewardsLogsGet({
            getRewardsLogsInput: {
                playerId: player?.id ?? "",
                assetId: reward.asset.id,
            },
        });

    return (
        <div
            className={cn(
                "w-[95%] h-[60%] min-h-[300px] mx-auto",
                "border border-[rgba(255,255,255,0.1)]",
                "bg-gradient-to-br from-[#09021B] to-[#311473]",
                "rounded-[18px]",
                "relative flex flex-col items-center justify-center",
                "shadow-lg"
            )}
        >
            <div className="absolute top-4 right-4">
                <XIcon
                    className={cn(
                        getResponsiveClass(30).frameClass,
                        "cursor-pointer",
                        "text-white"
                    )}
                    onClick={closeModal}
                />
            </div>

            <div className="flex flex-col items-center justify-center my-[50px] w-full p-1">
                <h2
                    className={cn(
                        getResponsiveClass(40).textClass,
                        "mb-[40px]"
                    )}
                >
                    {reward.asset.name}
                </h2>

                <div className="mb-[20px]">
                    <img
                        src="/elements/el03.svg"
                        alt="el03"
                        className={cn(getResponsiveClass(45).frameClass)}
                    />
                </div>

                <Funds
                    funds={reward.balance}
                    fundsLabel={reward.asset.symbol}
                    fundsIcon={reward.asset.iconUrl ?? undefined}
                    frameSize={35}
                    textSize={35}
                    gapSize={30}
                    paddingSize={20}
                    className="bg-[rgba(255,255,255,0.1)]"
                />
                {reward.asset.name === "SGP" && (
                    <p
                        className={cn(
                            getResponsiveClass(15).textClass,
                            "text-[rgba(255,255,255,0.4)] mt-[10px] underline"
                        )}
                        onClick={() => setShowPointsMissing(!showPointsMissing)}
                    >
                        {"points are missing? >"}
                    </p>
                )}

                {showPointsMissing && (
                    <div className="absolute inset-0 h-full w-full flex items-center justify-center bg-[#5321C6] rounded-[18px] z-50 overflow-y-auto">
                        <div className="flex flex-col justify-center p-5 gap-5 text-left">
                            <div className="flex justify-center">
                                <img
                                    src="/ui/info.svg"
                                    alt="info"
                                    className={cn(
                                        getResponsiveClass(50).frameClass
                                    )}
                                />
                            </div>
                            <p
                                className={cn(
                                    getResponsiveClass(30).textClass,
                                    "font-bold"
                                )}
                            >
                                For the Starglowers who collected 'Points'
                                through telegram mini app :
                            </p>
                            <p className={cn(getResponsiveClass(25).textClass)}>
                                <strong>Points</strong> are officially all
                                integrated into <strong>SGP</strong> from
                                05/20/2025 and no longer used. Rewards for
                                mission complete will be given in{" "}
                                <strong>SGP</strong>.
                            </p>
                            <p className={cn(getResponsiveClass(25).textClass)}>
                                They have the same value and are available to
                                exchange into <strong>SGT</strong> after token
                                generation.
                            </p>
                            <Button
                                className={cn(getResponsiveClass(25).textClass)}
                                onClick={() => setShowPointsMissing(false)}
                            >
                                Okay, got it
                            </Button>
                        </div>
                    </div>
                )}

                <div
                    className={cn(
                        "flex flex-col items-stretch justify-center",
                        "max-h-[50vh]",
                        "w-full max-w-[800px] min-w-0",
                        "overflow-y-auto mt-[50px] gap-2",
                        getResponsiveClass(30).paddingClass
                    )}
                >
                    {isRewardsLogsLoading && (
                        <PartialLoading text="Loading rewards logs" size="sm" />
                    )}
                    {rewardsLogsError && <p>Error loading rewards logs</p>}
                    {rewardsLogs?.map((log) => {
                        console.log("Log", log);
                        return (
                            <div
                                key={log.id}
                                className={cn(
                                    "gradient-border",
                                    "rounded-[18px]",
                                    "bg-gradient-to-br from-[rgba(0,0,0,0.1)] to-[rgba(0,0,0,0.3)]",
                                    "p-[20px]"
                                )}
                            >
                                <div
                                    className={cn(
                                        "flex items-center justify-between",
                                        getResponsiveClass(30).gapClass
                                    )}
                                >
                                    <div className="flex flex-col gap-[2px]">
                                        <p
                                            className={cn(
                                                getResponsiveClass(15)
                                                    .textClass,
                                                "font-bold"
                                            )}
                                        >
                                            {log.reason}
                                        </p>
                                        <p
                                            className={cn(
                                                getResponsiveClass(5).textClass,
                                                "text-[rgba(255,255,255,0.5)]"
                                            )}
                                        >
                                            {log.createdAt.toLocaleString()}
                                        </p>
                                    </div>
                                    <div
                                        className={cn(
                                            "flex flex-row items-end justify-center text-right",
                                            getResponsiveClass(15).textClass
                                        )}
                                    >
                                        <h3>
                                            {log.amount > 0 ? "+ " : "- "}
                                            {log.amount} {log.asset?.symbol}
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
