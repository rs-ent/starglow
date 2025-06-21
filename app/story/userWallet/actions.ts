/// app/story/userWallet/actions.ts

"use server";

import {
    BlockchainNetwork,
    WalletStatus,
} from "@prisma/client";
import { ethers } from "ethers";
import { verifyMessage } from "viem";

import { prisma } from "@/lib/prisma/client";
import { decryptPrivateKey, encryptPrivateKey } from "@/lib/utils/encryption";

import type {
    Prisma,
    Wallet} from "@prisma/client";
import type { Hex} from "viem";

export async function createWallet(userId: string) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const defaultNetwork = await tx.blockchainNetwork.findFirst({
                where: { defaultNetwork: true },
            });

            const networkValue = defaultNetwork?.chainId?.toString() || "EVM";
            const networkName = defaultNetwork?.name || "EVM";

            const existingWallet = await tx.wallet.findFirst({
                where: {
                    userId,
                    network: networkValue,
                },
            });

            if (existingWallet) {
                return {
                    success: true,
                    message: `${networkName} wallet already exists`,
                };
            }

            const hasDefaultWallet = await tx.wallet.findFirst({
                where: { userId, default: true },
            });

            const wallet = ethers.Wallet.createRandom();
            const ecryptedParts = await encryptPrivateKey(wallet.privateKey);

            const newWallet = await tx.wallet.create({
                data: {
                    userId: userId,
                    address: wallet.address,
                    privateKey: ecryptedParts.dbPart,
                    keyHash: ecryptedParts.keyHash,
                    nonce: ecryptedParts.nonce,
                    network: networkValue,
                    primary: 1,
                    default: hasDefaultWallet ? false : true,
                    nickname: "My Starglow Wallet",
                    status: "ACTIVE",
                    provider: "starglow",
                    lastAccessedAt: new Date(),
                },
            });

            return {
                success: true,
                address: newWallet.address,
            };
        });

        return result;
    } catch (error) {
        console.error("Error creating wallet", error);
        return {
            success: false,
            message: "Failed to create wallet",
        };
    }
}

/**
 * @security
 * This function handles sensitive key encryption and should not be modified
 */
export async function getPrivateKey(address: string) {
    try {
        const wallet = await prisma.wallet.findUnique({
            where: { address },
            select: {
                userId: true,
                privateKey: true,
                keyHash: true,
                nonce: true,
            },
        });

        if (!wallet) {
            throw new Error("Wallet not found");
        }

        if (!wallet.privateKey || !wallet.keyHash || !wallet.nonce) {
            throw new Error("This wallet is not created by Starglow");
        }

        const decryptedKey = await decryptPrivateKey({
            dbPart: wallet.privateKey,
            blobPart: wallet.keyHash,
            keyHash: wallet.keyHash,
            nonce: wallet.nonce,
        });

        return decryptedKey;
    } catch (error) {
        console.error("Error getting private key", error);
        throw new Error("Failed to get private key");
    }
}

export interface conectWalletInput {
    address: string;
    network: string;
    provider: string;
    userId: string;
    nickname?: string;
}

export async function connectWallet(
    input: conectWalletInput
): Promise<Wallet | string> {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const existingWallet = await tx.wallet.findUnique({
                where: {
                    address: input.address,
                },
            });

            if (existingWallet) {
                return await tx.wallet.update({
                    where: {
                        id: existingWallet.id,
                    },
                    data: {
                        lastAccessedAt: new Date(),
                        status: WalletStatus.ACTIVE,
                    },
                });
            }

            const newWallet = await tx.wallet.create({
                data: {
                    userId: input.userId,
                    address: input.address,
                    network: input.network,
                    provider: input.provider,
                    nickname: input.nickname,
                    status: WalletStatus.ACTIVE,
                    lastAccessedAt: new Date(),
                    default: true,
                },
            });

            return newWallet;
        });

        return result;
    } catch (error) {
        console.error("Failed to connect wallet", error);
        return "Failed to connect wallet";
    }
}

