/// app/actions/blockchain.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { encryptPrivateKey, decryptPrivateKey } from "@/lib/utils/encryption";
import { ethers } from "ethers";

// 블록체인 네트워크 관련 함수
export async function getBlockchainNetworks(includeInactive = false) {
    try {
        const networks = await prisma.blockchainNetwork.findMany({
            where: includeInactive ? {} : { isActive: true },
            orderBy: [{ isTestnet: "asc" }, { name: "asc" }],
        });
        return { success: true, networks };
    } catch (error) {
        console.error("Failed to fetch blockchain networks:", error);
        return { success: false, error: "Failed to fetch networks" };
    }
}

export async function getBlockchainNetworkById(id: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
}> {
    try {
        const network = await prisma.blockchainNetwork.findUnique({
            where: { id },
        });

        if (!network) {
            return { success: false, error: "Network not found" };
        }

        return { success: true, data: network };
    } catch (error) {
        console.error("Error fetching blockchain network:", error);
        return { success: false, error: "Failed to fetch blockchain network" };
    }
}

export interface addBlockchainNetworkParams {
    name: string;
    chainId: number;
    rpcUrl: string;
    explorerUrl: string;
    symbol: string;
    isTestnet: boolean;
    multicallAddress?: string;
}

export async function addBlockchainNetwork(params: addBlockchainNetworkParams) {
    try {
        const existing = await prisma.blockchainNetwork.findFirst({
            where: {
                OR: [{ chainId: params.chainId }, { name: params.name }],
            },
        });

        if (existing) {
            return {
                success: false,
                error: `Network with ${
                    existing.name === params.name ? "name" : "chainId"
                } already exists`,
            };
        }

        const network = await prisma.blockchainNetwork.create({
            data: {
                ...params,
                isActive: true,
            },
        });

        revalidatePath("/admin/onchain");
        return { success: true, data: network };
    } catch (error) {
        console.error("Failed to add blockchain network:", error);
        return { success: false, error: "Failed to add network" };
    }
}

export async function updateBlockchainNetwork(
    id: string,
    data: {
        name?: string;
        rpcUrl?: string;
        explorerUrl?: string;
        symbol?: string;
        isTestnet?: boolean;
        isActive?: boolean;
    }
) {
    try {
        const network = await prisma.blockchainNetwork.findUnique({
            where: { id },
        });

        if (!network) {
            return { success: false, error: "Network not found" };
        }

        const updatedNetwork = await prisma.blockchainNetwork.update({
            where: { id },
            data,
        });

        revalidatePath("/admin/onchain");
        return { success: true, data: updatedNetwork };
    } catch (error) {
        console.error("Error updating blockchain network:", error);
        return { success: false, error: "Failed to update blockchain network" };
    }
}

// 지갑 관련 함수
export async function getEscrowWallets() {
    try {
        const wallets = await prisma.escrowWallet.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });

        return {
            success: true,
            data: wallets.map((w) => ({
                ...w,
                privateKey: w.privateKey ? "[ENCRYPTED]" : null,
            })),
        };
    } catch (error) {
        console.error("Error fetching escrow wallets:", error);
        return { success: false, error: "Failed to fetch escrow wallets" };
    }
}

export async function getActiveEscrowWallet() {
    try {
        const wallet = await prisma.escrowWallet.findFirst({
            where: { isActive: true },
            orderBy: {
                createdAt: "desc",
            },
        });

        if (!wallet) {
            return { success: false, error: "No active escrow wallet found" };
        }

        return {
            success: true,
            data: {
                ...wallet,
                privateKey: wallet.privateKey ? "[ENCRYPTED]" : null,
            },
        };
    } catch (error) {
        console.error("Error fetching active escrow wallet:", error);
        return {
            success: false,
            error: "Failed to fetch active escrow wallet",
        };
    }
}

export interface saveEscrowWalletParams {
    address: string;
    privateKey: string;
    networkIds: string[];
}

export async function saveEscrowWallet(params: saveEscrowWalletParams) {
    try {
        const ecryptedParts = await encryptPrivateKey(params.privateKey);

        const wallet = await prisma.escrowWallet.create({
            data: {
                address: params.address,
                privateKey: ecryptedParts.dbPart,
                keyHash: ecryptedParts.keyHash,
                nonce: ecryptedParts.nonce,
                networkIds: params.networkIds,
                isActive: true,
                balance: {},
            },
        });

        revalidatePath("/admin/onchain");
        return {
            success: true,
            data: {
                ...wallet,
                privateKey: "[ENCRYPTED]",
            },
        };
    } catch (error) {
        console.error("Error saving escrow wallet:", error);
        return { success: false, error: "Failed to save escrow wallet" };
    }
}

