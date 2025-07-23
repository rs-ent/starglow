/// app/actions/raffles/web3/actions-write.ts

"use server";

import { getContract, decodeEventLog, parseEventLogs } from "viem";

interface ParticipatedAndDrawnEvent {
    raffleId: bigint;
    player: string;
    participantId: bigint;
    prizeIndex: bigint;
    resultId: bigint;
    timestamp: bigint;
}

interface ParsedEventLog {
    eventName: string;
    args: ParticipatedAndDrawnEvent;
}

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
import { estimateGasComprehensive } from "@/app/story/interaction/actions";
import { getDefaultUserWalletAddress } from "@/app/story/userWallet/actions";

const abi = rafflesJson.abi;

interface RetryConfig {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
    retryableErrors: string[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 5, // 3에서 5로 증가
    baseDelayMs: 2000, // 1000에서 2000으로 증가
    maxDelayMs: 15000, // 10000에서 15000으로 증가
    retryableErrors: [
        "network error",
        "timeout",
        "connection",
        "rpc",
        "gas",
        "nonce",
        "replacement",
        "underpriced",
    ],
};

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function extractRevertReason(
    publicClient: any,
    txHash: string
): Promise<string | null> {
    try {
        const tx = await publicClient.getTransaction({
            hash: txHash as `0x${string}`,
        });

        if (!tx) return null;

        try {
            await publicClient.call({
                ...tx,
                blockNumber: tx.blockNumber || "latest",
            });
            return null;
        } catch (callError: any) {
            const errorData = callError?.data || callError?.message || "";

            if (
                typeof errorData === "string" &&
                errorData.includes("0x08c379a0")
            ) {
                try {
                    const reasonHex = errorData.slice(-64);
                    const reasonBytes = Buffer.from(reasonHex, "hex");
                    const reason = reasonBytes
                        .toString("utf8")
                        .replace(/\0/g, "")
                        .trim();
                    return reason || null;
                } catch {
                    return null;
                }
            }

            if (typeof errorData === "string") {
                const revertMatch = errorData.match(/revert (.+?)(?:\s|$)/i);
                if (revertMatch) {
                    return revertMatch[1].trim();
                }
            }

            return null;
        }
    } catch (error) {
        console.warn("Failed to extract revert reason:", error);
        return null;
    }
}

function isRetryableError(error: any): boolean {
    const errorMessage = (
        error?.message ||
        error?.toString() ||
        ""
    ).toLowerCase();

    const nonRetryablePatterns = [
        "reverted",
        "execution reverted",
        "insufficient funds",
        "already participated",
        "raffle not active",
        "raffle ended",
        "invalid participant",
        "out of bounds",
        "already drawn",
    ];

    if (
        nonRetryablePatterns.some((pattern) => errorMessage.includes(pattern))
    ) {
        return false;
    }

    const retryablePatterns = [
        "network error",
        "timeout",
        "connection",
        "rpc",
        "gas price",
        "nonce",
        "replacement",
        "underpriced",
    ];

    return retryablePatterns.some((pattern) => errorMessage.includes(pattern));
}

function shouldRetry(
    error: any,
    attempt: number,
    config: RetryConfig
): boolean {
    if (attempt >= config.maxRetries) return false;
    return isRetryableError(error);
}

function calculateDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
    return Math.min(exponentialDelay, config.maxDelayMs);
}

async function executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                const delay = calculateDelay(attempt - 1, config);
                await sleep(delay);
            }

            return await operation();
        } catch (error) {
            lastError = error;

            if (!shouldRetry(error, attempt, config)) {
                console.error(`❌ ${operationName} failed permanently:`, error);
                break;
            }

            console.warn(
                `⚠️ ${operationName} failed (attempt ${attempt + 1}/${
                    config.maxRetries + 1
                }):`,
                error
            );
        }
    }

    throw lastError;
}

export interface DistributePrizeInput {
    playerId: string;
    prize: any;
    prizeTitle: string;
    playerWalletAddress: string;
    tx?: any;
}

export interface DistributePrizeResult {
    success: boolean;
    error?: string;
    distributedAmount?: number;
    distributionMethod?: "ASSET" | "NFT" | "TOKEN";
    txHash?: string;
}

