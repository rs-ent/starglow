/// app/actions/blockchain.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { encryptPrivateKey, decryptPrivateKey } from "@/lib/utils/encryption";
import { generatePrivateKey, privateKeyToAddress } from "viem/accounts";
import {
    createPublicClient,
    createWalletClient,
    http,
    Chain,
    Address,
    Hash,
    WalletClient,
    PublicClient,
    getContract,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { BlockchainNetwork, User } from "@prisma/client";
import { GetContractReturnType } from "viem";
import { getTokenOwners } from "./collectionContracts";
import { User2 } from "lucide-react";

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

export async function getEscrowWalletWithPrivateKeyByAddress(address: string) {
    try {
        const wallet = await prisma.escrowWallet.findUnique({
            where: { address },
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
        const privateKey = generatePrivateKey();
        const address = privateKeyToAddress(privateKey);

        return {
            success: true,
            data: {
                address,
                privateKey,
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
        const chain = await getChain(network);

        // Create viem public client instead of ethers provider
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

        // Get wallet balance in wei using viem
        const balanceWei = await publicClient.getBalance({
            address: address as Address,
        });

        // Convert wei to ether (formatted string) using viem utilities
        const balanceEther = Number(balanceWei) / 1e18;

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
                balanceEther: balanceEther.toString(),
                formatted: `${balanceEther.toFixed(6)} ${network.symbol}`,
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

export interface DeployContractInput {
    walletId: string;
    network: BlockchainNetwork;
    abi: any;
    bytecode: `0x${string}`;
    args?: any[];
}

export interface DeployContractResult {
    hash: Hash;
    contractAddress: Address;
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

export async function deployContract(
    input: DeployContractInput
): Promise<DeployContractResult> {
    const { walletId, network, abi, bytecode, args } = input;
    const chain = await getChain(network);

    const publicClient = createPublicClient({
        chain,
        transport: http(),
    });

    const escrowWallet = await getEscrowWalletWithPrivateKey(walletId);
    if (!escrowWallet.success || !escrowWallet.data) {
        throw new Error("Escrow wallet not found");
    }

    const privateKey = escrowWallet.data.privateKey;
    const formattedPrivateKey = privateKey.startsWith("0x")
        ? privateKey
        : `0x${privateKey}`;
    const account = privateKeyToAccount(formattedPrivateKey as Address);

    const walletClient = createWalletClient({
        account,
        chain,
        transport: http(),
    });

    const hash = await walletClient.deployContract({
        abi,
        bytecode,
        args: args || [],
    });

    const receipt = await publicClient.waitForTransactionReceipt({
        hash,
    });

    return {
        hash,
        contractAddress: receipt.contractAddress as Address,
    };
}

export interface TransactionToEstimate {
    functionName: string;
    args: any[];
}

export interface EstimateGasOptionsInput {
    publicClient: PublicClient;
    walletClient: WalletClient;
    contractAddress: Address;
    abi: any;
    transactions: TransactionToEstimate[];
    customOptions?: {
        maxFeePerGas?: bigint;
        maxPriorityFeePerGas?: bigint;
        gasLimit?: bigint;
    };
}

export interface EstimateGasOptions {
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
    gasLimit: bigint;
}

export async function estimateGasOptions(
    input: EstimateGasOptionsInput
): Promise<EstimateGasOptions> {
    try {
        const { publicClient, walletClient, transactions, customOptions } =
            input;

        const contract = getContract({
            address: input.contractAddress,
            abi: input.abi,
            client: walletClient,
        });

        const gasPrice = await publicClient.getGasPrice();
        let totalEstimatedGas = 0n;
        for (const tx of transactions) {
            const estimatedGas = await contract.estimateGas[tx.functionName](
                tx.args,
                { account: walletClient.account }
            );
            totalEstimatedGas += estimatedGas as unknown as bigint;
        }

        const gasOptions: EstimateGasOptions = {
            maxFeePerGas: customOptions?.maxFeePerGas || gasPrice * 2n,
            maxPriorityFeePerGas:
                customOptions?.maxPriorityFeePerGas || gasPrice / 2n,
            gasLimit:
                customOptions?.gasLimit || (totalEstimatedGas * 12n) / 10n,
        };

        return gasOptions;
    } catch (error) {
        console.error("Error estimating gas options:", error);
        throw new Error("Failed to estimate gas options");
    }
}

export interface EstimateGasForTransactionsInput {
    collectionAddress: string;
    walletId: string;
    transactions: TransactionToEstimate[];
}

export interface EstimateGasForTransactionsResult {
    success: boolean;
    data?: {
        maxFeePerGas: string; // bigint를 string으로 변환
        maxPriorityFeePerGas: string;
        gasLimit: string;
        estimatedGasCostInWei: string;
        estimatedGasCostInEth: number;
        networkSymbol: string;
        networkName: string;
    };
    error?: string;
}

export async function estimateGasForTransactions(
    input: EstimateGasForTransactionsInput
): Promise<EstimateGasForTransactionsResult> {
    try {
        const { collectionAddress, walletId, transactions } = input;

        const collection = await prisma.collectionContract.findUnique({
            where: { address: collectionAddress },
            include: { network: true },
        });

        if (!collection || !collection.network) {
            return {
                success: false,
                error: "Collection or network not found",
            };
        }

        const walletResult = await getEscrowWalletWithPrivateKey(walletId);
        if (!walletResult.success || !walletResult.data) {
            return {
                success: false,
                error: "Failed to get wallet with private key",
            };
        }

        const chain = await getChain(collection.network);

        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

        const privateKey = walletResult.data.privateKey;
        const formattedPrivateKey = privateKey.startsWith("0x")
            ? privateKey
            : `0x${privateKey}`;
        const account = privateKeyToAccount(formattedPrivateKey as Address);

        const walletClient = createWalletClient({
            account,
            chain,
            transport: http(),
        });

        const gasOptions = await estimateGasOptions({
            publicClient,
            walletClient,
            contractAddress: collectionAddress as Address,
            abi: collection.abi,
            transactions,
            customOptions: undefined,
        });

        const estimatedGasCostInWei =
            gasOptions.gasLimit * gasOptions.maxFeePerGas;
        const estimatedGasCostInEth = Number(estimatedGasCostInWei) / 1e18;

        return {
            success: true,
            data: {
                maxFeePerGas: gasOptions.maxFeePerGas.toString(),
                maxPriorityFeePerGas:
                    gasOptions.maxPriorityFeePerGas.toString(),
                gasLimit: gasOptions.gasLimit.toString(),
                estimatedGasCostInWei: estimatedGasCostInWei.toString(),
                estimatedGasCostInEth,
                networkSymbol: collection.network.symbol,
                networkName: collection.network.name,
            },
        };
    } catch (error) {
        console.error("Error estimating gas:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to estimate gas",
        };
    }
}

export interface TokenGateInput {
    userId: string;
    tokenType: "Collection" | "SGT";
    tokenAddress: string;
}

export interface TokenGateResult {
    success: boolean;
    data?: {
        hasToken: boolean;
        tokenCount: number;
        ownerWallets: string[];
        tokenIds: number[];
    };
    error?: string;
}

export async function tokenGate(
    input?: TokenGateInput
): Promise<TokenGateResult> {
    if (!input) {
        return {
            success: false,
            error: "No input provided",
            data: {
                hasToken: false,
                tokenCount: 0,
                ownerWallets: [],
                tokenIds: [],
            },
        };
    }

    if (!input.userId) {
        return {
            success: false,
            error: "No userId provided",
            data: {
                hasToken: false,
                tokenCount: 0,
                ownerWallets: [],
                tokenIds: [],
            },
        };
    }

    if (!input.tokenType) {
        return {
            success: false,
            error: "No tokenType provided",
            data: {
                hasToken: false,
                tokenCount: 0,
                ownerWallets: [],
                tokenIds: [],
            },
        };
    }

    if (!input.tokenAddress) {
        return {
            success: false,
            error: "No tokenAddress provided",
            data: {
                hasToken: false,
                tokenCount: 0,
                ownerWallets: [],
                tokenIds: [],
            },
        };
    }

    try {
        const { userId, tokenType, tokenAddress } = input;

        const user = (await prisma.user.findUnique({
            where: { id: userId },
            select: {
                wallets: {
                    where: { status: "ACTIVE" },
                    select: { address: true },
                },
            },
        })) as (User & { wallets: { address: string }[] }) | null;

        if (!user?.wallets || !user.wallets.length) {
            return {
                success: false,
                error: user ? "User has no active wallets" : "User not found",
                data: {
                    hasToken: false,
                    tokenCount: 0,
                    ownerWallets: [],
                    tokenIds: [],
                },
            };
        }

        const walletAddresses = new Set(
            user.wallets.map((w) => w.address.toLowerCase())
        );

        switch (tokenType) {
            case "Collection": {
                const tokenOwners = await getTokenOwners({
                    collectionAddress: tokenAddress,
                });

                const ownerMatches = tokenOwners.owners
                    .map((owner) => owner.toLowerCase())
                    .filter((owner) => walletAddresses.has(owner));

                const userTokenIds = tokenOwners.tokenIds.filter(
                    (tokenId, idx) =>
                        walletAddresses.has(
                            tokenOwners.owners[idx].toLowerCase()
                        )
                );

                return {
                    success: ownerMatches.length > 0,
                    data: {
                        hasToken: ownerMatches.length > 0,
                        tokenCount: ownerMatches.length,
                        ownerWallets: ownerMatches,
                        tokenIds: userTokenIds,
                    },
                };
            }

            case "SGT": {
                return {
                    success: false,
                    error: "SGT gating not implemented yet",
                    data: {
                        hasToken: false,
                        tokenCount: 0,
                        ownerWallets: [],
                        tokenIds: [],
                    },
                };
            }

            default:
                return {
                    success: false,
                    error: "Invalid token type",
                    data: {
                        hasToken: false,
                        tokenCount: 0,
                        ownerWallets: [],
                        tokenIds: [],
                    },
                };
        }
    } catch (error) {
        console.error("Error in token gate:", error);
        return {
            success: false,
            error: "Failed to check token ownership",
            data: {
                hasToken: false,
                tokenCount: 0,
                ownerWallets: [],
                tokenIds: [],
            },
        };
    }
}

export interface AdvancedTokenGateInput {
    userId: string;
    tokens: {
        tokenType: "Collection" | "SGT";
        tokenAddress: string;
    }[];
}

export interface AdvancedTokenGateResult {
    success: boolean;
    data?: {
        hasToken: {
            [key: string]: boolean;
        };
        tokenCount: {
            [key: string]: number;
        };
        ownerWallets: {
            [key: string]: string[];
        };
    };
    error?: string;
}

export async function advancedTokenGate(
    input: AdvancedTokenGateInput
): Promise<AdvancedTokenGateResult> {
    try {
        const { userId, tokens } = input;

        const user = (await prisma.user.findUnique({
            where: { id: userId },
            select: {
                wallets: {
                    where: { status: "ACTIVE" },
                    select: { address: true },
                },
            },
        })) as (User & { wallets: { address: string }[] }) | null;

        if (!user?.wallets || !user.wallets.length) {
            return {
                success: false,
                error: user ? "User has no active wallets" : "User not found",
                data: {
                    hasToken: {},
                    tokenCount: {},
                    ownerWallets: {},
                },
            };
        }

        const walletAddresses = new Set(
            user.wallets.map((w) => w.address.toLowerCase())
        );

        const results = await Promise.all(
            tokens.map(async (token) => {
                switch (token.tokenType) {
                    case "Collection": {
                        const tokenOwners = await getTokenOwners({
                            collectionAddress: token.tokenAddress,
                        });

                        const ownerMatches = tokenOwners.owners
                            .map((owner) => owner.toLowerCase())
                            .filter((owner) => walletAddresses.has(owner));

                        return {
                            address: token.tokenAddress,
                            hasToken: ownerMatches.length > 0,
                            tokenCount: ownerMatches.length,
                            ownerWallets: ownerMatches,
                        };
                    }
                    case "SGT": {
                        return {
                            address: token.tokenAddress,
                            hasToken: false,
                            tokenCount: 0,
                            ownerWallets: [],
                        };
                    }
                    default:
                        return {
                            address: token.tokenAddress,
                            hasToken: false,
                            tokenCount: 0,
                            ownerWallets: [],
                        };
                }
            })
        );

        const hasToken: { [key: string]: boolean } = {};
        const tokenCount: { [key: string]: number } = {};
        const ownerWallets: { [key: string]: string[] } = {};

        for (const result of results) {
            hasToken[result.address] = result.hasToken;
            tokenCount[result.address] = result.tokenCount;
            ownerWallets[result.address] = result.ownerWallets;
        }

        return {
            success: true,
            data: {
                hasToken,
                tokenCount,
                ownerWallets,
            },
        };
    } catch (error) {
        console.error("Error in advancedTokenGate:", error);
        return {
            success: false,
            error: "Failed to check token ownership",
            data: {
                hasToken: {},
                tokenCount: {},
                ownerWallets: {},
            },
        };
    }
}
