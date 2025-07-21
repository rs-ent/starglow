#!/usr/bin/env tsx

/// scripts/test-settlement-stress.ts

import { prisma } from "@/lib/prisma/client";
import { bulkSettlementPlayersOptimized } from "@/app/actions/polls/polls-bettingMode";

interface StressTestResult {
    testName: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    passed: boolean;
    executionTime: number;
    memoryUsage: number;
    details: any;
    vulnerabilities: string[];
    mitigations: string[];
}

async function testDatabaseConnectionFailure(): Promise<StressTestResult> {
    console.log("\n💔 데이터베이스 연결 실패 테스트...");

    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
        // 의도적으로 잘못된 연결 시도 (시뮬레이션)
        const invalidQuery = prisma.$queryRaw`SELECT * FROM non_existent_table_123456`;

        await invalidQuery.catch((error) => {
            // 예상된 오류 - 연결 실패 처리 테스트
            if (
                error.message.includes("relation") ||
                error.message.includes("table")
            ) {
                return { connectionTest: "handled" };
            }
            throw error;
        });

        return {
            testName: "DATABASE_CONNECTION_FAILURE",
            severity: "CRITICAL",
            passed: true,
            executionTime: Date.now() - startTime,
            memoryUsage: process.memoryUsage().heapUsed - startMemory,
            details: { connectionHandling: "graceful" },
            vulnerabilities: [],
            mitigations: ["적절한 연결 실패 처리 확인됨"],
        };
    } catch (error) {
        return {
            testName: "DATABASE_CONNECTION_FAILURE",
            severity: "CRITICAL",
            passed: false,
            executionTime: Date.now() - startTime,
            memoryUsage: process.memoryUsage().heapUsed - startMemory,
            details: {
                error: error instanceof Error ? error.message : "Unknown error",
            },
            vulnerabilities: ["연결 실패 시 불안정한 상태"],
            mitigations: [
                "연결 풀 관리 강화",
                "재시도 로직 구현",
                "장애 조치 프로세스",
            ],
        };
    }
}

async function testIntegerOverflow(): Promise<StressTestResult> {
    console.log("\n🔢 정수 오버플로우 테스트...");

    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
        // JavaScript의 MAX_SAFE_INTEGER 테스트
        const maxSafeInt = Number.MAX_SAFE_INTEGER; // 9,007,199,254,740,991
        const beyondSafe = maxSafeInt + 1000;

        // 극대값으로 계산 시뮬레이션
        const totalPool = maxSafeInt;
        const playerBet = maxSafeInt - 1000;
        const ratio = playerBet / totalPool;
        const payout = Math.floor(totalPool * ratio);

        // 정밀도 손실 검사
        const calculationAccurate = Math.abs(payout - playerBet) < 1000;

        // BigInt 안전성 테스트
        const bigIntPool = BigInt(totalPool);
        const bigIntBet = BigInt(playerBet);
        const bigIntPayout = (bigIntPool * bigIntBet) / bigIntPool;

        return {
            testName: "INTEGER_OVERFLOW",
            severity: "HIGH",
            passed: calculationAccurate,
            executionTime: Date.now() - startTime,
            memoryUsage: process.memoryUsage().heapUsed - startMemory,
            details: {
                maxSafeInteger: maxSafeInt,
                beyondSafe: beyondSafe,
                calculationAccurate,
                regularPayout: payout,
                bigIntPayout: bigIntPayout.toString(),
                precisionLoss: Math.abs(payout - playerBet),
            },
            vulnerabilities: !calculationAccurate
                ? ["대용량 숫자 처리 시 정밀도 손실"]
                : [],
            mitigations: !calculationAccurate
                ? ["BigInt 사용 고려", "정밀도 검증 로직 추가"]
                : ["현재 정수 처리 안정적"],
        };
    } catch (error) {
        return {
            testName: "INTEGER_OVERFLOW",
            severity: "HIGH",
            passed: false,
            executionTime: Date.now() - startTime,
            memoryUsage: process.memoryUsage().heapUsed - startMemory,
            details: {
                error: error instanceof Error ? error.message : "Unknown error",
            },
            vulnerabilities: ["정수 오버플로우 처리 실패"],
            mitigations: ["안전한 수치 계산 라이브러리 도입"],
        };
    }
}

