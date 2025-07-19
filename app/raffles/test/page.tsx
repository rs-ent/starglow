/// app/raffles/test/page.tsx

import Raffles from "@/components/raffles/web3/Raffles";
import { Suspense } from "react";

export default function RafflesTestPage() {
    return (
        <div className="space-y-6">
            <Suspense fallback={<div>Loading...</div>}>
                <Raffles />
            </Suspense>
        </div>
    );
}
