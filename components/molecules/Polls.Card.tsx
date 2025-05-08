/// components/molecules/Polls.Card.tsx

"use client";

import { Poll } from "@prisma/client";
import PollThumbnail from "@/components/atoms/Polls.Thumbnail";
import { formatDate } from "@/lib/utils/format";
import { usePollsGet } from "@/app/hooks/usePolls";
import PollBar from "@/components/atoms/Polls.Bar";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { useMemo, useState } from "react";
import { PollOption } from "@/app/actions/polls";

interface PollsCardProps {
    poll: Poll;
}

export default function PollsCard({ poll }: PollsCardProps) {
    const startDate = formatDate(poll.startDate);
    const endDate = formatDate(poll.endDate);

    const { pollResult, isLoading, error } = usePollsGet({
        pollResultInput: {
            pollId: poll.id,
        },
    });

    const options = poll.options as unknown as PollOption[];

    const today = new Date();
    const startDateObj = new Date(poll.startDate);
    const endDateObj = new Date(poll.endDate);
    const endDateMinus3Days = new Date(endDateObj);
    endDateMinus3Days.setDate(endDateObj.getDate() - 3);
    const endDatePlus30Minutes = new Date(endDateObj);
    endDatePlus30Minutes.setMinutes(endDateObj.getMinutes() + 30);
    const isBlurred = today > endDateMinus3Days && today < endDateObj;

    const sortedResults = pollResult?.results
        ? [...pollResult.results].sort((a, b) => b.voteCount - a.voteCount)
        : [];

    const [showResults, setShowResults] = useState(false);
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

    const handleOptionClick = (option: PollOption) => {
        setSelection(option);
    };

    return (
        <div className="relative max-w-[440px] min-w-[220px]">
            <div className="flex flex-col p-4 border border-[rgba(255,255,255,0.4)] rounded-3xl bg-gradient-to-t from-[rgba(0,0,0,0.9)] via-[rgba(0,0,0,0.3)] to-[rgba(0,0,0,0)]">
                {/* 이미지 섹션 */}
                <div className="bg-gradient-to-br from-[rgba(255,255,255,0.7)] to-[rgba(0,0,0,0.8)] rounded-3xl p-[1px] shadow-sm">
                    <div className="bg-black rounded-3xl">
                        <div className="aspect-[2.0625/1] relative">
                            <PollThumbnail
                                poll={poll}
                                className="rounded-3xl shadow-md w-full h-full"
                                imageClassName="rounded-3xl"
                            />
                        </div>
                    </div>
                </div>

                {/* 제목 섹션 */}
                <div className="mt-3">
                    <h2 className="text-2xl text-[rgba(255,255,255,0.95)]">
                        #{poll.id.replace(/^p0+/, "")}
                    </h2>
                    <h2
                        className={cn(
                            "leading-none text-[rgba(255,255,255,0.8)] break-all",
                            "text-xl"
                        )}
                    >
                        {poll.title}
                    </h2>
                    <p className="text-xs text-[rgba(255,255,255,0.6)]">
                        {startDate} ~ {endDate}
                    </p>
                </div>

                {/* 옵션 섹션 */}
                {showOptions && (
                    <div className="grid grid-cols-1 gap-3 my-6 p-2 w-full">
                        {options.map((option: PollOption) => (
                            <div
                                key={option.optionId}
                                onClick={() => handleOptionClick(option)}
                                className={cn(
                                    "flex items-center justify-between w-[90%] p-4 rounded-2xl",
                                    "bg-[rgba(0,0,0,0.05)] inner-shadow",
                                    "transition-all duration-300",
                                    "hover:bg-[rgba(0,0,0,0.35)]",
                                    "cursor-pointer",
                                    "relative overflow-hidden",
                                    "mx-auto"
                                )}
                            >
                                <div className="flex-1 flex items-center gap-4">
                                    <div
                                        className={cn(
                                            "w-6 h-6 rounded-full z-10",
                                            "border-2 border-[rgba(255,255,255,0.3)]",
                                            "relative",
                                            "transition-all duration-300",
                                            "transform hover:scale-110",
                                            getResponsiveClass(25).frameClass,
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

                                    <h1
                                        className={cn(
                                            "text-[rgba(255,255,255,0.9)] z-10 leading-0",
                                            getResponsiveClass(20).textClass
                                        )}
                                    >
                                        {option.name}
                                    </h1>
                                </div>

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
                            </div>
                        ))}
                    </div>
                )}

                {/* 차트 섹션 */}
                {(isEnded || showResults) && (
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

                {/* 댓글 섹션 */}
                <div className="text-center font-main text-[0.7rem] text-gradient cursor-pointer mt-4 hover:text-[0.75rem] transition-all duration-150">
                    leave comments
                </div>
            </div>
        </div>
    );
}
