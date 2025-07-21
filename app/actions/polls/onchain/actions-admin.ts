"use server";

import { getContract, decodeEventLog } from "viem";
import { PollCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import { deployContract } from "@/app/actions/blockchain";
import { fetchWalletClient, fetchPublicClient } from "@/app/story/client";
import type { CreatePollInput, PollOption } from "../../polls";

import pollsJson from "@/web3/artifacts/contracts/Polls.sol/Polls.json";
const abi = pollsJson.abi;
const bytecode = pollsJson.bytecode as `0x${string}`;

export interface OnchainBasicInfo {
    title: string;
    titleShorten: string;
    description: string;
    category: number; // PollCategory enum as number
    imgUrl: string;
    youtubeUrl: string;
    artistId: string;
}

export interface OnchainTimeInfo {
    startDate: bigint;
    endDate: bigint;
    answerAnnouncementDate: bigint;
}

export interface OnchainVisibilityInfo {
    exposeInScheduleTab: boolean;
    showOnPollPage: boolean;
    showOnStarPage: boolean;
}

export interface OnchainTokenGatingInfo {
    needToken: boolean;
    needTokenAddress: string;
}

export interface OnchainBettingInfo {
    bettingMode: boolean;
    bettingAssetId: string;
    minimumBet: bigint;
    maximumBet: bigint;
    houseCommissionRate: bigint;
    totalCommissionAmount: bigint;
    totalBettingAmount: bigint;
}

export interface OnchainParticipationInfo {
    allowMultipleVote: boolean;
    participationRewardAssetId: string;
    participationRewardAmount: bigint;
    participationConsumeAssetId: string;
    participationConsumeAmount: bigint;
}

export interface OnchainAnswerInfo {
    hasAnswer: boolean;
    hasAnswerAnnouncement: boolean;
}

export interface OnchainPollOption {
    optionId: string;
    name: string;
    shorten: string;
    description: string;
    imgUrl: string;
    youtubeUrl: string;
}

export interface OnchainCreatePollParams {
    basic: OnchainBasicInfo;
    time: OnchainTimeInfo;
    visibility: OnchainVisibilityInfo;
    tokenGating: OnchainTokenGatingInfo;
    betting: OnchainBettingInfo;
    participation: OnchainParticipationInfo;
    answer: OnchainAnswerInfo;
    options: OnchainPollOption[];
    requiredQuests: string[];
    answerOptionIds: string[];
    test: boolean;
}

function convertPollCategoryToNumber(category: PollCategory): number {
    switch (category) {
        case PollCategory.PUBLIC:
            return 0;
        case PollCategory.PRIVATE:
            return 1;
        default:
            return 0;
    }
}

function dateToTimestamp(date: Date | undefined): bigint {
    if (!date) {
        return BigInt(Math.floor(Date.now() / 1000)); // 현재 시간으로 기본값
    }
    return BigInt(Math.floor(date.getTime() / 1000));
}

function safeBigInt(value: any): bigint {
    if (value === null || value === undefined || value === "") {
        return BigInt(0);
    }

    if (typeof value === "bigint") {
        return value;
    }

    const numValue = Number(value);
    if (isNaN(numValue)) {
        return BigInt(0);
    }

    return BigInt(Math.floor(numValue));
}

function safeString(value: any): string {
    if (value === null || value === undefined) {
        return "";
    }
    return String(value);
}

function safeBoolean(value: any): boolean {
    if (value === null || value === undefined) {
        return false;
    }
    return Boolean(value);
}

function convertPollOptionsToOnchain(
    options: PollOption[]
): OnchainPollOption[] {
    return options.map((option) => ({
        optionId: safeString(option.optionId),
        name: safeString(option.name),
        shorten: safeString(option.shorten),
        description: safeString(option.description),
        imgUrl: safeString(option.imgUrl),
        youtubeUrl: safeString(option.youtubeUrl),
    }));
}

export async function convertCreatePollInputToOnchain(
    input: CreatePollInput
): Promise<OnchainCreatePollParams> {
    return {
        basic: {
            title: safeString(input.title),
            titleShorten: safeString(input.titleShorten),
            description: safeString(input.description),
            category: convertPollCategoryToNumber(input.category),
            imgUrl: safeString(input.imgUrl),
            youtubeUrl: safeString(input.youtubeUrl),
            artistId: safeString(input.artistId),
        },
        time: {
            startDate: input.startDate
                ? dateToTimestamp(input.startDate)
                : BigInt(Math.floor(Date.now() / 1000)),
            endDate: input.endDate
                ? dateToTimestamp(input.endDate)
                : BigInt(Math.floor(Date.now() / 1000) + 86400), // 24시간 후 기본값
            answerAnnouncementDate: input.answerAnnouncementDate
                ? dateToTimestamp(input.answerAnnouncementDate)
                : BigInt(0),
        },
        visibility: {
            exposeInScheduleTab: safeBoolean(input.exposeInScheduleTab),
            showOnPollPage: safeBoolean(input.showOnPollPage),
            showOnStarPage: safeBoolean(input.showOnStarPage),
        },
        tokenGating: {
            needToken: safeBoolean(input.needToken),
            needTokenAddress: safeString(input.needTokenAddress),
        },
        betting: {
            bettingMode: safeBoolean(input.bettingMode),
            bettingAssetId: safeString(input.bettingAssetId),
            minimumBet: safeBigInt(input.minimumBet),
            maximumBet: safeBigInt(input.maximumBet),
            houseCommissionRate: safeBigInt(
                Math.floor((Number(input.houseCommissionRate) || 0.01) * 10000)
            ), // 0.01 = 100 basis points
            totalCommissionAmount: BigInt(0), // 초기값
            totalBettingAmount: BigInt(0), // 초기값 (누락된 필드 추가!)
        },
        participation: {
            allowMultipleVote: safeBoolean(input.allowMultipleVote),
            participationRewardAssetId: safeString(
                input.participationRewardAssetId
            ),
            participationRewardAmount: safeBigInt(
                input.participationRewardAmount
            ),
            participationConsumeAssetId: safeString(
                input.participationConsumeAssetId
            ),
            participationConsumeAmount: safeBigInt(
                input.participationConsumeAmount
            ),
        },
        answer: {
            hasAnswer: safeBoolean(input.hasAnswer),
            hasAnswerAnnouncement: safeBoolean(input.hasAnswerAnnouncement),
        },
        options:
            input.options && input.options.length > 0
                ? convertPollOptionsToOnchain(input.options)
                : [],
        requiredQuests: Array.isArray(input.requiredQuests)
            ? input.requiredQuests
            : [],
        answerOptionIds: Array.isArray(input.answerOptionIds)
            ? input.answerOptionIds
            : [],
        test: safeBoolean(input.test),
    };
}

export interface CreateOnchainPollResult {
    success: boolean;
    transactionHash?: string;
    pollId?: bigint;
    error?: string;
}

export async function createOnchainPoll(
    input: CreatePollInput
): Promise<CreateOnchainPollResult> {
    try {
        // 1. 오프체인 데이터를 온체인 형태로 변환
        const onchainParams = await convertCreatePollInputToOnchain(input);

        // 2. 스마트 컨트랙트 유효성 검증
        if (!onchainParams.basic.title) {
            return {
                success: false,
                error: "Poll title is required",
            };
        }

        if (onchainParams.options.length === 0) {
            return {
                success: false,
                error: "At least one poll option is required",
            };
        }

        if (onchainParams.time.startDate >= onchainParams.time.endDate) {
            return {
                success: false,
                error: "Start date must be before end date",
            };
        }

        if (onchainParams.betting.bettingMode) {
            if (!onchainParams.betting.bettingAssetId) {
                return {
                    success: false,
                    error: "Betting asset ID is required for betting mode",
                };
            }

            if (onchainParams.betting.minimumBet <= 0) {
                return {
                    success: false,
                    error: "Minimum bet must be greater than 0",
                };
            }

            if (
                onchainParams.betting.maximumBet <
                onchainParams.betting.minimumBet
            ) {
                return {
                    success: false,
                    error: "Maximum bet must be greater than or equal to minimum bet",
                };
            }
        }

        // 실제 스마트 컨트랙트 호출
        if (!input.onchainContractId) {
            return {
                success: false,
                error: "Onchain contract ID is required",
            };
        }

        // 1. 컨트랙트 정보 조회
        const onchainContract = await prisma.onchainPollContract.findUnique({
            where: { id: input.onchainContractId },
            include: {
                network: {
                    select: {
                        id: true,
                        name: true,
                        symbol: true,
                        chainId: true,
                        rpcUrl: true,
                        explorerUrl: true,
                        isActive: true,
                        isTestnet: true,
                        createdAt: true,
                        updatedAt: true,
                        multicallAddress: true,
                        isStoryNetwork: true,
                        defaultNetwork: true,
                    },
                },
            },
        });

        if (!onchainContract) {
            return {
                success: false,
                error: "Onchain contract not found",
            };
        }

        if (!onchainContract.isActive) {
            return {
                success: false,
                error: "Onchain contract is not active",
            };
        }

        // 2. 블록체인 클라이언트 초기화
        const publicClient = await fetchPublicClient({
            network: onchainContract.network,
        });

        const walletClient = await fetchWalletClient({
            networkId: onchainContract.network.id,
            walletAddress: onchainContract.deployedBy as `0x${string}`,
        });

        const contract = getContract({
            address: onchainContract.address as `0x${string}`,
            abi: abi,
            client: walletClient,
        });

        // 3. 스마트 컨트랙트에 폴 생성
        const createPollTx = await (contract.write as any).createPoll([
            onchainParams,
        ]);

        // 4. 트랜잭션 영수증 대기
        const receipt = await publicClient.waitForTransactionReceipt({
            hash: createPollTx,
            timeout: 120000, // 2분 타임아웃
        });

        if (receipt.status !== "success") {
            return {
                success: false,
                error: `Poll creation failed with status: ${receipt.status}`,
            };
        }

        // 5. 생성된 pollId 추출 (이벤트에서)
        let createdPollId: bigint = BigInt(0);

        if (receipt.logs && receipt.logs.length > 0) {
            for (const log of receipt.logs) {
                try {
                    const decoded = decodeEventLog({
                        abi: abi,
                        data: log.data,
                        topics: log.topics,
                        eventName: "PollCreated",
                    }) as any;

                    if (decoded.args.pollId) {
                        createdPollId = decoded.args.pollId;
                        break;
                    }
                } catch (error) {
                    console.warn("Failed to decode PollCreated event:", error);
                    continue;
                }
            }
        }

        if (createdPollId === BigInt(0)) {
            // 이벤트에서 pollId를 찾지 못한 경우, 컨트랙트에서 현재 pollId 조회
            try {
                createdPollId = await (contract.read as any).getCurrentPollId();
            } catch (error) {
                console.error("Failed to retrieve created poll ID:", error);
                return {
                    success: false,
                    error: "Failed to retrieve created poll ID",
                };
            }
        }

        return {
            success: true,
            transactionHash: createPollTx,
            pollId: createdPollId,
        };
    } catch (error) {
        console.error("❌ Error creating onchain poll:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
        };
    }
}

// OnchainPollContract 배포 관련 타입들
export interface DeployPollContractInput {
    networkId: string;
    deployerAddress: string;
    constructorArgs?: {
        name?: string;
        symbol?: string;
        baseURI?: string;
    };
}

export interface DeployPollContractResult {
    success: boolean;
    contractId?: string;
    contractAddress?: string;
    transactionHash?: string;
    blockNumber?: number;
    error?: string;
}

export async function deployOnchainPollContract(
    input: DeployPollContractInput
): Promise<DeployPollContractResult> {
    try {
        const { networkId, deployerAddress } = input;

        // 1. 네트워크 유효성 검증
        const network = await prisma.blockchainNetwork.findUnique({
            where: { id: networkId },
            select: {
                id: true,
                name: true,
                symbol: true,
                chainId: true,
                rpcUrl: true,
                explorerUrl: true,
                isActive: true,
                isTestnet: true,
                createdAt: true,
                updatedAt: true,
                multicallAddress: true,
                isStoryNetwork: true,
                defaultNetwork: true,
            },
        });

        if (!network) {
            return {
                success: false,
                error: `Network not found: ${networkId}`,
            };
        }

        if (!network.isActive) {
            return {
                success: false,
                error: `Network is not active: ${network.name}`,
            };
        }

        // 2. 배포자 주소 검증
        if (!deployerAddress || !deployerAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
            return {
                success: false,
                error: "Invalid deployer address format",
            };
        }

        // 에스크로 지갑 조회
        const escrowWallet = await prisma.escrowWallet.findUnique({
            where: { address: deployerAddress },
        });
        if (!escrowWallet) {
            return {
                success: false,
                error: "Escrow wallet not found",
            };
        }

        const { hash, contractAddress } = await deployContract({
            walletId: escrowWallet.id,
            network,
            abi,
            bytecode,
            args: [], // Polls 컨트랙트는 constructor 매개변수 없음
        });

        // 배포 트랜잭션 영수증 대기
        const publicClient = await fetchPublicClient({ network });
        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
            timeout: 120000, // 2분 타임아웃
        });

        if (receipt.status !== "success") {
            return {
                success: false,
                error: `Contract deployment failed with status: ${receipt.status}`,
            };
        }

        // 4. DB에 컨트랙트 정보 저장
        const onchainContract = await prisma.onchainPollContract.create({
            data: {
                address: contractAddress,
                txHash: hash,
                deployedBy: deployerAddress,
                blockNumber: Number(receipt.blockNumber),
                isActive: true,
                networkId: networkId,
            },
            include: {
                network: {
                    select: {
                        name: true,
                        chainId: true,
                    },
                },
            },
        });

        return {
            success: true,
            contractId: onchainContract.id,
            contractAddress: onchainContract.address,
            transactionHash: onchainContract.txHash,
            blockNumber: onchainContract.blockNumber ?? undefined,
        };
    } catch (error) {
        console.error("❌ Error deploying poll contract:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown deployment error",
        };
    }
}

