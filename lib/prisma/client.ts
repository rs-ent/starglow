// lib/prisma/client.ts

import { PrismaClient } from "@prisma/client";

/**
 * PrismaClient is attached to the `global` object in development to prevent
 * exhausting your database connection limit.
 *
 * Learn more:
 * https://pris.ly/d/help/next-js-best-practices
 */

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

// Add pgbouncer=true to prevent prepared statement errors in both development and production
const getPrismaClient = () => {
    let url = process.env.POSTGRES_PRISMA_URL || "";

    // Add pgbouncer and connection_limit params if not already present
    if (!url.includes("pgbouncer=true")) {
        url += url.includes("?") ? "&pgbouncer=true" : "?pgbouncer=true";
    }

    if (!url.includes("connection_limit=")) {
        url += "&connection_limit=1";
    }

    return new PrismaClient({
        log: ["error"],
        datasources: {
            db: { url },
        },
    });
};

export const prisma = global.prisma || getPrismaClient();

// In development, prevent connection leaks
if (process.env.NODE_ENV !== "production") global.prisma = prisma;