export async function updateEscrowWalletStatus(id: string, isActive: boolean) {
    try {
        const wallet = await prisma.escrowWallet.findUnique({
            where: { id },
        });

        if (!wallet) {
            return { success: false, error: "Escrow wallet not found" };
        }

        const updatedWallet = await prisma.escrowWallet.update({
            where: { id },
            data: { isActive },
        });

        revalidatePath("/admin/onchain");
        return {
            success: true,
            data: {
                ...updatedWallet,
                privateKey: updatedWallet.privateKey ? "[ENCRYPTED]" : null,
            },
        };
    } catch (error) {
        console.error("Error updating escrow wallet status:", error);
        return {
            success: false,
            error: "Failed to update escrow wallet status",
        };
    }
}

export async function updateEscrowWalletBalance(
    id: string,
    balance: Record<string, string>
) {
    try {
        const wallet = await prisma.escrowWallet.findUnique({
            where: { id },
        });

        if (!wallet) {
            return { success: false, error: "Escrow wallet not found" };
        }

        const updatedWallet = await prisma.escrowWallet.update({
            where: { id },
            data: {
                balance,
                updatedAt: new Date(),
            },
        });

        revalidatePath("/admin/onchain");
        return {
            success: true,
            data: {
                ...updatedWallet,
                privateKey: updatedWallet.privateKey ? "[ENCRYPTED]" : null,
            },
        };
    } catch (error) {
        console.error("Error updating escrow wallet balance:", error);
        return {
            success: false,
            error: "Failed to update escrow wallet balance",
        };
    }
}

export async function getEscrowWalletWithPrivateKey(id: string) {
    try {
        const wallet = await prisma.escrowWallet.findUnique({
            where: { id },
        });

        if (!wallet || !wallet.privateKey) {
            return {
                success: false,
                error: "Escrow wallet or private key not found",
            };
        }

        const decryptedKey = await decryptPrivateKey({
            dbPart: wallet.privateKey,
            blobPart: wallet.keyHash,
            keyHash: wallet.keyHash,
            nonce: wallet.nonce,
        });

        return {
            success: true,
            data: {
                ...wallet,
                privateKey: decryptedKey,
            },
        };
    } catch (error) {
        console.error("Error fetching escrow wallet with private key:", error);
        return {
            success: false,
            error: "Failed to fetch escrow wallet with private key",
        };
    }
}

export async function lookupBlockchainNetwork(params: {
    name?: string;
    chainId?: number;
}) {
    try {
        const { name, chainId } = params;

        // 최소한 하나의 검색 조건 필요
        if (!name && !chainId) {
            return {
                success: false,
                error: "At least one of name or chainId is required",
            };
        }

        // 네트워크 조회
        let network;

        if (name && chainId) {
            // 이름과 체인 ID로 조회
            network = await prisma.blockchainNetwork.findFirst({
                where: {
                    OR: [
                        { name: { equals: name, mode: "insensitive" } },
                        { chainId: chainId },
                    ],
                    isActive: true,
                },
            });
        } else if (name) {
            // 이름으로만 조회
            network = await prisma.blockchainNetwork.findFirst({
                where: {
                    name: { equals: name, mode: "insensitive" },
                    isActive: true,
                },
            });
        } else {
            // 체인 ID로만 조회
            network = await prisma.blockchainNetwork.findFirst({
                where: {
                    chainId: chainId,
                    isActive: true,
                },
            });
        }

        if (!network) {
            return {
                success: false,
                error: "Network not found",
            };
        }

        return {
            success: true,
            data: network,
        };
    } catch (error) {
        console.error("Error looking up blockchain network:", error);
        return {
            success: false,
            error: "Failed to lookup blockchain network",
        };
    }
}

export async function generateWallet() {
    try {
        const wallet = ethers.Wallet.createRandom();
        return {
            success: true,
            data: {
                address: wallet.address,
                privateKey: wallet.privateKey,
            },
        };
    } catch (error) {
        console.error("Error generating wallet:", error);
        return {
            success: false,
            error: "Failed to generate wallet",
        };
    }
}

export async function getWalletBalance(params: {
    address: string;
    networkId: string;
}) {
    try {
        const { address, networkId } = params;

        const networkResult = await getBlockchainNetworkById(networkId);
        if (!networkResult.success || !networkResult.data) {
            return {
                success: false,
                error: networkResult.error || "Failed to get network details",
            };
        }

        const network = networkResult.data;

        // Create provider with network RPC URL
        const provider = new ethers.providers.JsonRpcProvider(network.rpcUrl);

        // Get wallet balance in wei
        const balanceWei = await provider.getBalance(address);

        // Convert wei to ether (formatted string)
        const balanceEther = ethers.utils.formatEther(balanceWei);

        return {
            success: true,
            data: {
                address,
                network: {
                    name: network.name,
                    chainId: network.chainId,
                    symbol: network.symbol,
                },
                balanceWei: balanceWei.toString(),
                balanceEther,
                formatted: `${balanceEther} ${network.symbol}`,
            },
        };
    } catch (error) {
        console.error("Error getting wallet balance:", error);
        return {
            success: false,
            error: "Failed to get wallet balance",
            details: error instanceof Error ? error.message : String(error),
        };
    }
}
