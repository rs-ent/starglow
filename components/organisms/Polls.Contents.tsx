/// components/organisms/Polls.Contents.tsx

"use client";

import { cn } from "@/lib/utils/tailwind";
import { Player } from "@prisma/client";
import { usePollsGet } from "@/app/hooks/usePolls";
import { useState } from "react";
import PublicPrivateTab from "../molecules/PublicPrivateTab";
import PollsPublic from "./Polls.Public";
import PollsPrivate from "./Polls.Private";

interface PollsContentsProps {
    player: Player;
}

export default function PollsContents({ player }: PollsContentsProps) {
    const [isPublic, setIsPublic] = useState(true);

    const { pollLogs, isLoadingPollLogs, pollLogsError } = usePollsGet({
        getPollLogsInput: {
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

            {isPublic ? (
                <PollsPublic player={player} pollLogs={pollLogs} />
            ) : (
                <PollsPrivate
                    player={player}
                    pollLogs={pollLogs}
                    privateTabClicked={isPublic}
                />
            )}
        </div>
    );
}
