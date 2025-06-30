/// app/actions/notification/queries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import type { NotificationCategory } from "@prisma/client";

import { notificationKeys } from "@/app/queryKeys";

import {
    getNotifications,
    getUnreadNotificationCount,
    getNotificationsByEntity,
} from "./actions";

import type { GetNotificationsInput } from "./actions";

export function useGetNotificationsQuery(input?: GetNotificationsInput) {
    return useQuery({
        queryKey: notificationKeys.list(input),
        queryFn: () => getNotifications(input!),
        enabled: Boolean(input?.playerId),
        staleTime: 1000 * 60 * 2, // 2 minutes
        gcTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: true,
    });
}

export function useGetUnreadNotificationCountQuery(
    playerId: string,
    category?: NotificationCategory
) {
    return useQuery({
        queryKey: notificationKeys.unreadCount(playerId, category),
        queryFn: () => getUnreadNotificationCount(playerId, category),
        enabled: Boolean(playerId),
        staleTime: 1000 * 30, // 30 seconds (짧은 캐시 - 실시간성 중요)
        gcTime: 1000 * 60 * 2, // 2 minutes
        refetchOnWindowFocus: true,
        refetchInterval: 1000 * 60, // 1분마다 자동 새로고침
    });
}

export function useGetNotificationsByEntityQuery(
    playerId: string,
    entityType: string,
    entityId: string
) {
    return useQuery({
        queryKey: notificationKeys.byEntity(entityType, entityId),
        queryFn: () => getNotificationsByEntity(playerId, entityType, entityId),
        enabled: Boolean(playerId && entityType && entityId),
        staleTime: 1000 * 60 * 3, // 3 minutes
        gcTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: true,
    });
}
