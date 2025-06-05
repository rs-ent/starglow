/// components/nfts/NFT.Contents.Details.tsx

"use client";

import Image from "next/image";
import { Copy } from "lucide-react";
import { Collection } from "@/app/actions/factoryContracts";
import { METADATA_TYPE } from "@/app/actions/metadata";
import { H2, H3 } from "../atoms/Typography";
import {
    Globe,
    ExternalLink,
    Share2,
    CircleDollarSign,
    Calendar,
    Users,
    UserPlus,
    Package,
    Wallet,
    PlayCircle,
    StopCircle,
    Percent,
} from "lucide-react";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { useMemo, useState, useCallback } from "react";
import { useToast } from "@/app/hooks/useToast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Countdown from "@/components/atoms/Countdown";
import { useCollectionGet } from "@/app/hooks/useCollectionContracts";
import { CollectionParticipantType } from "@prisma/client";
import React from "react";
import { SPG } from "@/app/story/spg/actions";
import { formatDate } from "@/lib/utils/format";

interface NFTContentsDetailsProps {
    spg: SPG;
    participantsType: CollectionParticipantType;
    status: string;
    dateLabel: string;
    dateValue: string;
    circulation: {
        remain: number;
        total: number;
    } | null;
    isCirculationLoading: boolean;
}

export default React.memo(function NFTContentsDetails({
    spg,
    participantsType,
    status,
    dateLabel,
    dateValue,
    circulation,
    isCirculationLoading,
}: NFTContentsDetailsProps) {
    const toast = useToast();

    const handleCopyAddress = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(spg.address);
            toast.success("Collection address copied to clipboard");
        } catch (error) {
            toast.error("Failed to copy collection address");
        }
    }, [spg.address, toast]);
    const { sharePercentage, glowStartDate, glowEndDate, reportUrl } =
        useMemo(() => {
            const sharePercentage = spg.sharePercentage ?? 0;

            const glowStartDate = spg.glowStart;
            console.log("glowStartDate", glowStartDate);

            const glowEndDate = spg.glowEnd;
            console.log("glowEndDate", glowEndDate);

            const reportUrl = spg.reportUrl;

            return { sharePercentage, glowStartDate, glowEndDate, reportUrl };
        }, [spg]);

    // 원하는 size를 지정 (예: 20)
    const size = 20;
    const { textClass, frameClass } = getResponsiveClass(size);

    return (
        <div className="w-full bg-card/40 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50">
            {/* Banner Image */}
            <div className="relative w-full aspect-[4/3]">
                {spg.imageUrl ? (
                    <Image
                        src={spg.imageUrl}
                        alt={spg.name}
                        fill
                        className="object-cover"
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

            {/* Collection Info */}
            <div className="p-4 sm:p-6 md:p-8">
                <H2
                    className={cn(getResponsiveClass(40).textClass, "mb-[5px]")}
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
                            status === "ENDED" && "bg-slate-400 text-white",
                            getResponsiveClass(20).textClass
                        )}
                    >
                        {status}
                    </Badge>
                    <Countdown
                        endDate={new Date(dateValue)}
                        className={cn(
                            getResponsiveClass(30).textClass,
                            "font-digital"
                        )}
                    />
                </div>

                {/* Key info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6">
                    <div
                        className={`flex items-center text-foreground/70 ${textClass}`}
                    >
                        <CircleDollarSign
                            className={`flex-shrink-0 text-primary ${frameClass} mr-2`}
                        />
                        <span>Price: ${spg.price}</span>
                    </div>

                    <div
                        className={`flex items-center text-foreground/70 ${textClass}`}
                    >
                        {participantsType === "PREREGISTRATION" ||
                        participantsType === "PRESALE" ? (
                            <>
                                <UserPlus
                                    className={`flex-shrink-0 text-primary ${frameClass} mr-2`}
                                />
                                <span>Awaiters: {0}</span>
                            </>
                        ) : participantsType === "PRIVATESALE" ||
                          participantsType === "PUBLICSALE" ? (
                            <>
                                <Package
                                    className={`flex-shrink-0 text-primary ${frameClass} mr-2`}
                                />
                                <span>
                                    Supply: {circulation?.remain || 0} /{" "}
                                    {circulation?.total || 0}
                                </span>
                            </>
                        ) : null}
                    </div>

                    <div
                        className={`flex items-center text-foreground/70 ${textClass} cursor-pointer`}
                        onClick={handleCopyAddress}
                    >
                        <Wallet
                            className={`flex-shrink-0 text-primary ${frameClass} mr-2`}
                        />
                        <span className="flex-1 min-w-0 truncate">
                            Address: {spg.address}
                        </span>
                        <Copy
                            className={cn(
                                "flex-shrink-0 ml-1",
                                getResponsiveClass(5).frameClass
                            )}
                        />
                    </div>

                    {glowStartDate && (
                        <div
                            className={`flex items-center text-foreground/70 ${textClass}`}
                        >
                            <PlayCircle
                                className={`flex-shrink-0 text-primary ${frameClass} mr-2`}
                            />
                            <span>Glow Start: {formatDate(glowStartDate)}</span>
                        </div>
                    )}

                    {glowEndDate && (
                        <div
                            className={`flex items-center text-foreground/70 ${textClass}`}
                        >
                            <StopCircle
                                className={`flex-shrink-0 text-primary ${frameClass} mr-2`}
                            />
                            <span>Glow End: {formatDate(glowEndDate)}</span>
                        </div>
                    )}

                    {sharePercentage && (
                        <div
                            className={`flex items-center text-foreground/70 ${textClass}`}
                        >
                            <Percent
                                className={`flex-shrink-0 text-primary ${frameClass} mr-2`}
                            />
                            <span>
                                Share: {sharePercentage * 100}% of Artist's
                                Total Sales
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
