/// components/nfts/NFT.Contents.Details.tsx

"use client";

import React, { useMemo, useCallback } from "react";

import { Copy, CircleDollarSign, Package, Wallet, Percent } from "lucide-react";
import Image from "next/image";

import { useToast } from "@/app/hooks/useToast";
import Countdown from "@/components/atoms/Countdown";
import { Badge } from "@/components/ui/badge";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import { H2 } from "../atoms/Typography";

import type { SPG } from "@/app/story/spg/actions";
import type { CollectionParticipantType } from "@prisma/client";

interface NFTContentsDetailsProps {
    spg: SPG;
    participantsType: CollectionParticipantType;
    status: string;
    dateValue: string;
    circulation: {
        remain: number;
        total: number;
    } | null;
    comingSoon: boolean;
    hiddenDetails: boolean;
}

export default React.memo(function NFTContentsDetails({
    spg,
    status,
    dateValue,
    circulation,
    comingSoon,
    hiddenDetails,
}: NFTContentsDetailsProps) {
    const toast = useToast();

    const handleCopyAddress = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(spg.address);
            toast.success("Collection address copied to clipboard");
        } catch (error) {
            console.error("Failed to copy collection address:", error);
            toast.error("Failed to copy collection address");
        }
    }, [spg.address, toast]);

    const { sharePercentage } = useMemo(() => {
        const sharePercentage = spg.sharePercentage ?? 0;
        return { sharePercentage };
    }, [spg]);

    return (
        <div className="w-full bg-card/40 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50">
            {/* Banner Image */}
            <div className="relative w-full aspect-[4/3] overflow-hidden">
                {hiddenDetails && (
                    <div
                        className={cn(
                            "absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent ",
                            "flex items-center justify-center",
                            "z-50"
                        )}
                    >
                        <p
                            className={cn(
                                "text-white/85",
                                getResponsiveClass(20).textClass
                            )}
                        >
                            Coming Soon
                        </p>
                    </div>
                )}
                {spg.imageUrl ? (
                    <Image
                        src={spg.imageUrl}
                        alt={hiddenDetails ? "Coming Soon" : spg.name}
                        fill
                        className={cn(
                            "object-cover",
                            hiddenDetails && "blur-lg"
                        )}
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, 66vw"
                        priority
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                        <p className="text-foreground/50">No image available</p>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            </div>

            {!hiddenDetails && (
                <>
                    {/* Collection Info */}
                    <div className="p-4 sm:p-6 md:p-8">
                        <H2
                            className={cn(
                                getResponsiveClass(40).textClass,
                                "mb-[5px]"
                            )}
                        >
                            {spg.name}
                        </H2>

                        {/* Status Badge + Date */}
                        <div className="flex items-center gap-3 mb-[20px]">
                            <Badge
                                className={cn(
                                    "uppercase",
                                    status.includes("LIVE") &&
                                        "bg-purple-600 text-white animate-pulse drop-shadow-glow",
                                    status.includes("ON SALE") &&
                                        "bg-purple-500 text-white animate-pulse drop-shadow-glow",
                                    status.includes("GLOW") &&
                                        "bg-purple-400 text-white animate-pulse",
                                    status.includes("SCHEDULED") &&
                                        "bg-purple-200 text-purple-900 animate-pulse",
                                    status === "ENDED" &&
                                        "bg-slate-400 text-white",
                                    getResponsiveClass(20).textClass
                                )}
                            >
                                {status}
                            </Badge>
                            {!comingSoon && (
                                <Countdown
                                    endDate={new Date(dateValue)}
                                    className={cn(
                                        getResponsiveClass(30).textClass,
                                        "font-digital"
                                    )}
                                />
                            )}
                        </div>

                        {/* Key info grid */}

                        <div className="grid grid-cols-1 gap-3">
                            <div
                                className={cn(
                                    "flex items-center text-foreground/70",
                                    getResponsiveClass(20).textClass
                                )}
                            >
                                <CircleDollarSign
                                    className={cn(
                                        "flex-shrink-0 text-primary",
                                        getResponsiveClass(20).frameClass,
                                        "mr-2"
                                    )}
                                />
                                <span>Price: ${spg.price}</span>
                            </div>

                            <div
                                className={cn(
                                    "flex items-center text-foreground/70",
                                    getResponsiveClass(20).textClass
                                )}
                            >
                                <Package
                                    className={cn(
                                        "flex-shrink-0 text-primary",
                                        getResponsiveClass(20).frameClass,
                                        "mr-2"
                                    )}
                                />
                                <span>
                                    Circulation: {circulation?.remain || 0} /{" "}
                                    {circulation?.total || 0}
                                </span>
                            </div>

                            <div
                                className={cn(
                                    "flex items-center text-foreground/70",
                                    getResponsiveClass(20).textClass,
                                    "cursor-pointer"
                                )}
                                onClick={handleCopyAddress}
                            >
                                <Wallet
                                    className={cn(
                                        "flex-shrink-0 text-primary",
                                        getResponsiveClass(20).frameClass,
                                        "mr-2"
                                    )}
                                />
                                <span className="flex-1 min-w-0 truncate">
                                    Address: {spg.address}
                                </span>
                                <Copy
                                    className={cn(
                                        "flex-shrink-0 ml-1",
                                        getResponsiveClass(20).frameClass
                                    )}
                                />
                            </div>

                            {sharePercentage && (
                                <div
                                    className={cn(
                                        "flex items-baseline text-foreground/70",
                                        getResponsiveClass(20).textClass
                                    )}
                                >
                                    <Percent
                                        className={cn(
                                            "flex-shrink-0 text-primary",
                                            getResponsiveClass(20).frameClass,
                                            "mr-2"
                                        )}
                                    />
                                    <span>Share:</span>
                                    <span className="font-bold mx-1">
                                        {`${sharePercentage * 100}%`}
                                    </span>
                                    <span
                                        className={cn(
                                            "text-foreground/70",
                                            getResponsiveClass(10).textClass
                                        )}
                                    >
                                        {`of Artist's Total Sales`}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
});
