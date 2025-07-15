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
            await queryClient.cancelQueries({ queryKey: questKeys.list() });
            await queryClient.cancelQueries({ queryKey: questKeys.infinite() });

            const previousQuests = queryClient.getQueryData(questKeys.list());

            return { previousQuests };
        },
        onSuccess: (data, variables, _context) => {
            queryClient
                .invalidateQueries({ queryKey: questKeys.list() })
                .catch((error) => {
                    console.error(error);
                });

            queryClient
                .invalidateQueries({ queryKey: questKeys.infinite() })
                .catch((error) => {
                    console.error(error);
                });

            if (variables.artistId) {
                queryClient
                    .invalidateQueries({
                        queryKey: questKeys.artistAllActiveQuestCount(
                            variables.artistId
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }

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
                .invalidateQueries({
                    queryKey: questKeys.detail({ id: variables.id }),
                })
                .catch((error) => {
                    console.error(error);
                });

            const shouldInvalidateList =
                variables.title !== undefined ||
                variables.isActive !== undefined ||
                variables.order !== undefined ||
                variables.startDate !== undefined ||
                variables.endDate !== undefined ||
                variables.permanent !== undefined ||
                variables.artistId !== undefined ||
                variables.type !== undefined;

            if (shouldInvalidateList) {
                queryClient
                    .invalidateQueries({ queryKey: questKeys.list() })
                    .catch((error) => {
                        console.error(error);
                    });

                queryClient
                    .invalidateQueries({ queryKey: questKeys.infinite() })
                    .catch((error) => {
                        console.error(error);
                    });
            }

            if (variables.isActive !== undefined && variables.artistId) {
                queryClient
                    .invalidateQueries({
                        queryKey: questKeys.artistAllActiveQuestCount(
                            variables.artistId
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
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
            await queryClient.cancelQueries({ queryKey: questKeys.list() });
            await queryClient.cancelQueries({ queryKey: questKeys.infinite() });

            const previousQuests = queryClient.getQueryData(questKeys.list());

            return { previousQuests };
        },
        onSuccess: (_data, _variables, _context) => {
            queryClient
                .invalidateQueries({ queryKey: questKeys.list() })
                .catch((error) => {
                    console.error(error);
                });

            queryClient
                .invalidateQueries({ queryKey: questKeys.infinite() })
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
            await queryClient.cancelQueries({ queryKey: questKeys.list() });
            await queryClient.cancelQueries({ queryKey: questKeys.infinite() });
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
        onSuccess: (_data, variables, _context) => {
            queryClient
                .invalidateQueries({ queryKey: questKeys.list() })
                .catch((error) => {
                    console.error(error);
                });

            queryClient
                .invalidateQueries({ queryKey: questKeys.infinite() })
                .catch((error) => {
                    console.error(error);
                });

            const previousQuest = _context?.previousQuest as Quest | null;
            if (previousQuest?.artistId) {
                queryClient
                    .invalidateQueries({
                        queryKey: questKeys.artistAllActiveQuestCount(
                            previousQuest.artistId
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        },
        onError: (error, variables, context) => {
            console.error("Error deleting quest:", error);

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

            // 🎯 최적화: 특정 퀘스트와 플레이어에 대해서만 무효화

            // 1. 특정 퀘스트 상세 정보만 무효화
            queryClient
                .invalidateQueries({
                    queryKey: questKeys.detail({
                        id: variables?.quest?.id,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 2. 특정 퀘스트 완료 상태만 무효화
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

            // 3. 특정 플레이어의 특정 퀘스트 로그만 무효화 (Quest Button용)
            queryClient
                .invalidateQueries({
                    queryKey: questKeys.playerQuestLog({
                        questId: variables?.quest?.id,
                        playerId: variables?.player?.id,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 4. 특정 플레이어의 로그들만 무효화 (대시보드용)
            queryClient
                .invalidateQueries({
                    queryKey: questKeys.playerLogs({
                        playerId: variables?.player?.id,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });

            queryClient
                .invalidateQueries({
                    queryKey: questKeys.activeLogs({
                        playerId: variables?.player?.id,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });

            queryClient
                .invalidateQueries({
                    queryKey: questKeys.completedLogs({
                        playerId: variables?.player?.id,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 5. 필요한 경우에만 리스트 무효화 (반복 퀘스트인 경우)
            if (
                variables?.quest?.repeatable ||
                variables?.quest?.multiClaimable
            ) {
                queryClient
                    .invalidateQueries({
                        queryKey: questKeys.list(),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }

            // 6. 필요한 경우에만 무한 스크롤 무효화 (퀘스트 순서가 변경될 수 있는 경우)
            if (
                variables?.quest?.repeatable ||
                variables?.quest?.multiClaimable
            ) {
                queryClient
                    .invalidateQueries({
                        queryKey: questKeys.infinite(),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }

            // 7. 완료 - 모든 필요한 쿼리 무효화 완료
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
            if (!variables?.questLog?.questId || !variables?.questLog?.playerId)
                return;

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
                    queryKey: questKeys.playerQuestLog({
                        questId: variables?.questLog?.questId,
                        playerId: variables?.questLog?.playerId,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });

            queryClient
                .invalidateQueries({
                    queryKey: questKeys.claimableLogs({
                        playerId: variables?.questLog?.playerId,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });

            queryClient
                .invalidateQueries({
                    queryKey: questKeys.claimedLogs({
                        playerId: variables?.questLog?.playerId,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });

            queryClient
                .invalidateQueries({
                    queryKey: questKeys.playerLogs({
                        playerId: variables?.questLog?.playerId,
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
                .invalidateQueries({
                    queryKey: questKeys.list(),
                })
                .catch((error) => {
                    console.error(error);
                });

            queryClient
                .invalidateQueries({
                    queryKey: questKeys.infinite(),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}