export async function distributePrize(
    input: DistributePrizeInput
): Promise<DistributePrizeResult> {
    const { playerId, prize, prizeTitle, playerWalletAddress, tx } = input;

    try {
        if (prize.prizeType === 0) {
            // EMPTY 타입 - 빈 상품 (꽝)
            return {
                success: true,
                distributedAmount: 0,
                distributionMethod: "EMPTY" as any,
            };
        } else if (prize.prizeType === 1) {
            // ASSET 타입 - 오프체인 에셋 처리
            const assetId = prize.assetId;
            const assetAmount = Number(prize.prizeQuantity || 1);

            if (!assetId || assetAmount <= 0) {
                return {
                    success: false,
                    error: "Invalid asset prize configuration",
                };
            }

            const assetResult = await updatePlayerAsset(
                {
                    transaction: {
                        playerId,
                        assetId,
                        amount: assetAmount,
                        operation: "ADD",
                        reason: `Raffle prize: ${prizeTitle}`,
                    },
                },
                tx
            );

            if (!assetResult.success) {
                return {
                    success: false,
                    error: `Failed to distribute asset prize: ${assetResult.error}`,
                };
            }

            return {
                success: true,
                distributedAmount: assetAmount,
                distributionMethod: "ASSET",
            };
        } else if (prize.prizeType === 2) {
            // NFT 타입 - SPG 컬렉션 처리
            const spgAddress = prize.collectionAddress;
            const nftQuantity = Number(prize.prizeQuantity || 1);

            if (!spgAddress || nftQuantity <= 0) {
                return {
                    success: false,
                    error: "Invalid NFT prize configuration",
                };
            }

            const nftResult = await initialTransfer({
                spgAddress,
                quantity: nftQuantity,
                toAddress: playerWalletAddress as `0x${string}`,
            });

            if (!nftResult) {
                return {
                    success: false,
                    error: "Failed to transfer NFT prize",
                };
            }

            const txHash =
                typeof nftResult === "object" && nftResult !== null
                    ? "txHash" in nftResult
                        ? nftResult.txHash
                        : "txHashes" in nftResult
                        ? nftResult.txHashes?.[0]
                        : undefined
                    : undefined;

            return {
                success: true,
                distributedAmount: nftQuantity,
                distributionMethod: "NFT",
                txHash,
            };
        } else if (prize.prizeType === 3) {
            // TOKEN 타입 - 아직 구현되지 않음
            return {
                success: false,
                error: "TOKEN prize type not yet implemented",
            };
        } else {
            return {
                success: false,
                error: `Unknown prize type: ${prize.prizeType}`,
            };
        }
    } catch (error) {
        console.error("Error distributing prize:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to distribute prize",
        };
    }
}

/**
 * ParticipateAndDraw : 참가 + 추첨 => instant draw 래플만 지원 (사용자 가스비 지불)
 * Participate : 일반 참가 => 모든 래플 지원 (관리자 가스비 대납)
 * BatchDraw : 배치 추첨 => 관리자용 일반 래플 추첨
 */

export interface ParticipateAndDrawInput {
    contractAddress: string;
    raffleId: string;
    playerId: string;
    userId: string;
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
            order: number;
            rarity: number;
        };
        entryFeePaid: number;
        walletAddress: string;
    };
    error?: string;
}

