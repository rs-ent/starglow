/// app/actions/raffles/web3/actions-write.ts

"use server";

import { getContract, decodeEventLog } from "viem";

import { prisma } from "@/lib/prisma/client";
import { fetchPublicClient } from "@/app/story/client";
import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";

import rafflesJson from "@/web3/artifacts/contracts/Raffles.sol/Raffles.json";
import { requireAuth } from "@/app/auth/authUtils";
import {
    validatePlayerAsset,
    updatePlayerAsset,
} from "@/app/actions/playerAssets/actions";
import { fetchWalletClient } from "@/app/story/client";
import { initialTransfer } from "@/app/story/transfer/actions";

const abi = rafflesJson.abi;

/**
 * ParticipateAndDraw : 참가 + 추첨 => instant draw 래플만 지원 (사용자 가스비 지불)
 * Participate : 일반 참가 => 모든 래플 지원 (관리자 가스비 대납)
 * BatchDraw : 배치 추첨 => 관리자용 일반 래플 추첨
 */

export interface ParticipateAndDrawInput {
    contractAddress: string;
    raffleId: string;
    playerId: string;
}

export interface ParticipateAndDrawResult {
    success: boolean;
    data?: {
        participationId: string;
        txHash: string;
        blockNumber: number;
        participantId: number;
        prizeIndex: number;
        prizeWon: {
            title: string;
            description: string;
            imageUrl: string;
            prizeType: number;
            userValue: number;
        };
        entryFeePaid: number;
    };
    error?: string;
}

