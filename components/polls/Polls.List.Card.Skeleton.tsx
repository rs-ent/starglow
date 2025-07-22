/// components/polls/Polls.List.Card.Skeleton.tsx

"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/tailwind";

interface PollsCardSkeletonProps {
    className?: string;
}

function PollsCardSkeleton({ className }: PollsCardSkeletonProps) {
    return (
        <div
            className={cn(
                "relative w-full max-w-[800px] min-w-[180px] my-[25px] mx-auto",
                className
            )}
        >
            <div className="flex flex-col p-[12px] border border-[rgba(255,255,255,0.1)] rounded-[16px] bg-gradient-to-br from-[rgba(0,0,0,0.1)] to-[rgba(255,255,255,0.05)]">
                <div className="relative z-10">
                    {/* 이미지 스켈레톤 */}
                    <div className="gradient-border rounded-[16px] p-[1px] shadow-sm">
                        <div className="aspect-[2.0625/1] relative">
                            <motion.div
                                className="w-full h-full rounded-[16px] bg-gradient-to-r from-gray-700/20 to-gray-600/20"
                                animate={{
                                    background: [
                                        "linear-gradient(90deg, rgba(75,85,99,0.2) 25%, rgba(107,114,128,0.3) 50%, rgba(75,85,99,0.2) 75%)",
                                        "linear-gradient(90deg, rgba(75,85,99,0.2) 0%, rgba(107,114,128,0.3) 25%, rgba(75,85,99,0.2) 50%)",
                                        "linear-gradient(90deg, rgba(75,85,99,0.2) 25%, rgba(107,114,128,0.3) 50%, rgba(75,85,99,0.2) 75%)",
                                    ],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "linear",
                                }}
                            />
                        </div>
                    </div>

                    {/* 상태 및 카운트다운 스켈레톤 */}
                    <div className="flex flex-wrap items-center justify-between mt-3">
                        <div className="flex flex-row gap-1">
                            <motion.div
                                className="morp-glass-1 rounded-full py-1 px-3 h-6 w-16"
                                animate={{
                                    opacity: [0.5, 0.8, 0.5],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            />
                        </div>
                        <motion.div
                            className="h-6 w-24 rounded"
                            animate={{
                                opacity: [0.3, 0.6, 0.3],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                    </div>

                    {/* 제목 스켈레톤 */}
                    <div className="mt-3">
                        <motion.div
                            className="h-4 w-16 bg-gray-600/30 rounded mb-2"
                            animate={{
                                opacity: [0.4, 0.7, 0.4],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                        <motion.div
                            className="h-8 w-3/4 bg-gray-600/30 rounded mb-2"
                            animate={{
                                opacity: [0.4, 0.7, 0.4],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 0.2,
                            }}
                        />
                        <motion.div
                            className="h-3 w-1/2 bg-gray-600/20 rounded"
                            animate={{
                                opacity: [0.3, 0.6, 0.3],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 0.4,
                            }}
                        />
                    </div>

                    {/* 태그 스켈레톤 */}
                    <div className="flex flex-wrap gap-2 mt-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <motion.div
                                key={index}
                                className="h-6 w-20 rounded-full bg-gray-600/20"
                                animate={{
                                    opacity: [0.3, 0.6, 0.3],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: index * 0.1,
                                }}
                            />
                        ))}
                    </div>

                    {/* 옵션 스켈레톤 */}
                    <div className="grid grid-cols-1 gap-3 w-full my-7">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <motion.div
                                key={index}
                                className="flex items-center justify-between w-full py-3 px-2 rounded-[10px] border border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.05)]"
                                animate={{
                                    opacity: [0.4, 0.7, 0.4],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: index * 0.1,
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-600/30" />
                                    <div className="h-4 w-32 bg-gray-600/30 rounded" />
                                </div>
                                <div className="w-8 h-4 bg-gray-600/20 rounded" />
                            </motion.div>
                        ))}
                    </div>

                    {/* 제출 버튼 스켈레톤 */}
                    <motion.div
                        className="w-full h-12 rounded-full bg-gray-600/30 mb-[50px]"
                        animate={{
                            opacity: [0.4, 0.7, 0.4],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.6,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default memo(PollsCardSkeleton);
