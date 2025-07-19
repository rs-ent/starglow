/// app/raffles/test/[contractAddress]/[raffleId]/page.tsx

import RaffleOnchain from "@/components/raffles/web3/Raffle.Onchain";
import { Suspense } from "react";

export default async function RaffleTestPage({
    params,
}: {
    params: Promise<{ contractAddress: string; raffleId: string }>;
}) {
    const { contractAddress, raffleId } = await params;

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <RaffleOnchain
                contractAddress={contractAddress}
                raffleId={raffleId}
            />
        </Suspense>
    );
}