export interface verifyWalletSignatureInput {
    address: string;
    signature: string;
    message: string;
    network: string;
}

export async function verifyWalletSignature(
    input: verifyWalletSignatureInput
): Promise<boolean | string> {
    try {
        const isValid = await verifyMessage({
            address: input.address as Hex,
            message: input.message,
            signature: input.signature as Hex,
        });

        if (!isValid) {
            return "Invalid signature";
        }

        return true;
    } catch (error) {
        console.error("Failed to verify wallet signature", error);
        return "Failed to verify wallet signature";
    }
}

export interface updateWalletInput {
    userId: string;
    walletAddress: string;
    network?: string;
    status?: WalletStatus;
    default?: boolean;
    nickname?: string;
}

export async function updateWallet(
    input: updateWalletInput
): Promise<Wallet | string> {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const { userId, walletAddress, ...rest } = input;

            if (rest.default) {
                const wallet = await tx.wallet.findUnique({
                    where: { address: walletAddress },
                    select: { userId: true },
                });

                if (wallet) {
                    await tx.wallet.updateMany({
                        where: {
                            userId: wallet.userId,
                            default: true,
                            address: { not: walletAddress },
                        },
                        data: { default: false },
                    });
                }
            }

            const updatedWallet = await tx.wallet.update({
                where: { address: walletAddress },
                data: rest,
            });

            return updatedWallet;
        });

        return result;
    } catch (error) {
        console.error("Failed to update wallet:", error);
        return "Failed to update wallet";
    }
}

export interface getWalletsInput {
    userId: string;
    network?: string;
    status?: WalletStatus;
    provider?: string;
}

export async function getWallets(
    input?: getWalletsInput
): Promise<Wallet[] | string> {
    if (!input) {
        return [];
    }

    try {
        const where: Prisma.WalletWhereInput = {};

        if (input?.userId) {
            where.userId = input.userId;
        }

        if (input?.network) {
            where.network = input.network;
        }

        if (input?.status) {
            where.status = input.status;
        }

        if (input?.provider) {
            where.provider = input.provider;
        }

        const wallets = await prisma.wallet.findMany({
            where,
            orderBy: {
                lastAccessedAt: "desc",
            },
        });

        return wallets;
    } catch (error) {
        console.error("Failed to get wallets:", error);
        return "Failed to get wallets";
    }
}

export interface deleteWalletInput {
    userId: string;
    walletAddress: string;
}

export async function deleteWallet(
    input: deleteWalletInput
): Promise<boolean | string> {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({
                where: { address: input.walletAddress },
                select: { default: true },
            });

            if (wallet?.default) {
                return "Default wallet cannot be deleted";
            }

            await tx.wallet.delete({
                where: { address: input.walletAddress },
            });

            return true;
        });

        return result;
    } catch (error) {
        console.error("Failed to delete wallet:", error);
        return "Failed to delete wallet";
    }
}

export interface getDefaultUserWalletInput {
    userId: string;
}

export async function getDefaultUserWallet(
    input?: getDefaultUserWalletInput
): Promise<Wallet | string | null> {
    if (!input) {
        return null;
    }

    try {
        const wallet = await prisma.wallet.findFirst({
            where: { userId: input.userId, default: true },
        });

        if (!wallet) {
            const wallets = await prisma.wallet.findMany({
                where: { userId: input.userId },
                orderBy: {
                    lastAccessedAt: "desc",
                },
            });

            if (wallets.length === 0) {
                return "No wallets found";
            }

            const updatedWallet = await prisma.wallet.update({
                where: { id: wallets[0].id },
                data: { default: true },
            });

            return updatedWallet;
        }

        return wallet;
    } catch (error) {
        console.error("Failed to get default user wallet:", error);
        return "Failed to get default user wallet";
    }
}
