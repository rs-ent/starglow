/// components/polls/Polls.Contents.Public.tsx

"use client";

import { usePollsGet } from "@/app/hooks/usePolls";
import { cn } from "@/lib/utils/tailwind";
import { Player, PollLog } from "@prisma/client";
import PartialLoading from "@/components/atoms/PartialLoading";
import PollsList from "./Polls.List";
import { memo, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

interface PollsContentsPublicProps {
    player: Player | null;
    pollLogs?: PollLog[];
    className?: string;
}

function PollsContentsPublic({
    player,
    pollLogs,
    className,
}: PollsContentsPublicProps) {
    const { ref, inView } = useInView({
        threshold: 0.1,
        triggerOnce: true,
    });

    // 폴 데이터 가져오기
    const { pollsList, isLoading, error } = usePollsGet({
        getPollsInput: {
            category: "PUBLIC",
            isActive: true,
            artistId: null,
        },
    });

    const polls = useMemo(() => pollsList?.items, [pollsList?.items]);

    // 애니메이션 변수
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={containerVariants}
            className={cn(
                "max-w-[1400px] w-screen",
                "px-[10px] sm:px-[10px] md:px-[20px] lg:px-[20px]",
                "mt-[10px] sm:mt-[15px] md:mt-[20px] lg:mt-[25px] xl:mt-[30px]",
                className
            )}
        >
            {/* 폴 목록 */}
            <div className="relative">
                {isLoading ? (
                    <PartialLoading text="Loading polls..." size="sm" />
                ) : error ? (
                    <div className="text-center text-red-400 py-4">
                        Error: {error.message}
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={"public-polls"}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {polls && polls.length > 0 ? (
                                <PollsList
                                    polls={polls}
                                    player={player}
                                    pollLogs={
                                        pollLogs &&
                                        pollLogs.filter((log) =>
                                            polls.some(
                                                (poll) => poll.id === log.pollId
                                            )
                                        )
                                    }
                                />
                            ) : (
                                <div className="text-center text-2xl py-10">
                                    No polls found
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </motion.div>
    );
}

// 메모이제이션을 통한 불필요한 리렌더링 방지
export default memo(PollsContentsPublic);
