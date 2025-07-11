/// app\actions\nfts.ts

"use server";

import { ethers } from "ethers";

import { prisma } from "@/lib/prisma/client";

import type {
    NFTFilters,
    NFTPaginationParams,
} from "@/components/admin/onchain/OnChain.types";
import type { NFT } from "@prisma/client";

export async function fetchNFTs(
    filters: NFTFilters,
    pagination: NFTPaginationParams
) {
    try {
        // 기본 where 조건 설정
        const where = {
            ...(filters.collectionId && { collectionId: filters.collectionId }),
            ...(filters.ownerAddress && { ownerAddress: filters.ownerAddress }),
            ...(filters.isListed !== undefined && {
                isListed: filters.isListed,
            }),
            ...(filters.isBurned !== undefined && {
                isBurned: filters.isBurned,
            }),
            ...(filters.isStaked !== undefined && {
                isStaked: filters.isStaked,
            }),
            ...(filters.networkId && { networkId: filters.networkId }),
            ...(filters.searchTerm && {
                OR: [
                    { name: { contains: filters.searchTerm } },
                    { description: { contains: filters.searchTerm } },
                ],
            }),
        };

        // 페이지네이션 및 정렬 설정
        const [total, items] = await Promise.all([
            // 전체 개수 조회
            prisma.nFT.count({ where }),
            // 실제 데이터 조회
            prisma.nFT.findMany({
                where,
                include: {
                    collection: true,
                    network: true,
                    events: {
                        orderBy: [{ id: "desc" }],
                        take: 5,
                    },
                },
                orderBy: {
                    [pagination.sortBy]: pagination.sortDirection,
                },
                skip: (pagination.page - 1) * pagination.limit,
                take: pagination.limit,
            }),
        ]);

        return {
            items,
            total,
            pageCount: Math.ceil(total / pagination.limit),
        };
    } catch (error) {
        console.error("Error fetching NFTs:", error);
        throw new Error("Failed to fetch NFTs");
    }
}

export async function fetchNFTDetails(nftId: string) {
    try {
        const nft = await prisma.nFT.findUnique({
            where: { id: nftId },
            include: {
                collection: true,
                network: true,
                events: {
                    orderBy: { id: "desc" },
                },
            },
        });

        if (!nft) {
            throw new Error("NFT not found");
        }

        return nft;
    } catch (error) {
        console.error("Error fetching NFT details:", error);
        throw new Error("Failed to fetch NFT details");
    }
}

// NFT 이벤트 타입 정의를 모델에 맞게 수정
type NFTEventType = "TRANSFER" | "APPROVAL" | "LISTING" | "SALE";

// 이벤트 생성 함수 수정
async function createNFTEvent(params: {
    nftId: string;
    collectionId: string;
    eventType: NFTEventType;
    fromAddress?: string;
    toAddress?: string;
    price?: string;
    transactionHash: string;
    blockNumber?: number;
}) {
    return prisma.nFTEvent.create({
        data: {
            ...params,
        },
    });
}

// updateNFTStatus 수정
export async function updateNFTStatus(params: {
    nftId: string;
    isListed?: boolean;
    isBurned?: boolean;
    listingPrice?: string;
}) {
    try {
        const { nftId, ...updateData } = params;

        const updatedNFT = await prisma.nFT.update({
            where: { id: nftId },
            data: {
                ...updateData,
                updatedAt: new Date(),
            },
            include: {
                collection: true,
                network: true,
            },
        });

        // 이벤트 생성 수정
        await createNFTEvent({
            nftId,
            collectionId: updatedNFT.collectionId,
            eventType: "LISTING",
            price: updateData.listingPrice,
            transactionHash: "0x0", // 실제 트랜잭션 해시로 교체 필요
        });

        return updatedNFT;
    } catch (error) {
        console.error("Error updating NFT status:", error);
        throw new Error("Failed to update NFT status");
    }
}

// transferNFTOwnership 수정
export async function transferNFTOwnership(params: {
    nftId: string;
    newOwnerAddress: string;
    transactionHash: string;
}) {
    try {
        const { nftId, newOwnerAddress, transactionHash } = params;

        const updatedNFT = await prisma.nFT.update({
            where: { id: nftId },
            data: {
                ownerAddress: newOwnerAddress,
                lastTransferredAt: new Date(),
                transferCount: { increment: 1 },
            },
            include: {
                collection: true,
                network: true,
            },
        });

        // 이벤트 생성 수정
        await createNFTEvent({
            nftId,
            collectionId: updatedNFT.collectionId,
            eventType: "TRANSFER",
            fromAddress: updatedNFT.ownerAddress,
            toAddress: newOwnerAddress,
            transactionHash,
        });

        return updatedNFT;
    } catch (error) {
        console.error("Error transferring NFT ownership:", error);
        throw new Error("Failed to transfer NFT ownership");
    }
}

export interface NFTsByWalletsParams {
    walletAddresses: string[];
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
}

