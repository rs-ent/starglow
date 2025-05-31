/// components/atoms/Quests.Button.tsx

import {memo, useCallback, useEffect, useRef, useState} from "react";
import {Player, Quest, QuestLog, ReferralLog} from "@prisma/client";
import {getResponsiveClass} from "@/lib/utils/responsiveClass";
import {cn} from "@/lib/utils/tailwind";
import {useAssetsGet} from "@/app/hooks/useAssets";
import {useQuestSet} from "@/app/hooks/useQuest";
import {useToast} from "@/app/hooks/useToast";
import {TokenGatingResult} from "@/app/actions/quests";
import {formatWaitTime} from "@/lib/utils/format";
import Countdown from "@/components/atoms/Countdown";
import {AdvancedTokenGateResult} from "@/app/actions/blockchain";
import {AnimatePresence, motion} from "framer-motion";
import InviteFriendsModal from "./InviteFriends.Modal";
import PopupInteractFeedback from "./Popup.InteractFeedback";
import {useOptimisticUpdate} from "@/app/hooks/useOptimisticUpdate";

// 디바운스 지연 시간 (밀리초)
const DEBOUNCE_DELAY = 500;

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

function QuestsButton({
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
    
    // 연속 클릭 방지를 위한 ref
    const lastClickTimeRef = useRef<number>(0);
    const isProcessingRef = useRef<boolean>(false);

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
    const [isInviteFriendsModalOpen, setIsInviteFriendsModalOpen] = useState<boolean>(false);
    const [blockFunction, setBlockFunction] = useState<boolean>(false);
    const [showInteractFeedback, setShowInteractFeedback] = useState<boolean>(false);
    const [status, setStatus] = useState<"completed" | "claimed" | "default">("default");
    const [buttonStyle, setButtonStyle] = useState<string>("gradient-border morp-glass-1");
    const [isReady, setIsReady] = useState<boolean>(false);

    // 낙관적 업데이트를 위한 퀘스트 완료 처리
    const completeQuestOptimistic = useOptimisticUpdate({
        queryKey: ["questLogs", player?.id, quest.id],
        mutationFn: async (params: { 
            quest: Quest; 
            player: Player; 
            tokenGating?: TokenGatingResult 
        }) => {
            return await completeQuest(params);
        },
        optimisticUpdate: (oldData, variables) => {
            // 기존 데이터가 없으면 새로운 QuestLog 생성
            if (!oldData) {
                return {
                    id: `temp-${Date.now()}`,
                    questId: variables.quest.id,
                    playerId: variables.player.id,
                    completed: true,
                    isClaimed: false,
                    completedDates: [new Date().toISOString()],
                    repeatCount: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
            }
            
            // 기존 데이터가 있으면 업데이트
            return {
                ...oldData,
                completed: true,
                completedDates: [...(oldData.completedDates || []), new Date().toISOString()],
                repeatCount: (oldData.repeatCount || 0) + 1,
                updatedAt: new Date(),
            };
        },
        onSuccess: (data, variables) => {
            if (data.success) {
                // 반복 퀘스트이고 아직 최대 반복 횟수에 도달하지 않았을 경우
                if (quest.repeatable && quest.repeatableCount && quest.repeatableCount > (questLog?.repeatCount || 0) + 1) {
                    toast.success("Quest completed! Please wait for the next completion.");
                    // 반복 퀘스트가 최대 횟수에 도달하지 않았으면 default 상태 유지
                    setStatus("default");
                    setButtonStyle("gradient-border morp-glass-1");
                } else {
                    // 일반 퀘스트이거나 반복 퀘스트의 최대 횟수에 도달한 경우
                    toast.success("Quest completed! Please claim your reward.");
                    // completed 상태로 변경
                    setStatus("completed");
                    setButtonStyle("border-2 border-[rgba(139,92,246,0.9)] animate-pulse");
                }
                
                // 중요: 처리 완료 후 즉시 상호작용 가능하도록 플래그 해제
                isProcessingRef.current = false;
                setBlockFunction(false);
            }
        },
        onError: (error, variables, rollback) => {
            toast.error("Failed to complete quest. Please try again.");
            console.error("Quest completion error:", error);
            rollback(); // 오류 발생 시 롤백
            // 중요: 오류 발생 시에도 상호작용 가능하도록 플래그 해제
            isProcessingRef.current = false;
            setBlockFunction(false);
        },
    });

    // 낙관적 업데이트를 위한 보상 청구 처리
    const claimRewardOptimistic = useOptimisticUpdate({
        queryKey: ["questLogs", player?.id, quest.id],
        mutationFn: async (params: { questLog: QuestLog; player: Player }) => {
            return await claimQuestReward(params);
        },
        optimisticUpdate: (oldData, variables) => {
            if (!oldData) return variables.questLog;
            
            return {
                ...oldData,
                isClaimed: true,
                claimedAt: new Date(),
                updatedAt: new Date(),
            };
        },
        onSuccess: (data, variables) => {
            if (data.success) {
                // 서버 응답 후 추가 작업 (필요한 경우)
                // 이미 낙관적 업데이트에서 UI를 변경했으므로 여기서는 PopupInteractFeedback을 표시하지 않음
                
                // 반복 퀘스트 처리 로직 추가 (서버 응답 기반으로 정확한 상태 설정)
                if (quest.repeatable && 
                    quest.repeatableCount && 
                    (questLog?.repeatCount || 0) < quest.repeatableCount) {
                    // 반복 퀘스트이고 아직 최대 반복 횟수에 도달하지 않았다면 default 상태로 변경
                    setStatus("default");
                    setButtonStyle("gradient-border morp-glass-1");
                    
                    // 반복 간격이 있다면 대기 시간 설정
                    if (quest.repeatableInterval && quest.repeatableInterval > 0) {
                        setWaitDate(new Date(Date.now() + quest.repeatableInterval));
                    }
                } else {
                    // 일반 퀘스트나 최대 반복 횟수에 도달한 경우 claimed 상태로 변경
                    setStatus("claimed");
                    setButtonStyle("opacity-40 bg-gradient-to-br from-[rgba(0,0,0,0.2)] to-[rgba(0,0,0,0.05)]");
                }
                
                // 중요: 처리 완료 후 즉시 상호작용 가능하도록 플래그 해제
                isProcessingRef.current = false;
                setBlockFunction(false);
            }
        },
        onError: (error, variables, rollback) => {
            toast.error("Failed to claim reward. Please try again.");
            console.error("Claim reward error:", error);
            rollback(); // 오류 발생 시 롤백
            
            // 팝업 닫기 (오류 발생 시)
            setShowInteractFeedback(false);
            
            // 중요: 오류 발생 시에도 상호작용 가능하도록 플래그 해제
            isProcessingRef.current = false;
            setBlockFunction(false);
        },
    });

    // 연속 클릭 방지 함수
    const preventRapidClicks = useCallback(() => {
        const now = Date.now();
        if (now - lastClickTimeRef.current < DEBOUNCE_DELAY || isProcessingRef.current) {
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

        if (!quest.url) return;
        if (!player) {
            toast.error("Please login to complete this quest.");
            return;
        }
        if (!permission) {
            toast.error("You don't have permission to complete this quest.");
            return;
        }
        if (status === "completed") {
            toast.info("You have already completed this quest. Please claim your reward!");
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
        if (waitDate && new Date().getTime() < waitDate.getTime()) {
            toast.info(
                `You can complete this quest again ${formatWaitTime(
                    Math.floor((waitDate.getTime() - new Date().getTime()) / 1000)
                )} after the last completion.`
            );
            return;
        }
        if (blockFunction) return;

        // 토큰 게이팅 처리
        let tokenGating: TokenGatingResult = {
            success: false,
            data: {
                hasToken: false,
                tokenCount: 0,
                ownerWallets: [],
            },
        };

        if (quest.needTokenAddress) {
            if (tokenGatingResult?.data) {
                tokenGating = {
                    success: tokenGatingResult.success,
                    data: {
                        hasToken: tokenGatingResult.data.hasToken[quest.needTokenAddress] ?? false,
                        tokenCount: tokenGatingResult.data.tokenCount[quest.needTokenAddress] ?? 0,
                        ownerWallets: tokenGatingResult.data.ownerWallets[quest.needTokenAddress] ?? [],
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

        try {
            isProcessingRef.current = true;
            setBlockFunction(true);
            window.open(quest.url, "_blank");
            
            // 낙관적 업데이트 사용 - 즉시 UI 상태 업데이트
            completeQuestOptimistic.execute({
                quest,
                player,
                tokenGating: tokenGating || undefined,
            });
            
            // 낙관적 업데이트 즉시 UI 상태 변경 (서버 응답 대기하지 않고)
            setStatus("completed");
            setButtonStyle("border-2 border-[rgba(139,92,246,0.9)] animate-pulse");
        } catch (error) {
            console.error("Quest completion error:", error);
            isProcessingRef.current = false;
            setBlockFunction(false);
        }
    }, [
        quest, player, permission, status, isCompleting, isClaimingQuestReward, 
        waitDate, blockFunction, tokenGatingResult, completeQuestOptimistic, toast, preventRapidClicks
    ]);

    // 퀘스트 보상 청구 핸들러
    const handleClaimQuestReward = useCallback(async (e?: React.MouseEvent) => {
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
        if (!questLog) {
            toast.error("You haven't completed this quest yet.");
            return;
        }
        
        // 반복 퀘스트는 최대 반복 횟수에 도달했을 때만 claim 가능
        if (quest.repeatable && quest.repeatableCount) {
            if (questLog.repeatCount < quest.repeatableCount) {
                toast.error(`You need to complete this quest ${quest.repeatableCount} times before claiming the reward.`);
                return;
            }
            
            if (!questLog.completed) {
                toast.error("You haven't completed this quest yet.");
                return;
            }
        } else if (!questLog.completed) {
            // 일반 퀘스트도 completed 상태여야 함
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

        try {
            isProcessingRef.current = true;
            setBlockFunction(true);
            
            // 낙관적 업데이트 전에 팝업 표시 (한 번만 표시)
            setShowInteractFeedback(true);
            
            // 낙관적 업데이트 사용
            claimRewardOptimistic.execute({ questLog, player });
            
            // 낙관적 업데이트 즉시 UI 상태 변경 (서버 응답 대기하지 않고)
            setStatus("claimed");
            setButtonStyle("opacity-40 bg-gradient-to-br from-[rgba(0,0,0,0.2)] to-[rgba(0,0,0,0.05)]");
        } catch (error) {
            console.error("Claim reward error:", error);
            setShowInteractFeedback(false);
            isProcessingRef.current = false;
            setBlockFunction(false);
        }
    }, [
        player, blockFunction, permission, questLog, status, quest,
        isClaimingQuestReward, claimRewardOptimistic, toast, preventRapidClicks
    ]);

    // 퀘스트 상태 업데이트
    useEffect(() => {
        if (!questLog) {
            setStatus("default");
            setButtonStyle("gradient-border morp-glass-1");
            return;
        }
        
        // 반복 퀘스트 처리
        if (quest.repeatable && quest.repeatableCount) {
            if (questLog.isClaimed) {
                setStatus("claimed");
                setButtonStyle("opacity-40 bg-gradient-to-br from-[rgba(0,0,0,0.2)] to-[rgba(0,0,0,0.05)]");
            } else if (questLog.repeatCount >= quest.repeatableCount && questLog.completed) {
                // 최대 반복 횟수에 도달하고 completed 상태일 때만 completed 상태로 설정
                setStatus("completed");
                setButtonStyle("border-2 border-[rgba(139,92,246,0.9)] animate-pulse");
            } else {
                // 아직 최대 반복 횟수에 도달하지 않았거나 completed가 아니면 default 상태 유지
                setStatus("default");
                setButtonStyle("gradient-border morp-glass-1");
            }
        } else {
            // 일반 퀘스트 처리
            if (questLog.isClaimed) {
                setStatus("claimed");
                setButtonStyle("opacity-40 bg-gradient-to-br from-[rgba(0,0,0,0.2)] to-[rgba(0,0,0,0.05)]");
            } else if (questLog.completed) {
                setStatus("completed");
                setButtonStyle("border-2 border-[rgba(139,92,246,0.9)] animate-pulse");
            } else {
                setStatus("default");
                setButtonStyle("gradient-border morp-glass-1");
            }
        }
        
        // 반복 가능한 퀘스트의 대기 시간 처리
        if (quest.repeatable && quest.repeatableInterval && quest.repeatableInterval > 0) {
            const lastCompletedAt = questLog?.completedDates && questLog.completedDates.length > 0
                ? Math.max(...questLog.completedDates.map((date) => new Date(date).getTime()))
                : 0;

            if (lastCompletedAt) {
                setWaitDate(new Date(lastCompletedAt + quest.repeatableInterval));
            }
        }
    }, [quest, questLog]);

    // 에셋 로딩 상태 처리
    useEffect(() => {
        setIsReady(!isLoadingAsset);
    }, [isLoadingAsset]);

    // 반응형 클래스 계산
    const frameClass = getResponsiveClass(frameSize).frameClass;
    const textClass = getResponsiveClass(textSize).textClass;
    const paddingClass = getResponsiveClass(paddingSize).paddingClass;
    const gapClass = getResponsiveClass(gapSize).gapClass;
    const arrowClass = getResponsiveClass(arrowSize).frameClass;
    const assetFrameClass = getResponsiveClass(assetSize).frameClass;
    const assetTextClass = getResponsiveClass(assetTextSize).textClass;

    // 버튼 상태 계산 로직 - 낙관적 업데이트 상태 반영
    const getButtonState = useCallback(() => {
        // 낙관적 업데이트 중인 경우
        if (completeQuestOptimistic.isOptimistic || claimRewardOptimistic.isOptimistic) {
            return {
                status: completeQuestOptimistic.isOptimistic ? "completed" : "claimed",
                style: completeQuestOptimistic.isOptimistic 
                    ? "border-2 border-[rgba(139,92,246,0.9)] animate-pulse border-dashed" 
                    : "opacity-40 bg-gradient-to-br from-[rgba(0,0,0,0.2)] to-[rgba(0,0,0,0.05)] border-dashed",
                disabled: true
            };
        }
        
        // 처리 중인 경우
        if (completeQuestOptimistic.isPending || claimRewardOptimistic.isPending) {
            return {
                status: status,
                style: `${buttonStyle} opacity-70`,
                disabled: true
            };
        }
        
        // 일반 상태
        return {
            status: status,
            style: buttonStyle,
            disabled: false
        };
    }, [
        status, buttonStyle, 
        completeQuestOptimistic.isOptimistic, completeQuestOptimistic.isPending,
        claimRewardOptimistic.isOptimistic, claimRewardOptimistic.isPending
    ]);

    // 계산된 버튼 상태
    const buttonState = getButtonState();

    return (
        <>
            <PopupInteractFeedback
                open={showInteractFeedback}
                onClose={() => setShowInteractFeedback(false)}
                title={"Reward Claimed!"}
                description={"You've claimed the quest reward. Thank you for your participation!"}
                type="success"
                autoCloseMs={4000}
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
                            onClick={!buttonState.disabled ? handleCompleteQuest : undefined}
                            className={cn(
                                buttonState.style,
                                "flex flex-row items-center justify-between rounded-3xl",
                                "cursor-pointer backdrop-blur-xs",
                                buttonState.disabled && "cursor-not-allowed",
                                paddingClass
                            )}
                            aria-disabled={buttonState.disabled}
                        >
                            <div className={cn("flex flex-row items-center", gapClass)}>
                                {/* 퀘스트 아이콘 - 최적화된 이미지 로딩 */}
                                <img
                                    src={quest.icon || "/icons/quests/link.svg"}
                                    alt={quest.title}
                                    className={cn(frameClass)}
                                    loading="lazy"
                                    width={frameSize}
                                    height={frameSize}
                                />
                                
                                <div className="flex flex-col items-start gap-[3px] pr-[10px]">
                                    <div className={cn(textClass, "break-words")}>
                                        {quest.title}
                                    </div>
                                    <div className="flex flex-row justify-center items-center gap-1 opacity-70">
                                        <div className={cn(textClass)}>
                                            <img
                                                src={asset?.iconUrl || "/ui/assets.svg"}
                                                alt={asset?.name || ""}
                                                className={cn(assetFrameClass)}
                                                loading="lazy"
                                                width={assetSize}
                                                height={assetSize}
                                            />
                                        </div>
                                        <div className={cn(assetTextClass, "font-bold")}>
                                            {quest.rewardAmount} {asset?.name || ""}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-row items-center gap-2">
                                {/* 레퍼럴 퀘스트 정보 */}
                                {quest.isReferral && (
                                    <div className="flex flex-col items-end text-right gap-[2px]">
                                        {quest.referralCount && (
                                            <div className={cn(
                                                getResponsiveClass(infoTextSize).textClass,
                                                "opacity-85"
                                            )}>
                                                {Math.min(referralLogs.length || 0, quest.referralCount)}/
                                                {quest.referralCount}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 반복 가능한 퀘스트 정보 */}
                                {!quest.isReferral && quest.repeatable && (
                                    <div className="flex flex-col items-end text-right gap-[2px]">
                                        {quest.repeatableCount && (
                                            <div className={cn(
                                                getResponsiveClass(infoTextSize).textClass,
                                                "opacity-85"
                                            )}>
                                                {questLog?.repeatCount || 0}/{quest.repeatableCount}
                                            </div>
                                        )}
                                        {waitDate &&
                                            quest.repeatableCount &&
                                            quest.repeatableCount > (questLog?.repeatCount || 0) &&
                                            waitDate.getTime() > new Date().getTime() && (
                                                <Countdown
                                                    size={10}
                                                    endDate={waitDate}
                                                    className="font-digital text-[rgba(255,255,255,0.8)]"
                                                />
                                            )}
                                    </div>
                                )}

                                {/* 퀘스트 상태에 따른 버튼 또는 아이콘 */}
                                {status === "completed" ? (
                                    // 반복 퀘스트인 경우 최대 반복 횟수에 도달했는지 확인
                                    // 일반 퀘스트이거나 최대 반복 횟수에 도달한 경우에만 Claim 버튼 표시
                                    (!quest.repeatable || !quest.repeatableCount || 
                                     (questLog && questLog.repeatCount >= quest.repeatableCount)) ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // 이벤트 버블링 방지
                                                handleClaimQuestReward(e);
                                            }}
                                            disabled={buttonState.disabled}
                                            className={cn(
                                                getResponsiveClass(20).textClass,
                                                getResponsiveClass(20).paddingClass,
                                                "bg-[rgba(139,92,246,0.9)]",
                                                "rounded-[8px]",
                                                "cursor-pointer",
                                                "backdrop-blur-xs",
                                                "hover:bg-[rgba(139,92,246,1)] hover:scale-105",
                                                "transition-all duration-300",
                                                buttonState.disabled && "opacity-50 cursor-not-allowed hover:scale-100"
                                            )}
                                        >
                                            Claim
                                        </button>
                                    ) : (
                                        // 반복 퀘스트이고 최대 반복 횟수에 도달하지 않았으면 화살표 아이콘 표시
                                        <img
                                            src="/ui/arrow-right.svg"
                                            alt="arrow-right"
                                            className={cn(arrowClass)}
                                            loading="lazy"
                                            width={arrowSize}
                                            height={arrowSize}
                                        />
                                    )
                                ) : status === "claimed" ? (
                                    <img
                                        src="/ui/checked.svg"
                                        alt="checked"
                                        className={cn(arrowClass)}
                                        loading="lazy"
                                        width={arrowSize}
                                        height={arrowSize}
                                    />
                                ) : (
                                    <img
                                        src="/ui/arrow-right.svg"
                                        alt="arrow-right"
                                        className={cn(arrowClass)}
                                        loading="lazy"
                                        width={arrowSize}
                                        height={arrowSize}
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
