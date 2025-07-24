/// app/story/interaction/actions.ts

"use server";

import { formatUnits, parseUnits } from "viem";

import { prisma } from "@/lib/prisma/client";
import { fetchPublicClient, fetchWalletClient } from "../client";

// 🚀 가스 추정 캐시 (5분 TTL)
interface GasCacheItem {
    result: GasEstimationResult;
    timestamp: number;
}

class GasEstimationCache {
    private cache = new Map<string, GasCacheItem>();
    private ttl = 5 * 60 * 1000; // 5분

    private createKey(input: GasEstimationInput): string {
        const {
            networkId,
            contractAddress,
            functionName,
            args = [],
            value = 0n,
            gasMultiplier = 1.3,
            priorityFeeMultiplier = 1.1,
        } = input;

        // 🔧 BigInt 안전 직렬화: BigInt를 문자열로 변환
        const safeStringify = (obj: any): string => {
            return JSON.stringify(obj, (key, val) =>
                typeof val === "bigint" ? val.toString() + "n" : val
            );
        };

        // 동일한 함수 호출에 대한 캐시 키 생성
        return [
            networkId,
            contractAddress,
            functionName,
            safeStringify(args),
            value.toString(),
            gasMultiplier.toString(),
            priorityFeeMultiplier.toString(),
        ].join(":");
    }

    get(input: GasEstimationInput): GasEstimationResult | null {
        const key = this.createKey(input);
        const item = this.cache.get(key);

        if (!item) return null;

        // TTL 체크
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.result;
    }

    set(input: GasEstimationInput, result: GasEstimationResult): void {
        const key = this.createKey(input);
        this.cache.set(key, {
            result,
            timestamp: Date.now(),
        });
    }

    // 캐시 정리 (10분마다)
    cleanup(): void {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > this.ttl) {
                this.cache.delete(key);
            }
        }
    }
}

// 글로벌 가스 추정 캐시 인스턴스
const gasEstimationCache = new GasEstimationCache();

// 주기적 캐시 정리 (10분마다)
setInterval(() => {
    gasEstimationCache.cleanup();
}, 10 * 60 * 1000);

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
        // 🚀 캐시된 결과 확인 (5분 TTL)
        const cachedResult = gasEstimationCache.get(input);
        if (cachedResult) {
            console.info(`✅ Gas estimation cache hit: ${input.functionName}`);
            return cachedResult;
        }

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

                // 🚀 개선된 가스 가격 계산 (Berachain 대응)
                const minPriorityFee = parseUnits("0.001", 9); // 최소 0.001 gwei (1000000 wei)
                const calculatedPriorityFee =
                    (gasPrice *
                        BigInt(Math.floor(priorityFeeMultiplier * 1000))) /
                    1000n;

                // 안전한 최소값 보장
                maxPriorityFeePerGas =
                    calculatedPriorityFee > minPriorityFee
                        ? calculatedPriorityFee
                        : minPriorityFee;

                // 더 안전한 maxFeePerGas 계산 (베이스 수수료의 150% + 우선순위 수수료)
                const safeBaseFee = (baseFee * 150n) / 100n;
                maxFeePerGas = safeBaseFee + maxPriorityFeePerGas;

                // 최종 안전 체크: 베이스 수수료보다 낮으면 보정
                if (maxFeePerGas <= baseFee) {
                    maxFeePerGas = baseFee + maxPriorityFeePerGas;
                }
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

        const result: GasEstimationResult = {
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

        // 🚀 결과를 캐시에 저장 (5분 TTL)
        gasEstimationCache.set(input, result);
        console.info(`💾 Gas estimation cached: ${input.functionName}`);

        return result;
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