export async function getOnchainPollContracts(networkId?: string): Promise<{
    success: boolean;
    contracts?: Array<{
        id: string;
        address: string;
        txHash: string;
        deployedBy: string;
        blockNumber: number | null;
        isActive: boolean;
        networkName: string;
        chainId: number;
        createdAt: Date;
        pollsCount: number;
    }>;
    error?: string;
}> {
    try {
        const whereClause = networkId
            ? { networkId, isActive: true }
            : { isActive: true };

        const contracts = await prisma.onchainPollContract.findMany({
            where: whereClause,
            include: {
                network: {
                    select: {
                        name: true,
                        chainId: true,
                    },
                },
                _count: {
                    select: {
                        polls: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const formattedContracts = contracts.map((contract) => ({
            id: contract.id,
            address: contract.address,
            txHash: contract.txHash,
            deployedBy: contract.deployedBy,
            blockNumber: contract.blockNumber,
            isActive: contract.isActive,
            networkName: (contract as any).network.name,
            chainId: (contract as any).network.chainId,
            createdAt: contract.createdAt,
            pollsCount: (contract as any)._count.polls,
        }));

        return {
            success: true,
            contracts: formattedContracts,
        };
    } catch (error) {
        console.error("❌ Error fetching poll contracts:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

export async function updateOnchainPollContractStatus(
    contractId: string,
    isActive: boolean
): Promise<{
    success: boolean;
    contract?: { id: string; address: string; isActive: boolean };
    error?: string;
}> {
    try {
        const contract = await prisma.onchainPollContract.update({
            where: { id: contractId },
            data: { isActive },
            select: {
                id: true,
                address: true,
                isActive: true,
            },
        });

        return {
            success: true,
            contract,
        };
    } catch (error) {
        console.error("❌ Error updating contract status:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

export async function getAvailableNetworks(): Promise<{
    success: boolean;
    networks?: Array<{
        id: string;
        name: string;
        chainId: number;
        isTestnet: boolean;
        isActive: boolean;
        isStoryNetwork: boolean;
        defaultNetwork: boolean;
    }>;
    error?: string;
}> {
    try {
        const networks = await prisma.blockchainNetwork.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                chainId: true,
                isTestnet: true,
                isActive: true,
                isStoryNetwork: true,
                defaultNetwork: true,
            },
            orderBy: [
                { defaultNetwork: "desc" },
                { isTestnet: "asc" },
                { name: "asc" },
            ],
        });

        return {
            success: true,
            networks,
        };
    } catch (error) {
        console.error("❌ Error fetching networks:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
