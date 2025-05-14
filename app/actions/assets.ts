/// app/actions/assets.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import { AssetsContract, Asset, AssetType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import {
    deployContract,
    getChain,
    getEscrowWalletWithPrivateKey,
} from "./blockchain";

import {
    Address,
    createPublicClient,
    getContract,
    createWalletClient,
    http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

import assetsJson from "@/web3/artifacts/contracts/Assets.sol/Assets.json";
const abi = assetsJson.abi;
const bytecode = assetsJson.bytecode as `0x${string}`;

import {
    PlayerAssetResult,
    updatePlayerAssetsOnAssetChange,
} from "./playerAssets";


export interface DeployAssetsContractInput {
    walletId: string;
    networkId: string;
    version: string;
    description?: string;
}

export interface DeployAssetsContractResult {
    success: boolean;
    data?: AssetsContract;
    error?: string;
}

export async function deployAssetsContract(
    input: DeployAssetsContractInput
): Promise<DeployAssetsContractResult> {
    try {
        const network = await prisma.blockchainNetwork.findUnique({
            where: {
                id: input.networkId,
            },
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
            args: [],
        });

        const chain = await getChain(network);
        const escrowWallet = await getEscrowWalletWithPrivateKey(
            input.walletId
        );
        if (!escrowWallet.success || !escrowWallet.data) {
            return { success: false, error: "Escrow wallet not found" };
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

        const assetsContract = getContract({
            address: contractAddress as Address,
            abi,
            client: walletClient,
        });

        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

        const initTx = await assetsContract.write.initialize();
        await publicClient.waitForTransactionReceipt({ hash: initTx });

        const deployedContract = await prisma.assetsContract.create({
            data: {
                address: contractAddress,
                version: input.version,
                description: input.description,
                networkId: input.networkId,
                abi,
                bytecode,
                creatorAddress: escrowWallet.data.address,
            },
        });

        revalidatePath("/admin/assets");
        return {
            success: true,
            data: deployedContract,
        };
    } catch (error) {
        console.error("Failed to deploy assets contract:", error);
        return {
            success: false,
            error: "Failed to deploy assets contract",
        };
    }
}

export interface GetAssetsContractInput {
    address?: string;
    id?: string;
    networkId?: string;
}

export async function getAssetsContract(
    input?: GetAssetsContractInput
): Promise<AssetsContract | null> {
    if (!input) return null;

    try {
        const where: Prisma.AssetsContractWhereInput = {};
        if (input.address) where.address = input.address;
        if (input.id) where.id = input.id;
        if (input.networkId) where.networkId = input.networkId;

        const contract = await prisma.assetsContract.findFirst({
            where,
            include: {
                network: true,
            },
        });
        return contract;
    } catch (error) {
        console.error("Failed to get assets contract:", error);
        throw new Error("Failed to get assets contract");
    }
}

export interface GetAssetsContractsInput {
    networkId?: string;
    version?: string;
    creatorAddress?: string;
}

export interface GetAssetsContractsOutput {
    contracts: AssetsContract[];
    totalItems: number;
    totalPages: number;
}

export async function getAssetsContracts(
    input?: GetAssetsContractsInput,
    pagination?: Pagination
): Promise<GetAssetsContractsOutput> {
    try {
        const currentPage = pagination?.currentPage || 1;
        const itemsPerPage =
            pagination?.itemsPerPage || Number.MAX_SAFE_INTEGER;

        const where: Prisma.AssetsContractWhereInput = {};
        if (input?.networkId) where.networkId = input.networkId;
        if (input?.version) where.version = input.version;
        if (input?.creatorAddress) where.creatorAddress = input.creatorAddress;

        const contracts = await prisma.assetsContract.findMany({
            where,
            include: {
                network: true,
            },
            skip: (currentPage - 1) * itemsPerPage,
            take: itemsPerPage,
            orderBy: {
                createdAt: "desc",
            },
        });

        const totalItems = await prisma.assetsContract.count({ where });
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        return {
            contracts,
            totalItems,
            totalPages,
        };
    } catch (error) {
        console.error("Failed to get assets contracts:", error);
        return {
            contracts: [],
            totalItems: 0,
            totalPages: 0,
        };
    }
}

export type CreateAssetInput = {
    assetsContractAddress: string;
    name: string;
    symbol: string;
    description?: string;
    iconUrl?: string;
    imageUrl?: string;
    metadata?: any;
    assetType: AssetType;
    contractAddress?: string;
    networkId?: string;
    selectors?: string[];
    abis?: Record<string, any>;
    createdBy?: string;
};

export async function createAsset(input: CreateAssetInput): Promise<Asset> {
    if (input.assetType === "ONCHAIN") {
        if (!input.contractAddress) {
            throw new Error("Contract address is required for ONCHAIN assets");
        }
        if (!input.networkId) {
            throw new Error("Network ID is required for ONCHAIN assets");
        }
    }

    try {
        const assetsContract = await prisma.assetsContract.findUnique({
            where: {
                address: input.assetsContractAddress,
            },
            include: {
                network: true,
            },
        });

        if (!assetsContract) {
            throw new Error("Assets contract not found");
        }

        const assetId = `${input.name}-${
            input.symbol
        }-${Date.now()}`.toLowerCase();

        const chain = await getChain(assetsContract.network);
        const escrowWallet = await getEscrowWalletWithPrivateKey(
            input.createdBy!
        );

        if (!escrowWallet.success || !escrowWallet.data) {
            throw new Error("Failed to get escrow wallet");
        }

        const walletClient = createWalletClient({
            account: privateKeyToAccount(
                escrowWallet.data.privateKey as `0x${string}`
            ),
            chain,
            transport: http(),
        });

        const contract = getContract({
            address: assetsContract.address as `0x${string}`,
            abi: abi,
            client: walletClient,
        });

        const isOnchain = input.assetType === "ONCHAIN";
        const metadata = {
            ...input.metadata,
            description: input.description,
            iconUrl: input.iconUrl,
            imageUrl: input.imageUrl,
            createdAt: new Date().toISOString(),
            version: "1.0",
        };

        const tx = await contract.write.createAsset([
            assetId,
            input.name,
            input.symbol,
            JSON.stringify(metadata),
            isOnchain ? 0 : 1,
            isOnchain
                ? input.contractAddress
                : "0x0000000000000000000000000000000000000000",
        ]);

        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });
        await publicClient.waitForTransactionReceipt({ hash: tx });

        const asset = await prisma.asset.create({
            data: {
                name: input.name,
                symbol: input.symbol,
                description: input.description,
                iconUrl: input.iconUrl,
                imageUrl: input.imageUrl,
                metadata: input.metadata,
                assetType: input.assetType,
                contractAddress: input.contractAddress,
                networkId: input.networkId,
                selectors: input.selectors || [],
                abis: input.abis || {},
                isActive: true,
                assetId: assetId,
                assetsContractAddress: assetsContract.address,
            },
        });
        revalidatePath("/admin/assets");
        return asset;
    } catch (error) {
        console.error("Failed to create asset:", error);
        throw new Error("Failed to create asset");
    }
}

