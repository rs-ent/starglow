/// components/polls/Polls.Contents.tsx

"use client";

import {cn} from "@/lib/utils/tailwind";
import {Player} from "@prisma/client";
import {usePollsGet} from "@/app/hooks/usePolls";
import {memo, useCallback, useState} from "react";
import PublicPrivateTab from "../atoms/PublicPrivateTab";
import PollsContentsPublic from "./Polls.Contents.Public";
import PollsContentsPrivate from "./Polls.Contents.Private";
import {User} from "next-auth";
import {AnimatePresence, motion} from "framer-motion";
import {useInView} from "react-intersection-observer";

interface PollsContentsProps {
    user: User | null;
    player: Player | null;
}

function PollsContents({ user, player }: PollsContentsProps) {
    const [isPublic, setIsPublic] = useState(true);
    const { ref, inView } = useInView({
        threshold: 0.1,
        triggerOnce: true,
    });

    // 캐싱 및 최적화를 위한 playerPollLogs 조회
    const { playerPollLogs, isLoading: isLogsLoading } = usePollsGet({
        getPlayerPollLogsInput: player?.id ? {
            playerId: player.id
        } : undefined,
    });

    // 탭 전환 핸들러 메모이제이션
    const handlePublicTab = useCallback(() => {
        setIsPublic(true);
    }, []);

    const handlePrivateTab = useCallback(() => {
        setIsPublic(false);
    }, []);

    // 애니메이션 변수
    const tabVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.5 } },
    };

    const contentVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.5 } },
        exit: { opacity: 0, transition: { duration: 0.3 } },
    };

    return (
        <div
            ref={ref}
            className={cn(
                "flex flex-col items-center justify-center w-full",
                "transition-all duration-700"
            )}
        >
            <motion.div
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
                variants={tabVariants}
            >
                <PublicPrivateTab
                    isPublic={isPublic}
                    onPublic={handlePublicTab}
                    onPrivate={handlePrivateTab}
                    frameSize={20}
                    textSize={30}
                    gapSize={5}
                    paddingSize={10}
                />
            </motion.div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={isPublic ? "public" : "private"}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={contentVariants}
                    className="w-full flex justify-center items-center"
                >
                    {isPublic ? (
                        <PollsContentsPublic
                            player={player}
                            pollLogs={playerPollLogs}
                        />
                    ) : (
                        <PollsContentsPrivate
                            user={user}
                            player={player}
                            pollLogs={playerPollLogs}
                            privateTabClicked={!isPublic}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// 메모이제이션을 통한 불필요한 리렌더링 방지
export default memo(PollsContents);