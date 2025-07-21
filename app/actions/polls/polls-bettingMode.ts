/// app/actions/polls/polls-bettingMode.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";
import {
    createBettingWinNotification,
    createBettingFailedNotification,
    createBettingRefundNotification,
} from "@/app/actions/notification/actions";
import { updatePlayerAsset } from "@/app/actions/playerAssets/actions";
import { settlementCacheManager } from "@/lib/utils/formatting";

interface SettlementValidationInput {
    playerId: string;
    pollId: string;
    playerBets: any[];
    winningOptionIds: string[];
    calculationDetails: any;
    totalAmount: number;
    sharedData: any;
}

interface SettlementValidationResult {
    isValid: boolean;
    warnings: string[];
    errors: string[];
    calculationSummary: any;
}

function validateSettlementCalculation(
    input: SettlementValidationInput
): SettlementValidationResult {
    const {
        playerId,
        playerBets,
        winningOptionIds,
        calculationDetails,
        totalAmount,
        sharedData,
    } = input;
    const warnings: string[] = [];
    const errors: string[] = [];

    // 1. 기본 검증
    if (totalAmount < 0) {
        errors.push(`Negative settlement amount: ${totalAmount}`);
    }

    if (playerBets.length === 0) {
        warnings.push("No bets found for player");
    }

    // 2. 계산 일관성 검증
    const expectedTotalBet = playerBets.reduce(
        (sum, bet) => sum + bet.amount,
        0
    );
    if (expectedTotalBet !== calculationDetails.playerTotalBet) {
        errors.push(
            `Bet amount mismatch: expected ${expectedTotalBet}, got ${calculationDetails.playerTotalBet}`
        );
    }

    // 3. 승리 베팅 검증
    const expectedWinningAmount = playerBets
        .filter((bet) => winningOptionIds.includes(bet.optionId))
        .reduce((sum, bet) => sum + bet.amount, 0);

    if (calculationDetails.playerWinningBet !== expectedWinningAmount) {
        errors.push(
            `Winning bet mismatch: expected ${expectedWinningAmount}, got ${calculationDetails.playerWinningBet}`
        );
    }

    // 4. 페이아웃 계산 검증
    if (calculationDetails.type === "PAYOUT") {
        const expectedRatio =
            calculationDetails.playerWinningBet /
            sharedData.totalWinningBetAmount;
        const expectedPayout = Math.floor(
            sharedData.totalPayoutPool * expectedRatio
        );

        if (Math.abs(calculationDetails.finalPayout - expectedPayout) > 1) {
            // 1원 오차 허용
            errors.push(
                `Payout calculation error: expected ${expectedPayout}, got ${calculationDetails.finalPayout}`
            );
        }
    }

    // 5. 환불 검증
    if (calculationDetails.type === "REFUND") {
        if (
            calculationDetails.refundAmount !==
            calculationDetails.playerTotalBet
        ) {
            errors.push(
                `Refund amount incorrect: expected ${calculationDetails.playerTotalBet}, got ${calculationDetails.refundAmount}`
            );
        }
    }

    const calculationSummary = {
        playerId: playerId.slice(-6),
        type: calculationDetails.type,
        totalBetAmount: calculationDetails.playerTotalBet,
        winningAmount: calculationDetails.playerWinningBet || 0,
        payoutAmount: calculationDetails.finalPayout || 0,
        refundAmount: calculationDetails.refundAmount || 0,
        totalSettlement: totalAmount,
        ratio: calculationDetails.payoutRatio || 0,
    };

    return {
        isValid: errors.length === 0,
        warnings,
        errors,
        calculationSummary,
    };
}

export interface BettingModeStats {
    totalParticipants: number;
    totalBets: number;
    totalAmount: number;
    averageBetAmount: number;
    topBettors: Array<{
        playerId: string;
        nickname: string | null;
        totalAmount: number;
        betCount: number;
    }>;
    optionStats: Array<{
        optionId: string;
        totalAmount: number;
        participantCount: number;
        averageAmount: number;
    }>;
}

export interface SettlementPreview {
    pollId: string;
    pollTitle: string;
    totalBetAmount: number;
    totalCommission: number;
    payoutPool: number;
    optionResults: Array<{
        optionId: string;
        optionName: string;
        totalBetAmount: number;
        participantCount: number;
        averageBetAmount: number;
    }>;
    potentialWinners: Array<{
        optionId: string;
        optionName: string;
        totalBetAmount: number;
        participantCount: number;
        estimatedPayout: number;
    }>;
    potentialRefund: {
        totalAmount: number;
        participantCount: number;
    };
    settlementRules: {
        houseCommissionRate: number;
        minimumBet: number;
        maximumBet: number;
    };
}

export async function getBettingModePolls() {
    try {
        const polls = await prisma.poll.findMany({
            cacheStrategy: getCacheStrategy("realtime"),
            where: {
                bettingMode: true,
            },
            select: {
                id: true,
                title: true,
                titleShorten: true,
                startDate: true,
                endDate: true,
                status: true,
                bettingStatus: true,
                totalVotes: true,
                totalBetsAmount: true,
                minimumBet: true,
                maximumBet: true,
                houseCommissionRate: true,
                totalCommissionAmount: true,
                isSettled: true,
                winningOptionId: true,
                options: true,
                createdAt: true,
                bettingAssetId: true,
            },
            orderBy: [
                { status: "desc" },
                { endDate: "desc" },
                { createdAt: "desc" },
            ],
        });

        return polls;
    } catch (error) {
        console.error("Error fetching betting mode polls:", error);
        return [];
    }
}

export interface GetBettingModeResultInput {
    pollId: string;
    page?: number;
    limit?: number;
}

