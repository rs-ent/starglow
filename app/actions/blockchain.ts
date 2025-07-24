/// app/actions/blockchain.ts

"use server";

import { revalidatePath } from "next/cache";
import {
    createPublicClient,
    createWalletClient,
    http,
    getContract,
} from "viem";
import {
    generatePrivateKey,
    privateKeyToAddress,
    privateKeyToAccount,
} from "viem/accounts";

import { prisma } from "@/lib/prisma/client";
import { encryptPrivateKey, decryptPrivateKey } from "@/lib/utils/encryption";

import type { BlockchainNetwork } from "@prisma/client";
import type { Chain, Address, Hash, WalletClient, PublicClient } from "viem";

import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";

// 블록체인 네트워크 관련 함수
export async function getBlockchainNetworks(includeInactive = false) {
    try {
        const networks = await prisma.blockchainNetwork.findMany({
            cacheStrategy: getCacheStrategy("oneHour"),
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
            cacheStrategy: getCacheStrategy("oneHour"),
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
            cacheStrategy: getCacheStrategy("oneHour"),
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
            cacheStrategy: getCacheStrategy("oneHour"),
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
            cacheStrategy: getCacheStrategy("oneHour"),
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
            cacheStrategy: getCacheStrategy("oneHour"),
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
            cacheStrategy: getCacheStrategy("oneHour"),
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
            cacheStrategy: getCacheStrategy("oneHour"),
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
            cacheStrategy: getCacheStrategy("oneHour"),
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
            cacheStrategy: getCacheStrategy("oneHour"),
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
                cacheStrategy: getCacheStrategy("oneHour"),
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
                cacheStrategy: getCacheStrategy("oneHour"),
                where: {
                    name: { equals: name, mode: "insensitive" },
                    isActive: true,
                },
            });
        } else {
            // 체인 ID로만 조회
            network = await prisma.blockchainNetwork.findFirst({
                cacheStrategy: getCacheStrategy("oneHour"),
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

    try {
        const chain = await getChain(network);

        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

        // Step 3: 에스크로 지갑 조회 및 개인키 복호화
        const escrowWallet = await getEscrowWalletWithPrivateKey(walletId);

        if (!escrowWallet.success || !escrowWallet.data) {
            console.error(
                "[deployContract] ❌ Escrow wallet fetch failed:",
                escrowWallet.error
            );
            throw new Error(`Escrow wallet not found: ${escrowWallet.error}`);
        }

        // Step 4: 개인키 형식 확인 및 계정 생성
        const privateKey = escrowWallet.data.privateKey;

        if (!privateKey) {
            console.error("[deployContract] ❌ Private key is missing");
            throw new Error("Private key is missing from escrow wallet");
        }

        const formattedPrivateKey = privateKey.startsWith("0x")
            ? privateKey
            : `0x${privateKey}`;

        let account;
        try {
            account = privateKeyToAccount(formattedPrivateKey as Address);
        } catch (accountError) {
            console.error(
                "[deployContract] ❌ Account creation failed:",
                accountError
            );
            throw new Error(
                `Failed to create account from private key: ${accountError}`
            );
        }

        // Step 5: Wallet Client 생성
        let walletClient;
        try {
            walletClient = createWalletClient({
                account,
                chain,
                transport: http(),
            });
        } catch (walletError) {
            console.error(
                "[deployContract] ❌ Wallet client creation failed:",
                walletError
            );
            throw new Error(`Failed to create wallet client: ${walletError}`);
        }

        // Step 6: 잔액 확인 (선택사항, 정보용)
        try {
            const balance = await publicClient.getBalance({
                address: account.address,
            });
            const balanceEth = Number(balance) / 1e18;

            if (balanceEth < 0.001) {
                console.warn(
                    "[deployContract] ⚠️ Low balance warning: may not have enough gas for deployment"
                );
            }
        } catch (balanceError) {
            console.warn(
                "[deployContract] ⚠️ Balance check failed (continuing anyway):",
                balanceError
            );
        }

        // Step 8: 컨트랙트 배포

        let hash;
        try {
            // Berachain은 가스 가격이 낮으면 트랜잭션이 처리되지 않으므로 최소 가스 가격 설정
            let gasPrice: bigint | undefined;
            let gas: bigint | undefined;

            if (chain.id === 80094) {
                // Berachain
                const currentGasPrice = await publicClient.getGasPrice();
                const minGasPrice = BigInt("2000000000"); // 2 gwei (복잡한 컨트랙트용)
                gasPrice =
                    currentGasPrice > minGasPrice
                        ? currentGasPrice * 2n // 현재 가격의 2배
                        : minGasPrice;

                // 복잡한 컨트랙트를 위한 가스 리미트 증가 (V2는 49KB)
                gas = BigInt("15000000"); // 15M gas (일반적으로 8M인데 V2는 더 필요)
            }

            hash = await walletClient.deployContract({
                abi,
                bytecode,
                args: args || [],
                gasPrice,
                gas, // 가스 리미트 설정
            });
        } catch (deployError) {
            console.error(
                "[deployContract] ❌ Contract deployment failed:",
                deployError
            );

            // 배포 에러 타입별 상세 정보
            if (deployError instanceof Error) {
                const errorMessage = deployError.message.toLowerCase();
                if (errorMessage.includes("insufficient funds")) {
                    console.error(
                        "[deployContract] 💰 Insufficient funds for deployment"
                    );
                } else if (errorMessage.includes("gas")) {
                    console.error(
                        "[deployContract] ⛽ Gas-related deployment error"
                    );
                } else if (errorMessage.includes("nonce")) {
                    console.error(
                        "[deployContract] 🔢 Nonce-related deployment error"
                    );
                } else if (errorMessage.includes("revert")) {
                    console.error(
                        "[deployContract] 🔄 Contract constructor reverted"
                    );
                }
            }

            throw new Error(`Contract deployment failed: ${deployError}`);
        }

        // Step 9: 트랜잭션 영수증 대기 (강화된 로직)

        let receipt: Awaited<
            ReturnType<typeof publicClient.waitForTransactionReceipt>
        > | null = null;
        const maxAttempts = 3;
        const baseTimeout = 600000; // 10분 (V2 컨트랙트 복잡성 고려)

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                receipt = await publicClient.waitForTransactionReceipt({
                    hash,
                    timeout: baseTimeout + (attempt - 1) * 120000, // 5분, 7분, 9분
                });

                break; // 성공하면 루프 종료
            } catch (receiptError) {
                console.warn(
                    `[deployContract] ⚠️ Attempt ${attempt} failed:`,
                    receiptError instanceof Error
                        ? receiptError.message
                        : receiptError
                );

                if (attempt === maxAttempts) {
                    // 마지막 시도에서도 실패한 경우
                    console.error(
                        "[deployContract] ❌ All receipt waiting attempts failed"
                    );

                    // 트랜잭션 상태를 한 번 더 확인
                    try {
                        const transaction = await publicClient.getTransaction({
                            hash,
                        });

                        if (transaction.blockNumber) {
                            // 트랜잭션이 블록에 포함되었다면 receipt를 다시 시도
                            receipt = await publicClient.getTransactionReceipt({
                                hash,
                            });

                            break;
                        }
                    } catch (fallbackError) {
                        console.error(
                            "[deployContract] ❌ Fallback transaction check failed:",
                            fallbackError
                        );
                    }

                    console.error(
                        "[deployContract] 💡 Transaction may still be pending or failed."
                    );
                    console.error(
                        `[deployContract] 🔗 Check status manually: ${network.explorerUrl}/tx/${hash}`
                    );

                    throw new Error(
                        `Transaction receipt failed after ${maxAttempts} attempts. Transaction hash: ${hash}. Please check the explorer: ${network.explorerUrl}/tx/${hash}`
                    );
                } else {
                    await new Promise((resolve) => setTimeout(resolve, 30000));
                }
            }
        }

        // Step 10: 결과 검증

        if (!receipt) {
            console.error(
                "[deployContract] ❌ No receipt obtained after all attempts"
            );
            throw new Error(
                "Failed to obtain transaction receipt - deployment status unknown"
            );
        }

        if (!receipt.contractAddress) {
            console.error(
                "[deployContract] ❌ Contract address is null in receipt"
            );
            throw new Error(
                "Contract address is null - deployment may have failed"
            );
        }

        if (receipt.status !== "success") {
            console.error(
                "[deployContract] ❌ Transaction status is not success:",
                receipt.status
            );
            throw new Error(
                `Transaction failed with status: ${receipt.status}`
            );
        }

        const result = {
            hash,
            contractAddress: receipt.contractAddress as Address,
        };

        return result;
    } catch (error) {
        console.error("[deployContract] ❌ Deployment failed:", error);
        console.error("[deployContract] Error details:", {
            name: error instanceof Error ? error.name : "Unknown",
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : "No stack trace",
        });

        // 상위 함수로 에러 전파
        throw error;
    }
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
            cacheStrategy: getCacheStrategy("oneHour"),
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
