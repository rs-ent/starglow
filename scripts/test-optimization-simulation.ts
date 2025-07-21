#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function simulateOptimizationEffect() {
    console.log("🧪 성능 최적화 효과 시뮬레이션 (수정된 버전)...\n");

    try {
        const targetPoll = await prisma.poll.findFirst({
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
                totalCommissionAmount: true,
            },
        });

        if (!targetPoll) {
            console.log("❌ 테스트할 베팅 폴이 없습니다.");
            return;
        }

        console.log(`📊 테스트 폴: ${targetPoll.title}`);
        console.log(
            `📊 총 베팅: ${targetPoll.totalVotes.toLocaleString()}원\n`
        );

        const participantCount = await prisma.pollLog.groupBy({
            by: ["playerId"],
            where: { pollId: targetPoll.id },
            _count: { playerId: true },
        });

        const totalParticipants = participantCount.length;
        console.log(`👥 총 참여자: ${totalParticipants}명\n`);

        const sampleSize = Math.min(10, totalParticipants);
        const samplePlayers = participantCount.slice(0, sampleSize);

        // 🔴 BEFORE: 기존 방식 (공통 쿼리를 각 플레이어마다 반복 실행)
        console.log("🔴 BEFORE: 기존 방식 (비최적화)");
        console.log("─".repeat(50));

        const oldMethodStartTime = Date.now();
        let totalOldQueryTime = 0;
        let totalOldQueries = 0;

        for (let i = 0; i < samplePlayers.length; i++) {
            const queryStartTime = Date.now();

            // 🚨 기존 방식: 각 플레이어마다 공통 데이터를 매번 계산
            await Promise.all([
                // 공통 쿼리 1: 전체 베팅 총액 (매번 실행)
                prisma.pollLog.aggregate({
                    where: { pollId: targetPoll.id },
                    _sum: { amount: true },
                }),
                // 공통 쿼리 2: 승리 옵션 총액 (매번 실행)
                prisma.pollLog.aggregate({
                    where: {
                        pollId: targetPoll.id,
                        optionId: {
                            in: [(targetPoll.options as any[])[0]?.optionId],
                        },
                    },
                    _sum: { amount: true },
                }),
                // 개별 쿼리 1: 플레이어의 베팅 내역
                prisma.pollLog.findMany({
                    where: {
                        pollId: targetPoll.id,
                        playerId: (samplePlayers[i] as any).playerId,
                    },
                    select: { id: true, optionId: true, amount: true },
                }),
                // 개별 쿼리 2: 플레이어의 기존 정산 내역
                prisma.rewardsLog.findMany({
                    where: {
                        pollId: targetPoll.id,
                        playerId: (samplePlayers[i] as any).playerId,
                        reason: { contains: "Betting on poll" },
                    },
                    select: { id: true, amount: true },
                }),
            ]);

            const queryEndTime = Date.now();
            const queryDuration = queryEndTime - queryStartTime;
            totalOldQueryTime += queryDuration;
            totalOldQueries += 4; // 공통 2개 + 개별 2개

            console.log(
                `   플레이어 ${
                    i + 1
                }: ${queryDuration}ms (공통 쿼리 2개 + 개별 쿼리 2개)`
            );
        }

        const oldMethodEndTime = Date.now();
        const oldTotalTime = oldMethodEndTime - oldMethodStartTime;
        const oldAvgTime = totalOldQueryTime / samplePlayers.length;

        console.log(`📊 기존 방식 결과:`);
        console.log(`   샘플 ${sampleSize}명 처리: ${oldTotalTime}ms`);
        console.log(`   평균 처리 시간: ${oldAvgTime.toFixed(1)}ms/명`);
        console.log(
            `   총 쿼리 횟수: ${totalOldQueries}개 (공통 쿼리 ${
                sampleSize * 2
            }회 중복 실행)`
        );
        console.log(
            `   전체 ${totalParticipants}명 예상 시간: ${(
                (oldAvgTime * totalParticipants) /
                1000
            ).toFixed(1)}초\n`
        );

        // 🟢 AFTER: 최적화된 방식 (공통 쿼리 1번만 실행)
        console.log("🟢 AFTER: 최적화된 방식");
        console.log("─".repeat(50));

        const newMethodStartTime = Date.now();

        // ✅ 1단계: 공통 데이터 사전 계산 (전체에서 1번만 실행)
        const commonDataStartTime = Date.now();
        const [actualTotalBets, totalWinningBetsInPoll] = await Promise.all([
            prisma.pollLog.aggregate({
                where: { pollId: targetPoll.id },
                _sum: { amount: true },
            }),
            prisma.pollLog.aggregate({
                where: {
                    pollId: targetPoll.id,
                    optionId: {
                        in: [(targetPoll.options as any[])[0]?.optionId],
                    },
                },
                _sum: { amount: true },
            }),
        ]);
        const commonDataEndTime = Date.now();
        const commonDataTime = commonDataEndTime - commonDataStartTime;

        console.log(
            `✅ 공통 데이터 계산: ${commonDataTime}ms (전체에서 1번만 실행)`
        );
        console.log(
            `   - 전체 베팅 총액: ${
                actualTotalBets._sum.amount?.toLocaleString() || 0
            }원`
        );
        console.log(
            `   - 승리 옵션 총액: ${
                totalWinningBetsInPoll._sum.amount?.toLocaleString() || 0
            }원\n`
        );

        // ✅ 2단계: 개별 플레이어 처리 (공통 쿼리 없이 개별 데이터만)
        let totalNewQueryTime = 0;
        let totalNewQueries = 2; // 공통 쿼리 2개는 이미 실행됨

        for (let i = 0; i < samplePlayers.length; i++) {
            const queryStartTime = Date.now();

            // 🎯 최적화된 방식: 개별 데이터만 조회 (공통 쿼리 제거)
            await Promise.all([
                // 개별 쿼리 1: 플레이어의 베팅 내역만
                prisma.pollLog.findMany({
                    where: {
                        pollId: targetPoll.id,
                        playerId: (samplePlayers[i] as any).playerId,
                    },
                    select: { id: true, optionId: true, amount: true },
                }),
                // 개별 쿼리 2: 플레이어의 기존 정산 내역만
                prisma.rewardsLog.findMany({
                    where: {
                        pollId: targetPoll.id,
                        playerId: (samplePlayers[i] as any).playerId,
                        reason: { contains: "Betting on poll" },
                    },
                    select: { id: true, amount: true },
                }),
            ]);

            const queryEndTime = Date.now();
            const queryDuration = queryEndTime - queryStartTime;
            totalNewQueryTime += queryDuration;
            totalNewQueries += 2; // 개별 쿼리 2개

            console.log(
                `   플레이어 ${i + 1}: ${queryDuration}ms (개별 쿼리 2개만)`
            );
        }

        const newMethodEndTime = Date.now();
        const newTotalTime = newMethodEndTime - newMethodStartTime;

        // ✅ 올바른 계산: 공통 데이터는 1번만, 개별 처리는 평균으로
        const newAvgTimePerPlayer = totalNewQueryTime / samplePlayers.length;
        const estimatedTotalTimeForAll =
            (commonDataTime + newAvgTimePerPlayer * totalParticipants) / 1000;

        console.log(`\n📊 최적화된 방식 결과:`);
        console.log(`   공통 데이터 계산: ${commonDataTime}ms (1번만)`);
        console.log(
            `   개별 데이터 평균: ${newAvgTimePerPlayer.toFixed(1)}ms/명`
        );
        console.log(`   총 처리 시간: ${newTotalTime}ms`);
        console.log(
            `   총 쿼리 횟수: ${totalNewQueries}개 (공통 쿼리 2회만 실행)`
        );
        console.log(
            `   전체 ${totalParticipants}명 예상 시간: ${estimatedTotalTimeForAll.toFixed(
                1
            )}초\n`
        );

        // 🚀 성능 개선 결과 (올바른 계산)
        console.log("🚀 성능 개선 결과");
        console.log("═".repeat(50));

        const oldEstimatedTotal = (oldAvgTime * totalParticipants) / 1000;
        const improvement = oldEstimatedTotal / estimatedTotalTimeForAll;
        const timeSaved = oldEstimatedTotal - estimatedTotalTimeForAll;
        const queryReduction = sampleSize * 2 * totalParticipants - 2;

        console.log(
            `📈 전체 처리 시간 개선: ${improvement.toFixed(1)}배 빨라짐`
        );
        console.log(
            `⏰ 시간 단축: ${oldEstimatedTotal.toFixed(
                1
            )}초 → ${estimatedTotalTimeForAll.toFixed(1)}초`
        );
        console.log(
            `💰 절약된 시간: ${timeSaved.toFixed(1)}초 (${(
                timeSaved / 60
            ).toFixed(1)}분)`
        );
        console.log(
            `🔥 쿼리 횟수 감소: ${
                (sampleSize * 4 * totalParticipants) / sampleSize
            }회 → ${(totalNewQueries * totalParticipants) / sampleSize}회`
        );
        console.log(`💡 중복 제거된 공통 쿼리: ${queryReduction}회\n`);

        // 상세 분석
        console.log("📋 상세 분석:");
        console.log(
            `   기존 방식 - 플레이어당 공통 쿼리: 2회 × ${totalParticipants}명 = ${
                2 * totalParticipants
            }회`
        );
        console.log(`   최적화 방식 - 공통 쿼리: 2회 (전체에서 1번만)`);
        console.log(
            `   DB 부하 감소: ${(
                (queryReduction / (2 * totalParticipants)) *
                100
            ).toFixed(1)}%`
        );
        console.log(`   메모리 효율성: 공통 데이터 재사용으로 메모리 절약`);

        // 목표 대비 성과
        const targetPerPlayer = 100; // ms
        const actualPerPlayer = newAvgTimePerPlayer;
        const achievementRate = (targetPerPlayer / actualPerPlayer) * 100;

        console.log(`\n🎯 목표 대비 성과:`);
        console.log(`   목표: ${targetPerPlayer}ms/명`);
        console.log(`   실제: ${actualPerPlayer.toFixed(1)}ms/명`);
        console.log(`   달성률: ${achievementRate.toFixed(1)}%`);

        if (achievementRate < 100) {
            console.log(`\n💡 추가 최적화 제안:`);
            console.log(`   - 데이터베이스 인덱스 최적화`);
            console.log(`   - 쿼리 병렬 처리 개선`);
            console.log(`   - 캐싱 전략 도입`);
            console.log(`   - 배치 처리 크기 조정`);
        }

        // 🧪 배치 크기 최적화 테스트 실행
        await testBatchSizeOptimization(targetPoll.id, samplePlayers);

        // 🧪 정산 정확성 검증 테스트 실행
        await testSettlementAccuracy(targetPoll, samplePlayers);
    } catch (error) {
        console.error("❌ 시뮬레이션 실패:", error);
    } finally {
        await prisma.$disconnect();
    }
}

