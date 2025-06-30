/// app/actions/notification/mutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { notificationKeys, playerAssetsKeys } from "@/app/queryKeys";

import {
    createNotification,
    markNotificationAsRead,
    markNotificationsAsRead,
    deleteNotification,
    updateNotification,
    createBulkNotifications,
    createBettingSuccessNotification,
    createBettingWinNotification,
    createPollEndingSoonNotification,
    createBettingFailedNotification,
    createPollResultNotification,
    createBettingRefundNotification,
    createSettlementCompleteNotification,
} from "./actions";

/**
 * 알림 생성 뮤테이션 훅
 */
export function useCreateNotificationMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createNotification,
        onSuccess: (data, variables) => {
            if (data.success) {
                // 플레이어의 알림 목록 갱신
                queryClient
                    .invalidateQueries({
                        queryKey: notificationKeys.byPlayer(variables.playerId),
                    })
                    .catch((error) => {
                        console.error(error);
                    });

                // 읽지 않은 알림 개수 갱신
                queryClient
                    .invalidateQueries({
                        queryKey: notificationKeys.unreadCount(
                            variables.playerId,
                            variables.category
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });

                // 전체 알림 목록 갱신
                queryClient
                    .invalidateQueries({
                        queryKey: notificationKeys.lists(),
                    })
                    .catch((error) => {
                        console.error(error);
                    });

                // 엔티티별 알림 갱신 (해당되는 경우)
                if (variables.entityType && variables.entityId) {
                    queryClient
                        .invalidateQueries({
                            queryKey: notificationKeys.byEntity(
                                variables.entityType,
                                variables.entityId
                            ),
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                }
            }
        },
        onError: (error) => {
            console.error("Error creating notification:", error);
        },
    });
}

/**
 * 알림 읽음 처리 뮤테이션 훅
 */
export function useMarkNotificationAsReadMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            notificationId,
            playerId,
        }: {
            notificationId: string;
            playerId?: string;
        }) => markNotificationAsRead(notificationId, playerId),
        onSuccess: (_data, variables) => {
            if (variables.playerId) {
                // 플레이어의 알림 목록 갱신
                queryClient
                    .invalidateQueries({
                        queryKey: notificationKeys.byPlayer(variables.playerId),
                    })
                    .catch((error) => {
                        console.error(error);
                    });

                // 읽지 않은 알림 개수 갱신
                queryClient
                    .invalidateQueries({
                        queryKey: notificationKeys.unreadCount(
                            variables.playerId
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }

            // 전체 알림 목록 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.lists(),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 특정 알림 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.detail(variables.notificationId),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        onError: (error) => {
            console.error("Error marking notification as read:", error);
        },
    });
}

/**
 * 여러 알림 읽음 처리 뮤테이션 훅
 */
export function useMarkNotificationsAsReadMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            notificationIds,
            playerId,
        }: {
            notificationIds: string[];
            playerId: string;
        }) => markNotificationsAsRead(notificationIds, playerId),
        onSuccess: (_data, variables) => {
            // 플레이어의 알림 목록 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.byPlayer(variables.playerId),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 읽지 않은 알림 개수 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.unreadCount(variables.playerId),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 전체 알림 목록 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.lists(),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        onError: (error) => {
            console.error("Error marking notifications as read:", error);
        },
    });
}

/**
 * 알림 삭제 뮤테이션 훅
 */
export function useDeleteNotificationMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            notificationId,
            playerId,
        }: {
            notificationId: string;
            playerId?: string;
        }) => deleteNotification(notificationId, playerId),
        onSuccess: (_data, variables) => {
            if (variables.playerId) {
                // 플레이어의 알림 목록 갱신
                queryClient
                    .invalidateQueries({
                        queryKey: notificationKeys.byPlayer(variables.playerId),
                    })
                    .catch((error) => {
                        console.error(error);
                    });

                // 읽지 않은 알림 개수 갱신
                queryClient
                    .invalidateQueries({
                        queryKey: notificationKeys.unreadCount(
                            variables.playerId
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }

            // 전체 알림 목록 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.lists(),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 특정 알림 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.detail(variables.notificationId),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        onError: (error) => {
            console.error("Error deleting notification:", error);
        },
    });
}

/**
 * 알림 수정 뮤테이션 훅
 */