export interface GetAssetInput {
    id?: string;
    name?: string;
    symbol?: string;
    contractAddress?: string;
}

export async function getAsset(input?: GetAssetInput): Promise<Asset | null> {
    if (!input) {
        return null;
    }

    try {
        const where: Prisma.AssetWhereInput = {};
        if (input.id) {
            where.id = input.id;
        }
        if (input.name) {
            where.name = input.name;
        }
        if (input.symbol) {
            where.symbol = input.symbol;
        }
        if (input.contractAddress) {
            where.contractAddress = input.contractAddress;
        }

        const asset = await prisma.asset.findFirst({
            where,
            include: {
                network: true,
            },
        });
        return asset;
    } catch (error) {
        console.error("Failed to get asset:", error);
        throw new Error("Failed to get asset");
    }
}

export interface Pagination {
    currentPage: number;
    itemsPerPage: number;
    totalItems?: number;
    totalPages?: number;
}

export interface GetAssetsInput {
    assetType?: AssetType;
    isActive?: boolean;
    name?: string;
    symbol?: string;
    contractAddress?: string;
}

export interface GetAssetsOutput {
    assets: Asset[];
    totalItems: number;
    totalPages: number;
}

export async function getAssets(
    input?: GetAssetsInput,
    pagination?: Pagination
): Promise<GetAssetsOutput> {
    try {
        const currentPage = pagination?.currentPage || 1;
        const itemsPerPage =
            pagination?.itemsPerPage || Number.MAX_SAFE_INTEGER;

        const where: Prisma.AssetWhereInput = {};
        if (input?.assetType) {
            where.assetType = input.assetType;
        }
        if (input?.isActive) {
            where.isActive = input.isActive;
        }
        if (input?.name) {
            where.name = {
                contains: input.name,
                mode: "insensitive",
            };
        }
        if (input?.symbol) {
            where.symbol = {
                contains: input.symbol,
                mode: "insensitive",
            };
        }
        if (input?.contractAddress) {
            where.contractAddress = {
                contains: input.contractAddress,
                mode: "insensitive",
            };
        }

        const assets = await prisma.asset.findMany({
            where,
            skip: (currentPage - 1) * itemsPerPage,
            take: itemsPerPage,
        });

        const totalItems = await prisma.asset.count({
            where,
        });

        const totalPages = Math.ceil(totalItems / itemsPerPage);

        return {
            assets,
            totalItems,
            totalPages,
        };
    } catch (error) {
        console.error("Failed to get assets:", error);
        return {
            assets: [],
            totalItems: 0,
            totalPages: 0,
        };
    }
}

