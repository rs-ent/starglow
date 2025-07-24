/// app/actions/raffles/onchain/actions-read-v2.ts

"use server";

import type { Address } from "viem";
import { getContract } from "viem";

import { prisma } from "@/lib/prisma/client";
import { fetchPublicClient } from "@/app/story/client";
import { safeBigIntToNumber } from "@/lib/utils/format";
import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";

import rafflesJson from "@/web3/artifacts/contracts/Raffles_v2.sol/RafflesV2.json";
import type { Prisma } from "@prisma/client";
import { getDefaultUserWalletAddress } from "@/app/story/userWallet/actions";

const abi = rafflesJson.abi;

export interface RaffleListCardInfo {
    title: string;
    imageUrl: string;
    iconUrl: string;
    startDate: number;
    endDate: number;
    drawDate: number;
    instantDraw: boolean;
    participationLimit: number;
    uniqueParticipants: number;
    totalParticipations: number;
    participationFeeAmount: string;
    participationFeeAssetId: string;
    isActive: boolean;
    isDrawn: boolean;
    readyToActive: boolean;
    totalTickets: number;
    remainingTickets: number;
    raffleId: string;
}

export interface GetRaffleListCardInfoInput {
    contractAddress: string;
    raffleId: string;
}

export interface GetRaffleListCardInfoResult {
    success: boolean;
    data?: RaffleListCardInfo;
    error?: string;
}

/**
 * V2 개별 래플 카드 정보 조회
 */
export async function getRaffleListCardInfoV2(
    input: GetRaffleListCardInfoInput
): Promise<GetRaffleListCardInfoResult> {
    try {
        const contract = await prisma.onchainRaffleContract.findUnique({
            cacheStrategy: getCacheStrategy("oneHour"),
            where: { address: input.contractAddress },
            select: {
                network: {
                    select: {
                        id: true,
                        name: true,
                        chainId: true,
                        symbol: true,
                        rpcUrl: true,
                        explorerUrl: true,
                        multicallAddress: true,
                    },
                },
            },
        });

        if (!contract) {
            return {
                success: false,
                error: "Contract not found",
            };
        }

        // Public Client 생성
        const publicClient = await fetchPublicClient({
            network: contract.network,
        });

        // 컨트랙트 인스턴스 생성
        const raffleContract = getContract({
            address: input.contractAddress as `0x${string}`,
            abi,
            client: publicClient,
        });

        // 래플 카드 정보 조회
        const cardInfo = await (
            raffleContract.read as any
        ).getRaffleListCardInfo([BigInt(input.raffleId)]);

        return {
            success: true,
            data: {
                title: cardInfo.title,
                imageUrl: cardInfo.imageUrl,
                iconUrl: cardInfo.iconUrl,
                startDate: safeBigIntToNumber(cardInfo.startDate),
                endDate: safeBigIntToNumber(cardInfo.endDate),
                drawDate: safeBigIntToNumber(cardInfo.drawDate),
                instantDraw: cardInfo.instantDraw,
                participationLimit: safeBigIntToNumber(
                    cardInfo.participationLimit
                ),
                uniqueParticipants: safeBigIntToNumber(
                    cardInfo.uniqueParticipants
                ),
                totalParticipations: safeBigIntToNumber(
                    cardInfo.totalParticipations
                ),
                participationFeeAmount:
                    cardInfo.participationFeeAmount.toString(),
                participationFeeAssetId: cardInfo.participationFeeAssetId,
                isActive: cardInfo.isActive,
                isDrawn: cardInfo.isDrawn,
                readyToActive: cardInfo.readyToActive,
                totalTickets: safeBigIntToNumber(cardInfo.totalTickets),
                remainingTickets: safeBigIntToNumber(cardInfo.remainingTickets),
                raffleId: input.raffleId,
            },
        };
    } catch (error) {
        console.error("Error getting raffle list card info V2:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to get raffle list card info V2",
        };
    }
}