export async function participateAndDraw(
    input: ParticipateAndDrawInput
): Promise<ParticipateAndDrawResult> {
    try {
        // 기존 검증 로직 재사용
        const raffle = await prisma.onchainRaffle.findUnique({
            cacheStrategy: getCacheStrategy("fiveMinutes"),
            where: {
                contractAddress_raffleId: {
                    contractAddress: input.contractAddress,
                    raffleId: input.raffleId,
                },
            },
            select: {
                contractAddress: true,
                deployedBy: true,
                network: {
                    select: {
                        id: true,
                        name: true,
                        chainId: true,
                        symbol: true,
                        rpcUrl: true,
                        explorerUrl: true,
                    },
                },
                blockNumber: true,
            },
        });

        if (!raffle) {
            return { success: false, error: "Raffle not found" };
        }

        const player = (await prisma.player.findUnique({
            cacheStrategy: getCacheStrategy("sevenDays"),
            where: { id: input.playerId },
            select: {
                id: true,
                userId: true,
                user: {
                    select: {
                        id: true,
                        wallets: {
                            where: { status: "ACTIVE" },
                            select: {
                                address: true,
                                status: true,
                                default: true,
                            },
                            orderBy: { default: "desc" },
                        },
                    },
                },
            },
        })) as {
            userId: string | null;
            user: {
                wallets: {
                    address: string;
                    default: boolean;
                }[];
            } | null;
        } | null;

        if (!player?.user?.wallets?.[0]) {
            return { success: false, error: "Player wallet not found" };
        }

        // 스마트 컨트랙트 검증
        const publicClient = await fetchPublicClient({
            network: raffle.network,
        });

        const raffleContract = getContract({
            address: raffle.contractAddress as `0x${string}`,
            abi,
            client: publicClient,
        });

        const contractRaffle = await (raffleContract.read as any).getRaffle([
            BigInt(input.raffleId),
        ]);

        // 즉시 추첨 래플인지 확인
        if (!contractRaffle.timing.instantDraw) {
            return {
                success: false,
                error: "This function only supports instant draw raffles",
            };
        }

        // 트랜잭션 실행
        const result = await prisma.$transaction(async (tx) => {
            // 참가비 처리 (기존 로직 재사용)
            const entryFeeAmount = Number(
                contractRaffle.fee.participationFeeAmount
            );
            const entryFeeAssetId = contractRaffle.fee.participationFeeAssetId;

            if (entryFeeAssetId && entryFeeAmount > 0) {
                const feeValidation = await validatePlayerAsset(
                    {
                        playerId: input.playerId,
                        assetId: entryFeeAssetId,
                        requiredAmount: entryFeeAmount,
                    },
                    tx
                );

                if (!feeValidation.success) {
                    throw new Error(
                        `Entry fee check failed: ${feeValidation.error}`
                    );
                }

                const feeDeduction = await updatePlayerAsset(
                    {
                        transaction: {
                            playerId: input.playerId,
                            assetId: entryFeeAssetId,
                            amount: entryFeeAmount,
                            operation: "SUBTRACT",
                            reason: `Onchain Raffle participation: ${contractRaffle.basicInfo.title}`,
                        },
                    },
                    tx
                );

                if (!feeDeduction.success) {
                    throw new Error(
                        `Failed to deduct entry fee: ${feeDeduction.error}`
                    );
                }
            }

            // 🚀 통합 스마트 컨트랙트 호출 (참가 + 추첨 + 배포 마킹)
            const walletClient = await fetchWalletClient({
                network: raffle.network,
                walletAddress: raffle.deployedBy as `0x${string}`,
            });

            const raffleContractWrite = getContract({
                address: raffle.contractAddress as `0x${string}`,
                abi,
                client: walletClient,
            });

            const participateAndDrawTx = await (
                raffleContractWrite.write as any
            ).participateAndDraw([
                BigInt(input.raffleId),
                player.user!.wallets[0].address as `0x${string}`,
            ]);

            const receipt = await publicClient.waitForTransactionReceipt({
                hash: participateAndDrawTx,
            });

            if (receipt.status !== "success") {
                throw new Error("Blockchain transaction failed");
            }

            let participantId = 0;
            let prizeIndex = 0;

            if (receipt.logs && receipt.logs.length > 0) {
                for (const log of receipt.logs) {
                    try {
                        const decoded = decodeEventLog({
                            abi,
                            data: log.data,
                            topics: log.topics,
                            eventName: "ParticipatedAndDrawn",
                        }) as any;

                        if (
                            decoded.args.raffleId.toString() === input.raffleId
                        ) {
                            participantId = Number(decoded.args.participantId);
                            prizeIndex = Number(decoded.args.prizeIndex);
                            break;
                        }
                    } catch (error) {
                        console.error("Error decoding event:", error);
                        continue;
                    }
                }
            }

            const prize = contractRaffle.prizes[prizeIndex];
            if (!prize) {
                throw new Error("Prize not found");
            }

            if (prize.prizeType === 1) {
                const assetId = prize.assetId;
                const assetAmount = Number(prize.assetAmount || 1);

                if (assetId && assetAmount > 0) {
                    const assetResult = await updatePlayerAsset(
                        {
                            transaction: {
                                playerId: input.playerId,
                                assetId,
                                amount: assetAmount,
                                operation: "ADD",
                                reason: `Onchain Raffle prize: ${prize.title}`,
                            },
                        },
                        tx
                    );

                    if (!assetResult.success) {
                        console.warn(
                            `Failed to distribute asset prize: ${assetResult.error}`
                        );
                    }
                }
            } else if (prize.prizeType === 2) {
                // NFT 타입
                const spgAddress = prize.collectionAddress;
                const nftQuantity = Number(prize.nftQuantity || 1);

                if (spgAddress && nftQuantity > 0) {
                    try {
                        const nftResult = await initialTransfer({
                            spgAddress,
                            quantity: nftQuantity,
                            toAddress: player.user!.wallets[0]
                                .address as `0x${string}`,
                        });

                        if (!nftResult) {
                            console.warn("Failed to transfer NFT prize");
                        }
                    } catch (error) {
                        console.warn("NFT transfer failed:", error);
                    }
                }
            }

            return {
                txHash: participateAndDrawTx,
                blockNumber: Number(receipt.blockNumber),
                participantId,
                prizeIndex,
                prize,
                entryFeeAmount,
            };
        });

        return {
            success: true,
            data: {
                participationId: `${raffle.contractAddress}_${input.raffleId}_${
                    player.user!.wallets[0].address
                }`,
                txHash: result.txHash,
                blockNumber: result.blockNumber,
                participantId: result.participantId,
                prizeIndex: result.prizeIndex,
                prizeWon: {
                    title:
                        result.prize.title || `Prize ${result.prizeIndex + 1}`,
                    description: result.prize.description || "",
                    imageUrl: result.prize.imageUrl || "",
                    prizeType: Number(result.prize.prizeType),
                    userValue: Number(result.prize.userValue || 0),
                },
                entryFeePaid: result.entryFeeAmount,
            },
        };
    } catch (error) {
        console.error("❌ Error in participateAndDraw:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to participate and draw",
        };
    }
}

