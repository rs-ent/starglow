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

async function cleanupExpiredSessions() {
    console.log("🧹 Cleaning up expired sessions...");
    console.log("===================================");

    try {
        // 현재 시간
        const now = new Date();

        // 1단계: 만료된 세션 수 확인
        const expiredCount = await prisma.session.count({
            where: {
                expires: { lt: now },
            },
        });

        console.log(
            `📊 Found ${expiredCount.toLocaleString()} expired sessions`
        );

        if (expiredCount === 0) {
            console.log("✅ No expired sessions to clean up!");
            return;
        }

        // 2단계: 배치로 안전하게 삭제 (한 번에 1000개씩)
        const batchSize = 1000;
        let totalDeleted = 0;
        let hasMore = true;

        while (hasMore) {
            const deleted = await prisma.session.deleteMany({
                where: {
                    expires: { lt: now },
                },
            });

            totalDeleted += deleted.count;
            console.log(
                `🗑️  Deleted batch: ${deleted.count} sessions (Total: ${totalDeleted})`
            );

            // 삭제된 개수가 배치 크기보다 작으면 완료
            hasMore = deleted.count === batchSize;

            // 다음 배치 전 잠시 대기 (DB 부하 방지)
            if (hasMore) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        }

        console.log(
            `✅ Cleanup completed! Deleted ${totalDeleted.toLocaleString()} expired sessions`
        );

        // 3단계: 정리 후 상태 확인
        const remainingSessions = await prisma.session.count();
        console.log(
            `📈 Remaining active sessions: ${remainingSessions.toLocaleString()}`
        );
    } catch (error) {
        console.error("❌ Error during cleanup:", error);
    } finally {
        await prisma.$disconnect();
    }
}

// 스크립트 실행
cleanupExpiredSessions();
