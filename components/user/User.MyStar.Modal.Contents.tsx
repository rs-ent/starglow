/// components/user/User.MyStar.Modal.Contents.tsx

"use client";

import React from "react";

import { cn } from "@/lib/utils/tailwind";

import UserMyStarModalContentsCollections from "./User.MyStar.Modal.Contents.Collections";

import type { ArtistFeedWithReactions } from "@/app/actions/artistFeeds";
import type { VerifiedSPG } from "@/app/story/interaction/actions";
import type { Artist, Player, QuestLog, PollLog } from "@prisma/client";

interface UserMyStarModalContentsProps {
    artist: Artist;
    verifiedSPGs: VerifiedSPG[];
    player: Player | null;
    questLogs: QuestLog[];
    pollLogs: PollLog[];
    onSelectFeed?: (
        initialFeeds: ArtistFeedWithReactions[],
        selectedFeedIndex: number
    ) => void;
    onInteractFeedbackStateChange?: (isOpen: boolean) => void;
}

export default React.memo(function UserMyStarModalContents({
    artist,
    verifiedSPGs,
    player,
    questLogs,
    pollLogs,
    onSelectFeed,
    onInteractFeedbackStateChange,
}: UserMyStarModalContentsProps) {
    return (
        <div className={cn("max-w-[1000px] mx-auto")}>
            <UserMyStarModalContentsCollections
                artist={artist}
                verifiedSPGs={verifiedSPGs}
                player={player}
                questLogs={questLogs}
                pollLogs={pollLogs}
                onSelectFeed={onSelectFeed}
                onInteractFeedbackStateChange={onInteractFeedbackStateChange}
            />
        </div>
    );
});
