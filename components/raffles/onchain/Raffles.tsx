/// components/raffles/web3/Raffles.tsx

"use client";

import { memo } from "react";
import { useOnchainRaffles } from "@/app/actions/raffles/onchain/hooks";
import RafflesOnchainList from "./Raffles.Onchain.List";
import PartialLoading from "@/components/atoms/PartialLoading";

function Raffles() {
    const { onchainRaffles, isOnchainRafflesLoading, isOnchainRafflesError } =
        useOnchainRaffles({
            getOnchainRafflesInput: {},
        });

    if (isOnchainRafflesLoading) {
        return <PartialLoading text="Greasing the slot lever...🔧" />;
    }

    if (isOnchainRafflesError) {
        return (
            <div className="p-6 bg-gray-900 min-h-screen text-white">
                <h1 className="text-2xl font-bold mb-4">Onchain Raffles</h1>
                <p className="text-red-400">Failed to load data.</p>
            </div>
        );
    }

    return <RafflesOnchainList raffles={onchainRaffles?.data?.raffles || []} />;
}

export default memo(Raffles);
