/// app/api/player/points/route.ts

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const schema = z.object({
    playerId: z.string(),
    questId: z.string().optional(),
    questLogId: z.string().optional(),
    pollId: z.string().optional(),
    pollLogId: z.string().optional(),
    amount: z.number().int(),
    reason: z.string().optional(),
    currency: z.enum(["points", "SGP", "SGT"]),
});

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("playerId");
    const currency = searchParams.get("currency");

    if (!playerId || !currency) {
        return NextResponse.json(
            { message: "Player ID and Currency are required" },
            { status: 400 }
        );
    }

    if (!["points", "SGP", "SGT"].includes(currency)) {
        return NextResponse.json(
            { message: "Invalid currency" },
            { status: 400 }
        );
    }

    try {
        const player = await prisma.player.findUnique({
            where: { id: playerId },
            select: { points: true, SGP: true, SGT: true },
        });

        if (!player) {
            return NextResponse.json(
                { message: "Player not found" },
                { status: 404 }
            );
        }

        const currencyMap: Record<"points" | "SGP" | "SGT", number> = {
            points: player.points,
            SGP: player.SGP,
            SGT: player.SGT,
        };

        return NextResponse.json(
            {
                currency,
                amount: currencyMap[currency as "points" | "SGP" | "SGT"],
            },
            { status: 200 }
        );
    } catch (error) {
        console.error(
            "[Player][gameMoney] Error fetching player game money:",
            error
        );
        return NextResponse.json(
            { message: "Failed to fetch player game money" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const body = await request.json();
    const validation = schema.safeParse(body);

    if (!validation.success) {
        return NextResponse.json({ message: "Invalid data" }, { status: 400 });
    }

    const {
        playerId,
        amount,
        currency,
        reason,
        questId,
        questLogId,
        pollId,
        pollLogId,
    } = validation.data;

    const updateData: Record<string, { increment: number }> = {
        [currency]: { increment: amount },
    };

    try {
        const player = await prisma.player.update({
            where: { id: playerId },
            data: updateData,
        });

        await prisma.rewardsLog.create({
            data: {
                playerId,
                amount,
                currency,
                reason,
                questId,
                questLogId,
                pollId,
                pollLogId,
            },
        });

        return NextResponse.json({ player }, { status: 200 });
    } catch (error) {
        console.error(
            "[Player][Reward] Error updating player game money:",
            error
        );
        return NextResponse.json(
            { message: "Failed to update player game money" },
            { status: 500 }
        );
    }
}
