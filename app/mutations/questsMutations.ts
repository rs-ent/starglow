/// app/mutations/questsMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    createQuest,
    deleteQuest,
    updateQuest,
    completeQuest,
    claimQuestReward,
    updateQuestOrder,
    updateQuestActive,
} from "../actions/quests";
import { playerAssetsKeys, questKeys } from "../queryKeys";

import type { Quest } from "@prisma/client";

/**
 * 퀘스트 생성 뮤테이션 훅
 */
export function useCreateQuestMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createQuest,
        onMutate: async (_variables) => {
            await queryClient.cancelQueries({ queryKey: questKeys.all });
            await queryClient.cancelQueries({ queryKey: questKeys.list() });

            const previousQuests = queryClient.getQueryData(questKeys.list());

            return { previousQuests };
        },
        onSuccess: (data, _variables, _context) => {
            queryClient
                .invalidateQueries({ queryKey: questKeys.all })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({ queryKey: questKeys.list() })
                .catch((error) => {
                    console.error(error);
                });

            if (data?.id) {
                queryClient
                    .invalidateQueries({
                        queryKey: questKeys.detail({ id: data.id }),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        },
        onError: (error, _variables, context) => {
            console.error("Error creating quest:", error);

            if (context?.previousQuests) {
                queryClient.setQueryData(
                    questKeys.list(),
                    context.previousQuests
                );
            }
        },
    });
}

/**
 * 퀘스트 업데이트 뮤테이션 훅
 */
export function useUpdateQuestMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateQuest,
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: questKeys.all });
            await queryClient.cancelQueries({ queryKey: questKeys.list() });
            await queryClient.cancelQueries({
                queryKey: questKeys.detail({ id: variables.id }),
            });

            const previousQuests = queryClient.getQueryData(questKeys.list());
            const previousQuest = queryClient.getQueryData(
                questKeys.detail({ id: variables.id })
            );

            if (previousQuest) {
                await queryClient.setQueryData(
                    questKeys.detail({ id: variables.id }),
                    (old: Quest | null) => {
                        if (!old) return null;
                        return { ...old, ...variables };
                    }
                );
            }

            return { previousQuests, previousQuest };
        },
        onSuccess: (_data, variables, _context) => {
            queryClient
                .invalidateQueries({ queryKey: questKeys.all })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({ queryKey: questKeys.list() })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: questKeys.detail({ id: variables.id }),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        onError: (error, variables, context) => {
            console.error("Error updating quest:", error);

            if (context?.previousQuest) {
                queryClient.setQueryData(
                    questKeys.detail({ id: variables.id }),
                    context.previousQuest
                );
            }
        },
    });
}

export function useUpdateQuestOrderMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateQuestOrder,
        onMutate: async (_variables) => {
            await queryClient.cancelQueries({ queryKey: questKeys.all });
            await queryClient.cancelQueries({ queryKey: questKeys.list() });

            const previousQuests = queryClient.getQueryData(questKeys.list());

            return { previousQuests };
        },
        onSuccess: (_data, _variables, _context) => {
            queryClient
                .invalidateQueries({ queryKey: questKeys.all })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({ queryKey: questKeys.list() })
                .catch((error) => {
                    console.error(error);
                });
        },
        onError: (error, _variables, context) => {
            console.error("Error updating quest order:", error);

            if (context?.previousQuests) {
                queryClient.setQueryData(
                    questKeys.list(),
                    context.previousQuests
                );
            }
        },
    });
}

/**
 * 퀘스트 삭제 뮤테이션 훅
 */
export function useDeleteQuestMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteQuest,
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: questKeys.all });
            await queryClient.cancelQueries({ queryKey: questKeys.list() });
            await queryClient.cancelQueries({
                queryKey: questKeys.detail({ id: variables.id }),
            });

            const previousQuests = queryClient.getQueryData(questKeys.list());
            const previousQuest = queryClient.getQueryData(
                questKeys.detail({ id: variables.id })
            );

            if (previousQuests) {
                queryClient.setQueryData(questKeys.list(), (old: any) => {
                    if (!old || !old.items) return old;
                    return {
                        ...old,
                        items: old.items.filter(
                            (quest: Quest) => quest.id !== variables.id
                        ),
                    };
                });
            }

            queryClient.removeQueries({
                queryKey: questKeys.detail({ id: variables.id }),
            });

            return { previousQuests, previousQuest };
        },
        onSuccess: (_data, _variables, _context) => {
            queryClient
                .invalidateQueries({ queryKey: questKeys.all })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({ queryKey: questKeys.list() })
                .catch((error) => {
                    console.error(error);
                });
        },
        onError: (error, variables, context) => {
            console.error("Error deleting quest:", error);

            // 오류 발생 시 이전 상태로 롤백
            if (context?.previousQuests) {
                queryClient.setQueryData(
                    questKeys.list(),
                    context.previousQuests
                );
            }

            if (context?.previousQuest) {
                queryClient.setQueryData(
                    questKeys.detail({ id: variables.id }),
                    context.previousQuest
                );
            }
        },
    });
}

/**
 * 퀘스트 완료 뮤테이션 훅
 */
export function useCompleteQuestMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: completeQuest,
        onMutate: async (variables) => {
            if (!variables?.quest?.id || !variables?.player?.id) {
                return { previousData: null };
            }

            await queryClient.cancelQueries({
                queryKey: questKeys.complete({
                    quest: variables.quest.id as any,
                    player: variables.player.id as any,
                }),
            });

            const previousData = await queryClient.getQueryData(
                questKeys.complete({
                    quest: variables.quest.id as any,
                    player: variables.player.id as any,
                })
            );

            return { previousData };
        },
        onSuccess: (_data, variables, _context) => {
            if (!variables?.quest?.id || !variables?.player?.id) return;

            queryClient
                .invalidateQueries({ queryKey: questKeys.all })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({ queryKey: questKeys.list() })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: questKeys.detail({
                        id: variables?.quest?.id,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: questKeys.complete({
                        quest: variables?.quest?.id as any,
                        player: variables?.player?.id as any,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        onError: (error, variables, context) => {
            console.error("Error completing quest:", error);

            // 오류 발생 시 이전 상태로 롤백
            if (context?.previousData) {
                queryClient.setQueryData(
                    questKeys.complete({
                        quest: variables?.quest?.id as any,
                        player: variables?.player?.id as any,
                    }),
                    context.previousData
                );
            }
        },
    });
}

export function useClaimQuestRewardMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: claimQuestReward,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({ queryKey: questKeys.all })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: questKeys.list(),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: questKeys.detail({
                        id: variables?.questLog?.questId,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: questKeys.complete({
                        quest: variables?.questLog?.questId as any,
                        player: variables?.questLog?.playerId as any,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: playerAssetsKeys.balances(
                        variables?.questLog?.playerId as any
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useUpdateQuestActiveMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateQuestActive,
        onSuccess: (_data, _variables) => {
            queryClient
                .invalidateQueries({ queryKey: questKeys.all })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: questKeys.list(),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}
