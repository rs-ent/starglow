/// app/actions/raffles/web3/actions-partial.ts

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

export interface ParticipateOnchainRaffleInput {
    contractAddress: string;
    raffleId: string;
    playerId: string;
}

export interface ParticipateOnchainRaffleResult {
    success: boolean;
    data?: {
        participationId: string;
        txHash: string;
        blockNumber: number;
        participantId: number;
        ticketNumber: string;
        entryFeePaid: number;
        assetDeducted?: {
            assetId: string;
            amount: number;
            symbol: string;
        };
    };
    error?: string;
}

export async function participateInOnchainRaffle(
    input: ParticipateOnchainRaffleInput
): Promise<ParticipateOnchainRaffleResult> {
    try {
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

        if (!player) {
            return {
                success: false,
                error: "Invalid player or insufficient permissions",
            };
        }

        // 🔍 6. 스마트 컨트랙트에서 래플 상세 정보 조회
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

        const isActive = Number(contractRaffle.status.isActive);
        if (!isActive) {
            return {
                success: false,
                error: "Raffle is not active",
            };
        }

        const isDrawn = Number(contractRaffle.status.isDrawn);
        if (isDrawn) {
            return {
                success: false,
                error: "Raffle is completed",
            };
        }

        const now = Math.floor(Date.now() / 1000);
        const startTime = Number(contractRaffle.timing.startDate);
        const endTime = Number(contractRaffle.timing.endDate);

        if (now < startTime) {
            return {
                success: false,
                error: "Raffle has not started yet",
            };
        }

        if (now >= endTime) {
            return {
                success: false,
                error: "Raffle has already ended",
            };
        }

        const entryFeeAmount = Number(
            contractRaffle.fee.participationFeeAmount
        );
        const entryFeeAssetId = contractRaffle.fee.participationFeeAssetId;

        let assetDeductedInfo = undefined;

        if (entryFeeAssetId && entryFeeAmount > 0) {
            const entryFeeAsset = await prisma.asset.findUnique({
                where: { id: entryFeeAssetId },
                select: { id: true, symbol: true, name: true, isActive: true },
            });

            if (!entryFeeAsset || !entryFeeAsset.isActive) {
                return {
                    success: false,
                    error: "Entry fee asset not found or inactive",
                };
            }

            assetDeductedInfo = {
                assetId: entryFeeAsset.id,
                amount: entryFeeAmount,
                symbol: entryFeeAsset.symbol,
            };
        }

        // 🔄 9. 사전 중복 참가 확인 (빠른 실패를 위한 최적화)
        const existingLogs = await publicClient.getLogs({
            address: raffle.contractAddress as `0x${string}`,
            event: {
                type: "event",
                name: "Participated",
                inputs: [
                    { name: "raffleId", type: "uint256", indexed: true },
                    { name: "player", type: "address", indexed: true },
                    {
                        name: "participantId",
                        type: "uint256",
                        indexed: false,
                    },
                    {
                        name: "ticketNumber",
                        type: "bytes32",
                        indexed: false,
                    },
                    { name: "timestamp", type: "uint256", indexed: false },
                ],
            },
            args: {
                raffleId: BigInt(input.raffleId),
                player: player.user?.wallets?.[0]?.address as `0x${string}`,
            },
            fromBlock: BigInt(raffle.blockNumber || 0),
            toBlock: "latest",
        });

        if (existingLogs.length > 0) {
            return {
                success: false,
                error: "Already participated in this raffle",
            };
        }

        // 🔄 10. 트랜잭션 실행 (스마트 컨트랙트가 최종 중복 확인)
        const result = await prisma.$transaction(async (tx) => {
            // 10a. 참가비 검증 및 차감 (Web2 로직 적용)
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
                            reason: `Onchain Raffle participation fee: ${contractRaffle.basicInfo.title}`,
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

            // 10b. 스마트 컨트랙트 참가 트랜잭션 전송 (Web3 핵심 로직)
            const walletClient = await fetchWalletClient({
                network: raffle.network,
                walletAddress: player.user?.wallets?.[0]
                    ?.address as `0x${string}`,
            });

            const raffleContractWrite = getContract({
                address: raffle.contractAddress as `0x${string}`,
                abi,
                client: walletClient,
            });

            // 참가 트랜잭션 실행 (스마트 컨트랙트가 중복 참가를 최종 확인)
            const participateTx = await (
                raffleContractWrite.write as any
            ).participate([
                BigInt(input.raffleId),
                player.user?.wallets?.[0]?.address as `0x${string}`,
            ]);

            // 트랜잭션 대기 및 결과 확인
            const receipt = await publicClient.waitForTransactionReceipt({
                hash: participateTx,
            });

            if (receipt.status !== "success") {
                throw new Error("Blockchain transaction failed");
            }

            // 10c. 이벤트에서 참가 정보 추출
            let participantId = 0;
            let ticketNumber = "";

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
                            decoded.args.raffleId.toString() === input.raffleId
                        ) {
                            participantId = Number(decoded.args.participantId);
                            ticketNumber = decoded.args.ticketNumber;
                            break;
                        }
                    } catch (error) {
                        console.warn("Error decoding event:", error);
                        continue;
                    }
                }
            }

            return {
                txHash: participateTx,
                blockNumber: Number(receipt.blockNumber),
                participantId,
                ticketNumber,
            };
        });

        return {
            success: true,
            data: {
                participationId: `${raffle.contractAddress}_${input.raffleId}_${player.user?.wallets?.[0]?.address}`,
                txHash: result.txHash,
                blockNumber: result.blockNumber,
                participantId: result.participantId,
                ticketNumber: result.ticketNumber,
                entryFeePaid: entryFeeAmount,
                assetDeducted: assetDeductedInfo,
            },
        };
    } catch (error) {
        console.error("❌ Error participating in onchain raffle:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to participate in onchain raffle",
        };
    }
}

