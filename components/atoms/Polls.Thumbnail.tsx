/// components/atoms/PollThumbnail.tsx

"use client";

import { useEffect, useRef, useState } from "react";

import Image from "next/image";

import { cn } from "@/lib/utils/tailwind";
import { getYoutubeVideoId, getYoutubeThumbnailUrl } from "@/lib/utils/youtube";

import YoutubeViewer from "./YoutubeViewer";

import type { PollListData } from "@/app/actions/polls";
import type { Poll } from "@prisma/client";

interface PollThumbnailProps {
    poll: PollListData | Poll;
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
        const fetchThumbnail = async () => {
            if (!isVisible) return;

            if (poll.imgUrl) {
                setSrc(poll.imgUrl);
                if (showAvailableVideo && poll.youtubeUrl) {
                    const videoId = getYoutubeVideoId(poll.youtubeUrl);
                    if (videoId) {
                        setVideoId(videoId);
                    }
                }
            } else if (poll.youtubeUrl) {
                const videoId = getYoutubeVideoId(poll.youtubeUrl);
                if (videoId) {
                    setVideoId(videoId);
                    const url = await getYoutubeThumbnailUrl(videoId);
                    if (mounted) setSrc(url || fallbackSrc);
                } else {
                    setSrc(fallbackSrc);
                }
            } else {
                setSrc(fallbackSrc);
            }
        };

        fetchThumbnail().catch((error) => {
            console.error("Failed to fetch thumbnail:", error);
        });
        return () => {
            mounted = false;
        };
    }, [
        poll.imgUrl,
        poll.youtubeUrl,
        fallbackSrc,
        isVisible,
        showAvailableVideo,
    ]);

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
        const element = ref.current;
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

        if (element) {
            observer.observe(element);
        }

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, []);

    return { ref, isVisible };
}
