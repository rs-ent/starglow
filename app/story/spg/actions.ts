/// app/story/spg/actions.ts

"use server";

import {
    Story_spg,
    ipfs,
    Artist,
    Prisma,
    Story_spgContract,
} from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import DeploySPGNFT from "@/web3/artifacts/contracts/DeploySPGNFT.sol/DeploySPGNFT.json";
import { fetchEscrowWalletPrivateKey } from "../escrowWallet/actions";
import {
    createWalletClient,
    createPublicClient,
    http,
    Hex,
    decodeEventLog,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getChain } from "../network/actions";
import { fetchURI } from "../metadata/actions";

export interface deployCustomSPGContractInput {
    userId: string;
    networkId: string;
    walletAddress: string;
}

export async function deployCustomSPGContract(
    input: deployCustomSPGContractInput
): Promise<Story_spgContract> {
    try {
        const network = await prisma.blockchainNetwork.findUnique({
            where: {
                id: input.networkId,
            },
        });

        if (!network) {
            throw new Error("Network not found");
        }

        const privateKey = await fetchEscrowWalletPrivateKey({
            userId: input.userId,
            address: input.walletAddress,
        });

        if (!privateKey) {
            throw new Error("Private key not found");
        }

        // viem chain 설정
        const chain = await getChain(network);

        // viem account 생성
        const account = privateKeyToAccount(privateKey as Hex);

        // viem wallet client 생성
        const walletClient = createWalletClient({
            account,
            chain,
            transport: http(network.rpcUrl),
        });

        console.log("Deploying DeploySPGNFT factory contract with viem...");

        // Deploy contract
        const hash = await walletClient.deployContract({
            abi: DeploySPGNFT.abi,
            bytecode: DeploySPGNFT.bytecode as Hex,
            args: [], // constructor arguments (없음)
        });

        console.log("Transaction hash:", hash);

        // Public client로 receipt 대기
        const publicClient = createPublicClient({
            chain,
            transport: http(network.rpcUrl),
        });

        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
            confirmations: 1,
        });

        if (!receipt.contractAddress) {
            throw new Error("Contract address not found");
        }

        console.log("Factory deployed at:", receipt.contractAddress);

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
}

export async function createSPG(
    input: createSPGInput
): Promise<Story_spg & { txHash: string }> {
    try {
        const network = await prisma.blockchainNetwork.findUnique({
            where: {
                id: input.networkId,
            },
        });

        if (!network) {
            throw new Error("Network not found");
        }

        const privateKey = await fetchEscrowWalletPrivateKey({
            userId: input.userId,
            address: input.walletAddress,
        });

        if (!privateKey) {
            throw new Error("Private key not found");
        }

        // viem chain 설정
        const chain = await getChain(network);

        // viem account 생성
        const account = privateKeyToAccount(privateKey as Hex);

        // viem wallet client 생성
        const walletClient = createWalletClient({
            account,
            chain,
            transport: http(network.rpcUrl),
        });

        const publicClient = createPublicClient({
            chain,
            transport: http(network.rpcUrl),
        });

        console.log("Deploying SPG collection via factory...");

        // Factory contract에서 deployStoryCollection 호출
        const { request } = await publicClient.simulateContract({
            address: input.contractAddress as Hex,
            abi: DeploySPGNFT.abi,
            functionName: "deployStoryCollection",
            args: [
                input.name,
                input.symbol,
                input.baseURI || input.selectedMetadata.url,
                input.selectedMetadata.url,
                input.walletAddress,
            ],
            account,
        });

        const hash = await walletClient.writeContract(request);
        console.log("Transaction hash:", hash);

        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
            confirmations: 1,
        });

        // Event에서 collection address 추출
        const deployedEvent = receipt.logs.find((log) => {
            try {
                const decoded = decodeEventLog({
                    abi: DeploySPGNFT.abi,
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
            abi: DeploySPGNFT.abi,
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

        let where: Prisma.Story_spgWhereInput = {};

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
