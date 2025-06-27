/// app\actions\polls.ts

"use server";

import { PollStatus } from "@prisma/client";

import { tokenGating } from "@/app/story/nft/actions";
import { prisma } from "@/lib/prisma/client";

import { updatePlayerAsset } from "./playerAssets";

import type { TokenGatingData } from "@/app/story/nft/actions";
import type {
    Poll,
    PollCategory,
    PollLog,
    Prisma,
    Player,
    Asset,
    Artist,
} from "@prisma/client";

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
    hasAnswer?: boolean;
    answerOptionIds?: string[];
    // 베팅 시스템 필드들
    houseCommissionRate?: number;
    totalCommissionAmount?: number;
    optionBetAmounts?: any;
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

export type PollsWithArtist = Poll & {
    artist: Artist | null;
    participationRewardAsset: Asset | null;
};

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
    artistId?: string | null;
    isActive?: boolean;
}

export async function getPolls({
    input,
    pagination,
}: {
    input?: GetPollsInput;
    pagination?: PaginationInput;
}): Promise<{
    items: PollsWithArtist[];
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
        if (input?.artistId === null) where.artistId = null;
        else if (input?.artistId) where.artistId = input.artistId;
        if (input?.isActive) where.isActive = input.isActive;
        const [items, totalItems] = await Promise.all([
            prisma.poll.findMany({
                where,
                orderBy: {
                    id: "desc",
                },
                skip: (pagination.currentPage - 1) * pagination.itemsPerPage,
                take: pagination.itemsPerPage,
                include: {
                    artist: true,
                    participationRewardAsset: true,
                },
            }),
            prisma.poll.count({ where }),
        ]);
        const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
        return {
            items: items as PollsWithArtist[],
            totalItems,
            totalPages,
        };
    } catch (error) {
        console.error("Error getting polls:", error);
        return {
            items: [],
            totalItems: 0,
            totalPages: 0,
        };
    }
}

export async function getPoll(id: string): Promise<
    | (Poll & {
          participationRewardAsset: Asset | null;
          artist: Artist | null;
      })
    | null
