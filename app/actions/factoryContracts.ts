/// app/actions/factoryContracts.ts

"use server";

import {
    createPublicClient,
    createWalletClient,
    http,
    getContract,
    Address,
    Hash,
} from "viem";
import { prisma } from "@/lib/prisma/client";
import {
    deployContract,
    estimateGasOptions,
    getChain,
    getEscrowWalletWithPrivateKey,
} from "./blockchain";
import {
    Artist,
    CollectionContract,
    FactoryContract,
    Metadata,
} from "@prisma/client";
import { privateKeyToAccount } from "viem/accounts";

import factoryJson from "@/web3/artifacts/contracts/Factory.sol/CollectionFactory.json";
const abi = factoryJson.abi;
const bytecode = factoryJson.bytecode as `0x${string}`;

import collectionJson from "@/web3/artifacts/contracts/Collection.sol/Collection.json";
const collectionAbi = collectionJson.abi;
const collectionBytecode = collectionJson.bytecode as `0x${string}`;

export interface DeployFactoryInput {
    networkId: string;
    walletId: string;
}

export interface DeployFactoryResult {
    success: boolean;
    data?: FactoryContract;
    error?: string;
}

export async function deployFactory(
    input: DeployFactoryInput
): Promise<DeployFactoryResult> {
    try {
        const network = await prisma.blockchainNetwork.findUnique({
            where: { id: input.networkId },
        });
        if (!network) {
            return {
                success: false,
                error: "Network not found",
            };
        }

        const { hash, contractAddress } = await deployContract({
            walletId: input.walletId,
            network,
            abi,
            bytecode,
            args: [], // constructor가 없으므로 빈 배열
        });

        const chain = await getChain(network);
        const escrowWallet = await getEscrowWalletWithPrivateKey(
            input.walletId
        );
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
        const walletClient = createWalletClient({
            account,
            chain,
            transport: http(),
        });

        const factoryContract = getContract({
            address: contractAddress as Address,
            abi,
            client: walletClient,
        });

        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

        const initTx = await factoryContract.write.initialize([
            escrowWallet.data.address,
        ]);
        await publicClient.waitForTransactionReceipt({ hash: initTx });

        const factory = await prisma.factoryContract.create({
            data: {
                address: contractAddress,
                networkId: input.networkId,
                deployedAt: new Date(),
                deployedBy: input.walletId,
                transactionHash: hash,
                isActive: true,
            },
        });

        return {
            success: true,
            data: factory,
        };
    } catch (error) {
        console.error("Error deploying factory:", error);
        return {
            success: false,
            error: "Failed to deploy factory",
        };
    }
}

export interface GetFactoryInput {
    networkId?: string;
    includeInactive?: boolean | true;
}

export interface GetFactoryResult {
    success: boolean;
    data?: FactoryContract[];
    error?: string;
}

export async function getFactories(
    input: GetFactoryInput
): Promise<GetFactoryResult> {
    try {
        const where: any = {};

        if (input.networkId) {
            where.networkId = input.networkId;
        }

        if (!input.includeInactive) {
            where.isActive = true;
        }

        const factoryContracts = await prisma.factoryContract.findMany({
            where,
            include: {
                network: true,
            },
            orderBy: {
                deployedAt: "desc",
            },
        });

        return {
            success: true,
            data: factoryContracts,
        };
    } catch (error) {
        console.error("Error getting factory contracts:", error);
        return {
            success: false,
            error: "Failed to get factory contracts",
        };
    }
}

export interface UpdateFactoryInput {
    id: string;
    isActive?: boolean;
}

export interface UpdateFactoryResult {
    success: boolean;
    data?: FactoryContract;
    error?: string;
}

export async function updateFactory(
    input: UpdateFactoryInput
): Promise<UpdateFactoryResult> {
    try {
        const factory = await prisma.factoryContract.update({
            where: { id: input.id },
            data: { isActive: input.isActive },
        });

        return {
            success: true,
            data: factory,
        };
    } catch (error) {
        console.error("Error updating factory:", error);
        return {
            success: false,
            error: "Failed to update factory",
        };
    }
}

export interface CreateCollectionInput {
    factoryId: string;
    walletId: string;
    params: {
        name: string;
        symbol: string;
        maxSupply: number;
        mintPrice: number;
        baseURI: string;
        contractURI: string;
        collectionKey: string;
    };
}

export interface CreateCollectionResult {
    success: boolean;
    data?: CollectionContract;
    error?: string;
}

