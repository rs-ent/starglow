/// components/nfts/NFT.Contents.PageImages.tsx

"use client";

import { useMemo, useState } from "react";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import React from "react";
import { SPG } from "@/app/story/spg/actions";
interface NFTContentsPageImagesProps {
    spg: SPG;
}

export default React.memo(function NFTContentsPageImages({
    spg,
}: NFTContentsPageImagesProps) {
    const images = useMemo(() => spg.pageImages || [], [spg.pageImages]);
    const [showAll, setShowAll] = useState(false);

    if (!images.length) return null;

    return (
        <div
            className={cn(
                "w-full bg-card/40 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50",
                showAll ? "" : "h-[800px]"
            )}
        >
            {images.map((img, idx) => (
                <div key={img} className="w-full">
                    <img
                        src={img}
                        alt={`collection page image ${idx + 1}`}
                        style={{
                            width: "100%",
                            height: "auto",
                            objectFit: "contain",
                            display: "block",
                        }}
                        loading={idx === 0 ? "eager" : "lazy"}
                        fetchPriority={idx === 0 ? "high" : "auto"}
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
});
