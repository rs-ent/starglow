// lib/prisma/client.ts

import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

/**
 * PrismaClient is attached to the `global` object in development to prevent
 * exhausting your database connection limit.
 *
 * Learn more:
 * https://pris.ly/d/help/next-js-best-practices
 */

declare global {
    var prisma: ReturnType<typeof getPrismaClient> | undefined;
}

// Prisma Accelerate를 사용한 최적화된 클라이언트 설정
const getPrismaClient = () => {
    // Accelerate를 사용할 때는 CONNECTION_POOL_TIMEOUT 등이 필요없음
    const client = new PrismaClient({
        log:
            process.env.NODE_ENV === "development"
                ? ["error", "warn"]
                : ["error"],
    });

    // Accelerate extension 적용
    return client.$extends(withAccelerate());
};

export const prisma = global.prisma || getPrismaClient();

// In development, prevent connection leaks
if (process.env.NODE_ENV !== "production") global.prisma = prisma;
