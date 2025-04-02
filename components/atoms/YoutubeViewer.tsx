/// components/atoms/YoutubeViewer.tsx

import { H3, Paragraph } from "./Typography";
import { cn } from "@/lib/utils/tailwind";

export interface YoutubeViewerProps {
    videoId: string;
    artist: string;
    title: string;
    className?: string;
    framePadding?: number;
}

export default function YoutubeViewer({
    videoId,
    artist,
    title,
    className = "",
    framePadding = undefined,
}: YoutubeViewerProps) {
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
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={`${artist} - ${title}`}
                        allowFullScreen
                    />
                </div>
                <div className="mt-4 text-start flex-grow">
                    <H3 size={20}>{title}</H3>
                    <Paragraph size={10} className="text-muted-foreground">
                        {artist}
                    </Paragraph>
                </div>
            </div>
        </div>
    );
}