export async function participateAndDraw(
    input: ParticipateAndDrawInput
): Promise<ParticipateAndDrawResult> {
    const startTime = Date.now(); // 성능 모니터링 시작

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

        const [playerWallet, publicClient, walletClient] = await Promise.all([
            getDefaultUserWalletAddress({ userId: input.userId }),
            fetchPublicClient({ network: raffle.network }),
            fetchWalletClient({
                network: raffle.network,
                walletAddress: raffle.deployedBy as `0x${string}`,
            }),
        ]);

        if (!playerWallet) {
            return { success: false, error: "Player wallet not found" };
        }

        const raffleContract = getContract({
            address: raffle.contractAddress as `0x${string}`,
            abi,
            client: publicClient,
        });

        // 🚀 래플 정보 조회와 참가비 검증 병렬 처리
        const [contractRaffle] = await Promise.all([
            (raffleContract.read as any).getRaffle([BigInt(input.raffleId)]),
        ]);

        // 즉시 추첨 래플인지 확인
        if (!contractRaffle.timing.instantDraw) {
            return {
                success: false,
                error: "This function only supports instant draw raffles",
            };
        }

        // 🔍 참가비 사전 검증 (스마트 컨트랙트 호출 전)
        const entryFeeAmount = Number(
            contractRaffle.fee.participationFeeAmount
        );
        const entryFeeAssetId = contractRaffle.fee.participationFeeAssetId;

        if (entryFeeAssetId && entryFeeAmount > 0) {
            const feeValidation = await validatePlayerAsset({
                playerId: input.playerId,
                assetId: entryFeeAssetId,
                requiredAmount: entryFeeAmount,
            });

            if (!feeValidation.success) {
                return {
                    success: false,
                    error: `Insufficient entry fee: ${feeValidation.error}`,
                };
            }
        }

        const raffleContractWrite = getContract({
            address: raffle.contractAddress as `0x${string}`,
            abi,
            client: walletClient,
        });

        // 🚀 트랜잭션 호출에도 재시도 로직 추가
        const participateAndDrawTx = await executeWithRetry(
            async () => {
                return await (
                    raffleContractWrite.write as any
                ).participateAndDraw([
                    BigInt(input.raffleId),
                    playerWallet as `0x${string}`,
                ]);
            },
            "participateAndDraw transaction",
            {
                maxRetries: 3,
                baseDelayMs: 3000,
                maxDelayMs: 12000,
                retryableErrors: [
                    "network error",
                    "timeout",
                    "connection",
                    "rpc",
                    "gas",
                    "nonce",
                    "replacement",
                    "underpriced",
                ],
            }
        );

        const receipt = await executeWithRetry(
            async () => {
                const txReceipt = await publicClient.waitForTransactionReceipt({
                    hash: participateAndDrawTx,
                    timeout: 90000, // 30초에서 90초로 증가
                });

                if (txReceipt.status !== "success") {
                    let errorMessage = `Transaction failed with status: ${txReceipt.status}`;

                    if (txReceipt.status === "reverted") {
                        const revertReason = await extractRevertReason(
                            publicClient,
                            participateAndDrawTx
                        );

                        if (revertReason) {
                            if (
                                revertReason
                                    .toLowerCase()
                                    .includes("already participated")
                            ) {
                                errorMessage =
                                    "You have already participated in this raffle";
                            } else if (
                                revertReason
                                    .toLowerCase()
                                    .includes("raffle ended") ||
                                revertReason
                                    .toLowerCase()
                                    .includes("not active")
                            ) {
                                errorMessage =
                                    "This raffle is no longer active";
                            } else if (
                                revertReason
                                    .toLowerCase()
                                    .includes("insufficient")
                            ) {
                                errorMessage =
                                    "Insufficient balance to participate";
                            } else {
                                errorMessage = revertReason;
                            }
                        } else {
                            errorMessage =
                                "Transaction timeout. The raffle participation may still be processing.";
                        }
                    }

                    const revertError = new Error(errorMessage);
                    (revertError as any).isRevert =
                        txReceipt.status === "reverted";
                    throw revertError;
                }

                return txReceipt;
            },
            "transaction receipt confirmation",
            {
                maxRetries: 3, // 1에서 3으로 증가
                baseDelayMs: 5000, // 3000에서 5000으로 증가
                maxDelayMs: 15000, // 6000에서 15000으로 증가
                retryableErrors: [
                    "timeout",
                    "network error",
                    "connection",
                    "rpc",
                    "replacement",
                ],
            }
        );

        if (entryFeeAssetId && entryFeeAmount > 0) {
            const feeDeductionResult = await updatePlayerAsset({
                transaction: {
                    playerId: input.playerId,
                    assetId: entryFeeAssetId,
                    amount: entryFeeAmount,
                    operation: "SUBTRACT",
                    reason: `Raffle participation: ${contractRaffle.basicInfo.title}`,
                },
            });

            // 참가비 차감 실패 시 early return
            if (!feeDeductionResult.success) {
                console.error(
                    `CRITICAL: User participated in raffle but fee deduction failed`,
                    {
                        raffleId: input.raffleId,
                        playerId: input.playerId,
                        txHash: participateAndDrawTx,
                        feeError: feeDeductionResult.error,
                    }
                );

                return {
                    success: false,
                    error: `Participation completed but payment processing failed. Please contact support with transaction: ${participateAndDrawTx}`,
                };
            }
        }

        let participantId = 0;
        let prizeIndex = 0;

        // 🚀 최적화: parseEventLogs로 ParticipatedAndDrawn 이벤트만 효율적으로 파싱
        const participatedAndDrawnEvents = parseEventLogs({
            abi,
            logs: receipt.logs,
            eventName: "ParticipatedAndDrawn",
        }) as unknown as ParsedEventLog[];

        const targetEvent = participatedAndDrawnEvents.find((event) => {
            return event.args.raffleId.toString() === input.raffleId;
        });

        if (targetEvent) {
            participantId = Number(targetEvent.args.participantId);
            prizeIndex = Number(targetEvent.args.prizeIndex);
        }

        const prize = contractRaffle.prizes[prizeIndex];
        if (!prize) {
            throw new Error("Prize not found");
        }

        const result = {
            txHash: participateAndDrawTx,
            blockNumber: Number(receipt.blockNumber),
            participantId,
            prizeIndex,
            prize,
            entryFeeAmount,
        };

        // 🎁 백그라운드 상금 분배: 사용자 응답 속도 최적화
        distributePrize({
            playerId: input.playerId,
            prize,
            prizeTitle: prize.title || `Prize ${prizeIndex + 1}`,
            playerWalletAddress: playerWallet,
        }).catch((error) => {
            console.error(
                `⚠️ Background prize distribution failed for player ${input.playerId}:`,
                error
            );
        });

        // 🔍 성능 모니터링 로깅
        const executionTime = Date.now() - startTime;
        console.info(`✅ participateAndDraw success - ${executionTime}ms`, {
            raffleId: input.raffleId,
            contractAddress: input.contractAddress,
            executionTimeMs: executionTime,
            prizeIndex: result.prizeIndex,
            entryFee: result.entryFeeAmount,
        });

        return {
            success: true,
            data: {
                participationId: `${raffle.contractAddress}_${input.raffleId}_${playerWallet}`,
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
                    order: Number(result.prize.order || 0),
                    rarity: Number(result.prize.rarity || 0),
                },
                entryFeePaid: result.entryFeeAmount,
                walletAddress: playerWallet,
            },
        };
    } catch (error) {
        // 🔍 에러 성능 모니터링 로깅
        const executionTime = Date.now() - startTime;
        console.error(`❌ participateAndDraw failed - ${executionTime}ms`, {
            raffleId: input.raffleId,
            contractAddress: input.contractAddress,
            executionTimeMs: executionTime,
            errorType:
                error instanceof Error ? error.constructor.name : "Unknown",
            errorMessage:
                error instanceof Error ? error.message : String(error),
            isRevert: (error as any)?.isRevert,
            isRetryable:
                error instanceof Error ? isRetryableError(error) : false,
        });

        let errorMessage = "Failed to participate and draw";

        if (error instanceof Error) {
            errorMessage = error.message;

            if ((error as any).isRevert) {
                console.warn(
                    "🔄 Smart contract revert detected:",
                    errorMessage
                );
            } else if (!isRetryableError(error)) {
                console.warn("🚫 Non-retryable error:", errorMessage);
            }
        }

        return {
            success: false,
            error: errorMessage,
        };
    }
}

export interface ParticipateInput {
    contractAddress: string;
    raffleId: string;
    userId: string;
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
        walletAddress: string;
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

