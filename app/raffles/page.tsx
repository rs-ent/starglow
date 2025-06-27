/// app/raffles/page.tsx

import { Suspense } from "react";
import RafflesList from "@/components/raffles/Raffles.List";
import PartialLoadingServer from "@/components/atoms/PartialLoadingServer";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Raffles",
    description: "Join the raffles to win prizes",
    openGraph: {
        title: "Raffles",
        description: "Join the raffles to win prizes",
    },
    twitter: {
        title: "Raffles",
        description: "Join the raffles to win prizes",
    },
};

function RafflesLoading() {
    return (
        <div className="relative flex flex-col w-full h-screen overflow-hidden items-center justify-center">
            <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />
            <PartialLoadingServer text="Raffles to join...🎰" />
        </div>
    );
}

async function RafflesContent() {
    return <RafflesList />;
}

export default function RafflesEntryPage() {
    return (
        <Suspense fallback={<RafflesLoading />}>
            <RafflesContent />
        </Suspense>
    );
}
