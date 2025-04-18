/// components\molecules\NFTs.CollectionCard.tsx

"use client";

import { CollectionContract } from "@prisma/client";
import { useMetadata } from "@/app/hooks/useMetadata";
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
import { CircleDollarSign, Users } from "lucide-react";
import { METADATA_TYPE } from "@/app/actions/metadata";

interface CollectionCardProps {
    collection: CollectionContract;
}

export default function CollectionCard({ collection }: CollectionCardProps) {
    const { metadataByCollectionAddress } = useMetadata({
        collectionAddress: collection.address,
    });

    const metadata = metadataByCollectionAddress?.metadata as METADATA_TYPE;
    const sharePercentage = metadata?.attributes?.find(
        (attr) => attr.trait_type === "Share Percentage"
    )?.value;

    return (
        <Link href={`/collections/${collection.address}`}>
            <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 bg-card/50 hover:bg-card">
                {/* 이미지 섹션 */}
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {metadata?.image ? (
                        <Image
                            src={metadata.image}
                            alt={collection.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            quality={95}
                            priority
                            loading="eager"
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx0fHRsdHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR3/2wBDAR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR3/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                        />
                    ) : (
                        <Skeleton className="w-full h-full" />
                    )}

                    {/* 가격 배지 */}
                    <div className="absolute top-4 right-4 flex gap-2">
                        <Badge
                            variant="secondary"
                            className="font-bold px-3 py-1.5"
                        >
                            <CircleDollarSign className="w-4 h-4 mr-1 inline" />
                            ${collection.price}
                        </Badge>
                    </div>
                </div>

                <CardHeader className="space-y-1 p-4">
                    <CardTitle className="text-xl font-bold line-clamp-1">
                        {collection.name}
                    </CardTitle>
                    {metadata?.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {metadata.description}
                        </p>
                    )}
                </CardHeader>

                <CardFooter className="flex items-center justify-between p-4 pt-0">
                    <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                            {collection.circulation}
                        </span>
                    </div>
                    {sharePercentage && (
                        <Badge variant="outline" className="font-medium">
                            {sharePercentage} Share
                        </Badge>
                    )}
                </CardFooter>
            </Card>
        </Link>
    );
}
