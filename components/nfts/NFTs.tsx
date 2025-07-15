/// components/templates/NFTs.tsx

"use client";

import { useState, useCallback } from "react";

import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils/tailwind";

import NFTsCollections from "./NFTs.Collections";

import type { SPG } from "@/app/story/spg/actions";

export default function NFTs() {
    const router = useRouter();
    const [isFadingOut, setIsFadingOut] = useState(false);

    const handleBuyNowClick = useCallback(
        (collection: SPG) => {
            setIsFadingOut(true);
            setTimeout(() => {
                router.push(`/glow/${collection.id}`);
            }, 950);
        },
        [router]
    );

    return (
        <div className="overflow-hidden">
            <div className="flex items-center justify-center w-screen relative">
                <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />
                {/* Multiple radial gradients to create blur-like effect */}
                <div
                    className="absolute inset-0 bg-gradient-radial from-purple-500/30 via-transparent to-transparent blur-xl animate-pulse-slow -z-10"
                    style={{
                        background: `
                                 radial-gradient(circle at 20% 30%, rgba(47, 45, 70, 0.4) 0%, transparent 60%),
                                 radial-gradient(circle at 80% 70%, rgba(177, 112, 171, 0.4) 0%, transparent 50%),
                                 radial-gradient(circle at 60% 20%, rgba(236, 72, 173, 0.3) 0%, transparent 40%),
                                 radial-gradient(circle at 40% 80%, rgba(28, 17, 70, 0.4) 0%, transparent 45%)
                             `,
                    }}
                />

                {/* Animated floating orbs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-float-slow -z-10" />
                <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-pink-400/15 rounded-full blur-2xl animate-float-slow-reverse -z-10" />
                <div className="absolute top-1/2 left-3/4 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl animate-float-medium -z-10" />

                {/* Overlay blur effect */}
                <div className="absolute inset-0 backdrop-blur-sm bg-black/10 -z-10" />
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
