/// components/atoms/ImageViewer.tsx

import { H3 } from "./Typography";
import { cn } from "@/lib/utils/tailwind";
import Image from "next/image";

export interface ImageViewerProps {
    url: string;
    title: string;
    img?: string;
    className?: string;
    framePadding?: number;
}

export default function ImageViewer({
    url,
    title,
    img,
    className = "",
    framePadding = undefined,
}: ImageViewerProps) {
    const imageUrl = img || `${url}/opengraph-image.png`;

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
                <div className="relative w-full aspect-video overflow-hidden rounded-xl">
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        style={{
                            objectFit: "cover",
                        }}
                    />
                </div>
                {title && (
                    <div className="mt-4 text-start flex-grow">
                        <H3 size={15}>{title}</H3>
                    </div>
                )}
            </div>
        </div>
    );
}
