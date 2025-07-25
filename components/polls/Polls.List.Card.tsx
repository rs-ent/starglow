/// components/polls/Polls.List.Card.tsx

"use client";

import { memo, useCallback, useMemo, useState } from "react";

import { motion } from "framer-motion";

import { useLoading } from "@/app/hooks/useLoading";
import { usePollsGet, usePollsSet } from "@/app/hooks/usePolls";
import { useToast } from "@/app/hooks/useToast";
import { usePlayerAssetsGet } from "@/app/actions/playerAssets/hooks";
import PollBar from "@/components/atoms/Polls.Bar";
import PollThumbnail from "@/components/atoms/Polls.Thumbnail";
import { formatDate } from "@/lib/utils/format";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import Button from "../atoms/Button";
import Countdown from "../atoms/Countdown";
import Popup from "../atoms/Popup";
import PopupInteractFeedback from "../atoms/Popup.InteractFeedback";
import PollsBettingModeTutorialModal from "./Polls.BettingModeTutorial.Modal";
import PollBettingParticipationModal from "./Poll.Betting.Participation.Modal";
import PollBettingRecord from "./Poll.Betting.Record";
import type { PollListData, PollOption } from "@/app/actions/polls";
import { ArtistBG } from "@/lib/utils/get/artist-colors";
import type { Player } from "@prisma/client";
import Image from "next/image";

interface PollsCardProps {
    index?: number;
    poll: PollListData;
    player: Player | null;
    isSelected?: boolean;
    fgColorFrom?: string;
    fgColorTo?: string;
    bgColorFrom?: string;
    bgColorTo?: string;
    bgColorAccentFrom?: string;
    bgColorAccentTo?: string;
}

// 상태 통합 타입 정의
interface VotingState {
    selection: PollOption | null;
    voteAmount: number;
    voteAmountInput: string;
    animateSubmit: boolean;
}

interface UIState {
    showOngoingResults: boolean;
    showAnswerPopup: boolean;
    showInteractFeedback: boolean;
    confirmedAnswer: boolean;
    rewarded: boolean;
    showBettingTutorial: boolean;
    showBettingModal: boolean;
    showBettingRecord: boolean;
    onchainTxHash?: string;
}

