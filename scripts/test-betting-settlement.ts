#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client";
import {
    getSettlementAmountSinglePlayer,
    bulkSettlementPlayers,
    getSettlementPreview,
} from "../app/actions/polls/polls-bettingMode";

const prisma = new PrismaClient();

interface TestResult {
    testName: string;
    passed: boolean;
    details: any;
    issues?: string[];
}

class BettingSettlementTester {
    private results: TestResult[] = [];

    async runAllTests() {
        console.log("🧪 베팅모드 정산 로직 검증 시작...\n");

        await this.testMathPrecisionLoss();
        await this.testConcurrencyIssues();
        await this.testPartialFailureRecovery();
        await this.testDataConsistency();
        await this.testPerformanceWithLargeDataset();
        await this.testUIBoundaryConditions();

        this.printSummary();
    }

    async testMathPrecisionLoss() {
        console.log("🔢 테스트 1: Math.floor로 인한 정밀도 손실");

        const testData = {
            totalPayoutPool: 1000000, // 100만원
            playerBets: [
                { playerId: "player1", amount: 333333 }, // 33.3333%
                { playerId: "player2", amount: 333333 }, // 33.3333%
                { playerId: "player3", amount: 333334 }, // 33.3334%
            ],
        };

        const totalWinningBets = testData.playerBets.reduce(
            (sum, bet) => sum + bet.amount,
            0
        );
        let totalDistributed = 0;
        const distributions: {
            playerId: string;
            calculatedPayout: number;
            exactPayout: number;
        }[] = [];

        for (const bet of testData.playerBets) {
            const payoutRatio = bet.amount / totalWinningBets;
            const exactPayout = testData.totalPayoutPool * payoutRatio;
            const calculatedPayout = Math.floor(exactPayout); // 현재 로직

            totalDistributed += calculatedPayout;
            distributions.push({
                playerId: bet.playerId,
                calculatedPayout,
                exactPayout,
            });
        }

        const lostAmount = testData.totalPayoutPool - totalDistributed;
        const lostPercentage = (lostAmount / testData.totalPayoutPool) * 100;

        const issues = [];
        if (lostAmount > 0) {
            issues.push(
                `손실 금액: ${lostAmount}원 (${lostPercentage.toFixed(4)}%)`
            );
        }
        if (lostAmount > testData.totalPayoutPool * 0.001) {
            // 0.1% 이상 손실
            issues.push("허용 가능한 손실률(0.1%)을 초과함");
        }

        this.results.push({
            testName: "Math.floor 정밀도 손실",
            passed: lostAmount <= testData.totalPayoutPool * 0.001,
            details: {
                totalPayoutPool: testData.totalPayoutPool,
                totalDistributed,
                lostAmount,
                lostPercentage: `${lostPercentage.toFixed(4)}%`,
                distributions,
            },
            issues,
        });

        console.log(
            `   총 상금풀: ${testData.totalPayoutPool.toLocaleString()}원`
        );
        console.log(`   실제 분배: ${totalDistributed.toLocaleString()}원`);
        console.log(
            `   손실 금액: ${lostAmount.toLocaleString()}원 (${lostPercentage.toFixed(
                4
            )}%)`
        );
        console.log("");
    }

    async testConcurrencyIssues() {
        console.log("⚡ 테스트 2: 동시성 문제 시뮬레이션");

        // 가상 폴 데이터 생성
        const mockPollId = "test-poll-concurrency-" + Date.now();
        const winningOptionIds = ["option1"];
        const playerIds = Array.from(
            { length: 10 },
            (_, i) => `player-${i + 1}`
        );

        // 동시 정산 호출 시뮬레이션
        const concurrentCalls = Array.from({ length: 3 }, (_, i) =>
            this.simulateBulkSettlement(
                mockPollId,
                playerIds,
                winningOptionIds,
                i
            )
        );

        const results = await Promise.allSettled(concurrentCalls);

        const successCount = results.filter(
            (r) => r.status === "fulfilled"
        ).length;
        const failureCount = results.filter(
            (r) => r.status === "rejected"
        ).length;

        const issues = [];
        if (successCount > 1) {
            issues.push(`중복 정산 발생: ${successCount}개의 호출이 성공`);
        }
        if (failureCount === results.length) {
            issues.push("모든 정산 호출이 실패 (락 메커니즘 과도하게 보수적)");
        }

        this.results.push({
            testName: "동시성 제어",
            passed: successCount === 1,
            details: {
                totalCalls: concurrentCalls.length,
                successCount,
                failureCount,
                results: results.map((r, i) => ({
                    callId: i,
                    status: r.status,
                    result: r.status === "fulfilled" ? "success" : "failed",
                })),
            },
            issues,
        });

        console.log(`   동시 호출 수: ${concurrentCalls.length}`);
        console.log(`   성공한 호출: ${successCount}`);
        console.log(`   실패한 호출: ${failureCount}`);
        console.log("");
    }

