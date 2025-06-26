/// app/raffles/page.tsx

import { Suspense } from "react";
import RafflesList from "@/components/raffles/Raffles.List";
import PartialLoadingServer from "@/components/atoms/PartialLoadingServer";

export default function RafflesPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-[#09021B] to-[#311473]">
            <Suspense
                fallback={
                    <div className="relative flex flex-col w-full h-screen overflow-hidden items-center justify-center">
                        <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />
                        <PartialLoadingServer text="Raffles to join...🎰" />
                    </div>
                }
            >
                <RafflesList />
            </Suspense>
        </div>
    );
}
