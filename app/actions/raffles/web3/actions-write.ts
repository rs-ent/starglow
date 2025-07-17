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

export async function participateAndDrawOnchainRaffle(
    input: ParticipateAndDrawInput
): Promise<ParticipateAndDrawResult> {
    try {
        // 기존 검증 로직 재사용
        const raffle = await prisma.onchainRaffle.findUnique({
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
                walletAddress: player.user!.wallets[0].address as `0x${string}`,
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

            // 이벤트에서 결과 추출
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

            // 상품 정보 가져오기
            const prize = contractRaffle.prizes[prizeIndex];
            if (!prize) {
                throw new Error("Prize not found");
            }

            // 🎁 상품 즉시 배포 (Web2 자산 또는 NFT)
            if (prize.prizeType === 1) {
                // ASSET 타입
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

// 🚀 관리자용 배치 처리 함수
export interface BatchProcessRaffleInput {
    contractAddress: string;
    raffleId: string;
    participants: Array<{
        playerId: string;
        walletAddress: string;
        prizeIndex?: number; // 선택사항: 미리 계산된 상품 인덱스
    }>;
    batchSize?: number;
}

export interface BatchProcessRaffleResult {
    success: boolean;
    data?: {
        totalProcessed: number;
        successful: number;
        failed: number;
        totalGasUsed: number;
        totalGasSaved: number;
        batchResults: Array<{
            playerId: string;
            participantId?: number;
            prizeIndex?: number;
            success: boolean;
            error?: string;
        }>;
    };
    error?: string;
}

export async function batchProcessOnchainRaffle(
    input: BatchProcessRaffleInput
): Promise<BatchProcessRaffleResult> {
    try {
        // 관리자 권한 확인
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
                error: "Admin access required for batch processing",
            };
        }

        const raffle = await prisma.onchainRaffle.findUnique({
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
            },
        });

        if (!raffle) {
            return { success: false, error: "Raffle not found" };
        }

        const batchSize = Math.min(input.batchSize || 50, 100);
        const batches = [];

        // 배치로 나누기
        for (let i = 0; i < input.participants.length; i += batchSize) {
            batches.push(input.participants.slice(i, i + batchSize));
        }

        let totalProcessed = 0;
        let successful = 0;
        let failed = 0;
        let totalGasUsed = 0;
        let totalGasSaved = 0;
        const allBatchResults: any[] = [];

        // 각 배치 처리
        for (const batch of batches) {
            try {
                const publicClient = await fetchPublicClient({
                    network: raffle.network,
                });

                const walletClient = await fetchWalletClient({
                    network: raffle.network,
                });

                const raffleContractWrite = getContract({
                    address: raffle.contractAddress as `0x${string}`,
                    abi,
                    client: walletClient,
                });

                // 배치 호출 준비
                const players = batch.map(
                    (p) => p.walletAddress as `0x${string}`
                );
                const prizeIndices = batch.map(
                    (p) =>
                        BigInt(p.prizeIndex || Math.floor(Math.random() * 10)) // 임시: 실제로는 오프체인에서 계산
                );

                // 🚀 배치 스마트 컨트랙트 호출
                const batchTx = await (
                    raffleContractWrite.write as any
                ).batchParticipateDrawAndDistribute([
                    BigInt(input.raffleId),
                    players,
                    prizeIndices,
                ]);

                const receipt = await publicClient.waitForTransactionReceipt({
                    hash: batchTx,
                });

                if (receipt.status === "success") {
                    const gasUsed = Number(receipt.gasUsed || 0);
                    const individualGasCost =
                        batch.length * (150000 + 200000 + 50000); // participate + draw + distribute
                    const gasSaved = Math.max(0, individualGasCost - gasUsed);

                    totalGasUsed += gasUsed;
                    totalGasSaved += gasSaved;

                    // 성공한 배치의 모든 참가자를 성공으로 기록
                    batch.forEach((participant, index) => {
                        allBatchResults.push({
                            playerId: participant.playerId,
                            participantId: totalProcessed + index + 1,
                            prizeIndex: Number(prizeIndices[index]),
                            success: true,
                        });
                        successful++;
                    });
                } else {
                    // 실패한 배치의 모든 참가자를 실패로 기록
                    batch.forEach((participant) => {
                        allBatchResults.push({
                            playerId: participant.playerId,
                            success: false,
                            error: "Batch transaction failed",
                        });
                        failed++;
                    });
                }

                totalProcessed += batch.length;
            } catch (error) {
                console.error("Batch processing error:", error);

                // 에러 발생 시 해당 배치의 모든 참가자를 실패로 기록
                batch.forEach((participant) => {
                    allBatchResults.push({
                        playerId: participant.playerId,
                        success: false,
                        error:
                            error instanceof Error
                                ? error.message
                                : "Unknown error",
                    });
                    failed++;
                });

                totalProcessed += batch.length;
            }
        }

        return {
            success: true,
            data: {
                totalProcessed,
                successful,
                failed,
                totalGasUsed,
                totalGasSaved,
                batchResults: allBatchResults,
            },
        };
    } catch (error) {
        console.error("❌ Error in batch processing:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to batch process raffle",
        };
    }
}
