/// components/user/User.Contents.MyAssets.NFT.List.tsx

"use client";

import { useState } from "react";
import { useFactoryGet } from "@/app/hooks/useFactoryContracts";
import PartialLoading from "@/components/atoms/PartialLoading";
import { cn } from "@/lib/utils/tailwind";
import UserContentsMyAssetsNFTCard from "./User.Contents.MyAssets.NFT.Card";
import { CollectionContract } from "@prisma/client";
import { METADATA_TYPE } from "@/app/actions/metadata";
import UserNFTDetail from "./User.NFT.Detail";
import { User } from "next-auth";
import { Player } from "@prisma/client";
interface UserMyAssetsNFTListProps {
    user: User | null;
    player: Player | null;
}

export default function UserMyAssetsNFTList({
    user,
    player,
}: UserMyAssetsNFTListProps) {
    const { everyCollections, isLoading, error } = useFactoryGet({});

    const [selectedCollection, setSelectedCollection] = useState<{
        collection: CollectionContract;
        metadata: METADATA_TYPE;
    } | null>(null);

    const [openDetail, setOpenDetail] = useState<boolean>(false);

    const handleSelect = (
        collection: CollectionContract,
        metadata: METADATA_TYPE
    ) => {
        setSelectedCollection({ collection, metadata });
        setOpenDetail(true);
    };

    const handleClose = () => {
        setSelectedCollection(null);
        setOpenDetail(false);
    };

    return (
        <>
            {selectedCollection && openDetail && (
                <UserNFTDetail
                    collection={selectedCollection.collection}
                    metadata={selectedCollection.metadata}
                    onClose={handleClose}
                    user={user}
                    player={player}
                />
            )}
            <div className="w-full">
                {isLoading ? (
                    <PartialLoading text="Loading..." />
                ) : error ? (
                    <PartialLoading text="Error loading collections" />
                ) : everyCollections ? (
                    <div
                        className={cn(
                            "grid grid-cols-2 md:grid-cols-3",
                            "gap-[1px] sm:gap-[5px] md:gap-[5px] lg:gap-[10px]",
                            "p-[6px] sm:p-[8px] md:p-[10px] lg:p-[12px]"
                        )}
                    >
                        {everyCollections.map((collection) => (
                            <div
                                key={collection.id}
                                className={cn(
                                    "w-full",
                                    "p-[4px] sm:p-[8px] md:p-[3px] lg:p-[6px]"
                                )}
                            >
                                <UserContentsMyAssetsNFTCard
                                    collectionContract={collection}
                                    onSelect={handleSelect}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div>
                        <p>
                            No collections found. Please try again later. If the
                            problem persists, please contact support.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
