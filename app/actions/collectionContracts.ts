/// app/actions/collectionContracts.ts

"use server";

import { revalidatePath } from "next/cache";
import { createWalletClient, http, parseGwei, createPublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { COLLECTION_ABI } from "../blockchain/abis/Collection";
import { getBlockchainNetworkById } from "./blockchain";
import { prisma } from "@/lib/prisma/client";

// Collection 컨트랙트 관련 함수들 (blockchain.ts에서 이동)
interface SaveCollectionContractParams {
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

        // 1. 향상된 파라미터 검증
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

        // 2. Collection 데이터 검증
        console.log(
            `Fetching collection data for address: ${collectionAddress}`
        );
        const collection = await prisma.collectionContract.findFirst({
            where: { address: collectionAddress },
        });

        if (!collection) {
            return {
                success: false,
                error: "Collection not found in database",
            };
        }

        if (!collection.baseURI) {
            return {
                success: false,
                error: "Collection baseURI is not set in database. Please set baseURI before minting.",
            };
        }

        console.log(
            `Collection found. Name: ${collection.name}, Symbol: ${collection.symbol}`
        );
        console.log(`Base URI: ${collection.baseURI}`);

        // 3. 네트워크 및 클라이언트 설정
        console.log(`Setting up network: ${networkId}`);
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

        // Create wallet and public clients
        const walletClient = createWalletClient({
            account,
            chain,
            transport: http(),
        });

        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

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

        // 4. 컨트랙트 존재 확인
        console.log(`Verifying contract existence at ${collectionAddress}`);
        const code = await publicClient.getCode({
            address: collectionAddress as `0x${string}`,
        });

        if (!code || code === "0x") {
            return {
                success: false,
                error: "Collection contract does not exist at the provided address",
            };
        }

        // 5. 컨트랙트 상태 검증 - 병렬 처리
        console.log("Validating contract state...");
        let mintingEnabled, isPaused, owner, totalSupply, maxSupply;

        try {
            [mintingEnabled, isPaused, owner, totalSupply, maxSupply] =
                await Promise.all([
                    publicClient
                        .readContract({
                            address: collectionAddress as `0x${string}`,
                            abi: COLLECTION_ABI,
                            functionName: "mintingEnabled",
                        })
                        .catch((error) => {
                            console.warn(
                                "Error checking mintingEnabled:",
                                error
                            );
                            return false;
                        }),
                    publicClient
                        .readContract({
                            address: collectionAddress as `0x${string}`,
                            abi: COLLECTION_ABI,
                            functionName: "paused",
                        })
                        .catch((error) => {
                            console.warn("Error checking paused state:", error);
                            return true;
                        }),
                    publicClient
                        .readContract({
                            address: collectionAddress as `0x${string}`,
                            abi: COLLECTION_ABI,
                            functionName: "owner",
                        })
                        .catch((error) => {
                            console.warn("Error checking owner:", error);
                            return "0x0000000000000000000000000000000000000000";
                        }),
                    publicClient
                        .readContract({
                            address: collectionAddress as `0x${string}`,
                            abi: COLLECTION_ABI,
                            functionName: "totalSupply",
                        })
                        .catch((error) => {
                            console.error("Error getting totalSupply:", error);
                            throw new Error("Failed to get totalSupply");
                        }),
                    publicClient
                        .readContract({
                            address: collectionAddress as `0x${string}`,
                            abi: COLLECTION_ABI,
                            functionName: "maxSupply",
                        })
                        .catch((error) => {
                            console.error("Error getting maxSupply:", error);
                            throw new Error("Failed to get maxSupply");
                        }),
                ]);
        } catch (error) {
            return {
                success: false,
                error:
                    error instanceof Error
                        ? `Contract validation error: ${error.message}`
                        : "Failed to validate contract state",
            };
        }

        // 6. 상태에 따른 검증
        if (!mintingEnabled) {
            return {
                success: false,
                error: "Minting is currently disabled for this collection. Please enable minting first.",
            };
        }

        if (isPaused) {
            return {
                success: false,
                error: "Collection contract is currently paused. Please unpause before minting.",
            };
        }

        // 소유자 검증 강화
        if (owner !== account.address) {
            console.warn(
                `Warning: Minting with non-owner account. Owner: ${owner}, Minter: ${account.address}`
            );
            // 여기서 진행하도록 남겨두지만, 원하면 에러를 반환할 수도 있음
        }

        // 공급량 검증
        console.log(`Current total supply: ${totalSupply}`);
        console.log(`Max supply: ${maxSupply}`);
        console.log(`Attempting to mint: ${quantity} tokens`);

        if (totalSupply + BigInt(quantity) > maxSupply) {
            const remaining = Number(maxSupply - totalSupply);
            return {
                success: false,
                error: `Cannot mint ${quantity} tokens. Only ${remaining} tokens available for minting.`,
            };
        }

        // 7. URI 설정 - baseURI와 contractURI 모두 설정
        console.log("Setting URIs...");
        try {
            // Collection의 contractURI 확인
            if (!collection.contractURI) {
                console.warn(
                    "Collection contractURI is not set in database, only setting baseURI"
                );
            }

            // Set baseURI
            const setBaseURIHash = await walletClient.writeContract({
                address: collectionAddress as `0x${string}`,
                abi: COLLECTION_ABI,
                functionName: "setBaseURI",
                args: [collection.baseURI],
                ...gasOptions,
            });

            // 첫 번째 트랜잭션 완료 대기
            await publicClient.waitForTransactionReceipt({
                hash: setBaseURIHash,
            });

            // 이후 두 번째 트랜잭션 실행
            if (collection.contractURI) {
                // 가스 가격 증가
                const updatedGasOptions = {
                    ...gasOptions,
                    maxFeePerGas: gasOptions.maxFeePerGas
                        ? (gasOptions.maxFeePerGas * 110n) / 100n
                        : undefined, // 10% 증가
                    maxPriorityFeePerGas: gasOptions.maxPriorityFeePerGas
                        ? (gasOptions.maxPriorityFeePerGas * 110n) / 100n
                        : undefined, // 10% 증가
                };

                const setContractURIHash = await walletClient.writeContract({
                    address: collectionAddress as `0x${string}`,
                    abi: COLLECTION_ABI,
                    functionName: "setContractURI",
                    args: [collection.contractURI],
                    ...updatedGasOptions,
                });

                await publicClient.waitForTransactionReceipt({
                    hash: setContractURIHash,
                });
            }

            console.log("Successfully set all URIs");

            // 8. 여기서부터 batchMint 호출 추가 (새로 추가된 부분)
            console.log(`Minting ${quantity} tokens to ${to}...`);
            const gasFee = 1000000000n; // 1 gwei in wei

            const mintHash = await walletClient.writeContract({
                address: collectionAddress as `0x${string}`,
                abi: COLLECTION_ABI,
                functionName: "batchMint",
                args: [to as `0x${string}`, BigInt(quantity), gasFee],
                ...gasOptions,
            });

            console.log(`Minting transaction sent! Hash: ${mintHash}`);

            // 민팅 트랜잭션 확인
            const mintReceipt = await publicClient.waitForTransactionReceipt({
                hash: mintHash,
            });

            if (mintReceipt.status !== "success") {
                return {
                    success: false,
                    error: "Minting transaction failed",
                };
            }

            console.log(
                `Minting transaction confirmed in block: ${mintReceipt.blockNumber}`
            );

            // 9. 민팅 후 새로운 총 공급량을 가져와서 시작 토큰 ID 계산
            const newTotalSupply = (await publicClient.readContract({
                address: collectionAddress as `0x${string}`,
                abi: COLLECTION_ABI,
                functionName: "totalSupply",
            })) as bigint;

            const startTokenId = Number(newTotalSupply) - quantity;

            console.log(`Successfully minted ${quantity} tokens!`);
            console.log(
                `Token ID range: ${startTokenId} to ${
                    startTokenId + quantity - 1
                }`
            );
            console.log(
                `You can verify these tokens at ${networkData.explorerUrl}/token/${collectionAddress}`
            );

            // 민팅 성공 후 데이터베이스에 저장
            try {
                // 토큰 ID 범위 생성
                const tokenIds = Array.from(
                    { length: quantity },
                    (_, i) => startTokenId + i
                );

                // 현재 컬렉션 데이터 가져오기
                const collectionData =
                    await prisma.collectionContract.findFirst({
                        where: { address: collectionAddress },
                    });

                if (!collectionData) {
                    throw new Error("Collection not found");
                }

                // 트랜잭션으로 모든 데이터베이스 작업 처리
                await prisma.$transaction(async (tx) => {
                    // 1. NFT 데이터 생성
                    const nftData = tokenIds.map((tokenId) => {
                        return {
                            tokenId,
                            collectionId: collectionData.id,
                            ownerAddress: to, // 받는 주소
                            metadataUri: collectionData.baseURI,
                            networkId,
                            transactionHash: mintHash, // 민팅 트랜잭션 해시
                            mintedBy: to,
                            mintPrice: collectionData.mintPrice,
                            name: `${collectionData.name} #${tokenId}`, // 기본 이름 설정
                        };
                    });

                    // NFT 데이터 저장
                    await tx.nFT.createMany({
                        data: nftData,
                    });

                    // 2. 생성된 NFT들 다시 조회하여 ID 가져오기
                    const savedNfts = await tx.nFT.findMany({
                        where: {
                            collectionId: collectionData.id,
                            tokenId: { in: tokenIds },
                        },
                        select: {
                            id: true,
                            tokenId: true,
                        },
                    });

                    // 3. NFT Event 데이터 생성 (민팅 이벤트)
                    const nftEventData = savedNfts.map((nft) => {
                        return {
                            nftId: nft.id,
                            collectionId: collectionData.id,
                            eventType: "Mint",
                            fromAddress:
                                "0x0000000000000000000000000000000000000000", // null address
                            toAddress: to,
                            price: collectionData.mintPrice,
                            transactionHash: mintHash,
                            blockNumber: Number(mintReceipt.blockNumber),
                        };
                    });

                    // NFT 이벤트 데이터 저장
                    await tx.nFTEvent.createMany({
                        data: nftEventData,
                    });

                    // 4. Collection Contract mintedCount 증가
                    await tx.collectionContract.update({
                        where: { id: collectionData.id },
                        data: {
                            mintedCount: {
                                increment: tokenIds.length,
                            },
                        },
                    });
                });

                console.log(`Successfully saved ${quantity} NFTs to database`);
            } catch (error) {
                console.error("Error saving NFT data to database:", error);
            }

            // Revalidate paths
            revalidatePath("/admin/onchain");

            // 민팅 트랜잭션 해시를 반환 (URI 해시가 아님)
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
                    blockNumber: Number(mintReceipt.blockNumber),
                    explorerUrl: `${networkData.explorerUrl}/tx/${mintHash}`,
                },
            };
        } catch (error) {
            console.error("Error during minting process:", error);
            return {
                success: false,
                error: "Failed to mint tokens. Please try again.",
            };
        }
    } catch (error) {
        console.error("Error minting tokens:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? `Minting failed: ${error.message}`
                    : "Unknown error during minting process",
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
