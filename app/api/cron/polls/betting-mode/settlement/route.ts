import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { settleBettingPoll, getPollResult } from "@/app/actions/polls";
import {
    PollBettingSettlementType,
    PollBettingSettlementStatus,
} from "@prisma/client";

// Vercel Cron Secret 검증
const CRON_SECRET = process.env.CRON_SECRET;

interface SettlementRule {
    type: "VOTE_COUNT" | "BET_AMOUNT" | "HYBRID" | "MANUAL_ONLY";
    minVoteThreshold: number;
    tieBreakRule: "SPLIT" | "REFUND" | "HIGHEST_BET";
    autoSettlementDelay: number; // 폴 종료 후 정산까지 대기 시간 (분)
}

interface SettlementAlert {
    type: "SUCCESS" | "ERROR" | "MANUAL_REQUIRED" | "TIE_DETECTED";
    pollId: string;
    message: string;
    timestamp: Date;
    additionalData?: any;
}

// 기본 정산 규칙
const DEFAULT_SETTLEMENT_RULES: SettlementRule = {
    type: "VOTE_COUNT",
    minVoteThreshold: 1,
    tieBreakRule: "SPLIT",
    autoSettlementDelay: 5, // 5분 후 자동 정산
};

// 알림 전송 함수 (향후 Discord/Slack 웹훅, 이메일 등으로 확장 가능)
async function sendSettlementAlert(alert: SettlementAlert): Promise<void> {
    try {
        console.info(alert);
    } catch (error) {
        console.error("Failed to send settlement alert:", error);
    }
}

// 정산 로그 저장 함수
async function savePollBettingSettlementLog({
    pollId,
    settlementType,
    winningOptionIds,
    settlementResult,
    alertData,
    processingTimeMs,
    isManual = false,
    status = PollBettingSettlementStatus.SUCCESS,
    errorMessage,
    errorDetails,
}: {
    pollId: string;
    settlementType: PollBettingSettlementType;
    winningOptionIds: string[];
    settlementResult?: any;
    alertData?: any;
    processingTimeMs?: number;
    isManual?: boolean;
    status?: PollBettingSettlementStatus;
    errorMessage?: string;
    errorDetails?: any;
}): Promise<void> {
    try {
        // Poll 데이터 가져오기 (정산 통계용)
        const poll = await prisma.poll.findUnique({
            where: { id: pollId },
            select: {
                totalBetsAmount: true,
                houseCommissionRate: true,
                totalCommissionAmount: true,
                optionBetAmounts: true,
            },
        });

        // 정산 로그 생성
        await prisma.pollBettingSettlementLog.create({
            data: {
                pollId,
                settlementType,
                winningOptionIds,

                // 정산 결과
                totalPayout: settlementResult?.totalPayout || 0,
                totalWinners: settlementResult?.totalWinners || 0,
                totalBettingPool: poll?.totalBetsAmount || 0,
                houseCommission: poll?.totalCommissionAmount || 0,
                houseCommissionRate: poll?.houseCommissionRate || 0.05,

                // 정산 통계 (JSON)
                optionResults: poll?.optionBetAmounts || undefined,
                payoutDistribution:
                    settlementResult?.payoutDistribution || undefined,

                // 정산 규칙 적용 정보
                settlementRule: {
                    type: "VOTE_COUNT",
                    minVoteThreshold: 1,
                    tieBreakRule: "SPLIT",
                    autoSettlementDelay: 5,
                },
                tieBreakApplied: alertData?.tieBreakRule || undefined,
                tieCount: alertData?.tieCount || undefined,

                // 처리 정보
                status,
                isManual,
                processedBy: isManual ? "admin" : "cron",
                processingTimeMs,

                // 에러 정보
                errorMessage,
                errorDetails: errorDetails
                    ? JSON.stringify(errorDetails)
                    : undefined,

                // 메타데이터
                metadata: {
                    reason: alertData?.reason || undefined,
                    settlementType: alertData?.settlementType || undefined,
                    originalAlertData: alertData || undefined,
                },
                alertsSent: ["CONSOLE", "USER_NOTIFICATIONS"], // 콘솔 로깅 + 사용자 알림

                // 시간 정보
                settlementStartedAt: new Date(),
                settlementCompletedAt:
                    status === PollBettingSettlementStatus.SUCCESS
                        ? new Date()
                        : null,
            },
        });
    } catch (error) {
        console.error(
            `❌ Failed to save settlement log for poll ${pollId}:`,
            error
        );
        // 정산 로그 저장 실패는 전체 정산을 실패시키지 않음
    }
}

