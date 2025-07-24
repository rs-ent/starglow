/// app/raffles/test/[contractAddress]/[raffleId]/page.tsx

import RaffleOnchain from "@/components/raffles/onchain/Raffle.Onchain";
import { Suspense } from "react";
import PartialLoadingServer from "@/components/atoms/PartialLoadingServer";

export default async function RaffleTestPage({
    params,
}: {
    params: Promise<{ contractAddress: string; raffleId: string }>;
}) {
    const { contractAddress, raffleId } = await params;

    return (
        <Suspense
            fallback={
                <div className="relative flex flex-col w-full h-screen overflow-hidden items-center justify-center">
                    <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />
                    <PartialLoadingServer text="Raffles to join...🎰" />
                </div>
            }
        >
            <RaffleOnchain
                contractAddress={contractAddress}
                raffleId={raffleId}
            />
        </Suspense>
    );
}
