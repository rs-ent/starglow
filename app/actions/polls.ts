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
    createBettingFailedNotification,
    createBettingWinNotification,
    createBettingRefundNotification,
    createSettlementCompleteNotification,
} from "./notification/actions";
import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";

import { participatePollOnchain } from "@/app/actions/polls/onchain/actions-write";
import { createOnchainPoll } from "@/app/actions/polls/onchain/actions-admin";
import { getPollResult as getOnchainPollResult } from "@/app/actions/polls/onchain/actions-read";

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
    isOnchain?: boolean;
    onchainContractId?: string;
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

        let onchainPollId: string | undefined;

        if (input.isOnchain && input.onchainContractId) {
            const onchainContract = await prisma.onchainPollContract.findUnique(
                {
                    where: { id: input.onchainContractId },
                    select: {
                        id: true,
                        address: true,
                        isActive: true,
                    },
                }
            );

            if (!onchainContract) {
                throw new Error("Invalid onchain contract");
            }

            if (!onchainContract.isActive) {
                throw new Error("Onchain contract is not active");
            }

            // 온체인 Poll 생성
            const onchainResult = await createOnchainPoll(input);

            if (!onchainResult.success) {
                throw new Error(
                    `Failed to create onchain poll: ${onchainResult.error}`
                );
            }

            onchainPollId = onchainResult.pollId?.toString();
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
                onchainPollId: onchainPollId,
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
    startDateFrom?: Date;
    startDateTo?: Date;
    endDateFrom?: Date;
    endDateTo?: Date;
    exposeInScheduleTab?: boolean;
    bettingMode?: boolean;
    bettingAssetId?: string;
    participationRewardAssetId?: string;
    participationConsumeAssetId?: string;
    artistId?: string | null;
    isActive?: boolean;
    test?: boolean;
    allowMultipleVote?: boolean;
    isOnchain?: boolean;
}

export type PollListData = {
    id: string;
    title: string;
    description: string;
    imgUrl: string;
    youtubeUrl: string;
    startDate: Date;
    endDate: Date;
    bettingMode: boolean;
    allowMultipleVote: boolean;
    isOnchain: boolean;
    hasAnswer: boolean;
    participationRewardAssetId: string;
    participationRewardAmount: number;
    artistId: string;
    isActive: boolean;
    test: boolean;
    artist: {
        id: string;
        name: string;
        imageUrl: string;
        logoUrl: string;
        backgroundColors: string[];
        foregroundColors: string[];
    };
    participationRewardAsset: {
        id: string;
        name: string;
        symbol: string;
        iconUrl: string;
    };
};

export interface GetPollsOutput {
    items: PollListData[];
    totalItems: number;
    totalPages: number;
}

