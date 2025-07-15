/// app\polls\[id]\page.tsx

import { Suspense } from "react";

import { notFound } from "next/navigation";

import { getPoll, tokenGatingPoll } from "@/app/actions/polls";
import { auth } from "@/app/auth/authSettings";
import PartialLoadingServer from "@/components/atoms/PartialLoadingServer";
import PollComponent from "@/components/polls/Poll";
import { ArtistBG } from "@/lib/utils/get/artist-colors";

import type { TokenGatingData } from "@/app/story/nft/actions";
import type { Metadata } from "next";

function PollsLoading() {
    return (
        <div className="relative flex flex-col w-full h-screen overflow-hidden items-center justify-center">
            <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />
            <PartialLoadingServer
                text="Loading poll..."
                loadingSize={70}
                textSize={10}
            />
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

    const artistName = poll.artist?.name || undefined;
    const title = artistName
        ? `${poll.title} | ${artistName} | Poll`
        : `${poll.title} | Poll`;
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

// 데이터를 가져오는 컴포넌트
async function PollContent({ id }: { id: string }) {
    const session = await auth();

    const poll = await getPoll(id);
    if (!poll) {
        return notFound();
    }

    let tokenGating: TokenGatingData | null = null;
    if (session?.player && session?.user) {
        tokenGating = await tokenGatingPoll({
            pollId: id,
            userId: session.user.id,
        });
    }

    return (
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
                player={session?.player || null}
                tokenGating={tokenGating}
                bgColorAccentFrom={
                    poll.artist ? ArtistBG(poll.artist, 2, 100) : undefined
                }
                bgColorAccentTo={
                    poll.artist ? ArtistBG(poll.artist, 3, 100) : undefined
                }
            />
        </div>
    );
}

export default function PollEntryPage({ params }: { params: { id: string } }) {
    const { id } = params;

    return (
        <Suspense fallback={<PollsLoading />}>
            <PollContent id={id} />
        </Suspense>
    );
}