export interface GetRaffleListCardInfoBatchInput {
    contractAddress: string;
}

export interface GetRaffleListCardInfoBatchResult {
    success: boolean;
    data?: RaffleListCardInfo[];
    error?: string;
}

/**
 * V2 배치 래플 카드 정보 조회 (최대 50개)
 */
export async function getRaffleListCardInfoBatchV2(
    input: GetRaffleListCardInfoBatchInput
): Promise<GetRaffleListCardInfoBatchResult> {
    try {
        const contract = await prisma.onchainRaffleContract.findUnique({
            cacheStrategy: getCacheStrategy("oneHour"),
            where: { address: input.contractAddress },
            select: {
                network: {
                    select: {
                        id: true,
                        name: true,
                        chainId: true,
                        symbol: true,
                        rpcUrl: true,
                        explorerUrl: true,
                        multicallAddress: true,
                    },
                },
                raffles: {
                    where: {
                        isActive: true,
                    },
                    select: {
                        id: true,
                    },
                },
            },
        });

        if (!contract) {
            return {
                success: false,
                error: "Contract not found",
            };
        }

        if (contract.raffles.length === 0) {
            return {
                success: true,
                data: [],
            };
        }

        if (contract.raffles.length > 50) {
            return {
                success: false,
                error: "Cannot query more than 50 raffles at once",
            };
        }

        // Public Client 생성
        const publicClient = await fetchPublicClient({
            network: contract.network,
        });

        // 컨트랙트 인스턴스 생성
        const raffleContract = getContract({
            address: input.contractAddress as `0x${string}`,
            abi,
            client: publicClient,
        });

        // 배치 래플 카드 정보 조회
        const cardInfos = await (
            raffleContract.read as any
        ).getRaffleListCardInfoBatch([
            contract.raffles.map((raffle) => BigInt(raffle.id)),
        ]);

        const results: RaffleListCardInfo[] = cardInfos.map(
            (cardInfo: any) => ({
                title: cardInfo.title,
                imageUrl: cardInfo.imageUrl,
                iconUrl: cardInfo.iconUrl,
                startDate: safeBigIntToNumber(cardInfo.startDate),
                endDate: safeBigIntToNumber(cardInfo.endDate),
                drawDate: safeBigIntToNumber(cardInfo.drawDate),
                instantDraw: cardInfo.instantDraw,
                participationLimit: safeBigIntToNumber(
                    cardInfo.participationLimit
                ),
                uniqueParticipants: safeBigIntToNumber(
                    cardInfo.uniqueParticipants
                ),
                totalParticipations: safeBigIntToNumber(
                    cardInfo.totalParticipations
                ),
                participationFeeAmount:
                    cardInfo.participationFeeAmount.toString(),
                participationFeeAssetId: cardInfo.participationFeeAssetId,
                isActive: cardInfo.isActive,
                isDrawn: cardInfo.isDrawn,
                readyToActive: cardInfo.readyToActive,
                totalTickets: safeBigIntToNumber(cardInfo.totalTickets),
                remainingTickets: safeBigIntToNumber(cardInfo.remainingTickets),
                raffleId: safeBigIntToNumber(cardInfo.raffleId).toString(),
            })
        );

        return {
            success: true,
            data: results,
        };
    } catch (error) {
        console.error("Error getting raffle list card info batch V2:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to get raffle list card info batch V2",
        };
    }
}

export interface GetActiveRafflesInput {
    contractAddress: string;
}

export interface GetActiveRafflesResult {
    success: boolean;
    data?: RaffleListCardInfo[];
    error?: string;
}

/**
 * V2 활성화된 래플들 조회
 */