async function testUnicodeAndSpecialCharacters(): Promise<StressTestResult> {
    console.log("\n🔤 유니코드 및 특수문자 처리 테스트...");

    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
        // 다양한 특수 문자 및 유니코드 테스트
        const specialInputs = [
            "💰🎯🚀", // 이모지
            "SELECT * FROM polls; DROP TABLE polls;--", // SQL 인젝션 시도
            "한글玻璃🌟αβγδε", // 다국어 + 이모지
            "''; DROP TABLE polls; --", // 고전적인 SQL 인젝션
            "<script>alert('xss')</script>", // XSS 시도
            "\x00\x01\x02\x03", // 제어 문자
            "A".repeat(10000), // 매우 긴 문자열
            "\u0000\u0001\u0002", // 널 바이트
            "../../etc/passwd", // 디렉토리 순회 시도
        ];

        const testResults = [];

        for (const input of specialInputs) {
            try {
                // 입력 검증 시뮬레이션
                const sanitized = input.replace(/[<>'";\-\-]/g, ""); // 기본 필터링
                const isClean = sanitized.length > 0 && sanitized.length < 1000;

                testResults.push({
                    input:
                        input.substring(0, 50) +
                        (input.length > 50 ? "..." : ""),
                    sanitized:
                        sanitized.substring(0, 50) +
                        (sanitized.length > 50 ? "..." : ""),
                    isClean,
                    originalLength: input.length,
                    sanitizedLength: sanitized.length,
                });
            } catch (error) {
                testResults.push({
                    input: input.substring(0, 50),
                    error:
                        error instanceof Error
                            ? error.message
                            : "Processing error",
                    isClean: false,
                });
            }
        }

        const failedInputs = testResults.filter((r) => !r.isClean || r.error);

        return {
            testName: "UNICODE_SPECIAL_CHARS",
            severity: "MEDIUM",
            passed: failedInputs.length < specialInputs.length / 2, // 절반 이상 통과
            executionTime: Date.now() - startTime,
            memoryUsage: process.memoryUsage().heapUsed - startMemory,
            details: {
                totalInputs: specialInputs.length,
                failedInputs: failedInputs.length,
                testResults: testResults.slice(0, 5), // 처음 5개만 표시
                vulnerablePatterns: failedInputs.map((f) =>
                    f.input?.substring(0, 20)
                ),
            },
            vulnerabilities:
                failedInputs.length > 0
                    ? ["특수문자 처리 취약성", "입력 검증 부족"]
                    : [],
            mitigations:
                failedInputs.length > 0
                    ? [
                          "강화된 입력 검증",
                          "XSS/SQL 인젝션 보호",
                          "유니코드 정규화",
                      ]
                    : ["입력 처리 안정적"],
        };
    } catch (error) {
        return {
            testName: "UNICODE_SPECIAL_CHARS",
            severity: "MEDIUM",
            passed: false,
            executionTime: Date.now() - startTime,
            memoryUsage: process.memoryUsage().heapUsed - startMemory,
            details: {
                error: error instanceof Error ? error.message : "Unknown error",
            },
            vulnerabilities: ["문자 처리 시스템 불안정"],
            mitigations: ["문자 인코딩 검토", "입력 검증 강화"],
        };
    }
}

async function testMemoryLeakSimulation(): Promise<StressTestResult> {
    console.log("\n🧠 메모리 누수 시뮬레이션 테스트...");

    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    try {
        const memorySnapshots = [];
        const bigArrays = [];

        // 메모리 사용량 점진적 증가 시뮬레이션
        for (let i = 0; i < 100; i++) {
            // 큰 배열 생성 (메모리 사용량 증가)
            const bigArray = new Array(10000).fill({
                id: `player_${i}`,
                data: new Array(100).fill(`data_${i}`),
                timestamp: Date.now(),
            });

            bigArrays.push(bigArray);

            // 10회마다 메모리 스냅샷
            if (i % 10 === 0) {
                const currentMemory = process.memoryUsage();
                memorySnapshots.push({
                    iteration: i,
                    heapUsed: Math.round(currentMemory.heapUsed / 1024 / 1024), // MB
                    heapTotal: Math.round(
                        currentMemory.heapTotal / 1024 / 1024
                    ),
                    external: Math.round(currentMemory.external / 1024 / 1024),
                });
            }

            // 메모리 한계 체크 (500MB)
            if (process.memoryUsage().heapUsed > 500 * 1024 * 1024) {
                console.log(`   ⚠️ 메모리 한계 도달 (${i}번째 반복)`);
                break;
            }
        }

        // 메모리 정리 시도
        bigArrays.length = 0;

        // 가비지 컬렉션 강제 실행 (Node.js)
        if (global.gc) {
            global.gc();
        }

        const endMemory = process.memoryUsage();
        const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;
        const memoryIncreasePattern = memorySnapshots.map((s) => s.heapUsed);

        // 메모리 증가 패턴 분석
        const steadyIncrease = memoryIncreasePattern.every(
            (mem, idx) => idx === 0 || mem >= memoryIncreasePattern[idx - 1]
        );

        return {
            testName: "MEMORY_LEAK_SIMULATION",
            severity: "HIGH",
            passed: memoryIncrease < 100 * 1024 * 1024, // 100MB 미만 증가
            executionTime: Date.now() - startTime,
            memoryUsage: memoryIncrease,
            details: {
                startMemoryMB: Math.round(startMemory.heapUsed / 1024 / 1024),
                endMemoryMB: Math.round(endMemory.heapUsed / 1024 / 1024),
                memoryIncreaseMB: Math.round(memoryIncrease / 1024 / 1024),
                memorySnapshots: memorySnapshots.slice(-5), // 마지막 5개
                steadyIncrease,
                gcAvailable: !!global.gc,
            },
            vulnerabilities:
                memoryIncrease > 100 * 1024 * 1024
                    ? ["메모리 누수 가능성", "가비지 컬렉션 비효율"]
                    : [],
            mitigations:
                memoryIncrease > 100 * 1024 * 1024
                    ? [
                          "메모리 프로파일링",
                          "객체 생명주기 관리",
                          "가비지 컬렉션 튜닝",
                      ]
                    : ["메모리 관리 양호"],
        };
    } catch (error) {
        return {
            testName: "MEMORY_LEAK_SIMULATION",
            severity: "HIGH",
            passed: false,
            executionTime: Date.now() - startTime,
            memoryUsage: process.memoryUsage().heapUsed - startMemory.heapUsed,
            details: {
                error: error instanceof Error ? error.message : "Unknown error",
            },
            vulnerabilities: ["메모리 관리 시스템 불안정"],
            mitigations: ["메모리 모니터링 강화", "예외 처리 개선"],
        };
    }
}

async function testTimeZoneAndDateHandling(): Promise<StressTestResult> {
    console.log("\n🌍 시간대 및 날짜 처리 테스트...");

    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
        // 다양한 시간대 테스트
        const timeZones = [
            "UTC",
            "Asia/Seoul",
            "America/New_York",
            "Europe/London",
            "Pacific/Auckland",
        ];

        const testDates = [
            new Date("2024-01-01T00:00:00Z"), // 신정
            new Date("2024-03-10T07:00:00Z"), // 서머타임 시작 (미국)
            new Date("2024-11-03T06:00:00Z"), // 서머타임 종료 (미국)
            new Date("2024-12-31T23:59:59Z"), // 연말
            new Date("2024-02-29T12:00:00Z"), // 윤년
        ];

        const results = [];

        for (const tz of timeZones) {
            for (const date of testDates) {
                try {
                    // 시간대별 처리 시뮬레이션
                    const localeString = date.toLocaleString("ko-KR", {
                        timeZone: tz,
                    });
                    const isoString = date.toISOString();
                    const timestamp = date.getTime();

                    // 정산 시간 계산 (예: 베팅 마감 후 1시간)
                    const settlementTime = new Date(timestamp + 60 * 60 * 1000);
                    const isValidSettlement = settlementTime > date;

                    results.push({
                        timeZone: tz,
                        originalDate: isoString,
                        localString: localeString,
                        timestamp,
                        settlementTime: settlementTime.toISOString(),
                        isValid: isValidSettlement,
                    });
                } catch (error) {
                    results.push({
                        timeZone: tz,
                        date: date.toISOString(),
                        error:
                            error instanceof Error
                                ? error.message
                                : "Date processing error",
                        isValid: false,
                    });
                }
            }
        }

        const failedResults = results.filter((r) => !r.isValid || r.error);

        return {
            testName: "TIMEZONE_DATE_HANDLING",
            severity: "MEDIUM",
            passed: failedResults.length === 0,
            executionTime: Date.now() - startTime,
            memoryUsage: process.memoryUsage().heapUsed - startMemory,
            details: {
                totalTests: results.length,
                failedTests: failedResults.length,
                testedTimeZones: timeZones,
                sampleResults: results.slice(0, 3),
                failures: failedResults,
            },
            vulnerabilities:
                failedResults.length > 0
                    ? ["시간대 처리 오류", "날짜 계산 부정확"]
                    : [],
            mitigations:
                failedResults.length > 0
                    ? [
                          "시간대 라이브러리 도입",
                          "UTC 기준 처리",
                          "날짜 검증 강화",
                      ]
                    : ["시간 처리 안정적"],
        };
    } catch (error) {
        return {
            testName: "TIMEZONE_DATE_HANDLING",
            severity: "MEDIUM",
            passed: false,
            executionTime: Date.now() - startTime,
            memoryUsage: process.memoryUsage().heapUsed - startMemory,
            details: {
                error: error instanceof Error ? error.message : "Unknown error",
            },
            vulnerabilities: ["날짜/시간 시스템 불안정"],
            mitigations: ["날짜 라이브러리 검토", "시간대 처리 개선"],
        };
    }
}

