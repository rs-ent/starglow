/// app/mutations/questsMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completeQuest, addRewards } from "@/app/actions/quests";
import type { RewardCurrency } from "@/app/types/player";
import { queryKeys } from "@/app/queryKeys";

type CompleteQuestRequest = {
    playerId: string;
    questId: string;
    rewards: number;
    rewardCurrency: RewardCurrency;
};

export function useCompleteQuest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            playerId,
            questId,
            rewards,
            rewardCurrency,
        }: CompleteQuestRequest) => {
            return completeQuest(playerId, questId, rewards, rewardCurrency);
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.quests.completed(variables.playerId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.player.currency(
                    variables.playerId,
                    variables.rewardCurrency
                ),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.player.byId(variables.playerId),
            });
        },
    });
}

type AddRewardsRequest = {
    playerId: string;
    amount: number;
    currency: RewardCurrency;
    reason?: string;
    questId?: string;
    pollId?: string;
};
export function useAddRewards() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            playerId,
            amount,
            currency,
            reason = "Additional Reward",
            questId,
            pollId,
        }: AddRewardsRequest) => {
            return addRewards(
                playerId,
                amount,
                currency,
                reason,
                questId,
                pollId
            );
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.player.currency(
                    variables.playerId,
                    variables.currency
                ),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.player.byId(variables.playerId),
            });
        },
    });
}
