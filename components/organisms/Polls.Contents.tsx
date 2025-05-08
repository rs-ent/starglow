/// components/organisms/Polls.Contents.tsx

"use client";

import { cn } from "@/lib/utils/tailwind";
import { Player } from "@prisma/client";
import { useState } from "react";
import PublicPrivateTab from "../molecules/PublicPrivateTab";
import PollsPublic from "./Polls.Public";
import PollsPrivate from "./Polls.Private";

interface PollsContentsProps {
    player: Player;
}

export default function PollsContents({ player }: PollsContentsProps) {
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

            {isPublic ? (
                <PollsPublic player={player} />
            ) : (
                <PollsPrivate player={player} privateTabClicked={isPublic} />
            )}
        </div>
    );
}