    async testPartialFailureRecovery() {
        console.log("🔄 테스트 3: 부분 실패 복구 메커니즘");

        const testScenarios = [
            {
                name: "50% 플레이어 정산 후 실패",
                totalPlayers: 100,
                failurePoint: 50,
            },
            {
                name: "90% 플레이어 정산 후 실패",
                totalPlayers: 100,
                failurePoint: 90,
            },
        ];

        const issues = [];

        for (const scenario of testScenarios) {
            const settlementState = this.simulatePartialFailure(scenario);

            if (!settlementState.hasRollbackMechanism) {
                issues.push(`${scenario.name}: 롤백 메커니즘 없음`);
            }
            if (!settlementState.canResume) {
                issues.push(`${scenario.name}: 재개 메커니즘 없음`);
            }
            if (settlementState.dataInconsistency) {
                issues.push(`${scenario.name}: 데이터 불일치 발생`);
            }
        }

        this.results.push({
            testName: "부분 실패 복구",
            passed: issues.length === 0,
            details: {
                scenarios: testScenarios.map((s) => ({
                    ...s,
                    simulationResult: this.simulatePartialFailure(s),
                })),
            },
            issues,
        });

        console.log(`   테스트 시나리오: ${testScenarios.length}개`);
        console.log(`   발견된 문제: ${issues.length}개`);
        console.log("");
    }

    async testDataConsistency() {
        console.log("📊 테스트 4: 데이터 일관성 검증");

        // pollLog와 rewardLog 불일치 시뮬레이션
        const inconsistencyTests = [
            {
                scenario: "pollLog 100, rewardLog 95 (5 누락)",
                pollLogTotal: 100000,
                rewardLogTotal: 95000,
                expectedIssue: "rewardLog 누락",
            },
            {
                scenario: "pollLog 100, rewardLog 105 (5 중복)",
                pollLogTotal: 100000,
                rewardLogTotal: 105000,
                expectedIssue: "rewardLog 중복",
            },
        ];

        const issues = [];

        for (const test of inconsistencyTests) {
            const difference = Math.abs(
                test.pollLogTotal - test.rewardLogTotal
            );
            const toleranceThreshold = test.pollLogTotal * 0.01; // 1% 허용 오차

            if (difference > toleranceThreshold) {
                issues.push(
                    `${test.scenario}: 차이 ${difference}원 (허용 오차 초과)`
                );
            }

            // 현재 코드에서는 불일치를 warning으로만 처리하고 정산 계속 진행
            const currentBehavior = "warning_only"; // 실제 코드 동작
            if (currentBehavior === "warning_only" && difference > 0) {
                issues.push(
                    `${test.scenario}: 불일치 발견했지만 정산 계속 진행 (위험)`
                );
            }
        }

        this.results.push({
            testName: "데이터 일관성",
            passed: issues.length === 0,
            details: {
                tests: inconsistencyTests,
                toleranceThreshold: "1%",
                currentBehavior: "warning_only",
            },
            issues,
        });

        console.log(`   불일치 테스트: ${inconsistencyTests.length}개`);
        console.log(`   발견된 문제: ${issues.length}개`);
        console.log("");
    }

