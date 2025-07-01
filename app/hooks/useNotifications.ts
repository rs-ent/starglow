"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
    getNotifications,
    markNotificationAsRead,
} from "@/app/actions/notification/actions";
import type { NotificationWithEntity } from "@/app/actions/notification/actions";

// 🎯 알림 모달 설정 인터페이스
export interface NotificationModalConfig {
    id: string;
    notification: NotificationWithEntity;
    priority: number; // 높을수록 우선순위 높음
    showCondition?: (notification: NotificationWithEntity) => boolean;
}

// 🔔 알림 필터 설정
export interface NotificationFilter {
    types?: string[];
    categories?: string[];
    entityTypes?: string[];
    tags?: string[];
    customFilter?: (notification: NotificationWithEntity) => boolean;
}

export function useNotifications() {
    const { data: session } = useSession();
    const [notifications, setNotifications] = useState<
        NotificationWithEntity[]
    >([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!session?.player?.id) return;

        setIsLoading(true);
        try {
            const result = await getNotifications({
                playerId: session.player.id,
                isRead: false,
                limit: 50,
                orderBy: "priority",
                orderDirection: "desc",
            });

            if (result.success && result.data) {
                setNotifications(result.data);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setIsLoading(false);
        }
    }, [session?.player?.id]);

    const getNotificationsByFilter = useCallback(
        (filter: NotificationFilter): NotificationWithEntity[] => {
            return notifications.filter((notification) => {
                if (filter.types && !filter.types.includes(notification.type)) {
                    return false;
                }

                if (
                    filter.categories &&
                    !filter.categories.includes(notification.category)
                ) {
                    return false;
                }

                if (
                    filter.entityTypes &&
                    notification.entityType &&
                    !filter.entityTypes.includes(notification.entityType)
                ) {
                    return false;
                }

                if (filter.tags) {
                    const hasTag = filter.tags.some((tag) =>
                        notification.tags.includes(tag)
                    );
                    if (!hasTag) return false;
                }

                if (filter.customFilter && !filter.customFilter(notification)) {
                    return false;
                }

                return true;
            });
        },
        [notifications]
    );

    const markAsRead = useCallback(
        async (notificationId: string) => {
            try {
                await markNotificationAsRead(
                    notificationId,
                    session?.player?.id
                );
                setNotifications((prev) =>
                    prev.filter(
                        (notification) => notification.id !== notificationId
                    )
                );
            } catch (error) {
                console.error("Failed to mark notification as read:", error);
            }
        },
        [session?.player?.id]
    );

    const getWalletBackupNotifications = useCallback(() => {
        return getNotificationsByFilter({
            types: ["ACCOUNT_SECURITY"],
            categories: ["SYSTEM"],
            entityTypes: ["wallet"],
            tags: ["backup"],
        });
    }, [getNotificationsByFilter]);

    useEffect(() => {
        if (session?.player?.id) {
            fetchNotifications().catch((error) => {
                console.error("Failed to fetch notifications:", error);
            });
        }
    }, [session?.player?.id, fetchNotifications]);

    return {
        notifications,
        isLoading,
        getNotificationsByFilter,
        getWalletBackupNotifications,
        markAsRead,
        refreshNotifications: fetchNotifications,
    };
}