export async function getPolls({
    input,
    pagination,
}: {
    input?: GetPollsInput;
    pagination?: PaginationInput;
}): Promise<{
    items: PollListData[];
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

        // 기존 날짜 필터 (하위호환성)
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

        // 새로운 직관적인 날짜 필터
        if (input?.startDateFrom || input?.startDateTo) {
            where.startDate = {
                ...(input.startDateFrom && { gte: input.startDateFrom }),
                ...(input.startDateTo && { lte: input.startDateTo }),
            };
        }
        if (input?.endDateFrom || input?.endDateTo) {
            where.endDate = {
                ...(input.endDateFrom && { gte: input.endDateFrom }),
                ...(input.endDateTo && { lte: input.endDateTo }),
            };
        }
        if (input?.exposeInScheduleTab !== undefined)
            where.exposeInScheduleTab = input.exposeInScheduleTab;
        if (input?.bettingMode !== undefined)
            where.bettingMode = input.bettingMode;
        if (input?.bettingAssetId) where.bettingAssetId = input.bettingAssetId;
        if (input?.participationRewardAssetId)
            where.participationRewardAssetId = input.participationRewardAssetId;
        if (input?.artistId === null) where.artistId = null;
        else if (input?.artistId) where.artistId = input.artistId;
        if (input?.isActive !== undefined) where.isActive = input.isActive;
        if (input?.participationConsumeAssetId)
            where.participationConsumeAssetId =
                input.participationConsumeAssetId;
        if (input?.showOnPollPage !== undefined)
            where.showOnPollPage = input.showOnPollPage;
        if (input?.showOnStarPage !== undefined)
            where.showOnStarPage = input.showOnStarPage;
        if (input?.hasAnswer !== undefined) where.hasAnswer = input.hasAnswer;
        if (input?.hasAnswerAnnouncement !== undefined)
            where.hasAnswerAnnouncement = input.hasAnswerAnnouncement;
        if (input?.answerAnnouncementDate)
            where.answerAnnouncementDate = input.answerAnnouncementDate;
        if (input?.allowMultipleVote !== undefined)
            where.allowMultipleVote = input.allowMultipleVote;
        if (input?.isOnchain !== undefined) where.isOnchain = input.isOnchain;
        if (input?.test !== undefined) where.test = input.test;

        const [items, totalItems] = await Promise.all([
            prisma.poll.findMany({
                cacheStrategy: getCacheStrategy("fiveMinutes"),
                where,
                orderBy: {
                    id: "desc",
                },
                skip: (pagination.currentPage - 1) * pagination.itemsPerPage,
                take: pagination.itemsPerPage,
                select: {
                    id: true,
                    title: true,
                    description: true,
                    imgUrl: true,
                    youtubeUrl: true,
                    startDate: true,
                    endDate: true,
                    bettingMode: true,
                    allowMultipleVote: true,
                    isOnchain: true,
                    hasAnswer: true,
                    participationRewardAssetId: true,
                    participationRewardAmount: true,
                    artistId: true,
                    isActive: true,
                    test: true,
                    artist: {
                        select: {
                            id: true,
                            name: true,
                            imageUrl: true,
                        },
                    },
                    participationRewardAsset: {
                        select: {
                            id: true,
                            name: true,
                            symbol: true,
                            iconUrl: true,
                        },
                    },
                },
            }),
            prisma.poll.count({
                cacheStrategy: getCacheStrategy("fiveMinutes"),
                where,
            }),
        ]);
        const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
        return {
            items: items as unknown as PollListData[],
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

export async function getPoll(id: string): Promise<PollListData | null> {
    try {
        const poll = await prisma.poll.findUnique({
            cacheStrategy: getCacheStrategy("tenMinutes"),
            where: { id },
            select: {
                id: true,
                title: true,
                description: true,
                imgUrl: true,
                youtubeUrl: true,
                startDate: true,
                endDate: true,
                bettingMode: true,
                allowMultipleVote: true,
                isOnchain: true,
                hasAnswer: true,
                participationRewardAssetId: true,
                participationRewardAmount: true,
                artistId: true,
                isActive: true,
                test: true,
                artist: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                    },
                },
                participationRewardAsset: {
                    select: {
                        id: true,
                        name: true,
                        symbol: true,
                        iconUrl: true,
                    },
                },
            },
        });

        return poll as PollListData;
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

        // 온체인 Poll 수정 제한
        const existingPoll = await prisma.poll.findUnique({
            where: { id },
            select: {
                isOnchain: true,
                onchainPollId: true,
                title: true,
            },
        });

        if (!existingPoll) {
            throw new Error("Poll not found");
        }

        if (existingPoll.isOnchain) {
            throw new Error(
                `Cannot modify onchain poll '${existingPoll.title}'. Onchain polls are immutable on the blockchain.`
            );
        }

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
        // 온체인 Poll 삭제 제한
        const existingPoll = await prisma.poll.findUnique({
            where: { id },
            select: {
                isOnchain: true,
                onchainPollId: true,
                title: true,
            },
        });

        if (!existingPoll) {
            throw new Error("Poll not found");
        }

        if (existingPoll.isOnchain) {
            throw new Error(
                `Cannot delete onchain poll '${existingPoll.title}'. Onchain polls are permanently stored on the blockchain. Use the activation toggle to disable it instead.`
            );
        }

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
    pollId: string;
    player: Player;
    optionId: string;
    amount?: number;
    alreadyVotedAmount?: number;
    ipAddress?: string;
    userAgent?: string;
    estimateGas?: boolean;
    gasSpeedMultiplier?: number; // 1 = normal, 2 = 2x faster, 50 = 50x faster
}

export interface ParticipatePollResult {
    success: boolean;
    data?: PollLog;
    error?: string;
    playerAssetUpdated?: boolean;
    onchainTxHash?: string;
    onchainBlockNumber?: number;
    onchainParticipationId?: string;
    gasEstimate?: {
        gasEstimate: string;
        gasPrice: string;
        estimatedCost: string;
    };
}

export async function participatePoll(
    input: ParticipatePollInput
): Promise<ParticipatePollResult> {
    try {
        const { pollId, player, optionId } = input;
        const amount = input.amount || 1;
        let playerAssetUpdated = false;

        const poll = await prisma.poll.findUnique({
            where: { id: pollId },
            select: {
                id: true,
                title: true,
                options: true,
                startDate: true,
                endDate: true,
                bettingMode: true,
                bettingAssetId: true,
                minimumBet: true,
                maximumBet: true,
                participationConsumeAssetId: true,
                participationConsumeAmount: true,
                needToken: true,
                needTokenAddress: true,
                allowMultipleVote: true,
                participationRewardAssetId: true,
                participationRewardAmount: true,
                isOnchain: true,
                onchainContractId: true,
                onchainPollId: true,
                hasAnswer: true,
                answerOptionIds: true,
            },
        });

        if (!poll)
            return { success: false, error: ERROR_MESSAGES.POLL_NOT_FOUND };
        if (!player)
            return {
                success: false,
                error: ERROR_MESSAGES.PLAYER_NOT_FOUND,
            };

        if (!player.userId)
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

                // 수수료 계산 (정수 강제 - 버림)
                const commissionRate = currentPoll?.houseCommissionRate || 0.01;
                const commission = Math.floor(amount * commissionRate); // 정수 버림
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

                playerAssetUpdated = true;
            } else {
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

        let onchainTxHash: string | undefined;
        let onchainBlockNumber: number | undefined;
        let onchainParticipationId: string | undefined;
        let gasEstimate: any = undefined;

        if (poll.isOnchain && poll.onchainContractId && poll.onchainPollId) {
            try {
                const onchainResult = await participatePollOnchain({
                    contractAddressId: poll.onchainContractId,
                    pollId: poll.onchainPollId,
                    userId: player.userId,
                    optionId: optionId,
                    isBetting: poll.bettingMode,
                    bettingAssetId: poll.bettingAssetId || undefined,
                    bettingAmount: amount,
                    estimateGas: false,
                    gasSpeedMultiplier: 20,
                });

                if (!onchainResult.success) {
                    console.error(
                        `❌ Onchain participation failed for poll ${poll.id}:`,
                        onchainResult.error
                    );
                } else {
                    onchainTxHash = onchainResult.data?.txHash;
                    onchainBlockNumber = onchainResult.data?.blockNumber;
                    onchainParticipationId =
                        onchainResult.data?.participationId;
                    gasEstimate = onchainResult.data?.gasEstimate;

                    console.info(
                        `✅ Onchain participation successful for poll ${poll.id}:`,
                        {
                            txHash: onchainTxHash,
                            blockNumber: onchainBlockNumber,
                            participationId: onchainParticipationId,
                            gasEstimate: gasEstimate,
                        }
                    );

                    if (onchainTxHash) {
                        const currentRecord = (pollLog.record as any) || {};
                        const updatedRecord = {
                            ...currentRecord,
                            onchainTxHash,
                            onchainBlockNumber,
                            onchainParticipationId,
                        };

                        await prisma.pollLog.update({
                            where: { id: pollLog.id },
                            data: {
                                record: updatedRecord,
                            },
                        });
                    }
                }
            } catch (error) {
                console.error(
                    `❌ Onchain participation error for poll ${poll.id}:`,
                    error
                );
            }
        }

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

        return {
            success: true,
            data: pollLog,
            playerAssetUpdated,
            onchainTxHash,
            onchainBlockNumber,
            onchainParticipationId,
            gasEstimate,
        };
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
            isOnchain: true,
            onchainPollId: true,
            onchainContract: {
                select: {
                    address: true,
                },
            },
        },
    });

    if (!poll) {
        return {
            pollId,
            totalVotes: 0,
            results: [],
        };
    }

    // 온체인 poll인 경우 스마트컨트랙트에서 결과 조회
    if (poll.isOnchain && poll.onchainPollId && poll.onchainContract?.address) {
        try {
            const onchainResult = await getOnchainPollResult({
                contractAddress: poll.onchainContract.address,
                pollId: poll.onchainPollId,
            });

            if (onchainResult.success && onchainResult.data) {
                const onchainData = onchainResult.data;

                return {
                    pollId,
                    totalVotes: Number(onchainData.totalVotes),
                    results: onchainData.results.map((result) => ({
                        optionId: result.optionId,
                        name: result.name,
                        shorten: result.name, // onchain에서는 shorten이 없으므로 name 사용
                        description: "",
                        imgUrl: "",
                        youtubeUrl: "",
                        voteCount: Number(result.voteCount),
                        voteRate: Number(result.voteRate) / 100, // 온체인은 basis points로 저장
                        actualVoteCount: Number(result.actualVoteCount),
                    })),
                };
            } else {
                console.warn(
                    `Failed to get onchain result for poll ${pollId}, falling back to offchain data:`,
                    onchainResult.error
                );
            }
        } catch (error) {
            console.error(
                `Error getting onchain result for poll ${pollId}, falling back to offchain data:`,
                error
            );
        }
    }

    // 오프체인 poll이거나 온체인 조회 실패 시 기존 로직 사용
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