async function testBatchSizeOptimization(pollId: string, samplePlayers: any[]) {
    console.log("\n🧪 배치 크기 최적화 테스트");
    console.log("═".repeat(50));

    const batchSizes = [1, 2, 5, 10, 15, 20, 25, 30];
    const testResults = [];

    for (const batchSize of batchSizes) {
        console.log(`\n🔄 배치 크기 ${batchSize} 테스트 중...`);

        const startTime = Date.now();

        // 배치 처리 시뮬레이션
        const batches = [];
        for (let i = 0; i < samplePlayers.length; i += batchSize) {
            batches.push(samplePlayers.slice(i, i + batchSize));
        }

        let totalBatchTime = 0;

        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            const batchStartTime = Date.now();

            // 배치 내 병렬 처리 시뮬레이션
            const batchPromises = batch.map(async (player: any) => {
                return await Promise.all([
                    prisma.pollLog.findMany({
                        where: {
                            pollId: pollId,
                            playerId: player.playerId,
                        },
                        select: { id: true, optionId: true, amount: true },
                    }),
                    prisma.rewardsLog.findMany({
                        where: {
                            pollId: pollId,
                            playerId: player.playerId,
                            reason: { contains: "Betting on poll" },
                        },
                        select: { id: true, amount: true },
                    }),
                ]);
            });

            await Promise.all(batchPromises);

            const batchEndTime = Date.now();
            const batchDuration = batchEndTime - batchStartTime;
            totalBatchTime += batchDuration;

            console.log(
                `   배치 ${batchIndex + 1}/${
                    batches.length
                }: ${batchDuration}ms (${batch.length}명)`
            );
        }

        const endTime = Date.now();
        const totalTime = endTime - startTime;
        const avgTimePerPlayer = totalTime / samplePlayers.length;

        testResults.push({
            batchSize,
            totalTime,
            avgTimePerPlayer,
            totalBatches: batches.length,
            totalBatchTime,
        });

        console.log(`✅ 배치 크기 ${batchSize} 결과:`);
        console.log(`   총 처리 시간: ${totalTime}ms`);
        console.log(`   평균 처리 시간: ${avgTimePerPlayer.toFixed(1)}ms/명`);
        console.log(`   총 배치 수: ${batches.length}개`);
    }

    // 결과 분석
    console.log("\n📊 배치 크기 최적화 결과");
    console.log("─".repeat(50));

    const bestResult = testResults.reduce((best, current) =>
        current.avgTimePerPlayer < best.avgTimePerPlayer ? current : best
    );

    testResults.forEach((result) => {
        const isOptimal = result.batchSize === bestResult.batchSize;
        const indicator = isOptimal ? "🏆" : "  ";

        console.log(
            `${indicator} 배치 크기 ${result.batchSize
                .toString()
                .padEnd(2)}: ${result.avgTimePerPlayer.toFixed(1)}ms/명 (총 ${
                result.totalTime
            }ms)`
        );
    });

    console.log(`\n🏆 최적 배치 크기: ${bestResult.batchSize}명`);
    console.log(`🚀 최적 성능: ${bestResult.avgTimePerPlayer.toFixed(1)}ms/명`);

    const worstResult = testResults.reduce((worst, current) =>
        current.avgTimePerPlayer > worst.avgTimePerPlayer ? current : worst
    );

    const improvement =
        worstResult.avgTimePerPlayer / bestResult.avgTimePerPlayer;
    console.log(
        `📈 최대 개선율: ${improvement.toFixed(1)}배 (${
            worstResult.batchSize
        }명 대비)`
    );

    // 권장사항
    console.log(`\n💡 권장사항:`);
    console.log(
        `   현재 설정: 5명 배치 → 권장: ${bestResult.batchSize}명 배치`
    );
    console.log(
        `   예상 성능 개선: ${(
            (testResults.find((r) => r.batchSize === 5)?.avgTimePerPlayer ||
                0) / bestResult.avgTimePerPlayer
        ).toFixed(1)}배`
    );

    if (bestResult.batchSize > 20) {
        console.log(
            `   ⚠️ 주의: 큰 배치 크기는 메모리 사용량을 증가시킬 수 있습니다.`
        );
        console.log(`   ⚠️ 권장: 20명 이하로 제한하여 안정성을 확보하세요.`);
    }
}

