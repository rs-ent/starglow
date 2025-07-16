/// app/story/interaction/actions.ts

"use server";

import { formatUnits, parseUnits } from "viem";

import { prisma } from "@/lib/prisma/client";
import { fetchPublicClient, fetchWalletClient } from "../client";

import { getOwners } from "../nft/actions";

import type { Story_spg, Artist, BlockchainNetwork } from "@prisma/client";
import type { Address, TransactionRequest } from "viem";

export interface GetUserVerifiedSPGsInput {
    userId: string;
}

export type VerifiedSPG = Story_spg & {
    artist: Artist | null;
    network: BlockchainNetwork | null;
    verifiedTokens: number[];
};

export async function getUserVerifiedSPGs(
    input?: GetUserVerifiedSPGsInput
): Promise<VerifiedSPG[]> {
    if (!input || !input.userId) {
        console.warn(
            "[getUserVerifiedSPGs] No input or userId",
            input,
            input?.userId
        );
        return [];
    }

    try {
        const [wallets, spgs] = await Promise.all([
            prisma.wallet.findMany({
                where: {
                    userId: input.userId,
                },
                select: {
                    address: true,
                },
            }),
            prisma.story_spg.findMany({
                include: {
                    artist: true,
                    network: true,
                },
            }),
        ]);

        const spgsWithTokenOwners = await Promise.all(
            spgs.map(async (spg) => {
                const tokenOwners = await getOwners({
                    spgAddress: spg.address,
                });
                const verifiedTokens = tokenOwners
                    .filter((data) =>
                        wallets.some(
                            (wallet) =>
                                wallet.address.toLowerCase() ===
                                data.owner.toLowerCase()
                        )
                    )
                    .map((data) => Number(data.tokenId));
                return {
                    ...spg,
                    verifiedTokens,
                };
            })
        );

        return spgsWithTokenOwners;
    } catch (error) {
        console.error("Error getting user verified SPGs:", error);
        return [];
    }
}

export async function getWalletAddressVerifiedSPGs(
    address: string
): Promise<VerifiedSPG[]> {
    if (!address) {
        console.warn("[getWalletAddressVerifiedSPGs] No address", address);
        return [];
    }

    try {
        const spgs = await prisma.story_spg.findMany({
            include: {
                artist: true,
                network: true,
            },
        });

        const spgsWithTokenOwners = await Promise.all(
            spgs.map(async (spg) => {
                const tokenOwners = await getOwners({
                    spgAddress: spg.address,
                });
                const verifiedTokens = tokenOwners
                    .filter(
                        (data) =>
                            data.owner.toLowerCase() === address.toLowerCase()
                    )
                    .map((data) => Number(data.tokenId));
                return {
                    ...spg,
                    verifiedTokens,
                };
            })
        );

        return spgsWithTokenOwners;
    } catch (error) {
        console.error("Error getting user verified SPGs:", error);
        return [];
    }
}

export interface GasEstimationInput {
    networkId: string;
    walletAddress: string;
    transactionRequest?: TransactionRequest;
    contractAddress?: Address;
    abi?: any[];
    functionName?: string;
    args?: any[];
    value?: bigint;
    deploymentBytecode?: `0x${string}`;
    gasMultiplier?: number;
    maxRetries?: number;
    priorityFeeMultiplier?: number;
}

export interface GasEstimationResult {
    estimatedGas: bigint;
    gasPrice: bigint;
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
    estimatedCostWei: bigint;
    estimatedCostFormatted: string;
    estimatedCostUSD?: string;
    networkInfo: {
        chainId: number;
        name: string;
        symbol: string;
        isTestnet: boolean;
    };
    recommendation: "low" | "standard" | "fast" | "urgent";
    confidence: number;
}

