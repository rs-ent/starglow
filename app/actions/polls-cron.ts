/// app/actions/polls-cron.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import { getPollResult } from "./polls";
import { updatePlayerAsset } from "./playerAssets/actions";
import {
    createBettingWinNotification,
    createBettingFailedNotification,
    createBettingRefundNotification,
    createSettlementCompleteNotification,
} from "./notification/actions";
import type { PollStatus } from "@prisma/client";
import { INTERNAL_PHASES } from "@/app/api/cron/polls/betting-mode/settlement/route";

type InternalPhase = (typeof INTERNAL_PHASES)[keyof typeof INTERNAL_PHASES];

// 1분 cron 제한에 맞춘 설정
const CRON_CONFIG = {
    MAX_EXECUTION_TIME: 25000, // 25초 (5초 안전 마진)
    BATCH_SIZE: 10, // 성능 최적화: 5 → 10으로 증가
    MAX_POLLS_PER_RUN: 1, // 한 번에 하나의 폴만 처리
    TRANSACTION_TIMEOUT: 60000, // 15초 트랜잭션
} as const;

export interface SettlementMetadata {
    currentPhase: InternalPhase;
    totalBatches: number;
    currentBatch: number;
    totalWinners: number;
    processedWinners: number;
    winningOptionIds: string[];
    totalPayout: number;
    isRefund: boolean;
    startTime: string;
    lastProcessedTime: string;
    totalBetAmount: number;
    totalCommission: number;
    houseCommissionRate: number;
    payoutPool: number;
    totalWinningBets: number;
    totalActualPayout?: number;
    remainingAmount?: number;
}

export interface CronStepResult {
    success: boolean;
    phase: InternalPhase;
    nextPhase?: InternalPhase;
    message?: string;
    error?: string;
    metadata?: Partial<SettlementMetadata>;
    completed?: boolean;
    executionTimeMs?: number;
    silent?: boolean; // 로그 출력 제어용
}

/**
 * 정산 대상 폴 중 다음에 처리할 폴을 찾습니다.
 */
async function findNextPollToProcess(): Promise<{
    pollId: string;
    phase: InternalPhase;
    hasWork: boolean; // 실제 작업이 있는지 여부
} | null> {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // 진행 중인 정산 폴 찾기 (SETTLING 상태이면서 metadata에 단계 정보가 있는 것)
    const inProgressPoll = await prisma.poll.findFirst({
        where: {
            bettingMode: true,
            isSettled: false,
            bettingStatus: "SETTLING",
            updatedAt: { gte: fiveMinutesAgo },
        },
        select: { id: true, metadata: true },
        orderBy: { updatedAt: "asc" },
    });

    if (inProgressPoll && inProgressPoll.metadata) {
        const settlementData = inProgressPoll.metadata as any;
        if (settlementData?.settlementPhase) {
            return {
                pollId: inProgressPoll.id,
                phase: settlementData.settlementPhase as InternalPhase,
                hasWork: true,
            };
        }
    }

    // 새로운 정산 대상 찾기 (동시성 처리를 위한 원자적 업데이트)
    try {
        const updatedPoll = await prisma.poll.updateMany({
            where: {
                bettingMode: true,
                endDate: {
                    lt: new Date(now.getTime() - 5 * 60 * 1000), // 5분 지연
                },
                isSettled: false,
                bettingStatus: "OPEN",
                isActive: true,
            },
            data: {
                bettingStatus: "SETTLING",
                updatedAt: new Date(),
            },
        });

        if (updatedPoll.count > 0) {
            // 업데이트된 폴 중 하나를 선택
            const newPoll = await prisma.poll.findFirst({
                where: {
                    bettingMode: true,
                    bettingStatus: "SETTLING",
                    isSettled: false,
                    isActive: true,
                    updatedAt: { gte: new Date(now.getTime() - 1000) },
                },
                select: { id: true },
                orderBy: { endDate: "asc" },
            });

            if (newPoll) {
                return {
                    pollId: newPoll.id,
                    phase: INTERNAL_PHASES.PHASE_1_PREPARE,
                    hasWork: true,
                };
            }
        }
    } catch (error) {
        console.warn("Race condition detected in poll selection:", error);
        // 다른 cron job이 이미 처리 중일 수 있으므로 null 반환
        return null;
    }

    return null;
}

/**
 * Phase 1: 정산 준비 - 승리자 결정 및 메타데이터 계산
 */
