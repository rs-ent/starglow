/// app/actions/collectionContracts.ts

"use server";

import {
    createPublicClient,
    createWalletClient,
    http,
    getContract,
    Address,
    Hash,
    AbiFunction,
} from "viem";
import { prisma } from "@/lib/prisma/client";
import {
    estimateGasOptions,
    getChain,
    getEscrowWalletWithPrivateKey,
    getEscrowWalletWithPrivateKeyByAddress,
    EstimateGasOptions,
    getWalletBalance,
} from "./blockchain";
import { BlockchainNetwork, CollectionContract, NFT } from "@prisma/client";
import { privateKeyToAccount } from "viem/accounts";
import { createNFTMetadata, getMetadataByCollectionAddress } from "./metadata";
import { deployContract } from "./blockchain";

import collectionJson from "@/web3/artifacts/contracts/Collection.sol/Collection.json";
import { BytesLike, ethers } from "ethers";
const abi = collectionJson.abi;

export interface GetCollectionInput {
    collectionAddress: string;
}

export interface GetCollectionResult {
    success: boolean;
    data?: CollectionContract;
    error?: string;
}

export async function getCollection(
    input: GetCollectionInput
): Promise<GetCollectionResult> {
    const collection = await prisma.collectionContract.findUnique({
        where: { address: input.collectionAddress },
        include: { network: true },
    });

    if (!collection) {
        return { success: false, error: "Collection not found" };
    }

    if (!collection.network) {
        return { success: false, error: "Network not found" };
    }

    return { success: true, data: collection };
}

export interface DeployCollectionInput {
    networkId: string;
    factoryId: string;
    walletId: string;
    name: string;
    symbol: string;
    maxSupply: number;
    mintPrice: number;
    baseURI: string;
    contractURI: string;
    collectionKey: string;
}

export interface DeployCollectionResult {
    success: boolean;
    data?: CollectionContract;
    error?: string;
}

export async function deployCollection(
    input: DeployCollectionInput
): Promise<DeployCollectionResult> {
    try {
        const network = await prisma.blockchainNetwork.findUnique({
            where: { id: input.networkId },
        });
        if (!network) {
            return { success: false, error: "Network not found" };
        }

        const escrowWallet = await getEscrowWalletWithPrivateKey(
            input.walletId
        );
        if (!escrowWallet.success || !escrowWallet.data) {
            return { success: false, error: "Escrow wallet not found" };
        }

        const { hash, contractAddress } = await deployContract({
            walletId: input.walletId,
            network,
            abi,
            bytecode: collectionJson.bytecode as `0x${string}`,
            args: [], 
        });

        const chain = await getChain(network);
        const privateKey = escrowWallet.data.privateKey;
        const formattedPrivateKey = privateKey.startsWith("0x")
            ? privateKey
            : `0x${privateKey}`;
        const account = privateKeyToAccount(formattedPrivateKey as Address);

        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

        const walletClient = createWalletClient({
            account,
            chain,
            transport: http(),
        });

        const collectionContract = getContract({
            address: contractAddress as Address,
            abi,
            client: walletClient,
        });

        console.log("Initializing collection with params:", {
            name: input.name,
            symbol: input.symbol,
            owner: escrowWallet.data.address,
            maxSupply: input.maxSupply,
            mintPrice: input.mintPrice,
            baseURI: input.baseURI,
            contractURI: input.contractURI,
        });

        const initTx = await collectionContract.write.initialize([
            input.name,
            input.symbol,
            escrowWallet.data.address,
            BigInt(input.maxSupply),
            BigInt(input.mintPrice),
            input.baseURI,
            input.contractURI,
        ]);

        await publicClient.waitForTransactionReceipt({ hash: initTx });

        const collection = await prisma.collectionContract.create({
            data: {
                key: input.collectionKey,
                factoryId: input.factoryId,
                address: contractAddress,
                name: input.name,
                symbol: input.symbol,
                maxSupply: input.maxSupply,
                mintPrice: input.mintPrice.toString(),
                baseURI: input.baseURI,
                contractURI: input.contractURI,
                networkId: input.networkId,
                createdBy: input.walletId,
                txHash: hash,
                isListed: false,
                circulation: input.maxSupply,
                abi,
                bytecode: collectionJson.bytecode as `0x${string}`,
            },
        });

        return {
            success: true,
            data: collection,
        };
    } catch (error) {
        console.error("Error deploying collection:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to deploy collection",
        };
    }
}

export interface GetCollectionsByNetworkInput {
    networkId: string;
}

export interface GetCollectionsByNetworkResult {
    collections: CollectionContract[];
}

export async function getCollectionsByNetwork(
    input: GetCollectionsByNetworkInput
): Promise<GetCollectionsByNetworkResult> {
    try {
        const collections = await prisma.collectionContract.findMany({
            where: { networkId: input.networkId },
        });

        return { collections };
    } catch (error) {
        console.error("Error getting collections by network:", error);
        return { collections: [] };
    }
}

export interface getTokenOwnersInput {
    collectionAddress: string;
    tokenIds?: number[];
}

export interface getTokenOwnersResult {
    owners: string[];
}