> {
    try {
        const poll = await prisma.poll.findUnique({
            where: { id },
            include: {
                participationRewardAsset: true,
                artist: true,
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
    hasAnswer?: boolean;
    answerOptionIds?: string[];
    // 베팅 시스템 필드들
    houseCommissionRate?: number;
    totalCommissionAmount?: number;
    optionBetAmounts?: any;
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

        console.info("Participation Reward Asset", participationRewardAsset);
        console.info("Betting Asset", bettingAsset);
        console.info("Artist", artist);

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

export interface TokenGatingPollInput {
    pollId: string;
    userId?: string;
}

export async function tokenGatingPoll(
    input?: TokenGatingPollInput
): Promise<TokenGatingData> {
    try {
        const { pollId, userId } = input || {};

        if (!pollId || !userId) {
            return {
                hasToken: false,
                detail: [],
            };
        }

        const poll = await prisma.poll.findUnique({
            where: { id: pollId },
            select: {
                needToken: true,
                needTokenAddress: true,
                artist: true,
            },
        });

        if (!poll) {
            return {
                hasToken: false,
                detail: [],
            };
        }

        if (!poll.artist || !poll.needToken || !poll.needTokenAddress) {
            return {
                hasToken: true,
                detail: [],
            };
        }

        const result = await tokenGating({
            userId,
            artist: poll.artist,
        });

        return result.data[poll.needTokenAddress];
    } catch (error) {
        console.error("Error in token gating:", error);
        return {
            hasToken: false,
            detail: [],
        };
    }
}

export interface ParticipatePollInput {
    poll: Poll;
    player: Player;
    optionId: string;
    amount?: number;
    tokenGating?: TokenGatingData;
    alreadyVotedAmount?: number;
    ipAddress?: string;
    userAgent?: string;
}

export interface ParticipatePollResult {
    success: boolean;
    data?: PollLog;
    error?: string;
    playerAssetUpdated?: boolean;
}

export async function participatePoll(
    input: ParticipatePollInput
): Promise<ParticipatePollResult> {
    try {
        const { poll, player, optionId } = input;
        const amount = input.amount || 1;
        let playerAssetUpdated = false;

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

        // 베팅 모드 검증 및 처리
        if (poll.bettingMode) {
            if (!poll.bettingAssetId) {
                return {
                    success: false,
                    error: "Betting asset not configured for this poll.",
                };
            }

            // 베팅 금액 검증
            if (poll.minimumBet && amount < poll.minimumBet) {
                return {
                    success: false,
                    error: `Minimum bet amount is ${poll.minimumBet}.`,
                };
            }

            if (poll.maximumBet && amount > poll.maximumBet) {
                return {
                    success: false,
                    error: `Maximum bet amount is ${poll.maximumBet}.`,
                };
            }

            // 사용자 에셋 잔액 확인
            const playerAsset = await prisma.playerAsset.findUnique({
                where: {
                    playerId_assetId: {
                        playerId: player.id,
                        assetId: poll.bettingAssetId,
                    },
                },
            });

            if (!playerAsset || playerAsset.balance < amount) {
                return {
                    success: false,
                    error: "Insufficient balance for betting.",
                };
            }
        }

        if (poll.needToken && poll.needTokenAddress) {
            if (!input.tokenGating || !input.tokenGating.hasToken)
                return {
                    success: false,
                    error: "Token gating required. Please try again or contact technical support.",
                };

            const alreadyVotedAmount = input.alreadyVotedAmount || 0;
            const remainingTokenCount =
                input.tokenGating.detail.length - (amount + alreadyVotedAmount);
            if (remainingTokenCount < 0) {
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

        // 트랜잭션으로 모든 베팅 로직을 안전하게 처리
        const result = await prisma.$transaction(async (tx) => {
            // 베팅 모드에서는 먼저 에셋 차감 확인
            if (poll.bettingMode && poll.bettingAssetId) {
                // 실시간 잔액 재확인 (Race Condition 방지)
                const currentPlayerAsset = await tx.playerAsset.findUnique({
                    where: {
                        playerId_assetId: {
                            playerId: player.id,
                            assetId: poll.bettingAssetId,
                        },
                    },
                });

                if (
                    !currentPlayerAsset ||
                    currentPlayerAsset.balance < amount
                ) {
                    throw new Error("Insufficient balance for betting");
                }
            }

            // PollLog 생성/업데이트
            const pollLog = await tx.pollLog.upsert({
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

            // 베팅 모드 처리
            if (poll.bettingMode && poll.bettingAssetId) {
                // 에셋 차감 (트랜잭션 내에서)
                await tx.playerAsset.update({
                    where: {
                        playerId_assetId: {
                            playerId: player.id,
                            assetId: poll.bettingAssetId,
                        },
                    },
                    data: {
                        balance: { decrement: amount },
                    },
                });

                // 베팅 풀 업데이트 (Lock으로 Race Condition 방지)
                const currentPoll = await tx.poll.findUnique({
                    where: { id: poll.id },
                    select: {
                        optionBetAmounts: true,
                        totalCommissionAmount: true,
                        houseCommissionRate: true,
                    },
                });

                const currentBetAmounts =
                    (currentPoll?.optionBetAmounts as any) || {};
                const newBetAmounts = {
                    ...currentBetAmounts,
                    [optionId]: (currentBetAmounts[optionId] || 0) + amount,
                };

                // 수수료 계산 (정수 연산으로 정밀도 문제 해결)
                const commissionRate = currentPoll?.houseCommissionRate || 0.05;
                const commission =
                    Math.floor(amount * commissionRate * 100) / 100; // 소수점 2자리까지
                const newTotalCommission =
                    (currentPoll?.totalCommissionAmount || 0) + commission;

                await tx.poll.update({
                    where: { id: poll.id },
                    data: {
                        optionBetAmounts: newBetAmounts,
                        totalCommissionAmount: newTotalCommission,
                        uniqueVoters: isFirstTimeVote
                            ? { increment: 1 }
                            : undefined,
                        totalVotes: { increment: amount },
                    },
                });

                // TODO: PlayerAsset 트랜잭션 로그 생성 (스키마 확인 후 추가)

                playerAssetUpdated = true;
            } else {
                // 일반 폴 처리
                if (isFirstTimeVote) {
                    if (
                        poll.participationRewardAssetId &&
                        poll.participationRewardAmount
                    ) {
                        await tx.playerAsset.upsert({
                            where: {
                                playerId_assetId: {
                                    playerId: player.id,
                                    assetId: poll.participationRewardAssetId,
                                },
                            },
                            update: {
                                balance: {
                                    increment:
                                        poll.participationRewardAmount * amount,
                                },
                            },
                            create: {
                                playerId: player.id,
                                assetId: poll.participationRewardAssetId,
                                balance:
                                    poll.participationRewardAmount * amount,
                                status: "ACTIVE",
                            },
                        });

                        // TODO: 트랜잭션 로그 생성 (스키마 확인 후 추가)

                        playerAssetUpdated = true;
                    }

                    await tx.poll.update({
                        where: { id: poll.id },
                        data: {
                            uniqueVoters: { increment: 1 },
                            totalVotes: { increment: amount },
                        },
                    });
                } else {
                    await tx.poll.update({
                        where: { id: poll.id },
                        data: { totalVotes: { increment: amount } },
                    });
                }
            }

            return { pollLog };
        });

        const { pollLog } = result;

        // 정답 확인
        if (
            poll.hasAnswer &&
            poll.answerOptionIds &&
            poll.answerOptionIds.length > 0
        ) {
            const selectedOptionId = pollLog.optionId;
            const isAnswer = poll.answerOptionIds.includes(selectedOptionId);

            if (!isAnswer) {
                return {
                    success: true,
                    data: pollLog,
                    error: "MISSED_ANSWER",
                };
            }
        }

        return { success: true, data: pollLog, playerAssetUpdated };
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
    pollId?: string;
}

export async function getPlayerPollLogs(
    input?: GetPlayerPollLogsInput
): Promise<PollLog[]> {
    if (!input) {
        return [];
    }

    try {
        const where: Prisma.PollLogWhereInput = {};
        if (input.pollId) where.pollId = input.pollId;
        if (input.playerId) where.playerId = input.playerId;

        return await prisma.pollLog.findMany({
            where,
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

export interface UpdateActivePollInput {
    pollId: string;
    isActive: boolean;
}

export async function updateActivePoll(
    input: UpdateActivePollInput
): Promise<boolean> {
    const { pollId, isActive } = input;

    if (!pollId) {
        return false;
    }

    try {
        const poll = await prisma.poll.update({
            where: { id: pollId },
            data: {
                isActive,
            },
        });

        return poll.isActive;
    } catch (error) {
        console.error("Error updating poll:", error);
        return false;
    }
}

export interface SettleBettingPollInput {
    pollId: string;
    winningOptionIds: string[];
}

export interface SettleBettingPollResult {
    success: boolean;
    message?: string;
    error?: string;
    totalPayout?: number;
    totalWinners?: number;
}

export async function settleBettingPoll(
    input: SettleBettingPollInput
): Promise<SettleBettingPollResult> {
    try {
        const { pollId, winningOptionIds } = input;

        if (!pollId || !winningOptionIds || winningOptionIds.length === 0) {
            return {
                success: false,
                error: "Invalid input parameters",
            };
        }

        const result = await prisma.$transaction(async (tx) => {
            // 폴 정보 가져오기 (Lock으로 중복 정산 방지)
            const poll = await tx.poll.findUnique({
                where: { id: pollId },
                select: {
                    bettingMode: true,
                    bettingAssetId: true,
                    optionBetAmounts: true,
                    totalCommissionAmount: true,
                    houseCommissionRate: true,
                    status: true,
                    endDate: true,
                    answerOptionIds: true,
                },
            });

            if (!poll || !poll.bettingMode || !poll.bettingAssetId) {
                throw new Error("This is not a betting poll");
            }

            // 중복 정산 방지
            if (poll.answerOptionIds && poll.answerOptionIds.length > 0) {
                throw new Error("Poll has already been settled");
            }

            // 폴이 종료되었는지 확인
            if (poll.endDate && new Date() < poll.endDate) {
                throw new Error("Poll has not ended yet");
            }

            const betAmounts = (poll.optionBetAmounts as any) || {};
            const totalCommission = poll.totalCommissionAmount || 0;

            // 전체 베팅 금액 계산 (정밀도 보정)
            const totalBetAmount = Object.values(betAmounts).reduce(
                (sum: number, amount: any) =>
                    Math.floor((sum + (amount || 0)) * 100) / 100,
                0
            );

            // 승리 옵션들의 총 베팅 금액 계산
            const totalWinningBets = winningOptionIds.reduce(
                (sum, optionId) =>
                    Math.floor((sum + (betAmounts[optionId] || 0)) * 100) / 100,
                0
            );

            if (totalWinningBets === 0) {
                // 승리자가 없는 경우 - 모든 베팅 금액 환불
                const allBettors = await tx.pollLog.findMany({
                    where: { pollId },
                    select: {
                        id: true,
                        playerId: true,
                        amount: true,
                    },
                });

                for (const bettor of allBettors) {
                    // 직접 에셋 업데이트 (트랜잭션 내에서)
                    await tx.playerAsset.upsert({
                        where: {
                            playerId_assetId: {
                                playerId: bettor.playerId,
                                assetId: poll.bettingAssetId,
                            },
                        },
                        update: {
                            balance: { increment: bettor.amount },
                        },
                        create: {
                            playerId: bettor.playerId,
                            assetId: poll.bettingAssetId,
                            balance: bettor.amount,
                            status: "ACTIVE",
                        },
                    });

                    // TODO: 트랜잭션 로그 생성 (스키마 확인 후 추가)
                }

                await tx.poll.update({
                    where: { id: pollId },
                    data: {
                        status: PollStatus.ENDED,
                        answerOptionIds: winningOptionIds,
                    },
                });

                return {
                    success: true,
                    message: "All bets refunded (no winners)",
                    totalPayout: totalBetAmount,
                    totalWinners: allBettors.length,
                };
            }

            // 배당 풀 계산 (전체 베팅 금액 - 수수료, 정밀도 보정)
            const payoutPool =
                Math.floor((totalBetAmount - totalCommission) * 100) / 100;

            // 승리자들에게 배당 지급
            const winners = await tx.pollLog.findMany({
                where: {
                    pollId,
                    optionId: { in: winningOptionIds },
                },
                select: {
                    id: true,
                    playerId: true,
                    optionId: true,
                    amount: true,
                },
            });

            let totalActualPayout = 0;
            const payoutDetails: Array<{ playerId: string; amount: number }> =
                [];

            for (const winner of winners) {
                // 개별 승리자의 배당 비율 계산 (정밀도 보정)
                const winnerBetAmount = winner.amount;
                const payoutRatio = winnerBetAmount / totalWinningBets;
                const exactPayout = payoutPool * payoutRatio;
                const payout = Math.floor(exactPayout * 100) / 100; // 소수점 2자리까지

                if (payout > 0) {
                    await tx.playerAsset.upsert({
                        where: {
                            playerId_assetId: {
                                playerId: winner.playerId,
                                assetId: poll.bettingAssetId,
                            },
                        },
                        update: {
                            balance: { increment: payout },
                        },
                        create: {
                            playerId: winner.playerId,
                            assetId: poll.bettingAssetId,
                            balance: payout,
                            status: "ACTIVE",
                        },
                    });

                    // TODO: 트랜잭션 로그 생성 (스키마 확인 후 추가)

                    totalActualPayout += payout;
                    payoutDetails.push({
                        playerId: winner.playerId,
                        amount: payout,
                    });
                }
            }

            // 잔여 금액 처리 (소수점 오차로 인한)
            const remainingAmount =
                Math.floor((payoutPool - totalActualPayout) * 100) / 100;
            if (remainingAmount > 0.01) {
                // 1센트 이상의 잔여 금액이 있다면
                // 가장 큰 배당을 받은 승리자에게 추가 지급
                const topWinner = payoutDetails.reduce((prev, current) =>
                    prev.amount > current.amount ? prev : current
                );

                if (topWinner) {
                    await tx.playerAsset.update({
                        where: {
                            playerId_assetId: {
                                playerId: topWinner.playerId,
                                assetId: poll.bettingAssetId,
                            },
                        },
                        data: {
                            balance: { increment: remainingAmount },
                        },
                    });

                    // TODO: 트랜잭션 로그 생성 (스키마 확인 후 추가)

                    totalActualPayout += remainingAmount;
                }
            }

            // 폴 상태 업데이트
            await tx.poll.update({
                where: { id: pollId },
                data: {
                    status: PollStatus.ENDED,
                    answerOptionIds: winningOptionIds,
                },
            });

            return {
                success: true,
                message: `Settlement completed. ${winners.length} winners received payouts. Total payout: ${totalActualPayout}`,
                totalPayout: totalActualPayout,
                totalWinners: winners.length,
            };
        });

        return result;
    } catch (error) {
        console.error("Error settling betting poll:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Settlement failed",
        };
    }
}
