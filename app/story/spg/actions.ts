/// app/story/spg/actions.ts

"use server";

import { decodeEventLog } from "viem";

import { prisma } from "@/lib/prisma/client";
import SPGNFTFactory from "@/web3/artifacts/contracts/SPGNFTFactory.sol/SPGNFTFactory.json";

import { fetchPublicClient, fetchWalletClient } from "../client";
import { fetchURI } from "../metadata/actions";

import type {
    Story_spg,
    ipfs,
    Artist,
    Prisma,
    Story_spgContract,
} from "@prisma/client";
import type { Hex } from "viem";

export interface deploySPGNFTFactoryInput {
    userId: string;
    networkId: string;
    walletAddress: string;
}

export async function deploySPGNFTFactory(
    input: deploySPGNFTFactoryInput
): Promise<Story_spgContract> {
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

        // Deploy contract
        const hash = await walletClient.deployContract({
            abi: SPGNFTFactory.abi,
            bytecode: SPGNFTFactory.bytecode as Hex,
            args: [],
            account: walletClient.account,
            chain: walletClient.chain,
        });

        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
            confirmations: 1,
        });

        if (!receipt.contractAddress) {
            throw new Error("Contract address not found");
        }

        const spgContract = await prisma.story_spgContract.create({
            data: {
                address: receipt.contractAddress,
                txHash: hash,
                networkId: input.networkId,
            },
        });

        return spgContract;
    } catch (error) {
        console.error("Error deploying factory contract:", error);
        throw error;
    }
}

export interface getSPGContractsInput {
    networkId: string;
}

export async function getSPGContracts(
    input?: getSPGContractsInput
): Promise<Story_spgContract[]> {
    if (!input) {
        return await prisma.story_spgContract.findMany();
    }

    const spgContracts = await prisma.story_spgContract.findMany({
        where: {
            networkId: input.networkId,
        },
    });

    return spgContracts;
}

export interface createSPGInput {
    userId: string;
    networkId: string;
    walletAddress: string;
    contractAddress: string;
    name: string;
    symbol: string;
    selectedMetadata: ipfs;
    artistId: string;
    baseURI?: string;
    tbaRegistry: string;
    tbaImplementation: string;
}

export async function createSPG(
    input: createSPGInput
): Promise<Story_spg & { txHash: string }> {
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

        const { request } = await publicClient.simulateContract({
            address: input.contractAddress as Hex,
            abi: SPGNFTFactory.abi,
            functionName: "deployStoryCollection",
            args: [
                input.name,
                input.symbol,
                input.baseURI || input.selectedMetadata.url,
                input.selectedMetadata.url,
                input.walletAddress,
                input.tbaRegistry,
                input.tbaImplementation,
            ],
            account: walletClient.account,
            chain: walletClient.chain,
        });

        const hash = await walletClient.writeContract(request);

        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
            confirmations: 1,
        });

        // Event에서 collection address 추출
        const deployedEvent = receipt.logs.find((log) => {
            try {
                const decoded = decodeEventLog({
                    abi: SPGNFTFactory.abi,
                    data: log.data,
                    topics: log.topics,
                });
                return decoded.eventName === "CollectionDeployed";
            } catch {
                return false;
            }
        });

        if (!deployedEvent) {
            throw new Error("CollectionDeployed event not found");
        }

        const decodedEvent = decodeEventLog({
            abi: SPGNFTFactory.abi,
            data: deployedEvent.data,
            topics: deployedEvent.topics,
        });

        const collectionAddress = (decodedEvent.args as any).collection;
        if (!collectionAddress) {
            throw new Error("Collection address not found in event");
        }

        const metadata = await fetchURI({ uri: input.selectedMetadata.url });

        const spg = await prisma.story_spg.create({
            data: {
                address: collectionAddress,
                contractAddress: input.contractAddress,
                baseURI: input.baseURI || "",
                contractURI: input.selectedMetadata.url,
                imageUrl: metadata?.image || "",
                metadata: metadata,
                name: input.name,
                symbol: input.symbol,
                networkId: input.networkId,
                ownerAddress: input.walletAddress,
                artistId: input.artistId,
                tbaRegistryAddress: input.tbaRegistry,
                tbaImplementationAddress: input.tbaImplementation,
            },
        });

        return {
            ...spg,
            txHash: hash,
        };
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export type SPG = Story_spg & {
    artist: Artist | null;
};

export interface getSPGInput {
    id?: string;
    address?: string;
    name?: string;
    symbol?: string;
}

