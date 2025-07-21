#!/usr/bin/env tsx

/// scripts/run-all-settlement-tests.ts

import { runAllEdgeCaseTests } from "./test-settlement-edge-cases";
import { runStressTests } from "./test-settlement-stress";
import { runIntegrationTests } from "./test-settlement-integration";

interface TestSuite {
    name: string;
    description: string;
    runner: () => Promise<void>;
    category: "PERFORMANCE" | "EDGE_CASES" | "STRESS" | "INTEGRATION";
    estimatedTime: number; // minutes
}

const TEST_SUITES: TestSuite[] = [
    {
        name: "성능 최적화 테스트",
        description: "배치 처리, 캐싱, 쿼리 최적화 검증",
        runner: async () => {
            console.log("📊 성능 최적화 테스트는 별도 스크립트로 실행하세요:");
            console.log("   npx tsx scripts/test-optimization-simulation.ts");
        },
        category: "PERFORMANCE",
        estimatedTime: 2,
    },
    {
        name: "엣지케이스 테스트",
        description: "동시성, 대규모, 캐시 무효화, 극한 비율 테스트",
        runner: runAllEdgeCaseTests,
        category: "EDGE_CASES",
        estimatedTime: 3,
    },
    {
        name: "스트레스 & 보안 테스트",
        description:
            "DB 연결 실패, 오버플로우, 특수문자, 메모리 누수, 시간대 처리",
        runner: runStressTests,
        category: "STRESS",
        estimatedTime: 5,
    },
    {
        name: "통합 테스트",
        description: "실제 데이터 기반 시나리오 검증",
        runner: runIntegrationTests,
        category: "INTEGRATION",
        estimatedTime: 4,
    },
];

interface TestSuiteResult {
    name: string;
    category: string;
    success: boolean;
    executionTime: number;
    error?: string;
    startTime: Date;
    endTime: Date;
}

async function runTestSuite(testSuite: TestSuite): Promise<TestSuiteResult> {
    const startTime = new Date();
    console.log(`\n🧪 시작: ${testSuite.name}`);
    console.log(`   설명: ${testSuite.description}`);
    console.log(`   예상 소요 시간: ${testSuite.estimatedTime}분`);
    console.log("═".repeat(60));

    try {
        await testSuite.runner();
        const endTime = new Date();
        const executionTime = endTime.getTime() - startTime.getTime();

        console.log("\n" + "═".repeat(60));
        console.log(
            `✅ 완료: ${testSuite.name} (${Math.round(executionTime / 1000)}초)`
        );

        return {
            name: testSuite.name,
            category: testSuite.category,
            success: true,
            executionTime,
            startTime,
            endTime,
        };
    } catch (error) {
        const endTime = new Date();
        const executionTime = endTime.getTime() - startTime.getTime();
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";

        console.log("\n" + "═".repeat(60));
        console.log(
            `❌ 실패: ${testSuite.name} (${Math.round(executionTime / 1000)}초)`
        );
        console.log(`   오류: ${errorMessage}`);

        return {
            name: testSuite.name,
            category: testSuite.category,
            success: false,
            executionTime,
            error: errorMessage,
            startTime,
            endTime,
        };
    }
}