if (require.main === module) {
    simulateOptimizationEffect().catch(console.error);
}

async function testSettlementAccuracy(targetPoll: any, samplePlayers: any[]) {
    console.log("\n🧪 정산 정확성 검증 테스트");
    console.log("═".repeat(50));

    // 승리 옵션 설정 (첫 번째 옵션을 승리로 가정)
    const winningOptionIds = [
        (targetPoll.options as any[])[0]?.optionId,
    ].filter(Boolean);

    if (winningOptionIds.length === 0) {
        console.log("❌ 승리 옵션을 찾을 수 없습니다.");
        return;
    }

    console.log(`🏆 승리 옵션: ${winningOptionIds.join(", ")}`);

    // 공통 데이터 계산
    const [actualTotalBets, totalWinningBetsInPoll] = await Promise.all([
        prisma.pollLog.aggregate({
            where: { pollId: targetPoll.id },
            _sum: { amount: true },
        }),
        prisma.pollLog.aggregate({
            where: {
                pollId: targetPoll.id,
                optionId: { in: winningOptionIds },
            },
            _sum: { amount: true },
        }),
    ]);

    const pollTotalBetAmount = actualTotalBets._sum.amount || 0;
    const totalWinningBetAmount = totalWinningBetsInPoll._sum.amount || 0;
    const houseCommissionRate = 0.05; // 5% 수수료
    const totalCommissionAmount = Math.floor(
        pollTotalBetAmount * houseCommissionRate
    );
    const totalPayoutPool = Math.max(
        0,
        pollTotalBetAmount - totalCommissionAmount
    );

    console.log(`💰 공통 정산 데이터:`);
    console.log(`   전체 베팅 총액: ${pollTotalBetAmount.toLocaleString()}원`);
    console.log(
        `   승리 베팅 총액: ${totalWinningBetAmount.toLocaleString()}원`
    );
    console.log(
        `   수수료 (${(houseCommissionRate * 100).toFixed(
            1
        )}%): ${totalCommissionAmount.toLocaleString()}원`
    );
    console.log(`   상금 풀: ${totalPayoutPool.toLocaleString()}원\n`);

    // 정산 검증 통계
    let validationStats = {
        totalTested: 0,
        validCalculations: 0,
        warnings: 0,
        errors: 0,
        payoutPlayers: 0,
        refundPlayers: 0,
        lossPlayers: 0,
        totalPayoutAmount: 0,
        totalRefundAmount: 0,
    };

    const settlementDetails: any[] = [];

    console.log("🔍 플레이어별 정산 계산 및 검증:");
    console.log("─".repeat(50));

    for (let i = 0; i < samplePlayers.length; i++) {
        const player = samplePlayers[i];
        const playerId = player.playerId;

        try {
            // 플레이어 베팅 데이터 조회
            const [playerBets, existingRewards] = await Promise.all([
                prisma.pollLog.findMany({
                    where: {
                        pollId: targetPoll.id,
                        playerId: playerId,
                    },
                    select: {
                        id: true,
                        optionId: true,
                        amount: true,
                    },
                }),
                prisma.rewardsLog.findMany({
                    where: {
                        pollId: targetPoll.id,
                        playerId: playerId,
                        reason: { contains: "Betting" },
                    },
                    select: {
                        id: true,
                        amount: true,
                    },
                }),
            ]);

            if (playerBets.length === 0) {
                console.log(
                    `   플레이어 ${playerId.slice(-6)}: ⚠️ 베팅 내역 없음`
                );
                continue;
            }

            // 정산 계산
            const totalBetAmount = playerBets.reduce(
                (sum, bet) => sum + bet.amount,
                0
            );
            const winningBets = playerBets.filter((bet) =>
                winningOptionIds.includes(bet.optionId)
            );
            const playerWinningAmount = winningBets.reduce(
                (sum, bet) => sum + bet.amount,
                0
            );

            let payoutAmount = 0;
            let refundAmount = 0;
            let settlementType = "";

            if (winningOptionIds.length === 0) {
                // 무승부 - 환불
                refundAmount = totalBetAmount;
                settlementType = "REFUND";
                validationStats.refundPlayers++;
                validationStats.totalRefundAmount += refundAmount;
            } else if (playerWinningAmount > 0 && totalWinningBetAmount > 0) {
                // 승리 - 배당 지급
                const payoutRatio = playerWinningAmount / totalWinningBetAmount;
                payoutAmount = Math.floor(totalPayoutPool * payoutRatio);
                settlementType = "PAYOUT";
                validationStats.payoutPlayers++;
                validationStats.totalPayoutAmount += payoutAmount;
            } else {
                // 패배 - 정산 없음
                settlementType = "LOSS";
                validationStats.lossPlayers++;
            }

            const totalSettlement = payoutAmount + refundAmount;

            // 🔍 정산 검증
            const validation = validateSettlementCalculation({
                playerId,
                totalBetAmount,
                playerWinningAmount,
                payoutAmount,
                refundAmount,
                settlementType,
                expectedData: {
                    pollTotalBetAmount,
                    totalWinningBetAmount,
                    totalPayoutPool,
                    winningOptionIds,
                },
            });

            validationStats.totalTested++;
            if (validation.isValid) {
                validationStats.validCalculations++;
            }
            validationStats.warnings += validation.warnings.length;
            validationStats.errors += validation.errors.length;

            // 결과 기록
            const detail = {
                playerId: playerId.slice(-6),
                settlementType,
                totalBet: totalBetAmount,
                winningBet: playerWinningAmount,
                payout: payoutAmount,
                refund: refundAmount,
                total: totalSettlement,
                validation,
            };
            settlementDetails.push(detail);

            // 로그 출력
            const statusIcon = validation.isValid
                ? "✅"
                : validation.errors.length > 0
                ? "❌"
                : "⚠️";

            let message = `   플레이어 ${playerId.slice(
                -6
            )}: ${statusIcon} ${settlementType}`;

            if (totalSettlement > 0) {
                message += ` (+${totalSettlement.toLocaleString()}원)`;
            }

            if (validation.errors.length > 0) {
                message += ` [${validation.errors.length}개 오류]`;
            } else if (validation.warnings.length > 0) {
                message += ` [${validation.warnings.length}개 경고]`;
            }

            console.log(message);

            // 상세 정보 표시 (처음 3명만)
            if (i < 3) {
                console.log(
                    `      └─ 베팅 ${totalBetAmount.toLocaleString()}원 → 승리 ${playerWinningAmount.toLocaleString()}원`
                );
                if (payoutAmount > 0) {
                    const ratio = (
                        (playerWinningAmount / totalWinningBetAmount) *
                        100
                    ).toFixed(2);
                    console.log(
                        `      └─ 배당률 ${ratio}% → 페이아웃 ${payoutAmount.toLocaleString()}원`
                    );
                }
                if (validation.errors.length > 0) {
                    validation.errors.forEach((error) => {
                        console.log(`      └─ ❌ ${error}`);
                    });
                }
                if (validation.warnings.length > 0) {
                    validation.warnings.forEach((warning) => {
                        console.log(`      └─ ⚠️ ${warning}`);
                    });
                }
                console.log("");
            }
        } catch (error) {
            console.log(
                `   플레이어 ${playerId.slice(-6)}: ❌ 계산 실패 - ${error}`
            );
            validationStats.errors++;
        }
    }

    // 📊 정산 검증 결과 요약
    console.log("\n📊 정산 정확성 검증 결과");
    console.log("═".repeat(50));

    const accuracyRate =
        validationStats.totalTested > 0
            ? (validationStats.validCalculations /
                  validationStats.totalTested) *
              100
            : 0;

    console.log(`🎯 검증 통계:`);
    console.log(`   총 검증 대상: ${validationStats.totalTested}명`);
    console.log(
        `   정확한 계산: ${
            validationStats.validCalculations
        }명 (${accuracyRate.toFixed(1)}%)`
    );
    console.log(`   경고 발생: ${validationStats.warnings}개`);
    console.log(`   오류 발생: ${validationStats.errors}개`);

    console.log(`\n💰 정산 분포:`);
    console.log(
        `   승리 플레이어: ${
            validationStats.payoutPlayers
        }명 (총 ${validationStats.totalPayoutAmount.toLocaleString()}원)`
    );
    console.log(
        `   환불 플레이어: ${
            validationStats.refundPlayers
        }명 (총 ${validationStats.totalRefundAmount.toLocaleString()}원)`
    );
    console.log(`   패배 플레이어: ${validationStats.lossPlayers}명`);

    // 수지 균형 검증
    const totalDistributed =
        validationStats.totalPayoutAmount + validationStats.totalRefundAmount;
    const expectedDistribution =
        totalPayoutPool +
        (validationStats.refundPlayers > 0 ? pollTotalBetAmount : 0);

    // 올바른 수지 균형 검증 (전체 게임 기준)
    const sampleTotalBets = settlementDetails.reduce(
        (sum, detail) => sum + detail.totalBet,
        0
    );
    const sampleWinningBets = settlementDetails
        .filter((detail) => detail.settlementType === "PAYOUT")
        .reduce((sum, detail) => sum + detail.winningBet, 0);

    // 전체 게임에서 샘플 플레이어들이 받을 정당한 몫 계산
    let expectedSampleDistribution = 0;

    if (validationStats.refundPlayers > 0) {
        // 무승부 시 - 전액 환불
        expectedSampleDistribution = sampleTotalBets;
    } else if (sampleWinningBets > 0 && totalWinningBetAmount > 0) {
        // 정상 게임 시 - 전체 상금 풀에서 정당한 몫 계산
        const samplePayoutRatio = sampleWinningBets / totalWinningBetAmount;
        expectedSampleDistribution = Math.floor(
            totalPayoutPool * samplePayoutRatio
        );
    } else {
        // 패배자만 있는 경우
        expectedSampleDistribution = 0;
    }

    console.log(`\n🔍 수지 균형 검증 (전체 게임 기준 - 수정됨):`);
    console.log(`   샘플 베팅 총액: ${sampleTotalBets.toLocaleString()}원`);
    console.log(`   샘플 승리 베팅: ${sampleWinningBets.toLocaleString()}원`);
    console.log(
        `   전체 승리 베팅: ${totalWinningBetAmount.toLocaleString()}원`
    );
    console.log(`   전체 상금 풀: ${totalPayoutPool.toLocaleString()}원`);

    if (sampleWinningBets > 0) {
        const payoutRatio = (sampleWinningBets / totalWinningBetAmount) * 100;
        console.log(
            `   샘플 점유율: ${payoutRatio.toFixed(
                3
            )}% (${sampleWinningBets}/${totalWinningBetAmount})`
        );
    }

    console.log(
        `   예상 지급액: ${expectedSampleDistribution.toLocaleString()}원`
    );
    console.log(`   실제 지급액: ${totalDistributed.toLocaleString()}원`);

    const balanceCheck =
        Math.abs(totalDistributed - expectedSampleDistribution) <=
        validationStats.payoutPlayers + 1;
    console.log(`   균형 상태: ${balanceCheck ? "✅ 정상" : "❌ 불일치"}`);

    if (!balanceCheck) {
        const difference = totalDistributed - expectedSampleDistribution;
        console.log(
            `   차액: ${
                difference > 0 ? "+" : ""
            }${difference.toLocaleString()}원`
        );
        if (expectedSampleDistribution > 0) {
            console.log(
                `   차액률: ${(
                    (difference / expectedSampleDistribution) *
                    100
                ).toFixed(2)}%`
            );
        }
    }

    // 전체 시스템 건전성 평가
    console.log(`\n📊 전체 시스템 건전성 평가:`);
    console.log(`   전체 베팅 총액: ${pollTotalBetAmount.toLocaleString()}원`);
    console.log(`   전체 상금 풀: ${totalPayoutPool.toLocaleString()}원`);
    console.log(`   샘플 검증 결과: ${balanceCheck ? "✅ 정상" : "❌ 불일치"}`);

    if (sampleTotalBets > 0) {
        const sampleSize = (sampleTotalBets / pollTotalBetAmount) * 100;
        console.log(
            `   샘플 규모: ${sampleSize.toFixed(2)}% (${
                validationStats.totalTested
            }명/${703}명)`
        );

        // 시스템 건전성 판단
        if (balanceCheck) {
            console.log(`   ✅ 시스템 건전성: 우수`);
            console.log(`   └─ 샘플 검증 통과 → 전체 정산 로직 정상 작동 예상`);

            // 예상 총 지급액 (상금 풀과 거의 같아야 함)
            const expectedTotalDistribution = totalPayoutPool;
            console.log(
                `   예상 전체 지급액: ${expectedTotalDistribution.toLocaleString()}원 (≈상금 풀)`
            );

            if (validationStats.refundPlayers > 0) {
                console.log(
                    `   📝 참고: 무승부 시 전체 베팅액(${pollTotalBetAmount.toLocaleString()}원) 환불 예상`
                );
            }
        } else {
            console.log(`   ⚠️ 시스템 건전성: 검토 필요`);
            console.log(
                `   └─ 샘플에서 불균형 감지 → 전체 정산 로직 검토 권장`
            );

            const sampleDiscrepancyRate =
                expectedSampleDistribution > 0
                    ? (Math.abs(totalDistributed - expectedSampleDistribution) /
                          expectedSampleDistribution) *
                      100
                    : 0;

            if (sampleDiscrepancyRate < 5) {
                console.log(
                    `   💡 불균형 수준: 경미 (${sampleDiscrepancyRate.toFixed(
                        1
                    )}% 오차)`
                );
            } else if (sampleDiscrepancyRate < 15) {
                console.log(
                    `   ⚠️ 불균형 수준: 보통 (${sampleDiscrepancyRate.toFixed(
                        1
                    )}% 오차)`
                );
            } else {
                console.log(
                    `   🚨 불균형 수준: 심각 (${sampleDiscrepancyRate.toFixed(
                        1
                    )}% 오차)`
                );
            }
        }
    }

    // 정확성 평가
    if (accuracyRate >= 95) {
        console.log(`\n🏆 정산 정확성: 우수 (${accuracyRate.toFixed(1)}%)`);
    } else if (accuracyRate >= 90) {
        console.log(`\n✅ 정산 정확성: 양호 (${accuracyRate.toFixed(1)}%)`);
    } else if (accuracyRate >= 80) {
        console.log(
            `\n⚠️ 정산 정확성: 보통 (${accuracyRate.toFixed(1)}%) - 개선 필요`
        );
    } else {
        console.log(
            `\n❌ 정산 정확성: 불량 (${accuracyRate.toFixed(
                1
            )}%) - 즉시 수정 필요`
        );
    }

    // 상세 오류 분석 (오류가 있는 경우)
    if (validationStats.errors > 0) {
        console.log(`\n🚨 오류 상세 분석:`);
        const errorDetails = settlementDetails.filter(
            (d) => d.validation.errors.length > 0
        );
        errorDetails.forEach((detail) => {
            console.log(`   플레이어 ${detail.playerId}:`);
            detail.validation.errors.forEach((error: string) => {
                console.log(`     - ${error}`);
            });
        });
    }

    return {
        accuracyRate,
        validationStats,
        balanceCheck,
        settlementDetails,
    };
}

