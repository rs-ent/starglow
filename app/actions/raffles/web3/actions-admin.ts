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

// uint256 최대값 (무제한을 나타내는 값)
const MAX_UINT256 = BigInt(
    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
);

// Zero address (빈 주소 대신 사용)
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

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

        // 현재 시간 확인 및 시작일 자동 조정
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const adjustedStartDate = Math.max(
            input.timing.startDate,
            currentTimestamp + 60
        ); // 현재시간보다 최소 60초 후

        if (input.timing.endDate <= adjustedStartDate) {
            return {
                success: false,
                error: "End date must be after start date",
            };
        }

        // 추첨일이 종료일보다 최소 30분(1800초) 늦어야 함 (컨트랙트 MIN_DRAW_DELAY)
        const MIN_DRAW_DELAY = 1800; // 30 minutes in seconds
        if (
            !input.timing.instantDraw &&
            input.timing.drawDate < input.timing.endDate + MIN_DRAW_DELAY
        ) {
            return {
                success: false,
                error: "Draw date must be at least 30 minutes after end date",
            };
        }

        if (input.prizes.length === 0) {
            return {
                success: false,
                error: "At least one prize is required",
            };
        }

        // 상품별 상세 검증
        for (let i = 0; i < input.prizes.length; i++) {
            const prize = input.prizes[i];

            if (!prize.title.trim()) {
                return {
                    success: false,
                    error: `Prize ${i + 1}: Title is required`,
                };
            }

            // NFT 상품인 경우 collection address 필수
            if (
                prize.prizeType === 2 &&
                (!prize.collectionAddress || !prize.collectionAddress.trim())
            ) {
                return {
                    success: false,
                    error: `Prize ${
                        i + 1
                    }: Collection address is required for NFT prizes`,
                };
            }

            // collection address가 있으면 유효한 주소인지 확인
            if (
                prize.collectionAddress &&
                prize.collectionAddress.trim() &&
                !/^0x[a-fA-F0-9]{40}$/.test(prize.collectionAddress)
            ) {
                return {
                    success: false,
                    error: `Prize ${i + 1}: Invalid collection address format`,
                };
            }
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
                startDate: BigInt(adjustedStartDate),
                endDate: BigInt(input.timing.endDate),
                instantDraw: input.timing.instantDraw,
                drawDate: input.timing.instantDraw
                    ? BigInt(input.timing.endDate + 1800) // 즉시 추첨시 종료일보다 30분(1800초) 후로 설정 (MIN_DRAW_DELAY)
                    : BigInt(input.timing.drawDate),
            },
            settings: {
                dynamicWeight: input.settings.dynamicWeight,
                participationLimit:
                    input.settings.participationLimit === -1
                        ? MAX_UINT256
                        : BigInt(input.settings.participationLimit),
                participationLimitPerPlayer:
                    input.settings.participationLimitPerPlayer === -1
                        ? MAX_UINT256
                        : BigInt(input.settings.participationLimitPerPlayer),
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
                collectionAddress:
                    prize.prizeType === 2 && prize.collectionAddress
                        ? (prize.collectionAddress as Address)
                        : ZERO_ADDRESS,
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

export interface GetRafflesInput {
    networkId?: string;
    contractAddress?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
}

export interface GetRafflesResult {
    success: boolean;
    data?: Array<{
        id: string;
        contractAddress: string;
        raffleId: string;
        txHash: string;
        blockNumber: number | null;
        networkId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        network: {
            id: string;
            name: string;
            chainId: number;
        };
    }>;
    total?: number;
    error?: string;
}

/**
 * 배포된 래플 목록 조회
 */
export async function getRaffles(
    input: GetRafflesInput = {}
): Promise<GetRafflesResult> {
    try {
        const where = {
            ...(input.networkId && { networkId: input.networkId }),
            ...(input.contractAddress && {
                contractAddress: input.contractAddress,
            }),
            ...(input.isActive !== undefined && { isActive: input.isActive }),
        };

        const [raffles, total, networks] = await Promise.all([
            prisma.onchainRaffle.findMany({
                where,
                orderBy: {
                    createdAt: "desc",
                },
                ...(input.limit && { take: input.limit }),
                ...(input.offset && { skip: input.offset }),
            }),
            prisma.onchainRaffle.count({ where }),
            prisma.blockchainNetwork.findMany({
                select: {
                    id: true,
                    name: true,
                    chainId: true,
                },
            }),
        ]);

        const networkMap = new Map(networks.map((net) => [net.id, net]));

        const mappedRaffles = raffles.map((raffle) => ({
            id: raffle.id,
            contractAddress: raffle.contractAddress,
            raffleId: raffle.raffleId,
            txHash: raffle.txHash,
            blockNumber: raffle.blockNumber,
            networkId: raffle.networkId,
            isActive: raffle.isActive,
            createdAt: raffle.createdAt,
            updatedAt: raffle.updatedAt,
            network: networkMap.get(raffle.networkId) || {
                id: raffle.networkId,
                name: "Unknown",
                chainId: 0,
            },
        }));

        return {
            success: true,
            data: mappedRaffles,
            total,
        };
    } catch (error) {
        console.error("Error fetching raffles:", error);
        return {
            success: false,
            error: "Failed to fetch raffles",
        };
    }
}

export interface UpdateRaffleInput {
    id: string;
    isActive?: boolean;
}

export interface UpdateRaffleResult {
    success: boolean;
    data?: {
        id: string;
        raffleId: string;
        contractAddress: string;
        isActive: boolean;
    };
    error?: string;
}

/**
 * 래플 상태 업데이트
 */
export async function updateRaffle(
    input: UpdateRaffleInput
): Promise<UpdateRaffleResult> {
    try {
        const updatedRaffle = await prisma.onchainRaffle.update({
            where: { id: input.id },
            data: {
                ...(input.isActive !== undefined && {
                    isActive: input.isActive,
                }),
                updatedAt: new Date(),
            },
            select: {
                id: true,
                raffleId: true,
                contractAddress: true,
                isActive: true,
            },
        });

        return {
            success: true,
            data: updatedRaffle,
        };
    } catch (error) {
        console.error("Error updating raffle:", error);
        return {
            success: false,
            error: "Failed to update raffle",
        };
    }
}

export interface GetRaffleDataForSimulationInput {
    contractAddress: string;
    raffleId: string;
    networkId: string;
}

export interface GetRaffleDataForSimulationResult {
    success: boolean;
    data?: {
        raffleId: string;
        title: string;
        description: string;
        entryFee: number;
        prizes: Array<{
            id: string;
            title: string;
            description: string;
            imageUrl: string;
            order: number;
            quantity: number;
            prizeType: number;
            userValue?: number;
        }>;
        networkName: string;
        contractAddress: string;
    };
    error?: string;
}

/**
 * Smart Contract에서 래플 데이터를 조회하여 시뮬레이션용 데이터로 변환
 */
export async function getRaffleDataForSimulation(
    input: GetRaffleDataForSimulationInput
): Promise<GetRaffleDataForSimulationResult> {
    try {
        // 네트워크 정보 조회
        const network = await prisma.blockchainNetwork.findUnique({
            where: { id: input.networkId },
        });
        if (!network) {
            return {
                success: false,
                error: "Network not found",
            };
        }

        // Public Client 생성
        const publicClient = await fetchPublicClient({ network });

        // 컨트랙트 인스턴스 생성
        const raffleContract = getContract({
            address: input.contractAddress as `0x${string}`,
            abi,
            client: publicClient,
        });

        // Smart Contract에서 래플 정보 가져오기
        const contractRaffle = await (raffleContract.read as any).getRaffle([
            BigInt(input.raffleId),
        ]);

        // 상품 정보 변환
        const prizes = contractRaffle.prizes.map(
            (prize: any, index: number) => ({
                id: `prize_${index}`,
                title: prize.title || `상품 ${index + 1}`,
                description: prize.description || "",
                imageUrl: prize.imageUrl || "",
                order: Number(prize.order),
                quantity: Number(prize.registeredTicketQuantity),
                prizeType: Number(prize.prizeType),
                userValue: 0, // 사용자가 직접 입력해야 하는 값
            })
        );

        // 시뮬레이션 데이터 구성
        const simulationData = {
            raffleId: input.raffleId,
            title: contractRaffle.basicInfo.title || `래플 #${input.raffleId}`,
            description: contractRaffle.basicInfo.description || "",
            entryFee:
                Number(contractRaffle.fee.participationFeeAmount) / 1e18 || 100, // Wei를 BERA로 변환
            prizes,
            networkName: network.name,
            contractAddress: input.contractAddress,
        };

        return {
            success: true,
            data: simulationData,
        };
    } catch (error) {
        console.error("Error getting raffle data for simulation:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to get raffle data",
        };
    }
}
