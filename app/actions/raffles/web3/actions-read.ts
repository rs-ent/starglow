/// app/actions/raffles/web3/actions-read.ts

"use server";

import { getContract } from "viem";
import type { Abi } from "viem";
import { prisma } from "@/lib/prisma/client";
import { fetchPublicClient } from "@/app/story/client";
import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";

import rafflesJson from "@/web3/artifacts/contracts/Raffles.sol/Raffles.json";
import type { BlockchainNetwork, OnchainRaffle, Prisma } from "@prisma/client";

const abi = rafflesJson.abi;

export interface GetOnchainRafflesInput {
    networkId?: string;
    contractAddress?: string;
    isActive?: "ACTIVE" | "INACTIVE";
    limit?: number;
    offset?: number;
}

export type Raffle = Pick<
    OnchainRaffle,
    "id" | "contractAddress" | "raffleId" | "isActive" | "blockNumber"
> & {
    network: Pick<
        BlockchainNetwork,
        | "id"
        | "name"
        | "chainId"
        | "symbol"
        | "rpcUrl"
        | "explorerUrl"
        | "multicallAddress"
    >;
};

export interface GetOnchainRafflesResult {
    success: boolean;
    data?: {
        raffles: Raffle[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    error?: string;
}

export async function getOnchainRaffles(
    input: GetOnchainRafflesInput = {}
): Promise<GetOnchainRafflesResult> {
    if (!input) {
        return {
            success: false,
            error: "Input is required",
        };
    }
    try {
        const {
            networkId,
            contractAddress,
            isActive,
            limit = 10,
            offset = 0,
        } = input;

        const where: Prisma.OnchainRaffleWhereInput = {};

        if (networkId) {
            where.networkId = networkId;
        }

        if (contractAddress) {
            where.contractAddress = contractAddress;
        }

        if (isActive) {
            where.isActive = isActive === "ACTIVE";
        }

        const [raffles, total] = await Promise.all([
            prisma.onchainRaffle.findMany({
                cacheStrategy: getCacheStrategy("oneHour"),
                where,
                select: {
                    id: true,
                    contractAddress: true,
                    raffleId: true,
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
                    isActive: true,
                    blockNumber: true,
                },
                skip: offset,
                take: limit,
                orderBy: {
                    createdAt: "desc",
                },
            }),
            prisma.onchainRaffle.count({
                cacheStrategy: getCacheStrategy("oneHour"),
                where,
            }),
        ]);

        return {
            success: true,
            data: {
                raffles: raffles as unknown as Raffle[],
                total: total,
                page: offset,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error("Error fetching onchain raffles:", error);
        return {
            success: false,
            error: "Failed to fetch onchain raffles",
        };
    }
}

export type RaffleDataKeys =
    | "basicInfo"
    | "timing"
    | "settings"
    | "fee"
    | "status"
    | "prizes";

export interface GetRaffleFromContractInput {
    contractAddress: string;
    raffleId: string;
    dataKeys?: RaffleDataKeys[];
}

export interface ContractRaffleData {
    raffleId: string;
    basicInfo?: {
        title: string;
        description: string;
        imageUrl: string;
        iconUrl: string;
    };
    timing?: {
        startDate: bigint;
        endDate: bigint;
        instantDraw: boolean;
        drawDate: bigint;
    };
    settings?: {
        dynamicWeight: boolean;
        participationLimit: bigint;
        participationLimitPerPlayer: bigint;
    };
    fee?: {
        participationFeeAsset: string;
        participationFeeAssetId: string;
        participationFeeAmount: bigint;
    };
    status?: {
        isActive: boolean;
        isDrawn: boolean;
        totalQuantity: bigint;
        remainingQuantity: bigint;
    };
    prizes?: Array<{
        prizeType: number;
        collectionAddress: string;
        registeredTicketQuantity: bigint;
        pickedTicketQuantity: bigint;
        order: bigint;
        rarity: bigint;
        prizeQuantity: bigint;
        startTicketNumber: bigint;
        title: string;
        description: string;
        imageUrl: string;
        iconUrl: string;
        assetId: string;
        tokenIds: bigint[];
    }>;
}

export interface GetRaffleFromContractResult {
    success: boolean;
    data?: ContractRaffleData;
    error?: string;
}

export async function getRaffleFromContract(
    input: GetRaffleFromContractInput
): Promise<GetRaffleFromContractResult> {
    try {
        const { contractAddress, raffleId, dataKeys = ["status"] } = input;

        const dbRaffle = await prisma.onchainRaffle.findUnique({
            where: {
                contractAddress_raffleId: { contractAddress, raffleId },
            },
            select: {
                raffleId: true,
                contractAddress: true,
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

        if (!dbRaffle) {
            return {
                success: false,
                error: "Raffle not found in database",
            };
        }

        const publicClient = await fetchPublicClient({
            network: dbRaffle.network,
        });

        const contract = getContract({
            address: contractAddress as `0x${string}`,
            abi,
            client: publicClient,
        });

        const result: ContractRaffleData = { raffleId };

        if (dataKeys.includes("status")) {
            const statusData = (await contract.read.getRaffleStatus([
                BigInt(raffleId),
            ])) as [boolean, boolean, bigint];
            result.status = {
                isActive: statusData[0],
                isDrawn: statusData[1],
                remainingQuantity: statusData[2],
                totalQuantity: statusData[2],
            };
        }

        if (
            dataKeys.some((key) =>
                ["basicInfo", "timing", "settings", "fee", "prizes"].includes(
                    key
                )
            )
        ) {
            const fullRaffleData = (await contract.read.getRaffle([
                BigInt(raffleId),
            ])) as {
                basicInfo: {
                    title: string;
                    description: string;
                    imageUrl: string;
                    iconUrl: string;
                };
                timing: {
                    startDate: bigint;
                    endDate: bigint;
                    instantDraw: boolean;
                    drawDate: bigint;
                };
                settings: {
                    dynamicWeight: boolean;
                    participationLimit: bigint;
                    participationLimitPerPlayer: bigint;
                };
                fee: {
                    participationFeeAsset: string;
                    participationFeeAssetId: string;
                    participationFeeAmount: bigint;
                };
                status: {
                    isActive: boolean;
                    isDrawn: boolean;
                    totalQuantity: bigint;
                    remainingQuantity: bigint;
                };
                prizes: Array<any>;
            };

            if (dataKeys.includes("basicInfo")) {
                result.basicInfo = fullRaffleData.basicInfo;
            }
            if (dataKeys.includes("timing")) {
                result.timing = fullRaffleData.timing;
            }
            if (dataKeys.includes("settings")) {
                result.settings = fullRaffleData.settings;
            }
            if (dataKeys.includes("fee")) {
                result.fee = fullRaffleData.fee;
            }
            if (dataKeys.includes("prizes")) {
                result.prizes = fullRaffleData.prizes.map((prize: any) => ({
                    prizeType: Number(prize.prizeType),
                    collectionAddress: prize.collectionAddress,
                    registeredTicketQuantity: prize.registeredTicketQuantity,
                    pickedTicketQuantity: prize.pickedTicketQuantity,
                    order: prize.order,
                    rarity: prize.rarity,
                    prizeQuantity: prize.prizeQuantity,
                    startTicketNumber: prize.startTicketNumber,
                    title: prize.title,
                    description: prize.description,
                    imageUrl: prize.imageUrl,
                    iconUrl: prize.iconUrl,
                    assetId: prize.assetId,
                    tokenIds: prize.tokenIds,
                }));
            }

            if (dataKeys.includes("status") && !result.status) {
                result.status = fullRaffleData.status;
            }
        }

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        console.error("Error fetching raffle from contract:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch raffle from contract",
        };
    }
}

export interface GetRaffleStatusInput {
    contractAddress: string;
    raffleId: string;
}

export async function getRaffleStatusFromContract(
    input: GetRaffleStatusInput
): Promise<GetRaffleFromContractResult> {
    return getRaffleFromContract({
        ...input,
        dataKeys: ["status"],
    });
}

export interface RaffleListItem {
    raffleId: string;
    contractAddress: string;
    imageUrl: string;
    title: string;
    highestTierPrize: {
        title: string;
        rarity: bigint;
        imageUrl: string;
    };
    totalPrizeCount: number;
    startDate: bigint;
    endDate: bigint;
    drawDate: bigint;
    totalParticipants: number;
    participationFee: {
        asset: string;
        amount: bigint;
    };
    status: {
        isActive: boolean;
        isDrawn: boolean;
        remainingQuantity: bigint;
    };
}

export interface GetRaffleListInput {
    raffles: Array<{
        contractAddress: string;
        raffleId: string;
    }>;
}

export interface GetRaffleListResult {
    success: boolean;
    data?: RaffleListItem[];
    error?: string;
}

export async function getRaffleListFromContract(
    input: GetRaffleListInput
): Promise<GetRaffleListResult> {
    try {
        const { raffles } = input;

        if (raffles.length === 0) {
            return { success: true, data: [] };
        }

        const dbRaffle = await prisma.onchainRaffle.findUnique({
            where: {
                contractAddress_raffleId: {
                    contractAddress: raffles[0].contractAddress,
                    raffleId: raffles[0].raffleId,
                },
            },
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

        if (!dbRaffle?.network.multicallAddress) {
            return {
                success: false,
                error: "Multicall not supported on this network",
            };
        }

        const publicClient = await fetchPublicClient({
            network: dbRaffle.network,
        });

        const multicallRequests = raffles.flatMap(
            ({ contractAddress, raffleId }) => [
                {
                    address: contractAddress as `0x${string}`,
                    abi: abi as Abi,
                    functionName: "getRaffle",
                    args: [BigInt(raffleId)],
                },
                {
                    address: contractAddress as `0x${string}`,
                    abi: abi as Abi,
                    functionName: "getRaffleParticipants",
                    args: [BigInt(raffleId)],
                },
            ]
        );

        const multicallResults = await publicClient.multicall({
            contracts: multicallRequests,
        });

        const raffleListItems: RaffleListItem[] = [];

        for (let i = 0; i < raffles.length; i++) {
            const raffleIndex = i * 2;
            const participantsIndex = i * 2 + 1;

            const raffleResult = multicallResults[raffleIndex];
            const participantsResult = multicallResults[participantsIndex];

            if (
                raffleResult.status === "success" &&
                participantsResult.status === "success"
            ) {
                const raffleData = raffleResult.result as any;
                const participantsData = participantsResult.result as bigint[];

                const highestTierPrize = raffleData.prizes.reduce(
                    (highest: any, current: any) =>
                        current.rarity > highest.rarity ? current : highest
                );

                raffleListItems.push({
                    raffleId: raffles[i].raffleId,
                    contractAddress: raffles[i].contractAddress,
                    imageUrl: raffleData.basicInfo.imageUrl,
                    title: raffleData.basicInfo.title,
                    highestTierPrize: {
                        title: highestTierPrize.title,
                        rarity: highestTierPrize.rarity,
                        imageUrl: highestTierPrize.imageUrl,
                    },
                    totalPrizeCount: raffleData.prizes.length,
                    startDate: raffleData.timing.startDate,
                    endDate: raffleData.timing.endDate,
                    drawDate: raffleData.timing.drawDate,
                    totalParticipants: participantsData.length,
                    participationFee: {
                        asset: raffleData.fee.participationFeeAsset,
                        amount: raffleData.fee.participationFeeAmount,
                    },
                    status: {
                        isActive: raffleData.status.isActive,
                        isDrawn: raffleData.status.isDrawn,
                        remainingQuantity: raffleData.status.remainingQuantity,
                    },
                });
            }
        }

        return {
            success: true,
            data: raffleListItems,
        };
    } catch (error) {
        console.error("Error fetching raffle list from contract:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch raffle list",
        };
    }
}

export async function getRaffleListStatusFromContract(
    input: GetRaffleListInput
): Promise<GetRaffleListResult> {
    try {
        const { raffles } = input;

        if (raffles.length === 0) {
            return { success: true, data: [] };
        }

        const dbRaffle = await prisma.onchainRaffle.findUnique({
            where: {
                contractAddress_raffleId: {
                    contractAddress: raffles[0].contractAddress,
                    raffleId: raffles[0].raffleId,
                },
            },
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

        if (!dbRaffle?.network.multicallAddress) {
            return {
                success: false,
                error: "Multicall not supported on this network",
            };
        }

        const publicClient = await fetchPublicClient({
            network: dbRaffle.network,
        });

        const multicallRequests = raffles.map(
            ({ contractAddress, raffleId }) => ({
                address: contractAddress as `0x${string}`,
                abi: abi as Abi,
                functionName: "getRaffleStatus",
                args: [BigInt(raffleId)],
            })
        );

        const multicallResults = await publicClient.multicall({
            contracts: multicallRequests,
        });

        const raffleListItems: Partial<RaffleListItem>[] = raffles.map(
            (raffle, index) => {
                const result = multicallResults[index];

                if (result.status === "success") {
                    const [isActive, isDrawn, remainingQuantity] =
                        result.result as [boolean, boolean, bigint];

                    return {
                        raffleId: raffle.raffleId,
                        contractAddress: raffle.contractAddress,
                        status: {
                            isActive,
                            isDrawn,
                            remainingQuantity,
                        },
                    };
                }

                return {
                    raffleId: raffle.raffleId,
                    contractAddress: raffle.contractAddress,
                };
            }
        );

        return {
            success: true,
            data: raffleListItems as RaffleListItem[],
        };
    } catch (error) {
        console.error("Error fetching raffle list status:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch raffle list status",
        };
    }
}

export interface GetUserParticipationInput {
    contractAddress: string;
    raffleId: string;
    playerId: string;
}

export interface UserParticipationDetail {
    participantId: bigint;
    ticketNumber: string;
    participatedAt: bigint;
    hasLotteryResult: boolean;
    resultId: bigint;
    prizeIndex: bigint;
    claimed: boolean;
    drawnAt: bigint;
    claimedAt: bigint;
}

export interface GetUserParticipationResult {
    success: boolean;
    data?: {
        participationCount: number;
        raffleId: string;
        contractAddress: string;
        playerWallet: string;
        participations: UserParticipationDetail[];
        canViewResults: boolean;
    };
    error?: string;
}

export async function getUserParticipation(
    input: GetUserParticipationInput
): Promise<GetUserParticipationResult> {
    try {
        const { contractAddress, raffleId, playerId } = input;

        const player = (await prisma.player.findUnique({
            where: {
                id: playerId,
            },
            select: {
                user: {
                    select: {
                        wallets: {
                            where: {
                                default: true,
                            },
                            select: {
                                address: true,
                            },
                        },
                    },
                },
            },
        })) as {
            user: {
                wallets: {
                    address: string;
                }[];
            };
        };

        if (!player || player.user.wallets.length === 0) {
            return {
                success: false,
                error: "Player wallet not found",
            };
        }

        const playerWallet = player.user.wallets[0].address;

        const dbRaffle = await prisma.onchainRaffle.findUnique({
            where: {
                contractAddress_raffleId: {
                    contractAddress,
                    raffleId,
                },
            },
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

        if (!dbRaffle) {
            return {
                success: false,
                error: "Raffle not found in database",
            };
        }

        const publicClient = await fetchPublicClient({
            network: dbRaffle.network,
        });

        const contract = getContract({
            address: contractAddress as `0x${string}`,
            abi,
            client: publicClient,
        });

        const userParticipationInfo =
            (await contract.read.getUserParticipationDetails([
                BigInt(raffleId),
                playerWallet as `0x${string}`,
            ])) as {
                participationCount: bigint;
                participations: Array<{
                    participantId: bigint;
                    ticketNumber: string;
                    participatedAt: bigint;
                    hasLotteryResult: boolean;
                    resultId: bigint;
                    prizeIndex: bigint;
                    claimed: boolean;
                    drawnAt: bigint;
                    claimedAt: bigint;
                }>;
            };

        const canViewResults = userParticipationInfo.participations.some(
            (p) => p.hasLotteryResult
        );

        const participations: UserParticipationDetail[] =
            userParticipationInfo.participations.map((p) => ({
                participantId: p.participantId,
                ticketNumber: p.ticketNumber,
                participatedAt: p.participatedAt,
                hasLotteryResult: p.hasLotteryResult,
                resultId: p.resultId,
                prizeIndex: p.prizeIndex,
                claimed: p.claimed,
                drawnAt: p.drawnAt,
                claimedAt: p.claimedAt,
            }));

        return {
            success: true,
            data: {
                participationCount: Number(
                    userParticipationInfo.participationCount
                ),
                raffleId,
                contractAddress,
                playerWallet,
                participations,
                canViewResults,
            },
        };
    } catch (error) {
        console.error("Error fetching user participation:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch user participation",
        };
    }
}

export interface GetLotteryResultInput {
    contractAddress: string;
    resultId: string;
}

export interface LotteryResultData {
    resultId: string;
    contractAddress: string;
    player: string;
    raffleId: string;
    ticketNumber: string;
    prizeIndex: bigint;
    claimed: boolean;
    drawnAt: bigint;
    claimedAt: bigint;
    prize?: {
        title: string;
        description: string;
        imageUrl: string;
        iconUrl: string;
        prizeType: number;
        rarity: bigint;
        assetId: string;
    };
}

export interface GetLotteryResultResult {
    success: boolean;
    data?: LotteryResultData;
    error?: string;
}

export async function getLotteryResult(
    input: GetLotteryResultInput
): Promise<GetLotteryResultResult> {
    try {
        const { contractAddress, resultId } = input;

        // DB에서 네트워크 정보 조회 (컨트랙트 주소로)
        const dbRaffle = await prisma.onchainRaffle.findFirst({
            where: {
                contractAddress,
            },
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

        if (!dbRaffle) {
            return {
                success: false,
                error: "Contract not found in database",
            };
        }

        const publicClient = await fetchPublicClient({
            network: dbRaffle.network,
        });

        const contract = getContract({
            address: contractAddress as `0x${string}`,
            abi,
            client: publicClient,
        });

        // 컨트랙트에서 추첨 결과 조회
        const lotteryResult = (await contract.read.getLotteryResult([
            BigInt(resultId),
        ])) as {
            lotteryTicketNumber: string;
            player: string;
            raffleId: bigint;
            prizeIndex: bigint;
            drawnAt: bigint;
            claimed: boolean;
            claimedAt: bigint;
        };

        if (
            !lotteryResult.player ||
            lotteryResult.player ===
                "0x0000000000000000000000000000000000000000"
        ) {
            return {
                success: false,
                error: "Lottery result not found",
            };
        }

        const result: LotteryResultData = {
            resultId,
            contractAddress,
            player: lotteryResult.player,
            raffleId: lotteryResult.raffleId.toString(),
            ticketNumber: lotteryResult.lotteryTicketNumber,
            prizeIndex: lotteryResult.prizeIndex,
            claimed: lotteryResult.claimed,
            drawnAt: lotteryResult.drawnAt,
            claimedAt: lotteryResult.claimedAt,
        };

        // 상품 정보도 함께 조회 (선택적)
        try {
            const raffleData = (await contract.read.getRaffle([
                lotteryResult.raffleId,
            ])) as {
                prizes: Array<{
                    title: string;
                    description: string;
                    imageUrl: string;
                    iconUrl: string;
                    prizeType: number;
                    rarity: bigint;
                    assetId: string;
                }>;
            };

            const prizeIndex = Number(lotteryResult.prizeIndex);
            if (raffleData.prizes && raffleData.prizes[prizeIndex]) {
                const prize = raffleData.prizes[prizeIndex];
                result.prize = {
                    title: prize.title,
                    description: prize.description,
                    imageUrl: prize.imageUrl,
                    iconUrl: prize.iconUrl,
                    prizeType: Number(prize.prizeType),
                    rarity: prize.rarity,
                    assetId: prize.assetId,
                };
            }
        } catch (prizeError) {
            // 상품 정보 조회 실패해도 기본 결과는 반환
            console.warn("Failed to fetch prize info:", prizeError);
        }

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        console.error("Error fetching lottery result:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch lottery result",
        };
    }
}
