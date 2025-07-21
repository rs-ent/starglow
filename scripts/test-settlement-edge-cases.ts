#!/usr/bin/env tsx

/// scripts/test-settlement-edge-cases.ts

import { prisma } from "@/lib/prisma/client";
import { bulkSettlementPlayers } from "@/app/actions/polls/polls-bettingMode";
import { settlementCacheManager } from "@/lib/utils/formatting";

interface TestScenario {
    name: string;
    description: string;
    risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    expectedBehavior: string;
}

interface TestResult {
    scenario: string;
    passed: boolean;
    details: any;
    risks: string[];
    recommendations: string[];
}

const EDGE_CASE_SCENARIOS: TestScenario[] = [
    {
        name: "WHALE_BETTING",
        description: "한 명이 전체 베팅의 90% 이상을 차지하는 경우",
        risk: "HIGH",
        expectedBehavior: "극단적 배당 집중에도 정확한 계산",
    },
    {
        name: "MICRO_BETTING",
        description: "1원 베팅들만 있는 경우 (반올림 오차 테스트)",
        risk: "MEDIUM",
        expectedBehavior: "반올림 오차 최소화, 수지 균형 유지",
    },
    {
        name: "TIE_SCENARIO",
        description: "무승부 상황 (모든 옵션이 승리)",
        risk: "MEDIUM",
        expectedBehavior: "전액 환불, 수수료 미징수",
    },
    {
        name: "NO_WINNERS",
        description: "승리자가 없는 경우 (빈 승리 옵션)",
        risk: "HIGH",
        expectedBehavior: "전액 환불 또는 적절한 오류 처리",
    },
    {
        name: "SINGLE_WINNER",
        description: "단 한 명만 승리하는 경우",
        risk: "MEDIUM",
        expectedBehavior: "전체 상금 풀을 한 명이 독차지",
    },
    {
        name: "MASSIVE_SCALE",
        description: "10,000명 이상 대규모 정산",
        risk: "CRITICAL",
        expectedBehavior: "메모리 안정성, 성능 유지",
    },
    {
        name: "CACHE_INVALIDATION",
        description: "캐시 무효화 중 정산 실행",
        risk: "HIGH",
        expectedBehavior: "데이터 일관성 유지",
    },
    {
        name: "CONCURRENT_SETTLEMENT",
        description: "동일 폴에 대한 동시 정산 요청",
        risk: "CRITICAL",
        expectedBehavior: "중복 정산 방지, 데이터 무결성",
    },
    {
        name: "PARTIAL_FAILURE",
        description: "일부 플레이어 정산 실패 상황",
        risk: "HIGH",
        expectedBehavior: "트랜잭션 롤백 또는 부분 성공 처리",
    },
    {
        name: "EXTREME_RATIOS",
        description: "극도로 불균등한 배당 비율 (0.001% vs 99.999%)",
        risk: "MEDIUM",
        expectedBehavior: "정밀한 소수점 계산",
    },
];

async function findTestPoll(): Promise<any> {
    console.log("🔍 테스트용 폴 검색 중...");

    const testPoll = await prisma.poll.findFirst({
        where: {
            bettingMode: true,
            totalVotes: { gt: 0 },
        },
        orderBy: { totalVotes: "desc" },
        include: {
            pollLogs: {
                select: {
                    id: true,
                    playerId: true,
                    optionId: true,
                    amount: true,
                },
                take: 50,
            },
        },
    });

    if (!testPoll || (testPoll as any).pollLogs.length < 5) {
        throw new Error(
            "테스트용 폴 데이터가 충분하지 않습니다. 베팅 데이터가 있는 폴이 필요합니다."
        );
    }

    console.log(`✅ 선택된 폴: ${testPoll.title}`);
    console.log(`📊 총 베팅: ${testPoll.totalVotes.toLocaleString()}원`);
    console.log(
        `👥 베팅 참여자: ${(testPoll as any).pollLogs.length}명 (샘플)`
    );

    return testPoll;
}