export interface BettingModeResult {
    poll: {
        id: string;
        title: string;
        titleShorten: string | null;
        status: string;
        bettingStatus: string;
        totalBetsAmount: number;
        totalVotes: number;
        optionBetAmounts: any;
        totalCommissionAmount: number;
        houseCommissionRate: number;
        isSettled: boolean;
        winningOptionId: string | null;
        settledAt: Date | null;
        settledBy: string | null;
    };
    pollLogs: Array<{
        id: string;
        playerId: string;
        optionId: string;
        amount: number;
        createdAt: Date;
        player: {
            id: string;
            userId: string;
            nickname: string | null;
        };
        option: any;
    }>;
    summary: {
        totalParticipants: number;
        totalBets: number;
        optionSummary: Array<{
            optionId: string;
            optionText: string;
            totalAmount: number;
            participantCount: number;
        }>;
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export async function getBettingModeResult(
    input: GetBettingModeResultInput
): Promise<BettingModeResult> {
    const page = input.page || 1;
    const limit = input.limit || 50;
    const offset = (page - 1) * limit;

    // 폴 정보 가져오기
    const poll = await prisma.poll.findUnique({
        where: {
            id: input.pollId,
            bettingMode: true,
        },
        select: {
            id: true,
            title: true,
            titleShorten: true,
            status: true,
            bettingStatus: true,
            totalBetsAmount: true,
            totalVotes: true,
            optionBetAmounts: true,
            totalCommissionAmount: true,
            houseCommissionRate: true,
            isSettled: true,
            winningOptionId: true,
            settledAt: true,
            settledBy: true,
        },
    });

    if (!poll) {
        throw new Error("Betting mode poll not found");
    }

    // 전체 베팅 로그 수 (페이지네이션용)
    const totalLogs = await prisma.pollLog.count({
        where: {
            pollId: input.pollId,
        },
    });

    // 베팅 로그 가져오기 (페이지네이션 적용)
    const pollLogs = await prisma.pollLog.findMany({
        where: {
            pollId: input.pollId,
        },
        include: {
            player: {
                select: {
                    id: true,
                    userId: true,
                    nickname: true,
                },
            },
        },
        select: {
            id: true,
            playerId: true,
            optionId: true,
            amount: true,
            createdAt: true,
            option: true,
            player: {
                select: {
                    id: true,
                    userId: true,
                    nickname: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        skip: offset,
        take: limit,
    });

    // 데이터베이스 레벨에서 옵션별 집계 (대용량 데이터 최적화)
    const optionAggregates = await prisma.pollLog.groupBy({
        by: ["optionId"],
        where: {
            pollId: input.pollId,
        },
        _sum: {
            amount: true,
        },
        _count: {
            playerId: true,
        },
    });

    // 고유 참여자 수 (데이터베이스 레벨 집계)
    const uniqueParticipants = await prisma.pollLog.groupBy({
        by: ["playerId"],
        where: {
            pollId: input.pollId,
        },
        _count: {
            playerId: true,
        },
    });

    // 옵션 정보 가져오기 (첫 번째 로그에서 추출)
    const firstLog = pollLogs[0];
    const optionsMap = new Map<string, string>();

    if (firstLog) {
        // 옵션 정보를 JSON에서 추출
        const pollOptions = poll.optionBetAmounts as any;
        if (pollOptions) {
            Object.keys(pollOptions).forEach((optionId) => {
                optionsMap.set(optionId, optionId); // 기본값으로 optionId 사용
            });
        }
    }

    // 옵션별 요약 생성
    const optionSummary = optionAggregates.map((aggregate: any) => ({
        optionId: aggregate.optionId,
        optionText: optionsMap.get(aggregate.optionId) || aggregate.optionId,
        totalAmount: aggregate._sum?.amount || 0,
        participantCount: aggregate._count?.playerId || 0,
    }));

    return {
        poll,
        pollLogs: pollLogs as any, // 타입 캐스팅으로 임시 해결
        summary: {
            totalParticipants: uniqueParticipants.length,
            totalBets: totalLogs,
            optionSummary,
        },
        pagination: {
            page,
            limit,
            total: totalLogs,
            totalPages: Math.ceil(totalLogs / limit),
        },
    };
}

// 대용량 데이터를 위한 추가 함수들
export interface GetBettingModeStatsInput {
    pollId: string;
}

export async function getBettingModeStats({
    pollId,
}: {
    pollId: string;
}): Promise<BettingModeStats> {
    try {
        const poll = await prisma.poll.findUnique({
            cacheStrategy: getCacheStrategy("realtime"),
            where: { id: pollId },
            select: {
                id: true,
                title: true,
                options: true,
                totalBetsAmount: true,
                houseCommissionRate: true,
            },
        });

        if (!poll) {
            throw new Error("Poll not found");
        }

        const pollLogs = await prisma.pollLog.findMany({
            cacheStrategy: getCacheStrategy("realtime"),
            where: { pollId },
            select: {
                id: true,
                playerId: true,
                optionId: true,
                amount: true,
                player: {
                    select: {
                        nickname: true,
                    },
                },
            },
        });

        const totalParticipants = new Set(pollLogs.map((log) => log.playerId))
            .size;
        const totalBets = pollLogs.length;
        const totalAmount = pollLogs.reduce((sum, log) => sum + log.amount, 0);
        const averageBetAmount =
            totalBets > 0 ? Math.floor(totalAmount / totalBets) : 0;

        const playerStats = new Map<
            string,
            {
                playerId: string;
                nickname: string | null;
                totalAmount: number;
                betCount: number;
            }
        >();

        for (const log of pollLogs) {
            const existing = playerStats.get(log.playerId);
            if (existing) {
                existing.totalAmount += log.amount;
                existing.betCount += 1;
            } else {
                playerStats.set(log.playerId, {
                    playerId: log.playerId,
                    nickname: log.player.nickname,
                    totalAmount: log.amount,
                    betCount: 1,
                });
            }
        }

        const topBettors = Array.from(playerStats.values())
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .slice(0, 10);

        const optionStats = new Map<
            string,
            {
                optionId: string;
                totalAmount: number;
                participantCount: number;
                averageAmount: number;
            }
        >();

        for (const log of pollLogs) {
            const existing = optionStats.get(log.optionId);
            if (existing) {
                existing.totalAmount += log.amount;
                existing.participantCount += 1;
            } else {
                optionStats.set(log.optionId, {
                    optionId: log.optionId,
                    totalAmount: log.amount,
                    participantCount: 1,
                    averageAmount: log.amount,
                });
            }
        }

        for (const stat of optionStats.values()) {
            stat.averageAmount = Math.floor(
                stat.totalAmount / stat.participantCount
            );
        }

        return {
            totalParticipants,
            totalBets,
            totalAmount,
            averageBetAmount,
            topBettors,
            optionStats: Array.from(optionStats.values()),
        };
    } catch (error) {
        console.error("Error fetching betting mode stats:", error);
        throw error;
    }
}

export async function getSettlementPreview({
    pollId,
    winningOptionIds,
}: {
    pollId: string;
    winningOptionIds: string[];
}): Promise<SettlementPreview> {
    try {
        const poll = await prisma.poll.findUnique({
            cacheStrategy: getCacheStrategy("realtime"),
            where: { id: pollId },
            select: {
                id: true,
                title: true,
                options: true,
                totalVotes: true, // 🔄 totalBetsAmount → totalVotes 마이그레이션
                totalCommissionAmount: true,
                houseCommissionRate: true,
                minimumBet: true,
                maximumBet: true,
            },
        });

        if (!poll) {
            throw new Error("Poll not found");
        }

        const pollLogs = await prisma.pollLog.findMany({
            cacheStrategy: getCacheStrategy("realtime"),
            where: { pollId },
            select: {
                id: true,
                playerId: true,
                optionId: true,
                amount: true,
            },
        });

        const totalBetAmount = pollLogs.reduce(
            (sum, log) => sum + log.amount,
            0
        );
        const totalCommission = poll.totalCommissionAmount || 0;
        const payoutPool = totalBetAmount - totalCommission;

        const optionResults = new Map<
            string,
            {
                optionId: string;
                optionName: string;
                totalBetAmount: number;
                participantCount: number;
                averageBetAmount: number;
            }
        >();

        for (const log of pollLogs) {
            const existing = optionResults.get(log.optionId);
            if (existing) {
                existing.totalBetAmount += log.amount;
                existing.participantCount += 1;
            } else {
                const optionName =
                    (
                        poll.options as Array<{
                            optionId: string;
                            name: string;
                        }>
                    ).find((opt) => opt.optionId === log.optionId)?.name ||
                    log.optionId;

                optionResults.set(log.optionId, {
                    optionId: log.optionId,
                    optionName,
                    totalBetAmount: log.amount,
                    participantCount: 1,
                    averageBetAmount: log.amount,
                });
            }
        }

        for (const result of optionResults.values()) {
            result.averageBetAmount = Math.floor(
                result.totalBetAmount / result.participantCount
            );
        }

        const potentialWinners = winningOptionIds
            .map((optionId) => {
                const result = optionResults.get(optionId);
                if (!result) return null;

                const totalWinningBets = winningOptionIds.reduce(
                    (sum, id) =>
                        sum + (optionResults.get(id)?.totalBetAmount || 0),
                    0
                );

                const payoutRatio = result.totalBetAmount / totalWinningBets;
                const estimatedPayout = Math.floor(payoutPool * payoutRatio);

                return {
                    optionId: result.optionId,
                    optionName: result.optionName,
                    totalBetAmount: result.totalBetAmount,
                    participantCount: result.participantCount,
                    estimatedPayout,
                };
            })
            .filter(Boolean) as Array<{
            optionId: string;
            optionName: string;
            totalBetAmount: number;
            participantCount: number;
            estimatedPayout: number;
        }>;

        const potentialRefund = {
            totalAmount: totalBetAmount,
            participantCount: pollLogs.length,
        };

        return {
            pollId,
            pollTitle: poll.title,
            totalBetAmount,
            totalCommission,
            payoutPool,
            optionResults: Array.from(optionResults.values()),
            potentialWinners,
            potentialRefund,
            settlementRules: {
                houseCommissionRate: poll.houseCommissionRate,
                minimumBet: poll.minimumBet,
                maximumBet: poll.maximumBet,
            },
        };
    } catch (error) {
        console.error("Error getting settlement preview:", error);
        throw error;
    }
}

export interface SettlementSinglePlayerInput {
    pollId: string;
    playerId: string;
    optionId: string;
    betAmount: number;
    isWinner: boolean;
    payoutAmount?: number;
    winningOptionIds: string[];
}

export interface SettlementSinglePlayerResult {
    success: boolean;
    message?: string;
    error?: string;
    notificationSent?: boolean;
}

export interface SettlementAmountResult {
    success: boolean;
    playerId: string;
    pollId: string;
    totalBetAmount: number;
    winningBets: Array<{
        optionId: string;
        betAmount: number;
        isWinningOption: boolean;
    }>;
    payoutAmount: number;
    refundAmount: number;
    commissionAmount: number;
    pollTotalBetAmount: number;
    totalWinningBetAmount: number;
    rewardLogIssue?: {
        pollLogAmount: number;
        rewardLogDeduction: number;
        missingAmount: number;
        rewardLogs: Array<{
            id: string;
            amount: number;
            createdAt: Date;
            reason: string | null;
        }>;
    };
    error?: string;
}

export interface GetPollParticipantsInput {
    pollId: string;
    page?: number;
    limit?: number;
    sortBy?: "totalAmount" | "betCount" | "createdAt";
    sortOrder?: "asc" | "desc";
}

export interface PollParticipant {
    playerId: string;
    nickname: string | null;
    totalBetAmount: number;
    betCount: number;
    firstBetAt: Date;
    lastBetAt: Date;
    betOptions: Array<{
        optionId: string;
        amount: number;
    }>;
}

export interface GetPollParticipantsResult {
    success: boolean;
    participants: PollParticipant[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    summary: {
        totalParticipants: number;
        totalBetAmount: number;
        totalBetCount: number;
    };
    error?: string;
}

export async function getPollParticipants({
    pollId,
    page = 1,
    limit = 20,
    sortBy = "totalAmount",
    sortOrder = "desc",
}: GetPollParticipantsInput): Promise<GetPollParticipantsResult> {
    try {
        const poll = await prisma.poll.findUnique({
            cacheStrategy: getCacheStrategy("realtime"),
            where: { id: pollId },
            select: {
                id: true,
                title: true,
                bettingMode: true,
            },
        });

        if (!poll || !poll.bettingMode) {
            return {
                success: false,
                participants: [],
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false,
                },
                summary: {
                    totalParticipants: 0,
                    totalBetAmount: 0,
                    totalBetCount: 0,
                },
                error: "Invalid betting poll",
            };
        }

        const offset = (page - 1) * limit;

        const totalParticipants = await prisma.pollLog.groupBy({
            by: ["playerId"],
            where: { pollId },
            _count: { playerId: true },
        });

        const totalBetAmount = (await prisma.pollLog.aggregate({
            where: { pollId },
            _sum: { amount: true },
        })) as { _sum: { amount: number | null } };

        const totalBetCount = await prisma.pollLog.count({
            where: { pollId },
        });

        const participantAggregates = (await prisma.pollLog.groupBy({
            by: ["playerId"],
            where: { pollId },
            _sum: { amount: true },
            _count: { id: true },
            _min: { createdAt: true },
            _max: { createdAt: true },
        })) as Array<{
            playerId: string;
            _sum: { amount: number | null };
            _count: { id: number };
            _min: { createdAt: Date | null };
            _max: { createdAt: Date | null };
        }>;

        const sortedParticipants = participantAggregates.sort((a, b) => {
            let aValue: number;
            let bValue: number;

            switch (sortBy) {
                case "totalAmount":
                    aValue = a._sum.amount || 0;
                    bValue = b._sum.amount || 0;
                    break;
                case "betCount":
                    aValue = a._count.id || 0;
                    bValue = b._count.id || 0;
                    break;
                case "createdAt":
                    aValue = a._min.createdAt?.getTime() || 0;
                    bValue = b._min.createdAt?.getTime() || 0;
                    break;
                default:
                    aValue = a._sum.amount || 0;
                    bValue = b._sum.amount || 0;
            }

            return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
        });

        const paginatedParticipants = sortedParticipants.slice(
            offset,
            offset + limit
        );

        const participantIds = paginatedParticipants.map((p) => p.playerId);

        const participantDetails = await prisma.player.findMany({
            where: { id: { in: participantIds } },
            select: {
                id: true,
                nickname: true,
            },
        });

        const participantDetailsMap = new Map(
            participantDetails.map((p) => [p.id, p.nickname])
        );

        const participants: PollParticipant[] = paginatedParticipants.map(
            (p) => ({
                playerId: p.playerId,
                nickname: participantDetailsMap.get(p.playerId) || null,
                totalBetAmount: p._sum.amount || 0,
                betCount: p._count.id || 0,
                firstBetAt: p._min.createdAt || new Date(),
                lastBetAt: p._max.createdAt || new Date(),
                betOptions: [], // 개별 옵션 정보는 필요시 별도 쿼리
            })
        );

        const totalPages = Math.ceil(totalParticipants.length / limit);

        return {
            success: true,
            participants,
            pagination: {
                page,
                limit,
                total: totalParticipants.length,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
            summary: {
                totalParticipants: totalParticipants.length,
                totalBetAmount:
                    (totalBetAmount._sum as { amount: number | null })
                        ?.amount || 0,
                totalBetCount,
            },
        };
    } catch (error) {
        console.error("Error fetching poll participants:", error);
        return {
            success: false,
            participants: [],
            pagination: {
                page: 1,
                limit: 20,
                total: 0,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
            },
            summary: {
                totalParticipants: 0,
                totalBetAmount: 0,
                totalBetCount: 0,
            },
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch participants",
        };
    }
}

export async function getSettlementAmountSinglePlayer({
    pollId,
    playerId,
    winningOptionIds,
}: {
    pollId: string;
    playerId: string;
    winningOptionIds: string[];
}): Promise<SettlementAmountResult> {
    try {
        const poll = await prisma.poll.findUnique({
            cacheStrategy: getCacheStrategy("realtime"),
            where: { id: pollId },
            select: {
                id: true,
                title: true,
                bettingMode: true,
                houseCommissionRate: true,
                totalBetsAmount: true,
                totalCommissionAmount: true,
                bettingAssetId: true,
            },
        });

        if (!poll || !poll.bettingMode) {
            return {
                success: false,
                playerId,
                pollId,
                totalBetAmount: 0,
                winningBets: [],
                payoutAmount: 0,
                refundAmount: 0,
                commissionAmount: 0,
                pollTotalBetAmount: 0,
                totalWinningBetAmount: 0,
                error: "Invalid betting poll",
            };
        }

        const playerBets = await prisma.pollLog.findMany({
            cacheStrategy: getCacheStrategy("realtime"),
            where: {
                pollId,
                playerId,
            },
            select: {
                id: true,
                optionId: true,
                amount: true,
            },
        });

        if (playerBets.length === 0) {
            return {
                success: true,
                playerId,
                pollId,
                totalBetAmount: 0,
                winningBets: [],
                payoutAmount: 0,
                refundAmount: 0,
                commissionAmount: 0,
                pollTotalBetAmount: 0,
                totalWinningBetAmount: 0,
            };
        }

        const totalBetAmount = playerBets.reduce(
            (sum, bet) => sum + bet.amount,
            0
        );

        // rewardLog 확인 - 베팅 기록이 실제로 차감되었는지 확인
        const bettingRewardLogs = await prisma.rewardsLog.findMany({
            where: {
                pollId: pollId,
                playerId: playerId,
                assetId: poll.bettingAssetId,
                reason: { contains: "Betting on poll" }, // 베팅 차감만 필터링
            },
            select: {
                id: true,
                amount: true,
                createdAt: true,
                reason: true,
            },
        });

        const totalBettingDeduction = bettingRewardLogs.reduce(
            (sum, log) => sum + log.amount,
            0
        );

        const hasRewardLogIssue = totalBettingDeduction !== totalBetAmount;

        const winningBets = playerBets.map((bet) => ({
            optionId: bet.optionId,
            betAmount: bet.amount,
            isWinningOption: winningOptionIds.includes(bet.optionId),
        }));

        const playerWinningBets = winningBets.filter(
            (bet) => bet.isWinningOption
        );
        const playerWinningAmount = playerWinningBets.reduce(
            (sum, bet) => sum + bet.betAmount,
            0
        );

        let payoutAmount = 0;
        let refundAmount = 0;

        if (winningOptionIds.length === 0) {
            refundAmount = totalBetAmount;
        } else {
            const hasWinningBets = playerWinningAmount > 0;

            if (hasWinningBets) {
                // 실제 폴의 총 베팅 금액 계산
                const actualTotalBets = await prisma.pollLog.aggregate({
                    where: { pollId },
                    _sum: { amount: true },
                });
                const actualTotalBetAmount =
                    (actualTotalBets._sum as { amount: number }).amount || 0;

                const totalPayoutPool = Math.max(
                    0,
                    actualTotalBetAmount - (poll.totalCommissionAmount || 0)
                );

                if (playerWinningAmount > 0) {
                    // 전체 승리 베팅 금액 계산
                    const totalWinningBetsInPoll =
                        await prisma.pollLog.aggregate({
                            where: {
                                pollId,
                                optionId: { in: winningOptionIds },
                            },
                            _sum: {
                                amount: true,
                            },
                        });
                    const totalWinningAmount =
                        (totalWinningBetsInPoll._sum as { amount: number })
                            .amount || 0;

                    // 배당 비율 수정: 플레이어의 승리 베팅 / 전체 승리 베팅
                    const payoutRatio =
                        playerWinningAmount / totalWinningAmount;
                    const calculatedPayout = Math.floor(
                        totalPayoutPool * payoutRatio
                    );

                    payoutAmount = Math.max(0, calculatedPayout);
                }
            }
        }

        const commissionAmount = 0;

        // 실제 폴의 총 베팅 금액 계산
        const actualTotalBets = await prisma.pollLog.aggregate({
            where: { pollId },
            _sum: { amount: true },
        });
        const pollTotalBetAmount =
            (actualTotalBets._sum as { amount: number }).amount || 0;

        // 전체 승리 베팅 금액 계산
        const totalWinningBetsInPoll = await prisma.pollLog.aggregate({
            where: {
                pollId,
                optionId: { in: winningOptionIds },
            },
            _sum: {
                amount: true,
            },
        });
        const totalWinningBetAmount =
            (totalWinningBetsInPoll._sum as { amount: number }).amount || 0;

        return {
            success: true,
            playerId,
            pollId,
            totalBetAmount,
            winningBets,
            payoutAmount,
            refundAmount,
            commissionAmount,
            pollTotalBetAmount,
            totalWinningBetAmount,
            rewardLogIssue: hasRewardLogIssue
                ? {
                      pollLogAmount: totalBetAmount,
                      rewardLogDeduction: totalBettingDeduction,
                      missingAmount: totalBetAmount - totalBettingDeduction,
                      rewardLogs: bettingRewardLogs,
                  }
                : undefined,
        };
    } catch (error) {
        console.error("Error calculating settlement amount:", error);
        return {
            success: false,
            playerId,
            pollId,
            totalBetAmount: 0,
            winningBets: [],
            payoutAmount: 0,
            refundAmount: 0,
            commissionAmount: 0,
            pollTotalBetAmount: 0,
            totalWinningBetAmount: 0,
            error:
                error instanceof Error ? error.message : "Calculation failed",
        };
    }
}

export async function settlementSinglePlayer(
    input: SettlementSinglePlayerInput
): Promise<SettlementSinglePlayerResult> {
    try {
        const { pollId, playerId, winningOptionIds } = input;

        const poll = await prisma.poll.findUnique({
            cacheStrategy: getCacheStrategy("realtime"),
            where: { id: pollId },
            select: {
                id: true,
                title: true,
                bettingMode: true,
                bettingAssetId: true,
            },
        });

        if (!poll || !poll.bettingMode) {
            return {
                success: false,
                error: "Invalid betting poll",
            };
        }

        const result = await processSinglePlayerSettlement(
            pollId,
            playerId,
            winningOptionIds,
            poll
        );

        return {
            success: result.success,
            message: result.message,
            error: result.error,
            notificationSent: result.notificationSent,
        };
    } catch (error) {
        console.error("Error in settlementSinglePlayer:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Settlement notification failed",
        };
    }
}

export interface BulkSettlementInput {
    pollId: string;
    playerIds: string[];
    winningOptionIds: string[];
}

export interface BulkSettlementConfig {
    batchSize?: number;
    maxConcurrent?: number;
    delayBetweenBatches?: number;
    retryAttempts?: number;
    retryDelay?: number;
}

export interface BulkSettlementResult {
    success: boolean;
    message?: string;
    error?: string;
    results: Array<{
        playerId: string;
        success: boolean;
        message?: string;
        error?: string;
        settlementAmount: number;
        notificationSent: boolean;
    }>;
    summary: {
        totalProcessed: number;
        totalSuccess: number;
        totalFailed: number;
        totalSettlementAmount: number;
    };
}

export async function bulkSettlementPlayersOptimized(
    input: BulkSettlementInput
): Promise<BulkSettlementResult> {
    const { batchSize = 30, delayBetweenBatches = 50 } = {};

    try {
        const { pollId, playerIds, winningOptionIds } = input;

        const poll = await prisma.poll.findUnique({
            cacheStrategy: getCacheStrategy("realtime"),
            where: { id: pollId },
            select: {
                id: true,
                title: true,
                bettingMode: true,
                bettingAssetId: true,
                totalCommissionAmount: true,
                houseCommissionRate: true,
            },
        });

        if (!poll || !poll.bettingMode) {
            return {
                success: false,
                error: "Invalid betting poll",
                results: [],
                summary: {
                    totalProcessed: 0,
                    totalSuccess: 0,
                    totalFailed: 0,
                    totalSettlementAmount: 0,
                },
            };
        }

        // 🚀 성능 최적화: 공통 데이터 사전 계산 (캐싱 적용)

        const cachedCommonData = await settlementCacheManager.getCommonData(
            pollId,
            winningOptionIds,
            async () => {
                const [actualTotalBets, totalWinningBetsInPoll] =
                    await Promise.all([
                        // 전체 베팅 총액
                        prisma.pollLog.aggregate({
                            where: { pollId },
                            _sum: { amount: true },
                        }),
                        // 승리 옵션 베팅 총액
                        winningOptionIds.length > 0
                            ? prisma.pollLog.aggregate({
                                  where: {
                                      pollId,
                                      optionId: { in: winningOptionIds },
                                  },
                                  _sum: { amount: true },
                              })
                            : Promise.resolve({ _sum: { amount: 0 } }),
                    ]);

                const pollTotalBetAmount =
                    (actualTotalBets._sum as { amount: number }).amount || 0;
                const totalWinningBetAmount =
                    (totalWinningBetsInPoll._sum as { amount: number })
                        .amount || 0;
                const totalPayoutPool = Math.max(
                    0,
                    pollTotalBetAmount - (poll.totalCommissionAmount || 0)
                );

                return {
                    poll,
                    pollTotalBetAmount,
                    totalWinningBetAmount,
                    totalPayoutPool,
                };
            }
        );

        // 공통 계산 데이터
        const sharedCalculationData = {
            poll: cachedCommonData.poll,
            pollTotalBetAmount: cachedCommonData.pollTotalBetAmount,
            totalWinningBetAmount: cachedCommonData.totalWinningBetAmount,
            totalPayoutPool: cachedCommonData.totalPayoutPool,
            winningOptionIds,
        };

        const results = [];
        let totalSuccess = 0;
        let totalFailed = 0;
        let totalSettlementAmount = 0;

        // 배치 처리로 성능 최적화
        for (let i = 0; i < playerIds.length; i += batchSize) {
            const batch = playerIds.slice(i, i + batchSize);

            const batchPromises = batch.map((playerId) =>
                processSinglePlayerSettlementOptimized(
                    playerId,
                    sharedCalculationData
                )
            );

            const batchResults = await Promise.allSettled(batchPromises);

            for (const result of batchResults) {
                if (result.status === "fulfilled") {
                    const settlementResult = result.value;
                    results.push(settlementResult);

                    if (settlementResult.success) {
                        totalSuccess++;
                        totalSettlementAmount +=
                            settlementResult.settlementAmount;
                    } else {
                        totalFailed++;
                    }
                } else {
                    totalFailed++;
                    results.push({
                        playerId: "unknown",
                        success: false,
                        error: result.reason?.message || "Promise rejected",
                        settlementAmount: 0,
                        notificationSent: false,
                    });
                }
            }

            if (i + batchSize < playerIds.length && delayBetweenBatches > 0) {
                await new Promise((resolve) =>
                    setTimeout(resolve, delayBetweenBatches)
                );
            }
        }

        return {
            success: totalFailed === 0,
            message: `Optimized bulk settlement completed. ${totalSuccess} successful, ${totalFailed} failed.`,
            results,
            summary: {
                totalProcessed: playerIds.length,
                totalSuccess,
                totalFailed,
                totalSettlementAmount,
            },
        };
    } catch (error) {
        console.error("Error in optimized bulk settlement:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Bulk settlement failed",
            results: [],
            summary: {
                totalProcessed: 0,
                totalSuccess: 0,
                totalFailed: 0,
                totalSettlementAmount: 0,
            },
        };
    }
}

// 최적화된 단일 플레이어 정산 (공통 데이터 재사용)
async function processSinglePlayerSettlementOptimized(
    playerId: string,
    sharedData: {
        poll: any;
        pollTotalBetAmount: number;
        totalWinningBetAmount: number;
        totalPayoutPool: number;
        winningOptionIds: string[];
    }
): Promise<{
    playerId: string;
    success: boolean;
    message?: string;
    error?: string;
    settlementAmount: number;
    notificationSent: boolean;
    calculationDetails?: any;
    validationResult?: SettlementValidationResult;
}> {
    try {
        const {
            poll,
            totalWinningBetAmount,
            totalPayoutPool,
            winningOptionIds,
        } = sharedData;

        // 플레이어별 개별 데이터만 조회 (공통 데이터는 재사용)
        const [playerBets] = await Promise.all([
            prisma.pollLog.findMany({
                cacheStrategy: getCacheStrategy("realtime"),
                where: {
                    pollId: poll.id,
                    playerId,
                },
                select: {
                    id: true,
                    optionId: true,
                    amount: true,
                },
            }),
        ]);

        if (playerBets.length === 0) {
            return {
                playerId,
                success: true,
                message: "No bets found",
                settlementAmount: 0,
                notificationSent: false,
            };
        }

        const totalBetAmount = playerBets.reduce(
            (sum, bet) => sum + bet.amount,
            0
        );

        const winningBets = playerBets.map((bet) => ({
            optionId: bet.optionId,
            betAmount: bet.amount,
            isWinningOption: winningOptionIds.includes(bet.optionId),
        }));

        const playerWinningAmount = winningBets
            .filter((bet) => bet.isWinningOption)
            .reduce((sum, bet) => sum + bet.betAmount, 0);

        let payoutAmount = 0;
        let refundAmount = 0;
        let calculationDetails: any = {};

        if (winningOptionIds.length === 0) {
            // 무승부 - 전액 환불
            refundAmount = totalBetAmount;
            calculationDetails = {
                type: "REFUND",
                reason: "No winning options - full refund",
                playerTotalBet: totalBetAmount,
                refundAmount: refundAmount,
                payoutAmount: 0,
            };
        } else if (playerWinningAmount > 0 && totalWinningBetAmount > 0) {
            // 승리 - 배당 지급
            const payoutRatio = playerWinningAmount / totalWinningBetAmount;
            const calculatedPayout = Math.floor(totalPayoutPool * payoutRatio);
            payoutAmount = Math.max(0, calculatedPayout);

            calculationDetails = {
                type: "PAYOUT",
                reason: "Player won - payout calculated",
                playerTotalBet: totalBetAmount,
                playerWinningBet: playerWinningAmount,
                payoutRatio: payoutRatio,
                rawPayout: totalPayoutPool * payoutRatio,
                finalPayout: payoutAmount,
                totalPayoutPool: totalPayoutPool,
                totalWinningBetAmount: totalWinningBetAmount,
                winningBets: winningBets.filter((bet) => bet.isWinningOption),
                losingBets: winningBets.filter((bet) => !bet.isWinningOption),
            };
        } else {
            // 패배 - 정산 없음
            calculationDetails = {
                type: "LOSS",
                reason: "Player did not win",
                playerTotalBet: totalBetAmount,
                playerWinningBet: playerWinningAmount,
                payoutAmount: 0,
                refundAmount: 0,
                allBets: winningBets,
            };
        }

        const totalAmount = payoutAmount + refundAmount;

        // 🔍 정산 계산 검증
        const validationResult = validateSettlementCalculation({
            playerId,
            pollId: poll.id,
            playerBets,
            winningOptionIds,
            calculationDetails,
            totalAmount,
            sharedData,
        });

        if (totalAmount > 0) {
            // 실제 정산 처리 (기존 로직 사용)
            const payoutResult = await updatePlayerAsset({
                transaction: {
                    playerId: playerId,
                    assetId: poll.bettingAssetId,
                    amount: totalAmount,
                    operation: "ADD",
                    reason: `Betting payout for poll 『${poll.title}』`,
                    metadata: {
                        pollId: poll.id,
                        payoutAmount,
                        refundAmount,
                        isOptimizedSettlement: true,
                    },
                    pollId: poll.id,
                },
            });

            if (!payoutResult.success) {
                return {
                    playerId,
                    success: false,
                    error: `Payout failed: ${payoutResult.error}`,
                    settlementAmount: 0,
                    notificationSent: false,
                };
            }
        }

        return {
            playerId,
            success: true,
            message:
                totalAmount > 0
                    ? "Settlement completed"
                    : "No settlement needed",
            settlementAmount: totalAmount,
            notificationSent: true,
            calculationDetails,
            validationResult,
        };
    } catch (error) {
        console.error(`Error settling player ${playerId}:`, error);
        return {
            playerId,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            settlementAmount: 0,
            notificationSent: false,
        };
    }
}

export async function bulkSettlementPlayers(
    input: BulkSettlementInput
): Promise<BulkSettlementResult> {
    // 🚀 최적화된 정산 로직 사용
    const result = await bulkSettlementPlayersOptimized(input);

    // 전체 정산 완료 후 폴 상태 업데이트
    if (result.success && result.summary.totalFailed === 0) {
        await updatePollSettlementStatus(input.pollId, input.playerIds);
    }

    return result;
}

export async function updatePollSettlementStatus(
    pollId: string,
    processedPlayerIds: string[]
): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    allPlayersSettled?: boolean;
    totalPlayers?: number;
    settledPlayers?: number;
    settlementLogId?: string;
}> {
    try {
        const poll = await prisma.poll.findUnique({
            where: { id: pollId },
            select: {
                id: true,
                title: true,
                bettingMode: true,
                isSettled: true,
                settledAt: true,
                settledBy: true,
                totalVotes: true, // 🔄 totalBetsAmount → totalVotes 마이그레이션
                totalCommissionAmount: true,
            },
        });

        if (!poll || !poll.bettingMode) {
            return {
                success: false,
                error: "Invalid betting poll",
            };
        }

        // 전체 참여자 수 확인
        const totalParticipants = await prisma.pollLog.groupBy({
            by: ["playerId"],
            where: { pollId },
            _count: { playerId: true },
        });

        const totalPlayerCount = totalParticipants.length;

        // 이미 정산된 플레이어 수 확인
        const settledPlayersCount = await prisma.rewardsLog.count({
            where: {
                pollId: pollId,
                reason: { contains: "Betting payout" },
            },
        });

        // 기존 정산 로그 확인
        const existingSettlementLog =
            await prisma.pollBettingSettlementLog.findFirst({
                where: {
                    pollId: pollId,
                    status: { in: ["PENDING", "PARTIAL"] },
                },
                orderBy: { createdAt: "desc" },
            });

        let settlementLogId = existingSettlementLog?.id;

        // 정산 로그가 없으면 새로 생성
        if (!settlementLogId) {
            const newSettlementLog =
                await prisma.pollBettingSettlementLog.create({
                    data: {
                        pollId: pollId,
                        settlementType: "MANUAL",
                        totalPayout: 0,
                        totalWinners: 0,
                        totalBettingPool: poll.totalVotes, // 🔄 totalBetsAmount → totalVotes 마이그레이션
                        houseCommission: poll.totalCommissionAmount,
                        houseCommissionRate: 0.05,
                        status: "PENDING",
                        isManual: true,
                        processedBy: "bulk-settlement",
                        metadata: {
                            processedPlayerCount: processedPlayerIds.length,
                            totalPlayerCount: totalPlayerCount,
                            lastProcessedPlayerId:
                                processedPlayerIds[
                                    processedPlayerIds.length - 1
                                ],
                            settlementStartedAt: new Date().toISOString(),
                        },
                        settlementStartedAt: new Date(),
                    },
                });
            settlementLogId = newSettlementLog.id;
        } else {
            // 기존 로그 업데이트
            const currentMetadata =
                (existingSettlementLog?.metadata as any) || {};
            await prisma.pollBettingSettlementLog.update({
                where: { id: settlementLogId },
                data: {
                    metadata: {
                        ...currentMetadata,
                        processedPlayerCount: settledPlayersCount,
                        lastProcessedPlayerId:
                            processedPlayerIds[processedPlayerIds.length - 1],
                        lastProcessedAt: new Date().toISOString(),
                    },
                },
            });
        }

        // 모든 플레이어가 정산되었는지 확인
        const allPlayersSettled = settledPlayersCount >= totalPlayerCount;

        if (allPlayersSettled && !poll.isSettled) {
            // 총 정산 금액 계산
            const totalPayoutResult = await prisma.rewardsLog.aggregate({
                where: {
                    pollId: pollId,
                    reason: { contains: "Betting payout" },
                    amount: { gt: 0 },
                },
                _sum: { amount: true },
            });

            const totalPayout = (totalPayoutResult._sum as any)?.amount || 0;

            // 승자 수 계산
            const winnerCount = await prisma.rewardsLog.count({
                where: {
                    pollId: pollId,
                    reason: { contains: "Betting payout" },
                    amount: { gt: 0 },
                },
            });

            // 폴 정산 완료 상태로 업데이트
            await prisma.poll.update({
                where: { id: pollId },
                data: {
                    isSettled: true,
                    settledAt: new Date(),
                    settledBy: "bulk-settlement",
                },
            });

            // 정산 로그 완료로 업데이트
            await prisma.pollBettingSettlementLog.update({
                where: { id: settlementLogId },
                data: {
                    status: "SUCCESS",
                    totalPayout: totalPayout,
                    totalWinners: winnerCount,
                    settlementCompletedAt: new Date(),
                    metadata: {
                        processedPlayerCount: totalPlayerCount,
                        totalPlayerCount: totalPlayerCount,
                        settlementCompletedAt: new Date().toISOString(),
                    },
                },
            });

            return {
                success: true,
                message: "Poll settlement completed successfully",
                allPlayersSettled: true,
                totalPlayers: totalPlayerCount,
                settledPlayers: settledPlayersCount,
                settlementLogId,
            };
        }

        return {
            success: true,
            message: "Settlement in progress",
            allPlayersSettled: false,
            totalPlayers: totalPlayerCount,
            settledPlayers: settledPlayersCount,
            settlementLogId,
        };
    } catch (error) {
        console.error("Error updating poll settlement status:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

export async function getSettlementProgress(pollId: string): Promise<{
    success: boolean;
    settlementLog?: {
        id: string;
        status: string;
        processedPlayerCount: number;
        totalPlayerCount: number;
        lastProcessedPlayerId?: string;
        lastProcessedAt?: Date;
        settlementStartedAt: Date;
        settlementCompletedAt?: Date;
        totalPayout: number;
        totalWinners: number;
    };
    progress: {
        totalPlayers: number;
        settledPlayers: number;
        unsettledPlayers: number;
        settlementProgress: number;
        isFullySettled: boolean;
        estimatedTimeRemaining?: number;
    };
    error?: string;
}> {
    try {
        const poll = await prisma.poll.findUnique({
            where: { id: pollId },
            select: {
                id: true,
                bettingMode: true,
                isSettled: true,
                settledAt: true,
            },
        });

        if (!poll || !poll.bettingMode) {
            return {
                success: false,
                progress: {
                    totalPlayers: 0,
                    settledPlayers: 0,
                    unsettledPlayers: 0,
                    settlementProgress: 0,
                    isFullySettled: false,
                },
                error: "Invalid betting poll",
            };
        }

        // 최신 정산 로그 가져오기
        const settlementLog = await prisma.pollBettingSettlementLog.findFirst({
            where: { pollId: pollId },
            orderBy: { createdAt: "desc" },
        });

        // 전체 참여자 수
        const totalParticipants = await prisma.pollLog.groupBy({
            by: ["playerId"],
            where: { pollId },
            _count: { playerId: true },
        });

        const totalPlayers = totalParticipants.length;

        // 정산된 플레이어 수
        const settledPlayers = await prisma.rewardsLog.count({
            where: {
                pollId: pollId,
                reason: { contains: "Betting payout" },
            },
        });

        const unsettledPlayers = totalPlayers - settledPlayers;
        const settlementProgress =
            totalPlayers > 0 ? (settledPlayers / totalPlayers) * 100 : 0;
        const isFullySettled = poll.isSettled && settledPlayers >= totalPlayers;

        // 예상 남은 시간 계산
        let estimatedTimeRemaining: number | undefined;
        const metadata = settlementLog?.metadata as any;
        const processedPlayerCount = metadata?.processedPlayerCount || 0;

        if (
            settlementLog &&
            settlementLog.settlementStartedAt &&
            processedPlayerCount > 0
        ) {
            const elapsedTime =
                Date.now() - settlementLog.settlementStartedAt.getTime();
            const averageTimePerPlayer = elapsedTime / processedPlayerCount;
            const remainingPlayers = totalPlayers - settledPlayers;
            estimatedTimeRemaining = averageTimePerPlayer * remainingPlayers;
        }

        return {
            success: true,
            settlementLog: settlementLog
                ? {
                      id: settlementLog.id,
                      status: settlementLog.status,
                      processedPlayerCount: metadata?.processedPlayerCount || 0,
                      totalPlayerCount: metadata?.totalPlayerCount || 0,
                      lastProcessedPlayerId:
                          metadata?.lastProcessedPlayerId || undefined,
                      lastProcessedAt: metadata?.lastProcessedAt
                          ? new Date(metadata.lastProcessedAt)
                          : undefined,
                      settlementStartedAt: settlementLog.settlementStartedAt,
                      settlementCompletedAt:
                          settlementLog.settlementCompletedAt || undefined,
                      totalPayout: settlementLog.totalPayout,
                      totalWinners: settlementLog.totalWinners,
                  }
                : undefined,
            progress: {
                totalPlayers,
                settledPlayers,
                unsettledPlayers,
                settlementProgress,
                isFullySettled,
                estimatedTimeRemaining,
            },
        };
    } catch (error) {
        console.error("Error getting settlement progress:", error);
        return {
            success: false,
            progress: {
                totalPlayers: 0,
                settledPlayers: 0,
                unsettledPlayers: 0,
                settlementProgress: 0,
                isFullySettled: false,
            },
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

export async function resumeSettlement(
    pollId: string,
    batchSize: number = 50
): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    settlementLogId?: string;
    remainingPlayers?: string[];
}> {
    try {
        const progress = await getSettlementProgress(pollId);

        if (!progress.success) {
            return {
                success: false,
                error: progress.error,
            };
        }

        if (progress.progress.isFullySettled) {
            return {
                success: true,
                message: "Settlement already completed",
            };
        }

        // 아직 정산되지 않은 플레이어들 가져오기
        const settledPlayerIds = await prisma.rewardsLog.findMany({
            where: {
                pollId: pollId,
                reason: { contains: "Betting payout" },
            },
            select: { playerId: true },
        });

        const settledPlayerIdSet = new Set(
            settledPlayerIds.map((log) => log.playerId)
        );

        const allPlayerIds = await prisma.pollLog.groupBy({
            by: ["playerId"],
            where: { pollId },
            _count: { playerId: true },
        });

        const remainingPlayerIds = allPlayerIds
            .map((p) => (p as any).playerId)
            .filter((playerId) => !settledPlayerIdSet.has(playerId));

        if (remainingPlayerIds.length === 0) {
            return {
                success: true,
                message: "No remaining players to settle",
            };
        }

        // 배치 크기만큼만 처리
        const batchPlayerIds = remainingPlayerIds.slice(0, batchSize);

        // 정산 로그 업데이트 또는 생성
        let settlementLogId: string;
        const existingLog = await prisma.pollBettingSettlementLog.findFirst({
            where: {
                pollId: pollId,
                status: { in: ["PENDING", "PARTIAL"] },
            },
            orderBy: { createdAt: "desc" },
        });

        if (existingLog) {
            const currentMetadata = (existingLog.metadata as any) || {};
            await prisma.pollBettingSettlementLog.update({
                where: { id: existingLog.id },
                data: {
                    status: "PENDING",
                    metadata: {
                        ...currentMetadata,
                        lastProcessedAt: new Date().toISOString(),
                    },
                },
            });
            settlementLogId = existingLog.id;
        } else {
            const newLog = await prisma.pollBettingSettlementLog.create({
                data: {
                    pollId: pollId,
                    settlementType: "MANUAL",
                    totalPayout: 0,
                    totalWinners: 0,
                    totalBettingPool: 0,
                    houseCommission: 0,
                    houseCommissionRate: 0.05,
                    status: "PENDING",
                    isManual: true,
                    processedBy: "bulk-settlement-resume",
                    metadata: {
                        processedPlayerCount: progress.progress.settledPlayers,
                        totalPlayerCount: progress.progress.totalPlayers,
                        settlementStartedAt: new Date().toISOString(),
                    },
                    settlementStartedAt: new Date(),
                },
            });
            settlementLogId = newLog.id;
        }

        return {
            success: true,
            message: `Resumed settlement with ${batchPlayerIds.length} players`,
            settlementLogId,
            remainingPlayers: remainingPlayerIds,
        };
    } catch (error) {
        console.error("Error resuming settlement:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

export async function pauseSettlement(pollId: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
}> {
    try {
        const settlementLog = await prisma.pollBettingSettlementLog.findFirst({
            where: {
                pollId: pollId,
                status: "PENDING",
            },
            orderBy: { createdAt: "desc" },
        });

        if (!settlementLog) {
            return {
                success: false,
                error: "No active settlement found",
            };
        }

        const currentMetadata = (settlementLog.metadata as any) || {};
        await prisma.pollBettingSettlementLog.update({
            where: { id: settlementLog.id },
            data: {
                status: "PARTIAL",
                metadata: {
                    ...currentMetadata,
                    lastProcessedAt: new Date().toISOString(),
                },
            },
        });

        return {
            success: true,
            message: "Settlement paused successfully",
        };
    } catch (error) {
        console.error("Error pausing settlement:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

export async function processSinglePlayerSettlement(
    pollId: string,
    playerId: string,
    winningOptionIds: string[],
    poll: any
): Promise<{
    playerId: string;
    success: boolean;
    message?: string;
    error?: string;
    settlementAmount: number;
    notificationSent: boolean;
}> {
    try {
        const settlementResult = await getSettlementAmountSinglePlayer({
            pollId,
            playerId,
            winningOptionIds,
        });

        if (!settlementResult.success) {
            return {
                playerId,
                success: false,
                error: settlementResult.error || "Calculation failed",
                settlementAmount: 0,
                notificationSent: false,
            };
        }

        const hasWinningBets = settlementResult.winningBets.some(
            (bet) => bet.isWinningOption
        );
        const totalAmount = hasWinningBets
            ? settlementResult.payoutAmount
            : settlementResult.refundAmount;

        let notificationResult = { success: false };

        if (winningOptionIds.length === 0) {
            notificationResult = await createBettingRefundNotification(
                playerId,
                pollId,
                poll.title,
                settlementResult.totalBetAmount,
                "No winning option determined"
            );
        } else if (hasWinningBets) {
            notificationResult = await createBettingWinNotification(
                playerId,
                pollId,
                poll.title,
                settlementResult.totalBetAmount,
                settlementResult.payoutAmount
            );
        } else {
            notificationResult = await createBettingFailedNotification(
                playerId,
                pollId,
                poll.title,
                settlementResult.totalBetAmount,
                "Selected options"
            );
        }

        return {
            playerId,
            success: true,
            message: hasWinningBets
                ? `Winner settlement completed for player ${playerId}`
                : winningOptionIds.length === 0
                ? `Refund settlement completed for player ${playerId}`
                : `Failed settlement completed for player ${playerId}`,
            settlementAmount: totalAmount,
            notificationSent: notificationResult.success,
        };
    } catch (error) {
        return {
            playerId,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            settlementAmount: 0,
            notificationSent: false,
        };
    }
}

export async function getSettlementRewardLogs({
    pollId,
    playerId,
    assetId,
    payoutAmount,
}: {
    pollId: string;
    playerId: string;
    assetId: string;
    payoutAmount: number;
}): Promise<{
    success: boolean;
    settlementLogs: Array<{
        id: string;
        amount: number;
        createdAt: Date;
        reason: string | null;
    }>;
    totalSettlementAmount: number;
    error?: string;
}> {
    try {
        const settlementRewardLogs = await prisma.rewardsLog.findMany({
            where: {
                pollId: pollId,
                playerId: playerId,
                assetId: assetId,
                reason: { contains: "Betting payout" },
            },
            select: {
                id: true,
                amount: true,
                createdAt: true,
                reason: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const totalSettlementAmount = settlementRewardLogs.reduce(
            (sum, log) => sum + log.amount,
            0
        );

        // 정산 로그가 있으면 성공으로 처리, 금액 불일치는 경고로만 표시
        if (settlementRewardLogs.length > 0) {
            return {
                success: true,
                settlementLogs: settlementRewardLogs,
                totalSettlementAmount,
                error:
                    totalSettlementAmount !== payoutAmount
                        ? `Settlement amount mismatch: ${totalSettlementAmount} !== ${payoutAmount}`
                        : undefined,
            };
        }

        return {
            success: true,
            settlementLogs: settlementRewardLogs,
            totalSettlementAmount,
        };
    } catch (error) {
        console.error("Error fetching settlement reward logs:", error);
        return {
            success: false,
            settlementLogs: [],
            totalSettlementAmount: 0,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to fetch settlement logs",
        };
    }
}