export async function getTokenOwners(
    input: getTokenOwnersInput
): Promise<getTokenOwnersResult> {
    try {
        const collection = await prisma.collectionContract.findUnique({
            where: { address: input.collectionAddress },
            include: { network: true },
        });

        if (!collection || !collection.network) {
            return { owners: [] };
        }

        const chain = await getChain(collection.network);
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

        const tokenIds =
            input.tokenIds ||
            (
                await prisma.nFT.findMany({
                    where: { collectionId: collection.id },
                    select: { tokenId: true },
                })
            ).map((token) => token.tokenId);

        if (!tokenIds.length) {
            return { owners: [] };
        }

        const BATCH_SIZE = 50;
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 1000;
        const batches = [];

        for (let i = 0; i < tokenIds.length; i += BATCH_SIZE) {
            batches.push(tokenIds.slice(i, i + BATCH_SIZE));
        }

        const batchResults = await Promise.all(
            batches.map(async (batch) => {
                let retryCount = 0;
                while (retryCount < MAX_RETRIES) {
                    try {
                        const owners = await publicClient.multicall({
                            contracts: batch.map((tokenId) => ({
                                address: input.collectionAddress as Address,
                                abi: abi as AbiFunction[],
                                functionName: "ownerOf",
                                args: [BigInt(tokenId)],
                            })),
                            multicallAddress: collection.network
                                .multicallAddress as Address,
                        });

                        return batch.map((tokenId, index) => {
                            const result = owners[index];
                            return {
                                tokenId,
                                owner:
                                    result.status === "success"
                                        ? (result.result as unknown as string)
                                        : "",
                                success: result.status === "success",
                            };
                        });
                    } catch (error) {
                        retryCount++;
                        if (retryCount === MAX_RETRIES) {
                            console.error(
                                "Error in batch after retries:",
                                error
                            );
                            return batch.map((tokenId) => ({
                                tokenId,
                                owner: "",
                                success: false,
                            }));
                        }
                        console.log(
                            `Retrying batch (attempt ${retryCount}/${MAX_RETRIES})`
                        );
                        await new Promise((resolve) =>
                            setTimeout(resolve, RETRY_DELAY)
                        );
                    }
                }
                return batch.map((tokenId) => ({
                    tokenId,
                    owner: "",
                    success: false,
                }));
            })
        );

        const results = batchResults.flat();

        return {
            owners: results.map((result) => result.owner),
        };
    } catch (error) {
        console.error("Error getting token owners:", error);
        return { owners: [] };
    }
}

export interface SetURIInput {
    collectionAddress: string;
    walletId: string;
    baseURI: string;
    contractURI: string;
    gasOptions?: EstimateGasOptions;
}

export interface SetURIResult {
    success: boolean;
    baseURIHash?: Hash;
    contractURIHash?: Hash;
    error?: string;
}

export async function setURI(input: SetURIInput): Promise<SetURIResult> {
    try {
        const collection = await prisma.collectionContract.findUnique({
            where: { address: input.collectionAddress },
            include: { network: true },
        });

        if (!collection || !collection.network) {
            return {
                success: false,
                error: "Collection not found",
            };
        }

        const escrowWallet = await getEscrowWalletWithPrivateKey(
            input.walletId
        );
        if (!escrowWallet.success || !escrowWallet.data) {
            return {
                success: false,
                error: "Escrow wallet not found",
            };
        }

        const chain = await getChain(collection.network);
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

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

        const collectionContract = getContract({
            address: collection.address as Address,
            abi,
            client: walletClient,
        });

        const gasOptions = await estimateGasOptions({
            publicClient,
            walletClient,
            contractAddress: collection.address as Address,
            abi,
            transactions: [
                { functionName: "setBaseURI", args: [input.baseURI] },
                { functionName: "setContractURI", args: [input.contractURI] },
            ],
            customOptions: input.gasOptions,
        });

        const baseURIHash = await collectionContract.write.setBaseURI(
            [input.baseURI],
            {
                ...gasOptions,
                gasLimit: gasOptions.gasLimit / 2n,
            }
        );
        await publicClient.waitForTransactionReceipt({ hash: baseURIHash });

        const contractURIHash = await collectionContract.write.setContractURI(
            [input.contractURI],
            {
                ...gasOptions,
                gasLimit: gasOptions.gasLimit / 2n,
            }
        );
        await publicClient.waitForTransactionReceipt({ hash: contractURIHash });

        await prisma.collectionContract.update({
            where: { address: input.collectionAddress },
            data: {
                ...(input.baseURI && { baseURI: input.baseURI }),
                ...(input.contractURI && { contractURI: input.contractURI }),
            },
        });

        return {
            success: true,
            baseURIHash,
            contractURIHash,
        };
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes("insufficient funds")) {
                return {
                    success: false,
                    error: "Insufficient funds for gas",
                };
            }
            if (error.message.includes("gas required exceeds allowance")) {
                return {
                    success: false,
                    error: "Gas limit too low",
                };
            }
        }
        console.error("Error in operation:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Operation failed",
        };
    }
}

export interface MintTokensInput {
    collectionAddress: string;
    walletId: string;
    quantity: number;
    gasOptions?: {
        maxFeePerGas?: bigint; // 지불할 최대 가스 가격
        maxPriorityFeePerGas?: bigint; // 채굴자에게 지불할 팁
        gasLimit?: bigint; // 사용할 최대 가스 합계
    };
}

export interface MintTokensResult {
    success: boolean;
    data?: NFT[];
    error?: string;
}