export interface DeleteAssetInput {
    id: string;
}

export async function deleteAsset(input?: DeleteAssetInput): Promise<boolean> {
    try {
        if (!input) {
            return false;
        }
        await prisma.asset.delete({
            where: {
                id: input.id,
            },
        });
        revalidatePath("/admin/assets");
        return true;
    } catch (error) {
        console.error("Failed to delete asset:", error);
        return false;
    }
}

export interface ActivateAssetInput {
    id: string;
}

export async function activateAsset(
    input?: ActivateAssetInput
): Promise<Asset | null> {
    try {
        if (!input) {
            return null;
        }

        const asset = await prisma.asset.update({
            where: {
                id: input.id,
            },
            data: {
                isActive: true,
            },
        });
        revalidatePath("/admin/assets");
        return asset;
    } catch (error) {
        console.error("Failed to activate asset:", error);
        throw new Error("Failed to activate asset");
    }
}

export interface DeactivateAssetInput {
    id: string;
}

export async function deactivateAsset(
    input?: DeactivateAssetInput
): Promise<Asset | null> {
    try {
        if (!input) {
            return null;
        }

        const asset = await prisma.asset.update({
            where: {
                id: input.id,
            },
            data: {
                isActive: false,
            },
        });

        await handleAssetStatusChange({
            assetId: input.id,
            previousStatus: {
                isActive: true,
                assetType: asset.assetType,
            },
            newStatus: {
                isActive: false,
                assetType: asset.assetType,
            },
            reason: "Asset deactivated",
        });

        revalidatePath("/admin/assets");
        return asset;
    } catch (error) {
        console.error("Failed to deactivate asset:", error);
        throw new Error("Failed to deactivate asset");
    }
}

export interface AddAssetFunctionInput {
    assetId: string;
    selector: string;
    functionAbi: string;
    createdBy?: string;
}

export async function addAssetFunction(
    input: AddAssetFunctionInput
): Promise<Asset> {
    try {
        const asset = await prisma.asset.findUnique({
            where: { id: input.assetId },
            include: { assetsContract: { include: { network: true } } },
        });

        if (!asset || !asset.assetsContract) {
            throw new Error("Asset or contract not found");
        }

        const chain = await getChain(asset.assetsContract.network);
        const escrowWallet = await getEscrowWalletWithPrivateKey(
            input.createdBy!
        );

        if (!escrowWallet.success || !escrowWallet.data) {
            throw new Error("Failed to get escrow wallet");
        }

        const walletClient = createWalletClient({
            account: privateKeyToAccount(
                escrowWallet.data.privateKey as `0x${string}`
            ),
            chain,
            transport: http(),
        });

        const contract = getContract({
            address: asset.assetsContractAddress as `0x${string}`,
            abi,
            client: walletClient,
        });

        const tx = await contract.write.addAssetFunction([
            asset.assetId!,
            input.selector as `0x${string}`,
            input.functionAbi,
        ]);

        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });
        await publicClient.waitForTransactionReceipt({ hash: tx });

        const currentAbis = (asset.abis as Record<string, any>) || {};
        const updatedAsset = await prisma.asset.update({
            where: { id: input.assetId },
            data: {
                selectors: [...asset.selectors, input.selector],
                abis: {
                    ...currentAbis,
                    [input.selector]: input.functionAbi,
                },
            },
        });

        revalidatePath("/admin/assets");
        return updatedAsset;
    } catch (error) {
        console.error("Failed to add asset function:", error);
        throw new Error("Failed to add asset function");
    }
}

export interface ExecuteAssetFunctionInput {
    assetId: string;
    selector: string;
    data: `0x${string}`;
    gasLimit: bigint;
    executedBy?: string;
}

export interface ExecuteAssetFunctionResult {
    success: boolean;
    result?: `0x${string}`;
    error?: string;
}

