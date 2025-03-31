/// hooks/useQuest.tsx

import { useToast } from "./useToast";
import { useLoading } from "./useLoading";
import { QuestLog, RewardsLog } from "@prisma/client";

type QuestPayload = Pick<
    QuestLog,
    | "playerId"
    | "questId"
    | "completed"
    | "completedAt"
    | "rewards"
    | "rewardCurrency"
>;

type RewardPayload = Pick<
    RewardsLog,
    | "playerId"
    | "questId"
    | "questLogId"
    | "pollId"
    | "pollLogId"
    | "amount"
    | "reason"
    | "currency"
>;

export function useQuest() {
    const toast = useToast();
    const { startLoading, endLoading } = useLoading();

    const questComplete = async (payload: QuestPayload) => {
        startLoading();
        try {
            const res = await fetch("/api/quests/complete", {
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

    const addRewards = async (payload: RewardPayload) => {
        startLoading();
        try {
            const res = await fetch("/api/player/rewards", {
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

    return { questComplete, addRewards };
}
