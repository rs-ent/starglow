/// components/organisms/Quests.Contents.tsx

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/tailwind";
import { Player } from "@prisma/client";
import PublicPrivateTab from "@/components/molecules/PublicPrivateTab";
import QuestsPrivate from "./Quests.Private";
import { useReferralGet } from "@/app/hooks/useReferral";
import QuestsPublic from "./Quests.Public";

interface QuestsContentsProps {
    player: Player;
}

export default function QuestsContents({ player }: QuestsContentsProps) {
    const [isPublic, setIsPublic] = useState(true);

    const { referralLogs } = useReferralGet({
        GetReferralLogsInput: {
            playerId: player.id,
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
                    player={player}
                    privateTabClicked={isPublic}
                    referralLogs={referralLogs}
                />
            ) : (
                <QuestsPublic player={player} referralLogs={referralLogs} />
            )}
        </div>
    );
}
