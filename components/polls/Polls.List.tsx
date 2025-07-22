/// components/polls/Polls.List.tsx

"use client";

import { memo, useCallback, useMemo, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";

import PollsListCard from "@/components/polls/Polls.List.Card";
import CustomCarousel from "@/components/atoms/CustomCarousel";
import { cn } from "@/lib/utils/tailwind";

import type { Player } from "@prisma/client";
import type { PollListData } from "@/app/actions/polls";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";

interface PollsListProps {
    polls: PollListData[];
    player: Player | null;
    fgColorFrom?: string;
    fgColorTo?: string;
    bgColorFrom?: string;
    bgColorTo?: string;
    bgColorAccentFrom?: string;
    bgColorAccentTo?: string;
    needMarginBottom?: boolean;
    totalItems?: number;
    totalPages?: number;
    currentPage?: number;
    onPageChange?: (page: number) => void;
    isListLoading: boolean;
}

const MemoizedPollCard = memo(
    ({
        poll,
        index,
        player,
        isSelected,
        isCurrentPage,
        bgColorFrom,
        bgColorTo,
        bgColorAccentFrom,
        bgColorAccentTo,
        fgColorFrom,
        fgColorTo,
    }: {
        poll: PollListData;
        index: number;
        player: Player | null;
        isSelected: boolean;
        isCurrentPage: boolean;
        bgColorFrom?: string;
        bgColorTo?: string;
        bgColorAccentFrom?: string;
        bgColorAccentTo?: string;
        fgColorFrom?: string;
        fgColorTo?: string;
    }) => (
        <motion.div
            className={cn("w-full max-w-[800px]")}
            initial={{ scale: 0.9, opacity: 0.7 }}
            animate={{
                scale: isCurrentPage ? 1.0 : 0.95,
                opacity: 1,
            }}
            whileHover={isCurrentPage ? { scale: 1.03 } : undefined}
            transition={{ duration: 0.3 }}
            layout
            style={{
                willChange: "transform, opacity",
            }}
        >
            <PollsListCard
                index={index}
                poll={poll}
                player={player}
                isSelected={isSelected}
                bgColorFrom={bgColorFrom}
                bgColorTo={bgColorTo}
                bgColorAccentFrom={bgColorAccentFrom}
                bgColorAccentTo={bgColorAccentTo}
                fgColorFrom={fgColorFrom}
                fgColorTo={fgColorTo}
            />
        </motion.div>
    )
);

MemoizedPollCard.displayName = "MemoizedPollCard";

function PollsList({
    polls,
    player,
    fgColorFrom,
    fgColorTo,
    bgColorFrom,
    bgColorTo,
    bgColorAccentFrom,
    bgColorAccentTo,
    needMarginBottom = true,
    totalItems,
    onPageChange,
}: PollsListProps) {
    const [currentPageIndex, setCurrentPageIndex] = useState(0);

    const pages = useMemo(() => {
        if (polls.length === 0) return [];

        const pagesArray = [];
        for (let i = 0; i < polls.length; i += 1) {
            pagesArray.push(polls.slice(i, i + 1));
        }
        return pagesArray;
    }, [polls]);

    const handlePageChange = useCallback(
        (index: number) => {
            setCurrentPageIndex(index);
            // 부모 컴포넌트에 인덱스 변경 알림
            onPageChange?.(index);
        },
        [onPageChange]
    );

    const containerClassName = useMemo(
        () => cn("relative", needMarginBottom && "mb-[100px] md:mb-[50px]"),
        [needMarginBottom]
    );

    const layoutClassName = useMemo(
        () => cn("flex gap-[4px] justify-center", "flex-col items-center"),
        []
    );

    if (!polls || polls.length === 0) {
        return (
            <div className="text-center py-10 text-white/80 text-xl">
                No polls available
            </div>
        );
    }

    if (pages.length <= 1) {
        return (
            <div className={containerClassName}>
                <div className="relative group">
                    {/* 드래그 힌트 - 좌측 */}
                    <motion.div
                        className="absolute left-2 top-1/2 -translate-y-1/2 -z-20 opacity-0 group-hover:opacity-60 pointer-events-none"
                        initial={{ x: -10, opacity: 0 }}
                        animate={{
                            x: [0, -5, 0],
                            opacity: [0.4, 0.8, 0.4],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        <div className="flex items-center gap-1 text-white/60">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                            </svg>
                            <span
                                className={cn(
                                    "text-xs",
                                    getResponsiveClass(5).textClass
                                )}
                            >
                                Drag
                            </span>
                        </div>
                    </motion.div>

                    {/* 드래그 힌트 - 우측 */}
                    <motion.div
                        className="absolute right-2 top-1/2 -translate-y-1/2 -z-20 opacity-0 group-hover:opacity-60 pointer-events-none"
                        initial={{ x: 10, opacity: 0 }}
                        animate={{
                            x: [0, 5, 0],
                            opacity: [0.4, 0.8, 0.4],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 1,
                        }}
                    >
                        <div className="flex items-center gap-1 text-white/60">
                            <span
                                className={cn(
                                    "text-xs",
                                    getResponsiveClass(5).textClass
                                )}
                            >
                                Drag
                            </span>
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                            >
                                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
                            </svg>
                        </div>
                    </motion.div>

                    <div className={layoutClassName}>
                        <AnimatePresence mode="wait">
                            {polls.map((poll, index) => (
                                <MemoizedPollCard
                                    key={poll.id}
                                    poll={poll}
                                    index={index}
                                    player={player}
                                    isSelected={true}
                                    isCurrentPage={true}
                                    bgColorFrom={bgColorFrom}
                                    bgColorTo={bgColorTo}
                                    bgColorAccentFrom={bgColorAccentFrom}
                                    bgColorAccentTo={bgColorAccentTo}
                                    fgColorFrom={fgColorFrom}
                                    fgColorTo={fgColorTo}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={containerClassName}>
            <div className="relative group">
                {/* 드래그 힌트 - 좌측 */}
                <motion.div
                    className="absolute left-2 top-1/2 -translate-y-1/2 -z-20 opacity-0 group-hover:opacity-60 pointer-events-none"
                    initial={{ x: -10, opacity: 0 }}
                    animate={{
                        x: [0, -5, 0],
                        opacity: [0.4, 0.8, 0.4],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    <div className="flex items-center gap-1 text-white/60">
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                        </svg>
                        <span
                            className={cn(
                                "text-xs",
                                getResponsiveClass(5).textClass
                            )}
                        >
                            Drag
                        </span>
                    </div>
                </motion.div>

                {/* 드래그 힌트 - 우측 */}
                <motion.div
                    className="absolute right-2 top-1/2 -translate-y-1/2 -z-20 opacity-0 group-hover:opacity-60 pointer-events-none"
                    initial={{ x: 10, opacity: 0 }}
                    animate={{
                        x: [0, 5, 0],
                        opacity: [0.4, 0.8, 0.4],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1,
                    }}
                >
                    <div className="flex items-center gap-1 text-white/60">
                        <span
                            className={cn(
                                "text-xs",
                                getResponsiveClass(5).textClass
                            )}
                        >
                            Drag
                        </span>
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
                        </svg>
                    </div>
                </motion.div>

                <CustomCarousel
                    currentIndex={currentPageIndex}
                    onIndexChange={handlePageChange}
                    showIndicators={true}
                    className="h-auto"
                    containerClassName="h-auto"
                    indicatorClassName="bottom-[-35px]"
                    speed={500}
                    swipeThreshold={60}
                    totalItems={totalItems || polls.length}
                >
                    {pages.map((pagePolls, pageIndex) => (
                        <div
                            key={`page-${pageIndex}`}
                            className={cn(
                                "flex gap-[20px] justify-center px-[2px] w-full"
                            )}
                        >
                            <AnimatePresence mode="wait">
                                {pagePolls.map((poll, index) => {
                                    const globalIndex = pageIndex + index;
                                    const isCurrentPage =
                                        pageIndex === currentPageIndex;

                                    return (
                                        <MemoizedPollCard
                                            key={poll.id}
                                            poll={poll}
                                            index={globalIndex}
                                            player={player}
                                            isSelected={isCurrentPage}
                                            isCurrentPage={isCurrentPage}
                                            bgColorFrom={bgColorFrom}
                                            bgColorTo={bgColorTo}
                                            bgColorAccentFrom={
                                                bgColorAccentFrom
                                            }
                                            bgColorAccentTo={bgColorAccentTo}
                                            fgColorFrom={fgColorFrom}
                                            fgColorTo={fgColorTo}
                                        />
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    ))}
                </CustomCarousel>
            </div>
        </div>
    );
}

export default memo(PollsList);
