/// components/user/User.MyStar.Modal.Contents.Collections.Card.tsx

import React, { useCallback, useMemo, useState } from "react";

import { CopyIcon } from "lucide-react";

import { useToast } from "@/app/hooks/useToast";
import { formatDate } from "@/lib/utils/format";
import { ArtistBG, ArtistFG } from "@/lib/utils/get/artist-colors";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import ImageMetadata from "../atoms/ImageMetadata";

import type { VerifiedSPG } from "@/app/story/interaction/actions";
import type { Artist } from "@prisma/client";

interface UserMyStarModalContentsCollectionsCardProps {
    artist: Artist;
    verifiedSPG: VerifiedSPG;
}

export default React.memo(function UserMyStarModalContentsCollectionsCard({
    artist,
    verifiedSPG,
}: UserMyStarModalContentsCollectionsCardProps) {
    const [showStatus, setShowStatus] = useState(false);

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
                {verifiedSPG.name}
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
                    imageUrl={verifiedSPG.imageUrl || ""}
                    className={cn(
                        "w-full h-full",
                        "rounded-[16px] overflow-hidden"
                    )}
                    onClick={() =>
                        setShowStatus(
                            verifiedSPG.verifiedTokens.length > 0 && !showStatus
                        )
                    }
                    showStatus={showStatus}
                    popup={
                        <Status
                            verifiedSPG={verifiedSPG}
                            glowStart={verifiedSPG.glowStart || ""}
                            glowEnd={verifiedSPG.glowEnd || ""}
                        />
                    }
                    showDonotHaveToken={verifiedSPG.verifiedTokens.length === 0}
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
});

function Status({
    verifiedSPG,
    glowStart,
    glowEnd,
}: {
    verifiedSPG: VerifiedSPG;
    glowStart: Date | string | null;
    glowEnd: Date | string | null;
}) {
    const toast = useToast();

    const data = useMemo(() => {
        const result = [
            {
                title: "Amount",
                value:
                    verifiedSPG.verifiedTokens.length.toLocaleString() || "0",
                needCopy: false,
            },
        ];

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
            value: verifiedSPG.address,
            needCopy: true,
        });

        result.push({
            title: "Token IDs",
            value: verifiedSPG.verifiedTokens.sort((a, b) => a - b).join(", "),
            needCopy: false,
        });

        return result;
    }, [verifiedSPG, glowStart, glowEnd]);

    const handleCopy = useCallback(async (value: string) => {
        await navigator.clipboard.writeText(value);
        toast.success("Copied to clipboard");
    }, [toast]);

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
                    {data.map((item) => (
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
                                            handleCopy(item.value).catch(
                                                (error) => {
                                                    console.error(
                                                        "Failed to copy:",
                                                        error
                                                    );
                                                }
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