async function processPhase1Prepare(pollId: string): Promise<CronStepResult> {
    const startTime = Date.now();

    try {
        // 폴 락 및 데이터 로드 (기존 로직 차용)
        const poll = await prisma.poll.findUnique({
            where: { id: pollId },
            select: {
                id: true,
                title: true,
                bettingMode: true,
                bettingAssetId: true,
                optionBetAmounts: true,
                totalCommissionAmount: true,
                houseCommissionRate: true,
                endDate: true,
                bettingStatus: true,
                isSettled: true,
                settledAt: true,
                answerOptionIds: true,
                metadata: true,
            },
        });

        if (!poll?.bettingMode || poll.isSettled) {
            return {
                success: false,
                phase: INTERNAL_PHASES.PHASE_1_PREPARE,
                error: "Invalid poll state for settlement",
            };
        }

        // 🚨 기존 로직의 강화된 중복 정산 방지 (3중 체크)
        if (poll.isSettled || poll.settledAt) {
            return {
                success: false,
                phase: INTERNAL_PHASES.PHASE_1_PREPARE,
                error: "Poll has already been settled",
            };
        }

        if (poll.bettingStatus === "SETTLED") {
            return {
                success: false,
                phase: INTERNAL_PHASES.PHASE_1_PREPARE,
                error: "Poll is already settled",
            };
        }

        if (poll.answerOptionIds && poll.answerOptionIds.length > 0) {
            return {
                success: false,
                phase: INTERNAL_PHASES.PHASE_1_PREPARE,
                error: "Poll settlement is already completed",
            };
        }

        // 폴이 종료되었는지 확인
        if (poll.endDate && new Date() < poll.endDate) {
            return {
                success: false,
                phase: INTERNAL_PHASES.PHASE_1_PREPARE,
                error: "Poll has not ended yet",
            };
        }

        // 승리자 결정 (간단한 득표수 기준)
        const pollResult = await getPollResult({ pollId });
        let settlementMetadata: SettlementMetadata;

        // 🔍 기존 로직의 정밀한 계산 적용
        const betAmounts = (poll.optionBetAmounts as any) || {};
        const totalCommission = poll.totalCommissionAmount || 0;

        // 전체 베팅 금액 계산 (정수 강제)
        const totalBetAmount = Object.values(betAmounts).reduce(
            (sum: number, amount: any) => Math.floor(sum + (amount || 0)),
            0
        );

        if (pollResult.totalVotes === 0 || totalBetAmount === 0) {
            // 아무도 투표하지 않은 경우 - 환불 처리
            const allBettors = await prisma.pollLog.findMany({
                where: { pollId },
                select: { id: true, playerId: true, amount: true },
            });

            settlementMetadata = {
                currentPhase: INTERNAL_PHASES.PHASE_2_PROCESS,
                totalBatches: Math.ceil(
                    allBettors.length / CRON_CONFIG.BATCH_SIZE
                ),
                currentBatch: 0,
                totalWinners: allBettors.length,
                processedWinners: 0,
                winningOptionIds: [],
                totalPayout: totalBetAmount, // 환불 총액
                isRefund: true,
                startTime: new Date().toISOString(),
                lastProcessedTime: new Date().toISOString(),
                // 기존 로직의 정밀한 계산 데이터 추가
                totalBetAmount,
                totalCommission,
                houseCommissionRate: poll.houseCommissionRate || 0.01,
                payoutPool: totalBetAmount, // 환불이므로 수수료 제외 안함
                totalWinningBets: 0,
                totalActualPayout: 0,
                remainingAmount: 0,
            };
        } else {
            // 최대 득표 옵션들 찾기 (기존 로직과 동일)
            const maxVoteCount = Math.max(
                ...pollResult.results.map(
                    (r) => r.actualVoteCount || r.voteCount
                )
            );
            const winningOptions = pollResult.results.filter(
                (r) => (r.actualVoteCount || r.voteCount) === maxVoteCount
            );

            // 🔍 기존 로직의 승리 옵션들의 총 베팅 금액 계산 (정수 강제)
            const totalWinningBets = winningOptions.reduce(
                (sum, option) =>
                    Math.floor(sum + (betAmounts[option.optionId] || 0)),
                0
            );

            // 승리자 목록 조회
            const winners = await prisma.pollLog.findMany({
                where: {
                    pollId,
                    optionId: { in: winningOptions.map((o) => o.optionId) },
                },
                select: {
                    id: true,
                    playerId: true,
                    optionId: true,
                    amount: true,
                },
            });

            // 🔍 기존 로직의 배당 풀 계산 (정수 강제)
            const payoutPool = Math.floor(totalBetAmount - totalCommission);

            settlementMetadata = {
                currentPhase: INTERNAL_PHASES.PHASE_2_PROCESS,
                totalBatches: Math.ceil(
                    winners.length / CRON_CONFIG.BATCH_SIZE
                ),
                currentBatch: 0,
                totalWinners: winners.length,
                processedWinners: 0,
                winningOptionIds: winningOptions.map((o) => o.optionId),
                totalPayout: payoutPool,
                isRefund: false,
                startTime: new Date().toISOString(),
                lastProcessedTime: new Date().toISOString(),
                // 기존 로직의 정밀한 계산 데이터 추가
                totalBetAmount,
                totalCommission,
                houseCommissionRate: poll.houseCommissionRate || 0.01,
                payoutPool,
                totalWinningBets,
                totalActualPayout: 0,
                remainingAmount: 0,
            };
        }

        // 상태 업데이트 (기존 metadata와 합병)
        const currentMetadata = (poll.metadata as any) || {};
        await prisma.poll.update({
            where: { id: pollId },
            data: {
                bettingStatus: "SETTLING",
                metadata: {
                    ...currentMetadata,
                    settlementPhase: settlementMetadata.currentPhase,
                    settlementData: settlementMetadata,
                },
            },
        });

        return {
            success: true,
            phase: INTERNAL_PHASES.PHASE_1_PREPARE,
            nextPhase: INTERNAL_PHASES.PHASE_2_PROCESS,
            message: `Prepared settlement for ${
                settlementMetadata.totalWinners
            } ${settlementMetadata.isRefund ? "refunds" : "winners"} in ${
                settlementMetadata.totalBatches
            } batches. Total amount: ${settlementMetadata.totalPayout}`,
            metadata: settlementMetadata,
            executionTimeMs: Date.now() - startTime,
        };
    } catch (error) {
        console.error(`Phase 1 error for poll ${pollId}:`, error);

        // 🔄 에러 발생 시 정산 상태 롤백 시도 (기존 로직과 동일)
        try {
            await prisma.poll.update({
                where: { id: pollId },
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
            phase: INTERNAL_PHASES.PHASE_1_PREPARE,
            error: error instanceof Error ? error.message : "Phase 1 failed",
            executionTimeMs: Date.now() - startTime,
        };
    }
}

/**
 * Phase 2: 배치별 승리자 처리
 */
async function processPhase2Process(pollId: string): Promise<CronStepResult> {
    const startTime = Date.now();

    try {
        const poll = await prisma.poll.findUnique({
            where: { id: pollId },
            select: {
                id: true,
                title: true,
                bettingAssetId: true,
                metadata: true,
            },
        });

        if (!poll?.metadata) {
            return {
                success: false,
                phase: INTERNAL_PHASES.PHASE_2_PROCESS,
                error: "Settlement metadata not found",
            };
        }

        const pollMetadata = poll.metadata as any;
        const settlementData =
            pollMetadata.settlementData as SettlementMetadata;

        if (!settlementData) {
            return {
                success: false,
                phase: INTERNAL_PHASES.PHASE_2_PROCESS,
                error: "Settlement data not found",
            };
        }

        const currentBatch = settlementData.currentBatch;

        if (settlementData.isRefund) {
            // 환불 처리 (기존 로직 유지하되 정밀도 개선)
            const allBettors = await prisma.pollLog.findMany({
                where: { pollId },
                select: { id: true, playerId: true, amount: true },
                skip: currentBatch * CRON_CONFIG.BATCH_SIZE,
                take: CRON_CONFIG.BATCH_SIZE,
            });

            if (allBettors.length === 0) {
                // 모든 환불 완료
                const updatedMetadata = {
                    ...settlementData,
                    currentPhase: INTERNAL_PHASES.PHASE_3_FINALIZE,
                    lastProcessedTime: new Date().toISOString(),
                };

                await prisma.poll.update({
                    where: { id: pollId },
                    data: {
                        metadata: {
                            ...pollMetadata,
                            settlementPhase: INTERNAL_PHASES.PHASE_3_FINALIZE,
                            settlementData: updatedMetadata,
                        },
                    },
                });

                return {
                    success: true,
                    phase: INTERNAL_PHASES.PHASE_2_PROCESS,
                    nextPhase: INTERNAL_PHASES.PHASE_3_FINALIZE,
                    message: "All refunds completed",
                    executionTimeMs: Date.now() - startTime,
                };
            }

            // 배치 환불 처리 (정밀도 보정 적용)
            await prisma.$transaction(
                async (tx) => {
                    for (const bettor of allBettors) {
                        // 🔍 기존 로직과 동일한 환불 처리 (정수 강제)
                        const refundAmount = Math.floor(bettor.amount);

                        const refundResult = await updatePlayerAsset(
                            {
                                transaction: {
                                    playerId: bettor.playerId,
                                    assetId: poll.bettingAssetId!,
                                    amount: refundAmount,
                                    operation: "ADD",
                                    reason: `Betting refund for poll 『${poll.title}』 (no winners)`,
                                    metadata: {
                                        pollId,
                                        isRefund: true,
                                        originalBetAmount: bettor.amount,
                                    },
                                    pollId,
                                },
                            },
                            tx
                        );

                        if (!refundResult.success) {
                            throw new Error(
                                `Refund failed for ${bettor.playerId}: ${refundResult.error}`
                            );
                        }
                    }
                },
                { timeout: CRON_CONFIG.TRANSACTION_TIMEOUT }
            );

            // 다음 배치로 진행
            const updatedMetadata = {
                ...settlementData,
                currentBatch: currentBatch + 1,
                processedWinners:
                    settlementData.processedWinners + allBettors.length,
                lastProcessedTime: new Date().toISOString(),
            };

            await prisma.poll.update({
                where: { id: pollId },
                data: {
                    metadata: {
                        ...pollMetadata,
                        settlementData: updatedMetadata,
                    },
                },
            });

            return {
                success: true,
                phase: INTERNAL_PHASES.PHASE_2_PROCESS,
                nextPhase: INTERNAL_PHASES.PHASE_2_PROCESS,
                message: `Processed refund batch ${currentBatch + 1}/${
                    settlementData.totalBatches
                }`,
                metadata: updatedMetadata,
                executionTimeMs: Date.now() - startTime,
            };
        } else {
            // 🔍 기존 로직의 정밀한 승리자 배당 처리
            const winners = await prisma.pollLog.findMany({
                where: {
                    pollId,
                    optionId: { in: settlementData.winningOptionIds },
                },
                select: {
                    id: true,
                    playerId: true,
                    optionId: true,
                    amount: true,
                },
                skip: currentBatch * CRON_CONFIG.BATCH_SIZE,
                take: CRON_CONFIG.BATCH_SIZE,
            });

            if (winners.length === 0) {
                // 모든 배당 완료 - 잔여 금액 처리
                const totalActualPayout = settlementData.totalActualPayout || 0;
                const payoutPool = settlementData.payoutPool;
                const remainingAmount = Math.floor(
                    payoutPool - totalActualPayout
                );

                // 🔍 기존 로직의 잔여 금액 처리
                if (remainingAmount > 0) {
                    // 1원 이상의 잔여 금액이 있다면 가장 큰 배당을 받은 승리자에게 추가 지급
                    const allWinners = await prisma.pollLog.findMany({
                        where: {
                            pollId,
                            optionId: { in: settlementData.winningOptionIds },
                        },
                        select: { playerId: true, amount: true },
                        orderBy: { amount: "desc" },
                        take: 1,
                    });

                    if (allWinners.length > 0) {
                        const topWinner = allWinners[0];

                        await prisma.$transaction(async (tx) => {
                            const remainingPayoutResult =
                                await updatePlayerAsset(
                                    {
                                        transaction: {
                                            playerId: topWinner.playerId,
                                            assetId: poll.bettingAssetId!,
                                            amount: remainingAmount,
                                            operation: "ADD",
                                            reason: `Remaining payout adjustment for poll 『${poll.title}』`,
                                            metadata: {
                                                pollId,
                                                isRemainingAdjustment: true,
                                                remainingAmount,
                                                originalBetAmount:
                                                    topWinner.amount,
                                            },
                                            pollId,
                                        },
                                    },
                                    tx
                                );

                            if (!remainingPayoutResult.success) {
                                throw new Error(
                                    `Failed to pay remaining amount to ${topWinner.playerId}: ${remainingPayoutResult.error}`
                                );
                            }
                        });
                    }
                }

                const updatedMetadata = {
                    ...settlementData,
                    currentPhase: INTERNAL_PHASES.PHASE_3_FINALIZE,
                    totalActualPayout: Math.floor(
                        totalActualPayout + remainingAmount
                    ),
                    remainingAmount: 0,
                    lastProcessedTime: new Date().toISOString(),
                };

                await prisma.poll.update({
                    where: { id: pollId },
                    data: {
                        metadata: {
                            ...pollMetadata,
                            settlementPhase: INTERNAL_PHASES.PHASE_3_FINALIZE,
                            settlementData: updatedMetadata,
                        },
                    },
                });

                return {
                    success: true,
                    phase: INTERNAL_PHASES.PHASE_2_PROCESS,
                    nextPhase: INTERNAL_PHASES.PHASE_3_FINALIZE,
                    message: `All payouts completed. Total paid: ${Math.floor(
                        totalActualPayout + remainingAmount
                    )}, Remaining processed: ${remainingAmount}`,
                    executionTimeMs: Date.now() - startTime,
                };
            }

            // 🔍 기존 로직의 정밀한 배당 계산 및 지급
            const totalWinningBets = settlementData.totalWinningBets;
            const payoutPool = settlementData.payoutPool;
            let batchPayout = 0;

            await prisma.$transaction(
                async (tx) => {
                    for (const winner of winners) {
                        // 🔍 기존 로직과 동일한 정밀한 배당 계산 (정수 강제 - 버림)
                        const winnerBetAmount = winner.amount;
                        const payoutRatio = winnerBetAmount / totalWinningBets;
                        const exactPayout = payoutPool * payoutRatio;
                        const payout = Math.floor(exactPayout); // 정수 버림

                        if (payout > 0) {
                            const payoutResult = await updatePlayerAsset(
                                {
                                    transaction: {
                                        playerId: winner.playerId,
                                        assetId: poll.bettingAssetId!,
                                        amount: payout,
                                        operation: "ADD",
                                        reason: `Betting payout for poll 『${poll.title}』`,
                                        metadata: {
                                            pollId,
                                            winningOptionId: winner.optionId,
                                            originalBetAmount: winner.amount,
                                            payoutAmount: payout,
                                            payoutRatio,
                                            isWinnerPayout: true,
                                        },
                                        pollId,
                                    },
                                },
                                tx
                            );

                            if (!payoutResult.success) {
                                throw new Error(
                                    `Payout failed for ${winner.playerId}: ${payoutResult.error}`
                                );
                            }

                            batchPayout = Math.floor(batchPayout + payout);
                        }
                    }
                },
                { timeout: CRON_CONFIG.TRANSACTION_TIMEOUT }
            );

            // 다음 배치로 진행
            const updatedMetadata = {
                ...settlementData,
                currentBatch: currentBatch + 1,
                processedWinners:
                    settlementData.processedWinners + winners.length,
                totalActualPayout: Math.floor(
                    (settlementData.totalActualPayout || 0) + batchPayout
                ),
                lastProcessedTime: new Date().toISOString(),
            };

            await prisma.poll.update({
                where: { id: pollId },
                data: {
                    metadata: {
                        ...pollMetadata,
                        settlementData: updatedMetadata,
                    },
                },
            });

            return {
                success: true,
                phase: INTERNAL_PHASES.PHASE_2_PROCESS,
                nextPhase: INTERNAL_PHASES.PHASE_2_PROCESS,
                message: `Processed payout batch ${currentBatch + 1}/${
                    settlementData.totalBatches
                }. Batch payout: ${batchPayout}. Total: ${
                    updatedMetadata.totalActualPayout
                }`,
                metadata: updatedMetadata,
                executionTimeMs: Date.now() - startTime,
            };
        }
    } catch (error) {
        console.error(`Phase 2 error for poll ${pollId}:`, error);

        // 🔄 에러 발생 시 정산 상태 롤백 시도 (기존 로직과 동일)
        try {
            await prisma.poll.update({
                where: { id: pollId },
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
            phase: INTERNAL_PHASES.PHASE_2_PROCESS,
            error: error instanceof Error ? error.message : "Phase 2 failed",
            executionTimeMs: Date.now() - startTime,
        };
    }
}

/**
 * Phase 3: 정산 완료 처리
 */
async function processPhase3Finalize(pollId: string): Promise<CronStepResult> {
    const startTime = Date.now();

    try {
        const poll = await prisma.poll.findUnique({
            where: { id: pollId },
            select: {
                id: true,
                title: true,
                metadata: true,
            },
        });

        const pollMetadata = (poll?.metadata as any) || {};
        const settlementData =
            pollMetadata.settlementData as SettlementMetadata;

        if (!settlementData) {
            return {
                success: false,
                phase: INTERNAL_PHASES.PHASE_3_FINALIZE,
                error: "Settlement data not found",
            };
        }

        // 🔒 기존 로직과 동일한 최종 상태 업데이트
        await prisma.poll.update({
            where: { id: pollId },
            data: {
                status: "ENDED" as PollStatus,
                bettingStatus: "SETTLED",
                isSettled: true,
                settledAt: new Date(),
                settledBy: "cron-multi-step",
                answerOptionIds: settlementData?.winningOptionIds || [],
                metadata: {
                    ...pollMetadata,
                    settlementPhase: INTERNAL_PHASES.PHASE_4_NOTIFY,
                    settlementData: {
                        ...settlementData,
                        currentPhase: INTERNAL_PHASES.PHASE_4_NOTIFY,
                        lastProcessedTime: new Date().toISOString(),
                    },
                },
            },
        });

        // 🗄️ 기존 로직과 동일한 정산 로그 기록
        await prisma.pollBettingSettlementLog.create({
            data: {
                pollId,
                settlementType: "AUTO",
                winningOptionIds: settlementData?.winningOptionIds || [],
                totalPayout:
                    settlementData?.totalActualPayout ||
                    settlementData?.totalPayout ||
                    0,
                totalWinners: settlementData?.totalWinners || 0,
                totalBettingPool: settlementData?.totalBetAmount || 0,
                houseCommission: settlementData?.totalCommission || 0,
                houseCommissionRate:
                    settlementData?.houseCommissionRate || 0.01,
                status: "SUCCESS",
                isManual: false,
                processedBy: "cron-multi-step",
                processingTimeMs: Date.now() - startTime,
                settlementStartedAt: new Date(
                    settlementData?.startTime || new Date()
                ),
                settlementCompletedAt: new Date(),
                metadata: {
                    phases: [
                        "PHASE_1_PREPARE",
                        "PHASE_2_PROCESS",
                        "PHASE_3_FINALIZE",
                    ],
                    isRefund: settlementData?.isRefund || false,
                    totalBatches: settlementData?.totalBatches || 0,
                    processedBatches: settlementData?.currentBatch || 0,
                    payoutPool: settlementData?.payoutPool || 0,
                    totalWinningBets: settlementData?.totalWinningBets || 0,
                    remainingAmount: settlementData?.remainingAmount || 0,
                    cronVersion: "multi-step-v1",
                },
                // 🔍 기존 로직의 정밀한 정산 결과 기록
                payoutDistribution: settlementData.isRefund
                    ? {
                          type: "refund",
                          totalRefunded: settlementData.totalPayout,
                      }
                    : {
                          type: "payout",
                          totalPaid: settlementData.totalActualPayout || 0,
                          payoutPool: settlementData.payoutPool,
                          remainingProcessed:
                              settlementData.remainingAmount || 0,
                      },
                optionResults: {
                    winningOptions: settlementData.winningOptionIds,
                    totalWinningBets: settlementData.totalWinningBets,
                    houseEdge:
                        (
                            (settlementData.totalCommission /
                                settlementData.totalBetAmount) *
                            100
                        ).toFixed(2) + "%",
                },
            },
        });

        return {
            success: true,
            phase: INTERNAL_PHASES.PHASE_3_FINALIZE,
            nextPhase: INTERNAL_PHASES.PHASE_4_NOTIFY,
            message: `Settlement finalized. ${
                settlementData.isRefund
                    ? `Refunded ${settlementData.totalPayout} to ${settlementData.totalWinners} players`
                    : `Paid ${settlementData.totalActualPayout || 0} to ${
                          settlementData.totalWinners
                      } winners`
            }`,
            completed: false, // Phase 4 알림이 남음
            executionTimeMs: Date.now() - startTime,
        };
    } catch (error) {
        console.error(`Phase 3 error for poll ${pollId}:`, error);

        // ⚠️ Phase 3 실패 시 주의: 이미 실제 배당이 완료되었을 수 있음
        // 수동 검토 필요할 수 있으나 일관성을 위해 롤백 시도
        try {
            await prisma.poll.update({
                where: { id: pollId },
                data: {
                    bettingStatus: "OPEN", // 다시 열린 상태로 되돌림
                },
            });
            console.warn(
                `⚠️ Poll ${pollId} rolled back from Phase 3 - Manual review recommended`
            );
        } catch (rollbackError) {
            console.error(
                "❌ Failed to rollback settlement status:",
                rollbackError
            );
        }

        return {
            success: false,
            phase: INTERNAL_PHASES.PHASE_3_FINALIZE,
            error: error instanceof Error ? error.message : "Phase 3 failed",
            executionTimeMs: Date.now() - startTime,
        };
    }
}

/**
 * Phase 4: 알림 발송 처리
 */
async function processPhase4Notify(pollId: string): Promise<CronStepResult> {
    const startTime = Date.now();

    try {
        const poll = await prisma.poll.findUnique({
            where: { id: pollId },
            select: {
                id: true,
                title: true,
                bettingAssetId: true,
                metadata: true,
            },
        });

        if (!poll?.metadata) {
            return {
                success: false,
                phase: INTERNAL_PHASES.PHASE_4_NOTIFY,
                error: "Settlement metadata not found",
            };
        }

        const pollMetadata = poll.metadata as any;
        const settlementData =
            pollMetadata.settlementData as SettlementMetadata;

        if (!settlementData) {
            return {
                success: false,
                phase: INTERNAL_PHASES.PHASE_4_NOTIFY,
                error: "Settlement data not found",
            };
        }

        // 🔔 기존 로직과 동일한 개별 알림 시스템
        try {
            if (!poll.title || !poll.bettingAssetId) {
                console.error(
                    `Poll ${pollId} missing title or betting asset for notifications`
                );
                // 알림 실패해도 정산은 완료로 처리
                await prisma.poll.update({
                    where: { id: pollId },
                    data: {
                        metadata: {
                            ...pollMetadata,
                            settlementPhase: INTERNAL_PHASES.COMPLETED,
                            settlementData: {
                                ...settlementData,
                                currentPhase: INTERNAL_PHASES.COMPLETED,
                                lastProcessedTime: new Date().toISOString(),
                            },
                        },
                    },
                });

                return {
                    success: true,
                    phase: INTERNAL_PHASES.PHASE_4_NOTIFY,
                    nextPhase: INTERNAL_PHASES.COMPLETED,
                    message:
                        "Settlement completed (poll data incomplete for notifications)",
                    completed: true,
                    executionTimeMs: Date.now() - startTime,
                };
            }

            // 🔍 기존 로직과 동일한 모든 베팅 참가자 조회
            const allBettors = await prisma.pollLog.findMany({
                where: { pollId },
                select: {
                    playerId: true,
                    optionId: true,
                    amount: true,
                },
            });

            if (settlementData.isRefund) {
                // 💰 환불 케이스: 모든 참가자에게 환불 알림 전송 (기존 로직과 동일)
                const refundNotificationPromises = allBettors.map(
                    async (bettor) => {
                        try {
                            await createBettingRefundNotification(
                                bettor.playerId,
                                pollId,
                                poll.title,
                                bettor.amount,
                                "No winning option determined"
                            );
                        } catch (notifError) {
                            console.error(
                                `Failed to send refund notification to ${bettor.playerId}:`,
                                notifError
                            );
                            // 개별 알림 실패는 전체 프로세스를 중단하지 않음
                        }
                    }
                );

                // 🔍 기존 로직과 동일한 병렬 알림 전송 + 실패 허용
                await Promise.allSettled(refundNotificationPromises);
            } else {
                // 🏆 일반 정산 케이스: 개별 승부 결과에 따른 알림 (기존 로직과 동일)
                const winnerPlayerIds = new Set(
                    allBettors
                        .filter((bettor) =>
                            settlementData.winningOptionIds.includes(
                                bettor.optionId
                            )
                        )
                        .map((bettor) => bettor.playerId)
                );

                // 🔍 기존 로직의 정밀한 배당 계산으로 개별 payout 금액 재계산
                const payoutMap = new Map<string, number>();
                const totalWinningBets = settlementData.totalWinningBets;
                const payoutPool = settlementData.payoutPool;

                // 승리자들의 배당 금액 재계산 (Phase 2와 동일한 로직)
                const winners = allBettors.filter((bettor) =>
                    settlementData.winningOptionIds.includes(bettor.optionId)
                );

                for (const winner of winners) {
                    const winnerBetAmount = winner.amount;
                    const payoutRatio = winnerBetAmount / totalWinningBets;
                    const exactPayout = payoutPool * payoutRatio;
                    const payout = Math.floor(exactPayout); // 정수 버림

                    const currentPayout = payoutMap.get(winner.playerId) || 0;
                    payoutMap.set(
                        winner.playerId,
                        Math.floor(currentPayout + payout)
                    );
                }

                // 🔔 각 베팅 참가자에게 개별 알림 전송 (기존 로직과 동일)
                const notificationPromises = allBettors.map(async (bettor) => {
                    try {
                        const isWinner = winnerPlayerIds.has(bettor.playerId);

                        if (isWinner) {
                            // 🏆 승리자 알림 (기존 로직과 동일)
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
                            // 😔 패배자 알림 (기존 로직과 동일)
                            if (settlementData.winningOptionIds.length > 0) {
                                await createBettingFailedNotification(
                                    bettor.playerId,
                                    pollId,
                                    poll.title,
                                    bettor.amount,
                                    `Option ${bettor.optionId}`
                                );
                            }
                        }
                    } catch (notifError) {
                        console.error(
                            `Failed to send individual notification to ${bettor.playerId}:`,
                            notifError
                        );
                        // 개별 알림 실패는 전체 프로세스를 중단하지 않음
                    }
                });

                // 🔍 기존 로직과 동일한 모든 개별 알림 전송 완료 대기
                await Promise.allSettled(notificationPromises);

                // 📊 전체 정산 완료 알림 (대표 승리자에게만) - 기존 로직과 동일
                if (
                    settlementData.totalWinners &&
                    settlementData.totalWinners > 0
                ) {
                    const firstWinner = allBettors.find((bettor) =>
                        winnerPlayerIds.has(bettor.playerId)
                    );

                    if (firstWinner) {
                        try {
                            await createSettlementCompleteNotification(
                                firstWinner.playerId,
                                pollId,
                                poll.title,
                                settlementData.totalWinners,
                                settlementData.totalActualPayout ||
                                    settlementData.totalPayout ||
                                    0
                            );
                        } catch (notifError) {
                            console.error(
                                `Failed to send settlement complete notification:`,
                                notifError
                            );
                            // 정산 완료 알림 실패는 전체 프로세스를 중단하지 않음
                        }
                    }
                }
            }

            // 🔒 완료 상태로 업데이트 (기존 로직과 동일)
            await prisma.poll.update({
                where: { id: pollId },
                data: {
                    metadata: {
                        ...pollMetadata,
                        settlementPhase: INTERNAL_PHASES.COMPLETED,
                        settlementData: {
                            ...settlementData,
                            currentPhase: INTERNAL_PHASES.COMPLETED,
                            lastProcessedTime: new Date().toISOString(),
                        },
                    },
                },
            });

            return {
                success: true,
                phase: INTERNAL_PHASES.PHASE_4_NOTIFY,
                nextPhase: INTERNAL_PHASES.COMPLETED,
                message: `Notifications sent successfully. ${
                    settlementData.isRefund
                        ? `Notified ${allBettors.length} players about refunds`
                        : `Notified ${allBettors.length} participants (${settlementData.totalWinners} winners)`
                }`,
                completed: true,
                executionTimeMs: Date.now() - startTime,
            };
        } catch (error) {
            console.error(`Phase 4 error for poll ${pollId}:`, error);

            // ℹ️ Phase 4는 알림 발송 단계이므로 실패해도 정산은 완료된 상태
            // 롤백하지 않고 완료로 처리
            try {
                await prisma.poll.update({
                    where: { id: pollId },
                    data: {
                        metadata: {
                            ...pollMetadata,
                            settlementPhase: INTERNAL_PHASES.COMPLETED,
                            settlementData: {
                                ...settlementData,
                                currentPhase: INTERNAL_PHASES.COMPLETED,
                                lastProcessedTime: new Date().toISOString(),
                            },
                        },
                    },
                });
            } catch (metadataError) {
                console.error(
                    "❌ Failed to update completion metadata:",
                    metadataError
                );
            }

            return {
                success: true, // 정산은 완료된 상태이므로 success: true
                phase: INTERNAL_PHASES.PHASE_4_NOTIFY,
                nextPhase: INTERNAL_PHASES.COMPLETED,
                message: "Settlement completed (Phase 4 notifications failed)",
                completed: true,
                executionTimeMs: Date.now() - startTime,
            };
        }
    } catch (error) {
        console.error(`Phase 4 error for poll ${pollId}:`, error);
        return {
            success: false,
            phase: INTERNAL_PHASES.PHASE_4_NOTIFY,
            error: error instanceof Error ? error.message : "Phase 4 failed",
            executionTimeMs: Date.now() - startTime,
        };
    }
}

/**
 * 다음 정산 단계를 실행합니다.
 */
export async function processNextSettlementStep(): Promise<CronStepResult> {
    const startTime = Date.now();

    try {
        // 시간 제한 체크
        const checkTime = () => {
            if (Date.now() - startTime > CRON_CONFIG.MAX_EXECUTION_TIME) {
                throw new Error("Execution time limit reached");
            }
        };

        // 다음 처리할 폴 찾기
        const nextPoll = await findNextPollToProcess();
        checkTime();

        if (!nextPoll) {
            return {
                success: true,
                phase: INTERNAL_PHASES.COMPLETED,
                message: "No polls to process",
                executionTimeMs: Date.now() - startTime,
                silent: true, // 조용한 모드 플래그
            };
        }

        // 단계별 처리
        let result: CronStepResult;

        switch (nextPoll.phase) {
            case INTERNAL_PHASES.PHASE_1_PREPARE:
                result = await processPhase1Prepare(nextPoll.pollId);
                break;
            case INTERNAL_PHASES.PHASE_2_PROCESS:
                result = await processPhase2Process(nextPoll.pollId);
                break;
            case INTERNAL_PHASES.PHASE_3_FINALIZE:
                result = await processPhase3Finalize(nextPoll.pollId);
                break;
            case INTERNAL_PHASES.PHASE_4_NOTIFY:
                result = await processPhase4Notify(nextPoll.pollId);
                break;
            default:
                result = {
                    success: false,
                    phase: nextPoll.phase,
                    error: `Unknown phase: ${nextPoll.phase}`,
                };
        }

        checkTime();

        // 결과에 silent 플래그 추가 (실제 처리 여부에 따라)
        if (!result.silent) {
            result.silent = false; // 실제 작업이 있었음을 명시
        }

        return result;
    } catch (error) {
        console.error("Settlement step error:", error);
        return {
            success: false,
            phase: INTERNAL_PHASES.PHASE_1_PREPARE,
            error:
                error instanceof Error
                    ? error.message
                    : "Settlement step failed",
            executionTimeMs: Date.now() - startTime,
        };
    }
}