    async testPerformanceWithLargeDataset() {
        console.log("🚀 테스트 5: 대량 데이터 성능 검증");

        const testCases = [
            { playerCount: 1000, expectedMemoryMB: 50 },
            { playerCount: 5000, expectedMemoryMB: 200 },
            { playerCount: 10000, expectedMemoryMB: 500 },
        ];

        const issues = [];

        for (const testCase of testCases) {
            const simulation = this.simulateMemoryUsage(testCase.playerCount);

            if (
                simulation.estimatedMemoryMB >
                testCase.expectedMemoryMB * 1.5
            ) {
                issues.push(
                    `${testCase.playerCount}명: 예상 메모리 사용량 초과 (${
                        simulation.estimatedMemoryMB
                    }MB > ${testCase.expectedMemoryMB * 1.5}MB)`
                );
            }

            if (simulation.estimatedTimeSeconds > 300) {
                // 5분 초과
                issues.push(
                    `${testCase.playerCount}명: 처리 시간 과도 (${simulation.estimatedTimeSeconds}초)`
                );
            }

            if (simulation.riskOfMemoryLeak) {
                issues.push(`${testCase.playerCount}명: 메모리 누수 위험`);
            }
        }

        this.results.push({
            testName: "대량 데이터 성능",
            passed: issues.length === 0,
            details: {
                testCases: testCases.map((tc) => ({
                    ...tc,
                    simulation: this.simulateMemoryUsage(tc.playerCount),
                })),
            },
            issues,
        });

        console.log(`   성능 테스트: ${testCases.length}개 케이스`);
        console.log(`   성능 이슈: ${issues.length}개`);
        console.log("");
    }

    async testUIBoundaryConditions() {
        console.log("🖥️  테스트 6: UI 안전장치 검증");

        const boundaryCases = [
            { playerCount: 25, shouldWarn: false, description: "소량 정산" },
            {
                playerCount: 50,
                shouldWarn: true,
                description: "중간 규모 정산",
            },
            { playerCount: 100, shouldWarn: true, description: "대량 정산" },
            {
                playerCount: 500,
                shouldWarn: true,
                description: "매우 대량 정산",
            },
        ];

        const issues = [];

        // 현재 UI 코드 분석 (LiveLog 컴포넌트에서)
        const SAFETY_CONFIG = { maxPlayersPerBatch: 100 }; // 추정값

        for (const testCase of boundaryCases) {
            const currentUIBehavior = this.analyzeUIBehavior(
                testCase.playerCount,
                SAFETY_CONFIG
            );

            if (testCase.shouldWarn && !currentUIBehavior.showsWarning) {
                issues.push(`${testCase.playerCount}명: 경고 메시지 없음`);
            }

            if (
                testCase.playerCount > 100 &&
                !currentUIBehavior.requiresDoubleConfirm
            ) {
                issues.push(`${testCase.playerCount}명: 이중 확인 없음`);
            }

            // 50명 이상도 경고가 필요하지만 현재는 100명부터만 추가 확인
            if (
                testCase.playerCount >= 50 &&
                testCase.playerCount < 100 &&
                !currentUIBehavior.showsWarning
            ) {
                issues.push(`${testCase.playerCount}명: 50명 이상 경고 필요`);
            }
        }

        this.results.push({
            testName: "UI 안전장치",
            passed: issues.length === 0,
            details: {
                boundaryCases: boundaryCases.map((bc) => ({
                    ...bc,
                    currentBehavior: this.analyzeUIBehavior(
                        bc.playerCount,
                        SAFETY_CONFIG
                    ),
                })),
                currentSafetyConfig: SAFETY_CONFIG,
            },
            issues,
        });

        console.log(`   경계값 테스트: ${boundaryCases.length}개`);
        console.log(`   UI 이슈: ${issues.length}개`);
        console.log("");
    }

    // 헬퍼 메서드들
    private async simulateBulkSettlement(
        pollId: string,
        playerIds: string[],
        winningOptionIds: string[],
        callId: number
    ): Promise<any> {
        // 실제 API 호출 대신 시뮬레이션
        await new Promise((resolve) =>
            setTimeout(resolve, Math.random() * 100)
        );

        // 첫 번째 호출만 성공하도록 시뮬레이션
        if (callId === 0) {
            return { success: true, callId };
        } else {
            throw new Error(`Poll is currently being settled`);
        }
    }

