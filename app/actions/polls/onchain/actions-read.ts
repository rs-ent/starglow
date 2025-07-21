/// app/actions/polls/onchain/actions-read.ts

"use server";

import { getContract } from "viem";
import { prisma } from "@/lib/prisma/client";
import { fetchPublicClient } from "@/app/story/client";
import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";

// ✅ Polls contract ABI (generated after compilation)
import pollsJson from "@/web3/artifacts/contracts/Polls.sol/Polls.json";
const abi = pollsJson.abi;

import type { BlockchainNetwork, Poll, Prisma } from "@prisma/client";

export interface GetOnchainPollsInput {
    networkId?: string;
    contractAddress?: string;
    isActive?: "ACTIVE" | "INACTIVE";
    limit?: number;
    offset?: number;
}

export type OnchainPoll = Poll & {
    onchainContract: {
        address: string;
        network: Pick<
            BlockchainNetwork,
            | "id"
            | "name"
            | "chainId"
            | "symbol"
            | "rpcUrl"
            | "explorerUrl"
            | "multicallAddress"
        >;
    } | null;
};

export type PollOption = {
    optionId: string;
    name: string;
    shorten: string;
    description: string;
    imgUrl: string;
    youtubeUrl: string;
};

export type BasicInfo = {
    title: string;
    titleShorten: string;
    description: string;
    category: number;
    imgUrl: string;
    youtubeUrl: string;
    artistId: string;
};

export type TimeInfo = {
    startDate: bigint;
    endDate: bigint;
    answerAnnouncementDate: bigint;
};

export type VisibilityInfo = {
    exposeInScheduleTab: boolean;
    showOnPollPage: boolean;
    showOnStarPage: boolean;
};

export type TokenGatingInfo = {
    needToken: boolean;
    needTokenAddress: string;
};

export type BettingInfo = {
    bettingMode: boolean;
    bettingAssetId: string;
    minimumBet: bigint;
    maximumBet: bigint;
    houseCommissionRate: bigint;
    totalCommissionAmount: bigint;
};

export type ParticipationInfo = {
    allowMultipleVote: boolean;
    participationRewardAssetId: string;
    participationRewardAmount: bigint;
    participationConsumeAssetId: string;
    participationConsumeAmount: bigint;
};

export type RequirementInfo = {
    minimumPoints: bigint;
    minimumSGP: bigint;
    minimumSGT: bigint;
};

export type AnswerInfo = {
    hasAnswer: boolean;
    hasAnswerAnnouncement: boolean;
};

export type StatusInfo = {
    status: number;
    isActive: boolean;
    test: boolean;
    creator: string;
    createdAt: bigint;
    uniqueVoters: bigint;
    totalVotes: bigint;
};

