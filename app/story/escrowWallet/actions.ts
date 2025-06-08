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
import {
    http,
    formatUnits,
    createPublicClient,
    createWalletClient,
    Hex,
} from "viem";
import { privateKeyToAccount, Address, Account } from "viem/accounts";
import { getChain } from "@/app/actions/blockchain";
import SPGNFTCollection from "@/web3/artifacts/contracts/SPGNFTCollection.sol/SPGNFTCollection.json";
import { fetchPublicClient, fetchWalletClient } from "@/app/story/client";

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

        console.log("Verified wallets:", verifiedWallets);

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
