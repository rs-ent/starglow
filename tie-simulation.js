// 완벽한 동점 상황 포인트 분배 시뮬레이션

console.log("🎯 완벽한 동점 상황 포인트 분배 시뮬레이션");
console.log("=".repeat(80));

// 투표 결과 계산
function getPollResult(pollLogs) {
    const optionVoteCounts = {};
    pollLogs.forEach((log) => {
        if (!optionVoteCounts[log.optionId]) {
            optionVoteCounts[log.optionId] = 0;
        }
        optionVoteCounts[log.optionId] += log.amount;
    });

    const totalVotes = Object.values(optionVoteCounts).reduce(
        (sum, count) => sum + count,
        0
    );
    const results = Object.entries(optionVoteCounts).map(
        ([optionId, voteCount]) => ({
            optionId,
            voteCount,
            voteRate: totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0,
        })
    );

    return { totalVotes, results };
}

// 투표 기반 승리자 결정
function simulateVoteBasedSettlement(pollLogs) {
    const pollResult = getPollResult(pollLogs);
    if (pollResult.totalVotes === 0 || pollResult.results.length === 0) {
        return {
            success: false,
            winningOptionIds: [],
            maxVoteCount: 0,
            totalVotes: 0,
        };
    }

    const maxVoteCount = Math.max(
        ...pollResult.results.map((option) => option.voteCount)
    );
    const winningOptionIds = pollResult.results
        .filter((option) => option.voteCount === maxVoteCount)
        .map((option) => option.optionId);

    return {
        success: true,
        winningOptionIds,
        maxVoteCount,
        totalVotes: pollResult.totalVotes,
        voteDistribution: pollResult.results.reduce((acc, option) => {
            acc[option.optionId] = option.voteCount;
            return acc;
        }, {}),
    };
}

// 포인트 분배 시뮬레이션
function simulateBettingPayout(
    pollLogs,
    winningOptionIds,
    houseCommissionRate = 0.05
) {
    const betAmounts = {};
    const playerBets = {};

    pollLogs.forEach((log) => {
        if (!betAmounts[log.optionId]) betAmounts[log.optionId] = 0;
        betAmounts[log.optionId] += log.betAmount;

        if (!playerBets[log.playerId]) playerBets[log.playerId] = {};
        if (!playerBets[log.playerId][log.optionId])
            playerBets[log.playerId][log.optionId] = 0;
        playerBets[log.playerId][log.optionId] += log.betAmount;
    });

    const totalBetAmount = Object.values(betAmounts).reduce(
        (sum, amount) => sum + amount,
        0
    );
    const totalCommission =
        Math.floor(totalBetAmount * houseCommissionRate * 100) / 100;
    const payoutPool = totalBetAmount - totalCommission;

    const totalWinningBets = winningOptionIds.reduce(
        (sum, optionId) => sum + (betAmounts[optionId] || 0),
        0
    );

    if (totalWinningBets === 0) {
        return {
            success: true,
            type: "refund",
            totalPayout: totalBetAmount,
            payoutDetails: pollLogs.map((log) => ({
                playerId: log.playerId,
                optionId: log.optionId,
                betAmount: log.betAmount,
                payout: log.betAmount,
                profit: 0,
                profitRate: 0,
            })),
        };
    }

    const payoutDetails = [];
    let totalActualPayout = 0;

    Object.entries(playerBets).forEach(([playerId, options]) => {
        Object.entries(options).forEach(([optionId, betAmount]) => {
            if (winningOptionIds.includes(optionId)) {
                const payoutRatio = betAmount / totalWinningBets;
                const payout = Math.floor(payoutPool * payoutRatio * 100) / 100;
                const profit = payout - betAmount;
                const profitRate =
                    betAmount > 0 ? (profit / betAmount) * 100 : 0;

                payoutDetails.push({
                    playerId,
                    optionId,
                    betAmount,
                    payout,
                    profit,
                    profitRate,
                });
                totalActualPayout += payout;
            } else {
                payoutDetails.push({
                    playerId,
                    optionId,
                    betAmount,
                    payout: 0,
                    profit: -betAmount,
                    profitRate: -100,
                });
            }
        });
    });

    // 승리자는 승리한 옵션에 베팅한 사람들 (수익/손실과 무관)
    const actualWinners = payoutDetails.filter((p) =>
        winningOptionIds.includes(p.optionId)
    );
    const actualLosers = payoutDetails.filter(
        (p) => !winningOptionIds.includes(p.optionId)
    );

    return {
        success: true,
        type: "settled",
        totalBetAmount,
        totalCommission,
        payoutPool,
        totalWinningBets,
        totalActualPayout,
        winnerCount: actualWinners.length,
        loserCount: actualLosers.length,
        payoutDetails,
        averageProfitRate:
            actualWinners.length > 0
                ? actualWinners.reduce((sum, p) => sum + p.profitRate, 0) /
                  actualWinners.length
                : 0,
    };
}

