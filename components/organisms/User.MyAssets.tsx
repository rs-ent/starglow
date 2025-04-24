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
import { verifyOwnership } from "@/app/actions/nfts"; // server action 직접 import

interface UserMyAssetsProps {
    user: User;
}

interface NFTWithCollection extends NFT {
    collection: CollectionContract;
}

interface GroupedNFTs {
    contractAddress: string;
    networkId: string;
    nfts: {
        nft: NFTWithCollection;
        ownerAddress: string;
    }[];
}

interface VerifiedCollection {
    collection: CollectionContract;
    nfts: NFTWithCollection[];
}

export default function UserMyAssets({ user }: UserMyAssetsProps) {
    const [verifiedCollections, setVerifiedCollections] = useState<
        Record<string, VerifiedCollection>
    >({});
    const [isVerifying, setIsVerifying] = useState(false);

    const { wallets, isLoading: isLoadingWallets } = useWalletsByUserId(
        user.id
    );

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

    useEffect(() => {
        async function verifyNFTs() {
            if (!nftData?.items.length) return;

            setIsVerifying(true);
            try {
                // NFT를 컨트랙트와 네트워크로 그룹화
                const groupedNFTs = nftData.items.reduce(
                    (groups: GroupedNFTs[], nft) => {
                        const key = `${nft.collection.address}-${nft.networkId}`;
                        const existingGroup = groups.find(
                            (g) =>
                                g.contractAddress === nft.collection.address &&
                                g.networkId === nft.networkId
                        );

                        if (existingGroup) {
                            existingGroup.nfts.push({
                                nft: nft as NFTWithCollection,
                                ownerAddress: nft.ownerAddress,
                            });
                        } else {
                            groups.push({
                                contractAddress: nft.collection.address,
                                networkId: nft.networkId,
                                nfts: [
                                    {
                                        nft: nft as NFTWithCollection,
                                        ownerAddress: nft.ownerAddress,
                                    },
                                ],
                            });
                        }
                        return groups;
                    },
                    []
                );

                // 각 그룹별로 소유권 검증
                const verifiedResults = await Promise.all(
                    groupedNFTs.map(async (group) => {
                        const ownershipResult = await verifyOwnership({
                            contractAddress: group.contractAddress,
                            tokenIds: group.nfts.map(({ nft }) =>
                                nft.tokenId.toString()
                            ),
                            ownerAddress: group.nfts[0].ownerAddress,
                            networkId: group.networkId,
                        });

                        const verifiedNFTs = group.nfts.filter(
                            (nftData, index) => ownershipResult[index]?.isOwner
                        );

                        if (verifiedNFTs.length > 0) {
                            return {
                                collectionAddress: group.contractAddress,
                                collection: verifiedNFTs[0].nft.collection,
                                nfts: verifiedNFTs.map((v) => v.nft),
                            };
                        }
                        return null;
                    })
                );

                // 검증 결과를 컬렉션별로 정리
                const collections = verifiedResults.reduce((acc, result) => {
                    if (result) {
                        acc[result.collectionAddress] = {
                            collection: result.collection,
                            nfts: result.nfts,
                        };
                    }
                    return acc;
                }, {} as Record<string, VerifiedCollection>);

                setVerifiedCollections(collections);
            } catch (error) {
                console.error("Error verifying NFTs:", error);
            } finally {
                setIsVerifying(false);
            }
        }

        verifyNFTs();
    }, [nftData?.items]);

    const isLoading = isLoadingNFTs || isVerifying;

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
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-[300px] w-full" />
                        ))}
                    </div>
                ) : nftError ? (
                    <div className="text-sm text-destructive bg-destructive/10 p-4 rounded-lg">
                        Error loading NFTs: {nftError.message}
                    </div>
                ) : Object.keys(verifiedCollections).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(verifiedCollections).map(
                            ([address, { collection, nfts }]) => (
                                <CollectionCard
                                    key={address}
                                    collection={collection}
                                    nftCount={nfts.length}
                                    showPrice={false}
                                    showSharePercentage={false}
                                    showCirculation={false}
                                    isVerified={true}
                                />
                            )
                        )}
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground bg-secondary/10 p-4 rounded-lg">
                        No verified NFTs found in your wallets.
                    </div>
                )}
            </div>
        </div>
    );
}
