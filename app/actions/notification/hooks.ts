/// app/actions/notification/hooks.ts

"use client";

import type { NotificationCategory } from "@prisma/client";

import {
    useCreateNotificationMutation,
    useMarkNotificationAsReadMutation,
    useMarkNotificationsAsReadMutation,
    useDeleteNotificationMutation,
    useUpdateNotificationMutation,
    useCreateBulkNotificationsMutation,
    useCreateBettingSuccessNotificationMutation,
    useCreateBettingWinNotificationMutation,
    useCreatePollEndingSoonNotificationMutation,
    useCreateBettingFailedNotificationMutation,
    useCreatePollResultNotificationMutation,
    useCreateBettingRefundNotificationMutation,
    useCreateSettlementCompleteNotificationMutation,
} from "./mutations";

import {
    useGetNotificationsQuery,
    useGetUnreadNotificationCountQuery,
    useGetNotificationsByEntityQuery,
} from "./queries";

import type { GetNotificationsInput } from "./actions";

export interface useNotificationsInput {
    // Notification queries
    getNotificationsInput?: GetNotificationsInput;
    getUnreadCountPlayerId?: string;
    getUnreadCountCategory?: NotificationCategory;
    getNotificationsByEntityPlayerId?: string;
    getNotificationsByEntityType?: string;
    getNotificationsByEntityId?: string;
}