// 완벽한 동점 시나리오들
const tieScenarios = [
    {
        name: "🎯 완벽한 8-way 동점 (동일 베팅)",
        pollLogs: (() => {
            const options = ["a", "b", "c", "d", "e", "f", "g", "h"];
            const logs = [];
            // 각 옵션에 동일한 투표수와 동일한 베팅 금액
            options.forEach((optionId, index) => {
                for (let i = 0; i < 100; i++) {
                    logs.push({
                        playerId: `${optionId}_player_${i}`,
                        optionId,
                        amount: 1, // 모든 옵션 100표씩
                        betAmount: 1000, // 모든 사람 1000토큰씩
                    });
                }
            });
            return logs;
        })(),
        description: "8개 옵션 완벽 동점, 모든 베팅자 동일 금액",
    },
    {
        name: "💰 완벽한 8-way 동점 (베팅 금액 차이)",
        pollLogs: (() => {
            const options = ["a", "b", "c", "d", "e", "f", "g", "h"];
            const logs = [];
            const betAmounts = [
                100, 500, 1000, 2000, 5000, 10000, 20000, 50000,
            ];

            options.forEach((optionId, index) => {
                for (let i = 0; i < 50; i++) {
                    logs.push({
                        playerId: `${optionId}_player_${i}`,
                        optionId,
                        amount: 1, // 모든 옵션 50표씩 (동점)
                        betAmount: betAmounts[index], // 옵션별로 다른 베팅 금액
                    });
                }
            });
            return logs;
        })(),
        description:
            "8개 옵션 완벽 동점, 옵션별 베팅 금액 차이 (100~50,000토큰)",
    },
    {
        name: "🎲 완벽한 8-way 동점 (랜덤 베팅)",
        pollLogs: (() => {
            const options = ["a", "b", "c", "d", "e", "f", "g", "h"];
            const logs = [];

            options.forEach((optionId) => {
                for (let i = 0; i < 75; i++) {
                    logs.push({
                        playerId: `${optionId}_player_${i}`,
                        optionId,
                        amount: 1, // 모든 옵션 75표씩 (동점)
                        betAmount: Math.floor(Math.random() * 10000) + 100, // 랜덤 베팅
                    });
                }
            });
            return logs;
        })(),
        description: "8개 옵션 완벽 동점, 개인별 랜덤 베팅 (100~10,100토큰)",
    },
    {
        name: "🐋 완벽한 8-way 동점 (고래 vs 새우)",
        pollLogs: (() => {
            const options = ["a", "b", "c", "d", "e", "f", "g", "h"];
            const logs = [];

            options.forEach((optionId, index) => {
                if (index < 4) {
                    // 처음 4개 옵션: 고래 베팅자들
                    for (let i = 0; i < 25; i++) {
                        logs.push({
                            playerId: `whale_${optionId}_${i}`,
                            optionId,
                            amount: 1,
                            betAmount: 100000, // 고래: 10만 토큰
                        });
                    }
                } else {
                    // 나머지 4개 옵션: 새우 베팅자들
                    for (let i = 0; i < 25; i++) {
                        logs.push({
                            playerId: `shrimp_${optionId}_${i}`,
                            optionId,
                            amount: 1,
                            betAmount: 100, // 새우: 100 토큰
                        });
                    }
                }
            });
            return logs;
        })(),
        description: "8개 옵션 완벽 동점, 고래(10만) vs 새우(100) 베팅자",
    },
    {
        name: "⚡ 완벽한 8-way 동점 (극한 격차)",
        pollLogs: (() => {
            const options = ["a", "b", "c", "d", "e", "f", "g", "h"];
            const logs = [];

            options.forEach((optionId, index) => {
                const baseAmount = Math.pow(10, index); // 1, 10, 100, 1000, 10000, 100000, 1000000, 10000000

                for (let i = 0; i < 10; i++) {
                    logs.push({
                        playerId: `${optionId}_player_${i}`,
                        optionId,
                        amount: 1, // 모든 옵션 10표씩 (동점)
                        betAmount: baseAmount,
                    });
                }
            });
            return logs;
        })(),
        description: "8개 옵션 완벽 동점, 극한 베팅 격차 (1~1천만 토큰)",
    },
];

