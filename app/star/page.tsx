/// app/star/page.tsx

import { Suspense } from "react";
import PartialLoadingServer from "@/components/atoms/PartialLoadingServer";
import Star from "@/components/star/Star";
import { getArtists } from "@/app/actions/artists";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Star",
    description: "Explore the galaxy of K-pop artists with Starglow",
    openGraph: {
        title: "Star",
        description: "Explore the galaxy of K-pop artists with Starglow",
        images: ["/default-og-image.jpg"],
    },
    twitter: {
        title: "Star",
        description: "Explore the galaxy of K-pop artists with Starglow",
        images: ["/default-og-image.jpg"],
    },
};

function StarLoading() {
    return (
        <div className="relative flex flex-col w-full h-screen overflow-hidden items-center justify-center">
            <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />
            <PartialLoadingServer text="Loading..." />
        </div>
    );
}

async function StarContent() {
    const artists = await getArtists();

    return <Star artists={artists} />;
}

export default function StarEntryPage() {
    return (
        <Suspense fallback={<StarLoading />}>
            <StarContent />
        </Suspense>
    );
}