export interface GetPlayerPollLogsResponse {
    amount: number;
    optionId: string;
}

export async function getPlayerPollLogs(
    input?: GetPlayerPollLogsInput
): Promise<GetPlayerPollLogsResponse[]> {
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
            select: {
                amount: true,
                optionId: true,
            },
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

                // 전체 베팅 금액 계산 (정수 강제)
                const totalBetAmount = Object.values(betAmounts).reduce(
                    (sum: number, amount: any) =>
                        Math.floor(sum + (amount || 0)),
                    0
                );

                // 승리 옵션들의 총 베팅 금액 계산
                const totalWinningBets = winningOptionIds.reduce(
                    (sum, optionId) =>
                        Math.floor(sum + (betAmounts[optionId] || 0)),
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
                        // updatePlayerAsset 함수 사용으로 안전한 환불 처리 (성능 최적화: 로그 스킵)
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
                        // 🗄️ 나중에 rewardsLog 생성용 데이터
                        rewardsLogData: {
                            pollId,
                            assetId: poll.bettingAssetId,
                            pollTitle: poll.title,
                            refundDetails: allBettors.map((b) => ({
                                playerId: b.playerId,
                                amount: b.amount,
                            })),
                            isRefund: true,
                        },
                    };
                }

                // 배당 풀 계산 (전체 베팅 금액 - 수수료, 정수 강제)
                const payoutPool = Math.floor(totalBetAmount - totalCommission);

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
                    // 개별 승리자의 배당 비율 계산 (정수 강제 - 버림)
                    const winnerBetAmount = winner.amount;
                    const payoutRatio = winnerBetAmount / totalWinningBets;
                    const exactPayout = payoutPool * payoutRatio;
                    const payout = Math.floor(exactPayout); // 정수 버림

                    if (payout > 0) {
                        // updatePlayerAsset 함수 사용으로 안전한 배당 지급 (성능 최적화: 로그 스킵)
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

                        totalActualPayout = Math.floor(
                            totalActualPayout + payout
                        );
                        payoutDetails.push({
                            playerId: winner.playerId,
                            amount: payout,
                        });
                    }
                }

                // 잔여 금액 처리 (정수 강제)
                const remainingAmount = Math.floor(
                    payoutPool - totalActualPayout
                );
                if (remainingAmount > 0) {
                    // 1원 이상의 잔여 금액이 있다면
                    // 가장 큰 배당을 받은 승리자에게 추가 지급
                    const topWinner = payoutDetails.reduce((prev, current) =>
                        prev.amount > current.amount ? prev : current
                    );

                    if (topWinner) {
                        // updatePlayerAsset 함수 사용으로 안전한 잔여 금액 지급 (성능 최적화: 로그 스킵)
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
                    // 🗄️ 나중에 rewardsLog 생성용 데이터
                    rewardsLogData: {
                        pollId,
                        assetId: poll.bettingAssetId,
                        pollTitle: poll.title,
                        payoutDetails,
                        isRefund: false,
                    },
                };
            },
            {
                timeout: 90000, // 90초 타임아웃 설정 (Accelerate 최대 제한)
            }
        );

        // 🗄️ 정산 완료 후 rewardsLog 비동기 생성 (성능 최적화)
        if (result.success && (result as any).rewardsLogData) {
            const logData = (result as any).rewardsLogData;

            // 비동기로 rewardsLog 생성 (정산 완료에 영향 없음)
            setImmediate(async () => {
                try {
                    const logEntries = [];

                    if (logData.isRefund && logData.refundDetails) {
                        // 환불 케이스: 각 환불자에 대해 로그 생성
                        for (const refund of logData.refundDetails) {
                            logEntries.push({
                                playerId: refund.playerId,
                                assetId: logData.assetId,
                                amount: refund.amount,
                                balanceBefore: 0, // 정확한 값은 별도 조회 필요시 추가
                                balanceAfter: refund.amount,
                                pollId: logData.pollId,
                                reason: `Betting refund for poll 『${logData.pollTitle}』 (no winners)`,
                            });
                        }
                    } else if (logData.payoutDetails) {
                        // 배당 케이스: 각 승리자에 대해 로그 생성
                        for (const payout of logData.payoutDetails) {
                            logEntries.push({
                                playerId: payout.playerId,
                                assetId: logData.assetId,
                                amount: payout.amount,
                                balanceBefore: 0, // 정확한 값은 별도 조회 필요시 추가
                                balanceAfter: payout.amount,
                                pollId: logData.pollId,
                                reason: `Betting payout for poll 『${logData.pollTitle}』`,
                            });
                        }
                    }

                    // 배치로 rewardsLog 생성
                    if (logEntries.length > 0) {
                        await prisma.rewardsLog.createMany({
                            data: logEntries,
                            skipDuplicates: true,
                        });
                    }
                } catch (logError) {
                    console.error(
                        `❌ Failed to create rewards logs for poll ${logData.pollId}:`,
                        logError
                    );
                    // 로그 생성 실패는 정산에 영향을 주지 않음
                }
            });
        }

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