        const playerWallet = await getDefaultUserWalletAddress({
            userId: input.userId,
        });

        if (!playerWallet) {
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

            const participateTx = await executeWithRetry(
                async () => {
                    return await (raffleContractWrite.write as any).participate(
                        [BigInt(input.raffleId), playerWallet as `0x${string}`]
                    );
                },
                "participate transaction",
                {
                    maxRetries: 2,
                    baseDelayMs: 2000,
                    maxDelayMs: 8000,
                    retryableErrors: [
                        "network error",
                        "timeout",
                        "connection",
                        "rpc",
                        "gas",
                        "nonce",
                        "replacement",
                    ],
                }
            );

            const receipt = await executeWithRetry(
                async () => {
                    const txReceipt =
                        await publicClient.waitForTransactionReceipt({
                            hash: participateTx,
                            timeout: 90000, // 60초에서 90초로 증가
                        });

                    if (txReceipt.status !== "success") {
                        let errorMessage = `Transaction failed with status: ${txReceipt.status}`;

                        if (txReceipt.status === "reverted") {
                            const revertReason = await extractRevertReason(
                                publicClient,
                                participateTx
                            );

                            if (revertReason) {
                                if (
                                    revertReason
                                        .toLowerCase()
                                        .includes("already participated")
                                ) {
                                    errorMessage =
                                        "You have already participated in this raffle";
                                } else if (
                                    revertReason
                                        .toLowerCase()
                                        .includes("raffle ended") ||
                                    revertReason
                                        .toLowerCase()
                                        .includes("not active")
                                ) {
                                    errorMessage =
                                        "This raffle is no longer active";
                                } else if (
                                    revertReason
                                        .toLowerCase()
                                        .includes("insufficient")
                                ) {
                                    errorMessage =
                                        "Insufficient balance to participate";
                                } else {
                                    errorMessage = revertReason;
                                }
                            } else {
                                errorMessage =
                                    "Looks like network is busy now. Please try again!";
                            }
                        }

                        const revertError = new Error(errorMessage);
                        (revertError as any).isRevert =
                            txReceipt.status === "reverted";
                        throw revertError;
                    }

                    return txReceipt;
                },
                "transaction receipt confirmation",
                {
                    maxRetries: 2,
                    baseDelayMs: 3000,
                    maxDelayMs: 10000,
                    retryableErrors: [
                        "timeout",
                        "network error",
                        "connection",
                        "rpc",
                    ],
                }
            );

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
                                playerWallet.toLowerCase()
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
                participationId: `${raffle.contractAddress}_${input.raffleId}_${playerWallet}`,
                txHash: result.txHash,
                blockNumber: result.blockNumber,
                participantId: result.participantId,
                ticketNumber: result.ticketNumber,
                entryFeePaid: result.entryFeeAmount,
                participatedAt: result.participatedAt,
                walletAddress: playerWallet,
            },
        };
    } catch (error) {
        console.error("❌ Error in participate:", error);

        let errorMessage = "Failed to participate in raffle";

        if (error instanceof Error) {
            errorMessage = error.message;

            if ((error as any).isRevert) {
                console.warn(
                    "🔄 Smart contract revert detected:",
                    errorMessage
                );
            } else if (!isRetryableError(error)) {
                console.warn("🚫 Non-retryable error:", errorMessage);
            }
        }

        return {
            success: false,
            error: errorMessage,
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
        distributionRecordsCreated: number;
        distributionRecordsExpected: number;
        distributionSuccess: boolean;
        distributionErrors: string[];
        batchId: string;
        performanceMetrics: {
            eventParsingTimeMs: number;
            dbOperationTimeMs: number;
            totalExecutionTimeMs: number;
        };
        gasMetrics: {
            estimatedIndividualGas: number;
            estimatedBatchGas: number;
            actualGasUsed: number;
            estimatedGasSaved: number;
            actualEfficiency: number;
            efficiencyRating:
                | "excellent"
                | "good"
                | "fair"
                | "poor"
                | "unknown";
            confidence: number;
            recommendation: "low" | "standard" | "fast" | "urgent";
        };
    };
    error?: string;
    warnings?: string[];
}

export interface BatchDrawAndDistributeInput {
    contractAddress: string;
    raffleId: string;
    batchSize?: number;
}

export interface BatchDrawAndDistributeResult {
    success: boolean;
    data?: {
        raffleId: string;
        contractAddress: string;
        totalParticipants: number;
        totalProcessed: number;
        drawSuccessful: number;
        drawFailed: number;
        distributionSuccessful: number;
        distributionFailed: number;
        startIndex: number;
        endIndex: number;
        txHash: string;
        blockNumber: number;
        prizeDistribution: {
            participantId: number;
            participantAddress: string;
            prizeIndex: number;
            distributionResult: DistributePrizeResult;
        }[];
        gasUsed: number;
        estimatedGasSaved: number;
    };
    error?: string;
}

// 🔍 구조화된 로깅 유틸리티
const createLogContext = (
    input: BatchDrawInput,
    phase: string,
    data?: any
) => ({
    timestamp: new Date().toISOString(),
    operation: "batchDraw",
    phase,
    contractAddress: input.contractAddress,
    raffleId: input.raffleId,
    batchSize: input.batchSize,
    ...data,
});

