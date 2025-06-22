/// app/story/escrowWallet/actions.ts

"use server";

import { formatUnits } from "viem";

import { fetchPublicClient, fetchWalletClient } from "@/app/story/client";
import { prisma } from "@/lib/prisma/client";
import { encryptPrivateKey, decryptPrivateKey } from "@/lib/utils/encryption";
import SPGNFTCollection from "@/web3/artifacts/contracts/SPGNFTCollection.sol/SPGNFTCollection.json";

import type { EscrowWallet, Prisma } from "@prisma/client";
import type { StoryClient } from "@story-protocol/core-sdk";
import type { Hex, Address } from "viem";

export interface registerEscrowWalletInput {
    address: string;
    privateKey: string;
}

export async function registerEscrowWallet(
    input: registerEscrowWalletInput
): Promise<EscrowWallet | string> {
    try {
        const { address, privateKey } = input;

        const ecryptedParts = await encryptPrivateKey(privateKey);

        const result = await prisma.$transaction(async (tx) => {
            const existingWallet = await tx.escrowWallet.findUnique({
                where: {
                    address,
                },
            });

            if (existingWallet) {
                return existingWallet;
            }

            const wallet = await tx.escrowWallet.create({
                data: {
                    address,
                    privateKey: ecryptedParts.dbPart,
                    keyHash: ecryptedParts.keyHash,
                    nonce: ecryptedParts.nonce,
                    isActive: true,
                    balance: {},
                },
            });

            return wallet;
        });

        return result;
    } catch (error) {
        console.error("Error creating escrow wallet", error);
        return "Error creating escrow wallet";
    }
}

export interface fetchEscrowWalletPrivateKeyInput {
    userId?: string;
    address: string;
}

export async function fetchEscrowWalletPrivateKey(
    input: fetchEscrowWalletPrivateKeyInput
): Promise<string | null> {
    try {
        const { address } = input;

        const result = await prisma.$transaction(async (tx) => {
            const wallet = await tx.escrowWallet.findUnique({
                where: {
                    address,
                },
            });

            if (!wallet) {
                return null;
            }

            const decryptedKey = await decryptPrivateKey({
                dbPart: wallet.privateKey,
                blobPart: wallet.keyHash,
                keyHash: wallet.keyHash,
                nonce: wallet.nonce,
            });

            return decryptedKey;
        });

        return result;
    } catch (error) {
        console.error("Error fetching escrow wallet private key", error);
        return null;
    }
}

export interface getEscrowWalletsInput {
    isActive?: boolean;
}

export async function getEscrowWallets(
    input?: getEscrowWalletsInput
): Promise<EscrowWallet[]> {
    try {
        if (!input) {
            return await prisma.escrowWallet.findMany();
        }

        const where: Prisma.EscrowWalletWhereInput = {};
        if (input.isActive !== undefined) {
            where.isActive = input.isActive;
        }

        const wallets = await prisma.escrowWallet.findMany({
            where,
        });

        return wallets;
    } catch (error) {
        console.error("Error getting escrow wallets", error);
        return [];
    }
}

interface fetchEscrowWalletBalanceInput {
    storyClient: StoryClient;
    address: string;
}

export async function fetchEscrowWalletBalance(
    input: fetchEscrowWalletBalanceInput
): Promise<string> {
    try {
        if (!input) {
            return "0";
        }

        const { storyClient, address } = input;

        const safeAddress = address.startsWith("0x") ? address : `0x${address}`;
        const balance = await storyClient.getBalance(safeAddress);
        const formattedBalance = formatUnits(balance, 18);

        return formattedBalance;
    } catch (error) {
        console.error("Error getting escrow wallet balance", error);
        return "0";
    }
}

export interface fetchEscrowWalletsBalanceInput {
    networkId: string;
    addresses: string[];
}

export async function fetchEscrowWalletsBalance(
    input: fetchEscrowWalletsBalanceInput
): Promise<{ address: string; balance: string }[]> {
    try {
        const { networkId, addresses } = input;

        const network = await prisma.blockchainNetwork.findUnique({
            where: {
                id: networkId,
            },
        });

        if (!network) {
            console.error("Network not found");
            return [];
        }

        const publicClient = await fetchPublicClient({
            network: network,
        });

        const balances = await Promise.all(
            addresses.map(async (address) => {
                const balance = await publicClient.getBalance({
                    address: address as Address,
                });

                const formattedBalance = formatUnits(balance, 18);

                return { address, balance: formattedBalance };
            })
        );

        return balances;
    } catch (error) {
        console.error("Error getting batch escrow wallet balance", error);
        return [];
    }
}

export interface setActiveEscrowWalletInput {
    address: string;
    isActive: boolean;
}

export async function setActiveEscrowWallet(
    input: setActiveEscrowWalletInput
): Promise<EscrowWallet | string> {
    try {
        const { address, isActive } = input;
        const wallet = await prisma.escrowWallet.update({
            where: {
                address,
            },
            data: {
                isActive,
            },
        });

        return wallet;
    } catch (error) {
        console.error("Error setting active escrow wallet", error);
        return "Error setting active escrow wallet";
    }
}

export interface getRegisteredEscrowWalletsInput {
    spgAddress: string;
}

export async function getRegisteredEscrowWallets(
    input?: getRegisteredEscrowWalletsInput
): Promise<string[]> {
    if (!input) {
        return [];
    }

    try {
        const { spgAddress } = input;

        const spg = await prisma.story_spg.findUnique({
            where: {
                address: spgAddress,
            },
            include: {
                network: true,
            },
        });

        if (!spg) {
            console.error("SPG not found");
            return [];
        }

        const registeredWallets = await prisma.escrowWallet.findMany({
            where: {
                isActive: true,
            },
            select: {
                address: true,
            },
        });

        const publicClient = await fetchPublicClient({
            network: spg.network,
        });

        const verifiedWallets = await Promise.all(
            registeredWallets.map(async (wallet) => {
                try {
                    const isEscrowWallet = await publicClient.readContract({
                        address: spgAddress as Hex,
                        abi: SPGNFTCollection.abi,
                        functionName: "isEscrowWallet",
                        args: [wallet.address as Hex],
                    });

                    return isEscrowWallet ? wallet.address : null;
                } catch (error) {
                    console.error(
                        `Error checking wallet ${wallet.address}:`,
                        error
                    );
                    return null;
                }
            })
        );

        return verifiedWallets.filter(
            (address): address is string => address !== null
        );
    } catch (error) {
        console.error("Error getting registered escrow wallets", error);
        return [];
    }
}

export interface addEscrowWalletToSPGInput {
    spgAddress: string;
    walletAddress: string;
}

export async function addEscrowWalletToSPG(
    input: addEscrowWalletToSPGInput
): Promise<string | null> {
    try {
        const { spgAddress, walletAddress } = input;

        const spg = await prisma.story_spg.findUnique({
            where: {
                address: spgAddress,
            },
            include: {
                network: true,
            },
        });

        if (!spg) {
            console.error("SPG not found");
            return null;
        }

        const publicClient = await fetchPublicClient({
            network: spg.network,
        });

        const walletClient = await fetchWalletClient({
            network: spg.network,
            walletAddress: walletAddress,
        });

        const { request } = await publicClient.simulateContract({
            address: spgAddress as Hex,
            abi: SPGNFTCollection.abi,
            functionName: "addEscrowWallet",
            args: [walletAddress],
            account: walletClient.account,
        });

        const txHash = await walletClient.writeContract(request);

        return txHash;
    } catch (error) {
        console.error("Error adding escrow wallet to SPG", error);
        return null;
    }
}
