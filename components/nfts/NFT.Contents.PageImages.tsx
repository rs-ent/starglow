/// components/nfts/NFT.Contents.PageImages.tsx

"use client";

import { Collection } from "@/app/actions/factoryContracts";
import { useMemo, useState } from "react";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

interface NFTContentsPageImagesProps {
    collection: Collection;
}

export default function NFTContentsPageImages({
    collection,
}: NFTContentsPageImagesProps) {
    const images = useMemo(
        () => collection.pageImages || [],
        [collection.pageImages]
    );
    const [showAll, setShowAll] = useState(false);

    if (!images.length) return null;

    return (
        <div
            className={cn(
                "w-full bg-card/40 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50",
                showAll ? "h-full" : "h-[800px]"
            )}
        >
            {images.map((img, idx) => (
                <div key={img} className="w-full" style={{}}>
                    <img
                        src={img}
                        alt={`collection page image ${idx + 1}`}
                        style={{
                            width: "100%",
                            height: "auto",
                            objectFit: "contain",
                            display: "block",
                        }}
                    />
                </div>
            ))}
            <div
                className={cn(
                    "absolute bottom-0 left-0 right-0 min-h-[300px] flex items-end justify-center",
                    "pb-[20px]",
                    showAll
                        ? "bg-transparent"
                        : "bg-gradient-to-b from-transparent to-black"
                )}
            >
                <button
                    className={cn(
                        "border border-white/50 rounded-sm w-full mx-4",
                        "backdrop-blur-lg",
                        "cursor-pointer",
                        "transition-all duration-300 opacity-70 hover:opacity-100",
                        "hover:bg-white/10",
                        "font-main",
                        getResponsiveClass(15).paddingClass,
                        getResponsiveClass(10).textClass
                    )}
                    onClick={() => setShowAll(!showAll)}
                >
                    {showAll ? "Collapse" : "Expand"}
                </button>
            </div>
        </div>
    );
}
