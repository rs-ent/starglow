/// components/user/User.Rewards.Modal.Card.tsx

"use client";

import { memo, useCallback, useState } from "react";

import { formatDistanceToNow } from "date-fns";
import { XIcon } from "lucide-react";

import { useRewardsLogsGet } from "@/app/hooks/useRewardsLogs";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import Funds from "../atoms/Funds";
import PartialLoading from "../atoms/PartialLoading";
import { Button } from "../ui/button";

import type { PlayerAssetWithAsset } from "@/app/actions/playerAssets";

interface UserRewardsModalCardProps {
    playerId?: string;
    reward: PlayerAssetWithAsset;
    closeModal: () => void;
}

function UserRewardsModalCard({
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

    const togglePointsMissing = useCallback(() => {
        setShowPointsMissing((prev) => !prev);
    }, []);

    const formatDate = useCallback((date: Date) => {
        const formattedDate = date.toLocaleDateString();
        const formattedTime = date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
        return `${formattedDate} ${formattedTime}`;
    }, []);

    const getRelativeTime = useCallback((date: Date) => {
        return formatDistanceToNow(date, { addSuffix: true });
    }, []);

    return (
        <div
            className={cn(
                "w-full max-w-[1000px] h-full max-h-[90vh] mx-auto",
                "flex flex-col",
                "border border-[rgba(255,255,255,0.1)]",
                "bg-gradient-to-br from-[#09021B] to-[#311473]",
                "rounded-[18px]",
                "shadow-lg",
                "relative",
                "overflow-hidden"
            )}
        >
            {/* 닫기 버튼 */}
            <button
                onClick={closeModal}
                className={cn(
                    "absolute top-4 right-4 z-20",
                    "p-2 rounded-lg",
                    "hover:bg-white/10 transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-white/30"
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

            {/* 포인트 미싱 정보 팝업 */}
            {showPointsMissing && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#5321C6] rounded-[18px] p-5 animate-fadeIn">
                    <div className="w-full max-w-[500px] max-h-full overflow-y-auto">
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-center mb-2">
                                <img
                                    src="/ui/information.svg"
                                    alt="info"
                                    className={
                                        getResponsiveClass(50).frameClass
                                    }
                                    loading="lazy"
                                />
                            </div>
                            <p
                                className={cn(
                                    getResponsiveClass(30).textClass,
                                    "font-bold"
                                )}
                            >
                                {`For the Starglowers who collected 'Points' through telegram mini app:`}
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
                                onClick={togglePointsMissing}
                            >
                                Okay, got it
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col h-full max-h-full overflow-hidden">
                {/* 헤더 섹션 */}
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
                            "font-bold mb-3"
                        )}
                        id="reward-modal-title"
                    >
                        {reward.asset.name}
                    </h2>

                    <div className="flex justify-center mb-3">
                        <img
                            src="/elements/el03.svg"
                            alt="el03"
                            className={getResponsiveClass(40).frameClass}
                            loading="lazy"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                    "/elements/el03.svg";
                            }}
                        />
                    </div>

                    <div className="flex flex-col items-center gap-1">
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
                                    "focus:outline-none focus:ring-2 focus:ring-white/30 rounded-sm",
                                    "mt-1"
                                )}
                                onClick={togglePointsMissing}
                            >
                                points are missing? →
                            </button>
                        )}
                    </div>
                </header>

                {/* 보상 히스토리 섹션 */}
                <section
                    className={cn(
                        "flex-1",
                        "min-h-0",
                        "overflow-hidden",
                        "px-6 pb-6"
                    )}
                >
                    <div
                        className={cn(
                            "h-full mt-[20px]",
                            "scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                        )}
                    >
                        <div className="max-w-[800px] mx-auto pb-2">
                            <div
                                className={cn(
                                    "space-y-2 h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] xl:h-[500px] overflow-y-auto",
                                    "scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent",
                                    "pb-6"
                                )}
                            >
                                {/* 로딩 상태 */}
                                {isRewardsLogsLoading && (
                                    <div className="py-8">
                                        <PartialLoading text="Loading reward history..." />
                                    </div>
                                )}

                                {/* 에러 상태 */}
                                {rewardsLogsError && (
                                    <div className="py-8 text-center">
                                        <p className="text-red-400">
                                            Failed to load reward history
                                        </p>
                                        <button
                                            className="mt-2 text-sm text-white/60 underline underline-offset-2"
                                            onClick={() =>
                                                window.location.reload()
                                            }
                                        >
                                            Try again
                                        </button>
                                    </div>
                                )}

                                {/* 데이터 없음 상태 */}
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

                                {/* 보상 히스토리 목록 */}
                                {rewardsLogs?.map((log) => {
                                    return (
                                        <article
                                            key={log.id}
                                            className={cn(
                                                "gradient-border",
                                                "rounded-[16px]",
                                                "bg-gradient-to-br from-black/20 to-black/40",
                                                "p-4",
                                                "backdrop-blur-sm",
                                                "transition-all duration-300",
                                                "hover:bg-gradient-to-br hover:from-white/10 hover:to-white/20"
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p
                                                        className={cn(
                                                            getResponsiveClass(
                                                                15
                                                            ).textClass,
                                                            "font-semibold",
                                                            "line-clamp-2"
                                                        )}
                                                    >
                                                        {log.reason}
                                                    </p>
                                                    <div className="flex items-center mt-1">
                                                        <time
                                                            className={cn(
                                                                getResponsiveClass(
                                                                    10
                                                                ).textClass,
                                                                "text-white/50",
                                                                "block"
                                                            )}
                                                            title={formatDate(
                                                                new Date(
                                                                    log.createdAt
                                                                )
                                                            )}
                                                        >
                                                            {getRelativeTime(
                                                                new Date(
                                                                    log.createdAt
                                                                )
                                                            )}
                                                        </time>
                                                    </div>
                                                </div>

                                                <div
                                                    className={cn(
                                                        getResponsiveClass(15)
                                                            .textClass,
                                                        "font-main",
                                                        (log.balanceAfter ??
                                                            0) -
                                                            (log.balanceBefore ??
                                                                0) >=
                                                            0
                                                            ? "text-green-400"
                                                            : "text-red-400"
                                                    )}
                                                >
                                                    <div
                                                        className={cn(
                                                            "flex-shrink-0",
                                                            "text-right"
                                                        )}
                                                    >
                                                        {(log.balanceAfter ??
                                                            0) -
                                                            (log.balanceBefore ??
                                                                0) >=
                                                        0
                                                            ? "+"
                                                            : "-"}
                                                        {Math.abs(
                                                            log.amount
                                                        ).toLocaleString()}{" "}
                                                        {log.asset?.symbol}
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

// 메모이제이션으로 불필요한 리렌더링 방지
export default memo(UserRewardsModalCard);
