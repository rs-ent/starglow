import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma/client";

/**
 * 🚀 성능 최적화: 세션 쿼리 캐싱
 * 자주 조회되는 세션 정보를 메모리에 캐싱하여 DB 부하 감소
 */

// 세션 토큰으로 세션 조회 (캐싱 적용)
export const getSessionByToken = unstable_cache(
    async (sessionToken: string) => {
        return await prisma.session.findUnique({
            where: { sessionToken },
            select: {
                id: true,
                userId: true,
                expires: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        role: true,
                        active: true,
                    },
                },
            },
        });
    },
    ["session-by-token"],
    {
        revalidate: 300, // 5분 캐시
        tags: ["session"],
    }
);

// 사용자 ID로 활성 세션 조회 (캐싱 적용)
export const getActiveSessionsByUserId = unstable_cache(
    async (userId: string) => {
        const now = new Date();
        return await prisma.session.findMany({
            where: {
                userId,
                expires: { gt: now },
            },
            select: {
                id: true,
                sessionToken: true,
                expires: true,
            },
            orderBy: { expires: "desc" },
            take: 5, // 최근 5개만
        });
    },
    ["active-sessions-by-user"],
    {
        revalidate: 600, // 10분 캐시
        tags: ["session", "user-sessions"],
    }
);

// 만료된 세션 수 조회 (캐싱 적용)
export const getExpiredSessionCount = unstable_cache(
    async () => {
        const now = new Date();
        return await prisma.session.count({
            where: {
                expires: { lt: now },
            },
        });
    },
    ["expired-session-count"],
    {
        revalidate: 3600, // 1시간 캐시
        tags: ["session", "expired-sessions"],
    }
);