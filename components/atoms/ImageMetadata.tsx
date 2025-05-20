/// components/atoms/ImageCollection.tsx

"use client";

import { Skeleton } from "../ui/skeleton";
import Image from "next/image";
import { METADATA_TYPE } from "@/app/actions/metadata";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

export default function ImageMetadata({
    metadata,
    className,
    showCustomText = false,
    customText = "",
}: {
    metadata: METADATA_TYPE;
    className?: string;
    showCustomText?: boolean;
    customText?: string;
}) {
    return (
        <div
            className={cn(
                "relative aspect-[4/3] overflow-hidden rounded-[7px] mb-2",
                "gradient-border",
                className
            )}
        >
            {metadata?.image ? (
                <>
                    <Image
                        src={metadata.image}
                        alt={metadata.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        quality={90}
                        priority
                        loading="eager"
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx0fHRsdHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR3/2wBDAR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR3/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                    />

                    {showCustomText && (
                        <div
                            className={cn(
                                "absolute h-[40%] bottom-0 left-0 right-0 z-10",
                                "bg-gradient-to-t from-[rgba(0,0,0,0.5)] to-[rgba(0,0,0,0)]",
                                "flex items-end justify-center"
                            )}
                        >
                            <h2
                                className="mb-5"
                                style={{
                                    textShadow: "0 0 10px rgba(0,0,0,0.4)",
                                }}
                            >
                                {customText}
                            </h2>
                        </div>
                    )}
                </>
            ) : (
                <Skeleton className="w-full h-full" />
            )}
        </div>
    );
}
