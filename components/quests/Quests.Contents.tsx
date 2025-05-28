/// components/organisms/Quests.Contents.tsx

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/tailwind";
import { Player } from "@prisma/client";
import PublicPrivateTab from "@/components/atoms/PublicPrivateTab";
import QuestsPrivate from "./Quests.Contents.Private";
import { useReferralGet } from "@/app/hooks/useReferral";
import { useQuestGet } from "@/app/hooks/useQuest";
import QuestsPublic from "./Quests.Contents.Public";
import { User } from "next-auth";

interface QuestsContentsProps {
    user: User | null;
    player: Player | null;
}

export default function QuestsContents({ user, player }: QuestsContentsProps) {
    const [isPublic, setIsPublic] = useState(true);

    const { playerQuestLogs } = useQuestGet({
        getPlayerQuestLogsInput: {
            playerId: player?.id ?? "",
        },
    });

    const { referralLogs } = useReferralGet({
        GetReferralLogsInput: {
            playerId: player?.id ?? "",
        },
    });

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center",
                "transition-all duration-700"
            )}
        >
            <PublicPrivateTab
                isPublic={isPublic}
                onPublic={() => {
                    setIsPublic(true);
                }}
                onPrivate={() => {
                    setIsPublic(false);
                }}
                frameSize={20}
                textSize={30}
                gapSize={5}
                paddingSize={10}
            />
            {!isPublic ? (
                <QuestsPrivate
                    user={user}
                    player={player}
                    questLogs={playerQuestLogs || []}
                    privateTabClicked={isPublic}
                    referralLogs={referralLogs}
                />
            ) : (
                <QuestsPublic
                    player={player}
                    questLogs={playerQuestLogs || []}
                    referralLogs={referralLogs}
                />
            )}
        </div>
    );
}
