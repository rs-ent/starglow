/// hooks/useQuest.tsx

import { useToast } from "./useToast";
import { useLoading } from "./useLoading";
import { MissionLog, GameMoneyLog } from "@prisma/client";

type MissionPayload = Pick<
    MissionLog,
    | "playerId"
    | "missionId"
    | "type"
    | "Quest_Title"
    | "Quest_Type"
    | "Quest_Date"
    | "Price"
    | "Currency"
    | "URL"
>;

type AddMoneyPayload = Pick<GameMoneyLog, "playerId" | "Price" | "Currency">;

export function useQuest() {
    const toast = useToast();
    const { startLoading, endLoading } = useLoading();

    const questComplete = async (payload: MissionPayload) => {
        startLoading();
        try {
            const res = await fetch("/api/missions/complete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.error || "Failed to complete quest");
            }

            toast.success("Quest completed successfully!");
            return result;
        } catch (error) {
            toast.error(
                "Mission completion failed: " + (error as Error).message
            );
            throw error;
        } finally {
            endLoading();
        }
    };

    const addGameMoney = async (payload: AddMoneyPayload) => {
        startLoading();
        try {
            const res = await fetch("/api/player/game-money", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.error || "Failed to add game money");
            }

            return result.player;
        } catch (error) {
            console.error(
                "Failed to add game money: " + (error as Error).message
            );
            throw error;
        } finally {
            endLoading();
        }
    };

    return { questComplete, addGameMoney };
}
