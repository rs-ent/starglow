/// components/quests/Quests.Contents.tsx

"use client";

import { memo } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { useQuestGet } from "@/app/hooks/useQuest";
import { useReferralGet } from "@/app/hooks/useReferral";
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
    // 🚀 Business 플랜 최적화: 실시간 활성 퀘스트만 조회
    const { activeQuestLogs, completedQuestLogs, playerQuestLogs } =
        useQuestGet({
            // 🌟 새로운 접근: 상태별로 분리 조회
            getActiveQuestLogsInput: player?.id
                ? {
                      playerId: player.id,
                  }
                : undefined,
            getCompletedQuestLogsInput: player?.id
                ? {
                      playerId: player.id,
                  }
                : undefined,
            // 🔄 기존 방식도 유지 (호환성)
            getPlayerQuestLogsInput: player?.id
                ? {
                      playerId: player.id,
                  }
                : undefined,
        });

    // 추천 로그 데이터 가져오기
    const { referralLogs } = useReferralGet({
        GetReferralLogsInput: {
            playerId: player?.id ?? "",
        },
    });

    // 🎯 Business 플랜: 상황별 최적화된 데이터 선택
    const questLogs = (() => {
        // 새로운 방식의 데이터가 있으면 사용 (더 효율적)
        if (activeQuestLogs && completedQuestLogs) {
            return [
                ...activeQuestLogs, // 실시간 데이터
                ...completedQuestLogs, // 캐시된 완료 데이터
            ];
        }

        // 기존 방식 fallback (호환성 유지)
        return playerQuestLogs || [];
    })();

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
                        questLogs={questLogs}
                        referralLogs={referralLogs}
                    />
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

export default memo(QuestsContents);
