/// components/raffles/web3/Raffles.Onchain.List.tsx

"use client";

import { memo } from "react";
import Link from "next/link";
import type { Raffle } from "@/app/actions/raffles/web3/actions-read";
import RafflesOnchainListCard from "./Raffles.Onchain.List.Card";

interface RafflesOnchainListProps {
    raffles: Raffle[];
}

export default memo(function RafflesOnchainList({
    raffles,
}: RafflesOnchainListProps) {
    return (
        <div className="p-6 bg-gray-900 min-h-screen text-white">
            <h1 className="text-2xl font-bold mb-4">Onchain Raffles</h1>
            <p className="text-gray-300 mb-6">
                Total {raffles?.length || 0} raffles found.
            </p>

            {raffles?.length === 0 ? (
                <p className="text-gray-400">No raffles found.</p>
            ) : (
                <div className="grid gap-4">
                    {raffles?.map((raffle) => (
                        <Link
                            key={raffle.raffleId}
                            href={`/raffles/test/${raffle.contractAddress}/${raffle.raffleId}`}
                            className="border border-gray-700 rounded-lg p-4 bg-gray-800 shadow-lg hover:shadow-xl transition-shadow"
                        >
                            <RafflesOnchainListCard
                                contractAddress={raffle.contractAddress}
                                raffleId={raffle.raffleId}
                            />
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
});
