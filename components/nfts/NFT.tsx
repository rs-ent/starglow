/// components/nfts/NFT.tsx

"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils/tailwind";

import NFTContents from "./NFT.Contents";

import type { SPG } from "@/app/story/spg/actions";

interface NFTProps {
    spg: SPG;
}

export default function NFT({ spg }: NFTProps) {
    const [isFadingIn, setIsFadingIn] = useState(false);
    const [faded, setFaded] = useState(false);

    useEffect(() => {
        setIsFadingIn(true);
        setTimeout(() => {
            setFaded(true);
        }, 1000);
    }, []);

    return (
        <>
            <div
                className={cn(
                    "fixed inset-0 bg-black opacity-100 z-50 w-screen h-screen",
                    isFadingIn
                        ? "opacity-0 transition-opacity duration-1000"
                        : "opacity-100",
                    faded ? "-z-50" : "z-50"
                )}
            />

            <NFTContents spg={spg} />
        </>
    );
}
