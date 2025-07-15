/// components/quests/Quests.Missions.tsx

"use client";

import { memo } from "react";

import { cn } from "@/lib/utils/tailwind";

import QuestsButton from "./Quests.Button";
import Doorman from "../atoms/Doorman";
import PartialLoading from "../atoms/PartialLoading";

import type {
    TokenGatingData,
    TokenGatingResult,
} from "@/app/story/nft/actions";
import type { Player, Quest } from "@prisma/client";
import { useReferralGet } from "@/app/hooks/useReferral";

interface QuestsMissionsProps {
    player: Player | null;
    quests: Quest[];
    isLoading: boolean;
    error: Error | null;
    permission: boolean;
    tokenGating?: TokenGatingResult | null;
}

function QuestsMissions({
    player,
    quests,
    isLoading = true,
    error = null,
    permission = false,
    tokenGating,
}: QuestsMissionsProps) {
    const { referralLogs } = useReferralGet({
        GetReferralLogsInput: {
            playerId: player?.id ?? "",
        },
    });

    if (isLoading) {
        return <PartialLoading text="Quest lists are loading..." />;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <div className="relative transition-all duration-700">
            {!permission && <Doorman />}

            <div
                className={cn(
                    "flex flex-col gap-4 my-4 overflow-hidden",
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
                        <div key={quest.id} className="overflow-hidden">
                            <QuestsButton
                                player={player}
                                quest={quest}
                                tokenGating={specificTokenGatingData}
                                permission={permission}
                                index={index}
                                referralLogs={referralLogs || []}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default memo(QuestsMissions);
