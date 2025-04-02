/// hooks/useQuest.tsx

import { useToast } from "./useToast";
import { useLoading } from "./useLoading";
import { QuestLog, RewardsLog, StoredImage } from "@prisma/client";
import { usePlayerStore } from "@/stores/playerStore";

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
    const incrementCurrency = usePlayerStore(
        (state) => state.incrementCurrency
    );

    const questComplete = async (payload: QuestPayload) => {
        startLoading();
        console.log("Payload:", payload);
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

            // zustand store update
            if (result.result.rewardsLog) {
                const { amount, currency } = result.result.rewardsLog;
                incrementCurrency(currency, amount);
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

    const getBannerImages = async (): Promise<StoredImage[]> => {
        try {
            const response = await fetch(
                "/api/admin/quests/missions/banner-images"
            );
            if (!response.ok) {
                throw new Error("Failed to fetch banner images");
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching banner images:", error);
            throw error;
        }
    };

    return { questComplete, addRewards, getBannerImages };
}
