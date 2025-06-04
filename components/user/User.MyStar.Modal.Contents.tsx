/// components/user/User.MyStar.Modal.Contents.tsx

import { Artist, Player, QuestLog, PollLog } from "@prisma/client";
import type { VerifiedCollection } from "@/app/actions/collectionContracts";
import UserMyStarModalContentsCollections from "./User.MyStar.Modal.Contents.Collections";
import { cn } from "@/lib/utils/tailwind";
import React from "react";
import { ArtistFeedWithReactions } from "@/app/actions/artistFeeds";

interface UserMyStarModalContentsProps {
    artist: Artist;
    verifiedCollections: VerifiedCollection[];
    player: Player | null;
    questLogs: QuestLog[];
    pollLogs: PollLog[];
    onSelectFeed?: (
        initialFeeds: ArtistFeedWithReactions[],
        selectedFeedIndex: number
    ) => void;
}

export default React.memo(function UserMyStarModalContents({
    artist,
    verifiedCollections,
    player,
    questLogs,
    pollLogs,
    onSelectFeed,
}: UserMyStarModalContentsProps) {
    return (
        <div className={cn("max-w-[1000px] mx-auto")}>
            <UserMyStarModalContentsCollections
                artist={artist}
                verifiedCollections={verifiedCollections}
                player={player}
                questLogs={questLogs}
                pollLogs={pollLogs}
                onSelectFeed={onSelectFeed}
            />
        </div>
    );
});
