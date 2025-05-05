/// components/atoms/Quests.Button.tsx

import { useState, useEffect } from "react";
import { Quest, QuestLog, Player } from "@prisma/client";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { useAssetsGet } from "@/app/hooks/useAssets";
import { useQuestSet } from "@/app/hooks/useQuest";
import { useToast } from "@/app/hooks/useToast";
import { TokenGatingResult } from "@/app/actions/quests";
import { useLoading } from "@/app/hooks/useLoading";
import { formatWaitTime } from "@/lib/utils/format";
import Button from "@/components/atoms/Button";
import Countdown from "@/components/atoms/Countdown";
import { AdvancedTokenGateResult } from "@/app/actions/blockchain";
interface QuestsButtonProps {
    player: Player;
    quest: Quest;
    questLog?: QuestLog | null;
    frameSize?: number;
    assetSize?: number;
    textSize?: number;
    infoTextSize?: number;
    assetTextSize?: number;
    paddingSize?: number;
    gapSize?: number;
    arrowSize?: number;
    tokenGatingResult?: AdvancedTokenGateResult | null;
    permission?: boolean;
}

export default function QuestsButton({
    player,
    quest,
    questLog,
    frameSize = 45,
    textSize = 25,
    infoTextSize = 15,
    assetSize = 20,
    assetTextSize = 15,
    paddingSize = 40,
    gapSize = 40,
    arrowSize = 30,
    tokenGatingResult,
    permission = false,
}: QuestsButtonProps) {
    const toast = useToast();
    const { startLoading, endLoading } = useLoading();

    const { asset } = useAssetsGet({
        getAssetInput: {
            id: quest.rewardAssetId || "",
        },
    });

    const { completeQuest, claimQuestReward } = useQuestSet();

    const [waitDate, setWaitDate] = useState<Date | null>(null);

    const handleCompleteQuest = async () => {
        if (!permission) {
            return;
        }

        if (status === "completed") {
            return;
        }

        if (status === "claimed") {
            return;
        }

        if (!quest.url) {
            return;
        }

        if (waitDate) {
            const now = new Date().getTime();
            if (now < waitDate.getTime()) {
                toast.info(
                    `You can complete this quest again ${formatWaitTime(
                        Math.floor((waitDate.getTime() - now) / 1000)
                    )} after the last completion.`
                );
                return;
            }
        }

        let tokenGating: TokenGatingResult = {
            success: false,
            data: {
                hasToken: false,
                tokenCount: 0,
                ownerWallets: [],
            },
        };

        if (quest.needTokenAddress) {
            if (tokenGatingResult && tokenGatingResult.data) {
                tokenGating = {
                    success: tokenGatingResult.success,
                    data: {
                        hasToken:
                            tokenGatingResult.data.hasToken[
                                quest.needTokenAddress
                            ] ?? false,
                        tokenCount:
                            tokenGatingResult.data.tokenCount[
                                quest.needTokenAddress
                            ] ?? 0,
                        ownerWallets:
                            tokenGatingResult.data.ownerWallets[
                                quest.needTokenAddress
                            ] ?? [],
                    },
                } as TokenGatingResult;
            }
        } else {
            tokenGating = {
                success: true,
                data: {
                    hasToken: true,
                    tokenCount: 0,
                    ownerWallets: [],
                },
            } as TokenGatingResult;
        }

        window.open(quest.url, "_blank");
        const result = await completeQuest({
            quest,
            player,
            tokenGating: tokenGating || undefined,
        });
        console.log(result);
        if (result.success) {
            toast.success("Quest completed! Please claim your reward.");
        }
    };

    const handleClaimQuestReward = async () => {
        if (!permission) {
            return;
        }

        if (!questLog) {
            return;
        }
        startLoading();
        const result = await claimQuestReward({ questLog, player });
        endLoading();
        if (result.success) {
            toast.success(`+${quest.rewardAmount} ${asset?.name} claimed!`);
        } else {
            toast.error(
                "Failed to claim quest reward. Please try again. If the problem persists, please contact support."
            );
        }
    };

    const [status, setStatus] = useState<"completed" | "claimed" | "default">(
        "default"
    );
    const [buttonStyle, setButtonStyle] = useState<string>(
        "gradient-border morp-glass-1"
    );

    useEffect(() => {
        if (questLog?.completed) {
            setStatus("completed");
            setButtonStyle(
                "border-2 border-[rgba(139,92,246,0.9)] animate-pulse"
            );
        }
        if (questLog?.isClaimed) {
            setStatus("claimed");
            setButtonStyle(
                "opacity-40 bg-gradient-to-br from-[rgba(0,0,0,0.2)] to-[rgba(0,0,0,0.05)]"
            );
        }
        if (
            quest.repeatable &&
            quest.repeatableInterval &&
            quest.repeatableInterval > 0
        ) {
            const lastCompletedAt =
                questLog?.completedDates && questLog.completedDates.length > 0
                    ? Math.max(
                          ...questLog.completedDates.map((date) =>
                              new Date(date).getTime()
                          )
                      )
                    : 0;

            const endDate = new Date(
                lastCompletedAt + quest.repeatableInterval
            );
            setWaitDate(endDate);
        }
    }, [questLog]);

    const frameClass = getResponsiveClass(frameSize).frameClass;
    const textClass = getResponsiveClass(textSize).textClass;
    const paddingClass = getResponsiveClass(paddingSize).paddingClass;
    const gapClass = getResponsiveClass(gapSize).gapClass;
    const arrowClass = getResponsiveClass(arrowSize).frameClass;

    const assetFrameClass = getResponsiveClass(assetSize).frameClass;
    const assetTextClass = getResponsiveClass(assetTextSize).textClass;

    return (
        <div
            onClick={handleCompleteQuest}
            className={cn(
                buttonStyle,
                "flex flex-row items-center justify-between rounded-3xl",
                "cursor-pointer backdrop-blur-xs",
                !permission && "cursor-not-allowed",
                paddingClass
            )}
        >
            <div className={cn("flex flex-row items-center", gapClass)}>
                <img
                    src={quest.icon || "/icons/quests/link.svg"}
                    alt={quest.title}
                    className={cn(frameClass)}
                />
                <div className="flex flex-col items-start gap-[3px]">
                    <div className={cn(textClass, "break-words")}>
                        {quest.title}
                    </div>
                    <div className="flex flex-row justify-center items-center gap-1 opacity-70">
                        <div className={cn(textClass)}>
                            <img
                                src={asset?.iconUrl || "/ui/assets.svg"}
                                alt={asset?.name || ""}
                                className={cn(assetFrameClass)}
                            />
                        </div>
                        <div className={cn(assetTextClass, "font-bold")}>
                            {quest.rewardAmount} {asset?.name || ""}
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex flex-row items-center gap-2">
                {quest.repeatable && (
                    <div className="flex flex-col items-end text-right gap-[2px]">
                        {quest.repeatableCount && (
                            <div
                                className={cn(
                                    getResponsiveClass(infoTextSize).textClass,
                                    "opacity-85"
                                )}
                            >
                                {questLog?.repeatCount || 0}/
                                {quest.repeatableCount}
                            </div>
                        )}
                        {waitDate &&
                            quest.repeatableCount &&
                            quest.repeatableCount >
                                (questLog?.repeatCount || 0) &&
                            waitDate.getTime() > new Date().getTime() && (
                                <Countdown size={5} endDate={waitDate} />
                            )}
                    </div>
                )}
                {status === "completed" ? (
                    <Button onClick={handleClaimQuestReward}>Claim</Button>
                ) : status === "claimed" ? (
                    <img
                        src="/ui/checked.svg"
                        alt="checked"
                        className={cn(arrowClass)}
                    />
                ) : (
                    <img
                        src="/ui/arrow-right.svg"
                        alt="arrow-right"
                        className={cn(arrowClass)}
                    />
                )}
            </div>
        </div>
    );
}
