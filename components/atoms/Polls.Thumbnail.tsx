/// components/atoms/PollThumbnail.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { Poll } from "@prisma/client";
import { getYoutubeVideoId, getYoutubeThumbnailUrl } from "@/lib/utils/youtube";
import Image from "next/image";
import { cn } from "@/lib/utils/tailwind";
import YoutubeViewer from "./YoutubeViewer";

interface PollThumbnailProps {
    poll: Poll;
    className?: string;
    imageClassName?: string;
    fallbackSrc?: string;
    quality?: number;
    showAvailableVideo?: boolean;
}

export default function PollThumbnail({
    poll,
    className = "",
    imageClassName = "",
    fallbackSrc = "/default-image.jpg",
    quality = 100,
    showAvailableVideo = false,
}: PollThumbnailProps) {
    const [src, setSrc] = useState<string>(poll.imgUrl || fallbackSrc);
    const [videoId, setVideoId] = useState<string | null>(null);
    const { ref, isVisible } = useIntersectionObserver();

    useEffect(() => {
        let mounted = true;
        async function fetchThumbnail() {
            if (!isVisible) return;

            if (poll.imgUrl) {
                setSrc(poll.imgUrl);
                if (showAvailableVideo && poll.youtubeUrl) {
                    const videoId = getYoutubeVideoId(poll.youtubeUrl);
                    if (videoId) {
                        console.log("videoId", videoId);
                        setVideoId(videoId);
                    }
                }
            } else if (poll.youtubeUrl) {
                const videoId = getYoutubeVideoId(poll.youtubeUrl);
                if (videoId) {
                    setVideoId(videoId);
                    console.log("videoId", videoId);
                    const url = await getYoutubeThumbnailUrl(videoId);
                    if (mounted) setSrc(url || fallbackSrc);
                } else {
                    setSrc(fallbackSrc);
                }
            } else {
                setSrc(fallbackSrc);
            }
        }
        fetchThumbnail();
        return () => {
            mounted = false;
        };
    }, [poll.imgUrl, poll.youtubeUrl, fallbackSrc, isVisible]);

    return (
        <div ref={ref} className={cn("relative w-full h-full", className)}>
            {showAvailableVideo && videoId ? (
                <YoutubeViewer videoId={videoId} framePadding={1} />
            ) : (
                <Image
                    src={src}
                    alt={poll.title || "썸네일"}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                    className={cn("object-cover", imageClassName)}
                    quality={quality}
                    loading="lazy"
                />
            )}
        </div>
    );
}

function useIntersectionObserver() {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: "50px",
                threshold: 0.1,
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, []);

    return { ref, isVisible };
}