export function useUpdateNotificationMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            notificationId,
            input,
        }: {
            notificationId: string;
            input: any;
        }) => updateNotification(notificationId, input),
        onSuccess: (_data, variables) => {
            const { input } = variables;

            if (input.playerId) {
                // 플레이어의 알림 목록 갱신
                queryClient
                    .invalidateQueries({
                        queryKey: notificationKeys.byPlayer(input.playerId),
                    })
                    .catch((error) => {
                        console.error(error);
                    });

                // 읽지 않은 알림 개수 갱신
                queryClient
                    .invalidateQueries({
                        queryKey: notificationKeys.unreadCount(
                            input.playerId,
                            input.category
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }

            // 전체 알림 목록 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.lists(),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 특정 알림 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.detail(variables.notificationId),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 엔티티별 알림 갱신 (해당되는 경우)
            if (input.entityType && input.entityId) {
                queryClient
                    .invalidateQueries({
                        queryKey: notificationKeys.byEntity(
                            input.entityType,
                            input.entityId
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        },
        onError: (error) => {
            console.error("Error updating notification:", error);
        },
    });
}

/**
 * 대량 알림 생성 뮤테이션 훅
 */
export function useCreateBulkNotificationsMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            playerIds,
            notificationData,
        }: {
            playerIds: string[];
            notificationData: any;
        }) => createBulkNotifications(playerIds, notificationData),
        onSuccess: (_data, variables) => {
            // 모든 대상 플레이어의 알림 목록 갱신
            variables.playerIds.forEach((playerId) => {
                queryClient
                    .invalidateQueries({
                        queryKey: notificationKeys.byPlayer(playerId),
                    })
                    .catch((error) => {
                        console.error(error);
                    });

                queryClient
                    .invalidateQueries({
                        queryKey: notificationKeys.unreadCount(
                            playerId,
                            variables.notificationData.category
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            });

            // 전체 알림 목록 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.lists(),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        onError: (error) => {
            console.error("Error creating bulk notifications:", error);
        },
    });
}

/**
 * 베팅 성공 알림 생성 뮤테이션 훅
 */
export function useCreateBettingSuccessNotificationMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            playerId,
            pollId,
            pollTitle,
            betAmount,
            optionName,
        }: {
            playerId: string;
            pollId: string;
            pollTitle: string;
            betAmount: number;
            optionName: string;
        }) =>
            createBettingSuccessNotification(
                playerId,
                pollId,
                pollTitle,
                betAmount,
                optionName
            ),
        onSuccess: (_data, variables) => {
            // 플레이어의 알림 목록 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.byPlayer(variables.playerId),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 읽지 않은 알림 개수 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.unreadCount(
                        variables.playerId,
                        "BETTING"
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 폴별 알림 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.byEntity(
                        "poll",
                        variables.pollId
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        onError: (error) => {
            console.error(
                "Error creating betting success notification:",
                error
            );
        },
    });
}

/**
 * 베팅 당첨 알림 생성 뮤테이션 훅
 */
export function useCreateBettingWinNotificationMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            playerId,
            pollId,
            pollTitle,
            betAmount,
            winAmount,
        }: {
            playerId: string;
            pollId: string;
            pollTitle: string;
            betAmount: number;
            winAmount: number;
        }) =>
            createBettingWinNotification(
                playerId,
                pollId,
                pollTitle,
                betAmount,
                winAmount
            ),
        onSuccess: (_data, variables) => {
            // 플레이어의 알림 목록 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.byPlayer(variables.playerId),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 읽지 않은 알림 개수 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.unreadCount(
                        variables.playerId,
                        "BETTING"
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 폴별 알림 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.byEntity(
                        "poll",
                        variables.pollId
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 플레이어 자산도 갱신 (당첨금 지급)
            queryClient
                .invalidateQueries({
                    queryKey: playerAssetsKeys.balances(variables.playerId),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        onError: (error) => {
            console.error("Error creating betting win notification:", error);
        },
    });
}

/**
 * 폴 종료 예고 알림 생성 뮤테이션 훅
 */
export function useCreatePollEndingSoonNotificationMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            playerId,
            pollId,
            pollTitle,
            endDate,
        }: {
            playerId: string;
            pollId: string;
            pollTitle: string;
            endDate: Date;
        }) =>
            createPollEndingSoonNotification(
                playerId,
                pollId,
                pollTitle,
                endDate
            ),
        onSuccess: (_data, variables) => {
            // 플레이어의 알림 목록 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.byPlayer(variables.playerId),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 읽지 않은 알림 개수 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.unreadCount(
                        variables.playerId,
                        "POLLS"
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 폴별 알림 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.byEntity(
                        "poll",
                        variables.pollId
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        onError: (error) => {
            console.error(
                "Error creating poll ending soon notification:",
                error
            );
        },
    });
}