// 정산 규칙에 따른 승리자 결정
async function determineWinners(
    pollId: string,
    rules: SettlementRule
): Promise<{ winnerIds: string[]; requiresManual: boolean; alertData?: any }> {
    const pollResult = await getPollResult({ pollId });

    // 투표가 충분하지 않은 경우
    if (pollResult.totalVotes < rules.minVoteThreshold) {
        return {
            winnerIds: [],
            requiresManual: true,
            alertData: {
                reason: "INSUFFICIENT_VOTES",
                totalVotes: pollResult.totalVotes,
                minRequired: rules.minVoteThreshold,
            },
        };
    }

    switch (rules.type) {
        case "VOTE_COUNT": {
            const maxVoteCount = Math.max(
                ...pollResult.results.map((r) => r.voteCount)
            );
            const winners = pollResult.results.filter(
                (r) => r.voteCount === maxVoteCount
            );

            // 동점 처리
            if (winners.length > 1) {
                switch (rules.tieBreakRule) {
                    case "SPLIT":
                        return {
                            winnerIds: winners.map((w) => w.optionId),
                            requiresManual: false,
                            alertData: {
                                tieCount: winners.length,
                                tieBreakRule: "SPLIT",
                            },
                        };
                    case "REFUND":
                        return {
                            winnerIds: [], // 전액 환불
                            requiresManual: false,
                            alertData: {
                                tieCount: winners.length,
                                tieBreakRule: "REFUND",
                            },
                        };
                    case "HIGHEST_BET":
                        // 베팅 금액이 높은 옵션이 승리 (베팅 데이터 필요)
                        return {
                            winnerIds: [],
                            requiresManual: true,
                            alertData: {
                                reason: "TIE_NEEDS_BET_ANALYSIS",
                                tiedOptions: winners.map((w) => w.optionId),
                            },
                        };
                }
            }

            return {
                winnerIds: winners.map((w) => w.optionId),
                requiresManual: false,
            };
        }

        case "BET_AMOUNT": {
            // 베팅 금액 기준 (구현 필요)
            return {
                winnerIds: [],
                requiresManual: true,
                alertData: { reason: "BET_AMOUNT_RULE_NOT_IMPLEMENTED" },
            };
        }

        case "MANUAL_ONLY": {
            return {
                winnerIds: [],
                requiresManual: true,
                alertData: { reason: "MANUAL_ONLY_RULE" },
            };
        }

        default: {
            return {
                winnerIds: [],
                requiresManual: true,
                alertData: {
                    reason: "UNKNOWN_SETTLEMENT_RULE",
                    rule: rules.type,
                },
            };
        }
    }
}

