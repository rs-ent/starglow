/// components\organisms\User.MyAssets.tsx

"use client";

import { useState, useEffect } from "react";
import { useNFTsByWallets } from "@/app/hooks/useNFTs";
import { User, Wallet, NFT, CollectionContract } from "@prisma/client";
import { H3 } from "@/components/atoms/Typography";
import { Wallet as WalletIcon } from "lucide-react";
import Icon from "@/components/atoms/Icon";
import { useWalletsByUserId } from "@/app/hooks/useWallet";
import CollectionCard from "../molecules/NFTs.CollectionCard";
import { Skeleton } from "@/components/ui/skeleton";

interface UserMyAssetsProps {
    user: User;
}

export default function UserMyAssets({ user }: UserMyAssetsProps) {
    const { wallets, isLoading: isLoadingWallets } = useWalletsByUserId(
        user.id
    );

    // NFT 쿼리 설정 - 모든 지갑의 NFT를 한번에 가져옴
    const {
        data: nftData,
        isLoading: isLoadingNFTs,
        error: nftError,
    } = useNFTsByWallets({
        walletAddresses: wallets?.map((w) => w.address) || [],
        page: 1,
        limit: 100,
        sortBy: "mintedAt",
        sortDirection: "desc",
    });

    // NFT를 컬렉션별로 그룹화
    const groupedNFTs =
        nftData?.items.reduce((acc, nft) => {
            const collectionAddress = nft.collection.address;
            if (!acc[collectionAddress]) {
                acc[collectionAddress] = {
                    collection: nft.collection,
                    nfts: [],
                };
            }
            acc[collectionAddress].nfts.push(nft);
            return acc;
        }, {} as Record<string, { collection: CollectionContract; nfts: NFT[] }>) ||
        {};

    return (
        <div className="bg-card/10 backdrop-blur-md p-6 rounded-2xl border border-border/5">
            {/* 지갑 목록 섹션 */}
            <div className="flex items-center mb-4">
                <div className="p-2 bg-primary/10 rounded-lg mr-3">
                    <Icon icon={WalletIcon} className="w-5 h-5 text-primary" />
                </div>
                <H3 size={20}>Connected Wallets</H3>
            </div>

            {/* NFT 컬렉션 표시 섹션 */}
            <div className="mt-6">
                <H3 size={20} className="mb-4">
                    NFT Collections
                </H3>
                {isLoadingNFTs ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-[300px] w-full" />
                        ))}
                    </div>
                ) : nftError ? (
                    <div className="text-sm text-destructive bg-destructive/10 p-4 rounded-lg">
                        Error loading NFTs: {nftError.message}
                    </div>
                ) : Object.keys(groupedNFTs).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(groupedNFTs).map(
                            ([address, { collection, nfts }]) => (
                                <CollectionCard
                                    key={address}
                                    collection={collection}
                                    nftCount={nfts.length}
                                    showPrice={false}
                                    showSharePercentage={false}
                                    showCirculation={false}
                                />
                            )
                        )}
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground bg-secondary/10 p-4 rounded-lg">
                        No NFTs found in your wallets.
                    </div>
                )}
            </div>
        </div>
    );
}
