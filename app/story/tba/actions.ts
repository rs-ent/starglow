/// app/story/tba/actions.ts

"use server";

import {
    TBAContract as PrismaTBAContract,
    TBAContractType,
} from "@prisma/client";
import { decodeEventLog } from "viem";


import { prisma } from "@/lib/prisma/client";
import StarglowTBA from "@/web3/artifacts/contracts/StarglowTBA.sol/StarglowTBA.json";

import { fetchPublicClient, fetchWalletClient } from "../client";

import type { Hex} from "viem";


export interface deployTBAImplementationInput {
    userId: string;
    networkId: string;
    walletAddress: string;
}

export interface TBAContract {
    id: string;
    address: string;
    type: TBAContractType;
    name: string | null;
    version: string | null;
    networkId: string;
    txHash: string | null;
    deployedBy: string | null;
    isActive: boolean;
    createdAt: Date;
}

export async function deployTBAImplementation(
    input: deployTBAImplementationInput
): Promise<TBAContract> {
    try {
        const publicClient = await fetchPublicClient({
            networkId: input.networkId,
        });

        const walletClient = await fetchWalletClient({
            networkId: input.networkId,
            walletAddress: input.walletAddress,
        });

        if (!walletClient.account) {
            throw new Error("Wallet account not found");
        }

        console.log("Deploying StarglowTBA implementation...");

        const hash = await walletClient.deployContract({
            abi: StarglowTBA.abi,
            bytecode: StarglowTBA.bytecode as Hex,
            account: walletClient.account,
            chain: walletClient.chain,
        });

        console.log("Transaction hash:", hash);

        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
            confirmations: 1,
        });

        if (!receipt.contractAddress) {
            throw new Error("Contract address not found");
        }

        console.log("TBA Implementation deployed at:", receipt.contractAddress);

        const tbaContract = await prisma.tBAContract.create({
            data: {
                address: receipt.contractAddress,
                type: TBAContractType.IMPLEMENTATION,
                name: "StarglowTBA",
                version: "1.0.0",
                txHash: hash,
                deployedBy: input.walletAddress,
                networkId: input.networkId,
                abi: StarglowTBA.abi as any,
                bytecode: StarglowTBA.bytecode,
                isActive: true,
            },
        });

        return {
            id: tbaContract.id,
            address: tbaContract.address,
            type: tbaContract.type,
            name: tbaContract.name,
            version: tbaContract.version,
            networkId: tbaContract.networkId,
            txHash: tbaContract.txHash,
            deployedBy: tbaContract.deployedBy,
            isActive: tbaContract.isActive,
            createdAt: tbaContract.createdAt,
        };
    } catch (error) {
        console.error("Error deploying TBA implementation:", error);
        throw error;
    }
}

export interface deployTBARegistryInput {
    userId: string;
    networkId: string;
    walletAddress: string;
}

export async function deployTBARegistry(
    input: deployTBARegistryInput
): Promise<TBAContract> {
    try {
        const publicClient = await fetchPublicClient({
            networkId: input.networkId,
        });

        const walletClient = await fetchWalletClient({
            networkId: input.networkId,
            walletAddress: input.walletAddress,
        });

        if (!walletClient.account) {
            throw new Error("Wallet account not found");
        }

        console.log("Deploying ERC6551 Registry...");

        const hash = await walletClient.deployContract({
            abi: StarglowTBA.abi,
            bytecode: StarglowTBA.bytecode as Hex,
            account: walletClient.account,
            chain: walletClient.chain,
        });

        console.log("Transaction hash:", hash);

        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
            confirmations: 1,
        });

        if (!receipt.contractAddress) {
            throw new Error("Contract address not found");
        }

        console.log("TBA Registry deployed at:", receipt.contractAddress);

        const tbaContract = await prisma.tBAContract.create({
            data: {
                address: receipt.contractAddress,
                type: TBAContractType.REGISTRY,
                name: "ERC6551Registry",
                version: "1.0.0",
                txHash: hash,
                deployedBy: input.walletAddress,
                networkId: input.networkId,
                abi: StarglowTBA.abi,
                bytecode: StarglowTBA.bytecode as Hex,
                isActive: true,
            },
        });

        return {
            id: tbaContract.id,
            address: tbaContract.address,
            type: tbaContract.type,
            name: tbaContract.name,
            version: tbaContract.version,
            networkId: tbaContract.networkId,
            txHash: tbaContract.txHash,
            deployedBy: tbaContract.deployedBy,
            isActive: tbaContract.isActive,
            createdAt: tbaContract.createdAt,
        };
    } catch (error) {
        console.error("Error deploying TBA registry:", error);
        throw error;
    }
}

