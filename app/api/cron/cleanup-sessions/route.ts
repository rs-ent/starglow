import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma/client";

export async function POST(request: NextRequest) {
    try {
        // 🔒 보안: Authorization 헤더 확인
        const authHeader = request.headers.get("authorization");
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const now = new Date();

        // 만료된 세션 수 확인
        const expiredCount = await prisma.session.count({
            where: {
                expires: { lt: now },
            },
        });

        if (expiredCount === 0) {
            return NextResponse.json({
                success: true,
                message: "No expired sessions found",
                deletedCount: 0,
            });
        }

        // 배치로 안전하게 삭제
        const batchSize = 1000;
        let totalDeleted = 0;
        let hasMore = true;

        while (hasMore && totalDeleted < 50000) {
            // 안전장치: 최대 5만개까지만
            const deleted = await prisma.session.deleteMany({
                where: {
                    expires: { lt: now },
                },
            });

            totalDeleted += deleted.count;
            hasMore = deleted.count === batchSize;

            if (hasMore) {
                // 배치 간 100ms 대기
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        }

        return NextResponse.json({
            success: true,
            message: "Session cleanup completed",
            deletedCount: totalDeleted,
        });
    } catch (error) {
        console.error("❌ Session cleanup failed:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