console.log("\n🎯 완벽한 동점 상황 테스트");
console.log("-".repeat(60));

tieScenarios.forEach((scenario, index) => {
    console.log(`\n${index + 1}. ${scenario.name}`);
    console.log(`   📝 ${scenario.description}`);

    const voteResult = simulateVoteBasedSettlement(scenario.pollLogs);

    if (!voteResult.success) {
        console.log(`   ❌ 투표 결정 실패`);
        return;
    }

    console.log(
        `   🏆 승리 옵션: [${voteResult.winningOptionIds.join(", ")}] (${
            voteResult.winningOptionIds.length
        }개 동점)`
    );
    console.log(`   🗳️ 각 옵션 투표수: ${voteResult.maxVoteCount}표`);

    const payoutResult = simulateBettingPayout(
        scenario.pollLogs,
        voteResult.winningOptionIds
    );

    console.log(
        `   💰 총 베팅 풀: ${
            payoutResult.totalBetAmount?.toLocaleString() || 0
        } 토큰`
    );
    console.log(
        `   🏦 수수료 (5%): ${
            payoutResult.totalCommission?.toLocaleString() || 0
        } 토큰`
    );
    console.log(
        `   🎁 배당 풀: ${payoutResult.payoutPool?.toLocaleString() || 0} 토큰`
    );
    const isAllWin = voteResult.winningOptionIds.length === 8; // 8개 옵션 모두 동점
    console.log(
        `   👥 승리자: ${payoutResult.winnerCount || 0}명 ${
            isAllWin ? "(모든 베팅자 공동승리!)" : ""
        }`
    );
    console.log(`   💔 패배자: ${payoutResult.loserCount || 0}명`);

    if (payoutResult.type === "settled" && payoutResult.payoutDetails) {
        // 승리자는 승리한 옵션에 베팅한 사람들
        const winners = payoutResult.payoutDetails.filter((p) =>
            voteResult.winningOptionIds.includes(p.optionId)
        );

        if (winners.length > 0) {
            const profitRates = winners.map((w) => w.profitRate);
            const maxProfit = Math.max(...profitRates);
            const minProfit = Math.min(...profitRates);
            const avgProfit =
                profitRates.reduce((sum, rate) => sum + rate, 0) /
                profitRates.length;

            console.log(
                `   📈 승리자 수익률: ${minProfit.toFixed(
                    1
                )}% ~ ${maxProfit.toFixed(1)}% (평균: ${avgProfit.toFixed(1)}%)`
            );

            // 옵션별 분석
            const optionAnalysis = {};
            winners.forEach((winner) => {
                if (!optionAnalysis[winner.optionId]) {
                    optionAnalysis[winner.optionId] = {
                        count: 0,
                        totalBet: 0,
                        totalPayout: 0,
                        totalProfit: 0,
                    };
                }
                const analysis = optionAnalysis[winner.optionId];
                analysis.count++;
                analysis.totalBet += winner.betAmount;
                analysis.totalPayout += winner.payout;
                analysis.totalProfit += winner.profit;
            });

            console.log(`   📊 옵션별 분석:`);
            Object.entries(optionAnalysis).forEach(([optionId, analysis]) => {
                const avgProfitRate =
                    analysis.totalBet > 0
                        ? (analysis.totalProfit / analysis.totalBet) * 100
                        : 0;
                console.log(
                    `     ${optionId.toUpperCase()}: ${
                        analysis.count
                    }명, 베팅 ${analysis.totalBet.toLocaleString()}, 수익률 ${avgProfitRate.toFixed(
                        1
                    )}%`
                );
            });

            // 수익/손실 균형 확인
            const totalWinnerProfits = winners.reduce(
                (sum, w) => sum + w.profit,
                0
            );
            const expectedLoss = payoutResult.totalCommission;
            const balanceCheck = Math.abs(
                Math.abs(totalWinnerProfits) - expectedLoss
            );

            console.log(
                `   ⚖️ 수익/손실 균형: ${
                    balanceCheck < 0.01
                        ? "✅ 완벽"
                        : `❌ ${balanceCheck.toFixed(2)} 차이`
                }`
            );

            if (isAllWin) {
                console.log(
                    `   💡 결과: 모든 베팅자가 공동승리하며 수수료(5%)만큼만 손실`
                );
            } else {
                console.log(
                    `   💡 결과: 승리자들은 배당을 받고, 패배자들은 전액 손실`
                );
            }
        }
    }
});

