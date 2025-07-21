import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugBettingPolls() {
    console.log("🔍 베팅 폴 상태 디버깅 시작...\n");

    try {
        // 1. 모든 베팅 폴 현황
        const allBettingPolls = await prisma.poll.findMany({
            where: {
                bettingMode: true,
            },
            select: {
                id: true,
                title: true,
                endDate: true,
                bettingStatus: true,
                isSettled: true,
                settledAt: true,
                settledBy: true,
                answerOptionIds: true,
                status: true,
                totalCommissionAmount: true,
                optionBetAmounts: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        console.log(`📊 총 베팅 폴 수: ${allBettingPolls.length}\n`);

        // 2. 상태별 분류
        const statusCount = {
            settled: 0,
            settling: 0,
            open: 0,
            ended: 0,
        };

        const settledPolls = [];
        const unsettledPolls = [];
        const errorPolls = [];

        for (const poll of allBettingPolls) {
            const now = new Date();
            const isEnded = poll.endDate < now;
            
            console.log(`📋 Poll: ${poll.title}`);
            console.log(`   ID: ${poll.id}`);
            console.log(`   Status: ${poll.status}`);
            console.log(`   BettingStatus: ${poll.bettingStatus}`);
            console.log(`   IsSettled: ${poll.isSettled}`);
            console.log(`   SettledAt: ${poll.settledAt}`);
            console.log(`   SettledBy: ${poll.settledBy}`);
            console.log(`   EndDate: ${poll.endDate.toISOString()}`);
            console.log(`   IsEnded: ${isEnded}`);
            console.log(`   AnswerOptionIds: ${JSON.stringify(poll.answerOptionIds)}`);
            
            // 베팅 금액 정보
            const betAmounts = poll.optionBetAmounts as any || {};
            const totalBetAmount = Object.values(betAmounts).reduce(
                (sum: number, amount: any) => sum + (amount || 0), 
                0
            );
            console.log(`   TotalBetAmount: ${totalBetAmount}`);
            console.log(`   TotalCommission: ${poll.totalCommissionAmount || 0}`);
            
            // 상태 분류
            if (poll.isSettled) {
                statusCount.settled++;
                settledPolls.push(poll);
            } else if (poll.bettingStatus === "SETTLING") {
                statusCount.settling++;
                unsettledPolls.push(poll);
            } else if (poll.bettingStatus === "OPEN") {
                statusCount.open++;
                if (isEnded) {
                    unsettledPolls.push(poll);
                }
            }
            
            // 이상한 상태 감지
            if (poll.isSettled && poll.bettingStatus !== "SETTLED") {
                errorPolls.push({
                    ...poll,
                    error: "isSettled=true but bettingStatus!=SETTLED"
                });
            }
            
            if (!poll.isSettled && poll.settledAt) {
                errorPolls.push({
                    ...poll,
                    error: "isSettled=false but settledAt exists"
                });
            }
            
            console.log(`   ---\n`);
        }

        // 3. 요약 정보
        console.log("📈 상태별 요약:");
        console.log(`   ✅ 정산 완료: ${statusCount.settled}개`);
        console.log(`   🔄 정산 진행 중: ${statusCount.settling}개`);
        console.log(`   ⏳ 정산 대기: ${statusCount.open}개`);
        console.log("");

        // 4. 정산 필요한 폴들
        console.log("🚨 정산이 필요한 폴들:");
        for (const poll of unsettledPolls) {
            const now = new Date();
            const isEnded = poll.endDate < now;
            const hoursAgo = Math.floor((now.getTime() - poll.endDate.getTime()) / (1000 * 60 * 60));
            
            console.log(`   - ${poll.title} (${poll.id})`);
            console.log(`     상태: ${poll.bettingStatus}`);
            console.log(`     종료: ${isEnded ? `${hoursAgo}시간 전` : "아직 진행 중"}`);
        }
        console.log("");

        // 5. 이상한 상태의 폴들
        if (errorPolls.length > 0) {
            console.log("⚠️ 이상한 상태의 폴들:");
            for (const poll of errorPolls) {
                console.log(`   - ${poll.title}: ${poll.error}`);
            }
            console.log("");
        }

        // 6. 최근 정산 로그 확인
        console.log("📜 최근 정산 로그들:");
        const recentSettled = settledPolls
            .filter(p => p.settledAt)
            .sort((a, b) => b.settledAt!.getTime() - a.settledAt!.getTime())
            .slice(0, 5);
            
        for (const poll of recentSettled) {
            console.log(`   ✅ ${poll.title}`);
            console.log(`      정산시간: ${poll.settledAt?.toISOString()}`);
            console.log(`      정산자: ${poll.settledBy}`);
        }

    } catch (error) {
        console.error("❌ 디버깅 중 오류:", error);
    } finally {
        await prisma.$disconnect();
    }
}

// 실행
debugBettingPolls()
    .then(() => {
        console.log("🎉 디버깅 완료");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ 스크립트 실행 오류:", error);
        process.exit(1);
    }); 