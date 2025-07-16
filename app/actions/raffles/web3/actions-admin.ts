/// app/actions/raffles/web3/actions-admin.ts

"use server";

import type { Address } from "viem";
import { getContract } from "viem";
import type { OnchainRaffleContract } from "@prisma/client";

import { prisma } from "@/lib/prisma/client";
import { deployContract } from "@/app/actions/blockchain";
import { fetchWalletClient, fetchPublicClient } from "@/app/story/client";

import rafflesJson from "@/web3/artifacts/contracts/Raffles.sol/Raffles.json";

const abi = rafflesJson.abi;
const bytecode = rafflesJson.bytecode as `0x${string}`;

export interface DeployRafflesContractInput {
    networkId: string;
    walletAddress: string;
    contractName?: string;
}

export interface DeployRafflesContractResult {
    success: boolean;
    data?: OnchainRaffleContract;
    error?: string;
}

/**
 * Raffles 컨트랙트 배포
 */
export async function deployRafflesContract(
    input: DeployRafflesContractInput
): Promise<DeployRafflesContractResult> {
    try {
        // 네트워크 조회
        const network = await prisma.blockchainNetwork.findUnique({
            where: { id: input.networkId },
        });
        if (!network) {
            return {
                success: false,
                error: "Network not found",
            };
        }

        // 에스크로 지갑 조회
        const escrowWallet = await prisma.escrowWallet.findUnique({
            where: { address: input.walletAddress },
        });
        if (!escrowWallet) {
            return {
                success: false,
                error: "Escrow wallet not found",
            };
        }

        // 컨트랙트 배포 (constructor에 매개변수 없음)
        const { hash, contractAddress } = await deployContract({
            walletId: escrowWallet.id,
            network,
            abi,
            bytecode,
            args: [], // Raffles 컨트랙트는 constructor 매개변수 없음
        });

        // 배포 블록 번호 조회
        const publicClient = await fetchPublicClient({
            network,
        });

        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
        });

        // 컨트랙트 초기화 (owner 설정)
        const walletClient = await fetchWalletClient({
            networkId: input.networkId,
            walletAddress: input.walletAddress,
        });

        const rafflesContract = getContract({
            address: contractAddress as Address,
            abi,
            client: walletClient,
        });

        try {
            const addAdminTx = await (rafflesContract.write as any).addAdmin([
                input.walletAddress as Address,
            ]);
            await publicClient.waitForTransactionReceipt({ hash: addAdminTx });
        } catch (error) {
            console.warn(
                "Admin setup optional, continuing with deployment",
                error
            );
        }

        // DB에 저장
        const deployedContract = await prisma.onchainRaffleContract.create({
            data: {
                address: contractAddress,
                txHash: hash,
                deployedBy: input.walletAddress,
                blockNumber: Number(receipt.blockNumber),
                networkId: input.networkId,
                isActive: true,
            },
        });

        return {
            success: true,
            data: deployedContract,
        };
    } catch (error) {
        console.error("Error deploying Raffles contract:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to deploy Raffles contract",
        };
    }
}

export interface GetRafflesContractsInput {
    networkId?: string;
    isActive?: boolean;
}

export interface GetRafflesContractsResult {
    success: boolean;
    data?: OnchainRaffleContract[];
    error?: string;
}

/**
 * 배포된 Raffles 컨트랙트 목록 조회
 */
export async function getRafflesContracts(
    input: GetRafflesContractsInput = {}
): Promise<GetRafflesContractsResult> {
    try {
        const contracts = await prisma.onchainRaffleContract.findMany({
            where: {
                ...(input.networkId && { networkId: input.networkId }),
                ...(input.isActive !== undefined && {
                    isActive: input.isActive,
                }),
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return {
            success: true,
            data: contracts,
        };
    } catch (error) {
        console.error("Error fetching Raffles contracts:", error);
        return {
            success: false,
            error: "Failed to fetch Raffles contracts",
        };
    }
}

export interface UpdateRafflesContractInput {
    id: string;
    isActive?: boolean;
}

export interface UpdateRafflesContractResult {
    success: boolean;
    data?: {
        id: string;
        address: string;
        isActive: boolean;
    };
    error?: string;
}

/**
 * Raffles 컨트랙트 상태 업데이트
 */
export async function updateRafflesContract(
    input: UpdateRafflesContractInput
): Promise<UpdateRafflesContractResult> {
    try {
        const updatedContract = await prisma.onchainRaffleContract.update({
            where: { id: input.id },
            data: {
                ...(input.isActive !== undefined && {
                    isActive: input.isActive,
                }),
                updatedAt: new Date(),
            },
            select: {
                id: true,
                address: true,
                isActive: true,
            },
        });

        return {
            success: true,
            data: updatedContract,
        };
    } catch (error) {
        console.error("Error updating Raffles contract:", error);
        return {
            success: false,
            error: "Failed to update Raffles contract",
        };
    }
}
