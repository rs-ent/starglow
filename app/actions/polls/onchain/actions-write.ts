"use server";

import { getContract, parseEventLogs } from "viem";

// 🎯 타입 안전성을 위한 이벤트 인터페이스 정의
interface PollParticipatedEvent {
    participationId: bigint;
    pollId: bigint;
    participant: string;
    optionId: string;
    isBetting: boolean;
    bettingAssetId: string;
    bettingAmount: bigint;
    timestamp: bigint;
}

interface ParsedPollEventLog {
    eventName: string;
    args: PollParticipatedEvent;
}

import { prisma } from "@/lib/prisma/client";
import { fetchPublicClient, fetchWalletClient } from "@/app/story/client";
import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";
import { getDefaultUserWalletAddress } from "@/app/story/userWallet/actions";

import pollsJson from "@/web3/artifacts/contracts/Polls.sol/Polls.json";

const abi = pollsJson.abi;

interface RetryConfig {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
    retryableErrors: string[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    retryableErrors: [
        "network error",
        "timeout",
        "connection",
        "rpc",
        "gas",
        "nonce",
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
        "poll not active",
        "poll ended",
        "invalid option",
        "not exist",
        "not started",
        "ended",
        "invalid_option",
        "already_participated",
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

export interface ParticipatePollInput {
    contractAddressId: string;
    pollId: string;
    userId: string;
    optionId: string;
    isBetting?: boolean;
    bettingAssetId?: string;
    bettingAmount?: number;
    estimateGas?: boolean;
    gasSpeedMultiplier?: number; // 1 = normal, 2 = 2x faster, 50 = 50x faster
}

export interface ParticipatePollResult {
    success: boolean;
    data?: {
        participationId: string;
        txHash: string;
        blockNumber: number;
        participantAddress: string;
        optionId: string;
        isBetting: boolean;
        bettingAssetId: string;
        bettingAmount: number;
        timestamp: number;
        gasEstimate?: {
            gasEstimate: string;
            gasPrice: string;
            estimatedCost: string;
        };
    };
    error?: string;
}

export async function participatePollOnchain(
    input: ParticipatePollInput
): Promise<ParticipatePollResult> {
    try {
        const {
            contractAddressId,
            pollId,
            userId,
            optionId,
            isBetting = false,
            bettingAssetId = "",
            bettingAmount = 0,
            estimateGas = false,
            gasSpeedMultiplier = 1,
        } = input;

        // 1. Poll 컨트랙트 조회
        const pollContract = await prisma.onchainPollContract.findUnique({
            cacheStrategy: getCacheStrategy("fiveMinutes"),
            where: {
                id: contractAddressId,
            },
            select: {
                id: true,
                address: true,
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

        if (!pollContract) {
            return { success: false, error: "Poll contract not found" };
        }

        // 2. Player 지갑 조회
        const playerWallet = await getDefaultUserWalletAddress({
            userId: userId,
        });

        if (!playerWallet) {
            return { success: false, error: "Player wallet not found" };
        }

        // 3. 블록체인 클라이언트 초기화
        const publicClient = await fetchPublicClient({
            network: pollContract.network,
        });

        const walletClient = await fetchWalletClient({
            network: pollContract.network,
            walletAddress: pollContract.deployedBy as `0x${string}`,
        });

        const contract = getContract({
            address: pollContract.address as `0x${string}`,
            abi: abi,
            client: walletClient,
        });

        // 가스비 추정 (선택적 실행으로 성능 최적화)
        let gasEstimateData:
            | {
                  gasEstimate: string;
                  gasPrice: string;
                  estimatedCost: string;
              }
            | undefined;

        if (estimateGas) {
            try {
                const [gasEstimate, gasPrice] = await Promise.all([
                    publicClient.estimateContractGas({
                        address: pollContract.address as `0x${string}`,
                        abi,
                        functionName: "participatePoll",
                        args: [
                            BigInt(pollId),
                            optionId,
                            playerWallet as `0x${string}`,
                            isBetting,
                            bettingAssetId,
                            BigInt(bettingAmount),
                        ],
                        account: pollContract.deployedBy as `0x${string}`,
                    }),
                    publicClient.getGasPrice(),
                ]);

                const estimatedCost = gasEstimate * gasPrice;

                gasEstimateData = {
                    gasEstimate: gasEstimate.toString(),
                    gasPrice: gasPrice.toString(),
                    estimatedCost: estimatedCost.toString(),
                };
            } catch (gasError) {
                console.warn("Failed to estimate gas:", gasError);
                console.warn("Will use fallback gas limits");
            }
        }

        let baseGasEstimate: bigint;

        if (gasEstimateData?.gasEstimate) {
            baseGasEstimate = BigInt(gasEstimateData.gasEstimate);
        } else {
            // 래플의 1/2 기본값 사용 (성능과 안정성 균형)
            baseGasEstimate = BigInt(750000); // 래플의 1500000의 1/2
        }

        // 안전 마진: 추정치의 15% 추가 (기본값 사용 시 마진 줄임)
        const safetyMargin = gasEstimateData?.gasEstimate
            ? BigInt(120)
            : BigInt(110);
        const gasLimit = (baseGasEstimate * safetyMargin) / BigInt(100);

        // 가스 가격 조정 (속도 최적화)
        let finalGasPrice: bigint | undefined;
        if (gasEstimateData?.gasPrice) {
            const baseGasPrice = BigInt(gasEstimateData.gasPrice);
            const speedMultiplier = gasSpeedMultiplier || 1;
            // 가스 가격에 속도 배수 적용 (50배까지 허용)
            const clampedMultiplier = Math.min(
                Math.max(speedMultiplier, 1),
                50
            );
            finalGasPrice =
                (baseGasPrice * BigInt(Math.floor(clampedMultiplier * 100))) /
                BigInt(100);
        } else {
            // 기본 가스 가격 추정 시도
            try {
                const currentGasPrice = await publicClient.getGasPrice();
                const speedMultiplier = gasSpeedMultiplier || 1;
                const clampedMultiplier = Math.min(
                    Math.max(speedMultiplier, 1),
                    50
                );
                finalGasPrice =
                    (currentGasPrice *
                        BigInt(Math.floor(clampedMultiplier * 100))) /
                    BigInt(100);
            } catch (gasPriceError) {
                console.warn("Failed to get current gas price:", gasPriceError);
                finalGasPrice = undefined;
            }
        }

        // 4. 스마트 컨트랙트 호출
        const participateTx = await executeWithRetry(
            async () => {
                return await (contract.write as any).participatePoll(
                    [
                        BigInt(pollId),
                        optionId,
                        playerWallet as `0x${string}`,
                        isBetting,
                        bettingAssetId,
                        BigInt(bettingAmount),
                    ],
                    {
                        gas: gasLimit,
                        gasPrice: finalGasPrice,
                    }
                );
            },
            "participatePoll transaction",
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

        // 5. 트랜잭션 영수증 대기
        const receipt = await executeWithRetry(
            async () => {
                const txReceipt = await publicClient.waitForTransactionReceipt({
                    hash: participateTx,
                    timeout: 60000,
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
                                    .includes("already_participated")
                            ) {
                                errorMessage =
                                    "You have already participated in this poll";
                            } else if (
                                revertReason
                                    .toLowerCase()
                                    .includes("not_active") ||
                                revertReason.toLowerCase().includes("ended")
                            ) {
                                errorMessage = "This poll is no longer active";
                            } else if (
                                revertReason
                                    .toLowerCase()
                                    .includes("invalid_option")
                            ) {
                                errorMessage = "Invalid poll option selected";
                            } else if (
                                revertReason.toLowerCase().includes("not_exist")
                            ) {
                                errorMessage = "Poll does not exist";
                            } else if (
                                revertReason
                                    .toLowerCase()
                                    .includes("not_started")
                            ) {
                                errorMessage = "Poll has not started yet";
                            } else {
                                errorMessage = revertReason;
                            }
                        } else {
                            errorMessage =
                                "Transaction failed. Please try again later.";
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
                maxRetries: 1,
                baseDelayMs: 3000,
                maxDelayMs: 6000,
                retryableErrors: [
                    "timeout",
                    "network error",
                    "connection",
                    "rpc",
                ],
            }
        );

        // 🚀 최적화: parseEventLogs로 PollParticipated 이벤트만 효율적으로 파싱
        let participationIdFromEvent = 0;
        let timestampFromEvent = 0;

        if (receipt.logs && receipt.logs.length > 0) {
            const pollParticipatedEvents = parseEventLogs({
                abi,
                logs: receipt.logs,
                eventName: "PollParticipated",
            }) as unknown as ParsedPollEventLog[];

            const targetEvent = pollParticipatedEvents.find((event) => {
                return (
                    event.args.pollId.toString() === pollId &&
                    event.args.participant.toLowerCase() ===
                        playerWallet.toLowerCase()
                );
            });

            if (targetEvent) {
                participationIdFromEvent = Number(
                    targetEvent.args.participationId
                );
                timestampFromEvent = Number(targetEvent.args.timestamp);
                console.info(
                    "participationIdFromEvent",
                    participationIdFromEvent
                );
            }
        }

        return {
            success: true,
            data: {
                participationId: `${pollContract.address}_${pollId}_${playerWallet}`,
                txHash: participateTx,
                blockNumber: Number(receipt.blockNumber),
                participantAddress: playerWallet,
                optionId: optionId,
                isBetting: isBetting,
                bettingAssetId: bettingAssetId,
                bettingAmount: bettingAmount,
                timestamp: timestampFromEvent || Math.floor(Date.now() / 1000),
                gasEstimate: gasEstimateData,
            },
        };
    } catch (error) {
        console.error("❌ Error in participatePoll:", error);

        let errorMessage = "Failed to participate in poll";

        if (error instanceof Error) {
            errorMessage = error.message;

            if ((error as any).isRevert) {
                console.warn("Smart contract revert detected:", errorMessage);
            } else if (!isRetryableError(error)) {
                console.warn("Non-retryable error:", errorMessage);
            }
        }

        return {
            success: false,
            error: errorMessage,
        };
    }
}