export async function mintTokens(
    input: MintTokensInput
): Promise<MintTokensResult> {
    try {
        const collection = await prisma.collectionContract.findUnique({
            where: { address: input.collectionAddress },
            include: { network: true },
        });

        if (!collection || !collection.network) {
            return {
                success: false,
                error: "Collection not found",
            };
        }

        if (!collection.baseURI) {
            return {
                success: false,
                error: "Collection baseURI not set",
            };
        }

        if (!collection.contractURI) {
            return {
                success: false,
                error: "Collection contractURI not set",
            };
        }

        const escrowWallet = await getEscrowWalletWithPrivateKey(
            input.walletId
        );

        if (!escrowWallet.success || !escrowWallet.data) {
            return {
                success: false,
                error: "Escrow wallet not found",
            };
        }

        const chain = await getChain(collection.network);
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

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

        const collectionContract = getContract({
            address: collection.address as Address,
            abi,
            client: walletClient,
        });

        const gasOptions = await estimateGasOptions({
            publicClient,
            walletClient,
            contractAddress: collection.address as Address,
            abi,
            transactions: [
                { functionName: "mint", args: [BigInt(input.quantity)] },
            ],
            customOptions: input.gasOptions,
        });

        const hash = await collectionContract.write.mint(
            [BigInt(input.quantity)],
            {
                ...gasOptions,
                gasLimit: gasOptions.gasLimit,
            }
        );

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        const TOKEN_MINTED_EVENT_TOPIC =
            "0xc0268504b7f19691951d6e4e0f6a77c6d432f0276be23b1250142315f1429a60";
        const event = receipt.logs.find(
            (log) => log.topics[0] === TOKEN_MINTED_EVENT_TOPIC
        );

        if (!event) {
            return {
                success: false,
                error: "Token minted event not found",
            };
        }

        const metadata = await getMetadataByCollectionAddress(
            input.collectionAddress
        );
        if (!metadata) {
            return {
                success: false,
                error: "Collection metadata not found",
            };
        }

        const startTokenId = Number(event.topics[1]);
        await createNFTMetadata(collection, input.quantity, startTokenId);

        // Prisma에 저장
        const result = await prisma.$transaction(async (tx) => {
            // 모든 NFT 데이터 준비
            const nftData = Array.from({ length: input.quantity }, (_, i) => {
                const tokenId = startTokenId + i;
                return {
                    tokenId,
                    collectionId: collection.id,
                    ownerAddress: account.address,
                    name: collection.name,
                    currentOwnerAddress: account.address,
                    networkId: collection.networkId,
                    transactionHash: receipt.transactionHash,
                    mintedBy: account.address,
                    mintPrice: collection.mintPrice,
                    metadataUri: `${collection.baseURI}${
                        collection.baseURI.endsWith("/") ? "" : "/"
                    }${tokenId}`,
                    isListed: false,
                    isBurned: false,
                    transferCount: 0,
                };
            });

            // 모든 NFT를 한 번에 생성
            await tx.nFT.createMany({
                data: nftData,
            });

            // 생성된 NFT들의 ID를 가져오기
            const nfts = await tx.nFT.findMany({
                where: {
                    collectionId: collection.id,
                    tokenId: {
                        in: Array.from(
                            { length: input.quantity },
                            (_, i) => startTokenId + i
                        ),
                    },
                },
            });

            // NFT 이벤트 생성
            const mintEvents = nfts.map((nft) => ({
                nftId: nft.id,
                collectionId: collection.id,
                eventType: "MINT",
                fromAddress: account.address,
                transactionHash: receipt.transactionHash,
                timestamp: new Date(),
            }));

            await tx.nFTEvent.createMany({
                data: mintEvents,
            });

            await tx.collectionContract.update({
                where: { address: input.collectionAddress },
                data: {
                    mintedCount: {
                        increment: input.quantity,
                    },
                },
            });

            return nfts;
        });

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes("insufficient funds")) {
                return {
                    success: false,
                    error: "Insufficient funds for gas",
                };
            }
            if (error.message.includes("gas required exceeds allowance")) {
                return {
                    success: false,
                    error: "Gas limit too low",
                };
            }
        }
        console.error("Error in operation:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Operation failed",
        };
    }
}

export interface BurnTokensInput {
    collectionAddress: string;
    walletId: string;
    tokenIds: number[];
    gasOptions?: EstimateGasOptions;
}

export interface BurnTokensResult {
    success: boolean;
    transactionHash?: Hash;
    error?: string;
}

export async function burnTokens(
    input: BurnTokensInput
): Promise<BurnTokensResult> {
    try {
        const collection = await prisma.collectionContract.findUnique({
            where: { address: input.collectionAddress },
            include: { network: true },
        });

        if (!collection || !collection.network) {
            return {
                success: false,
                error: "Collection not found",
            };
        }

        const tokens = await prisma.nFT.findMany({
            where: {
                collectionId: collection.id,
                tokenId: { in: input.tokenIds },
                isBurned: false,
            },
        });

        if (tokens.length !== input.tokenIds.length) {
            return {
                success: false,
                error: "Some tokens not found or already burned",
            };
        }

        const invalidTokens = tokens.filter(
            (token) => token.currentOwnerAddress !== input.walletId
        );
        if (invalidTokens.length > 0) {
            return {
                success: false,
                error: `Not owner of tokens: ${invalidTokens
                    .map((t) => t.tokenId)
                    .join(", ")}`,
            };
        }

        const escrowWallet = await getEscrowWalletWithPrivateKey(
            input.walletId
        );
        if (!escrowWallet.success || !escrowWallet.data) {
            return {
                success: false,
                error: "Escrow wallet not found",
            };
        }

        const chain = await getChain(collection.network);
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

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

        const collectionContract = getContract({
            address: collection.address as Address,
            abi,
            client: walletClient,
        });

        const gasOptions = await estimateGasOptions({
            publicClient,
            walletClient,
            contractAddress: collection.address as Address,
            abi,
            transactions: [{ functionName: "burn", args: [input.tokenIds] }],
            customOptions: input.gasOptions,
        });

        const hash = await collectionContract.write.burn(
            [input.tokenIds],
            gasOptions
        );

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        const TOKEN_BURNED_EVENT_TOPIC =
            "0x43ce8febc9822756d8f34b35cd628db23dc57fe810cb077080d7c740fcc6988f";
        const events = receipt.logs.filter(
            (log) => log.topics[0] === TOKEN_BURNED_EVENT_TOPIC
        );

        if (events.length !== input.tokenIds.length) {
            return {
                success: false,
                error: "Some tokens were not burned successfully",
            };
        }

        await prisma.$transaction(async (tx) => {
            await tx.collectionContract.update({
                where: { address: input.collectionAddress },
                data: {
                    mintedCount: {
                        decrement: input.tokenIds.length,
                    },
                },
            });

            // 각 토큰의 상태 업데이트
            await tx.nFT.deleteMany({
                where: {
                    collectionId: collection.id,
                    tokenId: { in: input.tokenIds },
                },
            });

            const burnEvents = tokens.map((token) => ({
                nftId: token.id,
                collectionId: collection.id,
                eventType: "BURN",
                fromAddress: input.walletId,
                transactionHash: receipt.transactionHash,
                timestamp: new Date(),
            }));

            await tx.nFTEvent.createMany({
                data: burnEvents,
            });
        });

        return {
            success: true,
            transactionHash: receipt.transactionHash,
        };
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes("insufficient funds")) {
                return {
                    success: false,
                    error: "Insufficient funds for gas",
                };
            }
            if (error.message.includes("gas required exceeds allowance")) {
                return {
                    success: false,
                    error: "Gas limit too low",
                };
            }
        }
        console.error("Error burning tokens:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to burn tokens",
        };
    }
}

