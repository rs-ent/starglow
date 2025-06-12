/// components/quests/Quests.Contents.tsx

"use client";

import { memo, useCallback, useState } from "react";
import { cn } from "@/lib/utils/tailwind";
import { Player } from "@prisma/client";
import PublicPrivateTab from "@/components/atoms/PublicPrivateTab";
import QuestsPrivate from "./Quests.Contents.Private";
import QuestsPublic from "./Quests.Contents.Public";
import { useReferralGet } from "@/app/hooks/useReferral";
import { useQuestGet } from "@/app/hooks/useQuest";
import { User } from "next-auth";
import { AnimatePresence, motion } from "framer-motion";
import { VerifiedSPG } from "@/app/story/interaction/actions";

interface QuestsContentsProps {
    user: User | null;
    player: Player | null;
    verifiedSPGs?: VerifiedSPG[];
}

const contentVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.4 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
};

function QuestsContents({ user, player, verifiedSPGs }: QuestsContentsProps) {
    const [isPublic, setIsPublic] = useState(true);

    // 탭 전환 핸들러 메모이제이션
    const handlePublicTab = useCallback(() => {
        setIsPublic(true);
    }, []);

    const handlePrivateTab = useCallback(() => {
        setIsPublic(false);
    }, []);

    // 플레이어 ID 기반 조건부 쿼리
    const playerId = player?.id ?? "";
    // 퀘스트 로그 데이터 가져오기
    const { playerQuestLogs } = useQuestGet({
        getPlayerQuestLogsInput: {
            playerId,
        },
    });

    // 추천 로그 데이터 가져오기
    const { referralLogs } = useReferralGet({
        GetReferralLogsInput: {
            playerId,
        },
    });

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center w-full max-w-4xl",
                "transition-all duration-700"
            )}
        >
            {/* 탭 컴포넌트 */}
            <div className="w-full flex justify-center">
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

            {/* 콘텐츠 영역 */}
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={isPublic ? "public" : "private"}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={contentVariants}
                    className="w-full flex justify-center items-center"
                >
                    {isPublic ? (
                        <QuestsPublic
                            player={player}
                            questLogs={playerQuestLogs || []}
                            referralLogs={referralLogs}
                        />
                    ) : (
                        <QuestsPrivate
                            user={user}
                            player={player}
                            questLogs={playerQuestLogs || []}
                            privateTabClicked={!isPublic}
                            referralLogs={referralLogs}
                            verifiedSPGs={verifiedSPGs}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

export default memo(QuestsContents);
