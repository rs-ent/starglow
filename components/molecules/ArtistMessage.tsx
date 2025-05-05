/// components/molecules/ArtistMessage.tsx

"use client";

import { Artist, ArtistMessage as ArtistMessageType } from "@prisma/client";
import ArtistMessageMessage from "@/components/atoms/ArtistMessage.Message";
import { useArtistsGet } from "@/app/hooks/useArtists";
import { useEffect, useState } from "react";
import PartialLoading from "@/components/atoms/PartialLoading";
import ImageViewer from "../atoms/ImageViewer";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

interface ArtistMessageProps {
    artist: Artist;
    className?: string;
}

export default function ArtistMessage({
    artist,
    className,
}: ArtistMessageProps) {
    const [message, setMessage] = useState<ArtistMessageType | null>(null);

    const { artistMessages, isLoading, error } = useArtistsGet({
        getArtistMessagesInput: {
            artistId: artist.id,
        },
    });

    useEffect(() => {
        if (artistMessages) {
            setMessage(artistMessages[0]);
        }
    }, [artistMessages]);

    return (
        <>
            {isLoading && <PartialLoading text="Loading..." size="sm" />}
            {error && <div>Error: {error.message}</div>}
            {message && (
                <div
                    className={cn(
                        "max-w-[1000px] w-screen overflow-x-hidden px-[20px] sm:px-[30px] md:px-[40px] lg:px-[50px] h-auto",
                        "flex flex-col gap-2",
                        className
                    )}
                >
                    {message.bannerUrl && (
                        <ImageViewer
                            img={message.bannerUrl}
                            title={message.message}
                            framePadding={1}
                            showTitle={false}
                        />
                    )}

                    <ArtistMessageMessage message={message.message} />
                </div>
            )}
        </>
    );
}