export interface GetTokenOptions {
    tokenIds?: number[];
    ownerAddress?: string;
    isBurned?: boolean;
    isLocked?: boolean;
    isStaked?: boolean;
}
export interface GetTokensInput {
    collectionAddress: string;
    options?: GetTokenOptions;
}

export interface GetTokensResult {
    tokens: NFT[];
}

export async function getTokens(
    input: GetTokensInput
): Promise<GetTokensResult> {
    const collection = await prisma.collectionContract.findUnique({
        where: { address: input.collectionAddress },
        include: { network: true },
    });

    if (!collection || !collection.network) {
        return {
            tokens: [],
        };
    }

    const tokens = await prisma.nFT.findMany({
        where: {
            collectionId: collection.id,
            ...(input.options?.tokenIds && {
                tokenId: { in: input.options.tokenIds },
            }),
            ...(input.options?.ownerAddress && {
                currentOwnerAddress: input.options.ownerAddress,
            }),
            ...(input.options?.isBurned !== undefined && {
                isBurned: input.options.isBurned,
            }),
            ...(input.options?.isLocked !== undefined && {
                isLocked: input.options.isLocked,
            }),
            ...(input.options?.isStaked !== undefined && {
                isStaked: input.options.isStaked,
            }),
        },
    });

    return {
        tokens,
    };
}

export interface LockTokensInput {
    collectionAddress: string;
    walletId: string;
    tokenIds: number[];
    unlockScheduledAt: number;
    gasOptions?: EstimateGasOptions;
}

export interface LockTokensResult {
    success: boolean;
    transactionHash?: Hash;
    error?: string;
}

export async function lockTokens(
    input: LockTokensInput
): Promise<LockTokensResult> {
    try {
        if (
            input.unlockScheduledAt > 0 &&
            input.unlockScheduledAt <= Math.floor(Date.now() / 1000)
        ) {
            return {
                success: false,
                error: "Unlock time must be in the future",
            };
        }

        const collection = await prisma.collectionContract.findUnique({
            where: { address: input.collectionAddress },
            include: { network: true },
        });

        if (!collection || !collection.network) {
            return {
                success: false,
                error: "Collection not found",
            };
        }

        const tokens = await prisma.nFT.findMany({
            where: {
                collectionId: collection.id,
                tokenId: { in: input.tokenIds },
                isBurned: false,
                isLocked: false,
            },
        });

        if (tokens.length !== input.tokenIds.length) {
            return {
                success: false,
                error: "Some tokens not found, burned, or already locked",
            };
        }

        const escrowWallet = await getEscrowWalletWithPrivateKey(
            input.walletId
        );
        if (!escrowWallet.success || !escrowWallet.data) {
            return {
                success: false,
                error: "Escrow wallet not found",
            };
        }

        const chain = await getChain(collection.network);
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

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

        const collectionContract = getContract({
            address: collection.address as Address,
            abi,
            client: walletClient,
        });

        const gasOptions = await estimateGasOptions({
            publicClient,
            walletClient,
            contractAddress: collection.address as Address,
            abi,
            transactions: [
                {
                    functionName: "lockTokens",
                    args: [input.tokenIds, BigInt(input.unlockScheduledAt)],
                },
            ],
            customOptions: input.gasOptions,
        });

        const hash = await collectionContract.write.lockTokens(
            [input.tokenIds, BigInt(input.unlockScheduledAt)],
            gasOptions
        );

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        const TOKEN_LOCKED_EVENT_TOPIC =
            "0xf25fd82f8bf40df41b90b95a0159c55596f50b182d7b7dff1d3e04a5a16ac7c4";
        const events = receipt.logs.filter(
            (log) => log.topics[0] === TOKEN_LOCKED_EVENT_TOPIC
        );

        if (events.length !== input.tokenIds.length) {
            return {
                success: false,
                error: "Some tokens were not locked successfully",
            };
        }

        await prisma.$transaction(async (tx) => {
            await tx.nFT.updateMany({
                where: {
                    collectionId: collection.id,
                    tokenId: { in: input.tokenIds },
                },
                data: {
                    isLocked: true,
                    lockedAt: new Date(),
                    unlockScheduledAt: new Date(input.unlockScheduledAt * 1000),
                    lockTransactionHash: receipt.transactionHash,
                },
            });

            const lockEvents = tokens.map((token) => ({
                nftId: token.id,
                collectionId: collection.id,
                eventType: "LOCK",
                fromAddress: input.walletId,
                transactionHash: receipt.transactionHash,
                timestamp: new Date(),
                metadata: {
                    unlockScheduledAt: input.unlockScheduledAt,
                },
            }));

            await tx.nFTEvent.createMany({
                data: lockEvents,
            });
        });

        return {
            success: true,
            transactionHash: receipt.transactionHash,
        };
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes("insufficient funds")) {
                return {
                    success: false,
                    error: "Insufficient funds for gas",
                };
            }
            if (error.message.includes("gas required exceeds allowance")) {
                return {
                    success: false,
                    error: "Gas limit too low",
                };
            }
        }
        console.error("Error locking tokens:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to lock tokens",
        };
    }
}

export interface UnlockTokensInput {
    collectionAddress: string;
    walletId: string;
    tokenIds: number[];
    gasOptions?: EstimateGasOptions;
}

export interface UnlockTokensResult {
    success: boolean;
    transactionHash?: Hash;
    error?: string;
}

