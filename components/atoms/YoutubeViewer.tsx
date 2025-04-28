/// components/atoms/YoutubeViewer.tsx

import { H3, Paragraph } from "./Typography";
import { cn } from "@/lib/utils/tailwind";
import { useRef } from "react";

export interface YoutubeViewerProps {
    videoId: string | undefined;
    artist?: string;
    title?: string;
    className?: string;
    framePadding?: number;
    isShowing?: boolean;
    autoPlay?: boolean;
    initialVolume?: number;
}

export default function YoutubeViewer({
    videoId,
    artist,
    title,
    className = "",
    framePadding = undefined,
    autoPlay = true,
}: YoutubeViewerProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    if (!videoId) return null;

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center h-full",
                className
            )}
        >
            <div
                className={cn(
                    "gradient-border rounded-2xl shadow-lg p-4 backdrop-blur-sm w-full flex flex-col",
                    `bg-gradient-to-br from-[rgba(0,0,0,0.15)] to-[rgba(0,0,0,0.3)]`,
                    framePadding ? `p-[${framePadding}px]` : ""
                )}
            >
                <div className="w-full aspect-video overflow-hidden rounded-xl">
                    <iframe
                        ref={iframeRef}
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${
                            typeof window !== "undefined"
                                ? window.location.origin
                                : ""
                        }&autoplay=${
                            autoPlay ? "1" : "0"
                        }&playsinline=1&loop=1&controls=0`}
                        title={`${artist} - ${title}`}
                    />
                </div>
                {title || artist ? (
                    <div className="flex items-start justify-between mt-2">
                        {title && (
                            <div className="text-start flex-grow mt-1">
                                <H3 size={20}>{title}</H3>
                                {artist && (
                                    <Paragraph
                                        size={10}
                                        className="text-muted-foreground"
                                    >
                                        {artist}
                                    </Paragraph>
                                )}
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