export interface DrawOnchainRaffleWinnerInput {
    contractAddress: string;
    raffleId: string;
    participantId: string;
}

export interface DrawOnchainRaffleWinnerResult {
    success: boolean;
    data?: {
        resultId: number;
        txHash: string;
        blockNumber: number;
        participantId: number;
        prizeIndex: number;
        ticketNumber: string;
        randomValue: string;
        timestamp: number;
    };
    error?: string;
}

export async function drawOnchainRaffleWinner(
    input: DrawOnchainRaffleWinnerInput
): Promise<DrawOnchainRaffleWinnerResult> {
    try {
        const onchainRaffle = await prisma.onchainRaffle.findUnique({
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

        if (!onchainRaffle) {
            return { success: false, error: "Onchain raffle not found" };
        }

        // 🔍 4. 스마트 컨트랙트 클라이언트 생성
        const publicClient = await fetchPublicClient({
            network: onchainRaffle.network,
        });

        const walletClient = await fetchWalletClient({
            network: onchainRaffle.network,
        });

        // 🔍 5. 스마트 컨트랙트에서 래플 정보 확인
        const raffleContract = getContract({
            address: input.contractAddress as `0x${string}`,
            abi,
            client: publicClient,
        });

        const contractRaffle = await (raffleContract.read as any).getRaffle([
            BigInt(input.raffleId),
        ]);

        // 추첨 가능 여부 확인
        const now = Math.floor(Date.now() / 1000);
        const instantDraw = contractRaffle.timing.instantDraw;
        const drawDate = Number(contractRaffle.timing.drawDate);

        if (!instantDraw && now < drawDate) {
            return {
                success: false,
                error: `Draw not allowed yet. Draw date: ${new Date(
                    drawDate * 1000
                ).toISOString()}`,
            };
        }

        if (contractRaffle.status.isDrawn) {
            return {
                success: false,
                error: "Raffle has already been fully drawn",
            };
        }

        const participationLogs = await publicClient.getLogs({
            address: input.contractAddress as `0x${string}`,
            event: {
                type: "event",
                name: "Participated",
                inputs: [
                    { name: "raffleId", type: "uint256", indexed: true },
                    { name: "player", type: "address", indexed: true },
                    { name: "participantId", type: "uint256", indexed: false },
                    { name: "ticketNumber", type: "bytes32", indexed: false },
                    { name: "timestamp", type: "uint256", indexed: false },
                ],
            },
            args: {
                raffleId: BigInt(input.raffleId),
            },
            fromBlock: BigInt(onchainRaffle.blockNumber || 0),
            toBlock: "latest",
        });

        const participantExists = participationLogs.some((log) => {
            try {
                const decoded = decodeEventLog({
                    abi,
                    data: log.data,
                    topics: log.topics,
                    eventName: "Participated",
                }) as any;
                return (
                    Number(decoded.args.participantId) ===
                    Number(input.participantId)
                );
            } catch {
                return false;
            }
        });

        if (!participantExists) {
            return {
                success: false,
                error: "Participant not found in this raffle",
            };
        }

        const existingDrawLogs = await publicClient.getLogs({
            address: input.contractAddress as `0x${string}`,
            event: {
                type: "event",
                name: "LotteryDrawn",
                inputs: [
                    { name: "resultId", type: "uint256", indexed: true },
                    { name: "raffleId", type: "uint256", indexed: true },
                    { name: "player", type: "address", indexed: true },
                    { name: "participantId", type: "uint256", indexed: false },
                    { name: "prizeIndex", type: "uint256", indexed: false },
                    { name: "ticketNumber", type: "bytes32", indexed: false },
                    { name: "randomValue", type: "uint256", indexed: false },
                    { name: "timestamp", type: "uint256", indexed: false },
                ],
            },
            args: {
                raffleId: BigInt(input.raffleId),
            },
            fromBlock: BigInt(onchainRaffle.blockNumber || 0),
            toBlock: "latest",
        });

        const alreadyDrawn = existingDrawLogs.some((log) => {
            try {
                const decoded = decodeEventLog({
                    abi,
                    data: log.data,
                    topics: log.topics,
                    eventName: "LotteryDrawn",
                }) as any;
                return (
                    Number(decoded.args.participantId) ===
                    Number(input.participantId)
                );
            } catch {
                return false;
            }
        });

        if (alreadyDrawn) {
            return {
                success: false,
                error: "This participant has already been drawn",
            };
        }

        const raffleContractWrite = getContract({
            address: input.contractAddress as `0x${string}`,
            abi,
            client: walletClient,
        });

        const drawTx = await (raffleContractWrite.write as any).draw([
            BigInt(input.raffleId),
            BigInt(input.participantId),
        ]);

        const receipt = await publicClient.waitForTransactionReceipt({
            hash: drawTx,
        });

        if (receipt.status !== "success") {
            return {
                success: false,
                error: "Draw transaction failed",
            };
        }

        let drawResult = null;
        if (receipt.logs && receipt.logs.length > 0) {
            for (const log of receipt.logs) {
                try {
                    const decoded = decodeEventLog({
                        abi,
                        data: log.data,
                        topics: log.topics,
                        eventName: "LotteryDrawn",
                    }) as any;

                    if (
                        Number(decoded.args.raffleId) ===
                            Number(input.raffleId) &&
                        Number(decoded.args.participantId) ===
                            Number(input.participantId)
                    ) {
                        drawResult = {
                            resultId: Number(decoded.args.resultId),
                            participantId: Number(decoded.args.participantId),
                            prizeIndex: Number(decoded.args.prizeIndex),
                            ticketNumber: decoded.args.ticketNumber,
                            randomValue: decoded.args.randomValue.toString(),
                            timestamp: Number(decoded.args.timestamp),
                        };
                        break;
                    }
                } catch (error) {
                    console.warn("Failed to parse LotteryDrawn log:", error);
                    continue;
                }
            }
        }

        if (!drawResult) {
            return {
                success: false,
                error: "Draw completed but result not found in transaction logs",
            };
        }

        return {
            success: true,
            data: {
                resultId: drawResult.resultId,
                txHash: drawTx,
                blockNumber: Number(receipt.blockNumber),
                participantId: drawResult.participantId,
                prizeIndex: drawResult.prizeIndex,
                ticketNumber: drawResult.ticketNumber,
                randomValue: drawResult.randomValue,
                timestamp: drawResult.timestamp,
            },
        };
    } catch (error) {
        console.error("❌ Error drawing onchain raffle winner:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to draw onchain raffle winner",
        };
    }
}

export interface BatchDrawOnchainRaffleWinnersInput {
    raffleId: string;
    contractAddress: string;
    batchSize?: number;
    startIndex?: number;
}

export interface BatchDrawOnchainRaffleWinnersResult {
    success: boolean;
    data?: {
        txHashes: string[];
        totalProcessed: number;
        totalBatches: number;
        drawResults: Array<{
            resultId: number;
            participantId: number;
            prizeIndex: number;
            ticketNumber: string;
            randomValue: string;
            timestamp: number;
        }>;
    };
    error?: string;
}

export async function batchDrawOnchainRaffleWinners(
    input: BatchDrawOnchainRaffleWinnersInput
): Promise<BatchDrawOnchainRaffleWinnersResult> {
    try {
        // 🔐 1. 관리자 권한 확인
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
                error: "Admin access required for batch draw",
            };
        }

        const onchainRaffle = await prisma.onchainRaffle.findUnique({
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

        if (!onchainRaffle) {
            return { success: false, error: "Onchain raffle not found" };
        }

        const publicClient = await fetchPublicClient({
            network: onchainRaffle.network,
        });

        const walletClient = await fetchWalletClient({
            network: onchainRaffle.network,
        });

        const raffleContract = getContract({
            address: input.contractAddress as `0x${string}`,
            abi,
            client: publicClient,
        });

        const contractRaffle = await (raffleContract.read as any).getRaffle([
            BigInt(input.raffleId),
        ]);

        const now = Math.floor(Date.now() / 1000);
        const drawDate = Number(contractRaffle.timing.drawDate);

        if (now < drawDate) {
            return {
                success: false,
                error: `Batch draw not allowed yet. Draw date: ${new Date(
                    drawDate * 1000
                ).toISOString()}`,
            };
        }

        if (contractRaffle.status.isDrawn) {
            return {
                success: false,
                error: "Raffle has already been fully drawn",
            };
        }

        const participationLogs = await publicClient.getLogs({
            address: input.contractAddress as `0x${string}`,
            event: {
                type: "event",
                name: "Participated",
                inputs: [
                    { name: "raffleId", type: "uint256", indexed: true },
                    { name: "player", type: "address", indexed: true },
                    { name: "participantId", type: "uint256", indexed: false },
                    { name: "ticketNumber", type: "bytes32", indexed: false },
                    { name: "timestamp", type: "uint256", indexed: false },
                ],
            },
            args: {
                raffleId: BigInt(input.raffleId),
            },
            fromBlock: BigInt(onchainRaffle.blockNumber || 0),
            toBlock: "latest",
        });

        if (participationLogs.length === 0) {
            return {
                success: false,
                error: "No participants found for this raffle",
            };
        }

        const existingDrawLogs = await publicClient.getLogs({
            address: input.contractAddress as `0x${string}`,
            event: {
                type: "event",
                name: "LotteryDrawn",
                inputs: [
                    { name: "resultId", type: "uint256", indexed: true },
                    { name: "raffleId", type: "uint256", indexed: true },
                    { name: "player", type: "address", indexed: true },
                    { name: "participantId", type: "uint256", indexed: false },
                    { name: "prizeIndex", type: "uint256", indexed: false },
                    { name: "ticketNumber", type: "bytes32", indexed: false },
                    { name: "randomValue", type: "uint256", indexed: false },
                    { name: "timestamp", type: "uint256", indexed: false },
                ],
            },
            args: {
                raffleId: BigInt(input.raffleId),
            },
            fromBlock: BigInt(onchainRaffle.blockNumber || 0),
            toBlock: "latest",
        });

        const drawnParticipantIds = new Set<number>();
        existingDrawLogs.forEach((log) => {
            try {
                const decoded = decodeEventLog({
                    abi,
                    data: log.data,
                    topics: log.topics,
                    eventName: "LotteryDrawn",
                }) as any;
                drawnParticipantIds.add(Number(decoded.args.participantId));
            } catch (error) {
                console.warn("Failed to parse LotteryDrawn log:", error);
            }
        });

        // 추첨되지 않은 참가자들만 필터링
        const pendingParticipants: number[] = [];
        participationLogs.forEach((log) => {
            try {
                const decoded = decodeEventLog({
                    abi,
                    data: log.data,
                    topics: log.topics,
                    eventName: "Participated",
                }) as any;
                const participantId = Number(decoded.args.participantId);
                if (!drawnParticipantIds.has(participantId)) {
                    pendingParticipants.push(participantId);
                }
            } catch (error) {
                console.warn("Failed to parse Participated log:", error);
            }
        });

        if (pendingParticipants.length === 0) {
            return {
                success: false,
                error: "All participants have already been drawn",
            };
        }

        const batchSize = Math.min(input.batchSize || 50, 100);
        const totalBatches = Math.ceil(pendingParticipants.length / batchSize);

        const txHashes: string[] = [];
        const allDrawResults: any[] = [];
        let totalProcessed = 0;

        const raffleContractWrite = getContract({
            address: input.contractAddress as `0x${string}`,
            abi,
            client: walletClient,
        });

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const batchStart = batchIndex * batchSize;
            const batchEnd = Math.min(
                batchStart + batchSize,
                pendingParticipants.length
            );
            const batchParticipants = pendingParticipants.slice(
                batchStart,
                batchEnd
            );

            if (batchParticipants.length === 0) break;

            try {
                const batchDrawTx = await (
                    raffleContractWrite.write as any
                ).batchDraw([
                    BigInt(input.raffleId),
                    BigInt(batchStart),
                    BigInt(batchParticipants.length),
                ]);

                const receipt = await publicClient.waitForTransactionReceipt({
                    hash: batchDrawTx,
                });

                if (receipt.status === "success") {
                    txHashes.push(batchDrawTx);
                    totalProcessed += batchParticipants.length;

                    if (receipt.logs && receipt.logs.length > 0) {
                        for (const log of receipt.logs) {
                            try {
                                const decoded = decodeEventLog({
                                    abi,
                                    data: log.data,
                                    topics: log.topics,
                                    eventName: "LotteryDrawn",
                                }) as any;

                                if (
                                    Number(decoded.args.raffleId) ===
                                    Number(input.raffleId)
                                ) {
                                    allDrawResults.push({
                                        resultId: Number(decoded.args.resultId),
                                        participantId: Number(
                                            decoded.args.participantId
                                        ),
                                        prizeIndex: Number(
                                            decoded.args.prizeIndex
                                        ),
                                        ticketNumber: decoded.args.ticketNumber,
                                        randomValue:
                                            decoded.args.randomValue.toString(),
                                        timestamp: Number(
                                            decoded.args.timestamp
                                        ),
                                    });
                                }
                            } catch (error) {
                                console.warn(
                                    "Failed to parse LotteryDrawn log:",
                                    error
                                );
                            }
                        }
                    }
                } else {
                    console.error(
                        `Batch ${batchIndex} failed with status:`,
                        receipt.status
                    );
                }
            } catch (error) {
                console.error(`Error in batch ${batchIndex}:`, error);
                continue;
            }
        }

        if (txHashes.length === 0) {
            return {
                success: false,
                error: "All batch draws failed",
            };
        }

        return {
            success: true,
            data: {
                txHashes,
                totalProcessed,
                totalBatches: txHashes.length,
                drawResults: allDrawResults,
            },
        };
    } catch (error) {
        console.error("❌ Error batch drawing onchain raffle winners:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to batch draw onchain raffle winners",
        };
    }
}

export interface DistributeOnchainPrizesInput {
    raffleId: string;
    contractAddress: string;
    batchSize?: number;
    resultIds?: number[];
}

export interface DistributeOnchainPrizesResult {
    success: boolean;
    data?: {
        distributed: number;
        failed: number;
        totalProcessed: number;
        totalBatches: number;
        distributionResults: Array<{
            resultId: number;
            participantId: number;
            playerName: string;
            prizeTitle: string;
            success: boolean;
            error?: string;
            txHash?: string;
        }>;
    };
    error?: string;
}

export async function distributeOnchainPrizes(
    input: DistributeOnchainPrizesInput
): Promise<DistributeOnchainPrizesResult> {
    try {
        const onchainRaffle = await prisma.onchainRaffle.findUnique({
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

        if (!onchainRaffle) {
            return { success: false, error: "Onchain raffle not found" };
        }

        // 🔍 4. 스마트 컨트랙트 클라이언트 생성
        const publicClient = await fetchPublicClient({
            network: onchainRaffle.network,
        });

        const raffleContract = getContract({
            address: input.contractAddress as `0x${string}`,
            abi,
            client: publicClient,
        });

        const contractRaffle = await (raffleContract.read as any).getRaffle([
            BigInt(input.raffleId),
        ]);

        // 🔍 6. LotteryDrawn 이벤트에서 당첨자 조회
        const winnerLogs = await publicClient.getLogs({
            address: input.contractAddress as `0x${string}`,
            event: {
                type: "event",
                name: "LotteryDrawn",
                inputs: [
                    { name: "resultId", type: "uint256", indexed: true },
                    { name: "raffleId", type: "uint256", indexed: true },
                    { name: "player", type: "address", indexed: true },
                    { name: "participantId", type: "uint256", indexed: false },
                    { name: "prizeIndex", type: "uint256", indexed: false },
                    { name: "ticketNumber", type: "bytes32", indexed: false },
                    { name: "randomValue", type: "uint256", indexed: false },
                    { name: "timestamp", type: "uint256", indexed: false },
                ],
            },
            args: {
                raffleId: BigInt(input.raffleId),
            },
            fromBlock: BigInt(onchainRaffle.blockNumber || 0),
            toBlock: "latest",
        });

        if (winnerLogs.length === 0) {
            return {
                success: false,
                error: "No winners found for this raffle",
            };
        }

        const claimedLogs = await publicClient.getLogs({
            address: input.contractAddress as `0x${string}`,
            event: {
                type: "event",
                name: "PrizeClaimed",
                inputs: [
                    { name: "resultId", type: "uint256", indexed: true },
                    { name: "raffleId", type: "uint256", indexed: true },
                    { name: "player", type: "address", indexed: true },
                    { name: "prizeIndex", type: "uint256", indexed: false },
                    { name: "prizeTitle", type: "string", indexed: false },
                    { name: "timestamp", type: "uint256", indexed: false },
                ],
            },
            args: {
                raffleId: BigInt(input.raffleId),
            },
            fromBlock: BigInt(onchainRaffle.blockNumber || 0),
            toBlock: "latest",
        });

        const claimedResultIds = new Set<number>();
        claimedLogs.forEach((log) => {
            try {
                const decoded = decodeEventLog({
                    abi,
                    data: log.data,
                    topics: log.topics,
                    eventName: "PrizeClaimed",
                }) as any;
                claimedResultIds.add(Number(decoded.args.resultId));
            } catch (error) {
                console.warn("Failed to parse PrizeClaimed log:", error);
            }
        });

        const pendingWinners: Array<{
            resultId: number;
            participantId: number;
            playerAddress: string;
            prizeIndex: number;
            ticketNumber: string;
            randomValue: string;
            timestamp: number;
            prize: any;
        }> = [];

        for (const log of winnerLogs) {
            try {
                const decoded = decodeEventLog({
                    abi,
                    data: log.data,
                    topics: log.topics,
                    eventName: "LotteryDrawn",
                }) as any;

                const resultId = Number(decoded.args.resultId);

                // 필터링: 특정 resultIds가 지정된 경우 해당하는 것만
                if (input.resultIds && !input.resultIds.includes(resultId)) {
                    continue;
                }

                // 이미 처리된 경우 스킵
                if (claimedResultIds.has(resultId)) {
                    continue;
                }

                const prizeIndex = Number(decoded.args.prizeIndex);
                const prize = contractRaffle.prizes[prizeIndex];

                if (!prize) {
                    console.warn(`Prize not found at index ${prizeIndex}`);
                    continue;
                }

                pendingWinners.push({
                    resultId,
                    participantId: Number(decoded.args.participantId),
                    playerAddress: decoded.args.player,
                    prizeIndex,
                    ticketNumber: decoded.args.ticketNumber,
                    randomValue: decoded.args.randomValue.toString(),
                    timestamp: Number(decoded.args.timestamp),
                    prize,
                });
            } catch (error) {
                console.warn("Failed to parse LotteryDrawn log:", error);
            }
        }

        if (pendingWinners.length === 0) {
            return {
                success: false,
                error: "No pending winners found for distribution",
            };
        }

        const batchSize = Math.min(input.batchSize || 20, 50);
        const totalBatches = Math.ceil(pendingWinners.length / batchSize);

        let totalDistributed = 0;
        let totalFailed = 0;
        const allDistributionResults: any[] = [];

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const batchStart = batchIndex * batchSize;
            const batchEnd = Math.min(
                batchStart + batchSize,
                pendingWinners.length
            );
            const batchWinners = pendingWinners.slice(batchStart, batchEnd);

            const batchResults = await Promise.allSettled(
                batchWinners.map(async (winner) => {
                    return await prisma.$transaction(async (tx) => {
                        try {
                            const player = (await prisma.player.findFirst({
                                cacheStrategy: getCacheStrategy("sevenDays"),
                                where: {
                                    user: {
                                        wallets: {
                                            some: {
                                                address: {
                                                    equals: winner.playerAddress,
                                                    mode: "insensitive",
                                                },
                                                status: "ACTIVE",
                                            },
                                        },
                                    },
                                },
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
                                id: string;
                                name: string;
                                nickname: string;
                                userId: string | null;
                                user: {
                                    wallets: {
                                        address: string;
                                        default: boolean;
                                    }[];
                                } | null;
                            } | null;

                            if (!player) {
                                throw new Error(
                                    `Player not found for address: ${winner.playerAddress}`
                                );
                            }

                            let distributionTxHash: string | undefined;

                            if (winner.prize.prizeType === 1) {
                                const assetId = winner.prize.assetId;
                                const assetAmount = Number(
                                    winner.prize.assetAmount
                                );

                                if (!assetId || assetAmount <= 0) {
                                    throw new Error(
                                        "Invalid asset prize configuration"
                                    );
                                }

                                const result = await updatePlayerAsset(
                                    {
                                        transaction: {
                                            playerId: player.id,
                                            assetId,
                                            amount: assetAmount,
                                            operation: "ADD",
                                            reason: `Onchain Raffle prize: ${winner.prize.title}`,
                                        },
                                    },
                                    tx
                                );

                                if (!result.success) {
                                    throw new Error(
                                        `Asset distribution failed: ${result.error}`
                                    );
                                }
                            } else if (winner.prize.prizeType === 2) {
                                const spgAddress =
                                    winner.prize.collectionAddress;
                                const nftQuantity = Number(
                                    winner.prize.nftQuantity || 1
                                );

                                if (!spgAddress || nftQuantity <= 0) {
                                    throw new Error(
                                        "Invalid NFT prize configuration"
                                    );
                                }

                                const userWallet = player.user?.wallets?.[0]
                                    ?.address as `0x${string}`;
                                if (!userWallet) {
                                    throw new Error(
                                        "User wallet address not found"
                                    );
                                }

                                const result = await initialTransfer({
                                    spgAddress,
                                    quantity: nftQuantity,
                                    toAddress: userWallet,
                                });

                                if (!result) {
                                    throw new Error("NFT transfer failed");
                                }

                                distributionTxHash =
                                    "txHash" in result
                                        ? result.txHash
                                        : result.txHashes?.[0];
                            }

                            return {
                                resultId: winner.resultId,
                                participantId: winner.participantId,
                                playerName:
                                    player.nickname ||
                                    player.name ||
                                    `Player ${player.id.slice(-6)}`,
                                prizeTitle: winner.prize.title,
                                success: true,
                                txHash: distributionTxHash,
                            };
                        } catch (error) {
                            return {
                                resultId: winner.resultId,
                                participantId: winner.participantId,
                                playerName: `Unknown (${winner.playerAddress.slice(
                                    0,
                                    6
                                )}...)`,
                                prizeTitle: winner.prize.title,
                                success: false,
                                error:
                                    error instanceof Error
                                        ? error.message
                                        : "Unknown error",
                            };
                        }
                    });
                })
            );

            batchResults.forEach((result, index) => {
                if (result.status === "fulfilled") {
                    const distributionResult = result.value;
                    allDistributionResults.push(distributionResult);

                    if (distributionResult.success) {
                        totalDistributed++;
                    } else {
                        totalFailed++;
                    }
                } else {
                    totalFailed++;
                    const winner = batchWinners[index];
                    allDistributionResults.push({
                        resultId: winner.resultId,
                        participantId: winner.participantId,
                        playerName: `Unknown (${winner.playerAddress.slice(
                            0,
                            6
                        )}...)`,
                        prizeTitle: winner.prize.title,
                        success: false,
                        error:
                            result.reason instanceof Error
                                ? result.reason.message
                                : "Transaction failed",
                    });
                }
            });
        }

        return {
            success: true,
            data: {
                distributed: totalDistributed,
                failed: totalFailed,
                totalProcessed: totalDistributed + totalFailed,
                totalBatches,
                distributionResults: allDistributionResults,
            },
        };
    } catch (error) {
        console.error("❌ Error distributing onchain prizes:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to distribute onchain prizes",
        };
    }
}
