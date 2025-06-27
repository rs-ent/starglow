/// app/raffles/[id]/page.tsx

import { Suspense } from "react";
import { notFound } from "next/navigation";
import RaffleDetail from "@/components/raffles/Raffle.Detail";
import PartialLoadingServer from "@/components/atoms/PartialLoadingServer";
import type { Metadata } from "next";
import { getRaffleDetails } from "@/app/actions/raffles/actions";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const raffle = await getRaffleDetails(id);

    const description =
        raffle.data?.description || "Earn tokens for participating in raffles";

    return {
        title: `${raffle.data?.title || "Raffle"} - Raffles`,
        description,
        openGraph: {
            title: `${raffle.data?.title || "Raffle"} - Raffles`,
            description,
            images: [raffle.data?.imgUrl || "/default-og-image.jpg"],
        },
        twitter: {
            title: `${raffle.data?.title || "Raffle"} - Raffles`,
            description,
            images: [raffle.data?.imgUrl || "/default-og-image.jpg"],
        },
    };
}

interface RafflePageProps {
    params: Promise<{ id: string }>;
}

function RaffleLoading() {
    return (
        <div className="relative flex flex-col w-full h-screen overflow-hidden items-center justify-center">
            <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />
            <PartialLoadingServer text="Raffle to join...🎰" />
        </div>
    );
}

async function RaffleContent({ id }: { id: string }) {
    return <RaffleDetail raffleId={id} />;
}

export default async function RaffleEntryPage({ params }: RafflePageProps) {
    const { id } = await params;

    if (!id) {
        notFound();
    }

    return (
        <Suspense fallback={<RaffleLoading />}>
            <RaffleContent id={id} />
        </Suspense>
    );
}