export async function getSPG(input?: getSPGInput): Promise<SPG | null> {
    try {
        if (
            !input ||
            (!input.id && !input.address && !input.name && !input.symbol)
        ) {
            return null;
        }

        if (input.id) {
            return await prisma.story_spg.findUnique({
                where: {
                    id: input.id,
                },
                include: {
                    artist: true,
                },
            });
        }

        if (input.address) {
            return await prisma.story_spg.findUnique({
                where: {
                    address: input.address,
                },
                include: {
                    artist: true,
                },
            });
        }

        if (input.name) {
            return await prisma.story_spg.findUnique({
                where: {
                    name: input.name,
                },
                include: {
                    artist: true,
                },
            });
        }

        if (input.symbol) {
            return await prisma.story_spg.findUnique({
                where: {
                    symbol: input.symbol,
                },
                include: {
                    artist: true,
                },
            });
        }

        return null;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export interface getSPGsInput {
    walletAddress?: string;
    networkId?: string;
    isListed?: boolean;
}

export async function getSPGs(input?: getSPGsInput): Promise<SPG[]> {
    try {
        if (!input || (!input.walletAddress && !input.networkId)) {
            return await prisma.story_spg.findMany({
                include: {
                    artist: true,
                },
            });
        }

        const where: Prisma.Story_spgWhereInput = {};

        if (input.walletAddress) {
            where.ownerAddress = input.walletAddress;
        }

        if (input.networkId) {
            where.networkId = input.networkId;
        }

        if (input.isListed) {
            where.isListed = true;
        }

        return await prisma.story_spg.findMany({
            where,
            include: {
                artist: true,
            },
        });
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export interface updateSPGInput {
    address: string;
    name?: string;
    symbol?: string;
    artistId?: string;
}

export async function updateSPG(input: updateSPGInput): Promise<SPG> {
    try {
        const { address, ...rest } = input;
        await prisma.story_spg.update({
            where: { address: address },
            data: {
                artistId: null,
            },
        });

        const spg = await prisma.story_spg.update({
            where: { address: address },
            data: rest,
            include: {
                artist: true,
            },
        });

        return spg;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export interface deleteSPGInput {
    address: string;
}

export async function deleteSPG(input: deleteSPGInput): Promise<SPG | null> {
    try {
        const spg = await prisma.story_spg.delete({
            where: { address: input.address },
            include: {
                artist: true,
            },
        });

        return spg;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
export interface updateSPGUtils {
    address: string;
    isListed?: boolean;
    reportUrl?: string;
    sharePercentage?: number;
    imageUrl?: string;
    preOrderStart?: string;
    preOrderEnd?: string;
    saleStart?: string;
    saleEnd?: string;
    glowStart?: string;
    glowEnd?: string;
    price?: number;
    circulation?: number;
    pageImages?: string[];
    backgroundColor?: string;
    foregroundColor?: string;
    comingSoon?: boolean;
    hiddenDetails?: boolean;
}

export async function updateSPGUtils(input: updateSPGUtils): Promise<SPG> {
    try {
        const { address, ...rest } = input;
        const spg = await prisma.story_spg.update({
            where: { address: address },
            data: rest,
            include: {
                artist: true,
            },
        });

        return spg;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

// 특정 NFT의 TBA 주소를 계산하는 유틸리티 함수
export interface getTBAAddressForNFTInput {
    spgAddress: string;
    tokenId: number;
}

export async function getTBAAddressForNFT(
    input: getTBAAddressForNFTInput
): Promise<string | null> {
    try {
        const spg = await prisma.story_spg.findUnique({
            where: {
                address: input.spgAddress,
            },
        });

        if (!spg || !spg.tbaRegistryAddress || !spg.tbaImplementationAddress) {
            return null;
        }

        const publicClient = await fetchPublicClient({
            networkId: spg.networkId,
        });

        // ERC6551 Registry의 account 함수 호출
        const tbaAddress = await publicClient.readContract({
            address: spg.tbaRegistryAddress as Hex,
            abi: [
                {
                    inputs: [
                        { name: "implementation", type: "address" },
                        { name: "chainId", type: "uint256" },
                        { name: "tokenContract", type: "address" },
                        { name: "tokenId", type: "uint256" },
                        { name: "salt", type: "uint256" },
                    ],
                    name: "account",
                    outputs: [{ name: "", type: "address" }],
                    type: "function",
                    stateMutability: "view",
                },
            ],
            functionName: "account",
            args: [
                spg.tbaImplementationAddress as Hex,
                BigInt(publicClient.chain?.id || 1),
                spg.address as Hex,
                BigInt(input.tokenId),
                BigInt(0),
            ],
        });

        return tbaAddress as string;
    } catch (error) {
        console.error("Error getting TBA address:", error);
        return null;
    }
}