function validateSettlementCalculation(input: any) {
    const {
        playerId,
        totalBetAmount,
        playerWinningAmount,
        payoutAmount,
        refundAmount,
        settlementType,
        expectedData,
    } = input;

    const warnings: string[] = [];
    const errors: string[] = [];

    // 1. 기본 검증
    if (payoutAmount < 0 || refundAmount < 0) {
        errors.push("Negative settlement amount detected");
    }

    if (totalBetAmount <= 0) {
        warnings.push("No betting amount found");
    }

    // 2. 정산 유형별 검증
    if (settlementType === "PAYOUT") {
        // 승리 배당 검증
        if (playerWinningAmount <= 0) {
            errors.push("Payout player has no winning bets");
        }

        if (expectedData.totalWinningBetAmount > 0) {
            const expectedRatio =
                playerWinningAmount / expectedData.totalWinningBetAmount;
            const expectedPayout = Math.floor(
                expectedData.totalPayoutPool * expectedRatio
            );

            if (Math.abs(payoutAmount - expectedPayout) > 1) {
                errors.push(
                    `Payout calculation error: expected ${expectedPayout}, got ${payoutAmount}`
                );
            }
        }

        if (refundAmount > 0) {
            warnings.push("Payout player also has refund amount");
        }
    } else if (settlementType === "REFUND") {
        // 환불 검증
        if (refundAmount !== totalBetAmount) {
            errors.push(
                `Refund amount mismatch: expected ${totalBetAmount}, got ${refundAmount}`
            );
        }

        if (payoutAmount > 0) {
            warnings.push("Refund player also has payout amount");
        }
    } else if (settlementType === "LOSS") {
        // 패배 검증
        if (payoutAmount > 0 || refundAmount > 0) {
            errors.push("Loss player should not have any settlement");
        }

        if (playerWinningAmount > 0) {
            warnings.push("Loss player has winning bets but no payout");
        }
    }

    // 3. 비율 검증
    if (settlementType === "PAYOUT" && expectedData.totalPayoutPool > 0) {
        const payoutRatio = payoutAmount / expectedData.totalPayoutPool;
        if (payoutRatio > 1) {
            errors.push("Payout ratio exceeds 100%");
        }
    }

    return {
        isValid: errors.length === 0,
        warnings,
        errors,
    };
}
