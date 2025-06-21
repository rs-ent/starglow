/// app/actions/collectionContracts.ts

"use server";

import { revalidatePath } from "next/cache";
import {
    createPublicClient,
    createWalletClient,
    http,
    getContract
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { prisma } from "@/lib/prisma/client";
import collectionJson from "@/web3/artifacts/contracts/Collection.sol/Collection.json";

import {
    estimateGasOptions,
    getChain,
    getEscrowWalletWithPrivateKey,
    getEscrowWalletWithPrivateKeyByAddress,
    getWalletBalance,
 deployContract, estimateGasForTransactions } from "./blockchain";
import { createNFTMetadata, getMetadataByCollectionAddress } from "./metadata";

import type {
    EstimateGasOptions} from "./blockchain";
import type {
    Prisma,
    BlockchainNetwork,
    CollectionContract,
    NFT,
    CollectionParticipant,
    CollectionParticipantType,
    Artist,
    Metadata,
} from "@prisma/client";
import type { Address, Hash, AbiFunction ,
    Abi} from "viem";
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
    tokenIds: number[];
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
            return { owners: [], tokenIds: [] };
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
            return { owners: [], tokenIds: [] };
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
            tokenIds: results.map((result) => result.tokenId),
        };
    } catch (error) {
        console.error("Error getting token owners:", error);
        return { owners: [], tokenIds: [] };
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
    userId: string;
    collectionAddress: string;
    tokenIds: number[];
    unlockScheduledAt: number;
    isStaking?: boolean;
    isAdmin?: boolean;
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

        const userWallets = await prisma.wallet.findMany({
            where: {
                userId: input.userId,
            },
            select: {
                address: true,
            },
        });

        const isOwner = tokens.every((token) =>
            userWallets.some(
                (wallet) => wallet.address === token.currentOwnerAddress
            )
        );

        if (!isOwner && !input.isAdmin) {
            return {
                success: false,
                error: "You are not the owner of the tokens.",
            };
        }

        console.log("collection.creatorAddress", collection.creatorAddress);

        const escrowWallet = await getEscrowWalletWithPrivateKeyByAddress(
            collection.creatorAddress as Address
        );

        console.log("escrowWallet", escrowWallet);
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
        });

        const hash = await collectionContract.write.lockTokens(
            [input.tokenIds, BigInt(input.unlockScheduledAt)],
            gasOptions
        );

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        const updateNFTData: Prisma.NFTUpdateInput = {
            isLocked: true,
            lockedAt: new Date(),
            unlockScheduledAt: new Date(input.unlockScheduledAt * 1000),
            lockTransactionHash: receipt.transactionHash,
        };

        if (input.isStaking) {
            updateNFTData.isStaked = true;
            updateNFTData.stakedAt = new Date();
        }

        const lockEvents = tokens.map((token) => ({
            nftId: token.id,
            collectionId: collection.id,
            eventType: input.isStaking ? "STAKE" : "LOCK",
            fromAddress: escrowWallet.data.address as Address,
            transactionHash: receipt.transactionHash,
            timestamp: new Date(),
        }));

        await prisma.$transaction(async (tx) => {
            await tx.nFT.updateMany({
                where: {
                    collectionId: collection.id,
                    tokenId: { in: input.tokenIds },
                },
                data: updateNFTData,
            });

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
    userId: string;
    userRole?: string;
    collectionAddress: string;
    tokenIds: number[];
    isUnstaking?: boolean;
    isAdmin?: boolean;
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

        const where: Prisma.NFTWhereInput = {
            collectionId: collection.id,
            tokenId: { in: input.tokenIds },
        };

        if (input.isUnstaking) {
            where.isStaked = true;
        }

        const tokens = await prisma.nFT.findMany({
            where,
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

        const userWallets = await prisma.wallet.findMany({
            where: {
                userId: input.userId,
            },
            select: {
                address: true,
            },
        });

        const isOwner = tokens.every((token) =>
            userWallets.some(
                (wallet) => wallet.address === token.currentOwnerAddress
            )
        );

        if (!isOwner && !input.isAdmin) {
            return {
                success: false,
                error: "You are not the owner of the tokens.",
            };
        }

        const escrowWallet = await getEscrowWalletWithPrivateKeyByAddress(
            collection.creatorAddress as Address
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
        });

        const hash = await collectionContract.write.unlockTokens(
            [input.tokenIds, true],
            gasOptions
        );

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        const updateNFTData: Prisma.NFTUpdateInput = {
            isLocked: false,
            unlockAt: new Date(),
        };

        if (input.isUnstaking) {
            updateNFTData.isStaked = false;
            updateNFTData.unstakedAt = new Date();
        }

        const unlockEvents = tokens.map((token) => ({
            nftId: token.id,
            collectionId: collection.id,
            eventType: input.isUnstaking ? "UNSTAKE" : "UNLOCK",
            fromAddress: escrowWallet.data.address as Address,
            transactionHash: receipt.transactionHash,
            timestamp: new Date(),
        }));

        await prisma.$transaction(async (tx) => {
            await tx.nFT.updateMany({
                where: {
                    id: { in: tokens.map((t) => t.id) },
                },
                data: updateNFTData,
            });

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
    if (
        !input.collectionAddress ||
        !input.fromAddress ||
        !input.spenderAddress ||
        !input.toAddress ||
        !input.tokenIds
    ) {
        return {
            success: false,
            error: "Missing required fields",
        };
    }

    if (
        !input.tokenIds ||
        !Array.isArray(input.tokenIds) ||
        input.tokenIds.length === 0
    ) {
        return {
            success: false,
            error: "Token IDs must be an array and not empty",
        };
    }

    const BATCH_SIZE = 100;
    const MAX_CONCURRENT_BATCHES = 3;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;
    const retryCount = 0;
    const results: {
        success: boolean;
        transactionHash?: Hash;
        error?: string;
    }[] = [];
    const errors: string[] = [];

    console.log(
        `Starting bulk transfer of ${input.tokenIds.length} tokens with batch size ${BATCH_SIZE}`
    );

    async function executeWithRetry<T>(
        operation: () => Promise<T>
    ): Promise<T> {
        let currentRetry = 0;
        while (true) {
            try {
                return await operation();
            } catch (error) {
                if (
                    currentRetry < MAX_RETRIES &&
                    error instanceof Error &&
                    (error.message.includes("timeout") ||
                        error.message.includes("network") ||
                        error.message.includes("connection"))
                ) {
                    currentRetry++;
                    console.log(
                        `Retrying operation (${currentRetry}/${MAX_RETRIES})...`
                    );
                    await new Promise((resolve) =>
                        setTimeout(resolve, RETRY_DELAY * currentRetry)
                    );
                } else {
                    throw error;
                }
            }
        }
    }

    try {
        const collection = await executeWithRetry(() =>
            prisma.collectionContract.findUnique({
                where: { address: input.collectionAddress },
                include: { network: true },
            })
        );

        if (!collection || !collection.network) {
            return {
                success: false,
                error: "Collection not found",
            };
        }

        const [escrowWallet, chain] = await Promise.all([
            executeWithRetry(() =>
                getEscrowWalletWithPrivateKeyByAddress(input.spenderAddress)
            ),
            executeWithRetry(() => getChain(collection.network)),
        ]);

        if (!escrowWallet.success || !escrowWallet.data) {
            return {
                success: false,
                error: "Escrow wallet not found",
            };
        }

        const privateKey = escrowWallet.data.privateKey;
        const formattedPrivateKey = privateKey.startsWith("0x")
            ? privateKey
            : `0x${privateKey}`;
        const account = privateKeyToAccount(formattedPrivateKey as Address);

        const [publicClient, walletClient, walletBalance] = await Promise.all([
            createPublicClient({
                chain,
                transport: http(),
            }),
            createWalletClient({
                account,
                chain,
                transport: http(),
            }),
            executeWithRetry(() =>
                getWalletBalance({
                    address: escrowWallet.data.address,
                    networkId: collection.network.id,
                })
            ),
        ]);

        const estimatedGasCost = BigInt(2e16);
        const requiredBalance =
            estimatedGasCost *
            BigInt(Math.ceil(input.tokenIds.length / BATCH_SIZE));

        if (
            walletBalance &&
            BigInt(walletBalance.data?.balanceWei ?? "0") < requiredBalance
        ) {
            return {
                success: false,
                error: `Insufficient balance in escrow wallet. Required ~${requiredBalance.toString()} wei`,
            };
        }

        const batches = [];
        for (let i = 0; i < input.tokenIds.length; i += BATCH_SIZE) {
            batches.push(input.tokenIds.slice(i, i + BATCH_SIZE));
        }

        console.log(`Split into ${batches.length} batches`);

        class Semaphore {
            private counter: number;
            private waiting: Array<() => void> = [];

            constructor(private maxConcurrent: number) {
                this.counter = maxConcurrent;
            }

            async acquire(): Promise<void> {
                if (this.counter > 0) {
                    this.counter--;
                    return Promise.resolve();
                }

                return new Promise<void>((resolve) => {
                    this.waiting.push(resolve);
                });
            }

            release(): void {
                if (this.waiting.length > 0) {
                    const resolve = this.waiting.shift()!;
                    resolve();
                } else {
                    this.counter++;
                }
            }
        }

        const semaphore = new Semaphore(MAX_CONCURRENT_BATCHES);

        const processBatch = async (
            batchIndex: number,
            tokenIdsBatch: number[]
        ) => {
            await semaphore.acquire();
            console.log(`Processing batch ${batchIndex + 1}/${batches.length}`);

            try {
                const tokens = await prisma.nFT.findMany({
                    where: {
                        collectionId: collection.id,
                        tokenId: { in: tokenIdsBatch },
                        isBurned: false,
                    },
                    select: {
                        id: true,
                        tokenId: true,
                        isLocked: true,
                        currentOwnerAddress: true,
                    },
                });

                if (tokens.length !== tokenIdsBatch.length) {
                    const foundTokenIds = tokens.map((t) => t.tokenId);
                    const missingTokenIds = tokenIdsBatch.filter(
                        (id) => !foundTokenIds.includes(id)
                    );
                    const errorMsg = `Tokens not found in batch ${
                        batchIndex + 1
                    }: ${missingTokenIds.join(", ")}`;
                    errors.push(errorMsg);
                    results.push({ success: false, error: errorMsg });
                    return;
                }

                const lockedTokens = tokens.filter((token) => token.isLocked);
                if (lockedTokens.length > 0) {
                    const errorMsg = `Locked tokens in batch ${
                        batchIndex + 1
                    }: ${lockedTokens.map((t) => t.tokenId).join(", ")}`;
                    errors.push(errorMsg);
                    results.push({ success: false, error: errorMsg });
                    return;
                }

                const ownershipValid = tokens.every(
                    (token) =>
                        token.currentOwnerAddress?.toLowerCase() ===
                        input.fromAddress.toLowerCase()
                );

                if (!ownershipValid) {
                    const tokenOwners = await executeWithRetry(() =>
                        getTokenOwners({
                            collectionAddress: input.collectionAddress,
                            tokenIds: tokenIdsBatch,
                        })
                    );

                    const invalidTokens = tokenOwners.owners.filter(
                        (owner, idx) =>
                            owner.toLowerCase() !==
                            input.fromAddress.toLowerCase()
                    );

                    if (invalidTokens.length > 0) {
                        const errorMsg = `Not owner of tokens in batch ${
                            batchIndex + 1
                        }`;
                        errors.push(errorMsg);
                        results.push({ success: false, error: errorMsg });
                        return;
                    }
                }

                const collectionContract = getContract({
                    address: collection.address as Address,
                    abi,
                    client: walletClient,
                });

                const gasOptions = await executeWithRetry(() =>
                    estimateGasOptions({
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
                                    tokenIdsBatch,
                                ],
                            },
                        ],
                        customOptions: input.gasOptions,
                    })
                );

                const adjustedGasOptions = {
                    ...gasOptions,
                    gasLimit:
                        gasOptions.gasLimit +
                        (gasOptions.gasLimit * BigInt(20)) / BigInt(100),
                };

                const hash = await executeWithRetry(() =>
                    collectionContract.write.escrowTransfer(
                        [
                            input.fromAddress as Address,
                            account.address,
                            input.toAddress as Address,
                            tokenIdsBatch,
                        ],
                        adjustedGasOptions
                    )
                );

                console.log(
                    `Batch ${batchIndex + 1} transaction submitted: ${hash}`
                );

                const receipt = await executeWithRetry(() =>
                    publicClient.waitForTransactionReceipt({
                        hash,
                        timeout: 600_000,
                        confirmations: 2,
                    })
                );

                console.log(
                    `Batch ${batchIndex + 1} transaction confirmed: ${
                        receipt.transactionHash
                    }`
                );

                await prisma.$transaction(async (tx) => {
                    await tx.nFT.updateMany({
                        where: {
                            collectionId: collection.id,
                            tokenId: { in: tokenIdsBatch },
                        },
                        data: {
                            currentOwnerAddress: input.toAddress,
                            transferCount: { increment: 1 },
                            lastTransferredAt: new Date(),
                        },
                    });

                    const transferEvents = tokens.map((token) => ({
                        nftId: token.id,
                        collectionId: collection.id,
                        eventType: "TRANSFER",
                        fromAddress: input.fromAddress,
                        toAddress: input.toAddress,
                        transactionHash: receipt.transactionHash,
                        timestamp: new Date(),
                    }));

                    await tx.nFTEvent.createMany({
                        data: transferEvents,
                    });
                });

                results.push({
                    success: true,
                    transactionHash: receipt.transactionHash,
                });
            } catch (error) {
                let errorMessage = "Unknown error in batch processing";

                if (error instanceof Error) {
                    errorMessage = error.message;

                    if (error.message.includes("insufficient funds")) {
                        errorMessage = "Insufficient funds for gas";
                    } else if (
                        error.message.includes("gas required exceeds allowance")
                    ) {
                        errorMessage = "Gas limit too low";
                    } else if (error.message.includes("INVALID_SIGNATURE")) {
                        errorMessage = "Invalid transfer signature";
                    } else if (
                        error.message.includes("network") ||
                        error.message.includes("timeout")
                    ) {
                        errorMessage = "Network error or timeout occurred";
                    } else if (error.message.includes("transaction")) {
                        errorMessage = "Transaction failed: " + error.message;
                    }
                }

                console.error(`Error in batch ${batchIndex + 1}:`, error);
                errors.push(`Batch ${batchIndex + 1}: ${errorMessage}`);
                results.push({ success: false, error: errorMessage });
            } finally {
                semaphore.release();
            }
        };

        // 모든 배치 동시 처리 (세마포어로 동시성 제한)
        await Promise.all(
            batches.map((batch, index) => processBatch(index, batch))
        );

        // 결과 분석 및 반환
        const successfulBatches = results.filter((r) => r.success).length;
        const totalBatches = batches.length;

        if (successfulBatches === totalBatches) {
            revalidatePath("/");
            return {
                success: true,
                transactionHash: results[0].transactionHash,
            };
        } else if (successfulBatches > 0) {
            revalidatePath("/");
            return {
                success: true,
                transactionHash: results.find((r) => r.success)
                    ?.transactionHash,
                error: `Partial success: ${successfulBatches}/${totalBatches} batches completed. Errors: ${errors.join(
                    "; "
                )}`,
            };
        } else {
            return {
                success: false,
                error: `All batches failed: ${errors.join("; ")}`,
            };
        }
    } catch (error) {
        console.error("Fatal error in bulk transfer:", error);

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
            if (
                error.message.includes("network") ||
                error.message.includes("timeout")
            ) {
                return {
                    success: false,
                    error: "Network error or timeout occurred",
                };
            }
            return {
                success: false,
                error: error.message,
            };
        }

        return {
            success: false,
            error: "Failed to transfer tokens: Unknown error",
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
    preSaleStart?: Date;
    preSaleEnd?: Date;
    saleStart?: Date;
    saleEnd?: Date;
    glowStart?: Date;
    glowEnd?: Date;
}

export interface UpdateCollectionSettingsResult {
    success: boolean;
    data?: {
        id: string;
        address: string;
        price: number;
        circulation: number;
        isListed: boolean;
        preSaleStart?: Date | null;
        preSaleEnd?: Date | null;
        saleStart?: Date | null;
        saleEnd?: Date | null;
        glowStart?: Date | null;
        glowEnd?: Date | null;
    };
    error?: string;
}

export async function updateCollectionSettings(
    input: UpdateCollectionSettingsInput
): Promise<UpdateCollectionSettingsResult> {
    try {
        const {
            collectionAddress,
            price,
            circulation,
            isListed,
            preSaleStart,
            preSaleEnd,
            saleStart,
            saleEnd,
            glowStart,
            glowEnd,
        } = input;

        const updatedCollection = await prisma.collectionContract.update({
            where: { address: collectionAddress },
            data: {
                price,
                circulation,
                isListed,
                preSaleStart,
                preSaleEnd,
                saleStart,
                saleEnd,
                glowStart,
                glowEnd,
            },
            select: {
                id: true,
                address: true,
                price: true,
                circulation: true,
                isListed: true,
                preSaleStart: true,
                preSaleEnd: true,
                saleStart: true,
                saleEnd: true,
                glowStart: true,
                glowEnd: true,
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

export interface GetCollectionStockInput {
    collectionAddress: string;
}

export interface GetCollectionStockResult {
    remain: number;
    total: number;
}

export async function getCollectionStock(
    input?: GetCollectionStockInput
): Promise<GetCollectionStockResult> {
    if (!input) {
        return { remain: 0, total: 0 };
    }

    try {
        const collection = await prisma.collectionContract.findUnique({
            where: { address: input.collectionAddress },
            select: {
                circulation: true,
                creatorAddress: true,
            },
        });

        const tokenOwners = await getTokenOwners({
            collectionAddress: input.collectionAddress,
        });

        const tokenOwnedByCreator = tokenOwners.owners.filter(
            (owner) => owner === collection?.creatorAddress
        );

        const tokenOwnedByUsers = tokenOwners.owners.filter(
            (owner) => owner !== collection?.creatorAddress
        );

        const remain = Math.min(
            (collection?.circulation ?? 0) - tokenOwnedByUsers.length,
            tokenOwnedByCreator.length
        );

        return {
            remain: remain,
            total: Math.min(
                collection?.circulation ?? 0,
                tokenOwnedByCreator.length
            ),
        };
    } catch (error) {
        console.error("Error getting collection stock:", error);
        return { remain: 0, total: 0 };
    }
}

export interface GetCollectionParticipantsInput {
    collectionAddress: string;
    type: CollectionParticipantType;
}

export async function getCollectionParticipants(
    input?: GetCollectionParticipantsInput
): Promise<CollectionParticipant[]> {
    if (!input) {
        return [];
    }

    try {
        const participants = await prisma.collectionParticipant.findMany({
            where: {
                collectionAddress: input.collectionAddress,
                type: input.type,
            },
        });

        return participants;
    } catch (error) {
        console.error("Error getting collection participants:", error);
        return [];
    }
}

export interface GetTokensLockStatusInput {
    collectionAddress: string;
    tokenIds: number[];
}

export interface GetTokensLockStatusResult {
    tokenId: number;
    isLocked: boolean;
}

export async function getTokensLockStatus(
    input?: GetTokensLockStatusInput
): Promise<GetTokensLockStatusResult[]> {
    if (!input) {
        return [];
    }

    const { collectionAddress, tokenIds } = input;

    console.log("Collection Address", collectionAddress);
    console.log("Token IDs", tokenIds);

    const collection = await prisma.collectionContract.findUnique({
        where: { address: collectionAddress },
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

    const contractFunctionAbi = abi.filter((item) => item.type === "function");

    const results = await publicClient.multicall({
        contracts: tokenIds.map((tokenId) => ({
            address: collectionAddress as Address,
            abi: contractFunctionAbi as Abi,
            functionName: "isTokenLocked",
            args: [BigInt(tokenId)],
        })),
        multicallAddress: collection.network.multicallAddress as Address,
    });

    console.log("Token Lock Status", results);

    return tokenIds.map((tokenId, idx) => ({
        tokenId,
        isLocked:
            results[idx].status === "success"
                ? (results[idx].result as boolean)
                : false,
    }));
}

export interface GetUserVerifiedCollectionsInput {
    userId: string;
}

export type VerifiedCollection = CollectionContract & {
    artist: Artist | null;
    metadata: Metadata | null;
    verifiedTokens: number[];
};

export async function getUserVerifiedCollections(
    input?: GetUserVerifiedCollectionsInput
): Promise<VerifiedCollection[]> {
    if (!input || !input.userId) {
        return [];
    }

    try {
        const [wallets, collections] = await Promise.all([
            prisma.wallet.findMany({
                where: {
                    userId: input.userId,
                },
                select: {
                    address: true,
                },
            }),
            prisma.collectionContract.findMany({
                include: {
                    artist: true,
                    metadata: true,
                },
            }),
        ]);

        const unverifiedNfts = await prisma.nFT.findMany({
            where: {
                currentOwnerAddress: {
                    in: wallets.map((wallet) => wallet.address),
                },
            },
            select: {
                tokenId: true,
                collectionId: true,
            },
        });

        const collectionsWithVerifiedTokens = await Promise.all(
            collections.map(async (collection) => {
                const collectionNfts = unverifiedNfts.filter(
                    (nft) => nft.collectionId === collection.id
                );

                const tokenOwners = await getTokenOwners({
                    collectionAddress: collection.address,
                    tokenIds: collectionNfts.map((nft) => nft.tokenId),
                });

                const walletAddresses = new Set(
                    wallets.map((wallet) => wallet.address.toLowerCase())
                );
                const verifiedTokens = tokenOwners.tokenIds.filter(
                    (tokenId, index) => {
                        const owner = tokenOwners.owners[index].toLowerCase();
                        return walletAddresses.has(owner);
                    }
                );

                return {
                    ...collection,
                    verifiedTokens,
                };
            })
        );

        return collectionsWithVerifiedTokens;
    } catch (error) {
        console.error("Error getting user verified collections:", error);
        return [];
    }
}

export interface AddPageImagesInput {
    collectionAddress: string;
    images: string[];
}

export async function addPageImages(
    input: AddPageImagesInput
): Promise<{ success: boolean; error?: any; data?: CollectionContract }> {
    try {
        const { collectionAddress, images } = input;
        const collection = await prisma.collectionContract.update({
            where: { address: collectionAddress },
            data: { pageImages: images },
        });

        return { success: true, data: collection };
    } catch (error) {
        console.error("Error adding page images:", error);
        return { success: false, error: error };
    }
}

export interface GetTokensByOwnerInput {
    collectionAddress: string;
    ownerAddress: string;
    maxTokens?: number;
}

export interface GetTokensByOwnerResult {
    success: boolean;
    tokenIds: number[];
    error?: string;
}

export async function getTokensByOwner(
    input: GetTokensByOwnerInput
): Promise<GetTokensByOwnerResult> {
    try {
        const collection = await prisma.collectionContract.findUnique({
            where: { address: input.collectionAddress },
            include: { network: true },
        });

        if (!collection || !collection.network) {
            return {
                success: false,
                tokenIds: [],
                error: "Collection not found",
            };
        }

        const chain = await getChain(collection.network);
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

        const contract = getContract({
            address: collection.address as Address,
            abi,
            client: publicClient,
        });

        // 1. 해당 주소의 토큰 개수 확인
        const balance = await contract.read.balanceOf([
            input.ownerAddress as Address,
        ]);
        const tokenCount = Number(balance);

        if (tokenCount === 0) {
            return {
                success: true,
                tokenIds: [],
            };
        }

        // 2. 전체 공급량 확인
        const totalSupply = await contract.read.totalSupply();
        const totalTokens = Number(totalSupply);

        if (totalTokens === 0) {
            return {
                success: true,
                tokenIds: [],
            };
        }

        // 3. 토큰 ID 범위 확인 (ERC721A는 보통 0 또는 1부터 시작)
        const startTokenId = await contract.read
            ._startTokenId()
            .catch(() => BigInt(0));
        const nextTokenId = await contract.read._nextTokenId();

        const maxTokenId = Number(nextTokenId) - 1;
        const minTokenId = Number(startTokenId);

        // 4. 배치로 ownerOf 확인 (Sepolia 최적화)
        const BATCH_SIZE = 30; // Sepolia는 더 작은 배치 사용
        const MAX_RETRIES = 2; // 재시도 횟수 줄이기
        const RETRY_DELAY = 500; // 재시도 간격 단축

        const ownedTokens: number[] = [];
        const maxTokensToFind = input.maxTokens || tokenCount;

        let foundTokens = 0;

        for (
            let start = minTokenId;
            start <= maxTokenId && foundTokens < maxTokensToFind;
            start += BATCH_SIZE
        ) {
            const end = Math.min(start + BATCH_SIZE - 1, maxTokenId);
            const tokenIds = Array.from(
                { length: end - start + 1 },
                (_, i) => start + i
            );

            let retryCount = 0;
            while (retryCount < MAX_RETRIES) {
                try {
                    const owners = await publicClient.multicall({
                        contracts: tokenIds.map((tokenId) => ({
                            address: input.collectionAddress as Address,
                            abi: abi as AbiFunction[],
                            functionName: "ownerOf",
                            args: [BigInt(tokenId)],
                        })),
                        multicallAddress: collection.network
                            .multicallAddress as Address,
                    });

                    tokenIds.forEach((tokenId, index) => {
                        const result = owners[index];
                        if (
                            result.status === "success" &&
                            result.result &&
                            (
                                result.result as unknown as string
                            ).toLowerCase() === input.ownerAddress.toLowerCase()
                        ) {
                            ownedTokens.push(tokenId);
                            foundTokens++;
                        }
                    });

                    break; // 성공 시 반복 중단
                } catch (error) {
                    retryCount++;
                    if (retryCount === MAX_RETRIES) {
                        console.error(
                            `Error in batch ${start}-${end} after retries:`,
                            error
                        );
                        // 배치 실패 시 개별 토큰 검사로 fallback
                        for (const tokenId of tokenIds) {
                            try {
                                const owner = await contract.read.ownerOf([
                                    BigInt(tokenId),
                                ]);
                                if (
                                    (
                                        owner as unknown as string
                                    ).toLowerCase() ===
                                    input.ownerAddress.toLowerCase()
                                ) {
                                    ownedTokens.push(tokenId);
                                    foundTokens++;
                                    if (foundTokens >= maxTokensToFind) break;
                                }
                            } catch (individualError) {
                                // 개별 토큰 조회 실패는 스킵
                                continue;
                            }
                        }
                        break;
                    }
                    console.log(
                        `Retrying batch ${start}-${end} (attempt ${retryCount}/${MAX_RETRIES})`
                    );
                    await new Promise((resolve) =>
                        setTimeout(resolve, RETRY_DELAY)
                    );
                }
            }

            // 요청한 최대 토큰 수에 도달하면 중단
            if (foundTokens >= maxTokensToFind) {
                break;
            }
        }

        return {
            success: true,
            tokenIds: ownedTokens.slice(0, maxTokensToFind),
        };
    } catch (error) {
        console.error("Error getting tokens by owner:", error);
        return {
            success: false,
            tokenIds: [],
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to get tokens by owner",
        };
    }
}