/**
 * 베팅 실패 알림 생성 뮤테이션 훅
 */
export function useCreateBettingFailedNotificationMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            playerId,
            pollId,
            pollTitle,
            betAmount,
            optionName,
        }: {
            playerId: string;
            pollId: string;
            pollTitle: string;
            betAmount: number;
            optionName: string;
        }) =>
            createBettingFailedNotification(
                playerId,
                pollId,
                pollTitle,
                betAmount,
                optionName
            ),
        onSuccess: (_data, variables) => {
            // 플레이어의 알림 목록 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.byPlayer(variables.playerId),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 읽지 않은 알림 개수 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.unreadCount(
                        variables.playerId,
                        "BETTING"
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 폴별 알림 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.byEntity(
                        "poll",
                        variables.pollId
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        onError: (error) => {
            console.error("Error creating betting failed notification:", error);
        },
    });
}

/**
 * 폴 결과 발표 알림 생성 뮤테이션 훅
 */
export function useCreatePollResultNotificationMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            playerId,
            pollId,
            pollTitle,
            winningOption,
            userParticipated,
        }: {
            playerId: string;
            pollId: string;
            pollTitle: string;
            winningOption: string;
            userParticipated: boolean;
        }) =>
            createPollResultNotification(
                playerId,
                pollId,
                pollTitle,
                winningOption,
                userParticipated
            ),
        onSuccess: (_data, variables) => {
            // 플레이어의 알림 목록 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.byPlayer(variables.playerId),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 읽지 않은 알림 개수 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.unreadCount(
                        variables.playerId,
                        "POLLS"
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 폴별 알림 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.byEntity(
                        "poll",
                        variables.pollId
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        onError: (error) => {
            console.error("Error creating poll result notification:", error);
        },
    });
}

/**
 * 베팅 환불 알림 생성 뮤테이션 훅
 */
export function useCreateBettingRefundNotificationMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            playerId,
            pollId,
            pollTitle,
            refundAmount,
            reason,
        }: {
            playerId: string;
            pollId: string;
            pollTitle: string;
            refundAmount: number;
            reason: string;
        }) =>
            createBettingRefundNotification(
                playerId,
                pollId,
                pollTitle,
                refundAmount,
                reason
            ),
        onSuccess: (_data, variables) => {
            // 플레이어의 알림 목록 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.byPlayer(variables.playerId),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 읽지 않은 알림 개수 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.unreadCount(
                        variables.playerId,
                        "BETTING"
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 폴별 알림 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.byEntity(
                        "poll",
                        variables.pollId
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 플레이어 자산도 갱신 (환불 지급)
            queryClient
                .invalidateQueries({
                    queryKey: playerAssetsKeys.balances(variables.playerId),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        onError: (error) => {
            console.error("Error creating betting refund notification:", error);
        },
    });
}

/**
 * 정산 완료 알림 생성 뮤테이션 훅
 */
export function useCreateSettlementCompleteNotificationMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            playerId,
            pollId,
            pollTitle,
            totalWinners,
            totalPayout,
        }: {
            playerId: string;
            pollId: string;
            pollTitle: string;
            totalWinners: number;
            totalPayout: number;
        }) =>
            createSettlementCompleteNotification(
                playerId,
                pollId,
                pollTitle,
                totalWinners,
                totalPayout
            ),
        onSuccess: (_data, variables) => {
            // 플레이어의 알림 목록 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.byPlayer(variables.playerId),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 읽지 않은 알림 개수 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.unreadCount(
                        variables.playerId,
                        "BETTING"
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });

            // 폴별 알림 갱신
            queryClient
                .invalidateQueries({
                    queryKey: notificationKeys.byEntity(
                        "poll",
                        variables.pollId
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        onError: (error) => {
            console.error(
                "Error creating settlement complete notification:",
                error
            );
        },
    });
}
