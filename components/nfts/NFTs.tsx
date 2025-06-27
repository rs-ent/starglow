/// components/templates/NFTs.tsx

"use client";

import { useState, useCallback } from "react";

import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils/tailwind";

import NFTsCollections from "./NFTs.Collections";

import type { SPG } from "@/app/story/spg/actions";

export default function NFTs({ spgs }: { spgs: SPG[] }) {
    const router = useRouter();
    const [isFadingOut, setIsFadingOut] = useState(false);

    const handleBuyNowClick = useCallback(
        (collection: SPG) => {
            setIsFadingOut(true);
            setTimeout(() => {
                router.push(`/nfts/${collection.address}`);
            }, 950);
        },
        [router]
    );

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
                <NFTsCollections
                    onBuyNowClick={handleBuyNowClick}
                    spgs={spgs}
                />
            </div>
        </div>
    );
}
