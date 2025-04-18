/// app\actions\wallet.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import { WalletStatus, Wallet } from "@prisma/client";

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
