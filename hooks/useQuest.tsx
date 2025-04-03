/// hooks/useQuest.tsx

import { useToast } from "./useToast";
import { useLoading } from "./useLoading";
import { QuestLog, RewardsLog } from "@prisma/client";
import {
    completeQuest as completeQuestAction,
    addRewards as addRewardsAction,
} from "@/app/actions/quests";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import { usePlayer } from "./usePlayer";

// Define input types for the actions
type CompleteQuestInput = {
    playerId: string;
    questId: string;
    rewards: number;
    rewardCurrency: "points" | "SGP" | "SGT";
};

type AddRewardsInput = {
    playerId: string;
    questId: string;
    questLogId: string;
    amount: number;
    currency: "points" | "SGP" | "SGT";
    reason?: string;
    pollId?: string;
    pollLogId?: string;
};

// Define return types for the actions
type CompleteQuestResult = {
    questLog: QuestLog;
    rewardsLog: RewardsLog | null;
};

type AddRewardsResult = {
    player: {
        name: string | null;
        id: string;
        createdAt: Date;
        userId: string;
        points: number;
        SGP: number;
        SGT: number;
        telegramId: string | null;
        recommendedCount: number;
        recommenderId: string | null;
        recommenderName: string | null;
        recommenderMethod: string | null;
        lastConnectedAt: Date;
    };
    rewardsLog: RewardsLog;
};

// Define context type for mutations
type MutationContext = {
    previousQuests: any;
};

export function useQuest(playerId?: string) {
    const toast = useToast();
    const { startLoading, endLoading } = useLoading();
    const queryClient = useQueryClient();
    const { updateCurrency } = usePlayer(playerId || "");

    const completeQuestMutation = useMutation<
        CompleteQuestResult,
        Error,
        CompleteQuestInput,
        MutationContext
    >({
        mutationFn: (input) =>
            completeQuestAction(
                input.playerId,
                input.questId,
                input.rewards,
                input.rewardCurrency
            ),
        onMutate: async (newQuest) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.quests.all });
            const previousQuests = queryClient.getQueryData(
                queryKeys.quests.all
            );

            queryClient.setQueryData(queryKeys.quests.all, (old: any) => {
                const quests = Array.isArray(old) ? old : [];
                return [
                    ...quests,
                    {
                        ...newQuest,
                        id: "temp-id",
                        completed: true,
                        createdAt: new Date(),
                        completedAt: new Date(),
                    },
                ];
            });
            return { previousQuests };
        },
        onError: (err, newQuest, context) => {
            if (context?.previousQuests) {
                queryClient.setQueryData(
                    queryKeys.quests.all,
                    context.previousQuests
                );
            }
            toast.error("Mission completion failed: " + err.message);
        },
        onSuccess: async (result) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.quests.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.player.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.currency });

            if (result.rewardsLog) {
                const { amount, currency } = result.rewardsLog;
                await updateCurrency(currency, amount);
            }

            toast.success("Quest completed successfully!");
        },
    });

    const questComplete = async (input: CompleteQuestInput) => {
        startLoading();
        try {
            const result = await completeQuestMutation.mutateAsync(input);
            return result;
        } catch (error) {
            throw error;
        } finally {
            endLoading();
        }
    };

    return { questComplete };
}