export async function estimateGasComprehensive(
    input: GasEstimationInput
): Promise<GasEstimationResult> {
    try {
        const {
            networkId,
            walletAddress,
            transactionRequest,
            contractAddress,
            abi,
            functionName,
            args = [],
            value = 0n,
            deploymentBytecode,
            gasMultiplier = 1.3,
            maxRetries = 3,
            priorityFeeMultiplier = 1.1,
        } = input;

        const [publicClient, walletClient] = await Promise.all([
            fetchPublicClient({ networkId }),
            fetchWalletClient({ networkId, walletAddress }),
        ]);

        const network = await prisma.blockchainNetwork.findUnique({
            where: { id: networkId },
        });

        if (!network) {
            throw new Error("Network not found");
        }

        let estimatedGas: bigint;
        let gasRequest: any;

        if (transactionRequest) {
            gasRequest = {
                ...transactionRequest,
                account: walletClient.account,
            };
        } else if (deploymentBytecode) {
            gasRequest = {
                data: deploymentBytecode,
                account: walletClient.account,
                value,
            };
        } else if (contractAddress && abi && functionName) {
            gasRequest = {
                address: contractAddress,
                abi,
                functionName,
                args,
                account: walletClient.account,
                value,
            };
        } else {
            throw new Error("Invalid gas estimation parameters");
        }

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                if (contractAddress && abi && functionName) {
                    estimatedGas = await publicClient.estimateContractGas(
                        gasRequest
                    );
                } else {
                    estimatedGas = await publicClient.estimateGas(gasRequest);
                }
                break;
            } catch (error) {
                if (attempt === maxRetries - 1) {
                    console.warn(
                        `Gas estimation failed after ${maxRetries} attempts, using fallback`,
                        error
                    );
                    estimatedGas = _getFallbackGasEstimate(
                        functionName,
                        deploymentBytecode
                    );
                } else {
                    console.warn(
                        `Gas estimation attempt ${
                            attempt + 1
                        } failed, retrying...`,
                        error
                    );
                    await new Promise((resolve) =>
                        setTimeout(resolve, 1000 * (attempt + 1))
                    );
                }
            }
        }

        const gasPrice = await publicClient.getGasPrice();

        let maxFeePerGas = gasPrice;
        let maxPriorityFeePerGas = gasPrice / 10n;

        try {
            const block = await publicClient.getBlock({ blockTag: "latest" });
            if (block.baseFeePerGas) {
                const baseFee = block.baseFeePerGas;
                const priorityFee = parseUnits(
                    (
                        Number(formatUnits(gasPrice, 9)) * priorityFeeMultiplier
                    ).toString(),
                    9
                );

                maxPriorityFeePerGas = priorityFee;
                maxFeePerGas = baseFee * 2n + maxPriorityFeePerGas;
            }
        } catch (error) {
            console.warn(
                "EIP-1559 not supported, using legacy gas pricing",
                error
            );
        }

        const finalGasEstimate = BigInt(
            Math.ceil(Number(estimatedGas!) * gasMultiplier)
        );
        const estimatedCostWei = finalGasEstimate * maxFeePerGas;
        const estimatedCostFormatted = formatUnits(estimatedCostWei, 18);

        const recommendation = _getGasRecommendation(gasPrice, maxFeePerGas);
        const confidence = _calculateConfidence(
            estimatedGas!,
            gasRequest,
            network
        );

        return {
            estimatedGas: finalGasEstimate,
            gasPrice,
            maxFeePerGas,
            maxPriorityFeePerGas,
            estimatedCostWei,
            estimatedCostFormatted,
            networkInfo: {
                chainId: network.chainId,
                name: network.name,
                symbol: network.symbol,
                isTestnet: network.isTestnet,
            },
            recommendation,
            confidence,
        };
    } catch (error) {
        console.error("Comprehensive gas estimation failed:", error);
        throw new Error(
            `Gas estimation failed: ${
                error instanceof Error ? error.message : "Unknown error"
            }`
        );
    }
}

export interface SimpleGasEstimationInput {
    networkId: string;
    transactionType:
        | "transfer"
        | "contractCall"
        | "contractDeploy"
        | "nftMint"
        | "custom";
    complexity?: "simple" | "medium" | "complex";
}

export async function estimateGasSimple(
    input: SimpleGasEstimationInput
): Promise<{
    estimatedGas: string;
    estimatedCost: string;
    estimatedCostUSD?: string;
    symbol: string;
}> {
    try {
        const { networkId, transactionType, complexity = "medium" } = input;

        const network = await prisma.blockchainNetwork.findUnique({
            where: { id: networkId },
        });

        if (!network) {
            throw new Error("Network not found");
        }

        const publicClient = await fetchPublicClient({ networkId });
        const gasPrice = await publicClient.getGasPrice();

        const gasEstimates = {
            transfer: { simple: 21000n, medium: 21000n, complex: 25000n },
            contractCall: { simple: 50000n, medium: 100000n, complex: 200000n },
            contractDeploy: {
                simple: 500000n,
                medium: 1000000n,
                complex: 2000000n,
            },
            nftMint: { simple: 150000n, medium: 250000n, complex: 400000n },
            custom: { simple: 100000n, medium: 200000n, complex: 500000n },
        };

        const estimatedGas = gasEstimates[transactionType][complexity];
        const estimatedCostWei = estimatedGas * gasPrice;
        const estimatedCost = formatUnits(estimatedCostWei, 18);

        return {
            estimatedGas: estimatedGas.toString(),
            estimatedCost,
            symbol: network.symbol,
        };
    } catch (error) {
        console.error("Simple gas estimation failed:", error);
        throw new Error(
            `Simple gas estimation failed: ${
                error instanceof Error ? error.message : "Unknown error"
            }`
        );
    }
}

function _getFallbackGasEstimate(
    functionName?: string,
    deploymentBytecode?: `0x${string}`
): bigint {
    if (deploymentBytecode) {
        const bytecodeLength = deploymentBytecode.length / 2 - 1;
        return BigInt(200000 + bytecodeLength * 200);
    }

    const gasEstimates: Record<string, bigint> = {
        transfer: 21000n,
        approve: 50000n,
        mint: 200000n,
        burn: 100000n,
        createRaffle: 300000n,
        participate: 150000n,
        draw: 200000n,
        deploy: 1000000n,
    };

    if (functionName && gasEstimates[functionName]) {
        return gasEstimates[functionName];
    }

    return 200000n;
}

function _getGasRecommendation(
    gasPrice: bigint,
    maxFeePerGas: bigint
): "low" | "standard" | "fast" | "urgent" {
    const ratio = Number(maxFeePerGas) / Number(gasPrice);

    if (ratio <= 1.1) return "low";
    if (ratio <= 1.3) return "standard";
    if (ratio <= 1.6) return "fast";
    return "urgent";
}

function _calculateConfidence(
    estimatedGas: bigint,
    gasRequest: any,
    network: BlockchainNetwork
): number {
    let confidence = 85;

    if (network.isTestnet) confidence -= 10;

    if (estimatedGas > 1000000n) confidence -= 15;
    else if (estimatedGas > 500000n) confidence -= 10;
    else if (estimatedGas > 100000n) confidence -= 5;

    if (gasRequest.value && gasRequest.value > 0n) confidence -= 5;

    return Math.max(50, Math.min(95, confidence));
}
