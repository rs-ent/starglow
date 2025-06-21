/// components/polls/Polls.Contents.tsx

"use client";

import { memo, useCallback, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { usePollsGet } from "@/app/hooks/usePolls";
import { cn } from "@/lib/utils/tailwind";

import PollsContentsPrivate from "./Polls.Contents.Private";
import PollsContentsPublic from "./Polls.Contents.Public";
import PublicPrivateTab from "../atoms/PublicPrivateTab";

import type { VerifiedSPG } from "@/app/story/interaction/actions";
import type { Player } from "@prisma/client";

interface PollsContentsProps {
    player: Player | null;
    verifiedSPGs?: VerifiedSPG[];
}

const contentVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.4 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
};

function PollsContents({ player, verifiedSPGs }: PollsContentsProps) {
    const [isPublic, setIsPublic] = useState(true);

    const { playerPollLogs } = usePollsGet({
        getPlayerPollLogsInput: player?.id
            ? {
                  playerId: player.id,
              }
            : undefined,
    });

    // 탭 전환 핸들러 메모이제이션
    const handlePublicTab = useCallback(() => {
        setIsPublic(true);
    }, []);

    const handlePrivateTab = useCallback(() => {
        setIsPublic(false);
    }, []);

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center w-full",
                "transition-all duration-700"
            )}
        >
            <div>
                <PublicPrivateTab
                    isPublic={isPublic}
                    onPublic={handlePublicTab}
                    onPrivate={handlePrivateTab}
                    frameSize={20}
                    textSize={30}
                    gapSize={5}
                    paddingSize={10}
                />
            </div>

            <AnimatePresence>
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
                            player={player}
                            pollLogs={playerPollLogs}
                            privateTabClicked={!isPublic}
                            verifiedSPGs={verifiedSPGs}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// 메모이제이션을 통한 불필요한 리렌더링 방지
export default memo(PollsContents);
