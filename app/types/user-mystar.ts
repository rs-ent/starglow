import type { ArtistFeedWithReactions } from "@/app/actions/artistFeeds";
import type { VerifiedSPG } from "@/app/story/interaction/actions";
import type { Artist, Player, QuestLog, PollLog } from "@prisma/client";

export interface UserMyStarBaseProps {
    player: Player | null;
    questLogs: QuestLog[];
    pollLogs: PollLog[];
    artist: Artist;
    verifiedSPGs: VerifiedSPG[];
}

export interface UserMyStarModalProps extends UserMyStarBaseProps {
    open: boolean;
    onClose: () => void;
    onSelectFeed?: (
        initialFeeds: ArtistFeedWithReactions[],
        selectedFeedIndex: number
    ) => void;
}

export interface UserMyStarCollectionCardProps {
    artist: Artist;
    verifiedSPG: VerifiedSPG;
}

export type ModalState = "none" | "artist" | "feed";

export interface ArtistActivities {
    polls: any[];
    quests: any[];
}
