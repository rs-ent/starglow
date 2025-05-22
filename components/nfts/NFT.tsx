/// components/nfts/NFT.tsx

"use client";

import type { Collection } from "@/app/actions/factoryContracts";
import { cn } from "@/lib/utils/tailwind";
import { useEffect, useState } from "react";

interface NFTProps {
    collection: Collection;
    searchParams?: { [key: string]: string | string[] | undefined };
}

export default function NFT({ collection, searchParams }: NFTProps) {
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

            <div className="flex flex-col items-center justify-center">
                <div className="flex flex-col items-center justify-center">
                    <h1 className="text-4xl font-bold">{collection.name}</h1>
                </div>
            </div>
        </>
    );
}
