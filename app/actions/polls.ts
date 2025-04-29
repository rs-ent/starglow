/// app\actions\polls.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import {
    Poll,
    PollStatus,
    PollCategory,
    PollLog,
    RewardsLog,
    RewardCurrency,
    Prisma,
} from "@prisma/client";
import { tokenGate } from "./blockchain";

export type PaginationInput = {
    currentPage: number;
    itemsPerPage: number;
    totalItems?: number;
    totalPages?: number;
};

export interface PollOption {
    optionId: string;
    name: string;
    shorten?: string;
    description?: string;
    imgUrl?: string;
    youtubeUrl?: string;
}

export interface CreatePollInput {
    id?: string;
    title: string;
    titleShorten?: string;
    description?: string;
    category: PollCategory;
    status: PollStatus;
    options: PollOption[];
    imgUrl?: string;
    youtubeUrl?: string;
    startDate: Date;
    endDate: Date;
    exposeInScheduleTab: boolean;
    needToken: boolean;
    needTokenAddress?: string;
    bettingMode?: boolean;
    minimumBet?: number;
    maximumBet?: number;
    allowMultipleVote?: boolean;
    participationRewards?: number;
    rewardCurrency?: RewardCurrency;
    minimumPoints?: number;
    minimumSGP?: number;
    minimumSGT?: number;
    requiredQuests?: string[];
}

export async function createPoll(input: CreatePollInput): Promise<Poll> {
    try {
        const poll = await prisma.poll.create({
            data: {
                ...input,
                options: input.options.map((option) => ({
                    ...option,
                    option: JSON.stringify(option),
                })),
                optionsOrder: input.options.map((option) => option.optionId),
                status: PollStatus.UPCOMING,
            },
        });

        return poll;
    } catch (error) {
        console.error("Error creating poll:", error);
        throw new Error("Failed to create poll");
    }
}

export interface GetPollsInput {
    id?: string;
    category?: PollCategory;
    status?: PollStatus;
    needToken?: boolean;
    needTokenAddress?: string;
    startDate?: Date;
    endDate?: Date;
    exposeInScheduleTab?: boolean;
    bettingMode?: boolean;
}

export async function getPolls({
    input,
    pagination,
}: {
    input?: GetPollsInput;
    pagination: PaginationInput;
}): Promise<{
    items: Poll[];
    totalItems: number;
    totalPages: number;
}> {
    try {
        const where: Prisma.PollWhereInput = {};

        if (input?.id) where.id = input.id;
        if (input?.category) where.category = input.category;
        if (input?.status) where.status = input.status;
        if (input?.needToken) where.needToken = input.needToken;
        if (input?.needTokenAddress)
            where.needTokenAddress = input.needTokenAddress;
        if (input?.startDate)
            where.startDate = {
                lte: input.startDate,
            };
        if (input?.endDate)
            where.endDate = {
                gte: input.endDate,
            };
        if (input?.exposeInScheduleTab)
            where.exposeInScheduleTab = input.exposeInScheduleTab;
        if (input?.bettingMode) where.bettingMode = input.bettingMode;

        const [items, totalItems] = await Promise.all([
            prisma.poll.findMany({
                where,
                orderBy: {
                    startDate: "desc",
                },
                skip: (pagination.currentPage - 1) * pagination.itemsPerPage,
                take: pagination.itemsPerPage,
            }),
            prisma.poll.count({ where }),
        ]);

        const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);

        return {
            items,
            totalItems,
            totalPages,
        };
    } catch (error) {
        console.error("Error getting polls:", error);
        throw new Error("Failed to get polls");
    }
}

export async function getPoll(id: string): Promise<Poll | null> {
    try {
        const poll = await prisma.poll.findUnique({
            where: { id },
            include: {
                rewardLogs: true,
                pollLogs: true,
            },
        });

        return poll;
    } catch (error) {
        console.error("Error getting poll:", error);
        throw new Error("Failed to get poll");
    }
}

export interface UpdatePollInput {
    id: string;
    title?: string;
    titleShorten?: string;
    description?: string;
    category?: PollCategory;
    status?: PollStatus;
    options?: {
        optionId: string;
        name: string;
        shorten?: string;
        description?: string;
        imgUrl?: string;
        youtubeUrl?: string;
    }[];
    imgUrl?: string;
    youtubeUrl?: string;
    startDate?: Date;
    endDate?: Date;
    exposeInScheduleTab?: boolean;
    needToken?: boolean;
    needTokenAddress?: string;
    bettingMode?: boolean;
    minimumBet?: number;
    maximumBet?: number;
    participationRewards?: number;
    rewardCurrency?: RewardCurrency;
}

export async function updatePoll(input: UpdatePollInput): Promise<Poll> {
    try {
        const { id, ...data } = input;

        const poll = await prisma.poll.update({
            where: { id },
            data: {
                ...data,
                optionsOrder: data.options?.map((option) => option.optionId),
            },
        });

        return poll;
    } catch (error) {
        console.error("Error updating poll:", error);
        throw new Error("Failed to update poll");
    }
}