export interface GetOnchainPollsResult {
    success: boolean;
    data?: {
        polls: OnchainPoll[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    error?: string;
}

export async function getOnchainPolls(
    input?: GetOnchainPollsInput
): Promise<GetOnchainPollsResult> {
    if (!input) {
        return {
            success: false,
            error: "Input is required",
        };
    }
    try {
        const {
            networkId,
            contractAddress,
            isActive,
            limit = 10,
            offset = 0,
        } = input;

        const where: Prisma.PollWhereInput = {
            isOnchain: true,
        };

        if (networkId && contractAddress) {
            where.onchainContract = {
                networkId: networkId,
                address: contractAddress,
            };
        } else if (networkId) {
            where.onchainContract = {
                networkId: networkId,
            };
        } else if (contractAddress) {
            where.onchainContract = {
                address: contractAddress,
            };
        }

        if (isActive) {
            where.isActive = isActive === "ACTIVE";
        }

        const [polls, total] = await Promise.all([
            prisma.poll.findMany({
                cacheStrategy: getCacheStrategy("fiveMinutes"),
                where,
                select: {
                    id: true,
                    title: true,
                    description: true,
                    status: true,
                    isActive: true,
                    isOnchain: true,
                    onchainPollId: true,
                    onchainContract: {
                        select: {
                            address: true,
                            network: {
                                select: {
                                    id: true,
                                    name: true,
                                    chainId: true,
                                    symbol: true,
                                    rpcUrl: true,
                                    explorerUrl: true,
                                    multicallAddress: true,
                                },
                            },
                        },
                    },
                    createdAt: true,
                    updatedAt: true,
                },
                skip: offset,
                take: limit,
                orderBy: {
                    createdAt: "desc",
                },
            }),
            prisma.poll.count({
                cacheStrategy: getCacheStrategy("fiveMinutes"),
                where,
            }),
        ]);

        return {
            success: true,
            data: {
                polls: polls as unknown as OnchainPoll[],
                total: total,
                page: offset,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error("Error fetching onchain polls:", error);
        return {
            success: false,
            error: "Failed to fetch onchain polls",
        };
    }
}

export type PollDataKeys =
    | "basicInfo"
    | "timeInfo"
    | "visibilityInfo"
    | "tokenGatingInfo"
    | "bettingInfo"
    | "participationInfo"
    | "requirementInfo"
    | "answerInfo"
    | "statusInfo"
    | "options";

export interface GetPollFromContractInput {
    contractAddress: string;
    pollId: string;
    dataKeys?: PollDataKeys[];
}

export interface ContractPollData {
    pollId: string;
    basicInfo?: BasicInfo;
    timeInfo?: TimeInfo;
    visibilityInfo?: VisibilityInfo;
    tokenGatingInfo?: TokenGatingInfo;
    bettingInfo?: BettingInfo;
    participationInfo?: ParticipationInfo;
    requirementInfo?: RequirementInfo;
    answerInfo?: AnswerInfo;
    statusInfo?: StatusInfo;
    options?: Array<PollOption>;
    requiredQuests?: string[];
    answerOptionIds?: string[];
}

export interface GetPollFromContractResult {
    success: boolean;
    data?: ContractPollData;
    error?: string;
}

export async function getPollFromContract(
    input?: GetPollFromContractInput
): Promise<GetPollFromContractResult> {
    if (!input) {
        return {
            success: false,
            error: "Input is required",
        };
    }

    try {
        const { contractAddress, pollId, dataKeys = ["statusInfo"] } = input;

        const dbPoll = await prisma.poll.findFirst({
            cacheStrategy: getCacheStrategy("fiveMinutes"),
            where: {
                isOnchain: true,
                onchainPollId: pollId,
                onchainContract: {
                    address: contractAddress,
                },
            },
            select: {
                onchainContract: {
                    select: {
                        address: true,
                        network: {
                            select: {
                                id: true,
                                name: true,
                                chainId: true,
                                symbol: true,
                                rpcUrl: true,
                                explorerUrl: true,
                                multicallAddress: true,
                            },
                        },
                    },
                },
            },
        });

        if (!dbPoll || !dbPoll.onchainContract) {
            return {
                success: false,
                error: "Poll contract not found in database",
            };
        }

        const publicClient = await fetchPublicClient({
            network: dbPoll.onchainContract.network,
        });

        const contract = getContract({
            address: contractAddress as `0x${string}`,
            abi,
            client: publicClient,
        });

        const result: ContractPollData = { pollId };

        if (dataKeys.includes("statusInfo")) {
            const fullPollForStatus = (await contract.read.getPoll([
                BigInt(pollId),
            ])) as {
                status: StatusInfo;
            };

            result.statusInfo = {
                status: Number(fullPollForStatus.status.status),
                isActive: fullPollForStatus.status.isActive,
                test: fullPollForStatus.status.test,
                creator: fullPollForStatus.status.creator,
                createdAt: fullPollForStatus.status.createdAt,
                uniqueVoters: fullPollForStatus.status.uniqueVoters,
                totalVotes: fullPollForStatus.status.totalVotes,
            };
        }

        if (
            dataKeys.some((key) =>
                [
                    "basicInfo",
                    "timeInfo",
                    "visibilityInfo",
                    "tokenGatingInfo",
                    "bettingInfo",
                    "participationInfo",
                    "requirementInfo",
                    "answerInfo",
                    "options",
                ].includes(key)
            )
        ) {
            const fullPollData = (await contract.read.getPoll([
                BigInt(pollId),
            ])) as {
                poll: {
                    basic: BasicInfo;
                    time: TimeInfo;
                    visibility: VisibilityInfo;
                    tokenGating: TokenGatingInfo;
                    betting: BettingInfo;
                    participation: ParticipationInfo;
                    requirements: RequirementInfo;
                    answer: AnswerInfo;
                    status: StatusInfo;
                };
                options: Array<PollOption>;
                requiredQuests: string[];
                answerOptionIds: string[];
            };

            if (dataKeys.includes("basicInfo")) {
                result.basicInfo = {
                    title: fullPollData.poll.basic.title,
                    titleShorten: fullPollData.poll.basic.titleShorten,
                    description: fullPollData.poll.basic.description,
                    category: Number(fullPollData.poll.basic.category),
                    imgUrl: fullPollData.poll.basic.imgUrl,
                    youtubeUrl: fullPollData.poll.basic.youtubeUrl,
                    artistId: fullPollData.poll.basic.artistId,
                };
            }
            if (dataKeys.includes("timeInfo")) {
                result.timeInfo = fullPollData.poll.time;
            }
            if (dataKeys.includes("visibilityInfo")) {
                result.visibilityInfo = fullPollData.poll.visibility;
            }
            if (dataKeys.includes("tokenGatingInfo")) {
                result.tokenGatingInfo = fullPollData.poll.tokenGating;
            }
            if (dataKeys.includes("bettingInfo")) {
                result.bettingInfo = fullPollData.poll.betting;
            }
            if (dataKeys.includes("participationInfo")) {
                result.participationInfo = fullPollData.poll.participation;
            }
            if (dataKeys.includes("requirementInfo")) {
                result.requirementInfo = fullPollData.poll.requirements;
            }
            if (dataKeys.includes("answerInfo")) {
                result.answerInfo = fullPollData.poll.answer;
            }
            if (dataKeys.includes("options")) {
                result.options = fullPollData.options.map(
                    (option: PollOption) => ({
                        optionId: option.optionId,
                        name: option.name,
                        shorten: option.shorten,
                        description: option.description,
                        imgUrl: option.imgUrl,
                        youtubeUrl: option.youtubeUrl,
                    })
                );
                result.requiredQuests = fullPollData.requiredQuests;
                result.answerOptionIds = fullPollData.answerOptionIds;
            }

            if (dataKeys.includes("statusInfo") && !result.statusInfo) {
                result.statusInfo = {
                    status: Number(fullPollData.poll.status.status),
                    isActive: fullPollData.poll.status.isActive,
                    test: fullPollData.poll.status.test,
                    creator: fullPollData.poll.status.creator,
                    createdAt: fullPollData.poll.status.createdAt,
                    uniqueVoters: fullPollData.poll.status.uniqueVoters,
                    totalVotes: fullPollData.poll.status.totalVotes,
                };
            }
        }

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        console.error("Error fetching poll from contract:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch poll from contract",
        };
    }
}

export interface GetCurrentPollIdInput {
    contractAddress: string;
}

export interface GetCurrentPollIdResult {
    success: boolean;
    data?: {
        currentPollId: string;
    };
    error?: string;
}

export async function getCurrentPollId(
    input?: GetCurrentPollIdInput
): Promise<GetCurrentPollIdResult> {
    if (!input) {
        return {
            success: false,
            error: "Input is required",
        };
    }

    try {
        const { contractAddress } = input;

        const dbPoll = await prisma.poll.findFirst({
            cacheStrategy: getCacheStrategy("fiveMinutes"),
            where: {
                isOnchain: true,
                onchainContract: {
                    address: contractAddress,
                },
            },
            select: {
                onchainContract: {
                    select: {
                        network: {
                            select: {
                                id: true,
                                name: true,
                                chainId: true,
                                symbol: true,
                                rpcUrl: true,
                                explorerUrl: true,
                                multicallAddress: true,
                            },
                        },
                    },
                },
            },
        });

        if (!dbPoll || !dbPoll.onchainContract) {
            return {
                success: false,
                error: "Poll contract not found in database",
            };
        }

        const publicClient = await fetchPublicClient({
            network: dbPoll.onchainContract.network,
        });

        const contract = getContract({
            address: contractAddress as `0x${string}`,
            abi,
            client: publicClient,
        });

        const currentPollId =
            (await contract.read.getCurrentPollId()) as bigint;

        return {
            success: true,
            data: {
                currentPollId: currentPollId.toString(),
            },
        };
    } catch (error) {
        console.error("Error fetching current poll ID:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch current poll ID",
        };
    }
}

export interface IsPollActiveInput {
    contractAddress: string;
    pollId: string;
}

export interface IsPollActiveResult {
    success: boolean;
    data?: {
        isActive: boolean;
    };
    error?: string;
}

export async function isPollActive(
    input?: IsPollActiveInput
): Promise<IsPollActiveResult> {
    if (!input) {
        return {
            success: false,
            error: "Input is required",
        };
    }

    try {
        const { contractAddress, pollId } = input;

        const dbPoll = await prisma.poll.findFirst({
            cacheStrategy: getCacheStrategy("fiveMinutes"),
            where: {
                isOnchain: true,
                onchainContract: {
                    address: contractAddress,
                },
            },
            select: {
                onchainContract: {
                    select: {
                        network: {
                            select: {
                                id: true,
                                name: true,
                                chainId: true,
                                symbol: true,
                                rpcUrl: true,
                                explorerUrl: true,
                                multicallAddress: true,
                            },
                        },
                    },
                },
            },
        });

        if (!dbPoll || !dbPoll.onchainContract) {
            return {
                success: false,
                error: "Poll contract not found in database",
            };
        }

        const publicClient = await fetchPublicClient({
            network: dbPoll.onchainContract.network,
        });

        const contract = getContract({
            address: contractAddress as `0x${string}`,
            abi,
            client: publicClient,
        });

        const isActive = (await contract.read.isPollActive([
            BigInt(pollId),
        ])) as boolean;

        return {
            success: true,
            data: {
                isActive,
            },
        };
    } catch (error) {
        console.error("Error checking if poll is active:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to check if poll is active",
        };
    }
}

export interface GetPollResultInput {
    contractAddress: string;
    pollId: string;
}

export interface PollOptionResult {
    optionId: string;
    name: string;
    voteCount: bigint;
    voteRate: bigint;
    actualVoteCount: bigint;
    bettingAmount: bigint;
    bettingRate: bigint;
}

export interface ContractPollResult {
    pollId: string;
    totalVotes: bigint;
    uniqueVoters: bigint;
    totalBettingAmount: bigint;
    results: PollOptionResult[];
}

export interface GetPollResultResult {
    success: boolean;
    data?: ContractPollResult;
    error?: string;
}

export async function getPollResult(
    input?: GetPollResultInput
): Promise<GetPollResultResult> {
    if (!input) {
        return {
            success: false,
            error: "Input is required",
        };
    }

    try {
        const { contractAddress, pollId } = input;

        const dbPoll = await prisma.poll.findFirst({
            cacheStrategy: getCacheStrategy("fiveMinutes"),
            where: {
                isOnchain: true,
                onchainPollId: pollId,
                onchainContract: {
                    address: contractAddress,
                },
            },
            select: {
                onchainContract: {
                    select: {
                        network: {
                            select: {
                                id: true,
                                name: true,
                                chainId: true,
                                symbol: true,
                                rpcUrl: true,
                                explorerUrl: true,
                                multicallAddress: true,
                            },
                        },
                    },
                },
            },
        });

        if (!dbPoll || !dbPoll.onchainContract) {
            return {
                success: false,
                error: "Poll contract not found in database",
            };
        }

        const publicClient = await fetchPublicClient({
            network: dbPoll.onchainContract.network,
        });

        const contract = getContract({
            address: contractAddress as `0x${string}`,
            abi,
            client: publicClient,
        });

        const pollResult = (await contract.read.getPollResult([
            BigInt(pollId),
        ])) as {
            pollId: bigint;
            totalVotes: bigint;
            uniqueVoters: bigint;
            totalBettingAmount: bigint;
            results: Array<{
                optionId: string;
                name: string;
                voteCount: bigint;
                voteRate: bigint;
                actualVoteCount: bigint;
                bettingAmount: bigint;
                bettingRate: bigint;
            }>;
        };

        const result: ContractPollResult = {
            pollId: pollResult.pollId.toString(),
            totalVotes: pollResult.totalVotes,
            uniqueVoters: pollResult.uniqueVoters,
            totalBettingAmount: pollResult.totalBettingAmount,
            results: pollResult.results.map((option) => ({
                optionId: option.optionId,
                name: option.name,
                voteCount: option.voteCount,
                voteRate: option.voteRate,
                actualVoteCount: option.actualVoteCount,
                bettingAmount: option.bettingAmount,
                bettingRate: option.bettingRate,
            })),
        };

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        console.error("Error fetching poll result from contract:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch poll result from contract",
        };
    }
}

export interface PollParticipation {
    pollId: string;
    participant: string;
    optionId: string;
    participatedAt: bigint;
    isBetting: boolean;
    bettingAssetId: string;
    bettingAmount: bigint;
}

export interface GetUserParticipationsInput {
    contractAddress: string;
    pollId: string;
    userAddress: string;
}

export interface GetUserParticipationsResult {
    success: boolean;
    data?: PollParticipation[];
    error?: string;
}

export async function getUserParticipations(
    input?: GetUserParticipationsInput
): Promise<GetUserParticipationsResult> {
    if (
        !input ||
        !input.contractAddress ||
        !input.pollId ||
        !input.userAddress
    ) {
        return {
            success: false,
            error: "Missing required parameters: contractAddress, pollId, and userAddress are required",
        };
    }

    try {
        const { contractAddress, pollId, userAddress } = input;

        const network = await prisma.blockchainNetwork.findFirst({
            where: { defaultNetwork: true },
        });

        if (!network) {
            return {
                success: false,
                error: "No default blockchain network found",
            };
        }

        const publicClient = await fetchPublicClient({
            network,
        });

        const contract = getContract({
            address: contractAddress as `0x${string}`,
            abi,
            client: publicClient,
        });

        const participations = (await contract.read.getUserParticipations([
            BigInt(pollId),
            userAddress as `0x${string}`,
        ])) as Array<{
            pollId: bigint;
            participant: string;
            optionId: string;
            participatedAt: bigint;
            isBetting: boolean;
            bettingAssetId: string;
            bettingAmount: bigint;
        }>;

        const result: PollParticipation[] = participations.map((p) => ({
            pollId: p.pollId.toString(),
            participant: p.participant,
            optionId: p.optionId,
            participatedAt: p.participatedAt,
            isBetting: p.isBetting,
            bettingAssetId: p.bettingAssetId,
            bettingAmount: p.bettingAmount,
        }));

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        console.error("Error getting user participations:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch user participations from contract",
        };
    }
}

export interface GetUserParticipationIdsInput {
    contractAddress: string;
    pollId: string;
    userAddress: string;
}

export interface GetUserParticipationIdsResult {
    success: boolean;
    data?: string[];
    error?: string;
}

export async function getUserParticipationIds(
    input?: GetUserParticipationIdsInput
): Promise<GetUserParticipationIdsResult> {
    if (
        !input ||
        !input.contractAddress ||
        !input.pollId ||
        !input.userAddress
    ) {
        return {
            success: false,
            error: "Missing required parameters: contractAddress, pollId, and userAddress are required",
        };
    }

    try {
        const { contractAddress, pollId, userAddress } = input;

        const network = await prisma.blockchainNetwork.findFirst({
            where: { defaultNetwork: true },
        });

        if (!network) {
            return {
                success: false,
                error: "No default blockchain network found",
            };
        }

        const publicClient = await fetchPublicClient({
            network,
        });

        const contract = getContract({
            address: contractAddress as `0x${string}`,
            abi,
            client: publicClient,
        });

        const participationIds = (await contract.read.getUserParticipationIds([
            BigInt(pollId),
            userAddress as `0x${string}`,
        ])) as bigint[];

        const result = participationIds.map((id) => id.toString());

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        console.error("Error getting user participation IDs:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch user participation IDs from contract",
        };
    }
}

export interface GetParticipationByIdInput {
    contractAddress: string;
    participationId: string;
}

export interface GetParticipationByIdResult {
    success: boolean;
    data?: PollParticipation;
    error?: string;
}

export async function getParticipationById(
    input?: GetParticipationByIdInput
): Promise<GetParticipationByIdResult> {
    if (!input || !input.contractAddress || !input.participationId) {
        return {
            success: false,
            error: "Missing required parameters: contractAddress and participationId are required",
        };
    }

    try {
        const { contractAddress, participationId } = input;

        const network = await prisma.blockchainNetwork.findFirst({
            where: { defaultNetwork: true },
        });

        if (!network) {
            return {
                success: false,
                error: "No default blockchain network found",
            };
        }

        const publicClient = await fetchPublicClient({
            network,
        });

        const contract = getContract({
            address: contractAddress as `0x${string}`,
            abi,
            client: publicClient,
        });

        const participation = (await contract.read.getParticipationById([
            BigInt(participationId),
        ])) as {
            pollId: bigint;
            participant: string;
            optionId: string;
            participatedAt: bigint;
            isBetting: boolean;
            bettingAssetId: string;
            bettingAmount: bigint;
        };

        const result: PollParticipation = {
            pollId: participation.pollId.toString(),
            participant: participation.participant,
            optionId: participation.optionId,
            participatedAt: participation.participatedAt,
            isBetting: participation.isBetting,
            bettingAssetId: participation.bettingAssetId,
            bettingAmount: participation.bettingAmount,
        };

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        console.error("Error getting participation by ID:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch participation from contract",
        };
    }
}
