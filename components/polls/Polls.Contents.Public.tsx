/// components/polls/Polls.Contents.Public.tsx

"use client";

import {usePollsGet} from "@/app/hooks/usePolls";
import {cn} from "@/lib/utils/tailwind";
import {Player, PollLog} from "@prisma/client";
import PartialLoading from "@/components/atoms/PartialLoading";
import PollsList from "./Polls.List";
import {memo, useCallback, useMemo, useState} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {useInView} from "react-intersection-observer";

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
    const [selectedType, setSelectedType] = useState<string>("All");
    const { ref, inView } = useInView({
        threshold: 0.1,
        triggerOnce: true,
    });

    // 폴 데이터 가져오기
    const { pollsList, isLoading, error } = usePollsGet({
        getPollsInput: {
            category: "PUBLIC",
            isActive: true,
        },
    });

    // 폴 타입 목록 메모이제이션
    const pollTypes = useMemo(() => {
        if (!pollsList?.items || pollsList.items.length === 0) {
            return ["All"];
        }

        const uniqueTypes = new Set<string>();
        pollsList.items.forEach(poll => {
            if (poll.type) uniqueTypes.add(poll.type);
        });

        return ["All", ...Array.from(uniqueTypes)];
    }, [pollsList?.items]);

    // 필터링된 폴 목록 메모이제이션
    const filteredPolls = useMemo(() => {
        if (!pollsList?.items) return [];
        
        return selectedType === "All"
            ? pollsList.items
            : pollsList.items.filter(poll => poll.type === selectedType);
    }, [pollsList?.items, selectedType]);

    // 타입 선택 핸들러
    const handleTypeClick = useCallback((type: string) => {
        setSelectedType(type);
    }, []);

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

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    // 타입 버튼 컴포넌트
    const TypeButton = memo(({ type, isSelected, onClick }: { 
        type: string; 
        isSelected: boolean; 
        onClick: (type: string) => void;
    }) => (
        <button
            onClick={() => onClick(type)}
            className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                isSelected 
                    ? "bg-purple-600 text-white" 
                    : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"
            )}
        >
            {type}
        </button>
    ));

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
            {/* 타입 필터 버튼 */}
            {pollTypes.length > 1 && (
                <motion.div 
                    variants={itemVariants}
                    className="flex justify-start items-center mb-6 overflow-x-auto pb-2"
                >
                    <div className="flex flex-row gap-2 whitespace-nowrap">
                        {pollTypes.map((type) => (
                            <TypeButton 
                                key={type}
                                type={type}
                                isSelected={selectedType === type}
                                onClick={handleTypeClick}
                            />
                        ))}
                    </div>
                </motion.div>
            )}

            {/* 폴 목록 */}
            <div className="relative">
                {isLoading ? (
                    <PartialLoading text="Loading polls..." size="sm" />
                ) : error ? (
                    <div className="text-center text-red-400 py-4">
                        Error: {typeof error === "string" ? error : error.message}
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={selectedType}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {filteredPolls.length > 0 ? (
                                <PollsList
                                    polls={filteredPolls}
                                    player={player}
                                    pollLogs={
                                        pollLogs &&
                                        pollLogs.filter((log) =>
                                            filteredPolls.some(
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
