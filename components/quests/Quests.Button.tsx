/// components/atoms/Quests.Button.tsx

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { useAssetsGet } from "@/app/actions/assets/hooks";
import { useQuestSet } from "@/app/hooks/useQuest";
import { useToast } from "@/app/hooks/useToast";
import Countdown from "@/components/atoms/Countdown";
import { formatWaitTime } from "@/lib/utils/format";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import Doorman from "../atoms/Doorman";
import InviteFriendsModal from "../atoms/InviteFriends.Modal";
import PopupInteractFeedback from "../atoms/Popup.InteractFeedback";

import type { TokenGatingData } from "@/app/story/nft/actions";
import type { Player, Quest, ReferralLog } from "@prisma/client";
import Image from "next/image";

import { useQuestGet } from "@/app/hooks/useQuest";

// 디바운스 지연 시간 (밀리초)
const DEBOUNCE_DELAY = 500;

interface QuestsButtonProps {
    player: Player | null;
    quest: Quest;
    frameSize?: number;
    assetSize?: number;
    textSize?: number;
    infoTextSize?: number;
    assetTextSize?: number;
    paddingSize?: number;
    gapSize?: number;
    arrowSize?: number;
    tokenGating?: TokenGatingData | null;
    permission?: boolean;
    index: number;
    referralLogs: ReferralLog[];
}

