import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { processNextSettlementStep } from "@/app/actions/polls-cron";
import { prisma } from "@/lib/prisma/client";

// 내부 정산 단계 (metadata에 저장)
export const INTERNAL_PHASES = {
    PHASE_1_PREPARE: "PHASE_1_PREPARE",
    PHASE_2_PROCESS: "PHASE_2_PROCESS",
    PHASE_3_FINALIZE: "PHASE_3_FINALIZE",
    PHASE_4_NOTIFY: "PHASE_4_NOTIFY",
    COMPLETED: "COMPLETED",
} as const;

// Vercel Cron Secret 검증
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
    const startTime = Date.now();

    try {
        // 🔒 보안: Authorization 헤더 확인
        const authHeader = request.headers.get("authorization");
        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // ⚡ 다음 정산 단계 실행 (1분 cron에 최적화된 단일 단계 처리)
        const result = await processNextSettlementStep();

        // 📊 실제 처리가 있을 때만 시스템 상태 조회 (성능 최적화)
        const systemStatus = result.silent
            ? null
            : await getSettlementSystemStatus();

        // 처리할 폴이 있을 때만 시작 로그 출력
        if (!result.silent) {
            console.info("🔄 Starting betting poll settlement cron job");
        }

        const totalExecutionTime = Date.now() - startTime;

        // ✅ 성공 응답
        if (result.success) {
            // 조용한 모드일 때는 간단한 로그만 출력
            if (!result.silent) {
                console.info(`✅ Settlement step completed successfully:`, {
                    phase: result.phase,
                    nextPhase: result.nextPhase,
                    message: result.message,
                    completed: result.completed,
                    executionTime: totalExecutionTime,
                    systemStatus,
                });
            }

            return NextResponse.json({
                success: true,
                data: {
                    settlement: {
                        phase: result.phase,
                        nextPhase: result.nextPhase,
                        message: result.message,
                        completed: result.completed,
                        executionTimeMs: result.executionTimeMs || 0,
                        metadata: result.metadata,
                        silent: result.silent,
                    },
                    systemStatus: result.silent ? null : systemStatus, // 조용한 모드일 때는 시스템 상태 생략
                    summary: {
                        currentPhase: result.phase,
                        isCompleted: result.completed,
                        totalExecutionTimeMs: totalExecutionTime,
                        timestamp: new Date().toISOString(),
                    },
                },
                performance: result.silent
                    ? null
                    : {
                          stepExecutionTimeMs: result.executionTimeMs || 0,
                          totalApiExecutionTimeMs: totalExecutionTime,
                          memoryUsage: process.memoryUsage(),
                      },
            });
        } else {
            // ❌ 에러 응답 (실패 시에도 상세 정보 제공)
            console.error(`❌ Settlement step failed:`, {
                phase: result.phase,
                error: result.error,
                executionTime: totalExecutionTime,
                systemStatus,
            });

            return NextResponse.json(
                {
                    success: false,
                    error: {
                        phase: result.phase,
                        message: result.error,
                        executionTimeMs: result.executionTimeMs || 0,
                        timestamp: new Date().toISOString(),
                    },
                    systemStatus, // 에러 상황에서도 시스템 상태 제공
                    debug: {
                        totalExecutionTimeMs: totalExecutionTime,
                        memoryUsage: process.memoryUsage(),
                        phase: result.phase,
                    },
                },
                { status: 500 }
            );
        }
    } catch (error) {
        const totalExecutionTime = Date.now() - startTime;

        console.error("❌ Critical cron settlement error:", {
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            executionTime: totalExecutionTime,
        });

        // 🚨 크리티컬 에러 시에도 가능한 한 많은 정보 제공
        let systemStatus = null;
        try {
            systemStatus = await getSettlementSystemStatus();
        } catch (statusError) {
            console.error("Failed to get system status:", statusError);
        }

        return NextResponse.json(
            {
                success: false,
                error: {
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                    type: "CRITICAL_ERROR",
                    timestamp: new Date().toISOString(),
                },
                systemStatus,
                debug: {
                    totalExecutionTimeMs: totalExecutionTime,
                    memoryUsage: process.memoryUsage(),
                    errorType:
                        error instanceof Error
                            ? error.constructor.name
                            : "Unknown",
                },
            },
            { status: 500 }
        );
    }
}

