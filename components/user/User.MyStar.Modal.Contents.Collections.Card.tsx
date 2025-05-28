/// components/user/User.MyStar.Modal.Contents.Collections.Card.tsx

import { VerifiedCollection } from "@/app/actions/collectionContracts";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { ArtistBG, ArtistFG } from "@/lib/utils/get/artist-colors";
import { formatDate } from "@/lib/utils/format";
import { Artist } from "@prisma/client";
import ImageMetadata from "../atoms/ImageMetadata";
import type { METADATA_TYPE } from "@/app/actions/metadata";
import { useMemo, useState } from "react";
import { CopyIcon } from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import ArtistMessage from "../artists/ArtistMessage";

interface UserMyStarModalContentsCollectionsCardProps {
    artist: Artist;
    verifiedCollection: VerifiedCollection;
}

export default function UserMyStarModalContentsCollectionsCard({
    artist,
    verifiedCollection,
}: UserMyStarModalContentsCollectionsCardProps) {
    const [showStatus, setShowStatus] = useState(false);

    const metadata = useMemo(() => {
        return verifiedCollection.metadata?.metadata as METADATA_TYPE;
    }, [verifiedCollection]);

    return (
        <div
            className={cn(
                "w-full h-full p-5",
                "flex flex-col items-center justify-center"
            )}
        >
            <h2
                className={cn(
                    getResponsiveClass(40).textClass,
                    `text-[${ArtistFG(artist, 0, 100)}]`
                )}
            >
                {verifiedCollection.name}
            </h2>
            <div
                className={cn(
                    "w-full h-full flex items-center justify-center",
                    "mt-[50px]",
                    "rounded-[16px]",
                    "p-[10px]",
                    "border",
                    `border-[${ArtistBG(artist, 0, 100)}]`
                )}
            >
                <ImageMetadata
                    metadata={metadata}
                    className={cn(
                        "w-full h-full",
                        "rounded-[16px] overflow-hidden"
                    )}
                    onClick={() => setShowStatus(!showStatus)}
                    showStatus={showStatus}
                    popup={
                        <Status
                            verifiedCollection={verifiedCollection}
                            metadata={metadata}
                        />
                    }
                    style={
                        {
                            boxShadow: `0px 0px 16px 1px ${ArtistBG(
                                artist,
                                2,
                                50
                            )}`,
                        } as React.CSSProperties
                    }
                />
            </div>
        </div>
    );
}

function Status({
    verifiedCollection,
    metadata,
}: {
    verifiedCollection: VerifiedCollection;
    metadata: METADATA_TYPE;
}) {
    const toast = useToast();

    const data = useMemo(() => {
        const result = [
            {
                title: "Amount",
                value:
                    verifiedCollection.verifiedTokens.length.toLocaleString() ||
                    "0",
                needCopy: false,
            },
        ];

        const glowStart =
            verifiedCollection.glowStart ||
            metadata.attributes?.find(
                (attr) => attr.trait_type === "Glow Start"
            )?.value;

        const glowEnd =
            verifiedCollection.glowEnd ||
            metadata.attributes?.find((attr) => attr.trait_type === "Glow End")
                ?.value;

        if (glowStart && glowEnd) {
            result.push({
                title: "Period",
                value: `${formatDate(new Date(glowStart)).split(" ")[0]} ~ ${
                    formatDate(new Date(glowEnd)).split(" ")[0]
                }`,
                needCopy: false,
            });
        }

        result.push({
            title: "Address",
            value: verifiedCollection.address,
            needCopy: true,
        });

        result.push({
            title: "Token IDs",
            value: verifiedCollection.verifiedTokens
                .sort((a, b) => a - b)
                .join(", "),
            needCopy: false,
        });

        return result;
    }, [verifiedCollection, metadata]);

    return (
        <div
            className={cn(
                "flex flex-col justify-center w-full h-full overflow-y-auto",
                getResponsiveClass(30).paddingClass
            )}
        >
            <div className={cn("w-full h-full my-7")}>
                <h2 className={cn(getResponsiveClass(30).textClass)}>Status</h2>
                <div
                    className={cn(
                        "flex flex-col gap-2 w-full",
                        "mt-[15px]",
                        getResponsiveClass(20).textClass
                    )}
                >
                    {data.map((item, index) => (
                        <div key={item.title}>
                            <div
                                className={cn(
                                    "w-full h-[1px] bg-white/20",
                                    getResponsiveClass(10).marginYClass
                                )}
                            />
                            <div
                                key={item.title}
                                className="flex flex-row gap-3"
                            >
                                <p className="font-bold">{item.title}</p>
                                <p className="text-[rgba(255,255,255,0.8)] text-ellipsis overflow-hidden">
                                    {item.value}
                                </p>
                                {item.needCopy && (
                                    <button
                                        className="text-white/80"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(
                                                item.value
                                            );
                                            toast.success(
                                                "Copied to clipboard"
                                            );
                                        }}
                                    >
                                        <CopyIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
