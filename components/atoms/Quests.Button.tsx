/// components/atoms/Quests.Button.tsx

import { useState, useEffect } from "react";
import { Quest, QuestLog, Player, ReferralLog } from "@prisma/client";
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
import { motion, AnimatePresence } from "framer-motion";
import InviteFriendsModal from "./InviteFriends.Modal";

interface QuestsButtonProps {
    player: Player | null;
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
    index: number;
    referralLogs: ReferralLog[];
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
    index,
    referralLogs,
}: QuestsButtonProps) {
    const toast = useToast();
    const { startLoading, endLoading } = useLoading();

    const { asset, isLoading: isLoadingAsset } = useAssetsGet({
        getAssetInput: {
            id: quest.rewardAssetId || "",
        },
    });

    const {
        completeQuest,
        isCompleting,
        claimQuestReward,
        isClaimingQuestReward,
    } = useQuestSet();

    const [waitDate, setWaitDate] = useState<Date | null>(null);

    const [isInviteFriendsModalOpen, setIsInviteFriendsModalOpen] =
        useState<boolean>(false);

    const [blockFunction, setBlockFunction] = useState<boolean>(false);

    const handleCompleteQuest = async () => {
        if (quest.isReferral) {
            setIsInviteFriendsModalOpen(true);
            return;
        }

        if (!quest.url) {
            return;
        }

        if (!player) {
            toast.error("Please login to complete this quest.");
            return;
        }

        if (!permission) {
            toast.error("You don't have permission to complete this quest.");
            return;
        }

        if (status === "completed") {
            toast.error("You have already completed this quest.");
            return;
        }

        if (isCompleting) {
            toast.info("Please wait for the quest to complete.");
            return;
        }

        if (status === "claimed") {
            toast.error("You have already claimed this quest.");
            return;
        }

        if (isClaimingQuestReward) {
            toast.info("Please wait for the quest reward to be claimed.");
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

        if (blockFunction) {
            return;
        }

        setBlockFunction(true);
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
        setBlockFunction(false);
    };

    const handleClaimQuestReward = async () => {
        if (!player) {
            toast.error("Please login to claim this quest.");
            return;
        }

        if (blockFunction) {
            return;
        }

        if (!permission) {
            toast.error("You don't have permission to claim this quest.");
            return;
        }

        if (!questLog) {
            toast.error("You haven't completed this quest yet.");
            return;
        }

        if (status === "claimed") {
            toast.error("You have already claimed this quest.");
            return;
        }

        if (isClaimingQuestReward) {
            toast.info("Please wait for the quest reward to be claimed.");
            return;
        }

        setBlockFunction(true);
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

    const [isReady, setIsReady] = useState<boolean>(false);

    useEffect(() => {
        if (isLoadingAsset) {
            setIsReady(false);
            return;
        }

        setIsReady(true);
    }, [isLoadingAsset]);

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
        <>
            {isInviteFriendsModalOpen && (
                <InviteFriendsModal
                    player={player}
                    onClose={() => setIsInviteFriendsModalOpen(false)}
                />
            )}
            <AnimatePresence>
                {isReady && (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{
                            duration: 0.7,
                            ease: [0.2, 1, 0.4, 1],
                            delay: index * 0.1,
                        }}
                    >
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
                            <div
                                className={cn(
                                    "flex flex-row items-center",
                                    gapClass
                                )}
                            >
                                <img
                                    src={quest.icon || "/icons/quests/link.svg"}
                                    alt={quest.title}
                                    className={cn(frameClass)}
                                />
                                <div className="flex flex-col items-start gap-[3px] pr-[10px]">
                                    <div
                                        className={cn(textClass, "break-words")}
                                    >
                                        {quest.title}
                                    </div>
                                    <div className="flex flex-row justify-center items-center gap-1 opacity-70">
                                        <div className={cn(textClass)}>
                                            <img
                                                src={
                                                    asset?.iconUrl ||
                                                    "/ui/assets.svg"
                                                }
                                                alt={asset?.name || ""}
                                                className={cn(assetFrameClass)}
                                            />
                                        </div>
                                        <div
                                            className={cn(
                                                assetTextClass,
                                                "font-bold"
                                            )}
                                        >
                                            {quest.rewardAmount}{" "}
                                            {asset?.name || ""}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-row items-center gap-2">
                                {quest.isReferral && (
                                    <div className="flex flex-col items-end text-right gap-[2px]">
                                        {quest.referralCount && (
                                            <div
                                                className={cn(
                                                    getResponsiveClass(
                                                        infoTextSize
                                                    ).textClass,
                                                    "opacity-85"
                                                )}
                                            >
                                                {Math.min(
                                                    referralLogs.length || 0,
                                                    quest.referralCount
                                                )}
                                                /{quest.referralCount}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!quest.isReferral && quest.repeatable && (
                                    <div className="flex flex-col items-end text-right gap-[2px]">
                                        {quest.repeatableCount && (
                                            <div
                                                className={cn(
                                                    getResponsiveClass(
                                                        infoTextSize
                                                    ).textClass,
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
                                            waitDate.getTime() >
                                                new Date().getTime() && (
                                                <Countdown
                                                    size={5}
                                                    endDate={waitDate}
                                                />
                                            )}
                                    </div>
                                )}

                                {status === "completed" ? (
                                    <Button
                                        onClick={handleClaimQuestReward}
                                        disabled={blockFunction}
                                        className="px-[9px]"
                                    >
                                        Claim
                                    </Button>
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
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