export interface ParticipateInput {
    contractAddress: string;
    raffleId: string;
    playerId: string;
}

export interface ParticipateResult {
    success: boolean;
    data?: {
        participationId: string;
        txHash: string;
        blockNumber: number;
        participantId: number;
        ticketNumber: string;
        entryFeePaid: number;
        participatedAt: number;
    };
    error?: string;
}

export async function participate(
    input: ParticipateInput
): Promise<ParticipateResult> {
    try {
        const raffle = await prisma.onchainRaffle.findUnique({
            cacheStrategy: getCacheStrategy("fiveMinutes"),
            where: {
                contractAddress_raffleId: {
                    contractAddress: input.contractAddress,
                    raffleId: input.raffleId,
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
                    },
                },
                contractAddress: true,
                blockNumber: true,
                deployedBy: true,
            },
        });

        if (!raffle) {
            return { success: false, error: "Raffle not found" };
        }

        const player = (await prisma.player.findUnique({
            cacheStrategy: getCacheStrategy("sevenDays"),
            where: { id: input.playerId },
            select: {
                id: true,
                userId: true,
                user: {
                    select: {
                        id: true,
                        wallets: {
                            where: { status: "ACTIVE" },
                            select: {
                                address: true,
                                status: true,
                                default: true,
                            },
                            orderBy: { default: "desc" },
                        },
                    },
                },
            },
        })) as {
            userId: string | null;
            user: {
                wallets: {
                    address: string;
                    default: boolean;
                }[];
            } | null;
        } | null;

        if (!player?.user?.wallets?.[0]) {
            return { success: false, error: "Player wallet not found" };
        }

        const publicClient = await fetchPublicClient({
            network: raffle.network,
        });

        const raffleContract = getContract({
            address: raffle.contractAddress as `0x${string}`,
            abi,
            client: publicClient,
        });

        const contractRaffle = await (raffleContract.read as any).getRaffle([
            BigInt(input.raffleId),
        ]);

        const result = await prisma.$transaction(async (tx) => {
            const entryFeeAmount = Number(
                contractRaffle.fee.participationFeeAmount
            );
            const entryFeeAssetId = contractRaffle.fee.participationFeeAssetId;

            if (entryFeeAssetId && entryFeeAmount > 0) {
                const feeValidation = await validatePlayerAsset(
                    {
                        playerId: input.playerId,
                        assetId: entryFeeAssetId,
                        requiredAmount: entryFeeAmount,
                    },
                    tx
                );

                if (!feeValidation.success) {
                    throw new Error(
                        `Entry fee check failed: ${feeValidation.error}`
                    );
                }

                const feeDeduction = await updatePlayerAsset(
                    {
                        transaction: {
                            playerId: input.playerId,
                            assetId: entryFeeAssetId,
                            amount: entryFeeAmount,
                            operation: "SUBTRACT",
                            reason: `Raffle participation: ${contractRaffle.basicInfo.title}`,
                        },
                    },
                    tx
                );

                if (!feeDeduction.success) {
                    throw new Error(
                        `Failed to deduct entry fee: ${feeDeduction.error}`
                    );
                }
            }

            const walletClient = await fetchWalletClient({
                network: raffle.network,
                walletAddress: raffle.deployedBy as `0x${string}`,
            });

            const raffleContractWrite = getContract({
                address: raffle.contractAddress as `0x${string}`,
                abi,
                client: walletClient,
            });

            const participateTx = await (
                raffleContractWrite.write as any
            ).participate([
                BigInt(input.raffleId),
                player.user!.wallets[0].address as `0x${string}`,
            ]);

            const receipt = await publicClient.waitForTransactionReceipt({
                hash: participateTx,
            });

            if (receipt.status !== "success") {
                throw new Error("Blockchain transaction failed");
            }

            let participantId = 0;
            let ticketNumber = "";
            let participatedAt = 0;

            if (receipt.logs && receipt.logs.length > 0) {
                for (const log of receipt.logs) {
                    try {
                        const decoded = decodeEventLog({
                            abi,
                            data: log.data,
                            topics: log.topics,
                            eventName: "Participated",
                        }) as any;

                        if (
                            decoded.args.raffleId.toString() ===
                                input.raffleId &&
                            decoded.args.player.toLowerCase() ===
                                player.user!.wallets[0].address.toLowerCase()
                        ) {
                            participantId = Number(decoded.args.participantId);
                            ticketNumber = decoded.args.ticketNumber;
                            participatedAt = Number(decoded.args.timestamp);
                            break;
                        }
                    } catch (error) {
                        console.error(
                            "Error decoding Participated event:",
                            error
                        );
                        continue;
                    }
                }
            }

            return {
                txHash: participateTx,
                blockNumber: Number(receipt.blockNumber),
                participantId,
                ticketNumber,
                participatedAt,
                entryFeeAmount,
            };
        });

        return {
            success: true,
            data: {
                participationId: `${raffle.contractAddress}_${input.raffleId}_${
                    player.user!.wallets[0].address
                }`,
                txHash: result.txHash,
                blockNumber: result.blockNumber,
                participantId: result.participantId,
                ticketNumber: result.ticketNumber,
                entryFeePaid: result.entryFeeAmount,
                participatedAt: result.participatedAt,
            },
        };
    } catch (error) {
        console.error("❌ Error in participate:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to participate in raffle",
        };
    }
}

