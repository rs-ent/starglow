/// app/actions/raffles/onchain/actions-write-v2.ts

"use server";

import type { Address } from "viem";
import { getContract, parseEventLogs } from "viem";

import { prisma } from "@/lib/prisma/client";
import { fetchWalletClient, fetchPublicClient } from "@/app/story/client";
import { safeBigIntToNumber } from "@/lib/utils/format";

import rafflesJson from "@/web3/artifacts/contracts/Raffles_v2.sol/RafflesV2.json";
import { getDefaultUserWalletAddress } from "@/app/story/userWallet/actions";
import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";
import {
    validatePlayerAsset,
    updatePlayerAsset,
} from "../../playerAssets/actions";
import { initialTransfer } from "@/app/story/transfer/actions";

const abi = rafflesJson.abi;

export interface ParticipationResult {
    participantId: string;
    hasResult: boolean;
    prizeIndex: number;
}

export interface ParticipateV2Input {
    contractAddress: string;
    raffleId: string;
    playerId: string;
    instantDraw: boolean;
    estimateGas?: boolean;
    gasSpeedMultiplier?: number; // 1 = normal, 2 = 2x faster, 50 = 50x faster
    entryFeeAssetId: string;
    entryFeeAmount: number;
    raffleTitle: string;
}

export interface ParticipateV2Result {
    success: boolean;
    data?: {
        participantId: string;
        txHash: string;
        blockNumber: number;
        ticketNumber: number;
        hasResult: boolean;
        prizeIndex?: number;
        timestamp: number;
        walletAddress: string;
        gasEstimate?: {
            gasEstimate: string;
            gasPrice: string;
            estimatedCost: string;
        };
    };
    error?: string;
}

/**
 * V2 래플 참여
 * 즉시 추첨인 경우 자동으로 추첨 결과를 포함하여 반환
 */
