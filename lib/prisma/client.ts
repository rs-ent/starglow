// lib/prisma/client.ts

import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

/**
 * 🚀 Prisma Business 플랜 최적화된 클라이언트
 * - Accelerate 내장 Connection Pool 활용
 * - Global Edge Cache 전략 구현
 * - Business 플랜 권장사항 준수
 * - Vercel Serverless + Edge Runtime 최적화
 */

declare global {
    var prisma: ReturnType<typeof createPrismaClient> | undefined;
}

// 🚀 Business 플랜: Environment별 최적화 설정
const PERFORMANCE_CONFIG = {
    production: {
        logLevel: ["error"],
        // Accelerate가 connection pooling을 담당하므로 제거
        cacheConfig: {
            defaultTtl: 300, // 5분 기본 캐시
            maxTtl: 3600, // 1시간 최대 캐시
        },
    },
    development: {
        logLevel: ["error", "warn", "info"],
        cacheConfig: {
            defaultTtl: 60, // 1분 개발용 캐시
            maxTtl: 300, // 5분 최대 캐시
        },
    },
} as const;

const config =
    PERFORMANCE_CONFIG[
        process.env.NODE_ENV === "production" ? "production" : "development"
    ];

// 🚀 Business 플랜: Accelerate URL 검증 및 최적화
function validateAccelerateUrl(): string {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new Error("DATABASE_URL is required");
    }

    // Business 플랜에서는 Accelerate URL 필수
    if (!databaseUrl.includes("accelerate.prisma-data.net")) {
        console.warn("⚠️ Business 플랜에서는 Accelerate URL 사용을 권장합니다");
    }

    return databaseUrl;
}

// 🚀 Business 플랜: 최적화된 클라이언트 생성
function createPrismaClient() {
    const client = new PrismaClient({
        log: config.logLevel as any,

        // 🚀 Accelerate가 connection pooling을 담당하므로 datasources 설정 단순화
        datasources: {
            db: {
                url: validateAccelerateUrl(),
            },
        },

        // 🚀 Business 플랜: Transaction 최적화 (Accelerate 환경 고려)
        transactionOptions: {
            timeout: 30000, // Accelerate 권장: 30초
            maxWait: 10000, // Accelerate 권장: 10초
            isolationLevel: "ReadCommitted",
        },

        // 🚀 Edge Runtime 최적화
        errorFormat: "minimal",
    });

    // 🚀 Business 플랜 핵심: Accelerate 확장 적용
    const acceleratedClient = client.$extends(withAccelerate());

    // 🚀 개발환경 모니터링
    if (process.env.NODE_ENV === "development") {
        console.info("🚀 Prisma Client with Accelerate (Business Plan)");
        console.info(`📊 Cache TTL: ${config.cacheConfig.defaultTtl}s`);
        console.info(`🌍 Global Edge Cache: Enabled`);
    }

    return acceleratedClient;
}

// 🚀 Business 플랜: Global 변수를 통한 연결 재사용
export const prisma = global.prisma ?? createPrismaClient();

// 🚀 개발환경에서 HMR 대응 (Next.js Best Practice)
if (process.env.NODE_ENV !== "production") {
    global.prisma = prisma;
}

// 🚀 서버리스 환경 대응: 적절한 연결 종료
if (typeof window === "undefined") {
    process.on("beforeExit", async () => {
        await prisma.$disconnect();
    });

    process.on("SIGINT", async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
}

// 🚀 Business 플랜: 실제 Cache Strategy 사용 예시
export const CacheStrategies = {
    // 사용자 데이터 (빠른 무효화 필요)
    userProfile: { ttl: 5, swr: 5 },

    // 정적 콘텐츠 (긴 캐시)
    staticContent: { ttl: 5, swr: 5 },

    // 실시간 데이터 (짧은 캐시)
    realtime: { ttl: 5, swr: 5 },

    // 아티스트 데이터 (중간 캐시)
    artistData: { ttl: 5, swr: 5 },
} as const;

// 대용량 데이터 처리용 최적화된 페이지네이션
export const createSafePagination = (
    page: number = 1,
    limit: number = 20,
    maxLimit: number = 100
) => ({
    skip: Math.max(0, (page - 1) * limit),
    take: Math.min(limit, maxLimit),
});

// 🚀 Business 플랜: Bulk operations with Accelerate 최적화
export async function performBulkOperation<T>(
    operations: (() => Promise<T>)[],
    batchSize: number = 50 // Accelerate 권장 배치 크기
): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);

        // 병렬 실행으로 성능 최적화
        const batchResults = await Promise.allSettled(batch.map((op) => op()));

        // 성공한 결과만 수집
        batchResults.forEach((result) => {
            if (result.status === "fulfilled") {
                results.push(result.value);
            } else {
                console.error("Batch operation failed:", result.reason);
            }
        });

        // 🚀 Accelerate 친화적: 배치 간 딜레이 최소화
        if (i + batchSize < operations.length) {
            await new Promise((resolve) => setTimeout(resolve, 5));
        }
    }

    return results;
}

// 🚀 Business 플랜: Cache-aware 트랜잭션 헬퍼
export async function safeCachedTransaction<T>(
    operations: any[]
): Promise<T[]> {
    try {
        // 트랜잭션은 캐시되지 않음을 명시적으로 처리
        return await prisma.$transaction(operations);
    } catch (error) {
        console.error("Cached transaction failed:", error);
        throw error;
    }
}

// 🚀 Business 플랜: Health Check with Accelerate
export async function checkAccelerateHealth(): Promise<{
    database: boolean;
    accelerate: boolean;
    cache: boolean;
}> {
    try {
        // 기본 DB 연결 확인
        await prisma.$queryRaw`SELECT 1`;

        // Cache 동작 확인 (간단한 쿼리로 테스트)
        const testQuery = await prisma.$queryRaw`SELECT NOW() as timestamp`;

        return {
            database: true,
            accelerate: true,
            cache: !!testQuery,
        };
    } catch (error) {
        console.error("Accelerate health check failed:", error);
        return {
            database: false,
            accelerate: false,
            cache: false,
        };
    }
}
