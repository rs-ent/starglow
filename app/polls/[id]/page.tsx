/// app\polls\[id]\page.tsx

import {
    getPoll,
    getPlayerPollLogs,
    TokenGatingResult,
    tokenGating,
} from "@/app/actions/polls";
import { PollLog } from "@prisma/client";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getAuthUserAndPlayer } from "@/app/auth/authUtils";
import { ArtistBG } from "@/lib/utils/get/artist-colors";
import { Metadata } from "next";
import PollComponent from "@/components/polls/Poll";

function PollsLoading() {
    return (
        <div className="relative flex flex-col w-full h-full overflow-hidden">
            <div className="fixed inset-0 bg-gradient-to-b from-[#09011b] to-[#311473] -z-20" />
            <div className="flex justify-center items-center h-screen">
                <div className="animate-pulse text-center">
                    <h2 className="text-4xl mb-4">Poll</h2>
                    <p className="text-muted-foreground">Loading poll...</p>
                </div>
            </div>
        </div>
    );
}

export async function generateMetadata({
    params,
}: {
    params: { id: string };
}): Promise<Metadata> {
    const { id } = await params;
    const poll = await getPoll(id);

    if (!poll) {
        return {
            title: "Poll Not Found | Starglow",
            description: "The requested poll does not exist.",
        };
    }

    const artistName = poll.artist?.name ? ` | ${poll.artist.name}` : "";
    const title = artistName
        ? `${poll.title} | ${artistName} | Poll | Starglow`
        : `${poll.title} | Poll | Starglow`;
    const description = poll.description || "Vote in the latest Starglow poll!";
    const image = poll.imgUrl || "/default-og-image.png";

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [image],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [image],
        },
    };
}

export default async function PollPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const poll = await getPoll(id);

    const { user, player } = await getAuthUserAndPlayer();
    let pollLogs: PollLog[] = [];
    let tokenGatingResult: TokenGatingResult | null = null;
    if (player && user) {
        pollLogs = await getPlayerPollLogs({
            playerId: player.id,
            pollId: id,
        });

        tokenGatingResult = await tokenGating({
            pollId: id,
            userId: user.id,
        });
    }

    if (!poll) {
        return notFound();
    }

    return (
        <Suspense fallback={<PollsLoading />}>
            <div className="relative flex flex-col items-center justify-center w-full min-h-screen">
                <div
                    className="fixed inset-0 -z-20"
                    style={{
                        background: poll.artist
                            ? `linear-gradient(to bottom right, ${ArtistBG(
                                  poll.artist,
                                  2,
                                  100
                              )}, ${ArtistBG(poll.artist, 3, 100)})`
                            : "linear-gradient(to bottom right, #09021B, #311473)",
                    }}
                />

                <PollComponent
                    poll={poll}
                    player={player || null}
                    artist={poll.artist || null}
                    pollLogs={pollLogs}
                    tokenGatingData={tokenGatingResult}
                    bgColorAccentFrom={
                        poll.artist ? ArtistBG(poll.artist, 2, 100) : undefined
                    }
                    bgColorAccentTo={
                        poll.artist ? ArtistBG(poll.artist, 3, 100) : undefined
                    }
                />
            </div>
        </Suspense>
    );
}