export async function getActiveRafflesV2(
    input: GetActiveRafflesInput
): Promise<GetActiveRafflesResult> {
    try {
        const contract = await prisma.onchainRaffleContract.findUnique({
            cacheStrategy: getCacheStrategy("tenSeconds"),
            where: { address: input.contractAddress },
            select: {
                network: {
                    select: {
                        id: true,
                        name: true,
                        chainId: true,
                        symbol: true,
                        rpcUrl: true,
                        explorerUrl: true,
                        multicallAddress: true,
                    },
                },
            },
        });

        if (!contract) {
            return {
                success: false,
                error: "Contract not found",
            };
        }

        // Public Client 생성
        const publicClient = await fetchPublicClient({
            network: contract.network,
        });

        // 컨트랙트 인스턴스 생성
        const raffleContract = getContract({
            address: input.contractAddress as `0x${string}`,
            abi,
            client: publicClient,
        });

        // 활성화된 래플들 조회
        const cardInfos = await (
            raffleContract.read as any
        ).getActiveRaffleListCardInfos();

        const results: RaffleListCardInfo[] = cardInfos.map(
            (cardInfo: any) => ({
                title: cardInfo.title,
                imageUrl: cardInfo.imageUrl,
                iconUrl: cardInfo.iconUrl,
                startDate: safeBigIntToNumber(cardInfo.startDate),
                endDate: safeBigIntToNumber(cardInfo.endDate),
                drawDate: safeBigIntToNumber(cardInfo.drawDate),
                instantDraw: cardInfo.instantDraw,
                participationLimit: safeBigIntToNumber(
                    cardInfo.participationLimit
                ),
                uniqueParticipants: safeBigIntToNumber(
                    cardInfo.uniqueParticipants
                ),
                totalParticipations: safeBigIntToNumber(
                    cardInfo.totalParticipations
                ),
                participationFeeAmount:
                    cardInfo.participationFeeAmount.toString(),
                participationFeeAssetId: cardInfo.participationFeeAssetId,
                isActive: cardInfo.isActive,
                isDrawn: cardInfo.isDrawn,
                readyToActive: cardInfo.readyToActive,
                totalTickets: safeBigIntToNumber(cardInfo.totalTickets),
                remainingTickets: safeBigIntToNumber(cardInfo.remainingTickets),
                raffleId: safeBigIntToNumber(cardInfo.raffleId).toString(),
            })
        );

        return {
            success: true,
            data: results,
        };
    } catch (error) {
        console.error("Error getting active raffles V2:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to get active raffles V2",
        };
    }
}

export interface GetAllRafflesResult {
    success: boolean;
    data?: {
        contractAddress: string;
        raffleId: string;
        isActive: boolean;
    }[];
    error?: string;
}

/**
 * V2 모든 래플들 조회
 */
export interface GetAllRafflesInput {
    isActive: "ACTIVE" | "INACTIVE" | "ALL";
}

export async function getAllRafflesV2(
    input: GetAllRafflesInput
): Promise<GetAllRafflesResult> {
    try {
        let where: Prisma.OnchainRaffleWhereInput;

        if (input.isActive === "ACTIVE") {
            where = {
                isActive: true,
            };
        } else if (input.isActive === "INACTIVE") {
            where = {
                isActive: false,
            };
        } else {
            where = {};
        }

        const raffles = await prisma.onchainRaffle.findMany({
            where,
            select: {
                contractAddress: true,
                raffleId: true,
                isActive: true,
            },
        });

        return {
            success: true,
            data: raffles,
        };
    } catch (error) {
        console.error("Error getting all raffles V2:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to get all raffles V2",
        };
    }
}

export interface RafflePrize {
    prizeType: number;
    title: string;
    description: string;
    imageUrl: string;
    iconUrl: string;
    quantity: number;
    rarity: number;
    order: number;
    collectionAddress: string;
    assetId: string;
    tokenIds: number[];
    allocated: boolean;
}

