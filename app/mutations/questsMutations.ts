/// app/mutations/questsMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { questKeys } from "../queryKeys";
import {
    createQuest,
    deleteQuest,
    updateQuest,
    tokenGating,
    completeQuest,
    claimQuestReward,
} from "../actions/quests";

export function useCreateQuestMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createQuest,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: questKeys.all });
            queryClient.invalidateQueries({
                queryKey: questKeys.list(),
            });
            queryClient.invalidateQueries({
                queryKey: questKeys.detail({ id: data?.id }),
            });
        },
        onError: (error) => {
            console.error("Error creating quest:", error);
        },
    });
}

export function useUpdateQuestMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateQuest,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: questKeys.all });
            queryClient.invalidateQueries({
                queryKey: questKeys.list(),
            });
            queryClient.invalidateQueries({
                queryKey: questKeys.detail({ id: variables.id }),
            });
        },
        onError: (error) => {
            console.error("Error updating quest:", error);
        },
    });
}

export function useDeleteQuestMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteQuest,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: questKeys.all });
            queryClient.invalidateQueries({
                queryKey: questKeys.list(),
            });
            queryClient.invalidateQueries({
                queryKey: questKeys.detail({ id: variables.id }),
            });
        },
        onError: (error) => {
            console.error("Error deleting quest:", error);
        },
    });
}

export function useTokenGatingMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: tokenGating,
        onSuccess: (data, variables) => {
            if (variables?.quest?.id && variables?.user?.id) {
                queryClient.invalidateQueries({
                    queryKey: questKeys.tokenGating({
                        quest: { id: variables.quest.id } as any,
                        user: { id: variables.user.id } as any,
                    }),
                });
            }
        },
    });
}

export function useCompleteQuestMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: completeQuest,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: questKeys.all });
            queryClient.invalidateQueries({
                queryKey: questKeys.list(),
            });
            queryClient.invalidateQueries({
                queryKey: questKeys.detail({
                    id: variables?.quest?.id,
                }),
            });
            queryClient.invalidateQueries({
                queryKey: questKeys.complete({
                    quest: variables?.quest?.id as any,
                    player: variables?.player?.id as any,
                }),
            });
        },
    });
}

export function useClaimQuestRewardMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: claimQuestReward,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: questKeys.all });
            queryClient.invalidateQueries({
                queryKey: questKeys.list(),
            });
            queryClient.invalidateQueries({
                queryKey: questKeys.detail({
                    id: variables?.questLog?.questId,
                }),
            });
            queryClient.invalidateQueries({
                queryKey: questKeys.complete({
                    quest: variables?.questLog?.questId as any,
                    player: variables?.questLog?.playerId as any,
                }),
            });
        },
    });
}
