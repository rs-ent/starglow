/// app\actions\polls.ts

"use server";

import { PollStatus } from "@prisma/client";

import { tokenGating } from "@/app/story/nft/actions";
import { prisma } from "@/lib/prisma/client";

import { updatePlayerAsset } from "@/app/actions/playerAssets/actions";

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

// Notification 함수들 import 추가
import {
    createBettingWinNotification,
    createBettingFailedNotification,
    createBettingRefundNotification,
    createSettlementCompleteNotification,
} from "./notification/actions";
import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";

// 에러 메시지 상수 (향후 국제화 대응)
const ERROR_MESSAGES = {
    POLL_NOT_FOUND: "Poll not found",
    PLAYER_NOT_FOUND:
        "Player not found. Please refresh the page or sign in again.",
    NO_OPTIONS: "No options found. Please contact technical support.",
    INVALID_OPTION:
        "Invalid option. Please try again or contact technical support.",
    POLL_NOT_STARTED: "This poll is not active yet. The poll starts at",
    POLL_ENDED: "This poll has ended. The poll ended at",
    BETTING_ASSET_NOT_CONFIGURED: "Betting asset not configured for this poll.",
    MINIMUM_BET_ERROR: "Minimum bet amount is",
    MAXIMUM_BET_ERROR: "Maximum bet amount is",
    INSUFFICIENT_BALANCE: "Insufficient balance for betting.",
    TOKEN_GATING_REQUIRED:
        "Token gating required. Please try again or contact technical support.",
    ALL_TOKENS_USED:
        "You've used all your tokens for this poll. Please purchase more NFTs to participate in this poll.",
    ALREADY_VOTED: "You have already voted for this poll at",
    INVALID_BETTING_ASSET: "Invalid betting asset",
    INVALID_REWARD_ASSET: "Invalid reward asset",
    INVALID_ARTIST: "Invalid artist",
    FAILED_TO_CREATE_POLL: "Failed to create poll",
    FAILED_TO_UPDATE_POLL: "Failed to update poll",
    FAILED_TO_DELETE_POLL: "Failed to delete poll",
    FAILED_TO_GET_POLL: "Failed to get poll",
    FAILED_TO_CREATE_POLL_LOG: "Failed to create poll log",
    FAILED_TO_GET_POLL_LOGS: "Failed to get poll logs",
    MISSED_ANSWER: "MISSED_ANSWER",
    PARTICIPATION_ASSET_NOT_CONFIGURED:
        "Participation fee asset not configured for this poll.",
    INSUFFICIENT_PARTICIPATION_FEE:
        "Insufficient balance for participation fee.",
} as const;

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
    showOnPollPage?: boolean;
    showOnStarPage?: boolean;
    needToken: boolean;
    needTokenAddress?: string;
    bettingMode?: boolean;
    bettingAssetId?: string;
    minimumBet?: number;
    maximumBet?: number;
    allowMultipleVote?: boolean;
    participationRewardAssetId?: string;
    participationRewardAmount?: number;
    participationConsumeAssetId?: string;
    participationConsumeAmount?: number;
    minimumPoints?: number;
    minimumSGP?: number;
    minimumSGT?: number;
    requiredQuests?: string[];
    artistId?: string;
    isActive?: boolean;
    hasAnswer?: boolean;
    hasAnswerAnnouncement?: boolean;
    answerOptionIds?: string[];
    answerAnnouncementDate?: Date;
    // 베팅 시스템 필드들
    houseCommissionRate?: number;
    totalCommissionAmount?: number;
    optionBetAmounts?: any;
    test?: boolean;
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

        if (input.participationConsumeAssetId) {
            const consumeAsset = await prisma.asset.findUnique({
                where: { id: input.participationConsumeAssetId },
            });

            if (!consumeAsset || !consumeAsset.isActive) {
                throw new Error("Invalid consume asset");
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
    participationConsumeAsset: Asset | null;
};

export interface GetPollsInput {
    id?: string;
    category?: PollCategory;
    status?: PollStatus;
    needToken?: boolean;
    needTokenAddress?: string;
    showOnPollPage?: boolean;
    showOnStarPage?: boolean;
    hasAnswer?: boolean;
    hasAnswerAnnouncement?: boolean;
    answerAnnouncementDate?: Date;
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
    participationConsumeAssetId?: string;
    artistId?: string | null;
    isActive?: boolean;
    test?: boolean;
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
        if (input?.participationConsumeAssetId)
            where.participationConsumeAssetId =
                input.participationConsumeAssetId;
        if (input?.showOnPollPage) where.showOnPollPage = input.showOnPollPage;
        if (input?.showOnStarPage) where.showOnStarPage = input.showOnStarPage;
        if (input?.hasAnswer) where.hasAnswer = input.hasAnswer;
        if (input?.hasAnswerAnnouncement)
            where.hasAnswerAnnouncement = input.hasAnswerAnnouncement;
        if (input?.answerAnnouncementDate)
            where.answerAnnouncementDate = input.answerAnnouncementDate;

        if (input?.test !== undefined) where.test = input.test;

        const [items, totalItems] = await Promise.all([
            prisma.poll.findMany({
                cacheStrategy: getCacheStrategy("tenMinutes"),
                where,
                orderBy: {
                    id: "desc",
                },
                skip: (pagination.currentPage - 1) * pagination.itemsPerPage,
                take: pagination.itemsPerPage,
                include: {
                    artist: true,
                    participationRewardAsset: true,
                    participationConsumeAsset: true,
                },
            }),
            prisma.poll.count({
                cacheStrategy: getCacheStrategy("tenMinutes"),
                where,
            }),
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
          participationConsumeAsset: Asset | null;
      })
    | null
> {
    try {
        const poll = await prisma.poll.findUnique({
            cacheStrategy: getCacheStrategy("tenMinutes"),
            where: { id },
            include: {
                participationRewardAsset: true,
                artist: true,
                participationConsumeAsset: true,
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
    showOnPollPage?: boolean;
    showOnStarPage?: boolean;
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
    participationConsumeAssetId?: string;
    participationConsumeAsset?: Asset | null;
    participationConsumeAmount?: number;
    minimumPoints?: number;
    minimumSGP?: number;
    minimumSGT?: number;
    requiredQuests?: string[];
    artistId?: string | null;
    artist?: Artist | null;
    isActive?: boolean;
    hasAnswer?: boolean;
    hasAnswerAnnouncement?: boolean;
    answerOptionIds?: string[];
    answerAnnouncementDate?: Date;
    // 베팅 시스템 필드들
    houseCommissionRate?: number;
    totalCommissionAmount?: number;
    optionBetAmounts?: any;
    test?: boolean;
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

        if (input.participationConsumeAssetId) {
            const consumeAsset = await prisma.asset.findUnique({
                where: { id: input.participationConsumeAssetId },
            });

            if (!consumeAsset || !consumeAsset.isActive) {
                throw new Error("Invalid consume asset");
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
            participationConsumeAssetId,
            participationConsumeAsset,
            options,
            ...rest
        } = data;

        console.info("Participation Reward Asset", participationRewardAsset);
        console.info("Participation Consume Asset", participationConsumeAsset);
        console.info("Betting Asset", bettingAsset);
        console.info("Artist", artist);

        const poll = await prisma.poll.update({
            where: { id },
            data: {
                ...rest,
                artistId:
                    artistId === null ||
                    artistId === "" ||
                    artistId === undefined
                        ? null
                        : artistId,
                bettingAssetId:
                    bettingAssetId === null ||
                    bettingAssetId === "" ||
                    bettingAssetId === undefined
                        ? null
                        : bettingAssetId,
                participationRewardAssetId:
                    participationRewardAssetId === null ||
                    participationRewardAssetId === "" ||
                    participationRewardAssetId === undefined
                        ? null
                        : participationRewardAssetId,
                participationConsumeAssetId:
                    participationConsumeAssetId === null ||
                    participationConsumeAssetId === "" ||
                    participationConsumeAssetId === undefined
                        ? null
                        : participationConsumeAssetId,
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

        if (!poll)
            return { success: false, error: ERROR_MESSAGES.POLL_NOT_FOUND };
        if (!player)
            return {
                success: false,
                error: ERROR_MESSAGES.PLAYER_NOT_FOUND,
            };

        if (!poll.options)
            return {
                success: false,
                error: ERROR_MESSAGES.NO_OPTIONS,
            };
        const validOption = poll.options.find(
            (option: any) => option.optionId === optionId
        );
        if (!validOption)
            return {
                success: false,
                error: ERROR_MESSAGES.INVALID_OPTION,
            };

        const now = new Date();
        if (now < poll.startDate)
            return {
                success: false,
                error: `${
                    ERROR_MESSAGES.POLL_NOT_STARTED
                } ${poll.startDate.toLocaleString()}.`,
            };
        if (
            poll.endDate &&
            new Date(poll.endDate).getTime() + 1000 * 60 * 30 < Date.now()
        ) {
            return {
                success: false,
                error: `${
                    ERROR_MESSAGES.POLL_ENDED
                } ${poll.endDate.toLocaleString()}.`,
            };
        }

        // 베팅 모드 검증 및 처리
        if (poll.bettingMode) {
            if (!poll.bettingAssetId) {
                return {
                    success: false,
                    error: ERROR_MESSAGES.BETTING_ASSET_NOT_CONFIGURED,
                };
            }

            // 베팅 금액 검증
            if (poll.minimumBet && amount < poll.minimumBet) {
                return {
                    success: false,
                    error: `${ERROR_MESSAGES.MINIMUM_BET_ERROR} ${poll.minimumBet}.`,
                };
            }

            if (poll.maximumBet && amount > poll.maximumBet) {
                return {
                    success: false,
                    error: `${ERROR_MESSAGES.MAXIMUM_BET_ERROR} ${poll.maximumBet}.`,
                };
            }

            // 사용자 에셋 잔액 확인
            const playerAsset = await prisma.playerAsset.findUnique({
                cacheStrategy: getCacheStrategy("realtime"),
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
                    error: ERROR_MESSAGES.INSUFFICIENT_BALANCE,
                };
            }

            // 사용자별 누적 베팅 한도 검증 (선택적 기능)
            if (poll.maximumBet) {
                const userBetLogs = await prisma.pollLog.findMany({
                    cacheStrategy: getCacheStrategy("realtime"),
                    where: {
                        pollId: poll.id,
                        playerId: player.id,
                    },
                    select: {
                        amount: true,
                    },
                });

                const currentTotalBets = userBetLogs.reduce(
                    (sum, log) => sum + log.amount,
                    0
                );
                if (currentTotalBets + amount > poll.maximumBet * 10) {
                    // 예: 개별 최대 베팅의 10배까지 누적 허용
                    return {
                        success: false,
                        error: `Total betting limit exceeded. Current total: ${currentTotalBets}, attempting to add: ${amount}`,
                    };
                }
            }
        }

        // 일반 폴 참여 비용 검증 (베팅 모드가 아닌 경우)
        if (
            !poll.bettingMode &&
            poll.participationConsumeAssetId &&
            poll.participationConsumeAmount
        ) {
            // 참여 비용 에셋 잔액 확인
            const playerConsumeAsset = await prisma.playerAsset.findUnique({
                cacheStrategy: getCacheStrategy("realtime"),
                where: {
                    playerId_assetId: {
                        playerId: player.id,
                        assetId: poll.participationConsumeAssetId,
                    },
                },
            });

            const requiredAmount = poll.participationConsumeAmount * amount;
            if (
                !playerConsumeAsset ||
                playerConsumeAsset.balance < requiredAmount
            ) {
                return {
                    success: false,
                    error: `${
                        ERROR_MESSAGES.INSUFFICIENT_PARTICIPATION_FEE
                    } Required: ${requiredAmount}, Available: ${
                        playerConsumeAsset?.balance || 0
                    }`,
                };
            }
        }

        if (poll.needToken && poll.needTokenAddress) {
            if (!input.tokenGating || !input.tokenGating.hasToken)
                return {
                    success: false,
                    error: ERROR_MESSAGES.TOKEN_GATING_REQUIRED,
                };

            const alreadyVotedAmount = input.alreadyVotedAmount || 0;
            const remainingTokenCount =
                input.tokenGating.detail.length - (amount + alreadyVotedAmount);
            if (remainingTokenCount < 0) {
                return {
                    success: false,
                    error: ERROR_MESSAGES.ALL_TOKENS_USED,
                };
            }
        }

        const existingLogs = await prisma.pollLog.findMany({
            cacheStrategy: getCacheStrategy("realtime"),
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
                    cacheStrategy: getCacheStrategy("realtime"),
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

            // 일반 폴 참여 비용 실시간 잔액 재확인 (Race Condition 방지)
            if (
                !poll.bettingMode &&
                poll.participationConsumeAssetId &&
                poll.participationConsumeAmount
            ) {
                const requiredAmount = poll.participationConsumeAmount * amount;
                const currentPlayerConsumeAsset =
                    await tx.playerAsset.findUnique({
                        cacheStrategy: getCacheStrategy("realtime"),
                        where: {
                            playerId_assetId: {
                                playerId: player.id,
                                assetId: poll.participationConsumeAssetId,
                            },
                        },
                    });

                if (
                    !currentPlayerConsumeAsset ||
                    currentPlayerConsumeAsset.balance < requiredAmount
                ) {
                    throw new Error(
                        "Insufficient balance for participation fee"
                    );
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
                // updatePlayerAsset 함수 사용으로 안전한 에셋 차감
                const assetUpdateResult = await updatePlayerAsset(
                    {
                        transaction: {
                            playerId: player.id,
                            assetId: poll.bettingAssetId,
                            amount: amount,
                            operation: "SUBTRACT",
                            reason: `Betting on poll 『${poll.title}』`,
                            metadata: {
                                pollId: poll.id,
                                optionId: optionId,
                                bettingMode: true,
                            },
                            pollId: poll.id,
                            pollLogId: pollLog.id,
                        },
                    },
                    tx
                );

                if (!assetUpdateResult.success) {
                    throw new Error(
                        assetUpdateResult.error ||
                            "Failed to deduct betting asset"
                    );
                }

                // 베팅 풀 업데이트 (트랜잭션 내에서 안전하게 처리)
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
                        optionBetAmounts: newBetAmounts as any,
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

                // 참여 비용 차감 처리 (매번 차감)
                if (
                    poll.participationConsumeAssetId &&
                    poll.participationConsumeAmount
                ) {
                    const consumeAmount =
                        poll.participationConsumeAmount * amount;

                    const consumeResult = await updatePlayerAsset(
                        {
                            transaction: {
                                playerId: player.id,
                                assetId: poll.participationConsumeAssetId,
                                amount: consumeAmount,
                                operation: "SUBTRACT",
                                reason: `Participation fee for poll 『${poll.title}』`,
                                metadata: {
                                    pollId: poll.id,
                                    isParticipationFee: true,
                                    consumeAmount: consumeAmount,
                                },
                                pollId: poll.id,
                                pollLogId: pollLog.id,
                            },
                        },
                        tx
                    );

                    if (!consumeResult.success) {
                        throw new Error(
                            consumeResult.error ||
                                "Failed to deduct participation fee"
                        );
                    }

                    playerAssetUpdated = true;
                }

                if (isFirstTimeVote) {
                    if (
                        poll.participationRewardAssetId &&
                        poll.participationRewardAmount
                    ) {
                        // updatePlayerAsset 함수 사용으로 안전한 보상 지급
                        const rewardUpdateResult = await updatePlayerAsset(
                            {
                                transaction: {
                                    playerId: player.id,
                                    assetId: poll.participationRewardAssetId,
                                    amount:
                                        poll.participationRewardAmount * amount,
                                    operation: "ADD",
                                    reason: `Participation reward for poll 『${poll.title}』`,
                                    metadata: {
                                        pollId: poll.id,
                                        isParticipationReward: true,
                                        rewardAmount:
                                            poll.participationRewardAmount,
                                    },
                                    pollId: poll.id,
                                    pollLogId: pollLog.id,
                                },
                            },
                            tx
                        );

                        if (!rewardUpdateResult.success) {
                            throw new Error(
                                rewardUpdateResult.error ||
                                    "Failed to give participation reward"
                            );
                        }

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
    actualVoteCount?: number; // 실제 득표수 (베팅 모드에서 사용)
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
        cacheStrategy: getCacheStrategy("tenMinutes"),
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
        cacheStrategy: getCacheStrategy("tenSeconds"),
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

        // 실제 득표수 (투표한 사람의 수) 계산
        const actualVoteCount = pollLogs.reduce((acc, curr) => {
            if (curr.optionId === option.optionId) {
                return acc + 1; // 베팅 금액이 아닌 실제 투표한 사람의 수
            }
            return acc;
        }, 0);

        const voteRate = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
        return {
            ...option,
            voteCount,
            voteRate,
            actualVoteCount, // 실제 득표수 추가
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
            cacheStrategy: getCacheStrategy("tenSeconds"),
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
            cacheStrategy: getCacheStrategy("realtime"),
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
            cacheStrategy: getCacheStrategy("tenMinutes"),
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
            cacheStrategy: getCacheStrategy("sevenDays"),
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
            cacheStrategy: getCacheStrategy("realtime"),
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
            cacheStrategy: getCacheStrategy("realtime"),
            where: { id: pollLogId },
        });

        if (!pollLog) {
            return {
                success: false,
                error: "LOG_NOT_FOUND",
            };
        }

        const poll = await tx.poll.findUnique({
            cacheStrategy: getCacheStrategy("realtime"),
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
    payoutDetails?: Array<{ playerId: string; amount: number }>;
    winnerIds?: string[];
    isRefund?: boolean;
    refundedPlayerIds?: string[];
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

        const result = await prisma.$transaction(
            async (tx) => {
                // 🔒 원자적 정산 락 설정 (중복 정산 방지)
                const poll = await tx.poll.findUnique({
                    cacheStrategy: getCacheStrategy("realtime"),
                    where: { id: pollId },
                    select: {
                        title: true,
                        bettingMode: true,
                        bettingAssetId: true,
                        optionBetAmounts: true,
                        totalCommissionAmount: true,
                        houseCommissionRate: true,
                        status: true,
                        endDate: true,
                        bettingStatus: true,
                        isSettled: true,
                        settledAt: true,
                        answerOptionIds: true,
                    },
                });

                if (!poll || !poll.bettingMode || !poll.bettingAssetId) {
                    throw new Error("This is not a betting poll");
                }

                // 🚨 강화된 중복 정산 방지 (3중 체크)
                if (poll.isSettled || poll.settledAt) {
                    throw new Error("Poll has already been settled");
                }

                if (
                    poll.bettingStatus === "SETTLING" ||
                    poll.bettingStatus === "SETTLED"
                ) {
                    throw new Error(
                        "Poll is currently being settled or already settled"
                    );
                }

                if (poll.answerOptionIds && poll.answerOptionIds.length > 0) {
                    throw new Error("Poll settlement is already completed");
                }

                // 폴이 종료되었는지 확인
                if (poll.endDate && new Date() < poll.endDate) {
                    throw new Error("Poll has not ended yet");
                }

                // 🔒 즉시 정산 상태로 변경하여 락 설정
                await tx.poll.update({
                    where: { id: pollId },
                    data: {
                        bettingStatus: "SETTLING",
                        // settledBy는 나중에 성공 시에만 설정
                    },
                });

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
                        Math.floor((sum + (betAmounts[optionId] || 0)) * 100) /
                        100,
                    0
                );

                if (totalWinningBets === 0) {
                    // 승리자가 없는 경우 - 모든 베팅 금액 환불
                    const allBettors = await tx.pollLog.findMany({
                        cacheStrategy: getCacheStrategy("realtime"),
                        where: { pollId },
                        select: {
                            id: true,
                            playerId: true,
                            amount: true,
                        },
                    });

                    for (const bettor of allBettors) {
                        // updatePlayerAsset 함수 사용으로 안전한 환불 처리
                        const refundResult = await updatePlayerAsset(
                            {
                                transaction: {
                                    playerId: bettor.playerId,
                                    assetId: poll.bettingAssetId,
                                    amount: bettor.amount,
                                    operation: "ADD",
                                    reason: `Betting refund for poll 『${poll.title}』 (no winners)`,
                                    metadata: {
                                        pollId: pollId,
                                        isRefund: true,
                                        originalBetAmount: bettor.amount,
                                    },
                                    pollId: pollId,
                                },
                            },
                            tx
                        );

                        if (!refundResult.success) {
                            throw new Error(
                                `Failed to refund player ${bettor.playerId}: ${refundResult.error}`
                            );
                        }
                    }

                    // 🔒 환불 완료 시 정산 상태 업데이트
                    await tx.poll.update({
                        where: { id: pollId },
                        data: {
                            status: PollStatus.ENDED,
                            bettingStatus: "SETTLED",
                            isSettled: true,
                            settledAt: new Date(),
                            settledBy: "auto-refund",
                            answerOptionIds: winningOptionIds,
                        },
                    });

                    return {
                        success: true,
                        message: "All bets refunded (no winners)",
                        totalPayout: totalBetAmount,
                        totalWinners: allBettors.length,
                        isRefund: true,
                        refundedPlayerIds: allBettors.map((b) => b.playerId),
                    };
                }

                // 배당 풀 계산 (전체 베팅 금액 - 수수료, 정밀도 보정)
                const payoutPool =
                    Math.floor((totalBetAmount - totalCommission) * 100) / 100;

                // 승리자들에게 배당 지급
                const winners = await tx.pollLog.findMany({
                    cacheStrategy: getCacheStrategy("realtime"),
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
                const payoutDetails: Array<{
                    playerId: string;
                    amount: number;
                }> = [];

                for (const winner of winners) {
                    // 개별 승리자의 배당 비율 계산 (정밀도 보정)
                    const winnerBetAmount = winner.amount;
                    const payoutRatio = winnerBetAmount / totalWinningBets;
                    const exactPayout = payoutPool * payoutRatio;
                    const payout = Math.floor(exactPayout * 100) / 100; // 소수점 2자리까지

                    if (payout > 0) {
                        // updatePlayerAsset 함수 사용으로 안전한 배당 지급
                        const payoutResult = await updatePlayerAsset(
                            {
                                transaction: {
                                    playerId: winner.playerId,
                                    assetId: poll.bettingAssetId,
                                    amount: payout,
                                    operation: "ADD",
                                    reason: `Betting payout for poll 『${poll.title}』`,
                                    metadata: {
                                        pollId: pollId,
                                        winningOptionId: winner.optionId,
                                        originalBetAmount: winner.amount,
                                        payoutAmount: payout,
                                        payoutRatio: payoutRatio,
                                        isWinnerPayout: true,
                                    },
                                    pollId: pollId,
                                },
                            },
                            tx
                        );

                        if (!payoutResult.success) {
                            throw new Error(
                                `Failed to pay winner ${winner.playerId}: ${payoutResult.error}`
                            );
                        }

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
                        // updatePlayerAsset 함수 사용으로 안전한 잔여 금액 지급
                        const remainingPayoutResult = await updatePlayerAsset(
                            {
                                transaction: {
                                    playerId: topWinner.playerId,
                                    assetId: poll.bettingAssetId,
                                    amount: remainingAmount,
                                    operation: "ADD",
                                    reason: `Remaining payout adjustment for poll 『${poll.title}』`,
                                    metadata: {
                                        pollId: pollId,
                                        isRemainingAdjustment: true,
                                        remainingAmount: remainingAmount,
                                        originalPayoutAmount: topWinner.amount,
                                    },
                                    pollId: pollId,
                                },
                            },
                            tx
                        );

                        if (!remainingPayoutResult.success) {
                            throw new Error(
                                `Failed to pay remaining amount to ${topWinner.playerId}: ${remainingPayoutResult.error}`
                            );
                        }

                        totalActualPayout += remainingAmount;
                    }
                }

                // 🔒 정산 완료 시 최종 상태 업데이트
                await tx.poll.update({
                    where: { id: pollId },
                    data: {
                        status: PollStatus.ENDED,
                        bettingStatus: "SETTLED",
                        isSettled: true,
                        settledAt: new Date(),
                        settledBy: "auto-settlement",
                        answerOptionIds: winningOptionIds,
                    },
                });

                return {
                    success: true,
                    message: `Settlement completed. ${winners.length} winners received payouts. Total payout: ${totalActualPayout}`,
                    totalPayout: totalActualPayout,
                    totalWinners: winners.length,
                    payoutDetails,
                    winnerIds: winners.map((w) => w.playerId),
                };
            },
            {
                timeout: 30000, // 30초 타임아웃 설정
            }
        );

        // 🔔 정산 완료 후 알림 전송
        if (result.success) {
            try {
                const poll = await prisma.poll.findUnique({
                    cacheStrategy: getCacheStrategy("realtime"),
                    where: { id: pollId },
                    select: { title: true, bettingAssetId: true },
                });

                if (!poll) {
                    console.error(`Poll ${pollId} not found for notifications`);
                    return result;
                }

                // 모든 베팅 참가자 조회
                const allBettors = await prisma.pollLog.findMany({
                    cacheStrategy: getCacheStrategy("realtime"),
                    where: { pollId },
                    select: {
                        playerId: true,
                        optionId: true,
                        amount: true,
                        player: {
                            select: { id: true },
                        },
                    },
                });

                // 환불 케이스 처리
                if ((result as any).isRefund) {
                    // 💰 모든 참가자에게 환불 알림 전송
                    const refundNotificationPromises = allBettors.map(
                        async (bettor) => {
                            await createBettingRefundNotification(
                                bettor.playerId,
                                pollId,
                                poll.title,
                                bettor.amount,
                                "No winning option determined"
                            );
                        }
                    );

                    await Promise.allSettled(refundNotificationPromises);
                } else {
                    // 일반 정산 케이스 처리
                    const winnerPlayerIds = new Set(result.winnerIds || []);
                    const payoutMap = new Map(
                        (result.payoutDetails || []).map((p: any) => [
                            p.playerId,
                            p.amount,
                        ])
                    );

                    // 각 베팅 참가자에게 개별 알림 전송
                    const notificationPromises = allBettors.map(
                        async (bettor) => {
                            const isWinner = winnerPlayerIds.has(
                                bettor.playerId
                            );

                            if (isWinner) {
                                // 🏆 승리자 알림
                                const winAmount =
                                    payoutMap.get(bettor.playerId) || 0;
                                await createBettingWinNotification(
                                    bettor.playerId,
                                    pollId,
                                    poll.title,
                                    bettor.amount,
                                    winAmount
                                );
                            } else {
                                // 😔 패배자 알림 (환불이 아닌 경우만)
                                if (winningOptionIds.length > 0) {
                                    await createBettingFailedNotification(
                                        bettor.playerId,
                                        pollId,
                                        poll.title,
                                        bettor.amount,
                                        `Option ${bettor.optionId}`
                                    );
                                }
                            }
                        }
                    );

                    // 모든 개별 알림 전송 완료 대기
                    await Promise.allSettled(notificationPromises);

                    // 📊 전체 정산 완료 알림 (대표 승리자에게만)
                    if (result.totalWinners && result.totalWinners > 0) {
                        const firstWinner = allBettors.find((bettor) =>
                            winnerPlayerIds.has(bettor.playerId)
                        );

                        if (firstWinner) {
                            await createSettlementCompleteNotification(
                                firstWinner.playerId,
                                pollId,
                                poll.title,
                                result.totalWinners,
                                result.totalPayout || 0
                            );
                        }
                    }
                }
            } catch (notificationError) {
                console.error(
                    `❌ Failed to send settlement notifications for poll ${pollId}:`,
                    notificationError
                );
                // 알림 실패는 정산 결과에 영향을 주지 않음
            }
        }

        return result;
    } catch (error) {
        console.error("Error settling betting poll:", error);

        // 🔄 에러 발생 시 정산 상태 롤백 시도
        try {
            await prisma.poll.update({
                where: { id: input.pollId },
                data: {
                    bettingStatus: "OPEN", // 다시 열린 상태로 되돌림
                },
            });
        } catch (rollbackError) {
            console.error(
                "❌ Failed to rollback settlement status:",
                rollbackError
            );
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : "Settlement failed",
        };
    }
}

export interface GetArtistAllActivePollCountInput {
    artistId: string;
}

export async function getArtistAllActivePollCount(
    input?: GetArtistAllActivePollCountInput
): Promise<number> {
    if (!input) {
        return 0;
    }

    try {
        const count = await prisma.poll.count({
            cacheStrategy: getCacheStrategy("fiveMinutes"),
            where: {
                artistId: input.artistId,
                isActive: true,
                startDate: {
                    lte: new Date(),
                },
                endDate: {
                    gte: new Date(),
                },
            },
        });

        return count;
    } catch (error) {
        console.error("Error getting artist all poll count:", error);
        return 0;
    }
}
