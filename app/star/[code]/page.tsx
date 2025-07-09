/// app/star/[id]/page.tsx

import { Suspense } from "react";

import { auth } from "@/app/auth/authSettings";
import PartialLoadingServer from "@/components/atoms/PartialLoadingServer";
import StarContents from "@/components/star/Star.Contents";
import { getArtist } from "@/app/actions/artists";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { PolishedArtist } from "@/components/star/Star.List";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ code: string }>;
}): Promise<Metadata> {
    const { code } = await params;
    const artist = await getArtist({ code });

    return {
        title: `Star - ${artist?.name || "Artist"}`,
        description:
            artist?.description ||
            "Explore the galaxy of K-pop artists with Starglow",
        openGraph: {
            title: `Star - ${artist?.name || "Artist"}`,
            description:
                artist?.description ||
                "Explore the galaxy of K-pop artists with Starglow",
            images: [artist?.imageUrl || artist?.logoUrl || ""],
        },
        twitter: {
            title: `Star - ${artist?.name || "Artist"}`,
            description:
                artist?.description ||
                "Explore the galaxy of K-pop artists with Starglow",
            images: [artist?.imageUrl || artist?.logoUrl || ""],
        },
    };
}

function StarLoading() {
    return (
        <div className="relative flex flex-col w-full h-screen overflow-hidden items-center justify-center">
            <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />
            <PartialLoadingServer text="Loading..." />
        </div>
    );
}

async function StarContent({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    const session = await auth();
    const artist = await getArtist({ code });

    if (!artist) {
        notFound();
    }

    const polishedArtist: PolishedArtist = {
        ...artist,
        totalPosts:
            artist.boards?.reduce(
                (sum, board) => sum + board.posts.length,
                0
            ) || 0,
        totalPolls:
            artist.polls?.filter((poll) => poll.isActive && poll.showOnStarPage)
                .length || 0,
        totalQuests:
            artist.quests?.filter((quest) => quest.isActive).length || 0,
    };

    return (
        <StarContents
            player={session?.player ?? null}
            artist={polishedArtist}
        />
    );
}

export default async function StarEntryPage({
    params,
}: {
    params: Promise<{ code: string }>;
}) {
    return (
        <Suspense fallback={<StarLoading />}>
            <StarContent params={params} />
        </Suspense>
    );
}