function QuestsButton({
    player,
    quest,
    frameSize = 45,
    textSize = 25,
    infoTextSize = 15,
    assetSize = 20,
    assetTextSize = 15,
    paddingSize = 40,
    gapSize = 40,
    arrowSize = 30,
    tokenGating,
    permission = false,
    index,
    referralLogs,
}: QuestsButtonProps) {
    const toast = useToast();

    // 연속 클릭 방지를 위한 ref
    const lastClickTimeRef = useRef<number>(0);
    const isProcessingRef = useRef<boolean>(false);

    const { asset, isLoading: isLoadingAsset } = useAssetsGet({
        getAssetInput: {
            id: quest.rewardAssetId || "",
        },
    });

    const { playerQuestLog, isLoading: isLoadingPlayerQuestLog } = useQuestGet({
        getPlayerQuestLogInput: {
            questId: quest.id,
            playerId: player?.id || "",
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
    const [showInteractFeedback, setShowInteractFeedback] =
        useState<boolean>(false);
    const [status, setStatus] = useState<"completed" | "claimed" | "default">(
        "default"
    );
    const [buttonStyle, setButtonStyle] = useState<string>(
        "gradient-border morp-glass-1"
    );
    const [isReady, setIsReady] = useState<boolean>(false);
    const [isCountdownComplete, setIsCountdownComplete] =
        useState<boolean>(false);

    const singlePermission = useMemo(() => {
        if (quest.needTokenAddress) {
            return tokenGating ? tokenGating.hasToken : false;
        }

        return true;
    }, [quest, tokenGating]);

    // 연속 클릭 방지 함수
    const preventRapidClicks = useCallback(() => {
        const now = Date.now();
        if (
            now - lastClickTimeRef.current < DEBOUNCE_DELAY ||
            isProcessingRef.current
        ) {
            return false;
        }
        lastClickTimeRef.current = now;
        return true;
    }, []);

    // 퀘스트 완료 핸들러
    const handleCompleteQuest = useCallback(async () => {
        // 연속 클릭 방지
        if (!preventRapidClicks()) {
            return;
        }

        if (quest.isReferral) {
            setIsInviteFriendsModalOpen(true);
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
            toast.info(
                "You have already completed this quest. Please claim your reward!"
            );
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
        if (
            quest.multiClaimable &&
            playerQuestLog?.repeatCount &&
            Number(quest.multiClaimLimit) > 0 &&
            playerQuestLog.repeatCount >= Number(quest.multiClaimLimit)
        ) {
            toast.error("You reached the maximum number of claims.");
            return;
        }

        if (waitDate && new Date().getTime() < waitDate.getTime()) {
            toast.info(
                `You can complete this quest again ${formatWaitTime(
                    Math.floor(
                        (waitDate.getTime() - new Date().getTime()) / 1000
                    )
                )} after the last completion.`
            );
            return;
        }
        if (blockFunction) return;

        try {
            setIsCountdownComplete(false);
            isProcessingRef.current = true;
            setBlockFunction(true);
            if (quest.multiClaimable && quest.urls && quest.urls.length > 0) {
                const url = quest.urls[playerQuestLog?.repeatCount || 0];
                if (url) {
                    window.open(url, "_blank");
                }
            } else if (quest.url) {
                window.open(quest.url, "_blank");
            }

            const result = await completeQuest({
                quest,
                player,
                tokenGating: tokenGating || undefined,
            });

            if (result.success) {
                setStatus("completed");
                setButtonStyle(
                    "border-2 border-[rgba(139,92,246,0.9)] animate-pulse"
                );
                if (
                    quest.repeatable &&
                    quest.repeatableCount &&
                    quest.repeatableCount >
                        (playerQuestLog?.repeatCount || 0) + 1
                ) {
                    toast.success(
                        "Quest completed! Please wait for the next completion."
                    );
                } else {
                    toast.success("Quest completed! Please claim your reward.");
                }
            } else {
                toast.error(result.error || "Failed to complete quest");
            }
        } catch (error) {
            console.error("Quest completion error:", error);
            isProcessingRef.current = false;
            setBlockFunction(false);
        } finally {
            isProcessingRef.current = false;
            setBlockFunction(false);
        }
    }, [
        quest,
        player,
        permission,
        status,
        isCompleting,
        isClaimingQuestReward,
        waitDate,
        blockFunction,
        tokenGating,
        completeQuest,
        toast,
        preventRapidClicks,
        playerQuestLog?.repeatCount,
    ]);

    // 퀘스트 보상 청구 핸들러
    const handleClaimQuestReward = useCallback(
        async (e?: React.MouseEvent) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            // 연속 클릭 방지
            if (!preventRapidClicks()) {
                return;
            }

            if (!player) {
                toast.error("Please login to claim this quest.");
                return;
            }
            if (blockFunction) return;
            if (!permission) {
                toast.error("You don't have permission to claim this quest.");
                return;
            }
            if (!playerQuestLog) {
                toast.error("You haven't completed this quest yet.");
                return;
            }

            if (quest.repeatable && quest.repeatableCount) {
                if (playerQuestLog.repeatCount < quest.repeatableCount) {
                    toast.error(
                        `You need to complete this quest ${quest.repeatableCount} times before claiming the reward.`
                    );
                    return;
                }

                if (!playerQuestLog.completed) {
                    toast.error("You haven't completed this quest yet.");
                    return;
                }
            } else if (!playerQuestLog.completed) {
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

            const targetCount =
                playerQuestLog &&
                playerQuestLog.claimedDates &&
                playerQuestLog.claimedDates.length > 0
                    ? playerQuestLog.claimedDates.length + 1
                    : 1;

            try {
                setIsCountdownComplete(false);
                isProcessingRef.current = true;
                setBlockFunction(true);

                const result = await claimQuestReward({
                    questLog: playerQuestLog,
                    player,
                    targetCount,
                });

                if (result.success) {
                    setStatus("claimed");
                    setButtonStyle(
                        "opacity-40 bg-gradient-to-br from-[rgba(0,0,0,0.2)] to-[rgba(0,0,0,0.05)]"
                    );
                    setShowInteractFeedback(true);
                } else {
                    toast.error(result.error || "Failed to claim quest reward");
                }
            } catch (error) {
                console.error("Claim reward error:", error);
                setShowInteractFeedback(false);
                isProcessingRef.current = false;
                setBlockFunction(false);
            } finally {
                isProcessingRef.current = false;
                setBlockFunction(false);
            }
        },
        [
            player,
            blockFunction,
            permission,
            playerQuestLog,
            status,
            quest,
            isClaimingQuestReward,
            claimQuestReward,
            toast,
            preventRapidClicks,
        ]
    );

    // 퀘스트 상태 업데이트
    useEffect(() => {
        if (!playerQuestLog) {
            setStatus("default");
            setButtonStyle("gradient-border morp-glass-1");
            return;
        }

        // 반복 퀘스트 처리
        if (quest.repeatable && quest.repeatableCount) {
            if (playerQuestLog.isClaimed) {
                setStatus("claimed");
                setButtonStyle(
                    "opacity-40 bg-gradient-to-br from-[rgba(0,0,0,0.2)] to-[rgba(0,0,0,0.05)]"
                );
            } else if (
                playerQuestLog.repeatCount >= quest.repeatableCount &&
                playerQuestLog.completed
            ) {
                // 최대 반복 횟수에 도달하고 completed 상태일 때만 completed 상태로 설정
                setStatus("completed");
                setButtonStyle(
                    "border-2 border-[rgba(139,92,246,0.9)] animate-pulse"
                );
            } else {
                // 아직 최대 반복 횟수에 도달하지 않았거나 completed가 아니면 default 상태 유지
                setStatus("default");
                setButtonStyle("gradient-border morp-glass-1");
            }
        } else {
            // 일반 퀘스트 처리
            if (playerQuestLog.isClaimed) {
                setStatus("claimed");
                setButtonStyle(
                    "opacity-40 bg-gradient-to-br from-[rgba(0,0,0,0.2)] to-[rgba(0,0,0,0.05)]"
                );
            } else if (playerQuestLog.completed) {
                setStatus("completed");
                setButtonStyle(
                    "border-2 border-[rgba(139,92,246,0.9)] animate-pulse"
                );
            } else {
                setStatus("default");
                setButtonStyle("gradient-border morp-glass-1");
            }
        }

        // 반복 가능한 퀘스트의 대기 시간 처리
        if (
            quest.repeatable &&
            quest.repeatableInterval &&
            quest.repeatableInterval > 0
        ) {
            const lastCompletedAt =
                playerQuestLog?.completedDates &&
                playerQuestLog.completedDates.length > 0
                    ? Math.max(
                          ...playerQuestLog.completedDates.map((date) =>
                              new Date(date).getTime()
                          )
                      )
                    : 0;

            if (lastCompletedAt) {
                setWaitDate(
                    new Date(lastCompletedAt + quest.repeatableInterval)
                );
            }
        }

        if (
            quest.multiClaimable &&
            quest.multiClaimInterval &&
            quest.multiClaimInterval > 0
        ) {
            const lastClaimedAt =
                playerQuestLog?.claimedDates &&
                playerQuestLog.claimedDates.length > 0
                    ? Math.max(
                          ...playerQuestLog.claimedDates.map((date) =>
                              new Date(date).getTime()
                          )
                      )
                    : 0;

            if (lastClaimedAt) {
                const waitDate = new Date(
                    lastClaimedAt + quest.multiClaimInterval
                );
                setWaitDate(waitDate);
            }
        }
    }, [quest, playerQuestLog]);

    useEffect(() => {
        setIsReady(!isLoadingAsset && !isLoadingPlayerQuestLog);
    }, [isLoadingAsset, isLoadingPlayerQuestLog]);

    // 반응형 클래스 계산
    const frameClass = getResponsiveClass(frameSize).frameClass;
    const textClass = getResponsiveClass(textSize).textClass;
    const paddingClass = getResponsiveClass(paddingSize).paddingClass;
    const gapClass = getResponsiveClass(gapSize).gapClass;
    const arrowClass = getResponsiveClass(arrowSize).frameClass;
    const assetFrameClass = getResponsiveClass(assetSize).frameClass;
    const assetTextClass = getResponsiveClass(assetTextSize).textClass;

    // 버튼 상태 계산 로직
    const getButtonState = useCallback(() => {
        // 처리 중인 경우
        if (isCompleting || isClaimingQuestReward) {
            return {
                status: status,
                style: `${buttonStyle} opacity-70 animate-pulse`,
                disabled: true,
            };
        }

        // 일반 상태
        return {
            status: status,
            style: buttonStyle,
            disabled: false,
        };
    }, [status, buttonStyle, isCompleting, isClaimingQuestReward]);

    // 계산된 버튼 상태
    const buttonState = getButtonState();

    return (
        <>
            <PopupInteractFeedback
                open={showInteractFeedback}
                onClose={() => setShowInteractFeedback(false)}
                title="Reward Claimed!"
                description="You've claimed the quest reward. Thank you for your participation!"
                type="success"
                autoCloseMs={6000}
                showReward={true}
                reward={asset || undefined}
                rewardAmount={quest.rewardAmount}
            />

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
                            onClick={
                                !buttonState.disabled
                                    ? () => void handleCompleteQuest()
                                    : undefined
                            }
                            className={cn(
                                buttonState.style,
                                "flex flex-row items-center justify-between rounded-3xl",
                                "cursor-pointer backdrop-blur-xs",
                                buttonState.disabled && "cursor-not-allowed",
                                paddingClass
                            )}
                            aria-disabled={buttonState.disabled}
                        >
                            {!singlePermission && (
                                <Doorman
                                    iconSize={40}
                                    textSize={15}
                                    row={true}
                                />
                            )}
                            <div
                                className={cn(
                                    "flex flex-row items-center",
                                    gapClass,
                                    !singlePermission && "blur-sm"
                                )}
                            >
                                {/* 퀘스트 아이콘 - 최적화된 이미지 로딩 */}
                                <Image
                                    src={quest.icon || "/icons/quests/link.svg"}
                                    alt={quest.title}
                                    width={frameSize * 2}
                                    height={frameSize * 2}
                                    className={cn(frameClass)}
                                    priority={false}
                                    unoptimized={false}
                                />

                                <div className="flex flex-col items-start gap-[3px] pr-[10px]">
                                    <div
                                        className={cn(textClass, "break-words")}
                                    >
                                        {quest.title}
                                    </div>
                                    <div className="flex flex-row justify-center items-center gap-1 opacity-70">
                                        <Image
                                            src={
                                                asset?.iconUrl ||
                                                "/ui/assets.svg"
                                            }
                                            alt={asset?.name || ""}
                                            width={assetSize}
                                            height={assetSize}
                                            className={cn(
                                                "object-contain",
                                                assetFrameClass
                                            )}
                                            priority={false}
                                            unoptimized={false}
                                        />
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
                                {/* 레퍼럴 퀘스트 정보 */}
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

                                {/* 반복 가능한 퀘스트 정보 */}
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
                                                {playerQuestLog?.repeatCount ||
                                                    0}
                                                /{quest.repeatableCount}
                                            </div>
                                        )}
                                        {waitDate &&
                                            quest.repeatableCount &&
                                            quest.repeatableCount >
                                                (playerQuestLog?.repeatCount ||
                                                    0) &&
                                            waitDate.getTime() >
                                                new Date().getTime() &&
                                            !isCountdownComplete && (
                                                <Countdown
                                                    size={15}
                                                    endDate={waitDate}
                                                    className="font-digital text-[rgba(255,255,255,0.8)]"
                                                    onComplete={() =>
                                                        setIsCountdownComplete(
                                                            true
                                                        )
                                                    }
                                                />
                                            )}
                                    </div>
                                )}

                                {/* 반복 가능한 퀘스트 정보 */}
                                {!quest.isReferral && quest.multiClaimable && (
                                    <div className="flex flex-col items-end text-right gap-[2px]">
                                        {Number(quest.multiClaimLimit) > 0 && (
                                            <div
                                                className={cn(
                                                    getResponsiveClass(
                                                        infoTextSize
                                                    ).textClass,
                                                    "opacity-85"
                                                )}
                                            >
                                                {playerQuestLog?.repeatCount ||
                                                    0}
                                                /{quest.multiClaimLimit}
                                            </div>
                                        )}
                                        {quest.multiClaimLimit === 0 && (
                                            <div
                                                className={cn(
                                                    getResponsiveClass(
                                                        infoTextSize
                                                    ).textClass,
                                                    "opacity-85"
                                                )}
                                            >
                                                {playerQuestLog?.repeatCount ||
                                                    0}
                                            </div>
                                        )}
                                        {waitDate &&
                                            (Number(quest.multiClaimLimit) ===
                                                0 ||
                                                Number(quest.multiClaimLimit) >
                                                    (playerQuestLog?.repeatCount ||
                                                        0)) &&
                                            waitDate.getTime() >
                                                new Date().getTime() &&
                                            !isCountdownComplete && (
                                                <Countdown
                                                    size={15}
                                                    endDate={waitDate}
                                                    className="font-digital text-[rgba(255,255,255,0.8)]"
                                                    onComplete={() =>
                                                        setIsCountdownComplete(
                                                            true
                                                        )
                                                    }
                                                />
                                            )}
                                    </div>
                                )}

                                {/* 퀘스트 상태에 따른 버튼 또는 아이콘 */}
                                {status === "completed" ? (
                                    !quest.repeatable ||
                                    !quest.repeatableCount ||
                                    (playerQuestLog &&
                                        playerQuestLog.repeatCount >=
                                            quest.repeatableCount) ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                void handleClaimQuestReward(e);
                                            }}
                                            disabled={buttonState.disabled}
                                            className={cn(
                                                getResponsiveClass(20)
                                                    .textClass,
                                                getResponsiveClass(20)
                                                    .paddingClass,
                                                "bg-[rgba(139,92,246,0.9)]",
                                                "rounded-[8px]",
                                                "cursor-pointer",
                                                "backdrop-blur-xs",
                                                "hover:bg-[rgba(139,92,246,1)] hover:scale-105",
                                                "transition-all duration-300",
                                                buttonState.disabled &&
                                                    "opacity-50 cursor-not-allowed hover:scale-100"
                                            )}
                                        >
                                            Claim
                                        </button>
                                    ) : (
                                        // 반복 퀘스트이고 최대 반복 횟수에 도달하지 않았으면 화살표 아이콘 표시
                                        <Image
                                            src="/ui/arrow-right.svg"
                                            alt="arrow-right"
                                            width={arrowSize}
                                            height={arrowSize}
                                            className={cn(arrowClass)}
                                            priority={false}
                                            unoptimized={false}
                                        />
                                    )
                                ) : status === "claimed" ? (
                                    <Image
                                        src="/ui/checked.svg"
                                        alt="checked"
                                        width={arrowSize}
                                        height={arrowSize}
                                        className={cn(arrowClass)}
                                        priority={false}
                                        unoptimized={false}
                                    />
                                ) : (
                                    <Image
                                        src="/ui/arrow-right.svg"
                                        alt="arrow-right"
                                        width={arrowSize}
                                        height={arrowSize}
                                        className={cn(arrowClass)}
                                        priority={false}
                                        unoptimized={false}
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

// 메모이제이션을 통해 불필요한 리렌더링 방지
export default memo(QuestsButton);
