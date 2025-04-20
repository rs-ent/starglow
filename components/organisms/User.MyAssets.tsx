/// components\organisms\User.MyAssets.tsx

"use client";

import { useState, useEffect } from "react";
import { useNFTManager } from "@/app/hooks/useNFTs";
import { User, Wallet, NFT, CollectionContract } from "@prisma/client";
import { H3 } from "@/components/atoms/Typography";
import { Wallet as WalletIcon } from "lucide-react";
import Icon from "@/components/atoms/Icon";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useWalletsByUserId } from "@/app/hooks/useWallet";
import CollectionCard from "../molecules/NFTs.CollectionCard";
import { Skeleton } from "@/components/ui/skeleton";

interface UserMyAssetsProps {
    user: User;
}

export default function UserMyAssets({ user }: UserMyAssetsProps) {
    const { useNFTs } = useNFTManager();
    const { wallets, isLoading: isLoadingWallets } = useWalletsByUserId(
        user.id
    );
    const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);

    // NFT 쿼리 설정
    const {
        data: nftData,
        isLoading: isLoadingNFTs,
        error: nftError,
    } = useNFTs(
        { ownerAddress: selectedWallet?.address || "" },
        {
            page: 1,
            limit: 100,
            sortBy: "mintedAt",
            sortDirection: "desc",
        }
    );

    // 초기 지갑 선택
    useEffect(() => {
        if (wallets && wallets.length > 0) {
            setSelectedWallet(wallets[0]);
        }
    }, [wallets]);

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
            {/* 지갑 선택 섹션 */}
            <div className="flex items-center mb-4">
                <div className="p-2 bg-primary/10 rounded-lg mr-3">
                    <Icon icon={WalletIcon} className="w-5 h-5 text-primary" />
                </div>
                <H3 size={20}>Wallets</H3>
            </div>

            {isLoadingWallets ? (
                <div className="h-10 bg-secondary/20 animate-pulse rounded-lg" />
            ) : wallets && wallets.length > 0 ? (
                <div className="space-y-2">
                    <Select
                        value={selectedWallet?.address}
                        onValueChange={(value) => {
                            const wallet = wallets.find(
                                (w) => w.address === value
                            );
                            setSelectedWallet(wallet || null);
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select wallet to receive NFT" />
                        </SelectTrigger>
                        <SelectContent>
                            {wallets.map((wallet) => (
                                <SelectItem
                                    key={wallet.id}
                                    value={wallet.address}
                                >
                                    <div className="flex items-center gap-2">
                                        <WalletIcon className="h-4 w-4" />
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {wallet.nickname || "Wallet"}
                                                {wallet.default && (
                                                    <span className="ml-2 text-xs text-primary">
                                                        (Default)
                                                    </span>
                                                )}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {`${wallet.address.slice(
                                                    0,
                                                    6
                                                )}...${wallet.address.slice(
                                                    -4
                                                )}`}
                                            </span>
                                        </div>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {selectedWallet && (
                        <p className="text-xs text-muted-foreground">
                            Selected wallet:{" "}
                            {selectedWallet.address.slice(0, 6)}...
                            {selectedWallet.address.slice(-4)}
                        </p>
                    )}
                </div>
            ) : (
                <div className="text-sm text-destructive bg-destructive/10 p-4 rounded-lg">
                    No wallets available. Please add a wallet first.
                </div>
            )}

            {/* NFT 컬렉션 표시 섹션 */}
            <div className="mt-6">
                <H3 size={20} className="mb-4">
                    NFT
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
                        No NFTs found in this wallet.
                    </div>
                )}
            </div>
        </div>
    );
}