export async function unlockTokens(
    input: UnlockTokensInput
): Promise<UnlockTokensResult> {
    try {
        const collection = await prisma.collectionContract.findUnique({
            where: { address: input.collectionAddress },
            include: { network: true },
        });

        if (!collection || !collection.network) {
            return {
                success: false,
                error: "Collection not found",
            };
        }

        const tokens = await prisma.nFT.findMany({
            where: {
                collectionId: collection.id,
                tokenId: { in: input.tokenIds },
                isBurned: false,
            },
            select: {
                id: true,
                tokenId: true,
                currentOwnerAddress: true,
            },
        });

        if (tokens.length !== input.tokenIds.length) {
            return {
                success: false,
                error: "Some tokens not found or burned",
            };
        }

        const invalidTokens = tokens.filter(
            (token) => token.currentOwnerAddress !== input.walletId
        );
        if (invalidTokens.length > 0) {
            return {
                success: false,
                error: `Not owner of tokens: ${invalidTokens
                    .map((t) => t.tokenId)
                    .join(", ")}`,
            };
        }

        const escrowWallet = await getEscrowWalletWithPrivateKey(
            input.walletId
        );
        if (!escrowWallet.success || !escrowWallet.data) {
            return {
                success: false,
                error: "Escrow wallet not found",
            };
        }

        const chain = await getChain(collection.network);
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

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

        const collectionContract = getContract({
            address: collection.address as Address,
            abi,
            client: walletClient,
        });

        const gasOptions = await estimateGasOptions({
            publicClient,
            walletClient,
            contractAddress: collection.address as Address,
            abi,
            transactions: [
                {
                    functionName: "unlockTokens",
                    args: [input.tokenIds, true],
                },
            ],
            customOptions: input.gasOptions,
        });

        const hash = await collectionContract.write.unlockTokens(
            [input.tokenIds, true],
            gasOptions
        );

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        const TOKEN_UNLOCKED_EVENT_TOPIC =
            "0x0f7cd4952f541f9f3db6c639f784e95428c45f6ca7eb587d0bc3b6be3f619957";
        const events = receipt.logs.filter(
            (log) => log.topics[0] === TOKEN_UNLOCKED_EVENT_TOPIC
        );

        if (events.length !== input.tokenIds.length) {
            return {
                success: false,
                error: "Some tokens were not unlocked successfully",
            };
        }

        await prisma.$transaction(async (tx) => {
            await tx.nFT.updateMany({
                where: {
                    id: { in: tokens.map((t) => t.id) },
                },
                data: {
                    isLocked: false,
                    unlockAt: new Date(),
                },
            });

            // NFT 이벤트 생성
            const unlockEvents = tokens.map((token) => ({
                nftId: token.id,
                collectionId: collection.id,
                eventType: "UNLOCK",
                fromAddress: input.walletId,
                transactionHash: receipt.transactionHash,
                timestamp: new Date(),
            }));

            await tx.nFTEvent.createMany({
                data: unlockEvents,
            });
        });

        return {
            success: true,
            transactionHash: receipt.transactionHash,
        };
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes("insufficient funds")) {
                return {
                    success: false,
                    error: "Insufficient funds for gas",
                };
            }
            if (error.message.includes("gas required exceeds allowance")) {
                return {
                    success: false,
                    error: "Gas limit too low",
                };
            }
            if (error.message.includes("not locked")) {
                return {
                    success: false,
                    error: "One or more tokens are not locked",
                };
            }
        }
        console.error("Error unlocking tokens:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to unlock tokens",
        };
    }
}

export interface TransferTokensInput {
    collectionAddress: string;
    fromAddress: string;
    spenderAddress: string;
    toAddress: string;
    tokenIds: number[];
    gasOptions?: EstimateGasOptions;
}

export interface TransferTokensResult {
    success: boolean;
    transactionHash?: Hash;
    error?: string;
}

export async function transferTokens(
    input: TransferTokensInput
): Promise<TransferTokensResult> {
    try {
        const collection = await prisma.collectionContract.findUnique({
            where: { address: input.collectionAddress },
            include: { network: true },
        });

        if (!collection || !collection.network) {
            return {
                success: false,
                error: "Collection not found",
            };
        }

        const tokens = await prisma.nFT.findMany({
            where: {
                collectionId: collection.id,
                tokenId: { in: input.tokenIds },
                isBurned: false,
            },
            select: {
                id: true,
                tokenId: true,
                isLocked: true,
            },
        });

        if (tokens.length !== input.tokenIds.length) {
            return {
                success: false,
                error: "Some tokens not found or burned",
            };
        }

        const tokenOwners = await getTokenOwners({
            collectionAddress: input.collectionAddress,
            tokenIds: input.tokenIds,
        });

        const invalidTokens = tokenOwners.owners.filter(
            (owner) => owner.toLowerCase() !== input.fromAddress.toLowerCase()
        );

        if (invalidTokens.length > 0) {
            return {
                success: false,
                error: `One or more tokens are not owned by the from address: ${invalidTokens.join(
                    ", "
                )}`,
            };
        }

        const lockedTokens = tokens.filter((token) => token.isLocked);
        if (lockedTokens.length > 0) {
            return {
                success: false,
                error: "One or more tokens are locked",
            };
        }

        const escrowWallet = await getEscrowWalletWithPrivateKeyByAddress(
            input.spenderAddress
        );

        if (!escrowWallet.success || !escrowWallet.data) {
            return {
                success: false,
                error: "Escrow wallet not found",
            };
        }

        const chain = await getChain(collection.network);
        const privateKey = escrowWallet.data.privateKey;
        const formattedPrivateKey = privateKey.startsWith("0x")
            ? privateKey
            : `0x${privateKey}`;
        const account = privateKeyToAccount(formattedPrivateKey as Address);

        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

        const walletClient = createWalletClient({
            account,
            chain,
            transport: http(),
        });

        const collectionContract = getContract({
            address: collection.address as Address,
            abi,
            client: walletClient,
        });

        const gasOptions = await estimateGasOptions({
            publicClient,
            walletClient,
            contractAddress: collection.address as Address,
            abi,
            transactions: [
                {
                    functionName: "escrowTransfer",
                    args: [
                        input.fromAddress as Address,
                        account.address,
                        input.toAddress as Address,
                        input.tokenIds,
                    ],
                },
            ],
            customOptions: input.gasOptions,
        });

        const hash = await collectionContract.write.escrowTransfer(
            [
                input.fromAddress as Address,
                account.address,
                input.toAddress as Address,
                input.tokenIds,
            ],
            gasOptions
        );

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        return {
            success: true,
            transactionHash: receipt.transactionHash,
        };
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes("insufficient funds")) {
                return {
                    success: false,
                    error: "Insufficient funds for gas",
                };
            }
            if (error.message.includes("gas required exceeds allowance")) {
                return {
                    success: false,
                    error: "Gas limit too low",
                };
            }
            if (error.message.includes("INVALID_SIGNATURE")) {
                return {
                    success: false,
                    error: "Invalid transfer signature",
                };
            }
        }
        console.error("Error transferring tokens:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to transfer tokens",
        };
    }
}