// POST 메서드도 지원 (수동 트리거용)
export async function POST(request: NextRequest) {
    return GET(request);
}

/**
 * 정산 시스템의 현재 상태를 조회합니다.
 */
async function getSettlementSystemStatus() {
    try {
        const [
            totalSettlingPolls,
            pollsByPhase,
            recentlyCompletedPolls,
            pendingPolls,
        ] = await Promise.all([
            // 현재 정산 중인 전체 폴 수
            prisma.poll.count({
                where: {
                    bettingMode: true,
                    isSettled: false,
                    bettingStatus: "SETTLING",
                },
            }),

            // Phase별 폴 수 (metadata 기반)
            prisma.poll.findMany({
                where: {
                    bettingMode: true,
                    isSettled: false,
                    bettingStatus: "SETTLING",
                },
                select: {
                    id: true,
                    title: true,
                    metadata: true,
                    updatedAt: true,
                },
            }),

            // 최근 24시간 내 완료된 정산 수
            prisma.poll.count({
                where: {
                    bettingMode: true,
                    isSettled: true,
                    settledAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
                },
            }),

            // 정산 대기 중인 폴 수 (종료됐지만 아직 정산 안된 것들)
            prisma.poll.count({
                where: {
                    bettingMode: true,
                    isSettled: false,
                    bettingStatus: "OPEN",
                    endDate: {
                        lt: new Date(),
                    },
                },
            }),
        ]);

        // Phase별 통계 계산
        const phaseStats = {
            PHASE_1_PREPARE: 0,
            PHASE_2_PROCESS: 0,
            PHASE_3_FINALIZE: 0,
            PHASE_4_NOTIFY: 0,
            UNKNOWN: 0,
        };

        const settlementDetails = pollsByPhase.map((poll) => {
            const metadata = poll.metadata as any;
            const phase = metadata?.settlementPhase || "UNKNOWN";

            if (phase in phaseStats) {
                phaseStats[phase as keyof typeof phaseStats]++;
            } else {
                phaseStats.UNKNOWN++;
            }

            return {
                pollId: poll.id,
                title: poll.title,
                currentPhase: phase,
                lastUpdated: poll.updatedAt,
                settlementData: metadata?.settlementData
                    ? {
                          totalBatches: metadata.settlementData.totalBatches,
                          currentBatch: metadata.settlementData.currentBatch,
                          processedWinners:
                              metadata.settlementData.processedWinners,
                          totalWinners: metadata.settlementData.totalWinners,
                          isRefund: metadata.settlementData.isRefund,
                      }
                    : null,
            };
        });

        return {
            overview: {
                totalSettlingPolls,
                pendingPolls,
                recentlyCompletedPolls,
                healthStatus:
                    totalSettlingPolls < 10
                        ? "HEALTHY"
                        : totalSettlingPolls < 50
                        ? "BUSY"
                        : "OVERLOADED",
            },
            phaseDistribution: phaseStats,
            activeSettlements: settlementDetails.slice(0, 5), // 최대 5개만 표시
            timing: {
                avgSettlementTimeEstimate: "~4-8 minutes", // 4 phases × 1-2분
                lastCheckTimestamp: new Date().toISOString(),
            },
        };
    } catch (error) {
        console.error("Failed to get settlement system status:", error);
        return {
            overview: {
                healthStatus: "ERROR",
                error: "Failed to fetch system status",
            },
            timestamp: new Date().toISOString(),
        };
    }
}