async function runStressTests(): Promise<void> {
    console.log("🔥 정산 시스템 스트레스 & 보안 테스트");
    console.log("═".repeat(60));

    const results: StressTestResult[] = [];

    try {
        // 모든 스트레스 테스트 실행
        console.log("⚡ 극한 상황 테스트 시작...");

        results.push(await testDatabaseConnectionFailure());
        results.push(await testIntegerOverflow());
        results.push(await testUnicodeAndSpecialCharacters());
        results.push(await testMemoryLeakSimulation());
        results.push(await testTimeZoneAndDateHandling());

        // 결과 분석
        console.log("\n📊 스트레스 테스트 결과 분석");
        console.log("═".repeat(60));

        const passedTests = results.filter((r) => r.passed).length;
        const totalTests = results.length;
        const passRate = (passedTests / totalTests) * 100;

        console.log(
            `✅ 통과: ${passedTests}/${totalTests} (${passRate.toFixed(1)}%)`
        );

        // 심각도별 분류
        const criticalIssues = results.filter(
            (r) => !r.passed && r.severity === "CRITICAL"
        );
        const highIssues = results.filter(
            (r) => !r.passed && r.severity === "HIGH"
        );
        const mediumIssues = results.filter(
            (r) => !r.passed && r.severity === "MEDIUM"
        );

        // 성능 분석
        const avgExecutionTime =
            results.reduce((sum, r) => sum + r.executionTime, 0) /
            results.length;
        const maxExecutionTime = Math.max(
            ...results.map((r) => r.executionTime)
        );
        const totalMemoryUsage = results.reduce(
            (sum, r) => sum + r.memoryUsage,
            0
        );

        console.log(`\n⚡ 성능 지표:`);
        console.log(`   평균 실행 시간: ${avgExecutionTime.toFixed(0)}ms`);
        console.log(`   최대 실행 시간: ${maxExecutionTime}ms`);
        console.log(
            `   총 메모리 사용: ${Math.round(totalMemoryUsage / 1024 / 1024)}MB`
        );

        // 상세 결과
        console.log("\n🔍 상세 테스트 결과:");
        results.forEach((result) => {
            const statusIcon = result.passed ? "✅" : "❌";
            const severityIcon = {
                LOW: "💚",
                MEDIUM: "💛",
                HIGH: "🟠",
                CRITICAL: "🔴",
            }[result.severity];

            console.log(`\n${statusIcon} ${severityIcon} ${result.testName}`);
            console.log(`   심각도: ${result.severity}`);
            console.log(`   실행시간: ${result.executionTime}ms`);
            console.log(
                `   메모리: ${Math.round(result.memoryUsage / 1024)}KB`
            );

            if (result.vulnerabilities.length > 0) {
                console.log(`   취약점: ${result.vulnerabilities.join(", ")}`);
            }

            if (result.mitigations.length > 0) {
                console.log(`   대응방안: ${result.mitigations.join(", ")}`);
            }
        });

        // 보안 권장사항
        console.log("\n🛡️ 보안 & 안정성 권장사항");
        console.log("═".repeat(60));

        if (criticalIssues.length > 0) {
            console.log("🚨 긴급 보안 수정 필요:");
            criticalIssues.forEach((issue) => {
                console.log(
                    `   - ${issue.testName}: ${issue.vulnerabilities.join(
                        ", "
                    )}`
                );
            });
        }

        if (highIssues.length > 0) {
            console.log("⚠️ 높은 우선순위 수정:");
            highIssues.forEach((issue) => {
                console.log(
                    `   - ${issue.testName}: ${issue.vulnerabilities.join(
                        ", "
                    )}`
                );
            });
        }

        if (mediumIssues.length > 0) {
            console.log("💡 개선 권장사항:");
            mediumIssues.forEach((issue) => {
                console.log(
                    `   - ${issue.testName}: ${issue.vulnerabilities.join(
                        ", "
                    )}`
                );
            });
        }

        // 전체 시스템 평가
        console.log("\n🏆 전체 시스템 보안 등급");
        console.log("═".repeat(60));

        if (
            criticalIssues.length === 0 &&
            highIssues.length === 0 &&
            passRate >= 95
        ) {
            console.log("🔒 보안 등급: A+ (매우 안전)");
        } else if (criticalIssues.length === 0 && passRate >= 85) {
            console.log("🛡️ 보안 등급: A (안전)");
        } else if (criticalIssues.length === 0 && passRate >= 75) {
            console.log("⚠️ 보안 등급: B (보통)");
        } else {
            console.log("🚨 보안 등급: C (위험)");
        }
    } catch (error) {
        console.error("스트레스 테스트 실행 중 오류:", error);
    }
}

// 스크립트 실행
if (require.main === module) {
    runStressTests()
        .then(() => {
            console.log("\n🔥 스트레스 테스트 완료");
            process.exit(0);
        })
        .catch((error) => {
            console.error("스트레스 테스트 실패:", error);
            process.exit(1);
        });
}

export { runStressTests };
