/// app/story/network/actions.ts

"use server";

import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";
import { prisma } from "@/lib/prisma/client";

import type { Prisma, BlockchainNetwork } from "@prisma/client";
import type { Chain } from "viem";

export interface createStoryNetworkInput {
    name: string;
    chainId: number;
    rpcUrl: string;
    explorerUrl: string;
    symbol: string;
    isTestnet: boolean;
    isActive: boolean;
    defaultNetwork: boolean;
    multicallAddress?: string;
}

export async function createStoryNetwork(
    input: createStoryNetworkInput
): Promise<BlockchainNetwork | string> {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const existingNetwork = await tx.blockchainNetwork.findUnique({
                where: {
                    chainId: input.chainId,
                },
            });

            if (existingNetwork) {
                return "이미 존재하는 네트워크입니다.";
            }

            if (input.defaultNetwork) {
                await tx.blockchainNetwork.updateMany({
                    where: { defaultNetwork: true },
                    data: { defaultNetwork: false },
                });
            }

            const newNetwork = await tx.blockchainNetwork.create({
                data: {
                    ...input,
                },
            });

            return newNetwork;
        });

        return result;
    } catch (error) {
        console.error(error);
        return "네트워크 생성에 실패했습니다.";
    }
}

export interface getStoryNetworkInput {
    id?: string;
    name?: string;
    chainId?: number;
    defaultNetwork?: boolean;
}

export async function getStoryNetwork(
    input?: getStoryNetworkInput
): Promise<BlockchainNetwork | string | null> {
    try {
        if (!input) {
            return null;
        }

        if (!input.id && !input.name && !input.chainId) {
            return "조회 조건이 없습니다.";
        }

        let where: Prisma.BlockchainNetworkWhereUniqueInput;

        if (input.id) {
            where = { id: input.id };
        } else if (input.name) {
            where = { name: input.name };
        } else if (input.chainId) {
            where = { chainId: input.chainId };
        } else {
            return "조회 조건이 없습니다.";
        }

        const result = await prisma.blockchainNetwork.findUnique({
            where,
        });

        if (!result) {
            return "존재하지 않는 네트워크입니다.";
        }

        return result;
    } catch (error) {
        console.error(error);
        return "네트워크 조회에 실패했습니다.";
    }
}

export interface getDefaultStoryNetworkOutput {
    id: string;
    name: string;
    chainId: number;
    rpcUrl: string;
    explorerUrl: string;
    symbol: string;
}

export async function getDefaultStoryNetwork(): Promise<getDefaultStoryNetworkOutput | null> {
    try {
        const result = await prisma.blockchainNetwork.findFirst({
            cacheStrategy: getCacheStrategy("oneDay"),
            where: { defaultNetwork: true },
            select: {
                id: true,
                name: true,
                chainId: true,
                rpcUrl: true,
                explorerUrl: true,
                symbol: true,
            },
        });

        if (result && result.chainId) {
            return result;
        }

        const secondResult = await prisma.blockchainNetwork.findFirst({
            cacheStrategy: getCacheStrategy("oneDay"),
            where: { defaultNetwork: false, isActive: true, isTestnet: false },
            orderBy: {
                createdAt: "desc",
            },
        });

        if (secondResult) {
            return secondResult;
        }

        return null;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export interface getStoryNetworksInput {
    isTestnet?: boolean;
    isActive?: boolean;
}

export async function getStoryNetworks(
    input?: getStoryNetworksInput
): Promise<BlockchainNetwork[] | string | null> {
    try {
        const where: Prisma.BlockchainNetworkWhereInput = {};

        if (input && input.isTestnet !== undefined) {
            where.isTestnet = input.isTestnet;
        }

        if (input && input.isActive !== undefined) {
            where.isActive = input.isActive;
        }

        const result = await prisma.blockchainNetwork.findMany({
            where,
        });

        return result;
    } catch (error) {
        console.error(error);
        return "네트워크 조회에 실패했습니다.";
    }
}

export interface updateStoryNetworkInput {
    id: string;
    name?: string;
    chainId?: number;
    rpcUrl?: string;
    explorerUrl?: string;
    symbol?: string;
    isTestnet?: boolean;
    isActive?: boolean;
    multicallAddress?: string;
    defaultNetwork?: boolean;
}

export async function updateStoryNetwork(
    input: updateStoryNetworkInput
): Promise<BlockchainNetwork | string> {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const existingNetwork = await tx.blockchainNetwork.findUnique({
                where: {
                    id: input.id,
                },
            });

            if (!existingNetwork) {
                return "존재하지 않는 네트워크입니다.";
            }

            const { id, ...rest } = input;

            if (
                input.defaultNetwork !== undefined &&
                input.defaultNetwork !== existingNetwork.defaultNetwork
            ) {
                if (input.defaultNetwork) {
                    await tx.blockchainNetwork.updateMany({
                        where: {
                            defaultNetwork: true,
                            id: { not: id },
                        },
                        data: { defaultNetwork: false },
                    });
                } else {
                    const otherNetwork = await tx.blockchainNetwork.findFirst({
                        where: {
                            id: { not: id },
                            isActive: true,
                        },
                    });

                    if (otherNetwork) {
                        await tx.blockchainNetwork.update({
                            where: { id: otherNetwork.id },
                            data: { defaultNetwork: true },
                        });
                    }
                }
            }

            const updatedNetwork = await tx.blockchainNetwork.update({
                where: { id },
                data: {
                    ...rest,
                },
            });

            return updatedNetwork;
        });

        return result;
    } catch (error) {
        console.error(error);
        return "네트워크 업데이트에 실패했습니다.";
    }
}

