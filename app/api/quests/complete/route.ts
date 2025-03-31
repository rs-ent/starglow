/// app/api/missions/complete/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

/*

model QuestLog {
  id             String    @id @default(cuid())
  playerId       String
  questId        String
  completed      Boolean   @default(false)
  completedAt    DateTime?
  rewards        Int       @default(0)
  rewardCurrency RewardCurrency @default(points)

  pointsLogs     PointsLog[]

  player         Player    @relation(fields: [playerId], references: [id], onDelete: Cascade)
  quest          Quest     @relation(fields: [questId], references: [id])

  @@unique([playerId, questId])
  @@index([playerId, questId, completed])
}

*/

const schema = z.object({
    playerId: z.string(),
    questId: z.string(),
    completed: z.boolean(),
    completedAt: z.date().optional(),
    rewards: z.number().int(),
    rewardCurrency: z.enum(["points", "SGP", "SGT"]),
});

export async function POST(req: NextRequest) {
    const data = schema.safeParse(await req.json());
    if (!data.success) {
        return NextResponse.json({ error: data.error }, { status: 400 });
    }

    const log = await prisma.questLog.create({
        data: {
            playerId: data.data.playerId,
            questId: data.data.questId,
            completed: data.data.completed,
            completedAt: data.data.completedAt,
            rewards: data.data.rewards,
            rewardCurrency: data.data.rewardCurrency,
        },
    });

    return NextResponse.json({ success: true, log }, { status: 200 });
}
