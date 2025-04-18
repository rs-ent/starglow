/// components\molecules\NFTs.CollectionDetails.tsx

"use client";

import Image from "next/image";
import { CollectionContract, Metadata } from "@prisma/client";
import { METADATA_TYPE } from "@/app/actions/metadata";
import { H2, H3 } from "../atoms/Typography";
import {
    Globe,
    ExternalLink,
    Share2,
    CircleDollarSign,
    Calendar,
    Users,
} from "lucide-react";

interface CollectionDetailsProps {
    collection: CollectionContract & { metadata: Metadata };
    metadata: METADATA_TYPE;
}

export default function CollectionDetails({
    collection,
    metadata,
}: CollectionDetailsProps) {
    const sharePercentage = metadata?.attributes?.find(
        (attr) => attr.trait_type === "Share Percentage"
    )?.value;

    const glowStartDate = metadata?.attributes?.find(
        (attr) => attr.trait_type === "Glow Start"
    )?.value;

    const glowEndDate = metadata?.attributes?.find(
        (attr) => attr.trait_type === "Glow End"
    )?.value;

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <div className="w-full bg-card/40 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50">
            {/* Banner Image */}
            <div className="relative w-full h-60 sm:h-72 md:h-96">
                {metadata?.image ? (
                    <Image
                        src={metadata.image}
                        alt={collection.name}
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
                <H2 className="text-xl md:text-2xl lg:text-3xl mb-4 break-words">
                    {collection.name}
                </H2>

                {/* Key info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6">
                    <div className="flex items-center text-foreground/70 text-sm md:text-base">
                        <CircleDollarSign className="flex-shrink-0 w-4 h-4 md:w-5 md:h-5 mr-2 text-primary" />
                        <span>Price: ${collection.price}</span>
                    </div>

                    <div className="flex items-center text-foreground/70 text-sm md:text-base">
                        <Users className="flex-shrink-0 w-4 h-4 md:w-5 md:h-5 mr-2 text-primary" />
                        <span>Supply: {collection.circulation}</span>
                    </div>

                    {glowStartDate && (
                        <div className="flex items-center text-foreground/70 text-sm md:text-base">
                            <Calendar className="flex-shrink-0 w-4 h-4 md:w-5 md:h-5 mr-2 text-primary" />
                            <span>
                                Glow Start: {formatDate(Number(glowStartDate))}
                            </span>
                        </div>
                    )}

                    {glowEndDate && (
                        <div className="flex items-center text-foreground/70 text-sm md:text-base">
                            <Calendar className="flex-shrink-0 w-4 h-4 md:w-5 md:h-5 mr-2 text-primary" />
                            <span>
                                Glow End: {formatDate(Number(glowEndDate))}
                            </span>
                        </div>
                    )}

                    {sharePercentage && (
                        <div className="flex items-center text-foreground/70 text-sm md:text-base">
                            <Share2 className="flex-shrink-0 w-4 h-4 md:w-5 md:h-5 mr-2 text-primary" />
                            <span>Share: {sharePercentage}</span>
                        </div>
                    )}

                    {metadata?.external_url && (
                        <div className="flex items-center text-foreground/70 text-sm md:text-base">
                            <ExternalLink className="flex-shrink-0 w-4 h-4 md:w-5 md:h-5 mr-2 text-primary" />
                            <a
                                href={metadata.external_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline truncate"
                            >
                                View Report
                            </a>
                        </div>
                    )}
                </div>

                {/* Description */}
                {metadata?.description && (
                    <div className="mb-6 md:mb-8">
                        <H3 className="mb-2 md:mb-3 text-lg md:text-xl">
                            Description
                        </H3>
                        <p className="text-sm md:text-base text-foreground/80 whitespace-pre-line">
                            {metadata.description}
                        </p>
                    </div>
                )}

                {/* Contract Info */}
                <div className="mb-6 md:mb-8">
                    <H3 className="mb-2 md:mb-3 text-lg md:text-xl">
                        Contract Details
                    </H3>
                    <div className="text-sm md:text-base text-foreground/80">
                        <p className="mb-2">
                            Contract Address:{" "}
                            <span className="font-mono">
                                {collection.address}
                            </span>
                        </p>
                        <p>Network: {collection.networkId}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
