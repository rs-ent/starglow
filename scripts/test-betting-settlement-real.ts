#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client";
import {
    getSettlementAmountSinglePlayer,
    bulkSettlementPlayers,
    getSettlementPreview,
    getBettingModeStats,
} from "../app/actions/polls/polls-bettingMode";

const prisma = new PrismaClient();

interface RealTestResult {
    testName: string;
    pollId?: string;
    success: boolean;
    data: any;
    issues: string[];
    recommendations: string[];
}

class RealBettingSettlementTester {
    private results: RealTestResult[] = [];

    async runRealTests() {
        console.log("🔍 실제 베팅모드 정산 로직 검증 시작...\n");

        // 실제 베팅 폴들을 찾아서 테스트
        await this.findAndTestActiveBettingPolls();
        await this.testCalculationAccuracy();
        await this.testDataConsistencyReal();
        await this.testPerformanceBenchmark();

        this.printRealTestSummary();
    }

    async findAndTestActiveBettingPolls() {
        console.log("📊 실제 베팅 폴 분석...");

        try {
            // 베팅모드가 활성화된 폴들 찾기
            const bettingPolls = await prisma.poll.findMany({
                where: {
                    bettingMode: true,
                    isActive: true,
                },
                select: {
                    id: true,
                    title: true,
                    titleShorten: true,
                    status: true,
                    bettingStatus: true,
                    isSettled: true,
                    totalBetsAmount: true,
                    totalVotes: true,
                    houseCommissionRate: true,
                    minimumBet: true,
                    maximumBet: true,
                    startDate: true,
                    endDate: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            });

            console.log(`   발견된 베팅 폴: ${bettingPolls.length}개`);

            const issues = [];
            const recommendations = [];

            for (const poll of bettingPolls) {
                console.log(
                    `\n   📈 폴 분석: ${poll.titleShorten || poll.title}`
                );
                console.log(`      ID: ${poll.id}`);
                console.log(
                    `      상태: ${poll.status} / ${poll.bettingStatus}`
                );
                console.log(
                    `      정산여부: ${poll.isSettled ? "완료" : "미완료"}`
                );
                console.log(
                    `      총 베팅: ${
                        poll.totalBetsAmount?.toLocaleString() || 0
                    }원`
                );
                console.log(
                    `      수수료율: ${(poll.houseCommissionRate * 100).toFixed(
                        1
                    )}%`
                );

                // 각 폴의 참여자 수와 베팅 통계 확인
                try {
                    const stats = await getBettingModeStats({
                        pollId: poll.id,
                    });
                    console.log(`      참여자: ${stats.totalParticipants}명`);
                    console.log(
                        `      평균 베팅: ${stats.averageBetAmount.toLocaleString()}원`
                    );

                    // 이상치 체크
                    if (stats.averageBetAmount < poll.minimumBet) {
                        issues.push(
                            `${poll.id}: 평균 베팅이 최소 베팅보다 낮음`
                        );
                    }
                    if (stats.averageBetAmount > poll.maximumBet) {
                        issues.push(
                            `${poll.id}: 평균 베팅이 최대 베팅보다 높음`
                        );
                    }
                    if (stats.totalParticipants > 1000) {
                        recommendations.push(
                            `${poll.id}: 대량 참여자(${stats.totalParticipants}명) - 성능 최적화 필요`
                        );
                    }
                } catch (error) {
                    issues.push(`${poll.id}: 통계 조회 실패 - ${error}`);
                }
            }

            this.results.push({
                testName: "실제 베팅 폴 분석",
                success: issues.length === 0,
                data: {
                    totalPolls: bettingPolls.length,
                    pollDetails: bettingPolls,
                    analysisDate: new Date(),
                },
                issues,
                recommendations,
            });
        } catch (error) {
            console.error("   ❌ 베팅 폴 조회 실패:", error);
            this.results.push({
                testName: "실제 베팅 폴 분석",
                success: false,
                data: { error },
                issues: [`데이터베이스 조회 실패: ${error}`],
                recommendations: ["데이터베이스 연결 상태 확인 필요"],
            });
        }
    }

    async testCalculationAccuracy() {
        console.log("\n🔢 실제 정산 계산 정확성 테스트...");

        try {
            // 🔍 필드 검증: totalBetsAmount vs totalVotes vs 실제 pollLog
            await this.verifyBettingFields();

            // 베팅이 있는 폴 찾기 (totalVotes로 변경)
            const pollWithBets = await prisma.poll.findFirst({
                where: {
                    bettingMode: true,
                    totalVotes: { gt: 0 }, // totalBetsAmount 대신 totalVotes 사용
                },
                select: { id: true, title: true, options: true },
            });

            if (!pollWithBets) {
                this.results.push({
                    testName: "정산 계산 정확성",
                    success: false,
                    data: {},
                    issues: ["베팅이 있는 폴을 찾을 수 없음"],
                    recommendations: ["테스트용 베팅 데이터 생성 필요"],
                });
                return;
            }

            console.log(`   테스트 폴: ${pollWithBets.title}`);

            // 실제 참여자들 조회
            const participants = await prisma.pollLog.findMany({
                where: { pollId: pollWithBets.id },
                select: { playerId: true, optionId: true, amount: true },
                take: 10, // 처음 10명만 테스트
            });

            console.log(`   테스트 참여자: ${participants.length}명`);

            const issues = [];
            const calculationResults = [];

            // 모든 옵션을 승리 옵션으로 가정하고 테스트
            const options = pollWithBets.options as Array<{
                optionId: string;
                name: string;
            }>;
            const winningOptionIds = options.map((opt) => opt.optionId);

            for (const participant of participants.slice(0, 5)) {
                // 최대 5명만 테스트
                try {
                    console.log(
                        `     계산 중: ${participant.playerId.slice(-6)}...`
                    );

                    const result = await getSettlementAmountSinglePlayer({
                        pollId: pollWithBets.id,
                        playerId: participant.playerId,
                        winningOptionIds,
                    });

                    if (result.success) {
                        const totalCalculated =
                            result.payoutAmount + result.refundAmount;
                        calculationResults.push({
                            playerId: participant.playerId.slice(-6),
                            totalBetAmount: result.totalBetAmount,
                            payoutAmount: result.payoutAmount,
                            refundAmount: result.refundAmount,
                            totalCalculated,
                            hasRewardLogIssue: !!result.rewardLogIssue,
                        });

                        // 이상치 체크
                        if (result.totalBetAmount <= 0) {
                            issues.push(
                                `${participant.playerId.slice(
                                    -6
                                )}: 베팅 금액이 0 이하`
                            );
                        }
                        if (result.rewardLogIssue) {
                            issues.push(
                                `${participant.playerId.slice(
                                    -6
                                )}: rewardLog 불일치 발견`
                            );
                        }
                        if (totalCalculated < 0) {
                            issues.push(
                                `${participant.playerId.slice(
                                    -6
                                )}: 음수 정산 금액`
                            );
                        }
                    } else {
                        issues.push(
                            `${participant.playerId.slice(-6)}: 계산 실패 - ${
                                result.error
                            }`
                        );
                    }
                } catch (error) {
                    issues.push(
                        `${participant.playerId.slice(
                            -6
                        )}: 예외 발생 - ${error}`
                    );
                }
            }

            this.results.push({
                testName: "정산 계산 정확성",
                pollId: pollWithBets.id,
                success: issues.length === 0,
                data: {
                    pollTitle: pollWithBets.title,
                    participantsTested: participants.length,
                    calculationResults,
                    winningOptionIds,
                },
                issues,
                recommendations:
                    issues.length > 0 ? ["정산 로직 점검 필요"] : [],
            });
        } catch (error) {
            console.error("   ❌ 계산 테스트 실패:", error);
            this.results.push({
                testName: "정산 계산 정확성",
                success: false,
                data: { error },
                issues: [`계산 테스트 실패: ${error}`],
                recommendations: ["API 함수 점검 필요"],
            });
        }
    }

    async verifyBettingFields() {
        console.log("   🔍 베팅 필드 검증: totalBetsAmount vs totalVotes...");

        const bettingPolls = await prisma.poll.findMany({
            where: {
                bettingMode: true,
                isActive: true,
            },
            select: {
                id: true,
                title: true,
                titleShorten: true,
                totalBetsAmount: true,
                totalVotes: true,
            },
            take: 3, // 처음 3개만 검증
        });

        const fieldVerificationResults = [];

        for (const poll of bettingPolls) {
            // 실제 pollLog에서 계산한 총 베팅액
            const pollLogs = await prisma.pollLog.findMany({
                where: { pollId: poll.id },
                select: { amount: true },
            });

            const actualTotal = pollLogs.reduce(
                (sum, log) => sum + log.amount,
                0
            );

            // 각 필드와의 차이 계산
            const totalBetsAmountDiff = Math.abs(
                (poll.totalBetsAmount || 0) - actualTotal
            );
            const totalVotesDiff = Math.abs(
                (poll.totalVotes || 0) - actualTotal
            );

            const result = {
                pollId: poll.id,
                pollTitle: poll.titleShorten || poll.title,
                totalBetsAmount: poll.totalBetsAmount || 0,
                totalVotes: poll.totalVotes || 0,
                actualTotal,
                totalBetsAmountDiff,
                totalVotesDiff,
                totalVotesIsMoreAccurate: totalVotesDiff < totalBetsAmountDiff,
            };

            fieldVerificationResults.push(result);

            console.log(`      폴: ${result.pollTitle}`);
            console.log(
                `         totalBetsAmount: ${result.totalBetsAmount.toLocaleString()}원`
            );
            console.log(
                `         totalVotes: ${result.totalVotes.toLocaleString()}`
            );
            console.log(
                `         실제 pollLog 총합: ${result.actualTotal.toLocaleString()}원`
            );
            console.log(
                `         🎯 totalVotes가 더 정확? ${
                    result.totalVotesIsMoreAccurate ? "✅" : "❌"
                }`
            );
        }

        // 결과를 클래스 결과에 추가
        const totalVotesAccurateCount = fieldVerificationResults.filter(
            (r) => r.totalVotesIsMoreAccurate
        ).length;

        const issues = [];
        if (totalVotesAccurateCount === 0) {
            issues.push("totalVotes가 실제 베팅액과 일치하지 않음");
        }
        if (
            fieldVerificationResults.some(
                (r) => r.totalBetsAmount > 0 && r.totalBetsAmountDiff > 0
            )
        ) {
            issues.push("totalBetsAmount 필드 업데이트 오류 발견");
        }

        this.results.push({
            testName: "베팅 필드 검증",
            success:
                totalVotesAccurateCount > fieldVerificationResults.length / 2,
            data: {
                verificationResults: fieldVerificationResults,
                totalVotesAccurateCount,
                totalPolls: fieldVerificationResults.length,
            },
            issues,
            recommendations:
                issues.length > 0
                    ? [
                          "totalVotes를 실제 베팅 총액으로 사용 고려",
                          "totalBetsAmount 필드 업데이트 로직 점검 필요",
                      ]
                    : [],
        });
    }

    async testDataConsistencyReal() {
        console.log("\n📊 실제 데이터 일관성 검증...");

        try {
            // pollLog와 rewardLog 비교 분석
            const pollsWithInconsistency = [];

            // 베팅 폴들의 데이터 일관성 체크 (totalVotes 조건으로 변경)
            const bettingPolls = await prisma.poll.findMany({
                where: {
                    bettingMode: true,
                    totalVotes: { gt: 0 }, // totalBetsAmount 대신 totalVotes 사용
                },
                select: { id: true, title: true, bettingAssetId: true },
                take: 5,
            });

            for (const poll of bettingPolls) {
                console.log(`   검사 중: ${poll.title}`);

                // pollLog 총합 계산
                const pollLogSum = await prisma.pollLog.aggregate({
                    where: { pollId: poll.id },
                    _sum: { amount: true },
                    _count: { _all: true },
                });

                // rewardLog 총합 계산 (베팅 차감 기록)
                const rewardLogSum = await prisma.rewardsLog.aggregate({
                    where: {
                        pollId: poll.id,
                        assetId: poll.bettingAssetId,
                        reason: { contains: "Betting on poll" },
                    },
                    _sum: { amount: true },
                    _count: { _all: true },
                });

                const pollTotal = pollLogSum._sum.amount || 0;
                const rewardTotal = Math.abs(rewardLogSum._sum.amount || 0); // 차감은 음수이므로 절댓값
                const difference = Math.abs(pollTotal - rewardTotal);
                const differencePercentage =
                    pollTotal > 0 ? (difference / pollTotal) * 100 : 0;

                console.log(
                    `     PollLog 총합: ${pollTotal.toLocaleString()}원 (${
                        pollLogSum._count._all
                    }건)`
                );
                console.log(
                    `     RewardLog 총합: ${rewardTotal.toLocaleString()}원 (${
                        rewardLogSum._count._all
                    }건)`
                );
                console.log(
                    `     차이: ${difference.toLocaleString()}원 (${differencePercentage.toFixed(
                        2
                    )}%)`
                );

                if (differencePercentage > 1) {
                    // 1% 이상 차이
                    pollsWithInconsistency.push({
                        pollId: poll.id,
                        pollTitle: poll.title,
                        pollTotal,
                        rewardTotal,
                        difference,
                        differencePercentage,
                    });
                }
            }

            const issues = pollsWithInconsistency.map(
                (p) =>
                    `${p.pollTitle}: ${p.differencePercentage.toFixed(
                        2
                    )}% 불일치`
            );

            this.results.push({
                testName: "데이터 일관성 검증",
                success: pollsWithInconsistency.length === 0,
                data: {
                    pollsChecked: bettingPolls.length,
                    inconsistentPolls: pollsWithInconsistency,
                },
                issues,
                recommendations:
                    issues.length > 0
                        ? [
                              "데이터 정합성 복구 작업 필요",
                              "베팅 차감/환불 로직 점검 필요",
                          ]
                        : [],
            });
        } catch (error) {
            console.error("   ❌ 데이터 일관성 검사 실패:", error);
            this.results.push({
                testName: "데이터 일관성 검증",
                success: false,
                data: { error },
                issues: [`데이터 일관성 검사 실패: ${error}`],
                recommendations: ["데이터베이스 연결 및 권한 확인 필요"],
            });
        }
    }

    async testPerformanceBenchmark() {
        console.log("\n🚀 성능 벤치마크 테스트...");

        try {
            // 가장 많은 참여자를 가진 베팅 폴 찾기
            const largestPoll = await prisma.poll.findFirst({
                where: {
                    bettingMode: true,
                    totalVotes: { gt: 0 },
                },
                orderBy: { totalVotes: "desc" },
                select: {
                    id: true,
                    title: true,
                    totalVotes: true,
                    options: true,
                },
            });

            if (!largestPoll) {
                this.results.push({
                    testName: "성능 벤치마크",
                    success: false,
                    data: {},
                    issues: ["벤치마크용 폴을 찾을 수 없음"],
                    recommendations: ["대용량 테스트 데이터 생성 필요"],
                });
                return;
            }

            console.log(
                `   벤치마크 폴: ${largestPoll.title} (${largestPoll.totalVotes}표)`
            );

            // 참여자 수 확인
            const participantCount = await prisma.pollLog.groupBy({
                by: ["playerId"],
                where: { pollId: largestPoll.id },
                _count: { playerId: true },
            });

            const uniqueParticipants = participantCount.length;
            console.log(`   참여자 수: ${uniqueParticipants}명`);

            // 성능 테스트: getSettlementAmountSinglePlayer
            const sampleParticipants = participantCount.slice(0, 10);
            const options = largestPoll.options as Array<{
                optionId: string;
                name: string;
            }>;
            const winningOptionIds = [options[0]?.optionId].filter(Boolean);

            const performanceResults = [];
            let totalTime = 0;

            for (const participant of sampleParticipants) {
                const startTime = Date.now();

                try {
                    await getSettlementAmountSinglePlayer({
                        pollId: largestPoll.id,
                        playerId: (participant as any).playerId,
                        winningOptionIds,
                    });

                    const endTime = Date.now();
                    const duration = endTime - startTime;
                    totalTime += duration;

                    performanceResults.push({
                        playerId: (
                            (participant as any).playerId as string
                        ).slice(-6),
                        duration,
                    });
                } catch (error) {
                    performanceResults.push({
                        playerId: (
                            (participant as any).playerId as string
                        ).slice(-6),
                        duration: -1,
                        error:
                            error instanceof Error
                                ? error.message
                                : "Unknown error",
                    });
                }
            }

            const averageTime = totalTime / sampleParticipants.length;
            const estimatedTimeForAll =
                (averageTime * uniqueParticipants) / 1000; // 초

            console.log(`   평균 처리 시간: ${averageTime.toFixed(0)}ms`);
            console.log(
                `   전체 예상 시간: ${estimatedTimeForAll.toFixed(1)}초`
            );

            const issues = [];
            const recommendations = [];

            if (averageTime > 1000) {
                // 1초 이상
                issues.push(
                    `개별 정산 계산이 너무 느림 (${averageTime.toFixed(0)}ms)`
                );
                recommendations.push("정산 계산 로직 최적화 필요");
            }

            if (estimatedTimeForAll > 300) {
                // 5분 이상
                issues.push(
                    `전체 정산 예상 시간 과도 (${estimatedTimeForAll.toFixed(
                        1
                    )}초)`
                );
                recommendations.push("배치 처리 또는 병렬 처리 최적화 필요");
            }

            if (uniqueParticipants > 1000) {
                recommendations.push(
                    "대용량 데이터셋 처리를 위한 스트리밍 방식 고려"
                );
            }

            this.results.push({
                testName: "성능 벤치마크",
                pollId: largestPoll.id,
                success: issues.length === 0,
                data: {
                    pollTitle: largestPoll.title,
                    uniqueParticipants,
                    sampleSize: sampleParticipants.length,
                    averageTimeMs: averageTime,
                    estimatedTotalTimeSeconds: estimatedTimeForAll,
                    performanceResults,
                },
                issues,
                recommendations,
            });
        } catch (error) {
            console.error("   ❌ 성능 벤치마크 실패:", error);
            this.results.push({
                testName: "성능 벤치마크",
                success: false,
                data: { error },
                issues: [`성능 테스트 실패: ${error}`],
                recommendations: ["테스트 환경 점검 필요"],
            });
        }
    }

    private printRealTestSummary() {
        console.log("\n📋 실제 테스트 결과 요약");
        console.log("═".repeat(60));

        const totalTests = this.results.length;
        const passedTests = this.results.filter((r) => r.success).length;
        const failedTests = totalTests - passedTests;

        console.log(`총 테스트: ${totalTests}개`);
        console.log(`통과: ${passedTests}개 ✅`);
        console.log(`실패: ${failedTests}개 ❌`);
        console.log("");

        // 각 테스트 결과 요약
        this.results.forEach((result, index) => {
            const status = result.success ? "✅" : "❌";
            console.log(`${index + 1}. ${status} ${result.testName}`);

            if (result.pollId) {
                console.log(`   폴 ID: ${result.pollId}`);
            }

            if (result.issues.length > 0) {
                console.log(`   문제점: ${result.issues.length}개`);
                result.issues.slice(0, 3).forEach((issue) => {
                    console.log(`   • ${issue}`);
                });
                if (result.issues.length > 3) {
                    console.log(`   • ... ${result.issues.length - 3}개 더`);
                }
            }

            if (result.recommendations.length > 0) {
                console.log(
                    `   권장사항: ${result.recommendations.join(", ")}`
                );
            }
            console.log("");
        });

        // 전체 권장사항 요약
        const allRecommendations = this.results.flatMap(
            (r) => r.recommendations
        );
        const uniqueRecommendations = [...new Set(allRecommendations)];

        if (uniqueRecommendations.length > 0) {
            console.log("🔧 종합 권장사항:");
            console.log("─".repeat(40));
            uniqueRecommendations.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec}`);
            });
        }

        console.log("\n═".repeat(60));
        console.log(
            `실제 시스템 신뢰도: ${Math.round(
                (passedTests / totalTests) * 100
            )}%`
        );

        if (failedTests > 0) {
            console.log("\n⚠️  운영 환경에서 주의 깊게 모니터링이 필요합니다.");
        } else {
            console.log("\n✨ 베팅모드 정산 시스템이 정상 작동 중입니다.");
        }
    }
}

// 실행
async function main() {
    console.log("🔍 실제 베팅모드 정산 시스템 검증을 시작합니다...\n");

    const tester = new RealBettingSettlementTester();
    await tester.runRealTests();

    await prisma.$disconnect();
    console.log("\n✅ 테스트 완료");
}

if (require.main === module) {
    main().catch(console.error);
}

export { RealBettingSettlementTester };