export interface setTBAAddressInput {
    networkId: string;
    address: string;
    type: TBAContractType;
    name?: string;
    version?: string;
}

export async function setTBAAddress(
    input: setTBAAddressInput
): Promise<TBAContract> {
    try {
        const existingActive = await prisma.tBAContract.findFirst({
            where: {
                networkId: input.networkId,
                type: input.type,
                isActive: true,
            },
        });

        if (existingActive) {
            await prisma.tBAContract.update({
                where: { id: existingActive.id },
                data: { isActive: false },
            });
        }

        const tbaContract = await prisma.tBAContract.create({
            data: {
                address: input.address,
                type: input.type,
                name:
                    input.name ||
                    (input.type === TBAContractType.REGISTRY
                        ? "ERC6551Registry"
                        : "StarglowTBA"),
                version: input.version || "1.0.0",
                txHash: null,
                deployedBy: null,
                networkId: input.networkId,
                isActive: true,
            },
        });

        return {
            id: tbaContract.id,
            address: tbaContract.address,
            type: tbaContract.type,
            name: tbaContract.name,
            version: tbaContract.version,
            networkId: tbaContract.networkId,
            txHash: tbaContract.txHash,
            deployedBy: tbaContract.deployedBy,
            isActive: tbaContract.isActive,
            createdAt: tbaContract.createdAt,
        };
    } catch (error) {
        console.error("Error setting TBA address:", error);
        throw error;
    }
}

export interface getTBAAddressesInput {
    networkId: string;
}

export interface TBAAddresses {
    registry: string | null;
    implementation: string | null;
}

export async function getTBAAddresses(
    input: getTBAAddressesInput
): Promise<TBAAddresses> {
    try {
        const contracts = await prisma.tBAContract.findMany({
            where: {
                networkId: input.networkId,
                isActive: true,
            },
        });

        const registry = contracts.find(
            (c) => c.type === TBAContractType.REGISTRY
        );
        const implementation = contracts.find(
            (c) => c.type === TBAContractType.IMPLEMENTATION
        );

        return {
            registry: registry?.address || null,
            implementation: implementation?.address || null,
        };
    } catch (error) {
        console.error("Error getting TBA addresses:", error);
        throw error;
    }
}

export interface getOrDeployTBAInput {
    userId: string;
    networkId: string;
    walletAddress: string;
}

export async function getOrDeployTBA(
    input: getOrDeployTBAInput
): Promise<TBAAddresses> {
    try {
        const addresses = await getTBAAddresses({ networkId: input.networkId });

        if (!addresses.registry) {
            const registry = await deployTBARegistry(input);
            addresses.registry = registry.address;
        }

        if (!addresses.implementation) {
            const implementation = await deployTBAImplementation(input);
            addresses.implementation = implementation.address;
        }

        return addresses;
    } catch (error) {
        console.error("Error getting or deploying TBA:", error);
        throw error;
    }
}

export interface getTBAContractsInput {
    networkId?: string;
    type?: TBAContractType;
    isActive?: boolean;
}

export async function getTBAContracts(
    input?: getTBAContractsInput
): Promise<TBAContract[]> {
    try {
        const where: any = {};

        if (input?.networkId) {
            where.networkId = input.networkId;
        }

        if (input?.type) {
            where.type = input.type;
        }

        if (input?.isActive !== undefined) {
            where.isActive = input.isActive;
        }

        const contracts = await prisma.tBAContract.findMany({
            where,
            orderBy: {
                createdAt: "desc",
            },
        });

        return contracts.map((contract) => ({
            id: contract.id,
            address: contract.address,
            type: contract.type,
            name: contract.name,
            version: contract.version,
            networkId: contract.networkId,
            txHash: contract.txHash,
            deployedBy: contract.deployedBy,
            isActive: contract.isActive,
            createdAt: contract.createdAt,
        }));
    } catch (error) {
        console.error("Error getting TBA contracts:", error);
        throw error;
    }
}