export interface GenerateMessageHashForTransferInput {
    fromAddress: `0x${string}`;
    spenderAddress: `0x${string}`;
    toAddress: `0x${string}`;
    tokenId: number;
    collectionAddress: `0x${string}`;
    network: BlockchainNetwork;
}

export async function generateMessageHashForTransfer(
    input: GenerateMessageHashForTransferInput
): Promise<any> {
    try {
        const {
            fromAddress,
            spenderAddress,
            toAddress,
            tokenId,
            collectionAddress,
            network,
        } = input;

        const deadline = Math.floor(Date.now() / 1000) + 3600;

        const chain = await getChain(network);
        if (!chain) {
            throw new Error(
                `Network with ID ${network} not found or not active`
            );
        }

        const publicClient = createPublicClient({
            chain,
            transport: http(chain.rpcUrls.default.http[0]),
        });

        const nonce = await publicClient.readContract({
            address: collectionAddress,
            abi: [
                {
                    inputs: [{ name: "", type: "address" }],
                    name: "nonces",
                    outputs: [{ name: "", type: "uint256" }],
                    stateMutability: "view",
                    type: "function",
                },
            ],
            functionName: "nonces",
            args: [fromAddress as `0x${string}`],
        });

        const typedData = {
            domain: {
                name: await publicClient.readContract({
                    address: collectionAddress,
                    abi: [
                        {
                            name: "name",
                            type: "function",
                            stateMutability: "view",
                            inputs: [],
                            outputs: [{ name: "", type: "string" }],
                        },
                    ],
                    functionName: "name",
                }),
                version: "1",
                chainId: chain.id,
                verifyingContract: collectionAddress,
            },
            types: {
                Permit: [
                    { name: "owner", type: "address" },
                    { name: "spender", type: "address" },
                    { name: "to", type: "address" },
                    { name: "tokenId", type: "uint256" },
                    { name: "nonce", type: "uint256" },
                    { name: "deadline", type: "uint256" },
                ],
            },
            primaryType: "Permit",
            message: {
                owner: fromAddress,
                spender: spenderAddress,
                to: toAddress,
                tokenId: BigInt(tokenId),
                nonce: nonce,
                deadline: BigInt(deadline),
            },
        };

        return { typedData, deadline };
    } catch (error) {
        throw new Error(
            `Failed to generate message hash: ${
                error instanceof Error ? error.message : "Unknown error"
            }`
        );
    }
}

export interface GetNonceInput {
    collectionAddress: string;
    walletAddress: string;
}

export interface GetNonceResult {
    nonce: bigint;
}

export async function getNonce(input: GetNonceInput): Promise<GetNonceResult> {
    const collection = await prisma.collectionContract.findUnique({
        where: { address: input.collectionAddress },
        include: { network: true },
    });

    if (!collection || !collection.network) {
        throw new Error("Collection not found");
    }

    const chain = await getChain(collection.network);
    const publicClient = createPublicClient({
        chain,
        transport: http(),
    });

    const collectionContract = getContract({
        address: input.collectionAddress as Address,
        abi,
        client: publicClient,
    });

    const nonce = await collectionContract.read.nonces([
        input.walletAddress as Address,
    ]);

    return { nonce: nonce as bigint };
}

export interface PauseInput {
    collectionAddress: string;
    walletId: string;
    gasOptions?: EstimateGasOptions;
}

export interface PauseResult {
    success: boolean;
    transactionHash?: Hash;
    error?: string;
}

export async function pauseCollection(input: PauseInput): Promise<PauseResult> {
    try {
        const collection = await prisma.collectionContract.findUnique({
            where: { address: input.collectionAddress },
            include: { network: true },
        });

        if (!collection || !collection.network) {
            return {
                success: false,
                error: "Collection not found",
            };
        }

        const escrowWallet = await getEscrowWalletWithPrivateKey(
            input.walletId
        );
        if (!escrowWallet.success || !escrowWallet.data) {
            return {
                success: false,
                error: "Escrow wallet not found",
            };
        }

        const chain = await getChain(collection.network);
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

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

        const collectionContract = getContract({
            address: collection.address as Address,
            abi,
            client: walletClient,
        });

        const gasOptions = await estimateGasOptions({
            publicClient,
            walletClient,
            contractAddress: collection.address as Address,
            abi,
            transactions: [{ functionName: "pause", args: [] }],
            customOptions: input.gasOptions,
        });

        const hash = await collectionContract.write.pause([], gasOptions);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        // DB 업데이트
        await prisma.collectionContract.update({
            where: { address: input.collectionAddress },
            data: {
                isPaused: true,
                pauseAt: new Date(),
            },
        });

        return {
            success: true,
            transactionHash: receipt.transactionHash,
        };
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes("insufficient funds")) {
                return {
                    success: false,
                    error: "Insufficient funds for gas",
                };
            }
            if (error.message.includes("gas required exceeds allowance")) {
                return {
                    success: false,
                    error: "Gas limit too low",
                };
            }
            if (error.message.includes("NOT_ALLOWED")) {
                return {
                    success: false,
                    error: "Not authorized to pause collection",
                };
            }
            if (error.message.includes("Pausable: paused")) {
                return {
                    success: false,
                    error: "Collection is already paused",
                };
            }
        }
        console.error("Error pausing collection:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to pause collection",
        };
    }
}

