/// components/raffles/web3/Raffles.tsx

"use client";

import { memo } from "react";
import { useOnchainRaffles } from "@/app/actions/raffles/onchain/hooks";
import RafflesOnchainList from "./Raffles.Onchain.List";
import PartialLoading from "@/components/atoms/PartialLoading";

function Raffles() {
    const { onchainRaffles, isOnchainRafflesLoading, isOnchainRafflesError } =
        useOnchainRaffles({
            getOnchainRafflesInput: {
                isActive: "ACTIVE",
            },
        });

    if (isOnchainRafflesLoading) {
        return (
            <div className="relative flex flex-col w-full min-h-screen h-full overflow-hidden items-center justify-center">
                <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />

                <div
                    className="absolute inset-0 bg-gradient-radial from-purple-500/30 via-transparent to-transparent blur-xl animate-pulse-slow -z-10"
                    style={{
                        background: `
                        radial-gradient(circle at 20% 30%, rgba(33, 109, 172, 0.57) 0%, transparent 60%),
                        radial-gradient(circle at 80% 70%, rgba(177, 112, 171, 0.4) 0%, transparent 50%),
                        radial-gradient(circle at 60% 20%, rgba(102, 72, 236, 0.62) 0%, transparent 40%),
                        radial-gradient(circle at 40% 80%, rgba(88, 45, 74, 0.56) 0%, transparent 45%)
                    `,
                    }}
                />

                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-float-slow -z-10" />
                <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-pink-400/15 rounded-full blur-2xl animate-float-slow-reverse -z-10" />
                <div className="absolute top-1/2 left-3/4 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl animate-float-medium -z-10" />

                <div className="absolute inset-0 backdrop-blur-sm bg-black/10 -z-10" />
                <PartialLoading text="Greasing the lever...🔧" />
            </div>
        );
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
