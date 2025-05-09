/// components/molecules/Polls.Card.tsx

"use client";

import { Artist, Player, Poll, PollLog } from "@prisma/client";
import { getPollLogs, TokenGatingResult } from "@/app/actions/polls";
import PollThumbnail from "@/components/atoms/Polls.Thumbnail";
import { formatDate } from "@/lib/utils/format";
import { usePollsGet, usePollsSet } from "@/app/hooks/usePolls";
import PollBar from "@/components/atoms/Polls.Bar";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { useMemo, useState } from "react";
import { PollOption } from "@/app/actions/polls";
import Button from "@/components/atoms/Button";
import { useToast } from "@/app/hooks/useToast";
import { useLoading } from "@/app/hooks/useLoading";
import Countdown from "../atoms/Countdown";
import Doorman from "../atoms/Doorman";

interface PollsCardProps {
    poll: Poll;
    player: Player;
    pollLogs?: PollLog[];
    artist?: Artist | null;
    tokenGatingData?: TokenGatingResult | null;
    isSelected?: boolean;
}

export default function PollsCard({
    poll,
    player,
    pollLogs,
    artist,
    tokenGatingData,
    isSelected,
}: PollsCardProps) {
    const { startLoading, endLoading } = useLoading();
    const toast = useToast();
    const startDate = formatDate(poll.startDate);
    const endDate = formatDate(poll.endDate);

    const { pollResult, isLoading, error } = usePollsGet({
        pollResultInput: {
            pollId: poll.id,
        },
    });

    const {
        participatePoll,
        isLoading: isParticipating,
        error: participateError,
    } = usePollsSet();

    const options = poll.options as unknown as PollOption[];

    const today = new Date();
    const startDateObj = new Date(poll.startDate);
    const endDateObj = new Date(poll.endDate);
    const endDateMinus3Days = new Date(endDateObj);
    endDateMinus3Days.setDate(endDateObj.getDate() - 3);
    const endDatePlus30Minutes = new Date(endDateObj);
    endDatePlus30Minutes.setMinutes(endDateObj.getMinutes() + 30);
    const isBlurred = today > endDateMinus3Days && today < endDateObj;

    const status = useMemo(() => {
        if (endDateObj.getTime() < today.getTime()) return "ENDED";
        if (startDateObj.getTime() > today.getTime()) return "UPCOMING";
        return "ONGOING";
    }, [poll, today, startDateObj, endDateObj]);

    const sortedResults = useMemo(() => {
        return pollResult?.results
            ? [...pollResult.results].sort((a, b) => b.voteCount - a.voteCount)
            : [];
    }, [pollResult]);

    const [showOngoingResults, setShowOngoingResults] = useState(false);
    const [selection, setSelection] = useState<PollOption | null>(null);
    const showOptions = useMemo(() => {
        return (
            startDateObj.getTime() < today.getTime() &&
            endDateObj.getTime() > today.getTime()
        );
    }, [startDateObj, endDateObj, today]);
    const isEnded = useMemo(() => {
        return endDatePlus30Minutes.getTime() < today.getTime();
    }, [endDatePlus30Minutes, today]);

    const [animateSubmit, setAnimateSubmit] = useState(false);
    const handleOptionClick = (option: PollOption) => {
        setSelection(option);
        setVoteAmount(1);
        setTimeout(() => {
            setAnimateSubmit(true);
        }, 100);
    };

    const [voteAmount, setVoteAmount] = useState(0);
    const { alreadyVotedAmount, maxVoteAmount, permission, votedOptions } =
        useMemo(() => {
            const permission = tokenGatingData?.data?.hasToken;
            const votedOptions = pollLogs?.map((log) => log.optionId);
            const alreadyVotedAmount =
                pollLogs?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

            let maxVoteAmount = 99;

            if (poll.needToken && tokenGatingData?.data) {
                maxVoteAmount = Math.max(
                    0,
                    tokenGatingData.data.tokenCount - alreadyVotedAmount
                );
            }

            return {
                alreadyVotedAmount,
                maxVoteAmount,
                permission,
                votedOptions,
            };
        }, [tokenGatingData, poll.needToken, pollLogs]);

    const handleSubmit = async () => {
        startLoading();
        try {
            if (!selection) {
                toast.error("Please select an option");
                return;
            }

            if (poll.needToken && poll.needTokenAddress) {
                if (!tokenGatingData || !tokenGatingData.data) {
                    toast.error(
                        "Please wait for the token gating process to complete."
                    );
                    return;
                }
                if (!tokenGatingData?.data.hasToken) {
                    toast.error(
                        "This polls is need an authentication. Please purchase the NFT before participation."
                    );
                    return;
                }

                const remainingTokenCount =
                    tokenGatingData.data.tokenCount -
                    (voteAmount + alreadyVotedAmount);
                if (remainingTokenCount <= 0) {
                    toast.error(
                        "You've used all your tokens for this poll. Please purchase more NFTs to participate in this poll."
                    );
                    return;
                }
            }

            const result = await participatePoll({
                poll: poll,
                player: player,
                optionId: selection.optionId,
                amount: voteAmount,
                tokenGating: tokenGatingData || undefined,
                alreadyVotedAmount,
            });

            if (result.success) {
                toast.success("You have successfully voted.");
            } else {
                toast.error(result.error || "Failed to vote.");
            }
        } catch (error) {
            console.error(error);
            toast.error(`${error}`);
        } finally {
            endLoading();
        }
    };

    return (
        <div className="relative max-w-[480px] min-w-[210px] mt-[25px]">
            {!permission && <Doorman />}
            <div
                onClick={() => setSelection(null)}
                className={cn(
                    "flex flex-col p-3 border border-[rgba(255,255,255,0.4)] rounded-[16px]",
                    "transition-all duration-500 ease-in-out",
                    "bg-gradient-to-b from-[rgba(109,40,217,0.4)] to-[rgba(109,40,217,0.2)]",
                    isSelected &&
                        "bg-gradient-to-b from-[rgba(109,40,217,1)] to-[rgba(109,40,217,0.5)]",
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
                <div className="flex items-center justify-between mt-3">
                    <div
                        className={cn(
                            "flex flex-row gap-1",
                            getResponsiveClass(10).textClass
                        )}
                    >
                        {poll.artistId && artist && (
                            <div className="morp-glass-1 rounded-full py-1 px-3">
                                <h2>{artist.name}</h2>
                            </div>
                        )}

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
                            "rounded-[16px] p-3",
                            "bg-gradient-to-br from-[rgba(200,180,255,0.01)] to-[rgba(160,110,250,0.1)]"
                        )}
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
                {showOptions && (
                    <div
                        className={cn(
                            "grid grid-cols-1 gap-3 w-full",
                            "my-6 sm:my-7 md:my-8 lg:my-9 xl:my-10"
                        )}
                    >
                        {options.map((option: PollOption, idx: number) => {
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
                                <div
                                    key={option.optionId}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOptionClick(option);
                                    }}
                                    className={cn(
                                        selection === option &&
                                            "text-glow-white-smooth white-glow-smooth border-[rgba(255,255,255,0.3)]",
                                        "flex items-center justify-between w-full p-2 rounded-[10px]",
                                        "border border-[rgba(255,255,255,0.1)]",
                                        "bg-[rgba(0,0,0,0.05)] inner-shadow",
                                        "transition-all duration-700",
                                        "hover:bg-[rgba(0,0,0,0.35)]",
                                        "hover:scale-105",
                                        "hover:border-[rgba(255,255,255,0.4)]",
                                        "cursor-pointer",
                                        "relative overflow-hidden",
                                        "mx-auto"
                                    )}
                                >
                                    {result && showOngoingResults && (
                                        <div className="absolute inset-0">
                                            <div className="h-full -m-1">
                                                <PollBar
                                                    result={result}
                                                    isBlurred={isBlurred}
                                                    rank={0}
                                                    totalItems={
                                                        sortedResults.length
                                                    }
                                                    showOptionName={false}
                                                    showOptionImage={false}
                                                    fillContainer={true}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex-1 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={cn(
                                                    showOngoingResults &&
                                                        "opacity-0",
                                                    selection === option &&
                                                        "white-glow",
                                                    "w-6 h-6 rounded-full z-10",
                                                    "border-2 border-[rgba(255,255,255,0.3)]",
                                                    "relative",
                                                    "transition-all duration-700",
                                                    "transform hover:scale-110",
                                                    "flex-shrink-0",
                                                    getResponsiveClass(20)
                                                        .frameClass,
                                                    selection === option &&
                                                        "bg-[rgba(255,255,255,0.2)]"
                                                )}
                                            >
                                                {selection === option && (
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
                                                    getResponsiveClass(15)
                                                        .textClass,
                                                    "leading-none"
                                                )}
                                            >
                                                {option.name}
                                            </h3>
                                        </div>
                                        {/* 투표 확인 아이콘 */}
                                        <div
                                            className={cn(
                                                "transition-all duration-700",
                                                "flex items-center justify-center text-right",
                                                votedCount > 0
                                                    ? "opacity-40"
                                                    : "opacity-0",
                                                getResponsiveClass(10)
                                                    .textClass,
                                                showOngoingResults &&
                                                    "opacity-0",
                                                "flex-shrink-0 ml-3"
                                            )}
                                        >
                                            <h2>{votedCount || "00"}</h2>
                                        </div>
                                    </div>

                                    {/* 옵션의 이미지가 있을 경우 렌더링 */}
                                    {1 !== 1 && option.imgUrl && (
                                        <div
                                            className="absolute inset-0 z-0 inner-shadow"
                                            style={{
                                                backgroundImage: option.imgUrl
                                                    ? `url(${option.imgUrl})`
                                                    : "none",
                                                backgroundSize: "cover",
                                                backgroundPosition: "center",
                                                backgroundRepeat: "no-repeat",
                                                opacity: 0.6,
                                                mixBlendMode: "overlay",
                                            }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* 차트 섹션 */}
                {isEnded && (
                    <div className="mt-6">
                        {isLoading ? (
                            <div className="animate-pulse">
                                <div className="h-[34px] bg-gray-700 rounded mb-2"></div>
                                <div className="h-[34px] bg-gray-700 rounded mb-2"></div>
                                <div className="h-[34px] bg-gray-700 rounded"></div>
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
                                    />
                                ))}
                                {isBlurred && (
                                    <p className="text-xs font-light text-[rgba(255,255,255,0.6)]">
                                        * States hidden before 3 days of end
                                        date. Result will be revealed on X after
                                        closing.
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Submit Button */}
                {selection && !showOngoingResults && (
                    <div className="overflow-hidden">
                        <div
                            className={cn(
                                "transform transition-all duration-500 ease-out",
                                "flex flex-row gap-3 items-center",
                                animateSubmit
                                    ? "translate-x-0 opacity-100"
                                    : "translate-x-10 opacity-0"
                            )}
                        >
                            {poll.allowMultipleVote &&
                                poll.needToken &&
                                poll.needTokenAddress && (
                                    <div
                                        className={cn(
                                            "flex items-center bg-[rgba(0,0,0,0.3)] overflow-hidden",
                                            "h-auto",
                                            "rounded-xs",
                                            "border border-[rgba(255,255,255,0.2)]"
                                        )}
                                    >
                                        <input
                                            type="number"
                                            value={voteAmount}
                                            placeholder="1"
                                            onChange={(e) => {
                                                const val = parseInt(
                                                    e.target.value
                                                );
                                                if (!isNaN(val) && val > 0) {
                                                    setVoteAmount(
                                                        Math.min(
                                                            maxVoteAmount,
                                                            val
                                                        )
                                                    );
                                                }
                                            }}
                                            className={cn(
                                                "px-[5px] py-[1px] text-center",
                                                getResponsiveClass(20).textClass
                                            )}
                                            min="1"
                                            max={maxVoteAmount}
                                        />

                                        <div className="flex flex-col">
                                            <button
                                                className={cn(
                                                    "px-[5px] py-[1px] hover:bg-[rgba(255,255,255,0.1)]",
                                                    "border-l border-b border-[rgba(255,255,255,0.1)]",
                                                    getResponsiveClass(5)
                                                        .textClass
                                                )}
                                                onClick={() => {
                                                    setVoteAmount(
                                                        Math.min(
                                                            maxVoteAmount,
                                                            voteAmount + 1
                                                        )
                                                    );
                                                }}
                                                aria-label="Increase amount"
                                            >
                                                +
                                            </button>
                                            <button
                                                className={cn(
                                                    "px-[5px] py-[1px] hover:bg-[rgba(255,255,255,0.1)]",
                                                    "border-l border-[rgba(255,255,255,0.1)]",
                                                    getResponsiveClass(5)
                                                        .textClass
                                                )}
                                                onClick={() =>
                                                    setVoteAmount(
                                                        Math.max(
                                                            1,
                                                            voteAmount - 1
                                                        )
                                                    )
                                                }
                                                aria-label="Decrease amount"
                                            >
                                                -
                                            </button>
                                        </div>
                                    </div>
                                )}

                            <Button
                                onClick={handleSubmit}
                                variant="default"
                                textSize={15}
                                paddingSize={20}
                                className="w-full bg-[#8b5cf6]/90 hover:bg-[#8b5cf6] hover:glow-purple rounded-full font-main"
                            >
                                SUBMIT
                            </Button>
                        </div>
                    </div>
                )}

                {/* 토큰 게이팅이 필요한 폴의 경우 몇 개의 폴을 추가로 참여할 수 있는지 */}
                {poll.needToken &&
                    poll.needTokenAddress &&
                    tokenGatingData &&
                    tokenGatingData.data && (
                        <div className="my-3">
                            <h2 className="text-xs font-light text-[rgba(255,255,255,0.9)]">
                                My Vote : {maxVoteAmount - voteAmount}
                            </h2>
                        </div>
                    )}

                {/* 투표 결과 보기 버튼 */}
                {status === "ONGOING" && (
                    <>
                        <div className="absolute bottom-2 right-4">
                            <img
                                src="/icons/charts-fill.svg"
                                alt="charts-fill"
                                className={cn(
                                    showOngoingResults
                                        ? "opacity-45"
                                        : "opacity-0",
                                    "transition-all duration-500 ease-in",
                                    getResponsiveClass(25).frameClass
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowOngoingResults(!showOngoingResults);
                                }}
                            />
                        </div>
                        <div className="absolute bottom-2 right-4">
                            <img
                                src="/icons/charts-stroke.svg"
                                alt="charts-stroke"
                                className={cn(
                                    !showOngoingResults
                                        ? "opacity-45"
                                        : "opacity-0",
                                    "transition-all duration-500 ease-in",
                                    getResponsiveClass(25).frameClass
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowOngoingResults(!showOngoingResults);
                                }}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
