/// components/user/User.MyStar.Modal.Contents.tsx

import { Artist, Player, QuestLog, PollLog } from "@prisma/client";
import type { VerifiedSPG } from "@/app/story/interaction/actions";
import UserMyStarModalContentsCollections from "./User.MyStar.Modal.Contents.Collections";
import { cn } from "@/lib/utils/tailwind";
import React from "react";

interface UserMyStarModalContentsProps {
    artist: Artist;
    verifiedSPGs: VerifiedSPG[];
    player: Player | null;
    questLogs: QuestLog[];
    pollLogs: PollLog[];
}

export default React.memo(function UserMyStarModalContents({
    artist,
    verifiedSPGs,
    player,
    questLogs,
    pollLogs,
}: UserMyStarModalContentsProps) {
    return (
        <div className={cn("max-w-[1000px] mx-auto")}>
            <UserMyStarModalContentsCollections
                artist={artist}
                verifiedSPGs={verifiedSPGs}
                player={player}
                questLogs={questLogs}
                pollLogs={pollLogs}
            />
        </div>
    );
});
