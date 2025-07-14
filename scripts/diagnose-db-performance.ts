#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// 직접 Prisma 클라이언트 생성
const DATABASE_URL =
    "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiMDFKWE1XUlkxSlJYNkdXU1E3RzdUQTMxMjkiLCJ0ZW5hbnRfaWQiOiI2NDg1ODQzZjM0MDg4NDA3YTM4NGVmODQyNzUxZDljOWJjNzRjMjY1MWJjOTMxZGQzNGI3NjA0ZjExOWIxMjM4IiwiaW50ZXJuYWxfc2VjcmV0IjoiMTlmYWVlYjUtZWViMy00ODUzLTlhNTUtN2QxNGJlM2RkMTdlIn0.Gj9-QbBrjGneZSS6sXw4ebm9pJRNxBvmoqY1ZutJhdM";

const prisma = new PrismaClient({
    datasourceUrl: DATABASE_URL,
    log: ["error", "warn"],
}).$extends(withAccelerate());

async function diagnoseDatabasePerformance() {
    console.log("🔍 Database Performance Diagnosis");
    console.log("================================");

    try {
        // 1. Session 테이블 상태 확인
        const [
            totalSessions,
            expiredSessions,
            recentSessions,
            oldestSession,
            newestSession,
        ] = await Promise.all([
            // 전체 세션 수
            prisma.session.count(),

            // 만료된 세션 수
            prisma.session.count({
                where: {
                    expires: { lt: new Date() },
                },
            }),

            // 최근 1일 세션 수
            prisma.session.count({
                where: {
                    expires: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                },
            }),

            // 가장 오래된 세션
            prisma.session.findFirst({
                orderBy: { expires: "asc" },
                select: { expires: true, id: true },
            }),

            // 가장 최신 세션
            prisma.session.findFirst({
                orderBy: { expires: "desc" },
                select: { expires: true, id: true },
            }),
        ]);

        console.log("\n📊 Session Table Status:");
        console.log(`├── Total sessions: ${totalSessions.toLocaleString()}`);
        console.log(
            `├── Expired sessions: ${expiredSessions.toLocaleString()} (${(
                (expiredSessions / totalSessions) *
                100
            ).toFixed(1)}%)`
        );
        console.log(
            `├── Recent sessions (24h): ${recentSessions.toLocaleString()}`
        );
        console.log(
            `├── Oldest session: ${oldestSession?.expires.toISOString()}`
        );
        console.log(
            `└── Newest session: ${newestSession?.expires.toISOString()}`
        );

        // 2. 다른 주요 테이블들 크기 확인
        const [totalUsers, totalPlayers, totalQuestLogs, totalPlayerAssets] =
            await Promise.all([
                prisma.user.count(),
                prisma.player.count(),
                prisma.questLog.count(),
                prisma.playerAsset.count(),
            ]);

        console.log("\n📈 Other Table Sizes:");
        console.log(`├── Users: ${totalUsers.toLocaleString()}`);
        console.log(`├── Players: ${totalPlayers.toLocaleString()}`);
        console.log(`├── Quest Logs: ${totalQuestLogs.toLocaleString()}`);
        console.log(`└── Player Assets: ${totalPlayerAssets.toLocaleString()}`);

        // 3. 만료된 세션이 많다면 정리 권장
        if (expiredSessions > 1000) {
            console.log("\n⚠️  WARNING: Too many expired sessions detected!");
            console.log(
                `   Recommendation: Clean up ${expiredSessions.toLocaleString()} expired sessions`
            );
            console.log("   Run: yarn cleanup-expired-sessions");
        }

        // 4. 전체 세션이 너무 많다면 경고
        if (totalSessions > 50000) {
            console.log("\n🚨 CRITICAL: Session table is too large!");
            console.log("   This could be causing the 60s timeout errors");
            console.log("   Immediate action required!");
        }
    } catch (error) {
        console.error("❌ Error during diagnosis:", error);
    } finally {
        await prisma.$disconnect();
    }
}

// 스크립트 실행
diagnoseDatabasePerformance();
