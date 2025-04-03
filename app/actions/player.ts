/// app\actions\player.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateCurrencySchema = z.object({
    playerId: z.string(),
    currency: z.enum(["points", "SGP", "SGT"]),
    amount: z.number(),
});

export async function getPlayer(playerId: string) {
    try {
        const player = await prisma.player.findUnique({
            where: { id: playerId },
            include: {
                questLogs: {
                    where: {
                        completed: true,
                    },
                },
            },
        });

        if (!player) {
            throw new Error("Player not found");
        }

        return player;
    } catch (error) {
        console.error("Error fetching player:", error);
        throw error;
    }
}

export async function updatePlayerCurrency(
    input: z.infer<typeof UpdateCurrencySchema>
) {
    try {
        const { playerId, currency, amount } =
            UpdateCurrencySchema.parse(input);

        const player = await prisma.player.findUnique({
            where: { id: playerId },
        });

        if (!player) {
            throw new Error("Player not found");
        }

        // 현재 통화 값 가져오기
        const currentValue = player[currency] || 0;
        const newValue = currentValue + amount;

        // 플레이어 통화 업데이트
        const updatedPlayer = await prisma.player.update({
            where: { id: playerId },
            data: {
                [currency]: newValue,
            },
        });

        // 경로 재검증
        revalidatePath("/");

        return updatedPlayer;
    } catch (error) {
        console.error("Error updating player currency:", error);
        throw error;
    }
}

/**
 * 플레이어 데이터를 초기화합니다.
 */
export async function resetPlayerData(playerId: string) {
    try {
        // 플레이어 확인
        const player = await prisma.player.findUnique({
            where: { id: playerId },
        });

        if (!player) {
            throw new Error("Player not found");
        }

        // 경로 재검증
        revalidatePath("/");

        return { success: true };
    } catch (error) {
        console.error("Error resetting player data:", error);
        throw error;
    }
}