export async function executeAssetFunction(
    input: ExecuteAssetFunctionInput
): Promise<ExecuteAssetFunctionResult> {
    try {
        const asset = await prisma.asset.findUnique({
            where: { id: input.assetId },
            include: { assetsContract: { include: { network: true } } },
        });

        if (!asset || !asset.assetsContract) {
            throw new Error("Asset or contract not found");
        }

        const chain = await getChain(asset.assetsContract.network);
        const escrowWallet = await getEscrowWalletWithPrivateKey(
            input.executedBy!
        );

        if (!escrowWallet.success || !escrowWallet.data) {
            throw new Error("Failed to get escrow wallet");
        }

        const walletClient = createWalletClient({
            account: privateKeyToAccount(
                escrowWallet.data.privateKey as `0x${string}`
            ),
            chain,
            transport: http(),
        });

        const contract = getContract({
            address: asset.assetsContractAddress as `0x${string}`,
            abi,
            client: walletClient,
        });

        const tx = await contract.write.executeAssetFunction([
            asset.assetId!,
            input.selector as `0x${string}`,
            input.data,
            input.gasLimit,
        ]);

        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });
        const receipt = await publicClient.waitForTransactionReceipt({
            hash: tx,
        });

        // Log transaction in database
        await prisma.assetTransaction.create({
            data: {
                assetId: input.assetId,
                description: `Execute ${asset.name} ${input.selector}`,
                metadata: JSON.stringify({
                    data: input.data,
                    gasLimit: input.gasLimit,
                    result: receipt.status === "success" ? "0x1" : "0x0",
                }),
                success: true,
                transactionHash: tx,
            },
        });

        return {
            success: true,
            result: receipt.status === "success" ? "0x1" : "0x0",
        };
    } catch (error) {
        console.error("Failed to execute asset function:", error);
        return {
            success: false,
            error: "Failed to execute asset function",
        };
    }
}

export interface AirdropAssetInput {
    assetId: string;
    transferSelector: string;
    receivers: `0x${string}`[];
    amounts: bigint[];
    gasLimitPerTransfer: bigint;
    executedBy?: string;
}

export async function airdropAsset(input: AirdropAssetInput): Promise<boolean> {
    try {
        const asset = await prisma.asset.findUnique({
            where: { id: input.assetId },
            include: { assetsContract: { include: { network: true } } },
        });

        if (!asset || !asset.assetsContract) {
            throw new Error("Asset or contract not found");
        }

        const chain = await getChain(asset.assetsContract.network);
        const escrowWallet = await getEscrowWalletWithPrivateKey(
            input.executedBy!
        );

        if (!escrowWallet.success || !escrowWallet.data) {
            throw new Error("Failed to get escrow wallet");
        }

        const walletClient = createWalletClient({
            account: privateKeyToAccount(
                escrowWallet.data.privateKey as `0x${string}`
            ),
            chain,
            transport: http(),
        });

        const contract = getContract({
            address: asset.assetsContractAddress as `0x${string}`,
            abi,
            client: walletClient,
        });

        const tx = await contract.write.airdrop([
            asset.assetId!,
            input.transferSelector as `0x${string}`,
            input.receivers,
            input.amounts,
            input.gasLimitPerTransfer,
        ]);

        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });
        await publicClient.waitForTransactionReceipt({ hash: tx });

        const transactions = [];
        for (let i = 0; i < input.receivers.length; i++) {
            const description = `Airdrop ${asset.name} x${input.amounts[i]} to ${input.receivers[i]}`;
            const metadata = {
                receiver: input.receivers[i],
                amount: input.amounts[i],
            };
            transactions.push({
                assetId: input.assetId,
                description,
                metadata: JSON.stringify(metadata),
                amount: Number(input.amounts[i]),
                receiverAddress: input.receivers[i],
                transactionHash: tx,
                success: true,
            });
        }
        await prisma.assetTransaction.createMany({
            data: transactions,
        });

        return true;
    } catch (error) {
        console.error("Failed to airdrop asset:", error);
        return false;
    }
}

export interface AssetStatusChangeEvent {
    assetId: string;
    previousStatus: {
        isActive: boolean;
        assetType: AssetType;
    };
    newStatus: {
        isActive: boolean;
        assetType: AssetType;
    };
    reason?: string;
}

export async function handleAssetStatusChange(
    event: AssetStatusChangeEvent
): Promise<PlayerAssetResult<void>> {
    return updatePlayerAssetsOnAssetChange(event);
}
