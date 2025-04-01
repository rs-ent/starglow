/// app/api/quests/complete/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const schema = z.object({
    playerId: z.string(),
    questId: z.string(),
    completed: z.boolean(),
    completedAt: z
        .string()
        .transform((str) => new Date(str))
        .optional(),
    rewards: z.number().int(),
    rewardCurrency: z.enum(["points", "SGP", "SGT"]),
});

export async function POST(req: NextRequest) {
    const rawData = await req.json();

    const data = schema.safeParse(rawData);
    if (!data.success) {
        return NextResponse.json(
            { error: data.error.format() },
            { status: 400 }
        );
    }

    const result = await prisma.$transaction(async (tx) => {
        const questLog = await tx.questLog.create({
            data: {
                playerId: data.data.playerId,
                questId: data.data.questId,
                completed: data.data.completed,
                completedAt: data.data.completedAt || new Date(),
                rewards: data.data.rewards,
                rewardCurrency: data.data.rewardCurrency,
            },
        });

        const rewardsLog = await tx.rewardsLog.create({
            data: {
                playerId: data.data.playerId,
                questId: data.data.questId,
                questLogId: questLog.id,
                pollId: null,
                pollLogId: null,
                amount: data.data.rewards,
                reason: "Quest Completion",
                currency: data.data.rewardCurrency,
            },
        });

        await tx.player.update({
            where: { id: data.data.playerId },
            data: {
                points: {
                    increment:
                        data.data.rewardCurrency === "points"
                            ? data.data.rewards
                            : 0,
                },
                SGP: {
                    increment:
                        data.data.rewardCurrency === "SGP"
                            ? data.data.rewards
                            : 0,
                },
                SGT: {
                    increment:
                        data.data.rewardCurrency === "SGT"
                            ? data.data.rewards
                            : 0,
                },
            },
        });

        return { questLog, rewardsLog };
    });

    return NextResponse.json({ success: true, result }, { status: 200 });
}
