/// components/polls/Polls.List.Card.tsx

"use client";

import { memo, useCallback, useMemo, useState } from "react";

import { motion } from "framer-motion";

import { useAssetsGet } from "@/app/hooks/useAssets";
import { useLoading } from "@/app/hooks/useLoading";
import { usePollsGet, usePollsSet } from "@/app/hooks/usePolls";
import { useToast } from "@/app/hooks/useToast";
import PollBar from "@/components/atoms/Polls.Bar";
import PollThumbnail from "@/components/atoms/Polls.Thumbnail";
import { formatDate } from "@/lib/utils/format";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import Button from "../atoms/Button";
import Countdown from "../atoms/Countdown";
import Doorman from "../atoms/Doorman";
import Popup from "../atoms/Popup";
import PopupInteractFeedback from "../atoms/Popup.InteractFeedback";

import type { PollOption } from "@/app/actions/polls";
import type { TokenGatingData } from "@/app/story/nft/actions";
import type { Artist, Player, Poll, PollLog } from "@prisma/client";

interface PollsCardProps {
    index?: number;
    poll: Poll;
    player: Player | null;
    pollLogs?: PollLog[];
    artist?: Artist | null;
    tokenGating?: TokenGatingData | null;
    isSelected?: boolean;
    fgColorFrom?: string;
    fgColorTo?: string;
    bgColorFrom?: string;
    bgColorTo?: string;
    bgColorAccentFrom?: string;
    bgColorAccentTo?: string;
}

