/// app/api/missions/complete/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const schema = z.object({
    playerId: z.string(),
    missionId: z.string(),
    type: z.enum(["Daily", "General"]),
    Quest_Title: z.string().optional(),
    Quest_Type: z.string().optional(),
    Quest_Date: z.string().optional(),
    Price: z.number().optional(),
    Currency: z.enum(["Points", "SGP", "SGT"]).optional(),
    URL: z.string().optional(),
});

export async function POST(req: NextRequest) {
    const data = schema.safeParse(await req.json());
    if (!data.success) {
        return NextResponse.json({ error: data.error }, { status: 400 });
    }

    const log = await prisma.missionLog.create({
        data: {
            playerId: data.data.playerId,
            missionId: data.data.missionId,
            type: data.data.type,
            Quest_Title: data.data.Quest_Title,
            Quest_Type: data.data.Quest_Type,
            Quest_Date: data.data.Quest_Date,
            Price: data.data.Price,
            Currency: data.data.Currency,
            URL: data.data.URL,
        },
    });

    return NextResponse.json({ success: true, log }, { status: 200 });
}