export interface UnpauseInput {
    collectionAddress: string;
    walletId: string;
    gasOptions?: EstimateGasOptions;
}

export interface UnpauseResult {
    success: boolean;
    transactionHash?: Hash;
    error?: string;
}

export async function unpauseCollection(
    input: UnpauseInput
): Promise<UnpauseResult> {
    try {
        const collection = await prisma.collectionContract.findUnique({
            where: { address: input.collectionAddress },
            include: { network: true },
        });

        if (!collection || !collection.network) {
            return {
                success: false,
                error: "Collection not found",
            };
        }

        const escrowWallet = await getEscrowWalletWithPrivateKey(
            input.walletId
        );
        if (!escrowWallet.success || !escrowWallet.data) {
            return {
                success: false,
                error: "Escrow wallet not found",
            };
        }

        const chain = await getChain(collection.network);
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

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

        const collectionContract = getContract({
            address: collection.address as Address,
            abi,
            client: walletClient,
        });

        const gasOptions = await estimateGasOptions({
            publicClient,
            walletClient,
            contractAddress: collection.address as Address,
            abi,
            transactions: [{ functionName: "unpause", args: [] }],
            customOptions: input.gasOptions,
        });

        const hash = await collectionContract.write.unpause([], gasOptions);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        await prisma.collectionContract.update({
            where: { address: input.collectionAddress },
            data: {
                isPaused: false,
                unpauseAt: new Date(),
            },
        });

        return {
            success: true,
            transactionHash: receipt.transactionHash,
        };
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes("insufficient funds")) {
                return {
                    success: false,
                    error: "Insufficient funds for gas",
                };
            }
            if (error.message.includes("gas required exceeds allowance")) {
                return {
                    success: false,
                    error: "Gas limit too low",
                };
            }
            if (error.message.includes("NOT_ALLOWED")) {
                return {
                    success: false,
                    error: "Not authorized to unpause collection",
                };
            }
            if (error.message.includes("Pausable: not paused")) {
                return {
                    success: false,
                    error: "Collection is not paused",
                };
            }
        }
        console.error("Error unpausing collection:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to unpause collection",
        };
    }
}
export interface AddEscrowWalletInput {
    collectionAddress: string;
    walletId: string;
    escrowWalletAddress: string;
    gasOptions?: EstimateGasOptions;
}

export interface AddEscrowWalletResult {
    success: boolean;
    transactionHash?: Hash;
    error?: string;
}

export async function addEscrowWallet(
    input: AddEscrowWalletInput
): Promise<AddEscrowWalletResult> {
    try {
        const collection = await prisma.collectionContract.findUnique({
            where: { address: input.collectionAddress },
            include: { network: true },
        });

        if (!collection || !collection.network) {
            return {
                success: false,
                error: "Collection not found",
            };
        }

        const escrowWallet = await getEscrowWalletWithPrivateKey(
            input.walletId
        );
        if (!escrowWallet.success || !escrowWallet.data) {
            return {
                success: false,
                error: "Escrow wallet not found",
            };
        }

        const chain = await getChain(collection.network);
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

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

        const collectionContract = getContract({
            address: collection.address as Address,
            abi,
            client: walletClient,
        });

        // 이미 에스크로 지갑인지 확인
        const isAlreadyEscrow = await collectionContract.read.isEscrowWallet([
            input.escrowWalletAddress as Address,
        ]);

        if (isAlreadyEscrow) {
            return {
                success: false,
                error: "Wallet is already an escrow wallet",
            };
        }

        const gasOptions = await estimateGasOptions({
            publicClient,
            walletClient,
            contractAddress: collection.address as Address,
            abi,
            transactions: [
                {
                    functionName: "addEscrowWallet",
                    args: [input.escrowWalletAddress as Address],
                },
            ],
            customOptions: input.gasOptions,
        });

        const hash = await collectionContract.write.addEscrowWallet(
            [input.escrowWalletAddress as Address],
            gasOptions
        );
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        return {
            success: true,
            transactionHash: receipt.transactionHash,
        };
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes("insufficient funds")) {
                return {
                    success: false,
                    error: "Insufficient funds for gas",
                };
            }
            if (error.message.includes("gas required exceeds allowance")) {
                return {
                    success: false,
                    error: "Gas limit too low",
                };
            }
            if (error.message.includes("NOT_ALLOWED")) {
                return {
                    success: false,
                    error: "Not authorized to add escrow wallet",
                };
            }
            if (error.message.includes("ALREADY_ADDED")) {
                return {
                    success: false,
                    error: "Wallet is already an escrow wallet",
                };
            }
        }
        console.error("Error adding escrow wallet:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to add escrow wallet",
        };
    }
}

export interface RemoveEscrowWalletInput {
    collectionAddress: string;
    walletId: string;
    escrowWalletAddress: string;
    gasOptions?: EstimateGasOptions;
}

export interface RemoveEscrowWalletResult {
    success: boolean;
    transactionHash?: Hash;
    error?: string;
}

