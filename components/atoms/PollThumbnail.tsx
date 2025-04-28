/// components/atoms/PollThumbnail.tsx

"use client";

import { useEffect, useState } from "react";
import { Poll } from "@prisma/client";
import { getYoutubeVideoId, getYoutubeThumbnailUrl } from "@/lib/utils/youtube";
import Image from "next/image";
interface PollThumbnailProps {
    poll: Poll;
    width?: number;
    height?: number;
    className?: string;
    fallbackSrc?: string;
    quality?: number;
}

export default function PollThumbnail({
    poll,
    width = 48,
    height = 48,
    className = "",
    fallbackSrc = "/default-image.jpg",
    quality = 100,
}: PollThumbnailProps) {
    const [src, setSrc] = useState<string>(poll.imgUrl || fallbackSrc);

    useEffect(() => {
        let mounted = true;
        async function fetchThumbnail() {
            if (poll.imgUrl) {
                setSrc(poll.imgUrl);
            } else if (poll.youtubeUrl) {
                const videoId = getYoutubeVideoId(poll.youtubeUrl);
                if (videoId) {
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
    }, [poll.imgUrl, poll.youtubeUrl, fallbackSrc]);

    return (
        <Image
            src={src}
            alt="썸네일"
            width={width}
            height={height}
            className={`object-cover rounded ${className}`}
            quality={quality}
        />
    );
}
