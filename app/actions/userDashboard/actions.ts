"use server";

import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";
import { prisma } from "@/lib/prisma/client";

export async function getWalletsCount() {
    return await prisma.wallet.count({
        cacheStrategy: getCacheStrategy("oneHour"),
        where: {
            status: "ACTIVE",
        },
    });
}

