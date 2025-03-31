/// app/api/player/game-money/route.js

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const schema = z.object({
    playerId: z.string(),
    questId: z.string().optional(),
    description: z.string().optional(),
    Price: z.number().int(),
    Currency: z.enum(["Points", "SGP", "SGT"]),
});

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("playerId");

    if (!playerId) {
        return NextResponse.json(
            { message: "Player ID is required" },
            { status: 400 }
        );
    }

    try {
        const player = await prisma.player.findUnique({
            where: { id: playerId },
            select: { gameMoney: true },
        });

        if (!player) {
            return NextResponse.json(
                { message: "Player not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { gameMoney: player.gameMoney },
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

    const { playerId, Price, Currency } = validation.data;
    try {
        const player = await prisma.player.update({
            where: { id: playerId },
            data: {
                gameMoney: { increment: Price },
            },
        });

        await prisma.gameMoneyLog.create({
            data: {
                playerId,
                Price,
                Currency,
            },
        });

        return NextResponse.json({ player }, { status: 200 });
    } catch (error) {
        console.error(
            "[Player][gameMoney] Error updating player game money:",
            error
        );
        return NextResponse.json(
            { message: "Failed to update player game money" },
            { status: 500 }
        );
    }
}
