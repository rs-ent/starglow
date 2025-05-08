/// components/organisms/Polls.ArtistList.tsx

"use client";

import { AdvancedTokenGateResult } from "@/app/actions/blockchain";
import { Artist, Player } from "@prisma/client";

interface PollsArtistListProps {
    artist: Artist;
    player: Player;
    tokenGatingResult?: AdvancedTokenGateResult | null;
}

export default function PollsArtistList({
    artist,
    player,
    tokenGatingResult,
}: PollsArtistListProps) {
    return <div>PollsArtistList</div>;
}
