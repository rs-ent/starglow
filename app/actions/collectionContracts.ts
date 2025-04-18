/// app/actions/collectionContracts.ts

"use server";

import { revalidatePath } from "next/cache";
import { createWalletClient, http, parseGwei, createPublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { COLLECTION_ABI } from "../blockchain/abis/Collection";
import { getBlockchainNetworkById } from "./blockchain";
import { prisma } from "@/lib/prisma/client";
import { createNFTMetadata } from "./metadata";
import { BooleanLiteralTypeAnnotation } from "@babel/types";

interface SaveCollectionContractParams {
    collectionKey: string;
    address: string;
    factoryAddress: string;
    name: string;
    symbol: string;
    maxSupply: number;
    mintPrice: string;
    baseURI: string;
    contractURI: string;
    networkId: string;
    createdBy?: string;
    transactionHash?: string;
}

export async function saveCollectionContract(
    params: SaveCollectionContractParams
) {
    try {
        // Factory 조회
        const factory = await prisma.factoryContract.findFirst({
            where: {
                address: params.factoryAddress,
                networkId: params.networkId,
            },
        });

        if (!factory) {
            return {
                success: false,
                error: `Factory not found with address ${params.factoryAddress} on network ${params.networkId}`,
            };
        }

        // Collection 저장
        const collection = await prisma.collectionContract.create({
            data: {
                key: params.collectionKey,
                address: params.address,
                name: params.name,
                symbol: params.symbol,
                maxSupply: params.maxSupply,
                mintPrice: params.mintPrice,
                baseURI: params.baseURI,
                contractURI: params.contractURI,
                factoryId: factory.id,
                networkId: params.networkId,
                createdBy: params.createdBy || "admin",
                txHash: params.transactionHash,
            },
        });

        // Factory collections 배열에 컬렉션 주소 추가
        await prisma.factoryContract.update({
            where: { id: factory.id },
            data: {
                collections: {
                    push: params.address,
                },
            },
        });

        return { success: true, data: collection };
    } catch (error) {
        console.error("Failed to save collection contract:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to save collection contract",
        };
    }
}

export async function getCollectionContracts() {
    try {
        const collections = await prisma.collectionContract.findMany({
            include: {
                network: true,
                factory: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return { success: true, data: collections };
    } catch (error) {
        console.error("Error fetching collection contracts:", error);
        return {
            success: false,
            error: "Failed to fetch collection contracts",
        };
    }
}

export async function getCollectionContract(id: string) {
    try {
        const collection = await prisma.collectionContract.findUnique({
            where: { id },
            include: {
                network: true,
                factory: true,
            },
        });

        if (!collection) {
            return { success: false, error: "Collection not found" };
        }

        return { success: true, data: collection };
    } catch (error) {
        console.error("Error fetching collection contract:", error);
        return { success: false, error: "Failed to fetch collection contract" };
    }
}

// Helper function to safely stringify objects with BigInt values
function safeStringify(obj: any, indent = 2) {
    return JSON.stringify(
        obj,
        (_, value) => (typeof value === "bigint" ? value.toString() : value),
        indent
    );
}

// Export interfaces for use in mutations
export interface EstimateMintGasParams {
    collectionAddress: string;
    networkId: string;
    to: string;
    quantity: number;
    privateKey?: string;
}

export interface EstimateMintGasResult {
    success: boolean;
    data?: {
        gasLimit: bigint;
        gasPrice: bigint;
        estimatedGasCost: bigint;
        estimatedGasCostInEth: string;
        estimatedGasCostInUsd?: string;
        networkSymbol: string;
    };
    error?: string;
}

/**
 * Estimates gas cost for minting tokens
 */
export async function estimateMintGas(
    params: EstimateMintGasParams & { privateKey?: string }
): Promise<EstimateMintGasResult> {
    try {
        console.log("===== estimateMintGas: Starting gas estimation =====");
        const { collectionAddress, networkId, to, quantity } = params;

        // 1. 파라미터 검증
        if (!collectionAddress?.startsWith("0x")) {
            return {
                success: false,
                error: "Invalid collection address format - must start with 0x",
            };
        }
        if (!to?.startsWith("0x")) {
            return {
                success: false,
                error: "Invalid recipient address format - must start with 0x",
            };
        }
        if (quantity <= 0) {
            return {
                success: false,
                error: "Quantity must be greater than 0",
            };
        }

        // 2. 네트워크 설정
        console.log(`Setting up network: ${networkId}`);
        const networkResult = await getBlockchainNetworkById(networkId);
        if (!networkResult.success || !networkResult.data) {
            return {
                success: false,
                error: `Network not found: ${networkId}`,
            };
        }
        const networkData = networkResult.data;

        // 3. 가스 예상 계산
        const publicClient = createPublicClient({
            transport: http(networkData.rpcUrl),
        });

        // 3.1 현재 가스 가격 가져오기
        const gasPrice = await publicClient.getGasPrice();

        // 개인키가 제공된 경우 해당 계정으로 시뮬레이션
        let accountToUse = undefined;
        if (params.privateKey) {
            let formattedPrivateKey = params.privateKey;
            if (!formattedPrivateKey.startsWith("0x")) {
                formattedPrivateKey = `0x${formattedPrivateKey}`;
            }
            accountToUse = privateKeyToAccount(
                formattedPrivateKey as `0x${string}`
            );
        }

        // 가스 사용량 예상 (계정 정보 포함)
        const gasLimit = await publicClient.estimateContractGas({
            address: collectionAddress as `0x${string}`,
            abi: COLLECTION_ABI,
            functionName: "batchMint",
            args: [to as `0x${string}`, BigInt(quantity), BigInt(1000000000)],
            account: accountToUse,
        });

        // 3.3 총 가스 비용 계산
        const estimatedGasCost = gasLimit * gasPrice;

        // 3.4 ETH 단위로 변환 (wei → ether)
        const estimatedGasCostInEth =
            (estimatedGasCost / BigInt(10 ** 18)).toString() +
            "." +
            (estimatedGasCost % BigInt(10 ** 18))
                .toString()
                .padStart(18, "0")
                .substring(0, 6);

        return {
            success: true,
            data: {
                gasLimit,
                gasPrice,
                estimatedGasCost,
                estimatedGasCostInEth,
                networkSymbol: networkData.symbol,
            },
        };
    } catch (error) {
        console.error("Error estimating gas:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to estimate gas cost",
        };
    }
}

export interface MintTokensParams {
    collectionAddress: string;
    networkId: string;
    to: string;
    quantity: number;
    privateKey: string;
    gasMaxFee?: string;
    gasMaxPriorityFee?: string;
    gasLimit?: string;
}

export interface MintTokensResult {
    success: boolean;
    data?: {
        transactionHash: string;
        startTokenId: number;
        quantity: number;
        tokenIdRange: {
            start: number;
            end: number;
        };
        nftIds: string[];
        blockNumber: number;
        explorerUrl: string;
    };
    error?: string;
}

/**
 * Mints new tokens in a collection
 */
export async function mintTokens(
    params: MintTokensParams
): Promise<MintTokensResult> {
    try {
        console.log("===== mintTokens: Starting token minting =====");
        const {
            collectionAddress,
            networkId,
            to,
            quantity,
            privateKey,
            gasMaxFee,
            gasMaxPriorityFee,
            gasLimit,
        } = params;

        // 1. 기본 파라미터 검증
        if (!collectionAddress?.startsWith("0x")) {
            return {
                success: false,
                error: "Invalid collection address format",
            };
        }
        if (!to?.startsWith("0x")) {
            return {
                success: false,
                error: "Invalid recipient address format",
            };
        }
        if (quantity <= 0) {
            return { success: false, error: "Quantity must be greater than 0" };
        }

        // 2. Collection 데이터 검증
        const collection = await prisma.collectionContract.findUnique({
            where: { address: collectionAddress },
        });

        if (!collection) {
            return {
                success: false,
                error: "Collection not found in database",
            };
        }

        // URI 존재 여부만 확인
        if (!collection.baseURI) {
            return { success: false, error: "Collection baseURI is not set" };
        }

        // 3. 네트워크 설정
        const networkResult = await getBlockchainNetworkById(networkId);
        if (!networkResult.success || !networkResult.data) {
            return { success: false, error: `Network not found: ${networkId}` };
        }
        const networkData = networkResult.data;

        // 4. 클라이언트 설정
        const account = privateKeyToAccount(
            (privateKey.startsWith("0x")
                ? privateKey
                : `0x${privateKey}`) as `0x${string}`
        );

        const chain = {
            id: networkData.chainId,
            name: networkData.name,
            nativeCurrency: {
                name: networkData.name,
                symbol: networkData.symbol,
                decimals: 18,
            },
            rpcUrls: {
                default: { http: [networkData.rpcUrl] },
            },
        } as const;

        const walletClient = createWalletClient({
            account,
            chain,
            transport: http(),
        });

        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

        // 5. 가스 옵션 설정
        const gasOptions: any = {
            ...(gasMaxFee && { maxFeePerGas: parseGwei(gasMaxFee) }),
            ...(gasMaxPriorityFee && {
                maxPriorityFeePerGas: parseGwei(gasMaxPriorityFee),
            }),
            ...(gasLimit && { gas: BigInt(gasLimit) }),
        };

        // 6. 컨트랙트 존재 여부 확인
        const code = await publicClient.getCode({
            address: collectionAddress as `0x${string}`,
        });

        if (!code || code === "0x") {
            return {
                success: false,
                error: "Collection contract does not exist at the provided address",
            };
        }

        // 7. 컨트랙트 상태 검증
        const [mintingEnabled, isPaused, owner, totalSupply, maxSupply] =
            await Promise.all([
                publicClient
                    .readContract({
                        address: collectionAddress as `0x${string}`,
                        abi: COLLECTION_ABI,
                        functionName: "mintingEnabled",
                    })
                    .catch(() => false),
                publicClient
                    .readContract({
                        address: collectionAddress as `0x${string}`,
                        abi: COLLECTION_ABI,
                        functionName: "paused",
                    })
                    .catch(() => true),
                publicClient
                    .readContract({
                        address: collectionAddress as `0x${string}`,
                        abi: COLLECTION_ABI,
                        functionName: "owner",
                    })
                    .catch(() => null),
                publicClient.readContract({
                    address: collectionAddress as `0x${string}`,
                    abi: COLLECTION_ABI,
                    functionName: "totalSupply",
                }),
                publicClient.readContract({
                    address: collectionAddress as `0x${string}`,
                    abi: COLLECTION_ABI,
                    functionName: "maxSupply",
                }),
            ]);

        // 8. 상태 검증
        if (!mintingEnabled) {
            return { success: false, error: "Minting is currently disabled" };
        }
        if (isPaused) {
            return { success: false, error: "Contract is paused" };
        }
        if (totalSupply + BigInt(quantity) > maxSupply) {
            return {
                success: false,
                error: `Only ${Number(
                    maxSupply - totalSupply
                )} tokens available`,
            };
        }

        const baseURI = collection.baseURI;
        const correctedBaseURI = baseURI.replace("contract.json", "");
        const setBaseURITx = await walletClient.writeContract({
            address: collectionAddress as `0x${string}`,
            abi: COLLECTION_ABI,
            functionName: "setBaseURI",
            args: [correctedBaseURI],
            ...gasOptions,
        });

        console.log(`BaseURI update transaction sent: ${setBaseURITx}`);

        // 트랜잭션 완료 대기
        await publicClient.waitForTransactionReceipt({
            hash: setBaseURITx,
        });

        console.log(`Successfully BaseURI set to ${correctedBaseURI}`);

        // 9. 민팅 실행
        const mintHash = await walletClient.writeContract({
            address: collectionAddress as `0x${string}`,
            abi: COLLECTION_ABI,
            functionName: "batchMint",
            args: [to as `0x${string}`, BigInt(quantity), BigInt(1000000000)],
            ...gasOptions,
        });

        const mintReceipt = await publicClient.waitForTransactionReceipt({
            hash: mintHash,
        });

        if (mintReceipt.status !== "success") {
            return { success: false, error: "Minting transaction failed" };
        }

        // 10. DB 업데이트
        const startTokenId = Number(totalSupply);
        const tokenIds = Array.from(
            { length: quantity },
            (_, i) => startTokenId + i
        );

        // 메타데이터 생성
        try {
            console.log(
                `Generating metadata for tokens: ${startTokenId} to ${
                    startTokenId + quantity - 1
                }`
            );
            await createNFTMetadata(collection, quantity, startTokenId);
        } catch (metadataError) {
            console.error("Error generating metadata:", metadataError);
        }

        const savedNfts = await prisma.$transaction(async (tx) => {
            // NFT 데이터 생성
            await tx.nFT.createMany({
                data: tokenIds.map((tokenId) => ({
                    tokenId,
                    collectionId: collection.id,
                    ownerAddress: to,
                    metadataUri: `${collection.baseURI.replace(
                        "contract.json",
                        ""
                    )}${tokenId}`,
                    networkId,
                    transactionHash: mintHash,
                    mintedBy: to,
                    mintPrice: collection.mintPrice,
                    name: `${collection.name} #${tokenId}`,
                })),
            });

            // NFT 조회
            const saved = await tx.nFT.findMany({
                where: {
                    collectionId: collection.id,
                    tokenId: { in: tokenIds },
                },
                select: { id: true, tokenId: true },
            });

            // 이벤트 생성
            await tx.nFTEvent.createMany({
                data: saved.map((nft) => ({
                    nftId: nft.id,
                    collectionId: collection.id,
                    eventType: "Mint",
                    fromAddress: "0x0000000000000000000000000000000000000000",
                    toAddress: to,
                    price: collection.mintPrice,
                    transactionHash: mintHash,
                    blockNumber: Number(mintReceipt.blockNumber),
                })),
            });

            // Collection 업데이트
            await tx.collectionContract.update({
                where: { id: collection.id },
                data: { mintedCount: { increment: quantity } },
            });

            return saved;
        });

        revalidatePath("/admin/onchain");

        return {
            success: true,
            data: {
                transactionHash: mintHash,
                startTokenId,
                quantity,
                tokenIdRange: {
                    start: startTokenId,
                    end: startTokenId + quantity - 1,
                },
                nftIds: savedNfts.map((nft) => nft.id),
                blockNumber: Number(mintReceipt.blockNumber),
                explorerUrl: `${networkData.explorerUrl}/tx/${mintHash}`,
            },
        };
    } catch (error) {
        console.error("Error minting tokens:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

export interface SetBaseURIParams {
    collectionAddress: string;
    networkId: string;
    baseURI: string;
    privateKey: string;
    gasMaxFee?: string;
    gasMaxPriorityFee?: string;
    gasLimit?: string;
}

export interface SetBaseURIResult {
    success: boolean;
    data?: {
        transactionHash: string;
        baseURI: string;
    };
    error?: string;
}

/**
 * Sets the base URI for a collection
 */
export async function setBaseURI(
    params: SetBaseURIParams
): Promise<SetBaseURIResult> {
    try {
        console.log("===== setBaseURI: Updating collection base URI =====");
        const {
            collectionAddress,
            networkId,
            baseURI,
            privateKey,
            gasMaxFee,
            gasMaxPriorityFee,
            gasLimit,
        } = params;

        // Validate parameters
        if (!collectionAddress || !baseURI) {
            return {
                success: false,
                error: "Invalid parameters: address and baseURI are required",
            };
        }

        // Get network information
        const networkResult = await getBlockchainNetworkById(networkId);
        if (!networkResult.success || !networkResult.data) {
            return {
                success: false,
                error: `Network not found: ${networkId}`,
            };
        }
        const networkData = networkResult.data;

        // Format private key
        let formattedPrivateKey = privateKey;
        if (!formattedPrivateKey.startsWith("0x")) {
            formattedPrivateKey = `0x${formattedPrivateKey}`;
        }

        // Create account
        const account = privateKeyToAccount(
            formattedPrivateKey as `0x${string}`
        );
        console.log(`Using account: ${account.address}`);

        // Create chain configuration
        const chain = {
            id: networkData.chainId,
            name: networkData.name,
            nativeCurrency: {
                name: networkData.name,
                symbol: networkData.symbol,
                decimals: 18,
            },
            rpcUrls: {
                default: {
                    http: [networkData.rpcUrl],
                },
            },
        } as const;

        // Create wallet client
        const walletClient = createWalletClient({
            account,
            chain,
            transport: http(),
        });

        // Create public client for read operations
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

        // Check if the collection exists
        console.log(`Checking collection at ${collectionAddress}`);
        const code = await publicClient.getCode({
            address: collectionAddress as `0x${string}`,
        });
        if (!code || code === "0x") {
            return {
                success: false,
                error: "Collection contract does not exist at the provided address",
            };
        }

        // Check if the account is the owner of the contract
        try {
            const owner = await publicClient.readContract({
                address: collectionAddress as `0x${string}`,
                abi: COLLECTION_ABI,
                functionName: "owner",
            });

            if (owner !== account.address) {
                return {
                    success: false,
                    error: "Only the owner can set the base URI",
                };
            }
        } catch (error) {
            console.warn("Could not check contract owner:", error);
            return {
                success: false,
                error: "Failed to verify contract ownership",
            };
        }

        // Set up gas options
        const gasOptions: any = {};
        if (gasMaxFee) {
            gasOptions.maxFeePerGas = parseGwei(gasMaxFee);
        }
        if (gasMaxPriorityFee) {
            gasOptions.maxPriorityFeePerGas = parseGwei(gasMaxPriorityFee);
        }
        if (gasLimit) {
            gasOptions.gas = BigInt(gasLimit);
        }

        // Call setBaseURI
        console.log(`Setting base URI to: ${baseURI}`);
        const hash = await walletClient.writeContract({
            address: collectionAddress as `0x${string}`,
            abi: COLLECTION_ABI,
            functionName: "setBaseURI",
            args: [baseURI],
            ...gasOptions,
        });

        console.log(`Transaction sent! Hash: ${hash}`);

        // Wait for transaction confirmation
        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
        });

        console.log(`Transaction mined in block ${receipt.blockNumber}`);

        // Verify transaction was successful
        if (receipt.status !== "success") {
            return {
                success: false,
                error: "Transaction failed to execute successfully",
            };
        }

        // Revalidate paths
        revalidatePath("/admin/onchain");

        return {
            success: true,
            data: {
                transactionHash: hash,
                baseURI,
            },
        };
    } catch (error) {
        console.error("Error setting base URI:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error setting base URI",
        };
    }
}

export interface TogglePauseParams {
    collectionAddress: string;
    networkId: string;
    pause: boolean; // true to pause, false to unpause
    privateKey: string;
    gasMaxFee?: string;
    gasMaxPriorityFee?: string;
    gasLimit?: string;
}

export interface TogglePauseResult {
    success: boolean;
    data?: {
        transactionHash: string;
        paused: boolean;
    };
    error?: string;
}

/**
 * Pauses or unpauses a collection
 */
export async function togglePause(
    params: TogglePauseParams
): Promise<TogglePauseResult> {
    try {
        const {
            collectionAddress,
            networkId,
            pause,
            privateKey,
            gasMaxFee,
            gasMaxPriorityFee,
            gasLimit,
        } = params;

        const operation = pause ? "pause" : "unpause";
        console.log(`===== togglePause: ${operation} collection =====`);

        // Get network information
        const networkResult = await getBlockchainNetworkById(networkId);
        if (!networkResult.success || !networkResult.data) {
            return {
                success: false,
                error: `Network not found: ${networkId}`,
            };
        }
        const networkData = networkResult.data;

        // Format private key
        let formattedPrivateKey = privateKey;
        if (!formattedPrivateKey.startsWith("0x")) {
            formattedPrivateKey = `0x${formattedPrivateKey}`;
        }

        // Create account
        const account = privateKeyToAccount(
            formattedPrivateKey as `0x${string}`
        );
        console.log(`Using account: ${account.address}`);

        // Create chain configuration
        const chain = {
            id: networkData.chainId,
            name: networkData.name,
            nativeCurrency: {
                name: networkData.name,
                symbol: networkData.symbol,
                decimals: 18,
            },
            rpcUrls: {
                default: {
                    http: [networkData.rpcUrl],
                },
            },
        } as const;

        // Create wallet client
        const walletClient = createWalletClient({
            account,
            chain,
            transport: http(),
        });

        // Create public client for read operations
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

        // Check if the collection exists
        console.log(`Checking collection at ${collectionAddress}`);
        const code = await publicClient.getCode({
            address: collectionAddress as `0x${string}`,
        });
        if (!code || code === "0x") {
            return {
                success: false,
                error: "Collection contract does not exist at the provided address",
            };
        }

        // Check if the account is the owner of the contract
        try {
            const owner = await publicClient.readContract({
                address: collectionAddress as `0x${string}`,
                abi: COLLECTION_ABI,
                functionName: "owner",
            });

            if (owner !== account.address) {
                return {
                    success: false,
                    error: "Only the owner can pause/unpause the contract",
                };
            }
        } catch (error) {
            console.warn("Could not check contract owner:", error);
            return {
                success: false,
                error: "Failed to verify contract ownership",
            };
        }

        // Check current pause state
        const currentState = (await publicClient.readContract({
            address: collectionAddress as `0x${string}`,
            abi: COLLECTION_ABI,
            functionName: "paused",
        })) as boolean;

        // If already in the desired state, return early
        if (currentState === pause) {
            return {
                success: true,
                data: {
                    transactionHash: "0x0", // No transaction needed
                    paused: currentState,
                },
                error: `Contract is already ${pause ? "paused" : "unpaused"}`,
            };
        }

        // Set up gas options
        const gasOptions: any = {};
        if (gasMaxFee) {
            gasOptions.maxFeePerGas = parseGwei(gasMaxFee);
        }
        if (gasMaxPriorityFee) {
            gasOptions.maxPriorityFeePerGas = parseGwei(gasMaxPriorityFee);
        }
        if (gasLimit) {
            gasOptions.gas = BigInt(gasLimit);
        }

        // Call pause or unpause
        console.log(`${operation} the collection`);
        const hash = await walletClient.writeContract({
            address: collectionAddress as `0x${string}`,
            abi: COLLECTION_ABI,
            functionName: operation,
            args: [],
            ...gasOptions,
        });

        console.log(`Transaction sent! Hash: ${hash}`);

        // Wait for transaction confirmation
        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
        });

        console.log(`Transaction mined in block ${receipt.blockNumber}`);

        // Verify transaction was successful
        if (receipt.status !== "success") {
            return {
                success: false,
                error: "Transaction failed to execute successfully",
            };
        }

        // Revalidate paths
        revalidatePath("/admin/onchain");

        return {
            success: true,
            data: {
                transactionHash: hash,
                paused: pause,
            },
        };
    } catch (error) {
        console.error(
            `Error ${params.pause ? "pausing" : "unpausing"} collection:`,
            error
        );
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error updating pause state",
        };
    }
}

export interface ToggleMintingParams {
    collectionAddress: string;
    networkId: string;
    enabled: boolean;
    privateKey: string;
    gasMaxFee?: string;
    gasMaxPriorityFee?: string;
    gasLimit?: string;
}

export interface ToggleMintingResult {
    success: boolean;
    data?: {
        transactionHash: string;
        mintingEnabled: boolean;
    };
    error?: string;
}

/**
 * Enables or disables minting for a collection
 */
export async function toggleMinting(
    params: ToggleMintingParams
): Promise<ToggleMintingResult> {
    try {
        const {
            collectionAddress,
            networkId,
            enabled,
            privateKey,
            gasMaxFee,
            gasMaxPriorityFee,
            gasLimit,
        } = params;

        console.log(
            `===== toggleMinting: ${
                enabled ? "Enable" : "Disable"
            } minting =====`
        );

        // Get network information
        const networkResult = await getBlockchainNetworkById(networkId);
        if (!networkResult.success || !networkResult.data) {
            return {
                success: false,
                error: `Network not found: ${networkId}`,
            };
        }
        const networkData = networkResult.data;

        // Format private key
        let formattedPrivateKey = privateKey;
        if (!formattedPrivateKey.startsWith("0x")) {
            formattedPrivateKey = `0x${formattedPrivateKey}`;
        }

        // Create account
        const account = privateKeyToAccount(
            formattedPrivateKey as `0x${string}`
        );
        console.log(`Using account: ${account.address}`);

        // Create chain configuration
        const chain = {
            id: networkData.chainId,
            name: networkData.name,
            nativeCurrency: {
                name: networkData.name,
                symbol: networkData.symbol,
                decimals: 18,
            },
            rpcUrls: {
                default: {
                    http: [networkData.rpcUrl],
                },
            },
        } as const;

        // Create wallet client
        const walletClient = createWalletClient({
            account,
            chain,
            transport: http(),
        });

        // Create public client for read operations
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

        // Check if the collection exists
        console.log(`Checking collection at ${collectionAddress}`);
        const code = await publicClient.getCode({
            address: collectionAddress as `0x${string}`,
        });
        if (!code || code === "0x") {
            return {
                success: false,
                error: "Collection contract does not exist at the provided address",
            };
        }

        // Check if the account is the owner of the contract
        try {
            const owner = await publicClient.readContract({
                address: collectionAddress as `0x${string}`,
                abi: COLLECTION_ABI,
                functionName: "owner",
            });

            if (owner !== account.address) {
                return {
                    success: false,
                    error: "Only the owner can enable/disable minting",
                };
            }
        } catch (error) {
            console.warn("Could not check contract owner:", error);
            return {
                success: false,
                error: "Failed to verify contract ownership",
            };
        }

        // Check current minting state
        const currentState = (await publicClient.readContract({
            address: collectionAddress as `0x${string}`,
            abi: COLLECTION_ABI,
            functionName: "mintingEnabled",
        })) as boolean;

        // If already in the desired state, return early
        if (currentState === enabled) {
            return {
                success: true,
                data: {
                    transactionHash: "0x0", // No transaction needed
                    mintingEnabled: currentState,
                },
                error: `Minting is already ${enabled ? "enabled" : "disabled"}`,
            };
        }

        // Set up gas options
        const gasOptions: any = {};
        if (gasMaxFee) {
            gasOptions.maxFeePerGas = parseGwei(gasMaxFee);
        }
        if (gasMaxPriorityFee) {
            gasOptions.maxPriorityFeePerGas = parseGwei(gasMaxPriorityFee);
        }
        if (gasLimit) {
            gasOptions.gas = BigInt(gasLimit);
        }

        // Call setMintingEnabled
        console.log(`Setting minting enabled to: ${enabled}`);
        const hash = await walletClient.writeContract({
            address: collectionAddress as `0x${string}`,
            abi: COLLECTION_ABI,
            functionName: "setMintingEnabled",
            args: [enabled],
            ...gasOptions,
        });

        console.log(`Transaction sent! Hash: ${hash}`);

        // Wait for transaction confirmation
        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
        });

        console.log(`Transaction mined in block ${receipt.blockNumber}`);

        // Verify transaction was successful
        if (receipt.status !== "success") {
            return {
                success: false,
                error: "Transaction failed to execute successfully",
            };
        }

        // Revalidate paths
        revalidatePath("/admin/onchain");

        return {
            success: true,
            data: {
                transactionHash: hash,
                mintingEnabled: enabled,
            },
        };
    } catch (error) {
        console.error(
            `Error ${params.enabled ? "enabling" : "disabling"} minting:`,
            error
        );
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error updating minting state",
        };
    }
}

