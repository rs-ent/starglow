/// components/nfts/NFT.tsx

"use client";

import { SPG } from "@/app/story/spg/actions";
import { cn } from "@/lib/utils/tailwind";
import { useEffect, useState } from "react";
import NFTContents from "./NFT.Contents";

interface NFTProps {
    spg: SPG;
    searchParams?: { [key: string]: string | string[] | undefined };
}

export default function NFT({ spg, searchParams }: NFTProps) {
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