export async function getNFTsByWallets({
    walletAddresses,
    page = 1,
    limit = 100,
    sortBy = "mintedAt",
    sortDirection = "desc",
}: NFTsByWalletsParams) {
    try {
        const skip = (page - 1) * limit;

        const [nfts, total] = await Promise.all([
            prisma.nFT.findMany({
                where: {
                    ownerAddress: {
                        in: walletAddresses,
                    },
                },
                include: {
                    collection: true,
                },
                orderBy: {
                    [sortBy]: sortDirection,
                },
                skip,
                take: limit,
            }),
            prisma.nFT.count({
                where: {
                    ownerAddress: {
                        in: walletAddresses,
                    },
                },
            }),
        ]);

        return {
            items: nfts,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    } catch (error) {
        console.error("Error fetching NFTs by wallets:", error);
        throw new Error("Failed to fetch NFTs");
    }
}

export async function getOwnerByTokenIds({
    contractAddress,
    tokenIds,
    networkId,
}: {
    contractAddress: string;
    tokenIds: string[];
    networkId: string;
}): Promise<{ tokenId: string; ownerAddress: string }[]> {
    try {
        // 1. 네트워크 정보 조회
        const network = await prisma.blockchainNetwork.findUnique({
            where: { id: networkId },
            select: {
                rpcUrl: true,
                multicallAddress: true,
            },
        });

        if (!network?.multicallAddress) {
            throw new Error("Multicall address not configured for network");
        }

        // 2. Provider 설정
        const provider = new ethers.JsonRpcProvider(network.rpcUrl);

        // 3. Multicall 인터페이스 설정
        const multicallInterface = new ethers.Interface([
            "function aggregate(tuple(address target, bytes callData)[] calls) view returns (uint256 blockNumber, bytes[] returnData)",
        ]);

        // 4. NFT 컨트랙트 인터페이스
        const nftInterface = new ethers.Interface([
            "function ownerOf(uint256) view returns (address)",
        ]);

        // 5. 각 tokenId에 대한 호출 데이터 생성
        const calls = tokenIds.map((tokenId) => ({
            target: contractAddress,
            callData: nftInterface.encodeFunctionData("ownerOf", [tokenId]),
        }));

        // 6. Multicall 컨트랙트 호출
        const multicallContract = new ethers.Contract(
            network.multicallAddress,
            multicallInterface,
            provider
        );

        const [, returnData] = await multicallContract.aggregate(calls);

        const result = tokenIds.map((tokenId, index) => ({
            tokenId,
            ownerAddress: nftInterface.decodeFunctionResult(
                "ownerOf",
                returnData[index]
            )[0],
        }));

        return result;
    } catch (error) {
        console.error("Error fetching owner by token IDs:", error);
        throw new Error("Failed to fetch owner by token IDs");
    }
}

export async function verifyOwnership({
    contractAddress,
    tokenIds,
    ownerAddress,
    networkId,
}: {
    contractAddress: string;
    tokenIds: string[];
    ownerAddress: string;
    networkId: string;
}): Promise<{ tokenId: string; isOwner: boolean }[]> {
    try {
        const ownerAddresses = await getOwnerByTokenIds({
            contractAddress,
            tokenIds,
            networkId,
        });

        return tokenIds.map((tokenId) => ({
            tokenId,
            isOwner: ownerAddresses.some(
                (address) =>
                    address.tokenId === tokenId &&
                    address.ownerAddress === ownerAddress
            ),
        }));
    } catch (error) {
        console.error("Error verifying ownership:", error);
        throw new Error("Failed to verify ownership");
    }
}

export interface UserVerifiedNFTsByCollectionAddressInput {
    collectionAddress: string;
    userId: string;
}

export async function getUserVerifiedNFTsByCollectionAddress(
    input?: UserVerifiedNFTsByCollectionAddressInput
): Promise<NFT[]> {
    if (!input) {
        return [];
    }

    const [wallets, collection] = await Promise.all([
        prisma.wallet.findMany({
            where: {
                userId: input.userId,
            },
            select: {
                address: true,
            },
        }),
        prisma.collectionContract.findUnique({
            where: {
                address: input.collectionAddress,
            },
        }),
    ]);

    if (!collection) {
        return [];
    }

    const nfts = await prisma.nFT.findMany({
        where: {
            collection: { address: input.collectionAddress },
            currentOwnerAddress: {
                in: wallets.map((wallet) => wallet.address),
            },
        },
        select: {
            id: true,
            tokenId: true,
            currentOwnerAddress: true,
        },
    });

    const ownerAddresses = await getOwnerByTokenIds({
        contractAddress: input.collectionAddress,
        tokenIds: nfts.map((nft) => nft.tokenId.toString()),
        networkId: collection?.networkId,
    });

    const ownerAddressMap = new Map(
        ownerAddresses.map(({ tokenId, ownerAddress }) => [
            tokenId,
            ownerAddress,
        ])
    );

    const needsUpdate = nfts.filter((nft) => {
        const currentOwner = ownerAddressMap.get(nft.tokenId.toString());
        return currentOwner && currentOwner !== nft.currentOwnerAddress;
    });

    if (needsUpdate.length > 0) {
        await Promise.all(
            needsUpdate.map((nft) =>
                prisma.nFT.update({
                    where: { id: nft.id },
                    data: {
                        currentOwnerAddress: ownerAddressMap.get(
                            nft.tokenId.toString()
                        ),
                    },
                })
            )
        );
    }

    const verifiedNFTIds = nfts
        .filter((nft) => {
            const currentOwner = ownerAddressMap.get(nft.tokenId.toString());
            return wallets.some((wallet) => wallet.address === currentOwner);
        })
        .map((nft) => nft.id);

    const verifiedNFTs = await prisma.nFT.findMany({
        where: {
            id: { in: verifiedNFTIds },
        },
    });

    return verifiedNFTs;
}
