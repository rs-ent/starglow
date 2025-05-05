/// components/organisms/Quests.Contents.tsx

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/tailwind";
import { Player } from "@prisma/client";
import PublicPrivateTab from "@/components/molecules/PublicPrivateTab";
import QuestsPrivate from "./Quests.Private";
import { useQuestGet } from "@/app/hooks/useQuest";
import QuestsPublic from "./Quests.Public";

interface QuestsContentsProps {
    player: Player;
}

export default function QuestsContents({ player }: QuestsContentsProps) {
    const [isPublic, setIsPublic] = useState(true);

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
                <QuestsPrivate player={player} privateTabClicked={isPublic} />
            ) : (
                <QuestsPublic player={player} />
            )}
        </div>
    );
}
