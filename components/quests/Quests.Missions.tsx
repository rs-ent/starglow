/// components/molecules/Missions.tsx

import { Player, Quest, QuestLog, ReferralLog } from "@prisma/client";
import { memo, useMemo } from "react";
import QuestsButton from "./Quests.Button";
import PartialLoading from "../atoms/PartialLoading";
import { cn } from "@/lib/utils/tailwind";
import { TokenGatingData, TokenGatingResult } from "@/app/story/nft/actions";
import Doorman from "../atoms/Doorman";

interface QuestsMissionsProps {
    player: Player | null;
    quests: Quest[];
    questLogs: QuestLog[];
    isLoading: boolean;
    error: Error | null;
    permission: boolean;
    tokenGating?: TokenGatingResult | null;
    referralLogs: ReferralLog[];
}

function QuestsMissions({
    player,
    quests,
    questLogs,
    isLoading = true,
    error = null,
    permission = false,
    tokenGating,
    referralLogs,
}: QuestsMissionsProps) {
    // 로딩 상태 처리
    if (isLoading) {
        return <PartialLoading text="Quest lists are loading..." size="sm" />;
    }

    // 에러 상태 처리
    if (error) {
        return <div>Error: {error.message}</div>;
    }

    // 퀘스트 로그 매핑을 미리 계산하여 반복 검색 방지
    const questLogMap = useMemo(() => {
        const map = new Map<string, QuestLog>();
        questLogs.forEach((log) => {
            map.set(log.questId, log);
        });
        return map;
    }, [questLogs]);

    return (
        <div className="relative transition-all duration-700">
            {!permission && <Doorman />}

            <div
                className={cn(
                    "flex flex-col gap-4 my-4",
                    !permission && "blur-sm"
                )}
            >
                {quests.map((quest, index) => {
                    const specificTokenGatingData: TokenGatingData =
                        !quest.needToken ||
                        !quest.needTokenAddress ||
                        !tokenGating?.data
                            ? {
                                  hasToken: true,
                                  detail: [],
                              }
                            : tokenGating.data[quest.needTokenAddress];

                    return (
                        <div key={quest.id}>
                            <QuestsButton
                                player={player}
                                quest={quest}
                                questLog={questLogMap.get(quest.id) || null}
                                tokenGating={specificTokenGatingData}
                                permission={permission}
                                index={index}
                                referralLogs={referralLogs}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// 메모이제이션을 통해 불필요한 리렌더링 방지
export default memo(QuestsMissions);
