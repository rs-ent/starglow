/// components/molecules/ArtistMessage.tsx

"use client";

import { Artist, ArtistMessage as ArtistMessageType } from "@prisma/client";
import ArtistMessageMessage from "@/components/atoms/ArtistMessage.Message";
import { useArtistsGet } from "@/app/hooks/useArtists";
import { useEffect, useState } from "react";
import PartialLoading from "@/components/atoms/PartialLoading";
import ImageViewer from "../atoms/ImageViewer";
import { cn } from "@/lib/utils/tailwind";
import { motion, AnimatePresence } from "framer-motion";

interface ArtistMessageProps {
    artist: Artist;
    className?: string;
}

export default function ArtistMessage({
    artist,
    className,
}: ArtistMessageProps) {
    const [message, setMessage] = useState<ArtistMessageType | null>(null);
    const [isReady, setIsReady] = useState(false);

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

    useEffect(() => {
        if (message && !isLoading) {
            setIsReady(true);
        }
    }, [message, isLoading]);

    return (
        <AnimatePresence>
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
                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -100 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                        >
                            <ImageViewer
                                img={message.bannerUrl}
                                title={message.message}
                                framePadding={1}
                                showTitle={false}
                            />
                        </motion.div>
                    )}
                    <ArtistMessageMessage message={message.message} />
                </div>
            )}
        </AnimatePresence>
    );
}
