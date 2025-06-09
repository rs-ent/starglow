/// components\molecules\NFTs.CollectionCard.tsx

"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import { CircleDollarSign, Users, CheckCircle2 } from "lucide-react";
import { SPG } from "@/app/story/spg/actions";
import { useMemo } from "react";

interface CollectionCardProps {
    spg: SPG;
    nftCount?: number;
    showPrice?: boolean;
    showSharePercentage?: boolean;
    showCirculation?: boolean;
    isVerified?: boolean;
    isLinked?: boolean;
}

export default function CollectionCard({
    spg,
    nftCount,
    showPrice = true,
    showSharePercentage = true,
    showCirculation = true,
    isVerified = false,
    isLinked = true,
}: CollectionCardProps) {
    const sharePercentage = useMemo(() => {
        return spg.sharePercentage ?? 0;
    }, [spg]);

    // 배경색과 전경색이 없을 경우를 위한 기본값
    const backgroundColor = spg.backgroundColor || "bg-card/50";
    const foregroundColor = spg.foregroundColor || "text-foreground";

    return (
        <Link href={isLinked ? `/collections/${spg.address}` : ""}>
            <Card
                className={`group overflow-hidden hover:shadow-xl transition-all duration-300 hover:bg-card border border-border/50`}
                style={{
                    background: `linear-gradient(to bottom, ${backgroundColor}, rgba(0, 0, 0, 0.5))`,
                    color: spg.foregroundColor || undefined,
                }}
            >
                {/* 이미지 섹션 */}
                <div className="relative aspect-[4/3] overflow-hidden bg-muted/50">
                    {spg.imageUrl ? (
                        <Image
                            src={spg.imageUrl}
                            alt={spg.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            quality={90}
                            priority
                            loading="eager"
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx0fHRsdHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR3/2wBDAR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR3/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                        />
                    ) : (
                        <Skeleton className="w-full h-full" />
                    )}

                    {/* 가격과 NFT 수량 배지 */}
                    <div className="absolute top-4 right-4 flex gap-2">
                        {showPrice && (
                            <Badge
                                variant="secondary"
                                className="font-medium px-3 py-1.5 bg-background/90 backdrop-blur-sm border border-border/50"
                                style={{
                                    color: spg.foregroundColor || undefined,
                                }}
                            >
                                <CircleDollarSign className="w-4 h-4 mr-1.5 inline" />
                                ${spg.price}
                            </Badge>
                        )}
                        {nftCount !== undefined && (
                            <Badge
                                variant="secondary"
                                className="font-medium px-3 py-1.5 bg-background/90 backdrop-blur-sm border border-border/50"
                                style={{
                                    color: spg.foregroundColor || undefined,
                                }}
                            >
                                <Users className="w-4 h-4 mr-1.5 inline" />
                                {nftCount > 1
                                    ? `Owned ${nftCount} NFTs`
                                    : "Owned 1 NFT"}
                            </Badge>
                        )}
                        {isVerified && (
                            <Badge
                                variant="default"
                                className="font-medium px-3 py-1.5 bg-primary/90 text-primary-foreground"
                            >
                                <CheckCircle2 className="w-4 h-4 mr-1.5 inline" />
                                Verified
                            </Badge>
                        )}
                    </div>
                </div>

                <CardHeader className="space-y-1.5 p-4">
                    <CardTitle
                        className="text-xl font-semibold line-clamp-1 transition-colors"
                        style={{
                            color: spg.foregroundColor || undefined,
                        }}
                    >
                        {spg.name}
                    </CardTitle>
                </CardHeader>

                {(showCirculation || showSharePercentage) && (
                    <CardFooter className="flex items-center justify-between p-4 pt-0">
                        {showCirculation && (
                            <div className="flex items-center gap-2 text-sm">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span
                                    className="font-medium"
                                    style={{
                                        color: spg.foregroundColor
                                            ? `${spg.foregroundColor}99`
                                            : undefined,
                                    }}
                                >
                                    {spg.circulation}
                                </span>
                            </div>
                        )}
                        {sharePercentage && showSharePercentage && (
                            <Badge
                                variant="outline"
                                className="font-medium border-primary/20"
                                style={{
                                    color: spg.foregroundColor || undefined,
                                    borderColor: spg.foregroundColor
                                        ? `${spg.foregroundColor}40`
                                        : undefined,
                                }}
                            >
                                {sharePercentage} Share
                            </Badge>
                        )}
                    </CardFooter>
                )}
            </Card>
        </Link>
    );
}