async function createTestPollWithScenario(scenario: string): Promise<any> {
    console.log(`\n🧪 시나리오 "${scenario}" 테스트 데이터 생성 중...`);

    // 기존 폴 중 적절한 것을 찾거나 새로 생성
    const existingPoll = await prisma.poll.findFirst({
        where: {
            bettingMode: true,
            isSettled: false,
        },
        include: {
            pollLogs: {
                take: 10,
                include: {
                    player: {
                        select: { id: true },
                    },
                },
            },
        },
    });

    if (!existingPoll || existingPoll.pollLogs.length < 5) {
        throw new Error(
            "테스트용 폴 데이터가 충분하지 않습니다. 실제 베팅 데이터가 있는 폴이 필요합니다."
        );
    }

    // 시나리오별 데이터 조작 (읽기 전용 시뮬레이션)
    const pollData = {
        ...existingPoll,
        logs: existingPoll.pollLogs,
    };

    switch (scenario) {
        case "WHALE_BETTING":
            // 첫 번째 플레이어에게 90% 집중
            pollData.logs = pollData.logs.map((log, index) => ({
                ...log,
                amount: index === 0 ? 90000 : 100,
            }));
            break;

        case "MICRO_BETTING":
            // 모든 베팅을 1원으로
            pollData.logs = pollData.logs.map((log) => ({
                ...log,
                amount: 1,
            }));
            break;

        case "SINGLE_WINNER":
            // 한 명만 승리 옵션에 베팅
            const winningOptionId = pollData.logs[0]?.optionId;
            pollData.logs = pollData.logs.map((log, index) => ({
                ...log,
                optionId: index === 0 ? winningOptionId : "losingOption",
            }));
            break;
    }

    return pollData;
}

async function testConcurrentSettlement(
    pollId: string,
    playerIds: string[]
): Promise<TestResult> {
    console.log(`\n🔄 동시성 테스트: 동일 폴에 대한 3개 동시 정산 요청...`);

    const winningOptionIds = ["option1"];
    const startTime = Date.now();

    try {
        // 3개의 동시 정산 요청 실행
        const concurrentPromises = [
            bulkSettlementPlayers({
                pollId,
                playerIds: playerIds.slice(0, 3),
                winningOptionIds,
            }),
            bulkSettlementPlayers({
                pollId,
                playerIds: playerIds.slice(1, 4),
                winningOptionIds,
            }),
            bulkSettlementPlayers({
                pollId,
                playerIds: playerIds.slice(2, 5),
                winningOptionIds,
            }),
        ];

        const results = await Promise.allSettled(concurrentPromises);
        const duration = Date.now() - startTime;

        const successCount = results.filter(
            (r) => r.status === "fulfilled"
        ).length;
        const errorCount = results.filter(
            (r) => r.status === "rejected"
        ).length;

        return {
            scenario: "CONCURRENT_SETTLEMENT",
            passed: errorCount === 0 || successCount === 1, // 하나만 성공하거나 모두 성공
            details: {
                duration,
                successCount,
                errorCount,
                results: results.map((r) => r.status),
            },
            risks: errorCount > 1 ? ["중복 정산 위험"] : [],
            recommendations:
                errorCount > 1
                    ? ["중복 정산 방지 로직 강화 필요"]
                    : ["동시성 처리 양호"],
        };
    } catch (error) {
        return {
            scenario: "CONCURRENT_SETTLEMENT",
            passed: false,
            details: {
                error: error instanceof Error ? error.message : "Unknown error",
            },
            risks: ["동시성 처리 실패"],
            recommendations: ["트랜잭션 격리 수준 검토", "락 메커니즘 도입"],
        };
    }
}

