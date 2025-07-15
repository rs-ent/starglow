/// app/star/[id]/page.tsx

import { cache, Suspense } from "react";

import { auth } from "@/app/auth/authSettings";
import PartialLoadingServer from "@/components/atoms/PartialLoadingServer";
import StarContents from "@/components/star/Star.Contents";
import { getArtistForStarPage } from "@/app/actions/artists";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const getCachedArtist = cache(async (code: string) => {
    return await getArtistForStarPage({ code });
});

export async function generateMetadata({
    params,
}: {
    params: Promise<{ code: string }>;
}): Promise<Metadata> {
    const { code } = await params;
    const artist = await getCachedArtist(code);

    return {
        title: `Star - ${artist?.name || "Artist"}`,
        description: "Explore the galaxy of K-pop artists with Starglow",
        openGraph: {
            title: `Star - ${artist?.name || "Artist"}`,
            description: "Explore the galaxy of K-pop artists with Starglow",
            images: [artist?.imageUrl || artist?.logoUrl || ""],
        },
        twitter: {
            title: `Star - ${artist?.name || "Artist"}`,
            description: "Explore the galaxy of K-pop artists with Starglow",
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
    const artist = await getCachedArtist(code);

    if (!artist) {
        notFound();
    }

    return <StarContents player={session?.player ?? null} artist={artist} />;
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