function PollsListCard({
    poll,
    player,
    isSelected,
    fgColorFrom,
    fgColorTo,
    bgColorFrom = "rgba(139,92,246,0.9)",
    bgColorTo = "rgba(139,92,246,1)",
    bgColorAccentFrom = "rgba(109,40,217,1)",
    bgColorAccentTo = "rgba(109,40,217,0.45)",
}: PollsCardProps) {
    const { startLoading, endLoading } = useLoading();
    const toast = useToast();

    // 상태 통합으로 리렌더링 최적화
    const [votingState, setVotingState] = useState<VotingState>({
        selection: null,
        voteAmount: 0,
        voteAmountInput: "0",
        animateSubmit: false,
    });

    const [uiState, setUIState] = useState<UIState>({
        showOngoingResults: false,
        showAnswerPopup: false,
        showInteractFeedback: false,
        confirmedAnswer: false,
        rewarded: false,
        showBettingTutorial: false,
        showBettingModal: false,
        showBettingRecord: false,
        onchainTxHash: undefined,
    });

    // 날짜 관련 계산 메모이제이션
    const pollDateInfo = useMemo(() => {
        const startDateFormatted = formatDate(poll.startDate);
        const endDateFormatted = formatDate(poll.endDate);
        const today = new Date();
        const startDateObj = new Date(poll.startDate);
        const endDateObj = new Date(poll.endDate);

        const endDateMinus3Days = new Date(endDateObj);
        endDateMinus3Days.setDate(endDateObj.getDate() - 3);

        const endDatePlus30Minutes = new Date(endDateObj);
        endDatePlus30Minutes.setMinutes(endDateObj.getMinutes() + 30);

        const isBlurred = today > endDateMinus3Days && today < endDateObj;

        // 상태 계산
        let status;
        if (endDateObj.getTime() < today.getTime()) status = "ENDED";
        else if (startDateObj.getTime() > today.getTime()) status = "UPCOMING";
        else status = "ONGOING";

        // 옵션 표시 여부
        const showOptions =
            startDateObj.getTime() < today.getTime() &&
            endDateObj.getTime() > today.getTime();

        // 종료 여부
        const isEnded = endDatePlus30Minutes.getTime() < today.getTime();

        return {
            startDate: startDateFormatted,
            endDate: endDateFormatted,
            startDateObj,
            endDateObj,
            isBlurred,
            status,
            showOptions,
            isEnded,
        };
    }, [poll.startDate, poll.endDate]);

    // 투표 결과 가져오기
    const {
        pollDetail,
        isLoadingPollDetail,
        playerPollLogs,
        pollResult,
        isLoading,
        error,
    } = usePollsGet({
        pollDetailInput: {
            pollId: poll.id,
        },
        getPlayerPollLogsInput: {
            pollId: poll.id,
            playerId: player?.id,
        },
        pollResultInput: {
            pollId: poll.id,
        },
    });

    // 투표 제출 훅
    const { participatePoll } = usePollsSet();

    // 베팅 에셋 정보 가져오기 (베팅 모드인 경우에만)
    const { playerAsset } = usePlayerAssetsGet({
        getPlayerAssetInput: {
            assetId:
                pollDetail?.participationConsumeAssetId ||
                pollDetail?.bettingAssetId ||
                "",
            playerId: player?.id || "",
        },
    });

    // 옵션 파싱 (상세 데이터 우선, 없으면 기본 데이터 사용)
    const options = useMemo(
        () => pollDetail?.options as unknown as PollOption[],
        [pollDetail?.options]
    );

    const { totalVoteAmount } = useMemo(() => {
        const totalVoteAmount =
            playerPollLogs?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

        return { totalVoteAmount };
    }, [playerPollLogs]);

    // 정렬된 결과 메모이제이션
    const sortedResults = useMemo(() => {
        return pollResult?.results
            ? [...pollResult.results].sort((a, b) => b.voteCount - a.voteCount)
            : [];
    }, [pollResult]);

    // Calculate total actual votes for betting mode
    const totalActualVotes = useMemo(() => {
        if (!poll.bettingMode || !pollResult?.results) return 0;
        return pollResult.results.reduce((total, result) => {
            return total + (result.actualVoteCount || 0);
        }, 0);
    }, [poll.bettingMode, pollResult?.results]);

    // 베팅 정보 메모이제이션
    const bettingInfo = useMemo(() => {
        if (!poll.bettingMode || !player) {
            return {
                hasBet: false,
                bettingAsset: null,
                myBetLogs: [],
            };
        }

        const hasBet = (playerPollLogs?.length || 0) > 0;

        // 베팅 에셋 정보
        const bettingAsset = playerAsset?.data || null;

        return {
            hasBet,
            bettingAsset,
            playerPollLogs,
        };
    }, [poll.bettingMode, player, playerPollLogs, playerAsset]);

    const { accentColorFrom, accentColorTo } = useMemo(() => {
        return {
            accentColorFrom: poll.bettingMode
                ? "rgba(160, 16, 11, 0.9)"
                : pollDetail?.artist
                ? ArtistBG(pollDetail?.artist, 2, 100)
                : bgColorAccentFrom,
            accentColorTo: poll.bettingMode
                ? "rgba(32,20,47,0.9)"
                : pollDetail?.artist
                ? ArtistBG(pollDetail?.artist, 3, 100)
                : bgColorAccentTo,
        };
    }, [
        poll.bettingMode,
        pollDetail?.artist,
        bgColorAccentFrom,
        bgColorAccentTo,
    ]);

    // 옵션 클릭 핸들러
    const handleOptionClick = useCallback((option: PollOption) => {
        setVotingState((prev) => {
            if (option.optionId === prev.selection?.optionId) {
                return {
                    ...prev,
                    selection: null,
                    animateSubmit: false,
                };
            }

            const newState = {
                ...prev,
                selection: option,
                voteAmount: 1,
            };

            // 애니메이션 효과
            setTimeout(() => {
                setVotingState((current) => ({
                    ...current,
                    animateSubmit: true,
                }));
            }, 100);

            return newState;
        });
    }, []);

    // 베팅 확인 핸들러 (모달에서 호출)
    const handleBettingConfirm = useCallback(
        async (betAmount: number) => {
            const result = await participatePoll({
                pollId: poll.id,
                player: player!,
                optionId: votingState.selection!.optionId,
                amount: betAmount,
                alreadyVotedAmount: totalVoteAmount,
            });

            // 결과 처리
            if (result.success) {
                if (result.error === "MISSED_ANSWER") {
                    toast.error("I'm sorry, you missed the answer.");
                } else {
                    setUIState((prev) => ({
                        ...prev,
                        rewarded: result.playerAssetUpdated || false,
                        showInteractFeedback: true,
                        showBettingModal: false,
                        onchainTxHash: result.onchainTxHash,
                    }));
                }
            } else {
                toast.error(result.error || "Failed to bet.");
            }

            // 상태 초기화
            setVotingState((prev) => ({
                ...prev,
                voteAmount: 1,
                voteAmountInput: "0",
            }));
        },
        [
            poll,
            player,
            votingState.selection,
            participatePoll,
            totalVoteAmount,
            toast,
        ]
    );

    // 투표 제출 핸들러
    const handleSubmit = useCallback(
        async (confirmed = false) => {
            startLoading();
            try {
                // 베팅 모드인 경우 모달 열기
                if (poll.bettingMode && !confirmed) {
                    if (!votingState.selection) {
                        toast.error("Please select an option");
                        return;
                    }
                    if (!player) {
                        toast.error(
                            "Please login to participate in this poll."
                        );
                        return;
                    }
                    setUIState((prev) => ({
                        ...prev,
                        showBettingModal: true,
                    }));
                    return;
                }

                // 정답이 있는 폴인 경우 확인 팝업 표시
                if (poll.hasAnswer && !uiState.confirmedAnswer && !confirmed) {
                    setUIState((prev) => ({
                        ...prev,
                        showAnswerPopup: true,
                        confirmedAnswer: false,
                    }));
                    return;
                }

                // 투표 수량 검증
                if (
                    isNaN(votingState.voteAmount) ||
                    votingState.voteAmount <= 0
                ) {
                    toast.error("Please enter a valid vote amount.");
                    setUIState((prev) => ({
                        ...prev,
                        confirmedAnswer: false,
                        showAnswerPopup: false,
                    }));
                    return;
                }

                // 로그인 검증
                if (!player) {
                    toast.error("Please login to participate in this poll.");
                    setUIState((prev) => ({
                        ...prev,
                        confirmedAnswer: false,
                        showAnswerPopup: false,
                    }));
                    return;
                }

                // 옵션 선택 검증
                if (!votingState.selection) {
                    toast.error("Please select an option");
                    setUIState((prev) => ({
                        ...prev,
                        confirmedAnswer: false,
                        showAnswerPopup: false,
                    }));
                    return;
                }

                if (
                    pollDetail?.participationConsumeAssetId &&
                    pollDetail?.participationConsumeAmount
                ) {
                    const consumeAmount =
                        pollDetail?.participationConsumeAmount *
                        votingState.voteAmount;

                    if (
                        !playerAsset?.data ||
                        playerAsset.data.balance < consumeAmount
                    ) {
                        toast.error(
                            `Insufficient balance for participation fee. Required: ${consumeAmount} ${
                                pollDetail?.participationConsumeAsset?.symbol ||
                                ""
                            } to participate in this poll.`
                        );
                        return;
                    }
                }

                // 투표 제출
                const result = await participatePoll({
                    pollId: poll.id,
                    player: player,
                    optionId: votingState.selection.optionId,
                    amount: votingState.voteAmount,
                    alreadyVotedAmount: totalVoteAmount,
                });

                // 결과 처리
                if (result.success) {
                    if (result.error === "MISSED_ANSWER") {
                        toast.error("I'm sorry, you missed the answer.");
                    } else {
                        setUIState((prev) => ({
                            ...prev,
                            rewarded: result.playerAssetUpdated || false,
                            showInteractFeedback: true,
                            onchainTxHash: result.onchainTxHash,
                        }));
                    }
                } else {
                    toast.error(result.error || "Failed to vote.");
                }

                // 상태 초기화
                setUIState((prev) => ({
                    ...prev,
                    confirmedAnswer: false,
                    showAnswerPopup: false,
                }));
                setVotingState((prev) => ({
                    ...prev,
                    voteAmount: 1,
                    voteAmountInput: "0",
                }));
            } catch (error) {
                console.error(error);
                toast.error(`${error}`);
                setUIState((prev) => ({
                    ...prev,
                    confirmedAnswer: false,
                    showAnswerPopup: false,
                }));
            } finally {
                endLoading();
            }
        },
        [
            pollDetail?.participationConsumeAssetId,
            pollDetail?.participationConsumeAmount,
            pollDetail?.participationConsumeAsset?.symbol,
            totalVoteAmount,
            playerAsset?.data,
            poll,
            player,
            votingState.selection,
            votingState.voteAmount,
            uiState.confirmedAnswer,
            participatePoll,
            startLoading,
            endLoading,
            toast,
        ]
    );

    // 애니메이션 변수 최적화
    const animations = useMemo(
        () => ({
            card: {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
            },
            submit: {
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
            },
        }),
        []
    );

    // 옵션 렌더링 함수
    const renderOptions = useCallback(() => {
        if (!pollDateInfo.showOptions) return null;
        if (isLoadingPollDetail) return null;

        return (
            <motion.div
                className={cn(
                    "grid grid-cols-1 gap-3 w-full",
                    "my-7 sm:my-7 md:my-8 lg:my-9 xl:my-10"
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
            >
                {options.map((option: PollOption) => {
                    const result = sortedResults.find(
                        (result) => result.optionId === option.optionId
                    );

                    const votedCount =
                        playerPollLogs?.reduce((acc, curr) => {
                            if (curr.optionId === option.optionId) {
                                return acc + curr.amount;
                            }
                            return acc;
                        }, 0) || 0;

                    return (
                        <motion.div
                            key={option.optionId}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOptionClick(option);
                            }}
                            onTouchEnd={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleOptionClick(option);
                            }}
                            className={cn(
                                votingState.selection?.optionId ===
                                    option.optionId &&
                                    "text-glow-white-smooth white-glow-smooth border-[rgba(255,255,255,0.3)]",
                                "flex items-center justify-between w-full py-3 px-2 rounded-[10px]",
                                "border border-[rgba(255,255,255,0.1)]",
                                "bg-[rgba(0,0,0,0.05)] inner-shadow",
                                "transition-all duration-300",
                                "hover:bg-[rgba(0,0,0,0.35)]",
                                "hover:scale-[1.02]",
                                "hover:border-[rgba(255,255,255,0.4)]",
                                "cursor-pointer",
                                "relative overflow-hidden",
                                "mx-auto",
                                "touch-action-none"
                            )}
                            initial="initial"
                            animate="animate"
                            whileHover="hover"
                        >
                            {result && uiState.showOngoingResults && (
                                <div className="absolute inset-0">
                                    <div className="h-full -m-1">
                                        <PollBar
                                            result={result}
                                            isBlurred={pollDateInfo.isBlurred}
                                            rank={0}
                                            totalItems={sortedResults.length}
                                            showOptionName={false}
                                            showOptionImage={false}
                                            fillContainer={true}
                                            fgColorFrom={fgColorFrom}
                                            fgColorTo={fgColorTo}
                                            isBettingMode={poll.bettingMode}
                                            totalActualVotes={totalActualVotes}
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="flex-1 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <div
                                        className={cn(
                                            uiState.showOngoingResults &&
                                                "opacity-0",
                                            votingState.selection?.optionId ===
                                                option.optionId && "white-glow",
                                            "w-6 h-6 rounded-full z-10",
                                            "border-2 border-[rgba(255,255,255,0.3)]",
                                            "relative",
                                            "transition-all duration-300",
                                            "flex-shrink-0",
                                            getResponsiveClass(20).frameClass,
                                            votingState.selection?.optionId ===
                                                option.optionId &&
                                                "bg-[rgba(255,255,255,0.2)]"
                                        )}
                                    >
                                        {votingState.selection?.optionId ===
                                            option.optionId && (
                                            <div
                                                className="
                                                absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                                                w-3 h-3 rounded-full
                                                bg-white
                                                shadow-[0_0_8px_rgba(255,255,255,0.8)]
                                            "
                                            />
                                        )}
                                    </div>

                                    <p
                                        className={cn(
                                            "text-[rgba(255,255,255,0.9)] z-10 leading-0",
                                            getResponsiveClass(20).textClass,
                                            "leading-none"
                                        )}
                                    >
                                        {option.name}
                                    </p>
                                </div>
                                {/* 투표 확인 아이콘 */}
                                <div
                                    className={cn(
                                        "transition-all duration-300",
                                        "flex items-center justify-center text-right",
                                        votedCount > 0
                                            ? "opacity-40"
                                            : "opacity-0",
                                        getResponsiveClass(10).textClass,
                                        uiState.showOngoingResults &&
                                            "opacity-0",
                                        "flex-shrink-0 ml-3"
                                    )}
                                >
                                    <h2>{votedCount || "00"}</h2>
                                </div>
                            </div>

                            {/* 옵션의 이미지가 있을 경우 렌더링 */}
                            {option.imgUrl && (
                                <div
                                    className="absolute inset-0 z-0 inner-shadow"
                                    style={{
                                        backgroundImage: `url(${option.imgUrl})`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                        backgroundRepeat: "no-repeat",
                                        opacity: 0.45,
                                        mixBlendMode: "overlay",
                                    }}
                                />
                            )}
                        </motion.div>
                    );
                })}
            </motion.div>
        );
    }, [
        isLoadingPollDetail,
        pollDateInfo.showOptions,
        options,
        sortedResults,
        playerPollLogs,
        uiState.showOngoingResults,
        pollDateInfo.isBlurred,
        fgColorFrom,
        fgColorTo,
        votingState.selection,
        handleOptionClick,
        poll.bettingMode,
        totalActualVotes,
    ]);

    // 결과 차트 렌더링 함수
    const renderResults = useCallback(() => {
        if (!pollDateInfo.isEnded) return null;
        if (isLoadingPollDetail) return null;

        const optionsLength = options?.length || 0;

        return (
            <div className="mt-6">
                {isLoading || isLoadingPollDetail ? (
                    <div className="animate-pulse">
                        {Array.from({ length: optionsLength }).map((_, idx) => (
                            <div
                                key={idx}
                                className="h-[34px] bg-[rgba(255,255,255,0.3)] rounded mb-2"
                            ></div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-red-500 text-sm">
                        Error loading poll results
                    </div>
                ) : (
                    <>
                        {sortedResults.map((result, idx) => (
                            <PollBar
                                key={result.optionId}
                                result={result}
                                isBlurred={pollDateInfo.isBlurred}
                                rank={idx}
                                totalItems={sortedResults.length}
                                fgColorFrom={fgColorFrom}
                                fgColorTo={fgColorTo}
                                isBettingMode={poll.bettingMode}
                                totalActualVotes={totalActualVotes}
                            />
                        ))}
                        {pollDateInfo.isBlurred && (
                            <p className="text-xs font-light text-[rgba(255,255,255,0.6)]">
                                * States hidden before 3 days of end date.
                                Result will be revealed on X after closing.
                            </p>
                        )}
                    </>
                )}
            </div>
        );
    }, [
        isLoadingPollDetail,
        options,
        pollDateInfo.isEnded,
        isLoading,
        error,
        sortedResults,
        pollDateInfo.isBlurred,
        fgColorFrom,
        fgColorTo,
        poll.bettingMode,
        totalActualVotes,
    ]);

    // 제출 버튼 렌더링 함수
    const renderSubmitButton = useCallback(() => {
        if (!pollDateInfo.showOptions || !votingState.selection) return null;
        if (isLoadingPollDetail) return null;

        return (
            <motion.div
                className={cn(
                    votingState.animateSubmit ? "opacity-100" : "opacity-0"
                )}
                variants={animations.submit}
                initial="initial"
                animate="animate"
            >
                {/* 참여 비용 정보 - options 바로 위 배치 */}
                {pollDetail?.participationConsumeAssetId &&
                    pollDetail?.participationConsumeAmount && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={cn(
                                "flex flex-row items-center justify-center gap-3 p-3 mb-4",
                                "rounded-[16px] relative overflow-hidden",
                                "bg-gradient-to-r from-[rgba(255,100,100,0.1)] to-[rgba(255,150,150,0.2)]",
                                "border border-[rgba(255,150,150,0.3)]",
                                "backdrop-blur-sm inner-shadow",
                                "transition-all duration-300",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            {/* 아이콘과 텍스트 */}
                            <div className="relative z-10 flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[rgba(255,233,233,0.9)] font-medium">
                                        Participation Fee:
                                    </span>
                                    <Image
                                        src={
                                            pollDetail
                                                ?.participationConsumeAsset
                                                ?.imageUrl || "/icons/coin.svg"
                                        }
                                        alt={
                                            pollDetail
                                                ?.participationConsumeAsset
                                                .name || ""
                                        }
                                        width={24}
                                        height={24}
                                        className={cn(
                                            "object-contain",
                                            getResponsiveClass(20).frameClass
                                        )}
                                    />
                                    <span className="text-[rgba(255,233,233,1)] font-semibold">
                                        {pollDetail?.participationConsumeAmount ||
                                            0}{" "}
                                        {pollDetail?.participationConsumeAsset
                                            ?.symbol || ""}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                <div
                    onClick={() => void handleSubmit()}
                    onTouchEnd={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        void handleSubmit();
                    }}
                    className={cn(
                        "cursor-pointer relative text-center",
                        "w-full hover:glow-purple rounded-full font-main",
                        "transition-all duration-300 ease-in",
                        "mb-[50px]",
                        "touch-action-none",
                        getResponsiveClass(30).paddingClass,
                        getResponsiveClass(15).textClass
                    )}
                    style={{
                        background: `${
                            poll.bettingMode
                                ? "linear-gradient(to bottom right,rgba(147, 45, 67, 0.84),rgba(147, 34, 124, 0.84))"
                                : `linear-gradient(to bottom right, ${bgColorFrom}, ${bgColorTo})`
                        }`,
                    }}
                >
                    {poll.bettingMode
                        ? "BET"
                        : pollDetail?.participationConsumeAssetId &&
                          pollDetail?.participationConsumeAmount
                        ? "SUBMIT WITH FEE"
                        : "SUBMIT"}
                    {poll.bettingMode && (
                        <div className="absolute inset-0 pointer-events-none z-0">
                            <img
                                src="/elements/fire-background.gif"
                                alt="Fire background"
                                className="absolute inset-0 w-full h-full object-cover opacity-20"
                                style={{
                                    mixBlendMode: "overlay",
                                    filter: "hue-rotate(10deg) saturate(1.3) brightness(1.1)",
                                }}
                            />
                        </div>
                    )}
                </div>
            </motion.div>
        );
    }, [
        votingState.animateSubmit,
        votingState.selection,
        isLoadingPollDetail,
        poll,
        pollDateInfo.showOptions,
        pollDetail,
        handleSubmit,
        animations.submit,
        bgColorFrom,
        bgColorTo,
    ]);

    // 보상 정보 렌더링 함수
    const renderRewardInfo = useCallback(() => {
        if (
            (poll.endDate && poll.endDate < new Date()) ||
            !poll.participationRewardAssetId ||
            !poll.participationRewardAmount ||
            (playerPollLogs?.length || 0) > 0
        ) {
            return null;
        }

        const rewardAsset = poll.participationRewardAsset;
        const rewardAmount = poll.participationRewardAmount;

        return (
            <div className={getResponsiveClass(10).marginYClass}>
                <div
                    className={cn(
                        "flex items-center justify-between p-3 rounded-[12px]",
                        "bg-gradient-to-r from-[rgba(255,255,255,0.05)] to-[rgba(255,255,255,0.15)]",
                        "border border-[rgba(255,255,255,0.3)] mb-[40px]",
                        "inner-shadow"
                    )}
                >
                    <div className="flex items-center gap-3">
                        {/* 보상 정보 텍스트 */}
                        <div className="flex flex-col">
                            <h3
                                className={cn(
                                    "text-[rgba(255,235,150,0.9)] font-medium",
                                    getResponsiveClass(20).textClass
                                )}
                            >
                                Voting Reward
                            </h3>
                            <div className="flex flex-row items-center gap-2">
                                {/* 보상 아이콘 */}
                                <div
                                    className={cn(
                                        "flex items-center justify-center flex-shrink-0",
                                        "w-8 h-8 rounded-full",
                                        "bg-gradient-to-br from-[rgba(255,215,0,0.3)] to-[rgba(255,193,7,0.2)]",
                                        "border border-[rgba(255,215,0,0.4)]",
                                        getResponsiveClass(20).frameClass
                                    )}
                                >
                                    {rewardAsset?.iconUrl ? (
                                        <Image
                                            src={rewardAsset.iconUrl}
                                            alt={rewardAsset.name}
                                            width={32}
                                            height={32}
                                            className="w-full h-full rounded-full object-contain"
                                        />
                                    ) : (
                                        <Image
                                            src="/icons/reward-star.svg"
                                            alt="reward"
                                            className="w-5 h-5 opacity-80"
                                            width={32}
                                            height={32}
                                        />
                                    )}
                                </div>
                                <p
                                    className={cn(
                                        "text-[rgba(255,255,255,0.8)]",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    {rewardAsset?.name}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 보상 수량 강조 */}
                    <div
                        className={cn(
                            "flex items-center justify-center",
                            "rounded-[16px]",
                            "bg-gradient-to-r from-[rgba(255,255,255,0.05)] to-[rgba(255,255,255,0.15)]",
                            "border border-[rgba(255,255,255,0.3)]",
                            "text-glow-gold-soft",
                            getResponsiveClass(15).paddingClass
                        )}
                    >
                        <span
                            className={cn(
                                "text-[rgba(255,255,255,1)] font-semibold",
                                getResponsiveClass(20).textClass
                            )}
                        >
                            +{rewardAmount}
                        </span>
                    </div>
                </div>
            </div>
        );
    }, [
        poll.endDate,
        poll.participationRewardAssetId,
        poll.participationRewardAmount,
        poll.participationRewardAsset,
        playerPollLogs,
    ]);

    // Poll 특성 태그들 렌더링 함수
    const renderPollTags = useCallback(() => {
        const tags = [];

        // Artist 태그 (가장 먼저 배치)
        if (poll.artist) {
            tags.push({
                label: poll?.artist?.name,
                artistLogo: poll?.artist?.logoUrl,
                color: "from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-300",
            });
        } else {
            tags.push({
                label: "General",
                emoji: "🌍",
                color: "from-gray-500/20 to-slate-500/20 border-gray-500/30 text-gray-300",
            });
        }

        // Betting Mode 태그
        if (poll.bettingMode) {
            tags.push({
                label: "Betting Mode",
                emoji: "🎰",
                color: "from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-300",
            });
        }

        // Multiple Vote 태그
        if (poll.allowMultipleVote) {
            tags.push({
                label: "Multi Vote",
                emoji: "✨",
                color: "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300",
            });
        }

        // Has Answer 태그
        if (poll.hasAnswer) {
            tags.push({
                label: "Quiz",
                emoji: "🧠",
                color: "from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-300",
            });
        }

        // Onchain 태그
        if (poll.isOnchain) {
            tags.push({
                label: "Onchain",
                emoji: "⛓️",
                color: "from-indigo-500/20 to-purple-500/20 border-indigo-500/30 text-indigo-300",
            });
        }

        return (
            <div
                className={cn(
                    "flex flex-wrap gap-2 mt-3",
                    getResponsiveClass(10).marginYClass
                )}
            >
                {tags.map((tag, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                            "flex items-center gap-1 rounded-full relative overflow-hidden",
                            "backdrop-blur-sm border font-medium text-xs",
                            "transition-all duration-300",
                            "morp-glass-2",
                            getResponsiveClass(10).paddingClass
                        )}
                    >
                        {tag.artistLogo ? (
                            <Image
                                src={tag.artistLogo}
                                alt={tag.label}
                                width={32}
                                height={32}
                                className={cn(
                                    "object-contain",
                                    getResponsiveClass(15).frameClass
                                )}
                            />
                        ) : (
                            <span>{tag.emoji}</span>
                        )}

                        {tag.label === "Betting Mode" && (
                            <>
                                {/* 메인 불길 GIF */}
                                <div className="absolute inset-0 pointer-events-none z-0">
                                    <img
                                        src="/elements/fire-background.gif"
                                        alt="Fire background"
                                        className="absolute inset-0 w-full h-full object-cover opacity-20"
                                        style={{
                                            mixBlendMode: "overlay",
                                            filter: "hue-rotate(10deg) saturate(1.3) brightness(1.1)",
                                        }}
                                    />
                                </div>
                            </>
                        )}

                        <span>{tag.label}</span>
                    </motion.div>
                ))}
            </div>
        );
    }, [
        poll.artist,
        poll.bettingMode,
        poll.allowMultipleVote,
        poll.hasAnswer,
        poll.isOnchain,
    ]);

    // 정답 확인 팝업 렌더링 함수
    const renderAnswerConfirmPopup = useCallback(() => {
        if (!poll.hasAnswer || uiState.confirmedAnswer) return null;

        return (
            <Popup
                open={uiState.showAnswerPopup}
                width="w-full"
                onClose={() =>
                    setUIState((prev) => ({
                        ...prev,
                        showAnswerPopup: false,
                    }))
                }
            >
                <div className="flex flex-col items-center justify-center p-10 gap-2 rounded-2xl">
                    <Image
                        src="/ui/information.svg"
                        alt="info"
                        width={32}
                        height={32}
                        className={cn(getResponsiveClass(60).frameClass)}
                    />
                    <h2
                        className={cn(
                            "text-center text-[rgba(255,255,255,0.9)] font-semibold",
                            getResponsiveClass(30).textClass
                        )}
                    >
                        This poll has the correct answer.
                    </h2>
                    <p
                        className={cn(
                            "text-center text-[rgba(255,255,255,0.7)]",
                            getResponsiveClass(20).textClass
                        )}
                    >
                        Please confirm your selected answer before proceeding
                        with your vote.{" "}
                        <strong>
                            If you choose wrong, you will not be able to get the
                            reward.
                        </strong>
                    </p>

                    <div className="w-full flex flex-col items-center my-6 text-center">
                        <div
                            className={cn(
                                "px-4 py-2 rounded-lg inner-shadow font-main text-glow-white-smooth",
                                "bg-gradient-to-br from-[rgba(0,0,0,0.05)] to-[rgba(0,0,0,0.2)]",
                                getResponsiveClass(25).textClass
                            )}
                        >
                            {votingState.selection?.name}
                        </div>
                    </div>

                    <Button
                        onClick={() => {
                            setUIState((prev) => ({
                                ...prev,
                                confirmedAnswer: true,
                            }));
                            void handleSubmit(true);
                        }}
                        textSize={15}
                    >
                        Confirm and Submit
                    </Button>
                </div>
            </Popup>
        );
    }, [
        poll.hasAnswer,
        uiState.confirmedAnswer,
        uiState.showAnswerPopup,
        votingState.selection,
        handleSubmit,
    ]);

    // 새로운 renderFooter 함수로 통합
    const renderFooter = useCallback(() => {
        const showBettingButton = poll.bettingMode;
        const showBettingRecordButton = poll.bettingMode && bettingInfo.hasBet;
        const showResultsButton =
            pollDateInfo.status === "ONGOING" &&
            (playerPollLogs?.length || 0) > 0 &&
            !(poll.hasAnswer && (playerPollLogs?.length || 0) === 0) &&
            !poll.bettingMode;

        // 아무것도 안 보이면 footer 자체를 렌더링하지 않음
        if (
            !showBettingButton &&
            !showBettingRecordButton &&
            !showResultsButton
        ) {
            return null;
        }

        return (
            <div
                className={cn(
                    "flex items-center justify-between mt-3",
                    "w-full relative z-10"
                )}
            >
                {/* Left side - How it works button & Betting record button */}
                <div className="flex gap-2">
                    {showBettingButton && (
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setUIState((prev) => ({
                                    ...prev,
                                    showBettingTutorial: true,
                                }));
                            }}
                            onTouchEnd={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setUIState((prev) => ({
                                    ...prev,
                                    showBettingTutorial: true,
                                }));
                            }}
                            className={cn(
                                "rounded-full flex items-center gap-1",
                                "bg-gradient-to-r from-orange-900/30 to-red-900/30",
                                "border border-orange-500/40",
                                "text-orange-300 hover:text-orange-200",
                                "transition-all duration-300",
                                "hover:scale-105 hover:border-orange-400/60",
                                "cursor-pointer",
                                "touch-action-none",
                                getResponsiveClass(10).textClass,
                                getResponsiveClass(15).paddingClass
                            )}
                        >
                            <span>❓</span>
                            <span>How it works</span>
                        </motion.button>
                    )}

                    {showBettingRecordButton && (
                        <motion.button
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                scale: [0.9, 1.05, 1],
                                boxShadow: [
                                    "0 0 0 rgba(34, 197, 94, 0)",
                                    "0 0 15px rgba(34, 197, 94, 0.4)",
                                    "0 0 0 rgba(34, 197, 94, 0)",
                                ],
                            }}
                            transition={{
                                delay: 0.5,
                                scale: { duration: 0.6 },
                                boxShadow: {
                                    duration: 2.5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                },
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setUIState((prev) => ({
                                    ...prev,
                                    showBettingRecord: true,
                                }));
                            }}
                            onTouchEnd={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setUIState((prev) => ({
                                    ...prev,
                                    showBettingRecord: true,
                                }));
                            }}
                            whileHover={{
                                scale: 1.08,
                                boxShadow: "0 0 20px rgba(34, 197, 94, 0.6)",
                            }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                                "rounded-full flex items-center gap-1 relative overflow-hidden",
                                "bg-gradient-to-r from-green-900/30 to-emerald-900/30",
                                "border border-green-500/50",
                                "text-green-300 hover:text-green-200",
                                "transition-all duration-300",
                                "cursor-pointer font-medium",
                                "touch-action-none",
                                getResponsiveClass(10).textClass,
                                getResponsiveClass(15).paddingClass
                            )}
                        >
                            {/* 반짝이는 효과 */}
                            <motion.div
                                animate={{
                                    x: ["-100%", "100%"],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "linear",
                                    repeatDelay: 1,
                                }}
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            />
                            <motion.span
                                animate={{
                                    rotate: [0, 15, -15, 0],
                                    scale: [1, 1.1, 1],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            >
                                🎰
                            </motion.span>
                            <span className="relative z-10">My Bets</span>
                        </motion.button>
                    )}
                </div>

                {showResultsButton && (
                    <div className="flex">
                        <div className="relative">
                            <Image
                                src="/icons/charts-fill.svg"
                                alt="charts-fill"
                                width={32}
                                height={32}
                                className={cn(
                                    uiState.showOngoingResults
                                        ? "opacity-45"
                                        : "opacity-0",
                                    "transition-all duration-300 ease-in cursor-pointer",
                                    "touch-action-none",
                                    getResponsiveClass(25).frameClass
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setUIState((prev) => ({
                                        ...prev,
                                        showOngoingResults:
                                            !prev.showOngoingResults,
                                    }));
                                }}
                                onTouchEnd={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setUIState((prev) => ({
                                        ...prev,
                                        showOngoingResults:
                                            !prev.showOngoingResults,
                                    }));
                                }}
                            />
                            <Image
                                src="/icons/charts-stroke.svg"
                                alt="charts-stroke"
                                width={32}
                                height={32}
                                className={cn(
                                    !uiState.showOngoingResults
                                        ? "opacity-45"
                                        : "opacity-0",
                                    "absolute top-0 left-0",
                                    "transition-all duration-300 ease-in cursor-pointer",
                                    "touch-action-none",
                                    getResponsiveClass(25).frameClass
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setUIState((prev) => ({
                                        ...prev,
                                        showOngoingResults:
                                            !prev.showOngoingResults,
                                    }));
                                }}
                                onTouchEnd={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setUIState((prev) => ({
                                        ...prev,
                                        showOngoingResults:
                                            !prev.showOngoingResults,
                                    }));
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    }, [
        poll.bettingMode,
        bettingInfo.hasBet,
        pollDateInfo.status,
        poll.hasAnswer,
        playerPollLogs,
        uiState.showOngoingResults,
    ]);

    return (
        <>
            <PopupInteractFeedback
                open={uiState.showInteractFeedback}
                onClose={() =>
                    setUIState((prev) => ({
                        ...prev,
                        showInteractFeedback: false,
                    }))
                }
                title={
                    pollDetail?.hasAnswer
                        ? "Correct Answer!"
                        : pollDetail?.isOnchain && uiState.onchainTxHash
                        ? "Tx Confirmed!"
                        : "Thanks for voting!"
                }
                description={
                    pollDetail?.hasAnswer
                        ? "You've selected the correct answer. Thank you for your participation!"
                        : pollDetail?.isOnchain && uiState.onchainTxHash
                        ? "Your vote has been recorded on the blockchain. Transaction details are shown below."
                        : "Your opinion matters to us. Stay tuned for the results!"
                }
                type="success"
                autoCloseMs={6000}
                showReward={uiState.rewarded}
                reward={pollDetail?.participationRewardAsset || null}
                rewardAmount={pollDetail?.participationRewardAmount || 0}
                hasTxHash={pollDetail?.isOnchain && !!uiState.onchainTxHash}
                txHash={uiState.onchainTxHash}
            />
            {pollDetail?.bettingMode && votingState.selection && player && (
                <PollBettingParticipationModal
                    isOpen={uiState.showBettingModal}
                    onClose={() =>
                        setUIState((prev) => ({
                            ...prev,
                            showBettingModal: false,
                        }))
                    }
                    onConfirm={handleBettingConfirm}
                    poll={pollDetail}
                    player={player}
                    selectedOption={votingState.selection}
                    isLoading={false}
                />
            )}
            {renderAnswerConfirmPopup()}
            <PollsBettingModeTutorialModal
                isOpen={uiState.showBettingTutorial}
                onClose={() =>
                    setUIState((prev) => ({
                        ...prev,
                        showBettingTutorial: false,
                    }))
                }
            />

            {/* 베팅 현황 모달 */}
            {pollDetail &&
                bettingInfo.hasBet &&
                bettingInfo.bettingAsset &&
                player && (
                    <PollBettingRecord
                        isOpen={uiState.showBettingRecord}
                        onClose={() =>
                            setUIState((prev) => ({
                                ...prev,
                                showBettingRecord: false,
                            }))
                        }
                        poll={pollDetail}
                        pollLogs={playerPollLogs || []}
                        bettingAsset={bettingInfo.bettingAsset}
                    />
                )}

            <div className="relative w-full max-w-[800px] min-w-[180px] my-[25px] mx-auto">
                <div
                    className={cn(
                        "absolute inset-0 rounded-[16px] pointer-events-none transition-opacity duration-300 ease-out -z-40",
                        isSelected ? "opacity-100" : "opacity-0"
                    )}
                    style={{
                        background: `linear-gradient(to bottom right, ${accentColorFrom}, ${accentColorTo})`,
                    }}
                />

                <div
                    className={cn(
                        "flex flex-col p-[12px] border border-[rgba(255,255,255,0.4)] rounded-[16px]",
                        "transition-opacity duration-300 ease-out", // opacity만 transition 적용
                        "bg-gradient-to-br from-[rgba(0,0,0,0.1)] to-[rgba(255,255,255,0.15)]",
                        "relative overflow-hidden"
                    )}
                >
                    <div className="relative z-10">
                        {/* 이미지 섹션 */}
                        <div className="gradient-border rounded-[16px] p-[1px] shadow-sm">
                            <div className="aspect-[2.0625/1] relative">
                                <PollThumbnail
                                    poll={poll}
                                    className="rounded-[16px] shadow-md w-full h-full"
                                    imageClassName="rounded-[16px]"
                                />
                            </div>
                        </div>

                        {/* 폴 정보 섹션 */}
                        <div className="flex flex-wrap items-center justify-between mt-3">
                            <div
                                className={cn(
                                    "flex flex-row gap-1",
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                <div className="morp-glass-1 rounded-full py-1 px-3">
                                    <h2>{pollDateInfo.status}</h2>
                                </div>
                            </div>

                            {pollDateInfo.status !== "ENDED" &&
                                pollDateInfo.status !== "UPCOMING" && (
                                    <div>
                                        <Countdown
                                            endDate={pollDateInfo.endDateObj}
                                            size={15}
                                            className="font-main opacity-50"
                                        />
                                    </div>
                                )}
                        </div>

                        {/* 제목 섹션 */}
                        <div className="mt-3 relative z-10">
                            <h2
                                className={cn(
                                    "text-2xl text-[rgba(255,255,255,0.85)]",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                #{poll.id.replace(/^p0+/, "")}
                            </h2>
                            <h2
                                className={cn(
                                    " text-[rgba(255,255,255,1)] break-words",
                                    "text-xl",
                                    getResponsiveClass(25).textClass,
                                    "!leading-tight"
                                )}
                            >
                                {poll.title}
                            </h2>
                            <p
                                className={cn(
                                    "text-xs text-[rgba(255,255,255,0.6)]",
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                {pollDateInfo.startDate} ~{" "}
                                {pollDateInfo.endDate}
                            </p>

                            {/* Poll 특성 태그들 */}
                            {renderPollTags()}
                        </div>

                        {/* UPCOMING 상태일 경우 옵션 대신 COUNTDOWN 렌더링 */}
                        {pollDateInfo.status === "UPCOMING" && (
                            <div
                                className={cn(
                                    "my-6 flex-col items-center justify-center text-center",
                                    "rounded-[16px] p-3 inner-shadow"
                                )}
                                style={{
                                    background: `linear-gradient(to bottom right, rgba(0,0,0,0.05), rgba(0,0,0,0.1))`,
                                }}
                            >
                                <h3
                                    className={cn(
                                        "text-[rgba(255,255,255,0.85)]",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    OPEN IN
                                </h3>
                                <Countdown
                                    endDate={pollDateInfo.startDateObj}
                                    size={30}
                                    className="font-main text-center"
                                />
                            </div>
                        )}

                        {isLoading || isLoadingPollDetail ? (
                            <div className="flex justify-center items-center h-32">
                                <div className="text-white/60 text-sm">
                                    Loading poll details...
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* 옵션 섹션 */}
                                {renderOptions()}

                                {/* 보상 정보 - options 바로 아래 배치 */}
                                {renderRewardInfo()}

                                {/* 차트 섹션 */}
                                {renderResults()}

                                {/* Submit Button */}
                                {renderSubmitButton()}

                                {/* Footer - How it works & Results toggle buttons */}
                                {renderFooter()}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default memo(PollsListCard);
