/// app/story/escrowWallet/actions.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import { BlockchainNetwork, EscrowWallet } from "@prisma/client";
import { encryptPrivateKey, decryptPrivateKey } from "@/lib/utils/encryption";
import { Prisma } from "@prisma/client";
import {
    StoryClient,
    StoryConfig,
    SupportedChainIds,
} from "@story-protocol/core-sdk";
import { http, formatUnits } from "viem";
import { privateKeyToAccount, Address, Account } from "viem/accounts";

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

async function fetchEscrowWalletBalance(
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

        const config: StoryConfig = {
            account: "0x0000000000000000000000000000000000000000",
            transport: http(network.rpcUrl as `http${string}`),
            chainId: network.name.toLowerCase() as SupportedChainIds,
        };

        const storyClient = StoryClient.newClient(config);

        const balances = await Promise.all(
            addresses.map(async (address) => {
                const balance = await fetchEscrowWalletBalance({
                    storyClient,
                    address,
                });
                return { address, balance };
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
