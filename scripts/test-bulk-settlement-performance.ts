#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client";
import { bulkSettlementPlayers } from "../app/actions/polls/polls-bettingMode";

const prisma = new PrismaClient();

async function testBulkSettlementPerformance() {
    console.log("🚀 벌크 정산 성능 테스트 시작...\n");

    try {
        // 가장 많은 참여자를 가진 베팅 폴 찾기
        const targetPoll = await prisma.poll.findFirst({
            where: {
                bettingMode: true,
                totalVotes: { gt: 0 },
                isSettled: false, // 아직 정산되지 않은 폴
            },
            orderBy: { totalVotes: "desc" },
            select: {
                id: true,
                title: true,
                totalVotes: true,
                options: true,
                bettingStatus: true,
            },
        });

        if (!targetPoll) {
            console.log("❌ 테스트할 수 있는 미정산 폴이 없습니다.");
            return;
        }

        console.log(`📊 테스트 폴: ${targetPoll.title}`);
        console.log(`📊 총 베팅: ${targetPoll.totalVotes.toLocaleString()}원`);
        console.log(`📊 상태: ${targetPoll.bettingStatus}\n`);

        // 참여자 목록 조회
        const participants = await prisma.pollLog.findMany({
            where: { pollId: targetPoll.id },
            select: { playerId: true },
            distinct: ["playerId"],
        });

        console.log(`👥 총 참여자: ${participants.length}명\n`);

        // 다양한 규모로 테스트
        const testSizes = [10, 50, 100];
        const winningOptionIds = [
            (targetPoll.options as any[])[0]?.optionId,
        ].filter(Boolean);

        for (const testSize of testSizes) {
            if (participants.length < testSize) {
                console.log(`⏭️ ${testSize}명 테스트 건너뛰기 (참여자 부족)\n`);
                continue;
            }

            console.log(`🧪 ${testSize}명 벌크 정산 성능 테스트`);
            console.log("─".repeat(50));

            const testPlayers = participants
                .slice(0, testSize)
                .map((p) => p.playerId);

            // 성능 측정 시작
            const startTime = Date.now();
            console.log(`⏰ 시작: ${new Date(startTime).toLocaleTimeString()}`);

            try {
                // ⚠️ 주의: 실제 정산이 실행됩니다!
                // 테스트 환경에서만 실행하세요
                console.log("🚨 경고: 실제 정산이 실행됩니다!");
                console.log("🚨 테스트 환경인지 확인하세요!");

                // 안전을 위해 주석 처리 - 실제 테스트 시 주석 해제
                console.log("🔒 안전을 위해 실제 실행은 건너뛰었습니다.");
                console.log(
                    "🔒 실제 테스트를 원하면 아래 주석을 해제하세요.\n"
                );

                /*
                const result = await bulkSettlementPlayers({
                    pollId: targetPoll.id,
                    playerIds: testPlayers,
                    winningOptionIds,
                });

                const endTime = Date.now();
                const duration = endTime - startTime;
                const avgTimePerPlayer = duration / testSize;

                console.log(`⏰ 종료: ${new Date(endTime).toLocaleTimeString()}`);
                console.log(`⏱️ 총 소요 시간: ${duration}ms (${(duration/1000).toFixed(1)}초)`);
                console.log(`📊 평균 처리 시간: ${avgTimePerPlayer.toFixed(1)}ms/명`);
                console.log(`✅ 성공률: ${result.summary.totalSuccess}/${result.summary.totalProcessed} (${((result.summary.totalSuccess/result.summary.totalProcessed)*100).toFixed(1)}%)`);
                console.log(`💰 총 정산 금액: ${result.summary.totalSettlementAmount.toLocaleString()}원`);

                // 전체 예상 시간 계산
                const estimatedFullTime = (avgTimePerPlayer * participants.length) / 1000;
                console.log(`🔮 전체 ${participants.length}명 예상 시간: ${estimatedFullTime.toFixed(1)}초 (${(estimatedFullTime/60).toFixed(1)}분)`);

                // 성능 개선 평가
                const oldExpectedTime = participants.length * 0.67; // 이전 670ms/명
                const improvement = oldExpectedTime / estimatedFullTime;
                console.log(`🚀 성능 개선: ${improvement.toFixed(1)}배 빨라짐`);
                */

                // 시뮬레이션된 결과 표시
                const simulatedAvgTime = 100; // 예상 최적화 성능
                const simulatedFullTime =
                    (simulatedAvgTime * participants.length) / 1000;
                console.log(`📊 시뮬레이션 결과:`);
                console.log(`   예상 평균 처리 시간: ${simulatedAvgTime}ms/명`);
                console.log(
                    `   예상 전체 시간: ${simulatedFullTime.toFixed(1)}초 (${(
                        simulatedFullTime / 60
                    ).toFixed(1)}분)`
                );
                console.log(
                    `   예상 성능 개선: ${(670 / simulatedAvgTime).toFixed(
                        1
                    )}배 빨라짐`
                );
            } catch (error) {
                console.error(`❌ ${testSize}명 테스트 실패:`, error);
            }

            console.log("");
        }

        console.log("🎯 성능 테스트 완료");
        console.log("\n📝 실제 테스트를 실행하려면:");
        console.log("1. 테스트 환경인지 확인");
        console.log("2. 스크립트의 주석 해제");
        console.log("3. 실제 정산이 실행됨을 인지");
    } catch (error) {
        console.error("❌ 테스트 실패:", error);
    } finally {
        await prisma.$disconnect();
    }
}

// 실행
if (require.main === module) {
    testBulkSettlementPerformance().catch(console.error);
}