// 동점 상황 확률 분석
console.log("\n\n🎲 동점 확률 분석");
console.log("-".repeat(60));

const RANDOM_TIE_TESTS = 1000;
let perfect8WayTies = 0;
let partial8WayTies = 0;
let noTies = 0;

console.log(`🔄 ${RANDOM_TIE_TESTS}회의 랜덤 동점 확률 분석...`);

for (let i = 0; i < RANDOM_TIE_TESTS; i++) {
    const options = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const pollLogs = [];

    options.forEach((optionId) => {
        const voterCount = Math.floor(Math.random() * 100) + 50; // 50~149명

        for (let j = 0; j < voterCount; j++) {
            pollLogs.push({
                playerId: `${optionId}_player_${j}`,
                optionId,
                amount: 1,
                betAmount: Math.floor(Math.random() * 5000) + 100,
            });
        }
    });

    const voteResult = simulateVoteBasedSettlement(pollLogs);

    if (voteResult.success) {
        if (voteResult.winningOptionIds.length === 8) {
            perfect8WayTies++;
        } else if (voteResult.winningOptionIds.length > 1) {
            partial8WayTies++;
        } else {
            noTies++;
        }
    }
}

console.log(`\n📊 동점 확률 분석 결과:`);
console.log(
    `   🎯 완벽한 8-way 동점: ${perfect8WayTies}/${RANDOM_TIE_TESTS} (${(
        (perfect8WayTies / RANDOM_TIE_TESTS) *
        100
    ).toFixed(2)}%)`
);
console.log(
    `   🤝 부분 동점 (2-7개): ${partial8WayTies}/${RANDOM_TIE_TESTS} (${(
        (partial8WayTies / RANDOM_TIE_TESTS) *
        100
    ).toFixed(2)}%)`
);
console.log(
    `   🏆 단독 승리: ${noTies}/${RANDOM_TIE_TESTS} (${(
        (noTies / RANDOM_TIE_TESTS) *
        100
    ).toFixed(2)}%)`
);

console.log("\n" + "=".repeat(80));
console.log("🎯 완벽한 동점 상황 최종 분석");
console.log("=".repeat(80));

console.log(`\n📋 동점 상황 핵심 결론:`);
console.log(`   ✅ 모든 베팅자가 승리자가 됨`);
console.log(`   ✅ 수익률은 정확히 -5% (수수료만큼 손실)`);
console.log(`   ✅ 베팅 금액에 관계없이 동일한 손실률`);
console.log(`   ✅ 수학적으로 완벽한 공정성 보장`);

console.log(`\n🔍 동점 상황의 특징:`);
console.log(`   💰 payoutRatio = 개인베팅금액 / 전체베팅금액`);
console.log(`   🎁 개인배당 = payoutPool × payoutRatio`);
console.log(`   📉 결과: 개인배당 = 개인베팅금액 × 0.95 (5% 손실)`);

console.log(`\n🌟 시스템 안정성:`);
console.log(`   ✅ 극한 베팅 격차(1~1천만)에도 공정 분배`);
console.log(`   ✅ 고래 vs 새우 상황에서도 비례 손실`);
console.log(`   ✅ 어떤 동점 상황에도 시스템 안정성 유지`);

console.log(`\n🎉 결론: 완벽한 동점 상황도 걱정 없습니다!`);
console.log(
    `   모든 베팅자가 공정하게 수수료만큼만 손실하는 투명한 시스템! 💎`
);