export async function batchDraw(
    input: BatchDrawInput
): Promise<BatchDrawResult> {
    const executionStartTime = Date.now();

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
                blockNumber: true,
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

        // 스마트 컨트랙트에서 래플 정보와 참가자 정보 조회
        const [totalParticipants, raffleStatus, contractRaffle] =
            await Promise.all([
                (raffleContract.read as any).getRaffleParticipants([
                    BigInt(input.raffleId),
                ]) as Promise<bigint[]>,
                (raffleContract.read as any).getRaffleStatus([
                    BigInt(input.raffleId),
                ]) as Promise<[boolean, boolean, bigint]>,
                (raffleContract.read as any).getRaffle([
                    BigInt(input.raffleId),
                ]) as Promise<any>,
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

        // 🆔 batchId 생성 (현재 시간 기반)
        const batchId = `batch_${input.contractAddress}_${
            input.raffleId
        }_${Date.now()}`;

        const walletClient = await fetchWalletClient({
            network: raffle.network,
            walletAddress: raffle.deployedBy as `0x${string}`,
        });

        const raffleContractWrite = getContract({
            address: raffle.contractAddress as `0x${string}`,
            abi,
            client: walletClient,
        });

        const batchDrawTx = await executeWithRetry(
            async () => {
                return await (raffleContractWrite.write as any).batchDraw([
                    BigInt(input.raffleId),
                    BigInt(startIndex),
                    BigInt(maxCount),
                ]);
            },
            "batchDraw transaction",
            {
                maxRetries: 3,
                baseDelayMs: 3000,
                maxDelayMs: 15000,
                retryableErrors: [
                    "network error",
                    "timeout",
                    "connection",
                    "rpc",
                    "gas",
                    "nonce",
                    "replacement",
                    "underpriced",
                ],
            }
        );

        const receipt = await executeWithRetry(
            async () => {
                const txReceipt = await publicClient.waitForTransactionReceipt({
                    hash: batchDrawTx,
                    timeout: 120000,
                });

                if (txReceipt.status !== "success") {
                    let errorMessage = `Batch draw transaction failed with status: ${txReceipt.status}`;

                    if (txReceipt.status === "reverted") {
                        const revertReason = await extractRevertReason(
                            publicClient,
                            batchDrawTx
                        );

                        if (revertReason) {
                            if (
                                revertReason
                                    .toLowerCase()
                                    .includes("already drawn")
                            ) {
                                errorMessage =
                                    "This raffle has already been drawn";
                            } else if (
                                revertReason
                                    .toLowerCase()
                                    .includes("raffle not active") ||
                                revertReason
                                    .toLowerCase()
                                    .includes("not active")
                            ) {
                                errorMessage =
                                    "This raffle is no longer active";
                            } else if (
                                revertReason
                                    .toLowerCase()
                                    .includes("insufficient participants")
                            ) {
                                errorMessage =
                                    "Insufficient participants for batch draw";
                            } else {
                                errorMessage = revertReason;
                            }
                        } else {
                            errorMessage =
                                "Batch draw failed. Please try again. If this error occurs repeatedly, please contact our support team";
                        }
                    }

                    const revertError = new Error(errorMessage);
                    (revertError as any).isRevert =
                        txReceipt.status === "reverted";
                    throw revertError;
                }

                return txReceipt;
            },
            "batch draw receipt confirmation",
            {
                maxRetries: 3,
                baseDelayMs: 5000,
                maxDelayMs: 20000,
                retryableErrors: [
                    "timeout",
                    "network error",
                    "connection",
                    "rpc",
                ],
            }
        );

        // 📊 먼저 예상 처리 개수 계산
        const endIndex = Math.min(startIndex + maxCount, totalParticipantCount);
        const expectedProcessed = endIndex - startIndex;

        // 🎯 개선된 추첨 결과 파싱 및 OnchainRafflePrizeDistribution 레코드 생성
        const distributionRecords: any[] = [];
        const prizeIndices: number[] = [];
        const parsingErrors: string[] = [];
        let actualProcessed = 0;
        const eventParsingStartTime = Date.now();

        if (receipt.logs && receipt.logs.length > 0) {
            // 🔄 재시도 로직이 포함된 이벤트 파싱
            const lotteryDrawnEvents: Array<{
                resultId: number;
                participantId: number;
                playerAddress: string;
                prizeIndex: number;
                ticketNumber: string;
                randomValue: string;
                timestamp: number;
                logIndex: number; // 디버깅용
            }> = [];

            // 첫 번째 패스: 기본 이벤트 파싱
            for (let i = 0; i < receipt.logs.length; i++) {
                const log = receipt.logs[i];
                try {
                    const decoded = decodeEventLog({
                        abi,
                        data: log.data,
                        topics: log.topics,
                        eventName: "LotteryDrawn",
                    }) as any;

                    if (decoded.args.raffleId.toString() === input.raffleId) {
                        lotteryDrawnEvents.push({
                            resultId: Number(decoded.args.resultId),
                            participantId: Number(decoded.args.participantId),
                            playerAddress: decoded.args.player.toLowerCase(),
                            prizeIndex: Number(decoded.args.prizeIndex),
                            ticketNumber: decoded.args.ticketNumber,
                            randomValue: decoded.args.randomValue.toString(),
                            timestamp: Number(decoded.args.timestamp),
                            logIndex: i,
                        });
                        prizeIndices.push(Number(decoded.args.prizeIndex));
                        actualProcessed++;
                    }
                } catch (error) {
                    parsingErrors.push(
                        `Log ${i} parsing failed: ${
                            error instanceof Error
                                ? error.message
                                : "Unknown error"
                        }`
                    );
                    continue;
                }
            }

            // 🔄 두 번째 패스: 실패한 로그에 대한 대안 파싱 시도
            if (
                parsingErrors.length > 0 &&
                actualProcessed < expectedProcessed
            ) {
                console.warn(
                    `🔄 Attempting alternative parsing for ${parsingErrors.length} failed logs`
                );

                for (let i = 0; i < receipt.logs.length; i++) {
                    const log = receipt.logs[i];

                    // 이미 성공한 로그는 스킵
                    if (
                        lotteryDrawnEvents.some((event) => event.logIndex === i)
                    ) {
                        continue;
                    }

                    try {
                        // 더 관대한 파싱 시도 (타입 체크 완화)
                        if (log.topics[0] === null) continue; // 이벤트 시그니처가 없으면 스킵

                        const decoded = decodeEventLog({
                            abi,
                            data: log.data,
                            topics: log.topics,
                        }) as any;

                        // LotteryDrawn 이벤트인지 추가 확인
                        if (
                            decoded.eventName === "LotteryDrawn" &&
                            decoded.args?.raffleId?.toString() ===
                                input.raffleId
                        ) {
                            lotteryDrawnEvents.push({
                                resultId: Number(decoded.args.resultId || 0),
                                participantId: Number(
                                    decoded.args.participantId || 0
                                ),
                                playerAddress: (
                                    decoded.args.player || ""
                                ).toLowerCase(),
                                prizeIndex: Number(
                                    decoded.args.prizeIndex || 0
                                ),
                                ticketNumber: decoded.args.ticketNumber || "",
                                randomValue: (
                                    decoded.args.randomValue || 0
                                ).toString(),
                                timestamp: Number(
                                    decoded.args.timestamp || Date.now() / 1000
                                ),
                                logIndex: i,
                            });
                            prizeIndices.push(
                                Number(decoded.args.prizeIndex || 0)
                            );
                            actualProcessed++;
                        }
                    } catch (secondError) {
                        // 두 번째 시도도 실패한 경우 더 상세한 로깅
                        console.error(
                            `❌ Log ${i} failed both parsing attempts:`,
                            {
                                firstError: parsingErrors.find((e) =>
                                    e.startsWith(`Log ${i}`)
                                ),
                                secondError:
                                    secondError instanceof Error
                                        ? secondError.message
                                        : "Unknown error",
                                logData: {
                                    topics: log.topics,
                                    dataLength: log.data?.length,
                                },
                            }
                        );
                    }
                }
            }

            // 🔍 Player 주소들을 playerId로 매핑
            if (lotteryDrawnEvents.length > 0) {
                const playerAddresses = [
                    ...new Set(lotteryDrawnEvents.map((e) => e.playerAddress)),
                ];

                // Wallet을 통해 직접 Player 조회
                const wallets = await prisma.wallet.findMany({
                    where: {
                        address: {
                            in: playerAddresses,
                            mode: "insensitive",
                        },
                        status: "ACTIVE",
                    },
                    include: {
                        user: {
                            include: {
                                player: true,
                            },
                        },
                    },
                });

                // 주소 -> playerId 매핑 생성
                const addressToPlayerMap = new Map<
                    string,
                    { id: string; name: string }
                >();
                wallets.forEach((wallet: any) => {
                    if (wallet.user?.player) {
                        const player = wallet.user.player;
                        addressToPlayerMap.set(wallet.address.toLowerCase(), {
                            id: player.id,
                            name:
                                player.nickname ||
                                player.name ||
                                `Player ${player.id.slice(-6)}`,
                        });
                    }
                });

                // 🎁 OnchainRafflePrizeDistribution 레코드 생성
                for (let i = 0; i < lotteryDrawnEvents.length; i++) {
                    const event = lotteryDrawnEvents[i];
                    const playerInfo = addressToPlayerMap.get(
                        event.playerAddress
                    );

                    if (!playerInfo) {
                        console.warn(
                            `Player not found for address: ${event.playerAddress}`
                        );
                        continue;
                    }

                    const prize = contractRaffle.prizes[event.prizeIndex];
                    if (!prize) {
                        console.warn(
                            `Prize not found at index ${event.prizeIndex}`
                        );
                        continue;
                    }

                    distributionRecords.push({
                        contractAddress: input.contractAddress,
                        raffleId: input.raffleId,
                        resultId: event.resultId,
                        batchId,
                        chunkId: Math.floor(i / 1000).toString(), // 1000개씩 chunk 분할
                        prizeIndex: event.prizeIndex,
                        prizeType: Number(prize.prizeType),
                        prizeTitle:
                            prize.title || `Prize ${event.prizeIndex + 1}`,
                        assetId: prize.assetId || null,
                        spgAddress: prize.collectionAddress || null,
                        tokenAddress: prize.tokenAddress || null,
                        amount: Number(prize.prizeQuantity || 1),
                        playerId: playerInfo.id,
                        playerAddress: event.playerAddress,
                        status: "PENDING",
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
            }
        }

        // 🚀 개선된 배치 insert로 DB에 저장
        let insertedCount = 0;
        const distributionErrors: string[] = [];
        const dbOperationStartTime = Date.now();

        if (distributionRecords.length > 0) {
            try {
                // 청크 단위로 분할하여 안전한 배치 처리
                const CHUNK_SIZE = 1000;
                const chunks: any[] = [];
                for (
                    let i = 0;
                    i < distributionRecords.length;
                    i += CHUNK_SIZE
                ) {
                    chunks.push(distributionRecords.slice(i, i + CHUNK_SIZE));
                }

                await prisma.$transaction(
                    async (tx) => {
                        for (let i = 0; i < chunks.length; i++) {
                            try {
                                const result =
                                    await tx.onchainRafflePrizeDistribution.createMany(
                                        {
                                            data: chunks[i],
                                            skipDuplicates: true,
                                        }
                                    );
                                insertedCount += result.count;
                            } catch (chunkError) {
                                const errorMsg = `Chunk ${i + 1} failed: ${
                                    chunkError instanceof Error
                                        ? chunkError.message
                                        : "Unknown error"
                                }`;
                                distributionErrors.push(errorMsg);
                                console.error(`❌ ${errorMsg}`);

                                // 개별 레코드로 재시도 (더 안전한 접근)
                                for (const record of chunks[i]) {
                                    try {
                                        await tx.onchainRafflePrizeDistribution.create(
                                            {
                                                data: record,
                                            }
                                        );
                                        insertedCount++;
                                    } catch (recordError) {
                                        distributionErrors.push(
                                            `Record ${
                                                record.resultId
                                            } failed: ${
                                                recordError instanceof Error
                                                    ? recordError.message
                                                    : "Unknown error"
                                            }`
                                        );
                                    }
                                }
                            }
                        }
                    },
                    {
                        maxWait: 90000, // 1.5분 대기
                        timeout: 180000, // 3분 타임아웃
                    }
                );

                if (distributionErrors.length > 0) {
                    console.warn(
                        `⚠️  ${distributionErrors.length} errors occurred during distribution record creation`
                    );
                }
            } catch (error) {
                const errorMsg = `Critical DB operation failed: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`;
                distributionErrors.push(errorMsg);
                console.error(`❌ ${errorMsg}`);
            }
        }

        const dbOperationEndTime = Date.now();
        const totalExecutionEndTime = Date.now();
        const gasUsed = Number(receipt.gasUsed || 0);

        // 🔧 동적 가스 추정 (estimateGasComprehensive 사용)
        let gasMetrics: {
            estimatedIndividualGas: number;
            estimatedBatchGas: number;
            actualGasUsed: number;
            estimatedGasSaved: number;
            actualEfficiency: number;
            efficiencyRating:
                | "excellent"
                | "good"
                | "fair"
                | "poor"
                | "unknown";
            confidence: number;
            recommendation: "low" | "standard" | "fast" | "urgent";
        } = {
            estimatedIndividualGas: 0,
            estimatedBatchGas: 0,
            actualGasUsed: gasUsed,
            estimatedGasSaved: 0,
            actualEfficiency: 0,
            efficiencyRating: "unknown",
            confidence: 0,
            recommendation: "standard",
        };

        try {
            // 🎯 실제 배치 트랜잭션 가스 추정
            const batchGasEstimation = await estimateGasComprehensive({
                networkId: raffle.network.id,
                walletAddress: raffle.deployedBy,
                contractAddress: raffle.contractAddress as `0x${string}`,
                abi,
                functionName: "batchDraw",
                args: [
                    BigInt(input.raffleId),
                    BigInt(startIndex),
                    BigInt(Math.min(input.batchSize || 50, 100)),
                ],
                gasMultiplier: 1.2, // 약간의 여유
                maxRetries: 2,
            });

            // 🔄 개별 트랜잭션들의 추정 가스 (참고용)
            const individualDrawEstimation = await estimateGasComprehensive({
                networkId: raffle.network.id,
                walletAddress: raffle.deployedBy,
                contractAddress: raffle.contractAddress as `0x${string}`,
                abi,
                functionName: "draw",
                args: [BigInt(input.raffleId), BigInt(1)], // 샘플 participantId
                gasMultiplier: 1.1,
                maxRetries: 1,
            });

            const estimatedIndividualGas =
                Number(individualDrawEstimation.estimatedGas) *
                expectedProcessed;
            const estimatedBatchGas = Number(batchGasEstimation.estimatedGas);
            const estimatedGasSaved = Math.max(
                0,
                estimatedIndividualGas - estimatedBatchGas
            );
            const actualEfficiency =
                gasUsed > 0
                    ? (estimatedIndividualGas - gasUsed) /
                      estimatedIndividualGas
                    : 0;

            gasMetrics = {
                estimatedIndividualGas,
                estimatedBatchGas,
                actualGasUsed: gasUsed,
                estimatedGasSaved,
                actualEfficiency: Math.round(actualEfficiency * 100) / 100,
                efficiencyRating:
                    actualEfficiency > 0.6
                        ? "excellent"
                        : actualEfficiency > 0.4
                        ? "good"
                        : actualEfficiency > 0.2
                        ? "fair"
                        : "poor",
                confidence: batchGasEstimation.confidence,
                recommendation: batchGasEstimation.recommendation,
            };
        } catch (gasEstimationError) {
            console.warn(
                "⚠️ Gas estimation failed, using fallback calculation",
                createLogContext(input, "GAS_ESTIMATION_FALLBACK", {
                    error:
                        gasEstimationError instanceof Error
                            ? gasEstimationError.message
                            : "Unknown error",
                })
            );

            // 📊 Fallback: 간단한 계산
            const fallbackIndividualGas = expectedProcessed * 150000; // 보수적 추정
            const fallbackBatchGas = Math.round(fallbackIndividualGas * 0.7); // 30% 절약 가정
            const actualEfficiency =
                gasUsed > 0
                    ? (fallbackIndividualGas - gasUsed) / fallbackIndividualGas
                    : 0;

            gasMetrics = {
                estimatedIndividualGas: fallbackIndividualGas,
                estimatedBatchGas: fallbackBatchGas,
                actualGasUsed: gasUsed,
                estimatedGasSaved: Math.max(
                    0,
                    fallbackIndividualGas - fallbackBatchGas
                ),
                actualEfficiency: Math.round(actualEfficiency * 100) / 100,
                efficiencyRating: "unknown",
                confidence: 50, // 낮은 신뢰도
                recommendation: "standard",
            };
        }

        const distributionSuccess =
            insertedCount === distributionRecords.length &&
            distributionErrors.length === 0;
        const warnings: string[] = [];

        // ⚠️ 개선된 경고 상황들 체크
        if (!distributionSuccess) {
            warnings.push(
                `Distribution partially failed: ${insertedCount}/${distributionRecords.length} records saved`
            );
            if (distributionErrors.length > 0) {
                warnings.push(
                    `Distribution errors: ${distributionErrors
                        .slice(0, 3)
                        .join("; ")}${
                        distributionErrors.length > 3 ? "..." : ""
                    }`
                );
            }
        }

        if (actualProcessed !== expectedProcessed) {
            warnings.push(
                `Event parsing incomplete: ${actualProcessed}/${expectedProcessed} events processed`
            );
            if (parsingErrors.length > 0) {
                warnings.push(
                    `Parsing errors: ${parsingErrors.slice(0, 2).join("; ")}${
                        parsingErrors.length > 2 ? "..." : ""
                    }`
                );
            }
        }

        // 🔧 정교한 가스 효율성 경고
        if (gasMetrics.actualEfficiency < 0.3) {
            warnings.push(
                `Poor gas efficiency: ${Math.round(
                    gasMetrics.actualEfficiency * 100
                )}% (${gasMetrics.efficiencyRating})`
            );
        }

        if (gasUsed > gasMetrics.estimatedBatchGas * 1.3) {
            warnings.push(
                `Unexpectedly high gas: ${gasUsed} vs estimated ${gasMetrics.estimatedBatchGas}`
            );
        }

        // 🎯 성능 임계값 경고
        const eventParsingTimeMs = Date.now() - eventParsingStartTime;
        if (eventParsingTimeMs > 5000) {
            warnings.push(`Slow event parsing: ${eventParsingTimeMs}ms`);
        }

        if (dbOperationEndTime - dbOperationStartTime > 10000) {
            warnings.push(
                `Slow DB operation: ${
                    dbOperationEndTime - dbOperationStartTime
                }ms`
            );
        }

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
                estimatedGasSaved: gasMetrics.estimatedGasSaved,
                distributionRecordsCreated: insertedCount,
                distributionRecordsExpected: distributionRecords.length,
                distributionSuccess,
                distributionErrors,
                batchId,
                performanceMetrics: {
                    eventParsingTimeMs: Math.max(
                        0,
                        dbOperationStartTime - executionStartTime
                    ),
                    dbOperationTimeMs:
                        dbOperationEndTime - dbOperationStartTime,
                    totalExecutionTimeMs:
                        totalExecutionEndTime - executionStartTime,
                },
                gasMetrics,
            },
            warnings: warnings.length > 0 ? warnings : undefined,
        };
    } catch (error) {
        console.error("❌ Error in batch draw:", error);

        let errorMessage = "Failed to batch draw raffle";

        if (error instanceof Error) {
            errorMessage = error.message;

            if ((error as any).isRevert) {
                console.warn(
                    "🔄 Smart contract revert detected:",
                    errorMessage
                );
            } else if (!isRetryableError(error)) {
                console.warn("🚫 Non-retryable error:", errorMessage);
            }
        }

        const defaultGasMetrics = {
            estimatedIndividualGas: 0,
            estimatedBatchGas: 0,
            actualGasUsed: 0,
            estimatedGasSaved: 0,
            actualEfficiency: 0,
            efficiencyRating: "unknown" as const,
            confidence: 0,
            recommendation: "standard" as const,
        };

        return {
            success: false,
            error: errorMessage,
            data: {
                raffleId: input.raffleId || "",
                contractAddress: input.contractAddress || "",
                totalParticipants: 0,
                totalProcessed: 0,
                successful: 0,
                failed: 0,
                startIndex: 0,
                endIndex: 0,
                txHash: "",
                blockNumber: 0,
                prizeIndices: [],
                gasUsed: 0,
                estimatedGasSaved: 0,
                distributionRecordsCreated: 0,
                distributionRecordsExpected: 0,
                distributionSuccess: false,
                distributionErrors: [],
                batchId: "",
                performanceMetrics: {
                    eventParsingTimeMs: 0,
                    dbOperationTimeMs: 0,
                    totalExecutionTimeMs: Date.now() - executionStartTime,
                },
                gasMetrics: defaultGasMetrics,
            },
        };
    }
}