export async function participateV2(
    input: ParticipateV2Input
): Promise<ParticipateV2Result> {
    try {
        const contract = await prisma.onchainRaffleContract.findUnique({
            cacheStrategy: getCacheStrategy("oneHour"),
            where: { address: input.contractAddress },
            select: {
                deployedBy: true,
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

        const walletClient = await fetchWalletClient({
            networkId: contract.network.id,
            walletAddress: contract.deployedBy,
        });

        const rafflesContract = getContract({
            address: input.contractAddress as Address,
            abi,
            client: walletClient,
        });

        const publicClient = await fetchPublicClient({
            network: contract.network,
        });

        let gasEstimateData:
            | {
                  gasEstimate: string;
                  gasPrice: string;
                  estimatedCost: string;
              }
            | undefined;

        // 가스비 추정 (선택적 실행으로 성능 최적화)
        if (input.estimateGas) {
            try {
                const [gasEstimate, gasPrice] = await Promise.all([
                    publicClient.estimateContractGas({
                        address: input.contractAddress as `0x${string}`,
                        abi,
                        functionName: "participate",
                        args: [
                            BigInt(input.raffleId),
                            playerAddress as Address,
                        ],
                        account: contract.deployedBy as Address,
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
            // 더 안전한 기본값으로 조정 (성능과 안정성 균형)
            baseGasEstimate = input.instantDraw
                ? BigInt(3000000) // 즉시 추첨 시 더 많은 gas 필요
                : BigInt(1500000); // 일반 참여 시 안전한 기본값
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
            const speedMultiplier = input.gasSpeedMultiplier || 1;
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
                const speedMultiplier = input.gasSpeedMultiplier || 1;
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

        const participateTx = await (rafflesContract.write as any).participate(
            [BigInt(input.raffleId), playerAddress as Address],
            {
                gas: gasLimit,
                gasPrice: finalGasPrice,
            }
        );

        const receipt = await publicClient.waitForTransactionReceipt({
            hash: participateTx as `0x${string}`,
        });

        // 참여 이벤트에서 정보 추출
        let participationData = {
            participantId: "0",
            ticketNumber: 0,
            hasResult: false,
            prizeIndex: 0,
        };

        try {
            // Participated 이벤트 추출
            const participatedEvents = parseEventLogs({
                abi,
                eventName: "Participated",
                logs: receipt.logs,
            });

            if (participatedEvents.length > 0) {
                const event = participatedEvents[0] as any;
                if (event.args) {
                    participationData.participantId = safeBigIntToNumber(
                        event.args.participantId
                    ).toString();
                    participationData.ticketNumber = safeBigIntToNumber(
                        event.args.ticketNumber
                    );
                }
            }

            // 즉시 추첨인 경우 LotteryDrawn 이벤트도 확인
            if (input.instantDraw) {
                const lotteryDrawnEvents = parseEventLogs({
                    abi,
                    eventName: "LotteryDrawn",
                    logs: receipt.logs,
                });

                if (lotteryDrawnEvents.length > 0) {
                    const drawEvent = lotteryDrawnEvents[0] as any;
                    if (drawEvent.args && drawEvent.args.participantId) {
                        const eventParticipantId = safeBigIntToNumber(
                            drawEvent.args.participantId
                        ).toString();

                        // 같은 participantId인지 확인
                        if (
                            eventParticipantId ===
                            participationData.participantId
                        ) {
                            participationData.hasResult = true;
                            participationData.prizeIndex = safeBigIntToNumber(
                                drawEvent.args.prizeIndex || 0
                            );
                        }
                    }
                }
            }
        } catch (eventError) {
            console.warn("Failed to parse participation events:", eventError);
        }

        await updatePlayerAsset({
            transaction: {
                playerId: input.playerId,
                assetId: input.entryFeeAssetId,
                amount: input.entryFeeAmount,
                operation: "SUBTRACT",
                reason: `Raffle Participation: ${input.raffleTitle}`,
            },
        });

        return {
            success: true,
            data: {
                participantId: participationData.participantId,
                txHash: participateTx,
                blockNumber: Number(receipt.blockNumber),
                ticketNumber: participationData.ticketNumber,
                hasResult: participationData.hasResult,
                prizeIndex: participationData.hasResult
                    ? participationData.prizeIndex
                    : undefined,
                timestamp: Math.floor(Date.now() / 1000),
                walletAddress: playerAddress,
                gasEstimate: gasEstimateData as
                    | {
                          gasEstimate: string;
                          gasPrice: string;
                          estimatedCost: string;
                      }
                    | undefined,
            },
        };
    } catch (error) {
        console.error("Error participating in raffle V2:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to participate in raffle V2",
        };
    }
}

export interface CheckRaffleParticipationInput {
    contractAddress: string;
    raffleId: string;
    playerId: string;
}

export interface CheckRaffleParticipationResult {
    success: boolean;
    data?: {
        hasParticipated: boolean;
        participationCount: number;
        canParticipate: boolean;
        reason?: string;
    };
    error?: string;
}

/**
 * V2 래플 참여 가능 여부 확인
 */
export async function checkRaffleParticipationV2(
    input: CheckRaffleParticipationInput
): Promise<CheckRaffleParticipationResult> {
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

        // 참여 여부 및 횟수 확인
        const [hasParticipated, participationCount, raffleInfo] =
            await Promise.all([
                (raffleContract.read as any).hasParticipated([
                    BigInt(input.raffleId),
                    playerAddress as Address,
                ]),
                (raffleContract.read as any).getUserParticipationCount([
                    BigInt(input.raffleId),
                    playerAddress as Address,
                ]),
                (raffleContract.read as any).getRaffleListCardInfo([
                    BigInt(input.raffleId),
                ]),
            ]);

        const participationNum = safeBigIntToNumber(participationCount);
        let canParticipate = true;
        let reason = "";

        // 래플 상태 확인
        if (!raffleInfo.isActive) {
            canParticipate = false;
            reason = "Raffle is not active";
        } else if (raffleInfo.isDrawn) {
            canParticipate = false;
            reason = "Raffle has already ended";
        } else {
            // 시간 확인
            const currentTimestamp = Math.floor(Date.now() / 1000);
            const startDate = safeBigIntToNumber(raffleInfo.startDate);
            const endDate = safeBigIntToNumber(raffleInfo.endDate);

            if (currentTimestamp < startDate) {
                canParticipate = false;
                reason = "Raffle has not started yet";
            } else if (currentTimestamp > endDate) {
                canParticipate = false;
                reason = "Raffle participation period has ended";
            } else {
                // 전체 참여자 수 제한 확인
                const maxParticipants = safeBigIntToNumber(
                    raffleInfo.participationLimit
                );
                const uniqueParticipants = safeBigIntToNumber(
                    raffleInfo.uniqueParticipants
                );

                if (
                    maxParticipants > 0 &&
                    uniqueParticipants >= maxParticipants
                ) {
                    canParticipate = false;
                    reason = "Maximum participants reached";
                }

                // 티켓 남은지 확인
                const remainingTickets = safeBigIntToNumber(
                    raffleInfo.remainingTickets
                );
                if (remainingTickets <= 0) {
                    canParticipate = false;
                    reason = "No tickets available";
                }
            }
        }

        return {
            success: true,
            data: {
                hasParticipated: Boolean(hasParticipated),
                participationCount: participationNum,
                canParticipate,
                reason: canParticipate ? undefined : reason,
            },
        };
    } catch (error) {
        console.error("Error checking raffle participation V2:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to check raffle participation V2",
        };
    }
}

export interface EstimateParticipationGasInput {
    contractAddress: string;
    raffleId: string;
    playerId: string;
}

export interface EstimateParticipationGasResult {
    success: boolean;
    data?: {
        gasEstimate: string;
        gasPrice: string;
        estimatedCost: string;
    };
    error?: string;
}

/**
 * V2 래플 참여 가스비 추정
 */
export async function estimateParticipationGasV2(
    input: EstimateParticipationGasInput
): Promise<EstimateParticipationGasResult> {
    try {
        const contract = await prisma.onchainRaffleContract.findUnique({
            cacheStrategy: getCacheStrategy("oneHour"),
            where: { address: input.contractAddress },
            select: {
                deployedBy: true,
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

        // 가스 추정
        const [gasEstimate, gasPrice] = await Promise.all([
            publicClient.estimateContractGas({
                address: input.contractAddress as `0x${string}`,
                abi,
                functionName: "participate",
                args: [BigInt(input.raffleId), contract.deployedBy as Address],
                account: contract.deployedBy as Address,
            }),
            publicClient.getGasPrice(),
        ]);

        const estimatedCost = gasEstimate * gasPrice;

        return {
            success: true,
            data: {
                gasEstimate: gasEstimate.toString(),
                gasPrice: gasPrice.toString(),
                estimatedCost: estimatedCost.toString(),
            },
        };
    } catch (error) {
        console.error("Error estimating participation gas V2:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to estimate participation gas V2",
        };
    }
}

export interface PrizeData {
    title?: string;
    description?: string;
    imageUrl?: string;
    iconUrl?: string;
    prizeType?: number;
    prizeQuantity?: bigint | number;
    rarity?: bigint | number;
    order?: bigint | number;
    quantity?: bigint | number;
    assetId?: string;
    collectionAddress?: string;
}


export interface DistributePrizeInput {
    playerId: string;
    prizeData: PrizeData;
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
    const { playerId, prizeData, playerWalletAddress, tx } = input;

    try {
        if (prizeData.prizeType === 0) {
            // EMPTY 타입 - 빈 상품 (꽝)
            return {
                success: true,
                distributedAmount: 0,
                distributionMethod: "EMPTY" as any,
            };
        } else if (prizeData.prizeType === 1) {
            // ASSET 타입 - 오프체인 에셋 처리
            const assetId = prizeData.assetId;
            const assetAmount = Number(prizeData.prizeQuantity || 1);

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
                        reason: `Raffle prize: ${prizeData.title}`,
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
        } else if (prizeData.prizeType === 2) {
            // NFT 타입 - SPG 컬렉션 처리
            const spgAddress = prizeData.collectionAddress;
            const nftQuantity = Number(prizeData.prizeQuantity || 1);

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
        } else if (prizeData.prizeType === 3) {
            // TOKEN 타입 - 아직 구현되지 않음
            return {
                success: false,
                error: "TOKEN prize type not yet implemented",
            };
        } else {
            return {
                success: false,
                error: `Unknown prize type: ${prizeData.prizeType}`,
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