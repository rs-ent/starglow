/// components/atoms/ImageCollection.tsx

"use client";

import { Skeleton } from "../ui/skeleton";
import Image from "next/image";
import { METADATA_TYPE } from "@/app/actions/metadata";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { useRouter } from "next/navigation";

export default function ImageMetadata({
    imageUrl,
    metadata,
    className,
    style,
    showCustomText = false,
    customText = "",
    showStatus = false,
    onClick = () => {},
    popup = null,
    showDonotHaveToken = false,
}: {
    imageUrl?: string;
    metadata?: METADATA_TYPE;
    className?: string;
    style?: React.CSSProperties;
    showCustomText?: boolean;
    customText?: string;
    showStatus?: boolean;
    onClick?: () => void;
    popup?: React.ReactNode;
    showDonotHaveToken?: boolean;
}) {
    return (
        <div
            className={cn(
                "relative aspect-[4/3] overflow-hidden rounded-[7px]",
                "gradient-border",
                className
            )}
            onClick={onClick}
            style={style}
        >
            {imageUrl || metadata?.image ? (
                <>
                    <div
                        className={cn(
                            "absolute inset-0 z-10",
                            "bg-black/75",
                            "transition-opacity duration-500",
                            popup && showStatus ? "opacity-100" : "opacity-0"
                        )}
                        style={{
                            height: "100%",
                            width: "100%",
                        }}
                    >
                        {popup}
                    </div>
                    {showDonotHaveToken && <DonotHaveToken />}
                    <Image
                        src={imageUrl || metadata?.image || ""}
                        alt={metadata?.name || ""}
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

function DonotHaveToken() {
    const router = useRouter();

    const handleBuyClick = () => {
        router.push("/nfts");
    };
    return (
        <div
            className={cn(
                "absolute inset-0 z-10 w-full h-full flex items-center justify-center bg-[rgba(0,0,0,0.3)] backdrop-blur-xs",
                "flex flex-col gap-2 overflow-x-hidden overflow-y-auto"
            )}
        >
            <img
                src="/icons/lock.svg"
                className={cn(getResponsiveClass(35).frameClass)}
                alt="Lock icon"
            />
            <h4
                className={cn(
                    getResponsiveClass(15).textClass,
                    "text-white font-semibold text-center"
                )}
            >
                Unlock exclusive benefits
                <br />
                by owning this token!
            </h4>
            <button
                onClick={handleBuyClick}
                className={cn(
                    "mt-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold shadow-lg hover:scale-105 transition-transform",
                    getResponsiveClass(15).textClass,
                    getResponsiveClass(20).paddingClass
                )}
            >
                Buy Now
            </button>
        </div>
    );
}