export interface BettingSettlementPoll {
    id: string;
    title: string;
    endDate: Date;
    bettingStatus: string;
    isSettled: boolean;
    settledAt: Date | null;
    metadata: any;
    artistId: string | null;
    settlementPhase?: string;
    totalBetAmount: number;
    totalCommission: number;
    optionBetAmounts: any;
    createdAt: Date;
    updatedAt: Date;
}

export async function getPollsForAdmin(): Promise<Poll[]> {
    try {
        const polls = await prisma.poll.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });
        return polls;
    } catch (error) {
        console.error("Error getting polls for admin:", error);
        return [];
    }
}

export async function getBettingSettlementPolls(): Promise<
    BettingSettlementPoll[]
> {
    try {
        const polls = await prisma.poll.findMany({
            where: {
                bettingMode: true,
                isSettled: false,
            },
            select: {
                id: true,
                title: true,
                endDate: true,
                bettingStatus: true,
                isSettled: true,
                settledAt: true,
                metadata: true,
                artistId: true,
                optionBetAmounts: true,
                totalCommissionAmount: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: [{ bettingStatus: "desc" }, { endDate: "asc" }],
        });

        return polls.map((poll) => {
            const metadata = poll.metadata as any;
            const settlementPhase = metadata?.settlementPhase || "PENDING";

            const betAmounts = (poll.optionBetAmounts as any) || {};
            const totalBetAmount = Object.values(betAmounts).reduce(
                (sum: number, amount: any) => sum + (amount || 0),
                0
            );

            return {
                id: poll.id,
                title: poll.title,
                endDate: poll.endDate,
                bettingStatus: poll.bettingStatus,
                isSettled: poll.isSettled,
                settledAt: poll.settledAt,
                metadata: poll.metadata,
                artistId: poll.artistId,
                settlementPhase,
                totalBetAmount,
                totalCommission: poll.totalCommissionAmount || 0,
                optionBetAmounts: poll.optionBetAmounts,
                createdAt: poll.createdAt,
                updatedAt: poll.updatedAt,
            };
        });
    } catch (error) {
        console.error("Error getting betting settlement polls:", error);
        return [];
    }
}

export interface PollOptionForSettlement {
    optionId: string;
    name: string;
    description?: string;
    imgUrl?: string;
    betAmount: number;
    betCount: number;
}

export interface PollForManualSettlement {
    id: string;
    title: string;
    description?: string;
    endDate: Date;
    options: PollOptionForSettlement[];
    totalBetAmount: number;
    totalCommission: number;
    bettingStatus: string;
}

export async function getPollForManualSettlement(
    pollId: string
): Promise<PollForManualSettlement | null> {
    try {
        const poll = await prisma.poll.findUnique({
            where: { id: pollId },
            select: {
                id: true,
                title: true,
                description: true,
                endDate: true,
                options: true,
                optionBetAmounts: true,
                totalCommissionAmount: true,
                bettingStatus: true,
                bettingMode: true,
                isSettled: true,
            },
        });

        if (!poll || !poll.bettingMode || poll.isSettled) {
            return null;
        }

        const betAmounts = (poll.optionBetAmounts as any) || {};
        const totalBetAmount = Object.values(betAmounts).reduce(
            (sum: number, amount: any) => sum + (amount || 0),
            0
        );

        // 각 옵션별 베팅 참가자 수 조회
        const optionBetCounts = await prisma.pollLog.groupBy({
            by: ["optionId"],
            where: {
                pollId: pollId,
            },
            _count: {
                playerId: true,
            },
        });

        const betCountMap: Record<string, number> = {};
        optionBetCounts.forEach((item: any) => {
            if (item.optionId) {
                betCountMap[item.optionId] = item._count.playerId;
            }
        });

        const pollOptions = poll.options as unknown as PollOption[];
        const optionsForSettlement: PollOptionForSettlement[] = pollOptions.map(
            (option) => ({
                optionId: option.optionId,
                name: option.name,
                description: option.description,
                imgUrl: option.imgUrl,
                betAmount:
                    (betAmounts as Record<string, number>)[option.optionId] ||
                    0,
                betCount: betCountMap[option.optionId] || 0,
            })
        );

        return {
            id: poll.id,
            title: poll.title,
            description: poll.description || undefined,
            endDate: poll.endDate,
            options: optionsForSettlement,
            totalBetAmount,
            totalCommission: poll.totalCommissionAmount || 0,
            bettingStatus: poll.bettingStatus,
        };
    } catch (error) {
        console.error("Error getting poll for manual settlement:", error);
        return null;
    }
}

export interface ManualSettlePollInput {
    pollId: string;
    winningOptionIds: string[];
}

export async function manualSettlePoll(
    input: ManualSettlePollInput
): Promise<SettleBettingPollResult> {
    try {
        const result = await settleBettingPoll(input);
        return result;
    } catch (error) {
        console.error("Error in manual settlement:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Manual settlement failed",
        };
    }
}

export interface GetPollDetailInput {
    pollId: string;
}

export type PollDetail = {
    id: string;
    title: string;
    imgUrl: string;
    startDate: Date;
    endDate: Date;
    bettingMode: boolean;
    allowMultipleVote: boolean;
    isOnchain: boolean;
    hasAnswer: boolean;
    needToken: boolean;
    needTokenAddress: string;
    participationRewardAssetId: string;
    participationConsumeAssetId: string;
    participationRewardAmount: number;
    participationConsumeAmount: number;
    bettingAssetId: string;
    options: object;
    artistId: string;
    isActive: boolean;
    test: boolean;
    totalCommissionAmount: number;
    optionBetAmounts: object;
    minimumBet: number;
    maximumBet: number;
    description: string;
    artist: {
        id: string;
        name: string;
        imageUrl: string;
        logoUrl: string;
        code: string;
        backgroundColors: string[];
        foregroundColors: string[];
    };
    participationRewardAsset: {
        id: string;
        name: string;
        symbol: string;
        iconUrl: string;
        imageUrl: string;
    };
    participationConsumeAsset: {
        id: string;
        name: string;
        symbol: string;
        iconUrl: string;
        imageUrl: string;
    };
    bettingAsset: {
        id: string;
        name: string;
        symbol: string;
        iconUrl: string;
        imageUrl: string;
    };
};

export async function getPollDetail(
    input: GetPollDetailInput
): Promise<PollDetail | null> {
    try {
        const poll = await prisma.poll.findUnique({
            cacheStrategy: getCacheStrategy("fiveMinutes"),
            where: { id: input.pollId },
            select: {
                id: true,
                title: true,
                imgUrl: true,
                startDate: true,
                endDate: true,
                bettingMode: true,
                allowMultipleVote: true,
                isOnchain: true,
                hasAnswer: true,
                needToken: true,
                needTokenAddress: true,
                participationRewardAssetId: true,
                participationConsumeAssetId: true,
                participationRewardAmount: true,
                participationConsumeAmount: true,
                bettingAssetId: true,
                options: true,
                artistId: true,
                isActive: true,
                test: true,
                totalCommissionAmount: true,
                optionBetAmounts: true,
                artist: {
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        code: true,
                        logoUrl: true,
                        backgroundColors: true,
                        foregroundColors: true,
                    },
                },
                participationRewardAsset: {
                    select: {
                        id: true,
                        name: true,
                        symbol: true,
                        iconUrl: true,
                        imageUrl: true,
                    },
                },
                participationConsumeAsset: {
                    select: {
                        id: true,
                        name: true,
                        symbol: true,
                        iconUrl: true,
                        imageUrl: true,
                    },
                },
                bettingAsset: {
                    select: {
                        id: true,
                        name: true,
                        symbol: true,
                        iconUrl: true,
                        imageUrl: true,
                    },
                },
            },
        });

        return poll as PollDetail;
    } catch (error) {
        console.error("Error getting poll detail:", error);
        return null;
    }
}
