/// components/user/UserContents.MyAssets.NFT.Card.tsx

"use client";

import { useBlockchainGet } from "@/app/hooks/useBlockchainV2";
import { useSession } from "next-auth/react";
import { CollectionContract } from "@prisma/client";
import PartialLoading from "@/components/atoms/PartialLoading";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { useMemo } from "react";
import { useMetadata } from "@/app/hooks/useMetadata";
import { METADATA_TYPE } from "@/app/actions/metadata";
import ImageMetadata from "@/components/atoms/ImageMetadata";
import { formatHexToRGBA } from "@/lib/utils/format";

interface UserContentsMyAssetsNFTCardProps {
    collectionContract: CollectionContract;
    onSelect: (collection: CollectionContract, metadata: METADATA_TYPE) => void;
}

export default function UserContentsMyAssetsNFTCard({
    collectionContract,
    onSelect,
}: UserContentsMyAssetsNFTCardProps) {
    const { data: session } = useSession();

    const { metadataByCollectionAddress } = useMetadata({
        collectionAddress: collectionContract.address,
    });

    const { metadata, glowStart, glowEnd, bg1, bg2, bg3 } = useMemo(() => {
        const metadata = metadataByCollectionAddress?.metadata as METADATA_TYPE;

        const start =
            Number(
                metadata?.attributes?.find(
                    (attr) => attr.trait_type === "Glow Start"
                )?.value || new Date().getTime() / 1000
            ) * 1000;

        const end =
            Number(
                metadata?.attributes?.find(
                    (attr) => attr.trait_type === "Glow End"
                )?.value || new Date().getTime() / 1000
            ) * 1000;

        const bg = metadata?.background_color?.replace("#", "") || "000000";
        const bg1 = formatHexToRGBA(bg, 0.5);
        const bg2 = formatHexToRGBA(bg, 0.3);
        const bg3 = formatHexToRGBA(bg, 0.7);

        return {
            metadata,
            glowStart: start,
            glowEnd: end,
            bg1,
            bg2,
            bg3,
        };
    }, [metadataByCollectionAddress]);

    const { tokenGateData, isTokenGateLoading, tokenGateError } =
        useBlockchainGet({
            tokenGateInput: {
                userId: session?.user?.id ?? "",
                tokenType: "Collection",
                tokenAddress: collectionContract?.address ?? "",
            },
        });

    const handleSelect = () => {
        if (collectionContract && metadata) {
            onSelect(collectionContract, metadata);
        }
    };

    return (
        <div
            className={cn(
                "max-w-[400px] min-w-[100px] w-full",
                "flex flex-col items-center justify-center",
                "rounded-[14px] overflow-hidden",
                "bg-gradient-to-br",
                "gradient-border",
                "white-glow-smooth",
                "cursor-pointer",
                "transition-all duration-500 animate-in fade-in-0",
                isTokenGateLoading ? "opacity-0" : "opacity-100"
            )}
            style={{
                background: `linear-gradient(to bottom right, ${bg1}, ${bg2}, ${bg3})`,
            }}
            onClick={() => handleSelect()}
        >
            {isTokenGateLoading ? (
                <PartialLoading text="Loading..." size="sm" />
            ) : tokenGateError ? (
                <div className="text-center text-red-500">Error Occured</div>
            ) : (
                tokenGateData &&
                tokenGateData.data?.hasToken && (
                    <div
                        className={cn(
                            "w-full h-full",
                            "p-[10px] sm:p-[11px] md:p-[13px] lg:p-[16px]"
                        )}
                    >
                        <ImageMetadata metadata={metadata} className="mb-2" />
                        <div className="flex flex-col gap-[2px] items-start">
                            <div className="w-full flex flex-row items-start">
                                <h2
                                    className={cn(
                                        "truncate",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    {metadata?.name}
                                </h2>
                                <div
                                    className={cn(
                                        "ml-1 mt-1 rounded-full",
                                        "w-[5px] h-[5px] md:w-[7px] md:h-[7px]",
                                        "animate-pulse",
                                        "bg-red-500"
                                    )}
                                />
                            </div>
                            <p
                                className={cn(
                                    "text-[rgba(255,255,255,0.5)]",
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                {formatDate(glowStart)} ~ {formatDate(glowEnd)}
                            </p>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}

function formatDate(date: number) {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");

    return `${year}/${month}/${day}`;
}