export async function deletePoll(id: string): Promise<Poll> {
    try {
        const deletedPoll = await prisma.poll.delete({
            where: { id },
        });

        return deletedPoll;
    } catch (error) {
        console.error("Error deleting poll:", error);
        throw new Error("Failed to delete poll");
    }
}

export interface TokenGatingInput {
    pollId: string;
    userId: string;
}

export interface TokenGatingResult {
    success: boolean;
    data?: {
        hasToken: boolean;
        tokenCount: number;
        ownerWallets: string[];
    };
    error?: string;
}

export async function tokenGating(
    input?: TokenGatingInput
): Promise<TokenGatingResult> {
    try {
        const { pollId, userId } = input || {};

        if (!pollId || !userId) {
            return {
                success: true,
                data: {
                    hasToken: false,
                    tokenCount: 0,
                    ownerWallets: [],
                },
            };
        }

        const poll = await prisma.poll.findUnique({
            where: { id: pollId },
            select: {
                needToken: true,
                needTokenAddress: true,
            },
        });

        if (!poll) {
            return {
                success: false,
                error: "Poll not found",
                data: {
                    hasToken: false,
                    tokenCount: 0,
                    ownerWallets: [],
                },
            };
        }

        if (!poll.needToken || !poll.needTokenAddress) {
            return {
                success: true,
                data: {
                    hasToken: true,
                    tokenCount: 0,
                    ownerWallets: [],
                },
            };
        }

        const result = await tokenGate({
            userId,
            tokenType: "Collection",
            tokenAddress: poll.needTokenAddress,
        });

        if (!result.success) {
            return {
                success: false,
                error: result.error,
                data: result.data || {
                    hasToken: false,
                    tokenCount: 0,
                    ownerWallets: [],
                },
            };
        }

        return {
            success: true,
            data: result.data,
            error: result.error,
        };
    } catch (error) {
        console.error("Error in token gating:", error);
        return {
            success: false,
            error: "Failed to check token ownership",
        };
    }
}

export interface ParticipatePollInput {
    pollId: string;
    userId: string;
    optionId: string;
    ipAddress?: string;
    userAgent?: string;
}

export interface ParticipatePollResult {
    success: boolean;
    data?: PollLog;
    error?: string;
}

export async function participatePoll(
    input: ParticipatePollInput
): Promise<ParticipatePollResult> {
    try {
        const { pollId, userId, optionId } = input;

        const result = await prisma.$transaction(async (tx) => {
            const player = await tx.player.findUnique({
                where: { userId },
                select: {
                    id: true,
                },
            });

            if (!player) {
                return {
                    success: false,
                    error: "PLAYER_NOT_FOUND",
                };
            }

            const playerId = player.id;

            const poll = await tx.poll.findUnique({
                where: { id: pollId },
            });

            if (!poll) {
                return {
                    success: false,
                    error: "Poll not found",
                };
            }

            const now = new Date();
            if (now < poll.startDate || now > poll.endDate) {
                return {
                    success: false,
                    error: "NOT_ACTIVE",
                };
            }

            if (!poll.options) {
                return {
                    success: false,
                    error: "NO_OPTIONS",
                };
            }

            const options = poll.options;
            const validOption = options.find(
                (option: any) => option.optionId === optionId
            );
            if (!validOption) {
                return {
                    success: false,
                    error: "INVALID_OPTION",
                };
            }

            if (poll.needToken && poll.needTokenAddress) {
                const gating = await tokenGating({ pollId, userId });
                if (!gating.success) {
                    return {
                        success: false,
                        error: "TOKEN_GATING_FAILED",
                    };
                }
            }

            if (!poll.allowMultipleVote) {
                const existingLog = await prisma.pollLog.findFirst({
                    where: {
                        pollId,
                        playerId,
                    },
                });

                if (existingLog) {
                    return {
                        success: false,
                        error: "ALREADY_VOTED",
                    };
                }
            }

            if (
                poll.endDate &&
                new Date(poll.endDate).getTime() + 1000 * 60 * 30 < Date.now()
            ) {
                return {
                    success: false,
                    error: "POLL_ENDED",
                };
            }

            const record = {
                [now.toString()]: optionId,
            };

            const pollLog = await tx.pollLog.create({
                data: {
                    pollId,
                    playerId,
                    optionId,
                    option: validOption,
                    ipAddress: input.ipAddress || "",
                    userAgent: input.userAgent || "",
                    record,
                },
            });

            if (!poll.bettingMode && poll.participationRewards) {
                await tx.rewardsLog.create({
                    data: {
                        playerId,
                        pollId,
                        pollLogId: pollLog.id,
                        amount: poll.participationRewards,
                        reason: "Poll Participation Reward",
                        currency: poll.rewardCurrency,
                    },
                });

                await tx.player.update({
                    where: { id: playerId },
                    data: {
                        [poll.rewardCurrency]: {
                            increment: poll.participationRewards,
                        },
                    },
                });
            }

            return {
                success: true,
                data: pollLog,
            };
        });

        return result;
    } catch (error) {
        console.error("Error creating poll log:", error);
        throw new Error("Failed to create poll log");
    }
}

export interface GetPollResultInput {
    pollId: string;
}

