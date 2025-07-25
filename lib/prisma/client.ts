// lib/prisma/client.ts

import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

declare global {
    var prisma: ReturnType<typeof createPrismaClient> | undefined;
}

const PERFORMANCE_CONFIG = {
    production: {
        logLevel: ["error"],
        cacheConfig: {
            defaultTtl: 30,
            maxTtl: 300,
        },
    },
    development: {
        logLevel: ["error", "warn"],
        cacheConfig: {
            defaultTtl: 60,
            maxTtl: 600,
        },
    },
} as const;

const config =
    PERFORMANCE_CONFIG[
        process.env.NODE_ENV === "production" ? "production" : "development"
    ];

function validateAccelerateUrl(): string {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new Error("DATABASE_URL is required");
    }

    return databaseUrl;
}

function createPrismaClient() {
    const client = new PrismaClient({
        log: config.logLevel as any,

        datasources: {
            db: {
                url: validateAccelerateUrl(),
            },
        },

        transactionOptions: {
            timeout: 30000,
            maxWait: 5000,
            isolationLevel: "ReadCommitted",
        },

        errorFormat: "minimal",
    });

    const acceleratedClient = client.$extends(withAccelerate());

    return acceleratedClient;
}

export const prisma = global.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    global.prisma = prisma;
}

if (typeof window === "undefined") {
    process.on("beforeExit", async () => {
        await prisma.$disconnect();
    });

    process.on("SIGINT", async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
}

export const createSafePagination = (
    page: number = 1,
    limit: number = 20,
    maxLimit: number = 100
) => ({
    skip: Math.max(0, (page - 1) * limit),
    take: Math.min(limit, maxLimit),
});

export async function performBulkOperation<T>(
    operations: (() => Promise<T>)[],
    batchSize: number = 100
): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);

        const batchResults = await Promise.allSettled(batch.map((op) => op()));

        batchResults.forEach((result) => {
            if (result.status === "fulfilled") {
                results.push(result.value);
            } else {
                console.error("Batch operation failed:", result.reason);
            }
        });

        if (i + batchSize < operations.length) {
            await new Promise((resolve) => setTimeout(resolve, 1));
        }
    }

    return results;
}