function generateComprehensiveReport(results: TestSuiteResult[]): void {
    console.log("\n" + "═".repeat(80));
    console.log("🏆 정산 시스템 종합 테스트 보고서");
    console.log("═".repeat(80));

    const totalTests = results.length;
    const successfulTests = results.filter((r) => r.success).length;
    const failedTests = results.filter((r) => !r.success).length;
    const successRate = (successfulTests / totalTests) * 100;

    // 전체 요약
    console.log(`\n📊 전체 요약:`);
    console.log(`   총 테스트 스위트: ${totalTests}개`);
    console.log(`   성공: ${successfulTests}개`);
    console.log(`   실패: ${failedTests}개`);
    console.log(`   성공률: ${successRate.toFixed(1)}%`);

    // 실행 시간 분석
    const totalExecutionTime = results.reduce(
        (sum, r) => sum + r.executionTime,
        0
    );
    const avgExecutionTime = totalExecutionTime / totalTests;

    console.log(`\n⏱️ 실행 시간 분석:`);
    console.log(
        `   총 실행 시간: ${Math.round(
            totalExecutionTime / 1000
        )}초 (${Math.round(totalExecutionTime / 60000)}분)`
    );
    console.log(
        `   평균 스위트 시간: ${Math.round(avgExecutionTime / 1000)}초`
    );

    // 카테고리별 결과
    const categories = [...new Set(results.map((r) => r.category))];
    console.log(`\n📋 카테고리별 결과:`);

    categories.forEach((category) => {
        const categoryResults = results.filter((r) => r.category === category);
        const categorySuccess = categoryResults.filter((r) => r.success).length;
        const categoryTotal = categoryResults.length;
        const categoryRate = (categorySuccess / categoryTotal) * 100;

        const statusIcon =
            categoryRate === 100 ? "✅" : categoryRate >= 50 ? "⚠️" : "❌";
        console.log(
            `   ${statusIcon} ${category}: ${categorySuccess}/${categoryTotal} (${categoryRate.toFixed(
                1
            )}%)`
        );
    });

    // 상세 결과
    console.log(`\n🔍 상세 테스트 결과:`);
    results.forEach((result) => {
        const statusIcon = result.success ? "✅" : "❌";
        const duration = Math.round(result.executionTime / 1000);

        console.log(`\n${statusIcon} ${result.name}`);
        console.log(`   카테고리: ${result.category}`);
        console.log(`   실행 시간: ${duration}초`);
        console.log(`   시작: ${result.startTime.toLocaleTimeString()}`);
        console.log(`   종료: ${result.endTime.toLocaleTimeString()}`);

        if (!result.success && result.error) {
            console.log(`   오류: ${result.error}`);
        }
    });

    // 시스템 안정성 평가
    console.log(`\n🛡️ 시스템 안정성 평가:`);

    if (successRate >= 95) {
        console.log("🏆 등급: A+ (매우 우수)");
        console.log("   모든 테스트 통과 - 운영 환경 배포 준비 완료");
    } else if (successRate >= 85) {
        console.log("✅ 등급: A (우수)");
        console.log("   대부분 테스트 통과 - 일부 개선 후 배포 가능");
    } else if (successRate >= 70) {
        console.log("⚠️ 등급: B (보통)");
        console.log("   상당한 개선 필요 - 운영 전 추가 검토 권장");
    } else if (successRate >= 50) {
        console.log("🚨 등급: C (위험)");
        console.log("   심각한 문제 존재 - 운영 배포 부적절");
    } else {
        console.log("💀 등급: D (매우 위험)");
        console.log("   시스템 전체 재검토 필요 - 즉시 개선 조치 요구");
    }

    // 권장사항
    console.log(`\n💡 권장사항:`);

    const failedCategories = categories.filter((cat) => {
        const catResults = results.filter((r) => r.category === cat);
        const catSuccessRate =
            catResults.filter((r) => r.success).length / catResults.length;
        return catSuccessRate < 1.0;
    });

    if (failedCategories.length === 0) {
        console.log("   🎉 모든 테스트 카테고리 통과!");
        console.log("   정기적인 테스트 실행으로 품질 유지 권장");
    } else {
        console.log("   우선 개선 대상:");
        failedCategories.forEach((cat) => {
            const catResults = results.filter(
                (r) => r.category === cat && !r.success
            );
            console.log(
                `   - ${cat}: ${catResults.map((r) => r.name).join(", ")}`
            );
        });
    }

    // 성능 권장사항
    const slowTests = results.filter((r) => r.executionTime > 300000); // 5분 초과
    if (slowTests.length > 0) {
        console.log(`\n⚡ 성능 개선 필요:`);
        slowTests.forEach((test) => {
            console.log(
                `   - ${test.name}: ${Math.round(test.executionTime / 1000)}초`
            );
        });
    }

    // 다음 단계
    console.log(`\n🚀 다음 단계:`);
    if (successRate >= 90) {
        console.log("   1. 운영 환경 모니터링 설정");
        console.log("   2. 정기적인 성능 벤치마크 실행");
        console.log("   3. 사용자 피드백 수집 시스템 구축");
    } else {
        console.log("   1. 실패한 테스트 케이스 우선 수정");
        console.log("   2. 코드 리뷰 및 추가 테스트 작성");
        console.log("   3. 수정 후 전체 테스트 재실행");
    }

    console.log("\n" + "═".repeat(80));
}

async function runAllSettlementTests(): Promise<void> {
    console.log("🧪 정산 시스템 종합 테스트 시작");
    console.log("═".repeat(80));

    const overallStartTime = new Date();
    const estimatedTotalTime = TEST_SUITES.reduce(
        (sum, suite) => sum + suite.estimatedTime,
        0
    );

    console.log(`📅 시작 시간: ${overallStartTime.toLocaleString()}`);
    console.log(`⏰ 예상 총 소요 시간: ${estimatedTotalTime}분`);
    console.log(`🧪 실행할 테스트 스위트: ${TEST_SUITES.length}개`);

    const results: TestSuiteResult[] = [];

    // 각 테스트 스위트 순차 실행
    for (let i = 0; i < TEST_SUITES.length; i++) {
        const testSuite = TEST_SUITES[i];
        console.log(
            `\n[${i + 1}/${TEST_SUITES.length}] 진행률: ${(
                (i / TEST_SUITES.length) *
                100
            ).toFixed(1)}%`
        );

        const result = await runTestSuite(testSuite);
        results.push(result);

        // 중간 결과 요약 (마지막 테스트 제외)
        if (i < TEST_SUITES.length - 1) {
            const currentSuccessRate =
                (results.filter((r) => r.success).length / results.length) *
                100;
            console.log(
                `\n📊 중간 요약: ${results.filter((r) => r.success).length}/${
                    results.length
                } 성공 (${currentSuccessRate.toFixed(1)}%)`
            );

            // 잠시 대기 (시스템 부하 방지)
            console.log("⏳ 다음 테스트 준비 중... (3초 대기)");
            await new Promise((resolve) => setTimeout(resolve, 3000));
        }
    }

    const overallEndTime = new Date();
    const totalDuration = overallEndTime.getTime() - overallStartTime.getTime();

    console.log(`\n🏁 모든 테스트 완료!`);
    console.log(`📅 종료 시간: ${overallEndTime.toLocaleString()}`);
    console.log(
        `⏰ 실제 소요 시간: ${Math.round(totalDuration / 60000)}분 ${Math.round(
            (totalDuration % 60000) / 1000
        )}초`
    );

    // 종합 보고서 생성
    generateComprehensiveReport(results);
}

// 프로그램 종료 핸들러
process.on("SIGINT", () => {
    console.log("\n\n⚠️ 테스트가 중단되었습니다.");
    console.log("부분적으로 완료된 테스트 결과가 있을 수 있습니다.");
    process.exit(0);
});

// 스크립트 실행
if (require.main === module) {
    runAllSettlementTests()
        .then(() => {
            console.log("\n🎉 정산 시스템 종합 테스트 완료!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("\n💥 종합 테스트 실행 중 치명적 오류:", error);
            process.exit(1);
        });
}

export { runAllSettlementTests };
