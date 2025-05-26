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
    playerId?: string;
    reward: PlayerAssetWithAsset;
    closeModal: () => void;
}

export default function UserRewardsModalCard({
    playerId,
    reward,
    closeModal,
}: UserRewardsModalCardProps) {
    const [showPointsMissing, setShowPointsMissing] = useState(false);

    const { rewardsLogs, isRewardsLogsLoading, rewardsLogsError } =
        useRewardsLogsGet({
            getRewardsLogsInput: {
                playerId: playerId ?? "",
                assetId: reward.asset.id,
            },
        });

    return (
        <div
            className={cn(
                "w-full max-w-[1000px] h-full max-h-full mx-auto",
                "flex flex-col",
                "border border-[rgba(255,255,255,0.1)]",
                "bg-gradient-to-br from-[#09021B] to-[#311473]",
                "rounded-[18px]",
                "shadow-lg",
                "relative",
                "overflow-hidden"
            )}
        >
            <button
                onClick={closeModal}
                className={cn(
                    "absolute top-4 right-4 z-20",
                    "p-2 rounded-lg",
                    "hover:bg-white/10 transition-colors"
                )}
                aria-label="Close modal"
            >
                <XIcon
                    className={cn(
                        getResponsiveClass(25).frameClass,
                        "text-white"
                    )}
                />
            </button>

            {showPointsMissing && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#5321C6] rounded-[18px] p-5">
                    <div className="w-full max-w-[500px] max-h-full overflow-y-auto">
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-center mb-2">
                                <img
                                    src="/ui/information.svg"
                                    alt="info"
                                    className={
                                        getResponsiveClass(50).frameClass
                                    }
                                />
                            </div>
                            <p
                                className={cn(
                                    getResponsiveClass(30).textClass,
                                    "font-bold"
                                )}
                            >
                                For the Starglowers who collected 'Points'
                                through telegram mini app:
                            </p>
                            <p className={getResponsiveClass(25).textClass}>
                                <strong>Points</strong> are officially all
                                integrated into <strong>SGP</strong> from
                                05/20/2025 and no longer used. Rewards for
                                mission complete will be given in{" "}
                                <strong>SGP</strong>.
                            </p>
                            <p className={getResponsiveClass(25).textClass}>
                                They have the same value and are available to
                                exchange into <strong>SGT</strong> after token
                                generation.
                            </p>
                            <Button
                                className={cn(
                                    getResponsiveClass(25).textClass,
                                    "mt-4"
                                )}
                                onClick={() => setShowPointsMissing(false)}
                            >
                                Okay, got it
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col h-full max-h-full overflow-hidden">
                <header
                    className={cn(
                        "flex-shrink-0 flex-grow-0",
                        "pt-12 pb-6 px-6",
                        "text-center"
                    )}
                >
                    <h2
                        className={cn(
                            getResponsiveClass(35).textClass,
                            "font-bold mb-6"
                        )}
                    >
                        {reward.asset.name}
                    </h2>

                    <div className="flex justify-center mb-6">
                        <img
                            src="/elements/el03.svg"
                            alt={reward.asset.name}
                            className={getResponsiveClass(40).frameClass}
                        />
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <Funds
                            funds={reward.balance}
                            fundsLabel={reward.asset.symbol}
                            fundsIcon={reward.asset.iconUrl ?? undefined}
                            frameSize={30}
                            textSize={30}
                            gapSize={20}
                            paddingSize={15}
                            className="bg-[rgba(255,255,255,0.1)]"
                        />

                        {reward.asset.name === "SGP" && (
                            <button
                                className={cn(
                                    getResponsiveClass(15).textClass,
                                    "text-[rgba(255,255,255,0.4)]",
                                    "underline underline-offset-2",
                                    "cursor-pointer",
                                    "hover:text-white/60 transition-colors",
                                    "mt-1"
                                )}
                                onClick={() => setShowPointsMissing(true)}
                            >
                                points are missing? →
                            </button>
                        )}
                    </div>
                </header>

                <section
                    className={cn(
                        "flex-1",
                        "min-h-0",
                        "overflow-hidden",
                        "px-6 pb-6"
                    )}
                >
                    <div className={cn("h-full mt-[20px]", "overflow-y-auto")}>
                        <div className="max-w-[800px] mx-auto pb-2">
                            <div className="space-y-3 h-[300px]">
                                {isRewardsLogsLoading && (
                                    <div className="py-8">
                                        <PartialLoading
                                            text="Loading reward history..."
                                            size="sm"
                                        />
                                    </div>
                                )}

                                {rewardsLogsError && (
                                    <div className="py-8 text-center">
                                        <p className="text-red-400">
                                            Failed to load reward history
                                        </p>
                                    </div>
                                )}

                                {!isRewardsLogsLoading &&
                                    !rewardsLogsError &&
                                    (!rewardsLogs ||
                                        rewardsLogs.length === 0) && (
                                        <div className="py-8 text-center">
                                            <p
                                                className={cn(
                                                    getResponsiveClass(15)
                                                        .textClass,
                                                    "text-white/40"
                                                )}
                                            >
                                                No reward history yet
                                            </p>
                                        </div>
                                    )}

                                {rewardsLogs?.map((log) => (
                                    <article
                                        key={log.id}
                                        className={cn(
                                            "gradient-border",
                                            "rounded-[16px]",
                                            "bg-gradient-to-br from-black/20 to-black/40",
                                            "p-4",
                                            "backdrop-blur-sm"
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p
                                                    className={cn(
                                                        getResponsiveClass(15)
                                                            .textClass,
                                                        "font-semibold",
                                                        "line-clamp-2"
                                                    )}
                                                >
                                                    {log.reason}
                                                </p>
                                                <time
                                                    className={cn(
                                                        getResponsiveClass(10)
                                                            .textClass,
                                                        "text-white/50",
                                                        "mt-1 block"
                                                    )}
                                                >
                                                    {new Date(
                                                        log.createdAt
                                                    ).toLocaleDateString()}{" "}
                                                    {new Date(
                                                        log.createdAt
                                                    ).toLocaleTimeString()}
                                                </time>
                                            </div>

                                            <div
                                                className={cn(
                                                    getResponsiveClass(15)
                                                        .textClass,
                                                    "font-main"
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "flex-shrink-0",
                                                        "text-right"
                                                    )}
                                                >
                                                    {log.amount >= 0
                                                        ? "+"
                                                        : "-"}
                                                    {log.amount.toLocaleString()}{" "}
                                                    {log.asset?.symbol}
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
