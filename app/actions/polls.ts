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
    Player,
    Asset,
    Artist,
} from "@prisma/client";
import { tokenGate } from "./blockchain";
import { validatePlayerAsset } from "./playerAssets";
import { updatePlayerAsset } from "./playerAssets";

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
    bettingAssetId?: string;
    minimumBet?: number;
    maximumBet?: number;
    allowMultipleVote?: boolean;
    participationRewardAssetId?: string;
    participationRewardAmount?: number;
    minimumPoints?: number;
    minimumSGP?: number;
    minimumSGT?: number;
    requiredQuests?: string[];
    artistId?: string;
    isActive?: boolean;
}

export async function createPoll(input: CreatePollInput): Promise<Poll> {
    try {
        if (input.bettingMode && input.bettingAssetId) {
            const bettingAsset = await prisma.asset.findUnique({
                where: { id: input.bettingAssetId },
            });

            if (!bettingAsset || !bettingAsset.isActive) {
                throw new Error("Invalid betting asset");
            }
        }

        if (input.participationRewardAssetId) {
            const rewardAsset = await prisma.asset.findUnique({
                where: { id: input.participationRewardAssetId },
            });

            if (!rewardAsset || !rewardAsset.isActive) {
                throw new Error("Invalid reward asset");
            }
        }

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
    bettingAssetId?: string;
    participationRewardAssetId?: string;
    artistId?: string;
    isActive?: boolean;
}

export async function getPolls({
    input,
    pagination,
}: {
    input?: GetPollsInput;
    pagination?: PaginationInput;
}): Promise<{
    items: Poll[];
    totalItems: number;
    totalPages: number;
}> {
    try {
        if (!pagination) {
            pagination = {
                currentPage: 1,
                itemsPerPage: Number.MAX_SAFE_INTEGER,
            };
        }

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

        if (input?.bettingAssetId) where.bettingAssetId = input.bettingAssetId;
        if (input?.participationRewardAssetId)
            where.participationRewardAssetId = input.participationRewardAssetId;

        if (input?.artistId) where.artistId = input.artistId;

        const [items, totalItems] = await Promise.all([
            prisma.poll.findMany({
                where,
                orderBy: {
                    id: "desc",
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
                bettingAsset: true,
                participationRewardAsset: true,
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
    options?: PollOption[];
    imgUrl?: string;
    youtubeUrl?: string;
    startDate?: Date;
    endDate?: Date;
    exposeInScheduleTab?: boolean;
    needToken?: boolean;
    needTokenAddress?: string;
    bettingMode?: boolean;
    bettingAssetId?: string;
    bettingAsset?: Asset | null;
    minimumBet?: number;
    maximumBet?: number;
    allowMultipleVote?: boolean;
    participationRewardAssetId?: string;
    participationRewardAsset?: Asset | null;
    participationRewardAmount?: number;
    minimumPoints?: number;
    minimumSGP?: number;
    minimumSGT?: number;
    requiredQuests?: string[];
    artistId?: string | null;
    artist?: Artist | null;
    isActive?: boolean;
}

export async function updatePoll(input: UpdatePollInput): Promise<Poll> {
    try {
        const { id, ...data } = input;

        if (input.bettingMode && input.bettingAssetId) {
            const bettingAsset = await prisma.asset.findUnique({
                where: { id: input.bettingAssetId },
            });

            if (!bettingAsset || !bettingAsset.isActive) {
                throw new Error("Invalid betting asset");
            }
        }

        if (input.participationRewardAssetId) {
            const rewardAsset = await prisma.asset.findUnique({
                where: { id: input.participationRewardAssetId },
            });

            if (!rewardAsset || !rewardAsset.isActive) {
                throw new Error("Invalid reward asset");
            }
        }

        if (input.artistId) {
            const artist = await prisma.artist.findUnique({
                where: { id: input.artistId },
            });

            if (!artist) {
                throw new Error("Invalid artist");
            }
        }

        const {
            artistId,
            artist,
            bettingAssetId,
            bettingAsset,
            participationRewardAssetId,
            participationRewardAsset,
            options,
            ...rest
        } = data;

        console.log("UPDATE POLL DATA", data);

        const poll = await prisma.poll.update({
            where: { id },
            data: {
                ...rest,
                artistId:
                    artistId === null || artistId === ""
                        ? null
                        : artistId || undefined,
                bettingAssetId:
                    bettingAssetId === null || bettingAssetId === ""
                        ? null
                        : bettingAssetId || undefined,
                participationRewardAssetId:
                    participationRewardAssetId === null ||
                    participationRewardAssetId === ""
                        ? null
                        : participationRewardAssetId || undefined,
                options: options?.map((option) => ({
                    ...option,
                    option: JSON.stringify(option),
                })),
                optionsOrder: options?.map((option) => option.optionId),
            },
        });

        console.log("UPDATED POLL", poll);

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
    poll: Poll;
    player: Player;
    optionId: string;
    amount?: number;
    tokenGating?: TokenGatingResult;
    alreadyVotedAmount?: number;
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
        const { poll, player, optionId } = input;
        const amount = input.amount || 1;

        if (!poll) return { success: false, error: "Poll not found" };
        if (!player)
            return {
                success: false,
                error: "Player not found. Please refresh the page or sign in again.",
            };

        if (!poll.options)
            return {
                success: false,
                error: "No options found. Please contact technical support.",
            };
        const validOption = poll.options.find(
            (option: any) => option.optionId === optionId
        );
        if (!validOption)
            return {
                success: false,
                error: "Invalid option. Please try again or contact technical support.",
            };

        const now = new Date();
        if (now < poll.startDate)
            return {
                success: false,
                error: `This poll is not active yet. The poll starts at ${poll.startDate.toLocaleString()}.`,
            };
        if (
            poll.endDate &&
            new Date(poll.endDate).getTime() + 1000 * 60 * 30 < Date.now()
        ) {
            return {
                success: false,
                error: `This poll has ended. The poll ended at ${poll.endDate.toLocaleString()}.`,
            };
        }

        if (poll.needToken && poll.needTokenAddress) {
            if (!input.tokenGating)
                return {
                    success: false,
                    error: "Token gating required. Please try again or contact technical support.",
                };
            if (
                !input.tokenGating.success ||
                !input.tokenGating.data?.hasToken
            ) {
                return {
                    success: false,
                    error: "Token gating failed. Please check your token balance. If the problem persists, please contact technical support.",
                };
            }

            const remainingTokenCount =
                input.tokenGating.data.tokenCount -
                (amount + (input.alreadyVotedAmount || 0));
            if (remainingTokenCount <= 0) {
                return {
                    success: false,
                    error: "You've used all your tokens for this poll. Please purchase more NFTs to participate in this poll.",
                };
            }
        }

        const existingLogs = await prisma.pollLog.findMany({
            where: { pollId: poll.id, playerId: player.id },
            select: {
                optionId: true,
                createdAt: true,
                record: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const isFirstTimeVote = existingLogs.length === 0;
        if (!poll.allowMultipleVote && !isFirstTimeVote) {
            return {
                success: false,
                error: `You have already voted for this poll at ${existingLogs[0].createdAt.toLocaleString()}.`,
            };
        }

        const targetRecord = existingLogs.find(
            (log) => log.optionId === optionId
        );

        const pollLog = await prisma.pollLog.upsert({
            where: {
                playerId_pollId_optionId: {
                    playerId: player.id,
                    pollId: poll.id,
                    optionId,
                },
            },
            update: {
                amount: { increment: amount },
                record: {
                    ...(targetRecord?.record as Record<string, string>),
                    [now.toString()]: optionId,
                },
            },
            create: {
                pollId: poll.id,
                playerId: player.id,
                optionId,
                option: validOption,
                ipAddress: input.ipAddress || "",
                userAgent: input.userAgent || "",
                rewardAssetId: poll.participationRewardAssetId,
                rewardAmount: poll.participationRewardAmount,
                record: { [now.toString()]: optionId },
                amount: amount,
            },
        });

        if (isFirstTimeVote) {
            if (
                !poll.bettingMode &&
                poll.participationRewardAssetId &&
                poll.participationRewardAmount
            ) {
                const updateResult = await updatePlayerAsset({
                    transaction: {
                        playerId: player.id,
                        assetId: poll.participationRewardAssetId,
                        amount: poll.participationRewardAmount * amount,
                        operation: "ADD",
                        reason: "Poll Participation Reward",
                        pollId: poll.id,
                        pollLogId: pollLog.id,
                    },
                });
                if (!updateResult.success) {
                    return {
                        success: false,
                        error: `Failed to give participation reward: ${updateResult.error}`,
                    };
                }
            }

            await prisma.poll.update({
                where: { id: poll.id },
                data: {
                    uniqueVoters: { increment: 1 },
                    totalVotes: { increment: amount },
                },
            });
        } else {
            await prisma.poll.update({
                where: { id: poll.id },
                data: { totalVotes: { increment: amount } },
            });
        }

        return { success: true, data: pollLog };
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

    const poll = await prisma.poll.findUnique({
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

    const pollLogs = await prisma.pollLog.findMany({
        where: {
            pollId,
        },
        select: {
            optionId: true,
            amount: true,
        },
    });

    const totalVotes = pollLogs.reduce((acc, curr) => {
        return acc + curr.amount;
    }, 0);
    const pollOptions = poll.options as unknown as PollOptionResult[];
    const results: PollOptionResult[] = pollOptions.map((option) => {
        const voteCount = pollLogs.reduce((acc, curr) => {
            if (curr.optionId === option.optionId) {
                return acc + curr.amount;
            }
            return acc;
        }, 0);
        const voteRate = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
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

export interface GetPollLogsInput {
    playerId: string;
}

export async function getPollLogs(
    input?: GetPollLogsInput
): Promise<PollLog[]> {
    if (!input || !input.playerId) {
        return [];
    }

    try {
        return await prisma.pollLog.findMany({
            where: {
                playerId: input.playerId,
            },
        });
    } catch (error) {
        console.error("Error getting poll logs:", error);
        throw new Error("Failed to get poll logs");
    }
}

export interface GetPlayerPollLogsInput {
    playerId?: string;
}

export async function getPlayerPollLogs(
    input?: GetPlayerPollLogsInput
): Promise<PollLog[]> {
    if (!input || !input.playerId) {
        return [];
    }

    try {
        return await prisma.pollLog.findMany({
            where: { playerId: input.playerId },
        });
    } catch (error) {
        console.error("Error getting player poll logs:", error);
        return [];
    }
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