export async function GET(request: NextRequest) {
    try {
        // Cron secret 검증
        const authHeader = request.headers.get("authorization");
        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const now = new Date();

        // 정산 대상 폴 찾기 (강화된 상태 체크)
        const settlementCandidates = await prisma.poll.findMany({
            where: {
                bettingMode: true,
                // 폴이 종료되고 지연 시간이 지난 것들만
                endDate: {
                    lt: new Date(
                        now.getTime() -
                            DEFAULT_SETTLEMENT_RULES.autoSettlementDelay *
                                60 *
                                1000
                    ),
                },
                // 🔒 강화된 정산 상태 체크 (3중 조건)
                AND: [
                    { isSettled: false },
                    { settledAt: null },
                    { bettingStatus: { not: "SETTLED" } },
                    { bettingStatus: { not: "SETTLING" } },
                    { answerOptionIds: { equals: [] } }, // 빈 배열 또는 null
                ],
                isActive: true,
            },
            select: {
                id: true,
                title: true,
                endDate: true,
                totalVotes: true,
                uniqueVoters: true,
                optionBetAmounts: true,
                bettingStatus: true,
                isSettled: true,
                settledAt: true,
            },
        });

        if (settlementCandidates.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No polls ready for settlement",
                processed: 0,
            });
        }

        const results = [];
        const alerts: SettlementAlert[] = [];

        // 각 폴에 대해 향상된 정산 실행
        for (const poll of settlementCandidates) {
            const settlementStartTime = Date.now();

            try {
                // 정산 규칙에 따른 승리자 결정
                const { winnerIds, requiresManual, alertData } =
                    await determineWinners(poll.id, DEFAULT_SETTLEMENT_RULES);

                if (requiresManual) {
                    // 수동 정산 필요한 경우
                    const alert: SettlementAlert = {
                        type: "MANUAL_REQUIRED",
                        pollId: poll.id,
                        message: `Poll "${poll.title}" requires manual settlement`,
                        timestamp: now,
                        additionalData: {
                            ...alertData,
                            pollTitle: poll.title,
                            endTime: poll.endDate,
                            totalVotes: poll.totalVotes,
                        },
                    };

                    alerts.push(alert);
                    await sendSettlementAlert(alert);

                    // 🗄️ 수동 정산 로그 저장
                    await savePollBettingSettlementLog({
                        pollId: poll.id,
                        settlementType: PollBettingSettlementType.MANUAL,
                        winningOptionIds: [],
                        alertData,
                        processingTimeMs: Date.now() - settlementStartTime,
                        isManual: true,
                        status: PollBettingSettlementStatus.PENDING,
                        errorMessage: `Manual settlement required: ${alertData?.reason}`,
                    });

                    results.push({
                        pollId: poll.id,
                        success: false,
                        requiresManual: true,
                        reason:
                            alertData?.reason || "MANUAL_SETTLEMENT_REQUIRED",
                        ...alertData,
                    });
                    continue;
                }

                if (winnerIds.length === 0) {
                    // 전액 환불 케이스
                    const alert: SettlementAlert = {
                        type: "SUCCESS",
                        pollId: poll.id,
                        message: `Poll "${poll.title}" settled with full refund`,
                        timestamp: now,
                        additionalData: {
                            settlementType: "FULL_REFUND",
                            reason: alertData?.tieBreakRule || "NO_WINNERS",
                        },
                    };

                    alerts.push(alert);
                    await sendSettlementAlert(alert);

                    // 🗄️ 환불 정산 로그 저장
                    await savePollBettingSettlementLog({
                        pollId: poll.id,
                        settlementType: PollBettingSettlementType.REFUND,
                        winningOptionIds: [],
                        alertData,
                        processingTimeMs: Date.now() - settlementStartTime,
                        isManual: false,
                        status: PollBettingSettlementStatus.SUCCESS,
                    });
                }

                // 자동 정산 실행
                const settlementResult = await settleBettingPoll({
                    pollId: poll.id,
                    winningOptionIds: winnerIds,
                });

                if (settlementResult.success) {
                    const alert: SettlementAlert = {
                        type: "SUCCESS",
                        pollId: poll.id,
                        message: `Poll "${poll.title}" successfully auto-settled`,
                        timestamp: now,
                        additionalData: {
                            winnerCount: settlementResult.totalWinners,
                            totalPayout: settlementResult.totalPayout,
                            winningOptions: winnerIds,
                            ...alertData,
                        },
                    };

                    alerts.push(alert);
                    await sendSettlementAlert(alert);

                    // 🗄️ 성공적인 자동 정산 로그 저장
                    await savePollBettingSettlementLog({
                        pollId: poll.id,
                        settlementType: PollBettingSettlementType.AUTO,
                        winningOptionIds: winnerIds,
                        settlementResult,
                        alertData,
                        processingTimeMs: Date.now() - settlementStartTime,
                        isManual: false,
                        status: PollBettingSettlementStatus.SUCCESS,
                    });
                } else {
                    const alert: SettlementAlert = {
                        type: "ERROR",
                        pollId: poll.id,
                        message: `Settlement failed for poll "${poll.title}": ${settlementResult.error}`,
                        timestamp: now,
                        additionalData: {
                            error: settlementResult.error,
                            winningOptions: winnerIds,
                        },
                    };

                    alerts.push(alert);
                    await sendSettlementAlert(alert);

                    // 🗄️ 실패한 자동 정산 로그 저장
                    await savePollBettingSettlementLog({
                        pollId: poll.id,
                        settlementType: PollBettingSettlementType.AUTO,
                        winningOptionIds: winnerIds,
                        alertData,
                        processingTimeMs: Date.now() - settlementStartTime,
                        isManual: false,
                        status: PollBettingSettlementStatus.FAILED,
                        errorMessage: settlementResult.error,
                    });
                }

                results.push({
                    pollId: poll.id,
                    title: poll.title,
                    winningOptions: winnerIds,
                    ...settlementResult,
                    alertData,
                });
            } catch (error) {
                console.error(
                    `❌ Error in enhanced settlement for poll ${poll.id}:`,
                    error
                );

                const alert: SettlementAlert = {
                    type: "ERROR",
                    pollId: poll.id,
                    message: `Critical error during settlement of poll "${poll.title}"`,
                    timestamp: now,
                    additionalData: {
                        error:
                            error instanceof Error
                                ? error.message
                                : "Unknown error",
                        stack: error instanceof Error ? error.stack : undefined,
                    },
                };

                alerts.push(alert);
                await sendSettlementAlert(alert);

                // 🗄️ 예외 발생 정산 로그 저장
                await savePollBettingSettlementLog({
                    pollId: poll.id,
                    settlementType: PollBettingSettlementType.EMERGENCY,
                    winningOptionIds: [],
                    processingTimeMs: Date.now() - settlementStartTime,
                    isManual: false,
                    status: PollBettingSettlementStatus.FAILED,
                    errorMessage:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                    errorDetails: error instanceof Error ? error.stack : error,
                });

                results.push({
                    pollId: poll.id,
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                });
            }
        }

        const successCount = results.filter((r) => r.success).length;
        const manualCount = results.filter((r) => r.requiresManual).length;

        // 최종 요약 알림
        if (results.length > 0) {
            const summaryAlert: SettlementAlert = {
                type: "SUCCESS",
                pollId: "BATCH_SUMMARY",
                message: `Batch settlement completed: ${successCount}/${results.length} successful, ${manualCount} manual`,
                timestamp: now,
                additionalData: {
                    processed: results.length,
                    successful: successCount,
                    manualRequired: manualCount,
                    failed: results.length - successCount - manualCount,
                },
            };

            await sendSettlementAlert(summaryAlert);
        }

        return NextResponse.json({
            success: true,
            message: `Enhanced settlement processed ${results.length} polls, ${successCount} successful, ${manualCount} need manual intervention`,
            processed: results.length,
            successful: successCount,
            manualRequired: manualCount,
            results,
            alerts: alerts.length,
            timestamp: now,
        });
    } catch (error) {
        console.error("❌ Enhanced betting settlement cron error:", error);

        // 시스템 전체 오류 알림
        const criticalAlert: SettlementAlert = {
            type: "ERROR",
            pollId: "SYSTEM_ERROR",
            message: "Critical system error in betting settlement cron",
            timestamp: new Date(),
            additionalData: {
                error: error instanceof Error ? error.message : "Unknown error",
                stack: error instanceof Error ? error.stack : undefined,
            },
        };

        await sendSettlementAlert(criticalAlert);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date(),
            },
            { status: 500 }
        );
    }
}

// POST 메서드도 지원 (수동 트리거용)
export async function POST(request: NextRequest) {
    return GET(request);
}