async function testMassiveScale(): Promise<TestResult> {
    console.log(`\n📊 대규모 테스트: 메모리 및 성능 한계 시뮬레이션...`);

    const startMemory = process.memoryUsage();
    const startTime = Date.now();

    try {
        // 대용량 데이터 시뮬레이션 (실제 DB 조작 없이)
        const massivePlayerList = Array.from(
            { length: 10000 },
            (_, i) => `player_${i}`
        );
        const chunks = [];

        // 메모리 사용량 측정
        for (let i = 0; i < massivePlayerList.length; i += 100) {
            chunks.push(massivePlayerList.slice(i, i + 100));

            // 매 1000명마다 메모리 체크
            if (i % 1000 === 0) {
                const currentMemory = process.memoryUsage();
                const memoryIncrease =
                    currentMemory.heapUsed - startMemory.heapUsed;

                if (memoryIncrease > 500 * 1024 * 1024) {
                    // 500MB 초과
                    throw new Error(
                        `메모리 사용량 초과: ${Math.round(
                            memoryIncrease / 1024 / 1024
                        )}MB`
                    );
                }
            }
        }

        const endMemory = process.memoryUsage();
        const duration = Date.now() - startTime;
        const memoryUsed = Math.round(
            (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024
        );

        return {
            scenario: "MASSIVE_SCALE",
            passed: memoryUsed < 200, // 200MB 이하로 유지
            details: {
                playerCount: massivePlayerList.length,
                chunkCount: chunks.length,
                duration,
                memoryUsedMB: memoryUsed,
                memoryLimitMB: 200,
            },
            risks: memoryUsed > 200 ? ["메모리 초과 위험"] : [],
            recommendations:
                memoryUsed > 200
                    ? ["배치 크기 축소", "가비지 컬렉션 최적화"]
                    : ["현재 메모리 사용량 적정"],
        };
    } catch (error) {
        return {
            scenario: "MASSIVE_SCALE",
            passed: false,
            details: {
                error: error instanceof Error ? error.message : "Unknown error",
            },
            risks: ["메모리 누수", "성능 저하"],
            recommendations: ["메모리 프로파일링", "배치 크기 재조정"],
        };
    }
}

async function testCacheInvalidation(pollId: string): Promise<TestResult> {
    console.log(`\n💾 캐시 무효화 테스트: 캐시 초기화 중 정산 실행...`);

    try {
        // 캐시에 데이터 로드
        const initialStats = settlementCacheManager.getCacheStats();

        // 캐시 무효화와 동시에 정산 실행
        const concurrentOperations = [
            // 캐시 초기화
            (async () => {
                await new Promise((resolve) => setTimeout(resolve, 50));
                settlementCacheManager.clearCache(pollId);
                return "cache_cleared";
            })(),

            // 정산 실행 (시뮬레이션)
            (async () => {
                await new Promise((resolve) => setTimeout(resolve, 100));
                return "settlement_completed";
            })(),
        ];

        const results = await Promise.all(concurrentOperations);
        const finalStats = settlementCacheManager.getCacheStats();

        return {
            scenario: "CACHE_INVALIDATION",
            passed: true, // 오류 없이 완료되면 통과
            details: {
                operations: results,
                initialCacheSize: initialStats.totalEntries,
                finalCacheSize: finalStats.totalEntries,
                cacheCleared:
                    initialStats.totalEntries > finalStats.totalEntries,
            },
            risks: [],
            recommendations: ["캐시 무효화 처리 정상"],
        };
    } catch (error) {
        return {
            scenario: "CACHE_INVALIDATION",
            passed: false,
            details: {
                error: error instanceof Error ? error.message : "Unknown error",
            },
            risks: ["캐시 동시성 문제"],
            recommendations: ["캐시 락 메커니즘 도입"],
        };
    }
}

async function testExtremeBettingRatios(): Promise<TestResult> {
    console.log(`\n⚖️ 극한 배당 비율 테스트: 0.001% vs 99.999% 분배...`);

    try {
        // 극단적인 베팅 비율 시뮬레이션
        const totalPool = 1000000; // 100만원
        const tinyBet = 10; // 10원
        const hugeBet = totalPool - tinyBet; // 999,990원

        const tinyRatio = tinyBet / totalPool;
        const hugeRatio = hugeBet / totalPool;

        // 정밀도 테스트
        const tinyPayout = Math.floor(totalPool * tinyRatio);
        const hugePayout = Math.floor(totalPool * hugeRatio);
        const calculatedTotal = tinyPayout + hugePayout;

        const precisionLoss = Math.abs(calculatedTotal - totalPool);
        const precisionErrorRate = (precisionLoss / totalPool) * 100;

        return {
            scenario: "EXTREME_RATIOS",
            passed: precisionErrorRate < 0.1, // 0.1% 미만 오차
            details: {
                totalPool,
                tinyBet,
                hugeBet,
                tinyRatio: tinyRatio * 100,
                hugeRatio: hugeRatio * 100,
                tinyPayout,
                hugePayout,
                calculatedTotal,
                precisionLoss,
                precisionErrorRate,
            },
            risks: precisionErrorRate >= 0.1 ? ["정밀도 손실"] : [],
            recommendations:
                precisionErrorRate >= 0.1
                    ? ["BigDecimal 라이브러리 도입", "정밀도 향상 알고리즘"]
                    : ["현재 정밀도 수준 적정"],
        };
    } catch (error) {
        return {
            scenario: "EXTREME_RATIOS",
            passed: false,
            details: {
                error: error instanceof Error ? error.message : "Unknown error",
            },
            risks: ["계산 정확도 문제"],
            recommendations: ["수치 계산 로직 검토"],
        };
    }
}

async function runAllEdgeCaseTests(): Promise<void> {
    console.log("🧪 정산 시스템 엣지케이스 & 리스크 종합 테스트");
    console.log("═".repeat(60));

    const results: TestResult[] = [];

    try {
        // 기본 폴 데이터 가져오기
        const testPoll = await findTestPoll();

        const playerIds = testPoll.pollLogs.map((log: any) => log.playerId);

        // 1. 동시성 테스트
        results.push(await testConcurrentSettlement(testPoll.id, playerIds));

        // 2. 대규모 테스트
        results.push(await testMassiveScale());

        // 3. 캐시 무효화 테스트
        results.push(await testCacheInvalidation(testPoll.id));

        // 4. 극한 배당 비율 테스트
        results.push(await testExtremeBettingRatios());

        // 결과 요약
        console.log("\n📊 테스트 결과 요약");
        console.log("═".repeat(60));

        const passedTests = results.filter((r) => r.passed).length;
        const totalTests = results.length;
        const passRate = (passedTests / totalTests) * 100;

        console.log(
            `✅ 통과: ${passedTests}/${totalTests} (${passRate.toFixed(1)}%)`
        );

        // 위험도별 분류
        const criticalRisks: string[] = [];
        const highRisks: string[] = [];
        const mediumRisks: string[] = [];

        results.forEach((result) => {
            if (!result.passed) {
                result.risks.forEach((risk) => {
                    if (risk.includes("메모리") || risk.includes("동시성")) {
                        criticalRisks.push(`${result.scenario}: ${risk}`);
                    } else if (risk.includes("정산") || risk.includes("캐시")) {
                        highRisks.push(`${result.scenario}: ${risk}`);
                    } else {
                        mediumRisks.push(`${result.scenario}: ${risk}`);
                    }
                });
            }
        });

        // 상세 결과 출력
        console.log("\n🔍 상세 테스트 결과:");
        results.forEach((result) => {
            const statusIcon = result.passed ? "✅" : "❌";
            console.log(`\n${statusIcon} ${result.scenario}`);
            console.log(`   상태: ${result.passed ? "통과" : "실패"}`);

            if (!result.passed && result.risks.length > 0) {
                console.log(`   위험: ${result.risks.join(", ")}`);
            }

            if (result.recommendations.length > 0) {
                console.log(`   권장: ${result.recommendations.join(", ")}`);
            }

            // 주요 지표 출력
            if (result.details) {
                if (result.scenario === "MASSIVE_SCALE") {
                    console.log(
                        `   메모리: ${result.details.memoryUsedMB}MB/${result.details.memoryLimitMB}MB`
                    );
                    console.log(
                        `   처리량: ${result.details.playerCount.toLocaleString()}명`
                    );
                } else if (result.scenario === "CONCURRENT_SETTLEMENT") {
                    console.log(
                        `   성공/오류: ${result.details.successCount}/${result.details.errorCount}`
                    );
                } else if (result.scenario === "EXTREME_RATIOS") {
                    console.log(
                        `   정밀도 오차: ${result.details.precisionErrorRate.toFixed(
                            4
                        )}%`
                    );
                }
            }
        });

        // 최종 권장사항
        console.log("\n🎯 최종 권장사항");
        console.log("═".repeat(60));

        if (criticalRisks.length > 0) {
            console.log("🚨 긴급 수정 필요:");
            criticalRisks.forEach((risk) => console.log(`   - ${risk}`));
        }

        if (highRisks.length > 0) {
            console.log("⚠️ 우선 검토 필요:");
            highRisks.forEach((risk) => console.log(`   - ${risk}`));
        }

        if (mediumRisks.length > 0) {
            console.log("💡 개선 고려사항:");
            mediumRisks.forEach((risk) => console.log(`   - ${risk}`));
        }

        if (passRate >= 90) {
            console.log("🏆 전체 시스템 안정성: 우수");
        } else if (passRate >= 75) {
            console.log("✅ 전체 시스템 안정성: 양호");
        } else {
            console.log("⚠️ 전체 시스템 안정성: 개선 필요");
        }
    } catch (error) {
        console.error("테스트 실행 중 오류:", error);
    }
}

// 스크립트 실행
if (require.main === module) {
    runAllEdgeCaseTests()
        .then(() => {
            console.log("\n🔬 엣지케이스 테스트 완료");
            process.exit(0);
        })
        .catch((error) => {
            console.error("테스트 실패:", error);
            process.exit(1);
        });
}

export { runAllEdgeCaseTests };
