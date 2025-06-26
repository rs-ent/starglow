import type { RaffleWithDetails } from "./actions";
import type { RafflePrize } from "@prisma/client";

// ==================== Types ====================

export type RaffleStatus = "UPCOMING" | "ACTIVE" | "WAITING_DRAW" | "COMPLETED";

// ==================== Status Calculation ====================

export function calculateRaffleStatus(
    startDate: Date,
    endDate: Date,
    drawDate?: Date | null
): RaffleStatus {
    const now = new Date();

    if (now < startDate) return "UPCOMING";
    if (now <= endDate) return "ACTIVE";
    if (drawDate && now < drawDate) return "WAITING_DRAW";
    return "COMPLETED";
}

// ==================== Helper Functions ====================

/**
 * 상품별 확률 계산
 */
export function calculatePrizeProbabilities(prizes: RafflePrize[]): Array<{
    prize: RafflePrize;
    probability: number;
    percentage: string;
}> {
    const totalSlots = prizes.reduce((sum, prize) => sum + prize.quantity, 0);

    return prizes.map((prize) => ({
        prize,
        probability: prize.quantity / totalSlots,
        percentage: ((prize.quantity / totalSlots) * 100).toFixed(2) + "%",
    }));
}

/**
 * 래플 상태별 필터링
 */
export function filterRafflesByStatus(
    raffles: RaffleWithDetails[],
    statuses: RaffleStatus[]
): RaffleWithDetails[] {
    return raffles.filter((raffle) => {
        const status = calculateRaffleStatus(
            raffle.startDate,
            raffle.endDate,
            raffle.drawDate
        );
        return statuses.includes(status);
    });
}
