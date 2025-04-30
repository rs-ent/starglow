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
    startDateBefore?: Date;
    startDateAfter?: Date;
    endDate?: Date;
    endDateBefore?: Date;
    endDateAfter?: Date;
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
        if (
            input?.startDate &&
            !input.startDateBefore &&
            !input.startDateAfter
        ) {
            where.startDate = {
                lte: input.startDate,
            };
        } else if (
            input?.startDateBefore &&
            !input.startDateAfter &&
            !input.startDate
        ) {
            where.startDate = {
                lt: input.startDateBefore,
            };
        } else if (
            input?.startDateAfter &&
            !input.startDateBefore &&
            !input.startDate
        ) {
            where.startDate = {
                gt: input.startDateAfter,
            };
        }

        if (input?.endDate && !input.endDateBefore && !input.endDateAfter) {
            where.endDate = {
                gte: input.endDate,
            };
        } else if (
            input?.endDateBefore &&
            !input.endDateAfter &&
            !input.endDate
        ) {
            where.endDate = {
                lt: input.endDateBefore,
            };
        } else if (
            input?.endDateAfter &&
            !input.endDateBefore &&
            !input.endDate
        ) {
            where.endDate = {
                gt: input.endDateAfter,
            };
        }

        if (input?.exposeInScheduleTab)
            where.exposeInScheduleTab = input.exposeInScheduleTab;
        if (input?.bettingMode) where.bettingMode = input.bettingMode;

        console.log("================");
        console.log("where");
        console.log(where);
        console.log("================");

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

        console.log("================");
        console.log("items");
        console.log(items);
        console.log("================");

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
            console.log("================");
            console.log("no need token gating");
            console.log("================");

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
    tokenGating?: TokenGatingResult;
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
        console.log("================");
        console.log("input");
        console.log(input);
        console.log("================");

        const poll = await prisma.poll.findUnique({
            where: { id: pollId },
        });

        if (!poll) {
            return {
                success: false,
                error: "Poll not found",
            };
        }

        console.log("================");
        console.log("poll");
        console.log(poll);
        console.log("================");

        const result = await prisma.$transaction(async (tx) => {
            console.log("================");
            console.log("transaction");
            console.log("================");

            const player = await tx.player.findUnique({
                where: { userId },
                select: {
                    id: true,
                },
            });

            if (!player) {
                return {
                    success: false,
                    error: "Player not found. Please refresh the page or sign in again.",
                };
            }

            console.log("================");
            console.log("player");
            console.log(player);
            console.log("================");

            const playerId = player.id;

            const now = new Date();
            if (now < poll.startDate) {
                return {
                    success: false,
                    error: `This poll is not active yet. The poll starts at ${poll.startDate.toLocaleString()}.`,
                };
            }

            if (now > poll.endDate) {
                return {
                    success: false,
                    error: `This poll has ended. The poll ended at ${poll.endDate.toLocaleString()}.`,
                };
            }

            if (!poll.options) {
                return {
                    success: false,
                    error: "No options found. Please contact technical support.",
                };
            }

            console.log("================");
            console.log("poll.options");
            console.log(poll.options);
            console.log("================");

            const options = poll.options;
            const validOption = options.find(
                (option: any) => option.optionId === optionId
            );
            if (!validOption) {
                return {
                    success: false,
                    error: "Invalid option. Please try again or contact technical support.",
                };
            }

            console.log("================");
            console.log("validOption");
            console.log(validOption);
            console.log("================");

            if (poll.needToken && poll.needTokenAddress) {
                console.log("================");
                console.log("poll.needToken && poll.needTokenAddress");
                console.log("================");

                if (!input.tokenGating) {
                    return {
                        success: false,
                        error: "Token gating required. Please try again or contact technical support.",
                    };
                }

                if (
                    !input.tokenGating.success ||
                    !input.tokenGating.data?.hasToken
                ) {
                    return {
                        success: false,
                        error: "Token gating failed. Please check your token balance. If the problem persists, please contact technical support.",
                    };
                }
            }

            console.log("================");
            console.log("poll.allowMultipleVote");
            console.log(poll.allowMultipleVote);
            console.log("================");

            const existingLog = await tx.pollLog.findFirst({
                where: {
                    pollId,
                    playerId,
                },
            });

            console.log("================");
            console.log("existingLog");
            console.log(existingLog);
            console.log("================");

            if (!poll.allowMultipleVote && existingLog) {
                return {
                    success: false,
                    error: `You have already voted for this poll at ${existingLog.createdAt.toLocaleString()}.`,
                };
            }

            console.log("================");
            console.log("poll.endDate");
            console.log(poll.endDate);
            console.log("================");

            if (
                poll.endDate &&
                new Date(poll.endDate).getTime() + 1000 * 60 * 30 < Date.now()
            ) {
                return {
                    success: false,
                    error: `This poll has ended. The poll ended at ${poll.endDate.toLocaleString()}.`,
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

            if (!existingLog) {
                await tx.poll.update({
                    where: { id: pollId },
                    data: {
                        uniqueVoters: {
                            increment: 1,
                        },
                        totalVotes: {
                            increment: 1,
                        },
                    },
                });

                console.log("================");
                console.log("poll.uniqueVoters");
                console.log(poll.uniqueVoters);
                console.log("================");

                if (!poll.bettingMode && poll.participationRewards) {
                    console.log("================");
                    console.log("Participation Rewards Granted");
                    console.log("================");

                    const rewardsLog = await tx.rewardsLog.create({
                        data: {
                            playerId,
                            pollId,
                            pollLogId: pollLog.id,
                            amount: poll.participationRewards,
                            reason: "Poll Participation Reward",
                            currency: poll.rewardCurrency,
                        },
                    });

                    console.log("================");
                    console.log("rewardsLog");
                    console.log(rewardsLog);
                    console.log("================");

                    const updatedPlayer = await tx.player.update({
                        where: { id: playerId },
                        data: {
                            [poll.rewardCurrency]: {
                                increment: poll.participationRewards,
                            },
                        },
                    });

                    console.log("================");
                    console.log("updatedPlayer");
                    console.log(updatedPlayer);
                    console.log("================");
                }
            } else {
                await tx.poll.update({
                    where: { id: pollId },
                    data: {
                        totalVotes: {
                            increment: 1,
                        },
                    },
                });

                console.log("================");
                console.log("poll.totalVotes");
                console.log(poll.totalVotes);
                console.log("================");
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