function PollsListCard({
    poll,
    player,
    pollLogs,
    tokenGating,
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

    // 날짜 관련 계산 메모이제이션
    const {
        startDate,
        endDate,
        startDateObj,
        endDateObj,
        isBlurred,
        status,
        showOptions,
        isEnded,
    } = useMemo(() => {
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

    // 자산 정보 가져오기
    const { asset } = useAssetsGet({
        getAssetInput: {
            id: poll.participationRewardAssetId || "",
        },
    });

    // 투표 결과 가져오기
    const { pollResult, isLoading, error } = usePollsGet({
        pollResultInput: {
            pollId: poll.id,
        },
    });

    // 투표 제출 훅
    const { participatePoll } = usePollsSet();

    // 옵션 파싱
    const options = useMemo(
        () => poll.options as unknown as PollOption[],
        [poll.options]
    );

    // 정렬된 결과 메모이제이션
    const sortedResults = useMemo(() => {
        return pollResult?.results
            ? [...pollResult.results].sort((a, b) => b.voteCount - a.voteCount)
            : [];
    }, [pollResult]);

    // 상태 관리
    const [showOngoingResults, setShowOngoingResults] = useState(false);
    const [selection, setSelection] = useState<PollOption | null>(null);
    const [animateSubmit, setAnimateSubmit] = useState(false);
    const [voteAmount, setVoteAmount] = useState(0);
    const [voteAmountInput, setVoteAmountInput] = useState("0");
    const [confirmedAnswer, setConfirmedAnswer] = useState(false);
    const [showAnswerPopup, setShowAnswerPopup] = useState(false);
    const [showInteractFeedback, setShowInteractFeedback] = useState(false);
    const [rewarded, setRewarded] = useState(false);

    const { alreadyVotedAmount, maxVoteAmount, permission } = useMemo(() => {
        const permission = tokenGating?.hasToken;
        const alreadyVotedAmount =
            pollLogs?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

        let maxVoteAmount = 0;
        if (poll.needToken && tokenGating) {
            maxVoteAmount = Math.max(
                0,
                tokenGating.detail.length - alreadyVotedAmount
            );
        }

        return {
            alreadyVotedAmount,
            maxVoteAmount,
            permission,
        };
    }, [tokenGating, poll.needToken, pollLogs]);

    // 옵션 클릭 핸들러
    const handleOptionClick = useCallback(
        (option: PollOption) => {
            if (option.optionId === selection?.optionId) {
                setSelection(null);
                return;
            }
            setSelection(option);
            setVoteAmount(poll.needToken && poll.needTokenAddress ? 0 : 1);

            // 애니메이션 효과
            setTimeout(() => {
                setAnimateSubmit(true);
            }, 100);
        },
        [selection, poll.needToken, poll.needTokenAddress]
    );

    // 투표 제출 핸들러
    const handleSubmit = useCallback(
        async (confirmed = false) => {
            startLoading();
            try {
                // 정답이 있는 폴인 경우 확인 팝업 표시
                if (poll.hasAnswer && !confirmedAnswer && !confirmed) {
                    setShowAnswerPopup(true);
                    setConfirmedAnswer(false);
                    return;
                }

                // 투표 수량 검증
                if (isNaN(voteAmount) || voteAmount <= 0) {
                    toast.error("Please enter a valid vote amount.");
                    setConfirmedAnswer(false);
                    setShowAnswerPopup(false);
                    return;
                }

                // 로그인 검증
                if (!player) {
                    toast.error("Please login to participate in this poll.");
                    setConfirmedAnswer(false);
                    setShowAnswerPopup(false);
                    return;
                }

                // 옵션 선택 검증
                if (!selection) {
                    toast.error("Please select an option");
                    setConfirmedAnswer(false);
                    setShowAnswerPopup(false);
                    return;
                }

                // 토큰 게이팅 검증
                if (poll.needToken && poll.needTokenAddress) {
                    if (!tokenGating) {
                        toast.error(
                            "Please wait for the token gating process to complete."
                        );
                        setConfirmedAnswer(false);
                        setShowAnswerPopup(false);
                        return;
                    }
                    if (!tokenGating?.hasToken) {
                        toast.error(
                            "This polls is need an authentication. Please purchase the NFT before participation."
                        );
                        setConfirmedAnswer(false);
                        setShowAnswerPopup(false);
                        return;
                    }

                    // 남은 토큰 수량 검증
                    const remainingTokenCount =
                        tokenGating.detail.length -
                        (voteAmount + alreadyVotedAmount);
                    if (remainingTokenCount < 0) {
                        toast.error(
                            "You've used all your tokens for this poll. Please purchase more NFTs to participate in this poll."
                        );
                        setConfirmedAnswer(false);
                        setShowAnswerPopup(false);
                        return;
                    }
                }

                // 투표 제출
                const result = await participatePoll({
                    poll: poll,
                    player: player,
                    optionId: selection.optionId,
                    amount: voteAmount,
                    tokenGating: tokenGating || undefined,
                    alreadyVotedAmount,
                });

                // 결과 처리
                if (result.success) {
                    if (result.error === "MISSED_ANSWER") {
                        toast.error("I'm sorry, you missed the answer.");
                    } else {
                        setRewarded(result.playerAssetUpdated || false);
                        setShowInteractFeedback(true);
                    }
                } else {
                    toast.error(result.error || "Failed to vote.");
                }

                // 상태 초기화
                setConfirmedAnswer(false);
                setShowAnswerPopup(false);
                setVoteAmount(poll.needToken && poll.needTokenAddress ? 0 : 1);
                setVoteAmountInput("0");
            } catch (error) {
                console.error(error);
                toast.error(`${error}`);
                setConfirmedAnswer(false);
                setShowAnswerPopup(false);
            } finally {
                endLoading();
            }
        },
        [
            poll,
            player,
            selection,
            voteAmount,
            tokenGating,
            alreadyVotedAmount,
            confirmedAnswer,
            participatePoll,
            startLoading,
            endLoading,
            toast,
        ]
    );

    // 투표 수량 변경 핸들러
    const handleVoteAmountChange = useCallback(
        (value: string) => {
            if (/^\d*$/.test(value)) {
                setVoteAmountInput(value);
                const num = parseInt(value, 10);
                if (!isNaN(num) && num > 0) {
                    const amount = Math.min(maxVoteAmount, num);
                    setVoteAmount(amount);
                    setVoteAmountInput(amount.toString());
                }
            }
        },
        [maxVoteAmount]
    );

    // 투표 수량 증가/감소 핸들러
    const increaseVoteAmount = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            const amount = Math.min(maxVoteAmount, voteAmount + 1);
            setVoteAmount(amount);
            setVoteAmountInput(amount.toString());
        },
        [voteAmount, maxVoteAmount]
    );

    const decreaseVoteAmount = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            const amount = Math.max(0, voteAmount - 1);
            setVoteAmount(amount);
            setVoteAmountInput(amount.toString());
        },
        [voteAmount]
    );

    // 애니메이션 변수
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
        if (!showOptions) return null;

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
                        pollLogs?.reduce((acc, curr) => {
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
                            className={cn(
                                selection?.optionId === option.optionId &&
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
                                "mx-auto"
                            )}
                            initial="initial"
                            animate="animate"
                            whileHover="hover"
                        >
                            {result && showOngoingResults && (
                                <div className="absolute inset-0">
                                    <div className="h-full -m-1">
                                        <PollBar
                                            result={result}
                                            isBlurred={isBlurred}
                                            rank={0}
                                            totalItems={sortedResults.length}
                                            showOptionName={false}
                                            showOptionImage={false}
                                            fillContainer={true}
                                            fgColorFrom={fgColorFrom}
                                            fgColorTo={fgColorTo}
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="flex-1 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <div
                                        className={cn(
                                            showOngoingResults && "opacity-0",
                                            selection?.optionId ===
                                                option.optionId && "white-glow",
                                            "w-6 h-6 rounded-full z-10",
                                            "border-2 border-[rgba(255,255,255,0.3)]",
                                            "relative",
                                            "transition-all duration-300",
                                            "flex-shrink-0",
                                            getResponsiveClass(20).frameClass,
                                            selection?.optionId ===
                                                option.optionId &&
                                                "bg-[rgba(255,255,255,0.2)]"
                                        )}
                                    >
                                        {selection?.optionId ===
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

                                    <h3
                                        className={cn(
                                            "text-[rgba(255,255,255,0.9)] z-10 leading-0",
                                            getResponsiveClass(15).textClass,
                                            "leading-none"
                                        )}
                                    >
                                        {option.name}
                                    </h3>
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
                                        showOngoingResults && "opacity-0",
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
        showOptions,
        options,
        sortedResults,
        pollLogs,
        showOngoingResults,
        isBlurred,
        fgColorFrom,
        fgColorTo,
        selection,
        handleOptionClick,
    ]);

    // 결과 차트 렌더링 함수
    const renderResults = useCallback(() => {
        if (!isEnded) return null;

        return (
            <div className="mt-6">
                {isLoading ? (
                    <div className="animate-pulse">
                        {Array.from({ length: options.length }).map(
                            (_, idx) => (
                                <div
                                    key={idx}
                                    className="h-[34px] bg-[rgba(255,255,255,0.3)] blur-sm rounded mb-2"
                                ></div>
                            )
                        )}
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
                                isBlurred={isBlurred}
                                rank={idx}
                                totalItems={sortedResults.length}
                                fgColorFrom={fgColorFrom}
                                fgColorTo={fgColorTo}
                            />
                        ))}
                        {isBlurred && (
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
        isEnded,
        isLoading,
        error,
        options.length,
        sortedResults,
        isBlurred,
        fgColorFrom,
        fgColorTo,
    ]);

    // 제출 버튼 렌더링 함수
    const renderSubmitButton = useCallback(() => {
        if (!showOptions || !selection) return null;

        return (
            <motion.div
                className={cn(animateSubmit ? "opacity-100" : "opacity-0")}
                variants={animations.submit}
                initial="initial"
                animate="animate"
            >
                {poll.allowMultipleVote &&
                    poll.needToken &&
                    poll.needTokenAddress && (
                        <div
                            className={cn(
                                "flex flex-row justify-center items-center overflow-hidden mb-[10px]",
                                getResponsiveClass(30).gapClass
                            )}
                        >
                            <button
                                className={cn(
                                    "cursor-pointer",
                                    "rounded-full text-center",
                                    getResponsiveClass(30).frameClass,
                                    getResponsiveClass(15).textClass
                                )}
                                style={{
                                    background: `linear-gradient(to bottom right, ${bgColorFrom}, ${bgColorTo})`,
                                }}
                                onClick={decreaseVoteAmount}
                                aria-label="Decrease amount"
                            >
                                -
                            </button>

                            <input
                                type="text"
                                inputMode="numeric"
                                value={voteAmountInput}
                                placeholder="0"
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                    handleVoteAmountChange(e.target.value)
                                }
                                className={cn(
                                    "py-[3px] text-center",
                                    "rounded-full border border-[rgba(255,255,255,0.8)]",
                                    "focus:outline-none",
                                    "focus:border-[rgba(255,255,255,0.8)]",
                                    "focus:shadow-none",
                                    getResponsiveClass(15).textClass
                                )}
                                style={{
                                    width: `${Math.max(
                                        voteAmountInput.length,
                                        1
                                    )}ch`,
                                    minWidth: "7ch",
                                    maxWidth: "14ch",
                                    transition: "width 0.2s",
                                }}
                            />

                            <button
                                className={cn(
                                    "cursor-pointer",
                                    "rounded-full text-center",
                                    getResponsiveClass(30).frameClass,
                                    getResponsiveClass(15).textClass
                                )}
                                style={{
                                    background: `linear-gradient(to bottom right, ${bgColorFrom}, ${bgColorTo})`,
                                }}
                                onClick={increaseVoteAmount}
                                aria-label="Increase amount"
                            >
                                +
                            </button>
                        </div>
                    )}

                <button
                    onClick={() => void handleSubmit()}
                    className={cn(
                        "cursor-pointer",
                        "w-full hover:glow-purple rounded-full font-main",
                        "transition-all duration-300 ease-in",
                        "mb-[30px]",
                        getResponsiveClass(15).paddingClass,
                        getResponsiveClass(15).textClass
                    )}
                    style={{
                        background: `linear-gradient(to bottom right, ${bgColorFrom}, ${bgColorTo})`,
                    }}
                >
                    SUBMIT
                </button>
            </motion.div>
        );
    }, [
        showOptions,
        selection,
        animateSubmit,
        poll.allowMultipleVote,
        poll.needToken,
        poll.needTokenAddress,
        voteAmountInput,
        handleVoteAmountChange,
        decreaseVoteAmount,
        increaseVoteAmount,
        handleSubmit,
        animations.submit,
        bgColorFrom,
        bgColorTo,
    ]);

    // 투표 결과 보기 버튼 렌더링 함수
    const renderResultsToggle = useCallback(() => {
        if (
            status !== "ONGOING" ||
            (poll.hasAnswer &&
                (!pollLogs ||
                    pollLogs.filter((log) => log.pollId === poll.id).length ===
                        0))
        ) {
            return null;
        }

        return (
            <>
                <div className="absolute bottom-[12px] right-[12px]">
                    <img
                        src="/icons/charts-fill.svg"
                        alt="charts-fill"
                        className={cn(
                            showOngoingResults ? "opacity-45" : "opacity-0",
                            "transition-all duration-300 ease-in",
                            getResponsiveClass(25).frameClass
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowOngoingResults(!showOngoingResults);
                        }}
                    />
                </div>
                <div className="absolute bottom-[12px] right-[12px]">
                    <img
                        src="/icons/charts-stroke.svg"
                        alt="charts-stroke"
                        className={cn(
                            !showOngoingResults ? "opacity-45" : "opacity-0",
                            "transition-all duration-300 ease-in",
                            getResponsiveClass(25).frameClass
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowOngoingResults(!showOngoingResults);
                        }}
                    />
                </div>
            </>
        );
    }, [status, poll.hasAnswer, pollLogs, showOngoingResults, poll.id]);

    // 토큰 게이팅 정보 렌더링 함수
    const renderTokenGatingInfo = useCallback(() => {
        if (!poll.needToken || !poll.needTokenAddress || !tokenGating) {
            return null;
        }

        return (
            <div className="my-3">
                <h2 className="text-xs font-light text-[rgba(255,255,255,0.9)]">
                    My Vote : {maxVoteAmount - voteAmount}
                </h2>
            </div>
        );
    }, [
        poll.needToken,
        poll.needTokenAddress,
        tokenGating,
        maxVoteAmount,
        voteAmount,
    ]);

    // 정답 확인 팝업 렌더링 함수
    const renderAnswerConfirmPopup = useCallback(() => {
        if (!poll.hasAnswer || confirmedAnswer) return null;

        return (
            <Popup
                open={showAnswerPopup}
                width="w-full"
                onClose={() => setShowAnswerPopup(false)}
            >
                <div className="flex flex-col items-center justify-center p-10 gap-2 rounded-2xl">
                    <img
                        src="/ui/information.svg"
                        alt="info"
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
                            {selection?.name}
                        </div>
                    </div>

                    <Button
                        onClick={() => {
                            setConfirmedAnswer(true);
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
        confirmedAnswer,
        showAnswerPopup,
        selection,
        handleSubmit,
    ]);

    return (
        <>
            <PopupInteractFeedback
                open={showInteractFeedback}
                onClose={() => setShowInteractFeedback(false)}
                title={
                    poll.hasAnswer ? "Correct Answer!" : "Thanks for voting!"
                }
                description={
                    poll.hasAnswer
                        ? "You've selected the correct answer. Thank you for your participation!"
                        : "Your opinion matters to us. Stay tuned for the results!"
                }
                type="success"
                autoCloseMs={4000}
                showReward={rewarded}
                reward={asset || undefined}
                rewardAmount={poll.participationRewardAmount}
            />
            {renderAnswerConfirmPopup()}
            <div className="relative w-full max-w-[800px] min-w-[180px] my-[25px] mx-auto">
                <div
                    className={cn(
                        "absolute inset-0 rounded-[16px] pointer-events-none transition-opacity duration-700 -z-40",
                        permission && isSelected ? "opacity-100" : "opacity-0"
                    )}
                    style={{
                        background: `linear-gradient(to bottom right, ${bgColorAccentFrom}, ${bgColorAccentTo})`,
                    }}
                />
                {!permission && <Doorman />}
                <div
                    className={cn(
                        "flex flex-col p-[12px] border border-[rgba(255,255,255,0.4)] rounded-[16px]",
                        "transition-all duration-500 ease-in-out",
                        "bg-gradient-to-br from-[rgba(0,0,0,0.1)] to-[rgba(255,255,255,0.15)]",
                        !permission && "blur-sm"
                    )}
                >
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
                                <h2>{status}</h2>
                            </div>
                        </div>

                        {status !== "ENDED" && status !== "UPCOMING" && (
                            <div>
                                <Countdown
                                    endDate={endDateObj}
                                    size={15}
                                    className="font-main opacity-50"
                                />
                            </div>
                        )}
                    </div>

                    {/* 제목 섹션 */}
                    <div className="mt-3">
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
                            {startDate} ~ {endDate}
                        </p>
                    </div>

                    {/* UPCOMING 상태일 경우 옵션 대신 COUNTDOWN 렌더링 */}
                    {status === "UPCOMING" && (
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
                                endDate={startDateObj}
                                size={30}
                                className="font-main text-center"
                            />
                        </div>
                    )}

                    {/* 옵션 섹션 */}
                    {renderOptions()}

                    {/* 차트 섹션 */}
                    {renderResults()}

                    {/* Submit Button */}
                    {renderSubmitButton()}

                    {/* 토큰 게이팅이 필요한 폴의 경우 몇 개의 폴을 추가로 참여할 수 있는지 */}
                    {renderTokenGatingInfo()}

                    {/* 투표 결과 보기 버튼 */}
                    {renderResultsToggle()}
                </div>
            </div>
        </>
    );
}

export default memo(PollsListCard);