export async function removeEscrowWallet(
    input: RemoveEscrowWalletInput
): Promise<RemoveEscrowWalletResult> {
    try {
        const collection = await prisma.collectionContract.findUnique({
            where: { address: input.collectionAddress },
            include: { network: true },
        });

        if (!collection || !collection.network) {
            return {
                success: false,
                error: "Collection not found",
            };
        }

        const escrowWallet = await getEscrowWalletWithPrivateKey(
            input.walletId
        );
        if (!escrowWallet.success || !escrowWallet.data) {
            return {
                success: false,
                error: "Escrow wallet not found",
            };
        }

        const chain = await getChain(collection.network);
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

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

        const collectionContract = getContract({
            address: collection.address as Address,
            abi,
            client: walletClient,
        });

        // 에스크로 지갑인지 확인
        const isEscrow = await collectionContract.read.isEscrowWallet([
            input.escrowWalletAddress as Address,
        ]);

        if (!isEscrow) {
            return {
                success: false,
                error: "Address is not an escrow wallet",
            };
        }

        const gasOptions = await estimateGasOptions({
            publicClient,
            walletClient,
            contractAddress: collection.address as Address,
            abi,
            transactions: [
                {
                    functionName: "removeEscrowWallet",
                    args: [input.escrowWalletAddress as Address],
                },
            ],
            customOptions: input.gasOptions,
        });

        const hash = await collectionContract.write.removeEscrowWallet(
            [input.escrowWalletAddress as Address],
            gasOptions
        );
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        return {
            success: true,
            transactionHash: receipt.transactionHash,
        };
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes("insufficient funds")) {
                return {
                    success: false,
                    error: "Insufficient funds for gas",
                };
            }
            if (error.message.includes("gas required exceeds allowance")) {
                return {
                    success: false,
                    error: "Gas limit too low",
                };
            }
            if (error.message.includes("NOT_ALLOWED")) {
                return {
                    success: false,
                    error: "Not authorized to remove escrow wallet",
                };
            }
            if (error.message.includes("NOT_FOUND")) {
                return {
                    success: false,
                    error: "Address is not an escrow wallet",
                };
            }
        }
        console.error("Error removing escrow wallet:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to remove escrow wallet",
        };
    }
}

export interface GetCollectionStatusInput {
    collectionAddress: string;
}

export interface GetCollectionStatusResult {
    isPaused: boolean;
    isMintingEnabled: boolean;
}

export async function getCollectionStatus(
    input: GetCollectionStatusInput
): Promise<GetCollectionStatusResult> {
    try {
        const collection = await prisma.collectionContract.findUnique({
            where: { address: input.collectionAddress },
            include: { network: true },
        });

        if (!collection || !collection.network) {
            throw new Error("Collection not found");
        }

        const chain = await getChain(collection.network);
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

        const collectionContract = getContract({
            address: input.collectionAddress as Address,
            abi,
            client: publicClient,
        });

        const [isPaused, isMintingEnabled] = await Promise.all([
            collectionContract.read.paused([]),
            collectionContract.read.mintingEnabled([]),
        ]);

        return {
            isPaused: isPaused as boolean,
            isMintingEnabled: isMintingEnabled as boolean,
        };
    } catch (error) {
        console.error("Error getting collection status:", error);
        return {
            isPaused: false,
            isMintingEnabled: false,
        };
    }
}

export interface GetEscrowWalletInput {
    collectionAddress: string;
}

export interface GetEscrowWalletResult {
    wallet: string;
}

export async function getEscrowWallet(
    input: GetEscrowWalletInput
): Promise<GetEscrowWalletResult> {
    try {
        const collection = await prisma.collectionContract.findUnique({
            where: { address: input.collectionAddress },
            include: { network: true },
        });

        if (!collection || !collection.network) {
            throw new Error("Collection not found");
        }

        const chain = await getChain(collection.network);
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

        const collectionContract = getContract({
            address: input.collectionAddress as Address,
            abi,
            client: publicClient,
        });

        const owner = await collectionContract.read.owner([]);
        return { wallet: owner as string };
    } catch (error) {
        console.error("Error getting escrow wallet:", error);
        return { wallet: "" };
    }
}

export interface IsEscrowWalletInput {
    collectionAddress: string;
    walletAddress: string;
}

export interface IsEscrowWalletResult {
    isEscrow: boolean;
}

export async function isEscrowWallet(
    input: IsEscrowWalletInput
): Promise<IsEscrowWalletResult> {
    try {
        const collection = await prisma.collectionContract.findUnique({
            where: { address: input.collectionAddress },
            include: { network: true },
        });

        if (!collection || !collection.network) {
            throw new Error("Collection not found");
        }

        const chain = await getChain(collection.network);
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

        const collectionContract = getContract({
            address: input.collectionAddress as Address,
            abi,
            client: publicClient,
        });

        const isEscrow = await collectionContract.read.isEscrowWallet([
            input.walletAddress as Address,
        ]);

        return { isEscrow: isEscrow as boolean };
    } catch (error) {
        console.error("Error checking escrow wallet:", error);
        return { isEscrow: false };
    }
}

export interface GetCollectionSettingsInput {
    collectionAddress: string;
}

export interface GetCollectionSettingsResult {
    id: string;
    address: string;
    price: number;
    circulation: number;
    isListed: boolean;
}

export async function getCollectionSettings(
    input: GetCollectionSettingsInput
): Promise<GetCollectionSettingsResult> {
    try {
        const collection = await prisma.collectionContract.findUnique({
            where: { address: input.collectionAddress },
            select: {
                id: true,
                address: true,
                price: true,
                circulation: true,
                isListed: true,
            },
        });

        if (!collection) {
            throw new Error("Collection not found");
        }

        return collection;
    } catch (error) {
        console.error("Error getting collection settings:", error);
        throw new Error("Failed to get collection settings");
    }
}

export interface UpdateCollectionSettingsInput {
    collectionAddress: string;
    price: number;
    circulation: number;
    isListed: boolean;
}

export interface UpdateCollectionSettingsResult {
    success: boolean;
    data?: {
        id: string;
        address: string;
        price: number;
        circulation: number;
        isListed: boolean;
    };
    error?: string;
}

export async function updateCollectionSettings(
    input: UpdateCollectionSettingsInput
): Promise<UpdateCollectionSettingsResult> {
    try {
        const { collectionAddress, price, circulation, isListed } = input;

        const updatedCollection = await prisma.collectionContract.update({
            where: { address: collectionAddress },
            data: {
                price,
                circulation,
                isListed,
            },
            select: {
                id: true,
                address: true,
                price: true,
                circulation: true,
                isListed: true,
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
