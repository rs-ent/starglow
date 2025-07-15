/// app\actions\wallet.ts

"use server";

import { WalletStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma/client";

import type { Wallet } from "@prisma/client";
import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";

export interface WalletResponse {
    success: boolean;
    wallets?: Wallet[];
    error?: string;
}

export async function getWalletsByUserId(
    userId: string
): Promise<WalletResponse> {
    try {
        const wallets = await prisma.wallet.findMany({
            cacheStrategy: getCacheStrategy("realtime"),
            where: {
                userId,
                status: WalletStatus.ACTIVE,
            },
            orderBy: [
                { default: "desc" },
                { primary: "desc" },
                { lastAccessedAt: "desc" },
            ],
        });

        return {
            success: true,
            wallets,
        };
    } catch (error) {
        console.error("Error getting wallets:", error);
        return {
            success: false,
            error: "Failed to fetch wallets",
        };
    }
}