// Export the status interface for use in other files
export interface CollectionStatus {
    paused: boolean;
    mintingEnabled: boolean;
}

export interface SetContractURIParams {
    collectionAddress: string;
    networkId: string;
    contractURI: string;
    privateKey: string;
    gasMaxFee?: string;
    gasMaxPriorityFee?: string;
    gasLimit?: string;
}

export interface SetContractURIResult {
    success: boolean;
    data?: {
        transactionHash: string;
        contractURI: string;
    };
    error?: string;
}

export async function setContractURI(
    params: SetContractURIParams
): Promise<SetContractURIResult> {
    try {
        console.log(
            "===== setContractURI: Updating collection contract URI ====="
        );
        const {
            collectionAddress,
            networkId,
            contractURI,
            privateKey,
            gasMaxFee,
            gasMaxPriorityFee,
            gasLimit,
        } = params;

        // Validate parameters
        if (!collectionAddress || !contractURI) {
            return {
                success: false,
                error: "Invalid parameters: address and contractURI are required",
            };
        }

        // Get network information
        const networkResult = await getBlockchainNetworkById(networkId);
        if (!networkResult.success || !networkResult.data) {
            return {
                success: false,
                error: `Network not found: ${networkId}`,
            };
        }
        const networkData = networkResult.data;

        // Format private key
        let formattedPrivateKey = privateKey;
        if (!formattedPrivateKey.startsWith("0x")) {
            formattedPrivateKey = `0x${formattedPrivateKey}`;
        }

        // Create account
        const account = privateKeyToAccount(
            formattedPrivateKey as `0x${string}`
        );
        console.log(`Using account: ${account.address}`);

        // Create chain configuration
        const chain = {
            id: networkData.chainId,
            name: networkData.name,
            nativeCurrency: {
                name: networkData.name,
                symbol: networkData.symbol,
                decimals: 18,
            },
            rpcUrls: {
                default: {
                    http: [networkData.rpcUrl],
                },
            },
        } as const;

        // Create wallet client
        const walletClient = createWalletClient({
            account,
            chain,
            transport: http(),
        });

        // Create public client for read operations
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

        // Check if the collection exists
        console.log(`Checking collection at ${collectionAddress}`);
        const code = await publicClient.getCode({
            address: collectionAddress as `0x${string}`,
        });
        if (!code || code === "0x") {
            return {
                success: false,
                error: "Collection contract does not exist at the provided address",
            };
        }

        // Check if the account is the owner of the contract
        try {
            const owner = await publicClient.readContract({
                address: collectionAddress as `0x${string}`,
                abi: COLLECTION_ABI,
                functionName: "owner",
            });

            if (owner !== account.address) {
                return {
                    success: false,
                    error: "Only the owner can set the contract URI",
                };
            }
        } catch (error) {
            console.warn("Could not check contract owner:", error);
            return {
                success: false,
                error: "Failed to verify contract ownership",
            };
        }

        // Set up gas options
        const gasOptions: any = {};
        if (gasMaxFee) {
            gasOptions.maxFeePerGas = parseGwei(gasMaxFee);
        }
        if (gasMaxPriorityFee) {
            gasOptions.maxPriorityFeePerGas = parseGwei(gasMaxPriorityFee);
        }
        if (gasLimit) {
            gasOptions.gas = BigInt(gasLimit);
        }

        // Call setContractURI
        console.log(`Setting contract URI to: ${contractURI}`);
        const hash = await walletClient.writeContract({
            address: collectionAddress as `0x${string}`,
            abi: COLLECTION_ABI,
            functionName: "setContractURI",
            args: [contractURI],
            ...gasOptions,
        });

        console.log(`Transaction sent! Hash: ${hash}`);

        // Wait for transaction confirmation
        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
        });

        console.log(`Transaction mined in block ${receipt.blockNumber}`);

        // Verify transaction was successful
        if (receipt.status !== "success") {
            return {
                success: false,
                error: "Transaction failed to execute successfully",
            };
        }

        // Revalidate paths
        revalidatePath("/admin/onchain");

        return {
            success: true,
            data: {
                transactionHash: hash,
                contractURI,
            },
        };
    } catch (error) {
        console.error("Error setting contract URI:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error setting contract URI",
        };
    }
}

export interface UpdateCollectionSettingsInput {
    collectionId: string;
    price: number;
    circulation: number;
}

export interface UpdateCollectionSettingsResult {
    success: boolean;
    data?: {
        id: string;
        price: number;
        circulation: number;
    };
    error?: string;
}

export async function updateCollectionSettings(
    input: UpdateCollectionSettingsInput
): Promise<UpdateCollectionSettingsResult> {
    try {
        const { collectionId, price, circulation } = input;

        const updatedCollection = await prisma.collectionContract.update({
            where: { id: collectionId },
            data: {
                price,
                circulation,
            },
            select: {
                id: true,
                price: true,
                circulation: true,
            },
        });

        return {
            success: true,
            data: updatedCollection,
        };
    } catch (error) {
        console.error("Error updating collection settings:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error updating collection settings",
        };
    }
}
