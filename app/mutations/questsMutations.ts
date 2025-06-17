/// app/mutations/questsMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { playerAssetsKeys, questKeys } from "../queryKeys";
import {
    createQuest,
    deleteQuest,
    updateQuest,
    completeQuest,
    claimQuestReward,
    updateQuestOrder,
    updateQuestActive,
} from "../actions/quests";
import { Quest } from "@prisma/client";

/**
 * 퀘스트 생성 뮤테이션 훅
 */
export function useCreateQuestMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createQuest,
        onMutate: async (variables) => {
            // 관련 쿼리 취소
            await queryClient.cancelQueries({ queryKey: questKeys.all });
            await queryClient.cancelQueries({ queryKey: questKeys.list() });

            // 이전 상태 저장
            const previousQuests = queryClient.getQueryData(questKeys.list());

            // 낙관적 업데이트 (선택적)
            // 새 퀘스트 생성은 낙관적 업데이트가 복잡할 수 있어 여기서는 생략

            return { previousQuests };
        },
        onSuccess: (data, variables, context) => {
            // 서버에서 반환된 데이터로 캐시 업데이트
            queryClient.invalidateQueries({ queryKey: questKeys.all });
            queryClient.invalidateQueries({ queryKey: questKeys.list() });

            if (data?.id) {
                queryClient.invalidateQueries({
                    queryKey: questKeys.detail({ id: data.id }),
                });
            }
        },
        onError: (error, variables, context) => {
            console.error("Error creating quest:", error);

            // 오류 발생 시 이전 상태로 롤백
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
            // 관련 쿼리 취소
            await queryClient.cancelQueries({ queryKey: questKeys.all });
            await queryClient.cancelQueries({ queryKey: questKeys.list() });
            await queryClient.cancelQueries({
                queryKey: questKeys.detail({ id: variables.id }),
            });

            // 이전 상태 저장
            const previousQuests = queryClient.getQueryData(questKeys.list());
            const previousQuest = queryClient.getQueryData(
                questKeys.detail({ id: variables.id })
            );

            // 낙관적 업데이트 (선택적)
            if (previousQuest) {
                queryClient.setQueryData(
                    questKeys.detail({ id: variables.id }),
                    (old: Quest | null) => {
                        if (!old) return null;
                        return { ...old, ...variables };
                    }
                );
            }

            return { previousQuests, previousQuest };
        },
        onSuccess: (data, variables, context) => {
            // 서버에서 반환된 데이터로 캐시 업데이트
            queryClient.invalidateQueries({ queryKey: questKeys.all });
            queryClient.invalidateQueries({ queryKey: questKeys.list() });
            queryClient.invalidateQueries({
                queryKey: questKeys.detail({ id: variables.id }),
            });
        },
        onError: (error, variables, context) => {
            console.error("Error updating quest:", error);

            // 오류 발생 시 이전 상태로 롤백
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
 * 퀘스트 순서 업데이트 뮤테이션 훅
 */
export function useUpdateQuestOrderMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateQuestOrder,
        onMutate: async (variables) => {
            // 관련 쿼리 취소
            await queryClient.cancelQueries({ queryKey: questKeys.all });
            await queryClient.cancelQueries({ queryKey: questKeys.list() });

            // 이전 상태 저장
            const previousQuests = queryClient.getQueryData(questKeys.list());

            // 낙관적 업데이트 (선택적)
            // 순서 변경은 복잡할 수 있어 여기서는 생략

            return { previousQuests };
        },
        onSuccess: (data, variables, context) => {
            // 서버에서 반환된 데이터로 캐시 업데이트
            queryClient.invalidateQueries({ queryKey: questKeys.all });
            queryClient.invalidateQueries({ queryKey: questKeys.list() });
        },
        onError: (error, variables, context) => {
            console.error("Error updating quest order:", error);

            // 오류 발생 시 이전 상태로 롤백
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
            // 관련 쿼리 취소
            await queryClient.cancelQueries({ queryKey: questKeys.all });
            await queryClient.cancelQueries({ queryKey: questKeys.list() });
            await queryClient.cancelQueries({
                queryKey: questKeys.detail({ id: variables.id }),
            });

            // 이전 상태 저장
            const previousQuests = queryClient.getQueryData(questKeys.list());
            const previousQuest = queryClient.getQueryData(
                questKeys.detail({ id: variables.id })
            );

            // 낙관적 업데이트 - 목록에서 삭제된 퀘스트 제거
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

            // 상세 정보 캐시에서 제거
            queryClient.removeQueries({
                queryKey: questKeys.detail({ id: variables.id }),
            });

            return { previousQuests, previousQuest };
        },
        onSuccess: (data, variables, context) => {
            // 서버에서 반환된 데이터로 캐시 업데이트
            queryClient.invalidateQueries({ queryKey: questKeys.all });
            queryClient.invalidateQueries({ queryKey: questKeys.list() });
            queryClient.removeQueries({
                queryKey: questKeys.detail({ id: variables.id }),
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

            // 관련 쿼리 취소
            await queryClient.cancelQueries({
                queryKey: questKeys.complete({
                    quest: variables.quest.id as any,
                    player: variables.player.id as any,
                }),
            });

            // 이전 상태 저장
            const previousData = queryClient.getQueryData(
                questKeys.complete({
                    quest: variables.quest.id as any,
                    player: variables.player.id as any,
                })
            );

            // 낙관적 업데이트 (선택적)
            // 복잡한 상태 변경이므로 여기서는 생략

            return { previousData };
        },
        onSuccess: (data, variables) => {
            if (!variables?.quest?.id || !variables?.player?.id) return;

            // 관련 쿼리 무효화
            queryClient.invalidateQueries({ queryKey: questKeys.all });
            queryClient.invalidateQueries({ queryKey: questKeys.list() });
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
            queryClient.invalidateQueries({
                queryKey: playerAssetsKeys.balances(
                    variables?.questLog?.playerId as any
                ),
            });
        },
    });
}

export function useUpdateQuestActiveMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateQuestActive,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: questKeys.all });
            queryClient.invalidateQueries({
                queryKey: questKeys.list(),
            });
        },
    });
}