export interface BatchDrawInput {
    contractAddress: string;
    raffleId: string;
    batchSize?: number;
}

export interface BatchDrawResult {
    success: boolean;
    data?: {
        raffleId: string;
        contractAddress: string;
        totalParticipants: number;
        totalProcessed: number;
        successful: number;
        failed: number;
        startIndex: number;
        endIndex: number;
        txHash: string;
        blockNumber: number;
        prizeIndices: number[];
        gasUsed: number;
        estimatedGasSaved: number;
    };
    error?: string;
}

export async function batchDraw(
    input: BatchDrawInput
): Promise<BatchDrawResult> {
    try {
        const session = await requireAuth();
        if (!session?.user?.id) {
            return { success: false, error: "Authentication required" };
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user || user.role !== "admin") {
            return {
                success: false,
                error: "Admin access required for batch drawing",
            };
        }

        const raffle = await prisma.onchainRaffle.findUnique({
            cacheStrategy: getCacheStrategy("fiveMinutes"),
            where: {
                contractAddress_raffleId: {
                    contractAddress: input.contractAddress,
                    raffleId: input.raffleId,
                },
            },
            select: {
                contractAddress: true,
                deployedBy: true,
                network: {
                    select: {
                        id: true,
                        name: true,
                        chainId: true,
                        symbol: true,
                        rpcUrl: true,
                        explorerUrl: true,
                    },
                },
            },
        });

        if (!raffle) {
            return { success: false, error: "Raffle not found" };
        }

        const publicClient = await fetchPublicClient({
            network: raffle.network,
        });

        const raffleContract = getContract({
            address: raffle.contractAddress as `0x${string}`,
            abi,
            client: publicClient,
        });

        const [totalParticipants, raffleStatus] = await Promise.all([
            (raffleContract.read as any).getRaffleParticipants([
                BigInt(input.raffleId),
            ]) as Promise<bigint[]>,
            (raffleContract.read as any).getRaffleStatus([
                BigInt(input.raffleId),
            ]) as Promise<[boolean, boolean, bigint]>,
        ]);

        const totalParticipantCount = totalParticipants.length;

        if (totalParticipantCount === 0) {
            return {
                success: false,
                error: "No participants found for this raffle",
            };
        }

        const [isActive, isDrawn, remainingQuantity] = raffleStatus;

        if (!isActive) {
            return {
                success: false,
                error: "Raffle is not active",
            };
        }

        if (isDrawn) {
            return {
                success: false,
                error: "Raffle drawing is already completed",
            };
        }

        const alreadyDrawnCount =
            totalParticipantCount - Number(remainingQuantity);
        const startIndex = alreadyDrawnCount;
        const maxCount = Math.min(input.batchSize || 50, 100);

        if (startIndex >= totalParticipantCount) {
            return {
                success: false,
                error: "All participants have already been drawn",
            };
        }

        if (remainingQuantity === BigInt(0)) {
            return {
                success: false,
                error: "No more participants to draw",
            };
        }

        const walletClient = await fetchWalletClient({
            network: raffle.network,
            walletAddress: raffle.deployedBy as `0x${string}`,
        });

        const raffleContractWrite = getContract({
            address: raffle.contractAddress as `0x${string}`,
            abi,
            client: walletClient,
        });

        const batchDrawTx = await (raffleContractWrite.write as any).batchDraw([
            BigInt(input.raffleId),
            BigInt(startIndex),
            BigInt(maxCount),
        ]);

        const receipt = await publicClient.waitForTransactionReceipt({
            hash: batchDrawTx,
        });

        if (receipt.status !== "success") {
            return {
                success: false,
                error: "Batch draw transaction failed",
            };
        }

        const prizeIndices: number[] = [];
        let actualProcessed = 0;

        if (receipt.logs && receipt.logs.length > 0) {
            for (const log of receipt.logs) {
                try {
                    const decoded = decodeEventLog({
                        abi,
                        data: log.data,
                        topics: log.topics,
                        eventName: "LotteryDrawn",
                    }) as any;

                    if (decoded.args.raffleId.toString() === input.raffleId) {
                        prizeIndices.push(Number(decoded.args.prizeIndex));
                        actualProcessed++;
                    }
                } catch (error) {
                    console.warn("Error decoding LotteryDrawn event:", error);
                    continue;
                }
            }
        }

        const endIndex = Math.min(startIndex + maxCount, totalParticipantCount);
        const expectedProcessed = endIndex - startIndex;
        const gasUsed = Number(receipt.gasUsed || 0);
        const estimatedIndividualGas = expectedProcessed * 180000;
        const estimatedGasSaved = Math.max(0, estimatedIndividualGas - gasUsed);

        return {
            success: true,
            data: {
                raffleId: input.raffleId,
                contractAddress: input.contractAddress,
                totalParticipants: totalParticipantCount,
                totalProcessed: actualProcessed,
                successful: actualProcessed,
                failed: expectedProcessed - actualProcessed,
                startIndex,
                endIndex,
                txHash: batchDrawTx,
                blockNumber: Number(receipt.blockNumber),
                prizeIndices,
                gasUsed,
                estimatedGasSaved,
            },
        };
    } catch (error) {
        console.error("❌ Error in batch draw:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to batch draw raffle",
        };
    }
}
