/// components/quests/Quests.Contents.tsx

"use client";

import { memo } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { useQuestsPageData } from "@/app/hooks/useQuest";
import { cn } from "@/lib/utils/tailwind";

import QuestsTotal from "./Quests.Contents.Total";

import type { Player } from "@prisma/client";

interface QuestsContentsProps {
    player: Player | null;
}

const contentVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.4 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
};

function QuestsContents({ player }: QuestsContentsProps) {
    const now = new Date();

    // 🚀 통합된 데이터 페칭 - 3개 쿼리를 병렬로 실행
    const questsPageData = useQuestsPageData({
        player,
        questsInput: {
            isActive: true,
            startDate: now,
            endDate: now,
            startDateIndicator: "after",
            endDateIndicator: "before",
            test: player?.tester ?? false,
        },
    });

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center w-full max-w-4xl",
                "transition-all duration-700"
            )}
        >
            {/* 콘텐츠 영역 */}
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={"total"}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={contentVariants}
                    className="w-full flex justify-center items-center"
                >
                    <QuestsTotal
                        player={player}
                        questsPageData={questsPageData}
                    />
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

export default memo(QuestsContents);
