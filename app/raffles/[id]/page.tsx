/// app/raffles/[id]/page.tsx

import { Suspense } from "react";
import { notFound } from "next/navigation";
import RaffleDetail from "@/components/raffles/Raffle.Detail";
import PartialLoadingServer from "@/components/atoms/PartialLoadingServer";

interface RafflePageProps {
    params: Promise<{ id: string }>;
}

export default async function RafflePage({ params }: RafflePageProps) {
    const { id } = await params;

    if (!id) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#09021B] to-[#311473]">
            <Suspense
                fallback={
                    <div className="relative flex flex-col w-full h-screen overflow-hidden items-center justify-center">
                        <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />
                        <PartialLoadingServer text="Raffle to join...🎰" />
                    </div>
                }
            >
                <RaffleDetail raffleId={id} />
            </Suspense>
        </div>
    );
}