export interface deleteStoryNetworkInput {
    id: string;
}

export async function deleteStoryNetwork(
    input: deleteStoryNetworkInput
): Promise<BlockchainNetwork | string> {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const existingNetwork = await tx.blockchainNetwork.findUnique({
                where: {
                    id: input.id,
                },
            });

            if (!existingNetwork) {
                return "존재하지 않는 네트워크입니다.";
            }

            const deletedNetwork = await tx.blockchainNetwork.delete({
                where: { id: input.id },
            });

            return deletedNetwork;
        });

        return result;
    } catch (error) {
        console.error(error);
        return "네트워크 삭제에 실패했습니다.";
    }
}

const chainCache = new Map<string, Chain>();
export async function getChain(network: BlockchainNetwork): Promise<Chain> {
    const cacheKey = network.id;
    if (chainCache.has(cacheKey)) {
        return chainCache.get(cacheKey)!;
    }

    const chain: Chain = {
        id: network.chainId,
        name: network.name,
        nativeCurrency: {
            name: network.symbol,
            symbol: network.symbol,
            decimals: 18,
        },
        rpcUrls: {
            default: { http: [network.rpcUrl] },
            public: { http: [network.rpcUrl] },
        },
        blockExplorers: {
            default: { name: "Explorer", url: network.explorerUrl },
        },
    };

    chainCache.set(cacheKey, chain);
    return chain;
}

export async function estimateAndOptimizeGas(
    publicClient: any,
    walletClient: any,
    request: any,
    attempt: number = 0,
    nftQuantity: number = 1
) {
    try {
        // 1. 가스 한도 예측
        const estimatedGas = await publicClient.estimateGas({
            ...request,
            account: walletClient.account,
        });

        // NFT 수량에 따른 최소 가스 보장
        // NFT 하나당 최소 150,000 가스 할당
        const minGasPerNFT = 150000n;
        const minRequiredGas = minGasPerNFT * BigInt(nftQuantity);

        // 예측된 가스와 최소 필요 가스 중 큰 값 사용
        const baseGas =
            estimatedGas > minRequiredGas ? estimatedGas : minRequiredGas;

        // 2. 현재 가스 가격 조회
        const gasPrice = await publicClient.getGasPrice();

        // 3. 최신 블록의 base fee 조회 (EIP-1559 지원 네트워크)
        let maxFeePerGas = gasPrice;
        let maxPriorityFeePerGas = gasPrice;

        try {
            const block = await publicClient.getBlock({ blockTag: "latest" });
            if (block.baseFeePerGas) {
                // EIP-1559 지원 네트워크
                const baseFee = block.baseFeePerGas;
                const priorityFee = gasPrice / 10n; // 가스 가격의 10%를 우선순위 수수료로

                // 재시도 시 가스비 증가 (10% ~ 50%)
                const multiplier = 1000n + BigInt(attempt * 100 + 100); // 110%, 120%, 130%...

                maxPriorityFeePerGas = (priorityFee * multiplier) / 1000n;
                maxFeePerGas = baseFee * 2n + maxPriorityFeePerGas; // base fee의 2배 + priority fee
            }
        } catch (eip1559Error) {
            console.warn(
                "EIP-1559 Not Supported. Using legacy gas price:",
                eip1559Error
            );
            const multiplier = 1000n + BigInt(attempt * 150); // 115%, 130%, 145%...
            maxFeePerGas = (gasPrice * multiplier) / 1000n;
        }

        // 4. 가스 한도에 안전 마진 추가 (30% - NFT 여러 개일 때 더 많은 마진 필요)
        const gasLimit = (baseGas * 130n) / 100n;

        return {
            gas: gasLimit,
            gasPrice: maxFeePerGas,
            maxFeePerGas,
            maxPriorityFeePerGas,
            estimatedCost: gasLimit * maxFeePerGas,
        };
    } catch (error) {
        console.error("Gas estimation failed:", error);

        // 가스 예측 실패 시 NFT 수량에 따른 기본값 사용
        const baseGasPerNFT = 200000n; // NFT당 200,000 가스
        const baseGasLimit = baseGasPerNFT * BigInt(nftQuantity);
        const baseGasPrice = 20000000000n; // 20 gwei
        const multiplier = 1000n + BigInt(attempt * 200); // 120%, 140%, 160%...

        return {
            gas: baseGasLimit,
            gasPrice: (baseGasPrice * multiplier) / 1000n,
            maxFeePerGas: (baseGasPrice * multiplier) / 1000n,
            maxPriorityFeePerGas: (baseGasPrice * multiplier) / 2000n,
            estimatedCost: baseGasLimit * ((baseGasPrice * multiplier) / 1000n),
        };
    }
}