export interface FullRaffleInfo {
    basicInfo: {
        title: string;
        description: string;
        imageUrl: string;
        iconUrl: string;
    };
    timing: {
        startDate: number;
        endDate: number;
        instantDraw: boolean;
        drawDate: number;
    };
    settings: {
        maxParticipants: number;
        maxEntriesPerPlayer: number;
        allowMultipleWins: boolean;
        dynamicWeight: boolean;
    };
    fee: {
        participationFeeAsset: string;
        participationFeeAssetId: string;
        participationFeeAmount: string;
    };
    status: {
        isActive: boolean;
        isDrawn: boolean;
        readyToActive: boolean;
        totalTickets: number;
        pickedTickets: number;
        drawnCount: number;
    };
    prizes: RafflePrize[];
    remainingTickets: number;
}

export interface GetFullRaffleInfoInput {
    contractAddress: string;
    raffleId: string;
}

export interface GetFullRaffleInfoResult {
    success: boolean;
    data?: FullRaffleInfo;
    error?: string;
}

/**
 * V2 전체 래플 정보 상세 조회
 */
export async function getFullRaffleInfoV2(
    input: GetFullRaffleInfoInput
): Promise<GetFullRaffleInfoResult> {
    try {
        const contract = await prisma.onchainRaffleContract.findUnique({
            cacheStrategy: getCacheStrategy("oneHour"),
            where: { address: input.contractAddress },
            select: {
                network: {
                    select: {
                        id: true,
                        name: true,
                        chainId: true,
                        symbol: true,
                        rpcUrl: true,
                        explorerUrl: true,
                        multicallAddress: true,
                    },
                },
            },
        });

        if (!contract) {
            return {
                success: false,
                error: "Contract not found",
            };
        }

        const publicClient = await fetchPublicClient({
            network: contract.network,
        });

        const raffleContract = getContract({
            address: input.contractAddress as `0x${string}`,
            abi,
            client: publicClient,
        });

        try {
            const contractCode = await publicClient.getCode({
                address: input.contractAddress as `0x${string}`,
            });

            if (!contractCode || contractCode === "0x") {
                return {
                    success: false,
                    error: `No contract found at address ${input.contractAddress}`,
                };
            }

            try {
                const rawResult = await publicClient.readContract({
                    address: input.contractAddress as `0x${string}`,
                    abi,
                    functionName: "getRaffle",
                    args: [BigInt(input.raffleId)],
                });

                if (Array.isArray(rawResult) && rawResult.length === 2) {
                    const [raffle, remainingTickets] = rawResult;

                    const fullRaffleInfo: FullRaffleInfo = {
                        basicInfo: {
                            title: raffle.basicInfo?.title || "",
                            description: raffle.basicInfo?.description || "",
                            imageUrl: raffle.basicInfo?.imageUrl || "",
                            iconUrl: raffle.basicInfo?.iconUrl || "",
                        },
                        timing: {
                            startDate: safeBigIntToNumber(
                                raffle.timing?.startDate || 0
                            ),
                            endDate: safeBigIntToNumber(
                                raffle.timing?.endDate || 0
                            ),
                            instantDraw: Boolean(raffle.timing?.instantDraw),
                            drawDate: safeBigIntToNumber(
                                raffle.timing?.drawDate || 0
                            ),
                        },
                        settings: {
                            maxParticipants: safeBigIntToNumber(
                                raffle.settings?.maxParticipants || 0
                            ),
                            maxEntriesPerPlayer: safeBigIntToNumber(
                                raffle.settings?.maxEntriesPerPlayer || 1
                            ),
                            allowMultipleWins: Boolean(
                                raffle.settings?.allowMultipleWins
                            ),
                            dynamicWeight: Boolean(
                                raffle.settings?.dynamicWeight
                            ),
                        },
                        fee: {
                            participationFeeAsset:
                                raffle.fee?.participationFeeAsset || "",
                            participationFeeAssetId:
                                raffle.fee?.participationFeeAssetId || "",
                            participationFeeAmount:
                                raffle.fee?.participationFeeAmount?.toString() ||
                                "0",
                        },
                        status: {
                            isActive: Boolean(raffle.status?.isActive),
                            isDrawn: Boolean(raffle.status?.isDrawn),
                            readyToActive: Boolean(
                                raffle.status?.readyToActive
                            ),
                            totalTickets: safeBigIntToNumber(
                                raffle.status?.totalTickets || 0
                            ),
                            pickedTickets: safeBigIntToNumber(
                                raffle.status?.pickedTickets || 0
                            ),
                            drawnCount: safeBigIntToNumber(
                                raffle.status?.drawnCount || 0
                            ),
                        },
                        prizes: Array.isArray(raffle.prizes)
                            ? raffle.prizes.map(
                                  (prize: any, index: number) => ({
                                      prizeType: safeBigIntToNumber(
                                          prize.prizeType || 0
                                      ),
                                      title: prize.title || "",
                                      description: prize.description || "",
                                      imageUrl: prize.imageUrl || "",
                                      iconUrl: prize.iconUrl || "",
                                      quantity: safeBigIntToNumber(
                                          prize.quantity || 0
                                      ),
                                      prizeQuantity: safeBigIntToNumber(
                                          prize.prizeQuantity || 0
                                      ),
                                      rarity: safeBigIntToNumber(
                                          prize.rarity || 0
                                      ),
                                      order: safeBigIntToNumber(
                                          prize.order || index
                                      ),
                                      collectionAddress:
                                          prize.collectionAddress || "",
                                      assetId: prize.assetId || "",
                                      tokenIds: Array.isArray(prize.tokenIds)
                                          ? prize.tokenIds.map((id: any) =>
                                                safeBigIntToNumber(id)
                                            )
                                          : [],
                                      allocated: Boolean(prize.allocated),
                                  })
                              )
                            : [],
                        remainingTickets: safeBigIntToNumber(remainingTickets),
                    };

                    return {
                        success: true,
                        data: fullRaffleInfo,
                    };
                }
            } catch (getRaffleError) {
                console.error(
                    "getRaffle failed, falling back to card info:",
                    getRaffleError
                );
            }

            const cardInfo = await (
                raffleContract.read as any
            ).getRaffleListCardInfo([BigInt(input.raffleId)]);

            if (!cardInfo || !cardInfo.title) {
                return {
                    success: false,
                    error: `Raffle ${input.raffleId} does not exist or has no data`,
                };
            }

            const fullRaffleInfo: FullRaffleInfo = {
                basicInfo: {
                    title: cardInfo.title || "",
                    description: "",
                    imageUrl: cardInfo.imageUrl || "",
                    iconUrl: cardInfo.iconUrl || "",
                },
                timing: {
                    startDate: safeBigIntToNumber(cardInfo.startDate),
                    endDate: safeBigIntToNumber(cardInfo.endDate),
                    instantDraw: Boolean(cardInfo.instantDraw),
                    drawDate: safeBigIntToNumber(cardInfo.drawDate),
                },
                settings: {
                    maxParticipants: safeBigIntToNumber(
                        cardInfo.participationLimit || 0
                    ),
                    maxEntriesPerPlayer: 1,
                    allowMultipleWins: false,
                    dynamicWeight: false,
                },
                fee: {
                    participationFeeAsset:
                        cardInfo.participationFeeAssetId || "",
                    participationFeeAssetId:
                        cardInfo.participationFeeAssetId || "",
                    participationFeeAmount:
                        cardInfo.participationFeeAmount?.toString() || "0",
                },
                status: {
                    isActive: Boolean(cardInfo.isActive),
                    isDrawn: Boolean(cardInfo.isDrawn),
                    readyToActive: Boolean(cardInfo.readyToActive),
                    totalTickets: safeBigIntToNumber(cardInfo.totalTickets),
                    pickedTickets: 0,
                    drawnCount: 0,
                },
                prizes: [],
                remainingTickets: safeBigIntToNumber(cardInfo.remainingTickets),
            };

            return {
                success: true,
                data: fullRaffleInfo,
            };
        } catch (error) {
            console.error("All methods failed:", error);

            return {
                success: false,
                error: `Failed to get raffle ${
                    input.raffleId
                } info. Error details: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
            };
        }
    } catch (error) {
        console.error("Error getting full raffle info V2:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to get full raffle info V2",
        };
    }
}

export interface UserParticipationDetail {
    participantId: string;
    ticketNumber: number;
    participatedAt: number;
    hasLotteryResult: boolean;
    prizeIndex: number;
    claimed: boolean;
    drawnAt: number;
    claimedAt: number;
}

export interface UserParticipationInfo {
    participationCount: number;
    participations: UserParticipationDetail[];
    totalWins: number;
    revealedCount: number;
    unrevealedCount: number;
}

export interface GetUserParticipationInput {
    contractAddress: string;
    raffleId: string;
    playerId: string;
}

export interface GetUserParticipationResult {
    success: boolean;
    data?: UserParticipationInfo;
    error?: string;
}

/**
 * V2 사용자 참여 정보 상세 조회
 */
export async function getUserParticipationV2(
    input: GetUserParticipationInput
): Promise<GetUserParticipationResult> {
    try {
        const contract = await prisma.onchainRaffleContract.findUnique({
            cacheStrategy: getCacheStrategy("oneHour"),
            where: { address: input.contractAddress },
            select: {
                network: {
                    select: {
                        id: true,
                        name: true,
                        chainId: true,
                        symbol: true,
                        rpcUrl: true,
                        explorerUrl: true,
                        multicallAddress: true,
                    },
                },
            },
        });

        if (!contract) {
            return {
                success: false,
                error: "Contract not found",
            };
        }

        const playerAddress = await getDefaultUserWalletAddress({
            playerId: input.playerId,
        });

        if (!playerAddress) {
            return {
                success: false,
                error: "Player not found",
            };
        }

        // Public Client 생성
        const publicClient = await fetchPublicClient({
            network: contract.network,
        });

        // 컨트랙트 인스턴스 생성
        const raffleContract = getContract({
            address: input.contractAddress as `0x${string}`,
            abi,
            client: publicClient,
        });

        // 사용자 참여 정보 조회
        const participationInfo = await (
            raffleContract.read as any
        ).getUserParticipationDetails([
            BigInt(input.raffleId),
            playerAddress as Address,
        ]);

        const userParticipationInfo: UserParticipationInfo = {
            participationCount: safeBigIntToNumber(
                participationInfo.participationCount
            ),
            totalWins: safeBigIntToNumber(participationInfo.totalWins),
            revealedCount: safeBigIntToNumber(participationInfo.revealedCount),
            unrevealedCount: safeBigIntToNumber(
                participationInfo.unrevealedCount
            ),
            participations: participationInfo.participations.map(
                (participation: any) => ({
                    participantId: safeBigIntToNumber(
                        participation.participantId
                    ).toString(),
                    ticketNumber: safeBigIntToNumber(
                        participation.ticketNumber
                    ),
                    participatedAt: safeBigIntToNumber(
                        participation.participatedAt
                    ),
                    hasLotteryResult: participation.hasLotteryResult,
                    prizeIndex: safeBigIntToNumber(participation.prizeIndex),
                    claimed: participation.claimed,
                    drawnAt: safeBigIntToNumber(participation.drawnAt),
                    claimedAt: safeBigIntToNumber(participation.claimedAt),
                })
            ),
        };

        return {
            success: true,
            data: userParticipationInfo,
        };
    } catch (error) {
        console.error("Error getting user participation V2:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to get user participation V2",
        };
    }
}

export interface GetUserParticipationCountInput {
    contractAddress: string;
    raffleId: string;
    playerId: string;
}

export interface GetUserParticipationCountResult {
    success: boolean;
    data?: number;
    error?: string;
}

/**
 * V2 사용자 참여 횟수 조회
 */
export async function getUserParticipationCountV2(
    input: GetUserParticipationCountInput
): Promise<GetUserParticipationCountResult> {
    try {
        const contract = await prisma.onchainRaffleContract.findUnique({
            cacheStrategy: getCacheStrategy("oneHour"),
            where: { address: input.contractAddress },
            select: {
                network: {
                    select: {
                        id: true,
                        name: true,
                        chainId: true,
                        symbol: true,
                        rpcUrl: true,
                        explorerUrl: true,
                        multicallAddress: true,
                    },
                },
            },
        });

        if (!contract) {
            return {
                success: false,
                error: "Contract not found",
            };
        }

        const playerAddress = await getDefaultUserWalletAddress({
            playerId: input.playerId,
        });

        if (!playerAddress) {
            return {
                success: false,
                error: "Player not found",
            };
        }

        // Public Client 생성
        const publicClient = await fetchPublicClient({
            network: contract.network,
        });

        // 컨트랙트 인스턴스 생성
        const raffleContract = getContract({
            address: input.contractAddress as `0x${string}`,
            abi,
            client: publicClient,
        });

        // 사용자 참여 횟수 조회
        const participationCount = await (
            raffleContract.read as any
        ).getUserParticipationCount([
            BigInt(input.raffleId),
            playerAddress as Address,
        ]);

        return {
            success: true,
            data: safeBigIntToNumber(participationCount),
        };
    } catch (error) {
        console.error("Error getting user participation count V2:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to get user participation count V2",
        };
    }
}

export interface GetContractMetadataInput {
    contractAddress: string;
}

export interface GetContractMetadataResult {
    success: boolean;
    data?: {
        activeRaffleIds: string[];
        completedRaffleIds: string[];
        activeRaffleCount: number;
        isPaused: boolean;
        totalRaffleCount: number;
    };
    error?: string;
}

/**
 * V2 컨트랙트 메타데이터 조회
 */
export async function getContractMetadataV2(
    input: GetContractMetadataInput
): Promise<GetContractMetadataResult> {
    try {
        const contract = await prisma.onchainRaffleContract.findUnique({
            cacheStrategy: getCacheStrategy("oneHour"),
            where: { address: input.contractAddress },
            select: {
                network: {
                    select: {
                        id: true,
                        name: true,
                        chainId: true,
                        symbol: true,
                        rpcUrl: true,
                        explorerUrl: true,
                        multicallAddress: true,
                    },
                },
            },
        });

        if (!contract) {
            return {
                success: false,
                error: "Contract not found",
            };
        }

        // Public Client 생성
        const publicClient = await fetchPublicClient({
            network: contract.network,
        });

        // 컨트랙트 인스턴스 생성
        const raffleContract = getContract({
            address: input.contractAddress as `0x${string}`,
            abi,
            client: publicClient,
        });

        // 컨트랙트 메타데이터 조회
        const [
            activeRaffleIds,
            completedRaffleIds,
            activeRaffleCount,
            isPaused,
        ] = await Promise.all([
            (raffleContract.read as any).getActiveRaffleIds(),
            (raffleContract.read as any).getCompletedRaffleIds(),
            (raffleContract.read as any).getActiveRaffleCount(),
            (raffleContract.read as any).paused(),
        ]);

        return {
            success: true,
            data: {
                activeRaffleIds: activeRaffleIds.map((id: any) =>
                    safeBigIntToNumber(id).toString()
                ),
                completedRaffleIds: completedRaffleIds.map((id: any) =>
                    safeBigIntToNumber(id).toString()
                ),
                activeRaffleCount: safeBigIntToNumber(activeRaffleCount),
                isPaused: Boolean(isPaused),
                totalRaffleCount:
                    activeRaffleIds.length + completedRaffleIds.length,
            },
        };
    } catch (error) {
        console.error("Error getting contract metadata V2:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to get contract metadata V2",
        };
    }
}
