/// components/polls/Polls.Contents.tsx

"use client";

import { memo } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { usePollsGet } from "@/app/hooks/usePolls";
import { cn } from "@/lib/utils/tailwind";

import PollsContentsTotal from "./Polls.Contents.Total";

import type { Player } from "@prisma/client";

interface PollsContentsProps {
    player: Player | null;
}

const contentVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.4 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
};

function PollsContents({ player }: PollsContentsProps) {
    const { playerPollLogs } = usePollsGet({
        getPlayerPollLogsInput: player?.id
            ? {
                  playerId: player.id,
              }
            : undefined,
    });

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center w-full",
                "transition-all duration-700"
            )}
        >
            <AnimatePresence>
                <motion.div
                    key={"total"}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={contentVariants}
                    className="w-full flex justify-center items-center"
                >
                    <PollsContentsTotal
                        player={player}
                        pollLogs={playerPollLogs}
                    />
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// 메모이제이션을 통한 불필요한 리렌더링 방지
export default memo(PollsContents);