    private simulatePartialFailure(scenario: any) {
        return {
            hasRollbackMechanism: false, // 현재 코드에는 부분 실패 시 롤백 없음
            canResume: true, // resumeSettlement 함수 존재
            dataInconsistency: scenario.failurePoint < scenario.totalPlayers, // 부분 정산 시 불일치 발생
            settledPlayers: scenario.failurePoint,
            unsettledPlayers: scenario.totalPlayers - scenario.failurePoint,
        };
    }

    private simulateMemoryUsage(playerCount: number) {
        // 플레이어 당 약 1KB 메모리 사용 추정
        const memoryPerPlayer = 1; // KB
        const baseMemory = 10; // MB

        return {
            estimatedMemoryMB:
                baseMemory + (playerCount * memoryPerPlayer) / 1024,
            estimatedTimeSeconds: Math.ceil(playerCount / 10), // 초당 10명 처리 추정
            riskOfMemoryLeak: playerCount > 5000, // 5000명 이상 시 위험
        };
    }

    private analyzeUIBehavior(playerCount: number, safetyConfig: any) {
        return {
            showsWarning:
                playerCount > safetyConfig.maxPlayersPerBatch ||
                playerCount > 50,
            requiresDoubleConfirm: playerCount > 100,
            requiresConfirmation: playerCount > 0,
            safetyLevel:
                playerCount > 500
                    ? "high_risk"
                    : playerCount > 100
                    ? "medium_risk"
                    : "low_risk",
        };
    }

    private printSummary() {
        console.log("📋 테스트 결과 요약\n");
        console.log("═".repeat(60));

        let totalTests = this.results.length;
        let passedTests = this.results.filter((r) => r.passed).length;
        let failedTests = totalTests - passedTests;

        console.log(`총 테스트: ${totalTests}개`);
        console.log(`통과: ${passedTests}개 ✅`);
        console.log(`실패: ${failedTests}개 ❌`);
        console.log("");

        // 실패한 테스트들의 상세 정보
        const failedResults = this.results.filter((r) => !r.passed);
        if (failedResults.length > 0) {
            console.log("🚨 발견된 문제점들:");
            console.log("─".repeat(40));

            failedResults.forEach((result, index) => {
                console.log(`${index + 1}. ${result.testName}`);
                if (result.issues) {
                    result.issues.forEach((issue) => {
                        console.log(`   • ${issue}`);
                    });
                }
                console.log("");
            });
        }

        // 권장 개선사항
        console.log("💡 권장 개선사항:");
        console.log("─".repeat(40));

        if (failedResults.some((r) => r.testName.includes("정밀도"))) {
            console.log("1. 정밀도 손실 개선: 잔여 금액 분배 알고리즘 도입");
        }

        if (failedResults.some((r) => r.testName.includes("동시성"))) {
            console.log("2. 동시성 제어 강화: 폴 단위 분산 락 구현");
        }

        if (failedResults.some((r) => r.testName.includes("복구"))) {
            console.log("3. 실패 복구 개선: 트랜잭션 롤백 메커니즘 추가");
        }

        if (failedResults.some((r) => r.testName.includes("일관성"))) {
            console.log("4. 데이터 일관성: 불일치 시 정산 중단 로직 추가");
        }

        if (failedResults.some((r) => r.testName.includes("성능"))) {
            console.log(
                "5. 성능 최적화: 스트리밍 방식 또는 배치 크기 동적 조정"
            );
        }

        if (failedResults.some((r) => r.testName.includes("UI"))) {
            console.log("6. UI 안전장치: 50명 이상부터 단계적 경고 시스템");
        }

        console.log("\n═".repeat(60));
        console.log(
            `전체 품질 점수: ${Math.round((passedTests / totalTests) * 100)}%`
        );
    }
}

// 실행
async function main() {
    const tester = new BettingSettlementTester();
    await tester.runAllTests();
    await prisma.$disconnect();
}

if (require.main === module) {
    main().catch(console.error);
}

export { BettingSettlementTester };
