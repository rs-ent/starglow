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

export interface CreateRaffleInput {
    contractId: string;
    networkId: string;
    walletAddress: string;
    basicInfo: {
        title: string;
        description: string;
        imageUrl: string;
        iconUrl: string;
    };
    timing: {
        startDate: number; // timestamp
        endDate: number; // timestamp
        instantDraw: boolean;
        drawDate: number; // timestamp
    };
    settings: {
        dynamicWeight: boolean;
        participationLimit: number;
        participationLimitPerPlayer: number;
    };
    fee: {
        participationFeeAsset: string;
        participationFeeAssetId: string;
        participationFeeAmount: string; // bigint as string
    };
    prizes: Array<{
        prizeType: 0 | 1 | 2 | 3; // PrizeType enum: EMPTY, ASSET, NFT, TOKEN
        collectionAddress: string;
        registeredTicketQuantity: number;
        order: number;
        rarity: number;
        prizeQuantity: number;
        title: string;
        description: string;
        imageUrl: string;
        iconUrl: string;
        assetId: string;
        tokenIds: number[];
    }>;
}

export interface CreateRaffleResult {
    success: boolean;
    data?: {
        raffleId: string;
        txHash: string;
        blockNumber: number;
    };
    error?: string;
}

/**
 * 새로운 래플 생성
 */
export async function createRaffle(
    input: CreateRaffleInput
): Promise<CreateRaffleResult> {
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

        // 배포된 컨트랙트 조회
        const deployedContract = await prisma.onchainRaffleContract.findUnique({
            where: { id: input.contractId },
        });
        if (!deployedContract || !deployedContract.isActive) {
            return {
                success: false,
                error: "Contract not found or inactive",
            };
        }

        // 입력 데이터 검증
        if (!input.basicInfo.title.trim()) {
            return {
                success: false,
                error: "Title is required",
            };
        }

        if (input.timing.endDate <= input.timing.startDate) {
            return {
                success: false,
                error: "End date must be after start date",
            };
        }

        if (input.timing.startDate < Date.now() / 1000) {
            return {
                success: false,
                error: "Start date cannot be in the past",
            };
        }

        if (input.prizes.length === 0) {
            return {
                success: false,
                error: "At least one prize is required",
            };
        }

        // 컨트랙트 인스턴스 생성
        const walletClient = await fetchWalletClient({
            networkId: input.networkId,
            walletAddress: input.walletAddress,
        });

        const rafflesContract = getContract({
            address: deployedContract.address as Address,
            abi,
            client: walletClient,
        });

        // 컨트랙트 파라미터 구성
        const raffleParams = {
            basicInfo: {
                title: input.basicInfo.title,
                description: input.basicInfo.description,
                imageUrl: input.basicInfo.imageUrl,
                iconUrl: input.basicInfo.iconUrl,
            },
            timing: {
                startDate: BigInt(input.timing.startDate),
                endDate: BigInt(input.timing.endDate),
                instantDraw: input.timing.instantDraw,
                drawDate: BigInt(input.timing.drawDate),
            },
            settings: {
                dynamicWeight: input.settings.dynamicWeight,
                participationLimit: BigInt(input.settings.participationLimit),
                participationLimitPerPlayer: BigInt(
                    input.settings.participationLimitPerPlayer
                ),
            },
            fee: {
                participationFeeAsset: input.fee.participationFeeAsset,
                participationFeeAssetId: input.fee.participationFeeAssetId,
                participationFeeAmount: BigInt(
                    input.fee.participationFeeAmount
                ),
            },
            prizes: input.prizes.map((prize) => ({
                prizeType: prize.prizeType,
                collectionAddress: prize.collectionAddress as Address,
                registeredTicketQuantity: BigInt(
                    prize.registeredTicketQuantity
                ),
                pickedTicketQuantity: BigInt(0),
                order: BigInt(prize.order),
                rarity: BigInt(prize.rarity),
                prizeQuantity: BigInt(prize.prizeQuantity),
                startTicketNumber: BigInt(0), // 컨트랙트에서 자동 계산
                title: prize.title,
                description: prize.description,
                imageUrl: prize.imageUrl,
                iconUrl: prize.iconUrl,
                assetId: prize.assetId,
                tokenIds: prize.tokenIds.map((id) => BigInt(id)),
            })),
        };

        // 래플 생성 트랜잭션 실행
        const createTx = await (rafflesContract.write as any).createRaffle([
            raffleParams,
        ]);

        // 트랜잭션 대기 및 결과 확인
        const publicClient = await fetchPublicClient({
            network,
        });

        const receipt = await publicClient.waitForTransactionReceipt({
            hash: createTx,
        });

        // 래플 ID는 RaffleCreated 이벤트에서 추출
        let raffleId = "0";
        if (receipt.logs && receipt.logs.length > 0) {
            // RaffleCreated 이벤트에서 raffleId 추출
            const raffleCreatedEvent = receipt.logs.find(
                (log) =>
                    log.topics[0] ===
                    "0x0b5745354685a046e72f24602bcf00fa0ee07f0bf511afb5f2d3ab636241e41b" // RaffleCreated event signature
            );
            if (raffleCreatedEvent && raffleCreatedEvent.topics[1]) {
                raffleId = BigInt(raffleCreatedEvent.topics[1]).toString();
            }
        }

        // DB에 OnchainRaffle 레코드 저장 (인덱싱용)
        await prisma.onchainRaffle.create({
            data: {
                contractAddress: deployedContract.address,
                raffleId,
                txHash: createTx,
                blockNumber: Number(receipt.blockNumber),
                networkId: input.networkId,
                isActive: true,
            },
        });

        return {
            success: true,
            data: {
                raffleId,
                txHash: createTx,
                blockNumber: Number(receipt.blockNumber),
            },
        };
    } catch (error) {
        console.error("Error creating raffle:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to create raffle",
        };
    }
}