export interface GetPollResultResponse {
    pollId: string;
    totalVotes: number;
    results: PollOptionResult[];
}

export interface PollOptionResult {
    optionId: string;
    name: string;
    shorten?: string;
    description?: string;
    imgUrl?: string;
    youtubeUrl?: string;
    voteCount: number;
    voteRate: number;
}

export async function getPollResult(
    input?: GetPollResultInput
): Promise<GetPollResultResponse> {
    const { pollId } = input || {};

    if (!pollId) {
        return {
            pollId: "",
            totalVotes: 0,
            results: [],
        };
    }

    const result = await prisma.$transaction(async (tx) => {
        const poll = await tx.poll.findUnique({
            where: { id: pollId },
            select: {
                options: true,
            },
        });

        if (!poll) {
            return {
                pollId,
                totalVotes: 0,
                results: [],
            };
        }

        const pollLogs = await tx.pollLog.findMany({
            where: {
                pollId,
            },
            select: {
                optionId: true,
            },
        });

        const totalVotes = pollLogs.length;
        const pollOptions = poll.options as unknown as PollOptionResult[];
        const results: PollOptionResult[] = pollOptions.map((option) => {
            const voteCount = pollLogs.filter(
                (log) => log.optionId === option.optionId
            ).length;
            const voteRate =
                totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
            return {
                ...option,
                voteCount,
                voteRate,
            };
        });

        return {
            pollId,
            totalVotes,
            results,
        };
    });

    return result;
}

export interface GetPollsResultsInput {
    pollIds: string[];
}

export interface GetPollsResultsResponse {
    results: GetPollResultResponse[];
}

export async function getPollsResults(
    input?: GetPollsResultsInput
): Promise<GetPollsResultsResponse> {
    const { pollIds } = input || {};

    if (!pollIds) {
        return {
            results: [],
        };
    }

    const results = await Promise.all(
        pollIds.map(async (pollId) => {
            const result = await getPollResult({ pollId });
            return result;
        })
    );

    return {
        results,
    };
}

export interface GetUserSelectionInput {
    pollId: string;
    userId: string;
}

export interface GetUserSelectionResponse {
    success: boolean;
    optionIds?: string[];
    error?: string;
}

export async function getUserSelection(
    input?: GetUserSelectionInput
): Promise<GetUserSelectionResponse> {
    const { pollId, userId } = input || {};

    if (!pollId || !userId) {
        return {
            success: false,
            error: "Invalid input",
        };
    }
    const result = await prisma.$transaction(async (tx) => {
        const poll = await tx.poll.findUnique({
            where: { id: pollId },
            select: {
                options: true,
            },
        });

        if (!poll) {
            return {
                success: false,
                error: "Poll not found",
            };
        }

        const player = await tx.player.findUnique({
            where: { userId },
            select: {
                id: true,
            },
        });

        if (!player) {
            return {
                success: false,
                error: "Player not found",
            };
        }

        const pollLogs = await tx.pollLog.findMany({
            where: {
                pollId,
                playerId: player.id,
            },
            select: {
                optionId: true,
            },
        });

        if (pollLogs.length === 0) {
            return {
                success: false,
                error: "No poll logs found",
            };
        }

        const optionIds = pollLogs.map((log) => log.optionId);

        return {
            success: true,
            optionIds,
        };
    });

    return result;
}

export interface UpdateUserSelectionInput {
    pollLogId: string;
    selectedOption: {
        optionId: string;
        name: string;
        shorten?: string;
        description?: string;
        imgUrl?: string;
        youtubeUrl?: string;
    };
}

export interface UpdateUserSelectionResponse {
    success: boolean;
    data?: PollLog;
    error?: string;
}

export async function updateUserSelection(
    input: UpdateUserSelectionInput
): Promise<UpdateUserSelectionResponse> {
    const { pollLogId, selectedOption } = input;

    if (!pollLogId) {
        return {
            success: false,
            error: "INVALID_INPUT",
        };
    }

    const result = await prisma.$transaction(async (tx) => {
        const pollLog = await tx.pollLog.findUnique({
            where: { id: pollLogId },
        });

        if (!pollLog) {
            return {
                success: false,
                error: "LOG_NOT_FOUND",
            };
        }

        const poll = await tx.poll.findUnique({
            where: { id: pollLog.pollId },
            select: {
                endDate: true,
            },
        });

        if (
            poll?.endDate &&
            new Date(poll.endDate).getTime() + 1000 * 60 * 30 < Date.now()
        ) {
            return {
                success: false,
                error: "POLL_ENDED",
            };
        }

        const prevRecord =
            pollLog.record &&
            typeof pollLog.record === "object" &&
            !Array.isArray(pollLog.record)
                ? (pollLog.record as Record<string, string>)
                : {};
        const now = Date.now().toString();
        const record = {
            ...prevRecord,
            [now]: selectedOption.optionId,
        };

        const updatedPollLog = await tx.pollLog.update({
            where: { id: pollLogId },
            data: {
                optionId: selectedOption.optionId,
                option: selectedOption,
                record,
            },
        });

        return {
            success: true,
            data: updatedPollLog,
        };
    });

    return result;
}