export async function createCollection(
    input: CreateCollectionInput
): Promise<CreateCollectionResult> {
    try {
        const factory = await prisma.factoryContract.findUnique({
            where: { id: input.factoryId },
            include: { network: true },
        });

        if (!factory || !factory.network) {
            return {
                success: false,
                error: "Factory not found",
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

        const chain = await getChain(factory.network);
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

        const factoryContract = getContract({
            address: factory.address as Address,
            abi,
            client: walletClient,
        });

        console.log("Input params:", input.params);

        const gasOptions = await estimateGasOptions({
            publicClient,
            walletClient,
            contractAddress: factory.address as Address,
            abi,
            transactions: [
                {
                    functionName: "createCollection",
                    args: [
                        input.params.name,
                        input.params.symbol,
                        BigInt(input.params.maxSupply),
                        BigInt(input.params.mintPrice),
                        `${input.params.baseURI}`,
                        `${input.params.contractURI}`,
                    ],
                },
            ],
        });

        console.log("Estimated gas options:", {
            maxFeePerGas: gasOptions.maxFeePerGas.toString(),
            maxPriorityFeePerGas: gasOptions.maxPriorityFeePerGas.toString(),
            gasLimit: gasOptions.gasLimit.toString(),
        });

        const hash = await factoryContract.write.createCollection(
            [
                input.params.name,
                input.params.symbol,
                BigInt(input.params.maxSupply),
                BigInt(input.params.mintPrice),
                `${input.params.baseURI}`,
                `${input.params.contractURI}`,
            ],
            {
                gas: gasOptions.gasLimit,
                maxFeePerGas: gasOptions.maxFeePerGas,
                maxPriorityFeePerGas: gasOptions.maxPriorityFeePerGas,
            }
        );

        console.log("Hash:", hash);

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log("Receipt:", receipt);

        if (!receipt.to) {
            return {
                success: false,
                error: "Factory contract address not found",
            };
        }

        const factoryAddress = receipt.to.toLowerCase();
        const collectionAddress = receipt.logs.find(
            (log) => log.address.toLowerCase() !== factoryAddress
        )?.address as Address;

        if (!collectionAddress) {
            return {
                success: false,
                error: "Collection address not found in transaction logs",
            };
        }

        console.log("Collection address:", collectionAddress);

        const collection = await prisma.collectionContract.create({
            data: {
                key: input.params.collectionKey,
                address: collectionAddress,
                name: input.params.name,
                symbol: input.params.symbol,
                maxSupply: input.params.maxSupply,
                mintPrice: input.params.mintPrice.toString(),
                baseURI: input.params.baseURI,
                contractURI: input.params.contractURI,
                factoryId: input.factoryId,
                networkId: factory.networkId,
                createdBy: input.walletId,
                creatorAddress: escrowWallet.data.address,
                txHash: receipt.transactionHash,
                isListed: false,
                circulation: input.params.maxSupply,
                abi: collectionAbi,
                bytecode: collectionBytecode,
            },
        });

        return {
            success: true,
            data: collection,
        };
    } catch (error) {
        console.error("Error creating collection:", error);
        return {
            success: false,
            error: "Failed to create collection",
        };
    }
}
export interface GetCollectionInput {
    factoryId?: string;
    networkId?: string;
    isListed?: boolean;
}

export type Collection = CollectionContract & {
    metadata: Metadata | null;
    artist: Artist | null;
};

export interface GetCollectionResult {
    success: boolean;
    data?: Collection[];
    error?: string;
}

export async function getCollections(
    input?: GetCollectionInput
): Promise<GetCollectionResult> {
    try {
        if (!input) {
            const collections = (await prisma.collectionContract.findMany({
                orderBy: { createdAt: "desc" },
                include: {
                    metadata: true,
                    artist: true,
                },
            })) as Collection[];

            return {
                success: true,
                data: collections,
            };
        }

        if (input.factoryId) {
            const factory = await prisma.factoryContract.findUnique({
                where: { id: input.factoryId },
                include: { network: true },
            });

            if (!factory || !factory.network) {
                return {
                    success: false,
                    error: "Factory not found",
                };
            }
        }

        const where: any = {};

        if (input.factoryId) {
            where.factoryId = input.factoryId;
        }

        if (input.networkId) {
            where.networkId = input.networkId;
        }

        if (input.isListed) {
            where.isListed = input.isListed;
        }

        const collections = (await prisma.collectionContract.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                metadata: true,
                artist: true,
            },
        })) as Collection[];

        return {
            success: true,
            data: collections,
        };
    } catch (error) {
        console.error("Error getting collections:", error);
        return {
            success: false,
            error: "Failed to get collections",
        };
    }
}

export interface DeleteCollectionInput {
    factoryId: string;
    walletId: string;
    collectionAddress: string;
}

export interface DeleteCollectionResult {
    success: boolean;
    transactionHash?: Hash;
    error?: string;
}

export async function deleteCollection(
    input: DeleteCollectionInput
): Promise<DeleteCollectionResult> {
    try {
        const factory = await prisma.factoryContract.findUnique({
            where: { id: input.factoryId },
            include: { network: true },
        });

        if (!factory || !factory.network) {
            return {
                success: false,
                error: "Factory not found",
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

        const chain = await getChain(factory.network);
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

        const factoryContract = getContract({
            address: factory.address as Address,
            abi,
            client: walletClient,
        });

        const hash = await factoryContract.write.deleteCollection([
            input.collectionAddress as Address,
        ]);

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        await prisma.collectionContract.delete({
            where: { address: input.collectionAddress },
        });

        return {
            success: true,
            transactionHash: receipt.transactionHash,
        };
    } catch (error) {
        console.error("Error deleting collection:", error);
        return {
            success: false,
            error: "Failed to delete collection",
        };
    }
}
