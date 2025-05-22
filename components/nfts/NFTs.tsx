/// components/templates/NFTs.tsx

"use client";

import { useState } from "react";
import NFTsCollections from "./NFTs.Collections";
import type { Collection } from "@/app/actions/factoryContracts";
import { cn } from "@/lib/utils/tailwind";
import { useRouter } from "next/navigation";

export default function NFTs() {
    const router = useRouter();
    const [isFadingOut, setIsFadingOut] = useState(false);

    const handleBuyNowClick = (collection: Collection) => {
        setIsFadingOut(true);
        setTimeout(() => {
            router.push(`/nfts/${collection.address}`);
        }, 950);
    };

    return (
        <div className="overflow-hidden">
            <div className="flex items-center justify-center w-screen">
                <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />
                <div
                    className={cn(
                        "fixed inset-0 bg-black opacity-0 -z-50",
                        isFadingOut
                            ? "opacity-100 transition-opacity duration-1000 z-50"
                            : ""
                    )}
                />
                <NFTsCollections onBuyNowClick={handleBuyNowClick} />
            </div>
        </div>
    );
}
