/// app/actions/referral.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import { ReferralLog } from "@prisma/client";

export interface GetReferralLogsInput {
    playerId: string;
}

export async function getReferralLogs(
    input?: GetReferralLogsInput
): Promise<ReferralLog[]> {
    if (!input) {
        return [];
    }
    try {
        const referralLogs = await prisma.referralLog.findMany({
            where: {
                referrerPlayerId: input.playerId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return referralLogs;
    } catch (error) {
        console.error(error);
        return [];
    }
}