export function useNotifications(input?: useNotificationsInput) {
    // Notification Queries
    const {
        data: notificationsData,
        isLoading: isNotificationsLoading,
        isError: isNotificationsError,
        error: notificationsError,
        refetch: refetchNotifications,
    } = useGetNotificationsQuery(input?.getNotificationsInput);

    const {
        data: unreadCountData,
        isLoading: isUnreadCountLoading,
        isError: isUnreadCountError,
        error: unreadCountError,
        refetch: refetchUnreadCount,
    } = useGetUnreadNotificationCountQuery(
        input?.getUnreadCountPlayerId || "",
        input?.getUnreadCountCategory
    );

    const {
        data: notificationsByEntityData,
        isLoading: isNotificationsByEntityLoading,
        isError: isNotificationsByEntityError,
        error: notificationsByEntityError,
        refetch: refetchNotificationsByEntity,
    } = useGetNotificationsByEntityQuery(
        input?.getNotificationsByEntityPlayerId || "",
        input?.getNotificationsByEntityType || "",
        input?.getNotificationsByEntityId || ""
    );

    // Notification Mutations
    const {
        mutate: createNotification,
        mutateAsync: createNotificationAsync,
        isPending: isCreateNotificationPending,
        isError: isCreateNotificationError,
        error: createNotificationError,
    } = useCreateNotificationMutation();

    const {
        mutate: markNotificationAsRead,
        mutateAsync: markNotificationAsReadAsync,
        isPending: isMarkNotificationAsReadPending,
        isError: isMarkNotificationAsReadError,
        error: markNotificationAsReadError,
    } = useMarkNotificationAsReadMutation();

    const {
        mutate: markNotificationsAsRead,
        mutateAsync: markNotificationsAsReadAsync,
        isPending: isMarkNotificationsAsReadPending,
        isError: isMarkNotificationsAsReadError,
        error: markNotificationsAsReadError,
    } = useMarkNotificationsAsReadMutation();

    const {
        mutate: deleteNotification,
        mutateAsync: deleteNotificationAsync,
        isPending: isDeleteNotificationPending,
        isError: isDeleteNotificationError,
        error: deleteNotificationError,
    } = useDeleteNotificationMutation();

    const {
        mutate: updateNotification,
        mutateAsync: updateNotificationAsync,
        isPending: isUpdateNotificationPending,
        isError: isUpdateNotificationError,
        error: updateNotificationError,
    } = useUpdateNotificationMutation();

    const {
        mutate: createBulkNotifications,
        mutateAsync: createBulkNotificationsAsync,
        isPending: isCreateBulkNotificationsPending,
        isError: isCreateBulkNotificationsError,
        error: createBulkNotificationsError,
    } = useCreateBulkNotificationsMutation();

    // Specialized Notification Mutations
    const {
        mutate: createBettingSuccessNotification,
        mutateAsync: createBettingSuccessNotificationAsync,
        isPending: isCreateBettingSuccessNotificationPending,
        isError: isCreateBettingSuccessNotificationError,
        error: createBettingSuccessNotificationError,
    } = useCreateBettingSuccessNotificationMutation();

    const {
        mutate: createBettingWinNotification,
        mutateAsync: createBettingWinNotificationAsync,
        isPending: isCreateBettingWinNotificationPending,
        isError: isCreateBettingWinNotificationError,
        error: createBettingWinNotificationError,
    } = useCreateBettingWinNotificationMutation();

    const {
        mutate: createPollEndingSoonNotification,
        mutateAsync: createPollEndingSoonNotificationAsync,
        isPending: isCreatePollEndingSoonNotificationPending,
        isError: isCreatePollEndingSoonNotificationError,
        error: createPollEndingSoonNotificationError,
    } = useCreatePollEndingSoonNotificationMutation();

    const {
        mutate: createBettingFailedNotification,
        mutateAsync: createBettingFailedNotificationAsync,
        isPending: isCreateBettingFailedNotificationPending,
        isError: isCreateBettingFailedNotificationError,
        error: createBettingFailedNotificationError,
    } = useCreateBettingFailedNotificationMutation();

    const {
        mutate: createPollResultNotification,
        mutateAsync: createPollResultNotificationAsync,
        isPending: isCreatePollResultNotificationPending,
        isError: isCreatePollResultNotificationError,
        error: createPollResultNotificationError,
    } = useCreatePollResultNotificationMutation();

    const {
        mutate: createBettingRefundNotification,
        mutateAsync: createBettingRefundNotificationAsync,
        isPending: isCreateBettingRefundNotificationPending,
        isError: isCreateBettingRefundNotificationError,
        error: createBettingRefundNotificationError,
    } = useCreateBettingRefundNotificationMutation();

    const {
        mutate: createSettlementCompleteNotification,
        mutateAsync: createSettlementCompleteNotificationAsync,
        isPending: isCreateSettlementCompleteNotificationPending,
        isError: isCreateSettlementCompleteNotificationError,
        error: createSettlementCompleteNotificationError,
    } = useCreateSettlementCompleteNotificationMutation();

    return {
        // Notification data and actions
        notificationsData,
        isNotificationsLoading,
        isNotificationsError,
        notificationsError,
        refetchNotifications,

        unreadCountData,
        isUnreadCountLoading,
        isUnreadCountError,
        unreadCountError,
        refetchUnreadCount,

        notificationsByEntityData,
        isNotificationsByEntityLoading,
        isNotificationsByEntityError,
        notificationsByEntityError,
        refetchNotificationsByEntity,

        // Basic notification management actions
        createNotification,
        createNotificationAsync,
        isCreateNotificationPending,
        isCreateNotificationError,
        createNotificationError,

        markNotificationAsRead,
        markNotificationAsReadAsync,
        isMarkNotificationAsReadPending,
        isMarkNotificationAsReadError,
        markNotificationAsReadError,

        markNotificationsAsRead,
        markNotificationsAsReadAsync,
        isMarkNotificationsAsReadPending,
        isMarkNotificationsAsReadError,
        markNotificationsAsReadError,

        deleteNotification,
        deleteNotificationAsync,
        isDeleteNotificationPending,
        isDeleteNotificationError,
        deleteNotificationError,

        updateNotification,
        updateNotificationAsync,
        isUpdateNotificationPending,
        isUpdateNotificationError,
        updateNotificationError,

        createBulkNotifications,
        createBulkNotificationsAsync,
        isCreateBulkNotificationsPending,
        isCreateBulkNotificationsError,
        createBulkNotificationsError,

        // Specialized notification actions
        createBettingSuccessNotification,
        createBettingSuccessNotificationAsync,
        isCreateBettingSuccessNotificationPending,
        isCreateBettingSuccessNotificationError,
        createBettingSuccessNotificationError,

        createBettingWinNotification,
        createBettingWinNotificationAsync,
        isCreateBettingWinNotificationPending,
        isCreateBettingWinNotificationError,
        createBettingWinNotificationError,

        createPollEndingSoonNotification,
        createPollEndingSoonNotificationAsync,
        isCreatePollEndingSoonNotificationPending,
        isCreatePollEndingSoonNotificationError,
        createPollEndingSoonNotificationError,

        createBettingFailedNotification,
        createBettingFailedNotificationAsync,
        isCreateBettingFailedNotificationPending,
        isCreateBettingFailedNotificationError,
        createBettingFailedNotificationError,

        createPollResultNotification,
        createPollResultNotificationAsync,
        isCreatePollResultNotificationPending,
        isCreatePollResultNotificationError,
        createPollResultNotificationError,

        createBettingRefundNotification,
        createBettingRefundNotificationAsync,
        isCreateBettingRefundNotificationPending,
        isCreateBettingRefundNotificationError,
        createBettingRefundNotificationError,

        createSettlementCompleteNotification,
        createSettlementCompleteNotificationAsync,
        isCreateSettlementCompleteNotificationPending,
        isCreateSettlementCompleteNotificationError,
        createSettlementCompleteNotificationError,
    };
}
