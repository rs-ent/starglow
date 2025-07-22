/// app/actions/notification/actions.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import type {
    NotificationType,
    NotificationCategory,
    NotificationActionType,
    NotificationPriority,
    NotificationStatus,
    Prisma,
} from "@prisma/client";
import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";

// 성능 모니터링 유틸리티
async function withPerformanceMonitoring<T>(
    operation: () => Promise<T>,
    operationName: string
): Promise<T> {
    const startTime = Date.now();
    try {
        const result = await operation();
        const duration = Date.now() - startTime;

        if (duration > 5000) {
            console.warn(
                `Slow notification operation: ${operationName} took ${duration}ms`
            );
        }

        return result;
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(
            `Failed notification operation: ${operationName} after ${duration}ms`,
            error
        );
        throw error;
    }
}

// 🔔 ===== TYPES & INTERFACES =====

export interface CreateNotificationInput {
    playerId: string;
    type: NotificationType;
    category?: NotificationCategory;
    title: string;
    message: string;
    description?: string;

    // 🎯 액션 정보
    actionType?: NotificationActionType;
    actionUrl?: string;
    actionData?: any;

    // 🔗 관련 엔티티 (유연한 설계)
    entityType?: string; // "poll", "quest", "raffle", "boardPost", "artist", "asset"
    entityId?: string;
    entityData?: any; // 캐시된 엔티티 정보 (이름, 이미지 등)

    // 💰 베팅/보상 관련
    betAmount?: number;
    winAmount?: number;
    rewardAmount?: number;

    // 📊 우선순위 및 설정
    priority?: NotificationPriority;
    channels?: string[]; // ['in-app', 'push', 'telegram']

    // 🎨 UI 옵션
    iconUrl?: string;
    imageUrl?: string;
    showBadge?: boolean;

    // ⏰ 스케줄링
    scheduledAt?: Date;
    expiresAt?: Date;

    // 📝 메타데이터
    metadata?: any;
    tags?: string[];
}

export interface GetNotificationsInput {
    playerId: string;
    type?: NotificationType;
    category?: NotificationCategory;
    entityType?: string;
    isRead?: boolean;
    limit?: number;
    offset?: number;
    orderBy?: "createdAt" | "priority" | "scheduledAt";
    orderDirection?: "asc" | "desc";
}

export interface NotificationWithEntity {
    id: string;
    playerId: string;
    type: NotificationType;
    category: NotificationCategory;
    title: string;
    message: string;
    description?: string;
    actionType: NotificationActionType;
    actionUrl?: string;
    actionData?: any;
    entityType?: string;
    entityId?: string;
    entityData?: any;
    betAmount?: number;
    winAmount?: number;
    rewardAmount?: number;
    priority: NotificationPriority;
    status: NotificationStatus;
    isRead: boolean;
    readAt?: Date;
    isSent: boolean;
    sentAt?: Date;
    sentChannels: string[];
    iconUrl?: string;
    imageUrl?: string;
    showBadge: boolean;
    scheduledAt?: Date;
    expiresAt?: Date;
    metadata?: any;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

// 🔔 ===== NOTIFICATION ACTIONS =====

/**
 * 🎯 알림 생성 (가장 중요한 함수)
 */
export async function createNotification(
    input: CreateNotificationInput
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const {
            playerId,
            type,
            category = "GENERAL",
            title,
            message,
            description,
            actionType = "NONE",
            actionUrl,
            actionData,
            entityType,
            entityId,
            entityData,
            betAmount,
            winAmount,
            rewardAmount,
            priority = "MEDIUM",
            channels = ["in-app"],
            iconUrl,
            imageUrl,
            showBadge = false,
            scheduledAt,
            expiresAt,
            metadata,
            tags = [],
        } = input;

        // 플레이어 존재 확인
        const player = await prisma.player.findUnique({
            cacheStrategy: getCacheStrategy("sevenDays"),
            where: { id: playerId },
            select: {
                id: true,
            },
        });

        if (!player) {
            return { success: false, error: "Player not found" };
        }

        // 알림 생성
        const notification = await prisma.userNotification.create({
            data: {
                playerId,
                type,
                category,
                title,
                message,
                description,
                actionType,
                actionUrl,
                actionData,
                entityType,
                entityId,
                entityData,
                betAmount,
                winAmount,
                rewardAmount,
                priority,
                sentChannels: channels,
                iconUrl,
                imageUrl,
                showBadge,
                scheduledAt,
                expiresAt,
                metadata,
                tags,
            },
        });

        return { success: true, data: notification };
    } catch (error) {
        console.error("Error creating notification:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * 📋 사용자 알림 목록 조회
 */
export async function getNotifications(input: GetNotificationsInput): Promise<{
    success: boolean;
    data?: NotificationWithEntity[];
    error?: string;
    total?: number;
}> {
    try {
        const {
            playerId,
            type,
            category,
            entityType,
            isRead,
            limit = 20,
            offset = 0,
            orderBy = "createdAt",
            orderDirection = "desc",
        } = input;

        const now = new Date();

        // 기본 조건 구성
        const baseConditions = {
            playerId,
            ...(type && { type }),
            ...(category && { category }),
            ...(entityType && { entityType }),
            ...(isRead !== undefined && { isRead }),
        };

        // 만료 조건을 별도로 처리하여 인덱스 활용 최적화
        const expiresCondition = {
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        };

        const baseWhere: Prisma.UserNotificationWhereInput = {
            ...baseConditions,
            ...expiresCondition,
        };

        const countWhere: Prisma.UserNotificationWhereInput = {
            ...baseConditions,
            ...expiresCondition,
        };

        const [notifications, total] = await Promise.all([
            withPerformanceMonitoring(
                () =>
                    prisma.userNotification.findMany({
                        cacheStrategy: getCacheStrategy("oneMinute"),
                        where: baseWhere,
                        orderBy: { [orderBy]: orderDirection },
                        take: limit,
                        skip: offset,
                    }),
                "getNotifications.findMany"
            ),
            withPerformanceMonitoring(
                () =>
                    prisma.userNotification.count({
                        cacheStrategy: getCacheStrategy("oneMinute"),
                        where: countWhere,
                    }),
                "getNotifications.count"
            ),
        ]);

        return {
            success: true,
            data: notifications as NotificationWithEntity[],
            total,
        };
    } catch (error) {
        console.error("Error getting notifications:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * ✅ 알림 읽음 처리
 */
export async function markNotificationAsRead(
    notificationId: string,
    playerId?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // playerId 검증이 필요한 경우 먼저 확인
        if (playerId) {
            const existingNotification =
                await prisma.userNotification.findFirst({
                    cacheStrategy: getCacheStrategy("realtime"),
                    where: {
                        id: notificationId,
                        playerId,
                    },
                });

            if (!existingNotification) {
                return {
                    success: false,
                    error: "Notification not found or access denied",
                };
            }
        }

        await prisma.userNotification.update({
            where: { id: notificationId },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * ✏️ 알림 수정
 */
export async function updateNotification(
    notificationId: string,
    input: Partial<CreateNotificationInput> & { playerId?: string }
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const { playerId, ...updateData } = input;

        // playerId 검증이 필요한 경우 먼저 확인
        if (playerId) {
            const existingNotification =
                await prisma.userNotification.findFirst({
                    cacheStrategy: getCacheStrategy("realtime"),
                    where: {
                        id: notificationId,
                        playerId,
                    },
                });

            if (!existingNotification) {
                return {
                    success: false,
                    error: "Notification not found or access denied",
                };
            }
        }

        const notification = await prisma.userNotification.update({
            where: { id: notificationId },
            data: {
                ...(updateData.type && { type: updateData.type }),
                ...(updateData.category && { category: updateData.category }),
                ...(updateData.title && { title: updateData.title }),
                ...(updateData.message && { message: updateData.message }),
                ...(updateData.description !== undefined && {
                    description: updateData.description,
                }),
                ...(updateData.actionType && {
                    actionType: updateData.actionType,
                }),
                ...(updateData.actionUrl !== undefined && {
                    actionUrl: updateData.actionUrl,
                }),
                ...(updateData.actionData !== undefined && {
                    actionData: updateData.actionData,
                }),
                ...(updateData.entityType !== undefined && {
                    entityType: updateData.entityType,
                }),
                ...(updateData.entityId !== undefined && {
                    entityId: updateData.entityId,
                }),
                ...(updateData.entityData !== undefined && {
                    entityData: updateData.entityData,
                }),
                ...(updateData.betAmount !== undefined && {
                    betAmount: updateData.betAmount,
                }),
                ...(updateData.winAmount !== undefined && {
                    winAmount: updateData.winAmount,
                }),
                ...(updateData.rewardAmount !== undefined && {
                    rewardAmount: updateData.rewardAmount,
                }),
                ...(updateData.priority && { priority: updateData.priority }),
                ...(updateData.channels && {
                    sentChannels: updateData.channels,
                }),
                ...(updateData.iconUrl !== undefined && {
                    iconUrl: updateData.iconUrl,
                }),
                ...(updateData.imageUrl !== undefined && {
                    imageUrl: updateData.imageUrl,
                }),
                ...(updateData.showBadge !== undefined && {
                    showBadge: updateData.showBadge,
                }),
                ...(updateData.scheduledAt !== undefined && {
                    scheduledAt: updateData.scheduledAt,
                }),
                ...(updateData.expiresAt !== undefined && {
                    expiresAt: updateData.expiresAt,
                }),
                ...(updateData.metadata !== undefined && {
                    metadata: updateData.metadata,
                }),
                ...(updateData.tags && { tags: updateData.tags }),
            },
        });

        return { success: true, data: notification };
    } catch (error) {
        console.error("Error updating notification:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * ✅ 여러 알림 읽음 처리
 */
export async function markNotificationsAsRead(
    notificationIds: string[],
    playerId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
        const result = await prisma.userNotification.updateMany({
            where: {
                id: { in: notificationIds },
                playerId,
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });

        return { success: true, count: result.count };
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * 🗑️ 알림 삭제 (소프트 삭제 - 만료 처리)
 */
export async function deleteNotification(
    notificationId: string,
    playerId?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // playerId 검증이 필요한 경우 먼저 확인
        if (playerId) {
            const existingNotification =
                await prisma.userNotification.findFirst({
                    cacheStrategy: getCacheStrategy("realtime"),
                    where: {
                        id: notificationId,
                        playerId,
                    },
                });

            if (!existingNotification) {
                return {
                    success: false,
                    error: "Notification not found or access denied",
                };
            }
        }

        await prisma.userNotification.update({
            where: { id: notificationId },
            data: {
                expiresAt: new Date(), // 즉시 만료 처리
                status: "EXPIRED",
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Error deleting notification:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * 📊 읽지 않은 알림 개수 조회
 */
export async function getUnreadNotificationCount(
    playerId: string,
    category?: NotificationCategory
): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
        const now = new Date();

        const where: Prisma.UserNotificationWhereInput = {
            playerId,
            isRead: false,
            ...(category && { category }),
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        };

        const count = await prisma.userNotification.count({
            cacheStrategy: getCacheStrategy("oneMinute"),
            where,
        });

        return { success: true, count };
    } catch (error) {
        console.error("Error getting unread notification count:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * 🎯 엔티티별 알림 조회 (특정 폴, 퀘스트 등의 알림들)
 */
export async function getNotificationsByEntity(
    playerId: string,
    entityType: string,
    entityId: string
): Promise<{
    success: boolean;
    data?: NotificationWithEntity[];
    error?: string;
}> {
    try {
        const now = new Date();

        const notifications = await prisma.userNotification.findMany({
            cacheStrategy: getCacheStrategy("tenSeconds"),
            where: {
                playerId,
                entityType,
                entityId,
                OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            },
            orderBy: { createdAt: "desc" },
        });

        return {
            success: true,
            data: notifications as NotificationWithEntity[],
        };
    } catch (error) {
        console.error("Error getting notifications by entity:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * 🚀 대량 알림 생성 (이벤트, 공지 등에 활용)
 */
export async function createBulkNotifications(
    playerIds: string[],
    notificationData: Omit<CreateNotificationInput, "playerId">
): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
        const notifications = playerIds.map((playerId) => ({
            playerId,
            type: notificationData.type,
            category: notificationData.category || "GENERAL",
            title: notificationData.title,
            message: notificationData.message,
            description: notificationData.description,
            actionType: notificationData.actionType || "NONE",
            actionUrl: notificationData.actionUrl,
            actionData: notificationData.actionData,
            entityType: notificationData.entityType,
            entityId: notificationData.entityId,
            entityData: notificationData.entityData,
            betAmount: notificationData.betAmount,
            winAmount: notificationData.winAmount,
            rewardAmount: notificationData.rewardAmount,
            priority: notificationData.priority || "MEDIUM",
            sentChannels: notificationData.channels || ["in-app"],
            iconUrl: notificationData.iconUrl,
            imageUrl: notificationData.imageUrl,
            showBadge: notificationData.showBadge || false,
            scheduledAt: notificationData.scheduledAt,
            expiresAt: notificationData.expiresAt,
            metadata: notificationData.metadata,
            tags: notificationData.tags || [],
        }));

        // 배치 크기로 나누어 처리 (DB 성능 고려)
        const batchSize = 100;
        let totalCreated = 0;

        for (let i = 0; i < notifications.length; i += batchSize) {
            const batch = notifications.slice(i, i + batchSize);
            const result = await prisma.userNotification.createMany({
                data: batch,
                skipDuplicates: true,
            });
            totalCreated += result.count;
        }

        return { success: true, count: totalCreated };
    } catch (error) {
        console.error("Error creating bulk notifications:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

// 🔔 ===== SPECIALIZED NOTIFICATION CREATORS =====

/**
 * 🎰 베팅 성공 알림 생성
 */
export async function createBettingSuccessNotification(
    playerId: string,
    pollId: string,
    pollTitle: string,
    betAmount: number,
    optionName: string
): Promise<{ success: boolean; error?: string }> {
    return createNotification({
        playerId,
        type: "BETTING_SUCCESS",
        category: "BETTING",
        title: "🎰 Betting Success!",
        message: `"${pollTitle}" Betting Success`,
        description: `Selected Option: ${optionName}`,
        actionType: "OPEN_POLL",
        actionUrl: `/polls/${pollId}`,
        entityType: "poll",
        entityId: pollId,
        entityData: { pollTitle, optionName },
        betAmount,
        priority: "HIGH",
        channels: ["in-app", "push"],
        iconUrl: "/icons/betting-success.svg",
        showBadge: true,
    });
}

/**
 * 🏆 베팅 당첨 알림 생성
 */
export async function createBettingWinNotification(
    playerId: string,
    pollId: string,
    pollTitle: string,
    betAmount: number,
    winAmount: number
): Promise<{ success: boolean; error?: string }> {
    const profit = winAmount - betAmount;

    return createNotification({
        playerId,
        type: "POLL_BETTING_WIN",
        category: "BETTING",
        title: "🎉 Congratulations! Betting Win!",
        message: `"${pollTitle}" Betting Win!`,
        description: `Investment: ${betAmount.toLocaleString()} → Profit: +${profit.toLocaleString()}`,
        actionType: "OPEN_POLL",
        actionUrl: `/polls/${pollId}`,
        entityType: "poll",
        entityId: pollId,
        entityData: { pollTitle, profit },
        betAmount,
        winAmount,
        priority: "URGENT",
        channels: ["in-app", "push", "telegram"],
        iconUrl: "/icons/betting-win.svg",
        showBadge: true,
    });
}

/**
 * 📊 폴 종료 예고 알림 생성
 */
export async function createPollEndingSoonNotification(
    playerId: string,
    pollId: string,
    pollTitle: string,
    endDate: Date
): Promise<{ success: boolean; error?: string }> {
    return createNotification({
        playerId,
        type: "POLL_ENDING_SOON",
        category: "POLLS",
        title: "⏰ Poll Ending Soon!",
        message: `"${pollTitle}" Ending Soon`,
        description: `End Time: ${endDate.toLocaleString()}`,
        actionType: "OPEN_POLL",
        actionUrl: `/polls/${pollId}`,
        entityType: "poll",
        entityId: pollId,
        entityData: { pollTitle, endDate },
        priority: "HIGH",
        channels: ["in-app", "push"],
        iconUrl: "/icons/poll-ending.svg",
    });
}

/**
 * ❌ 베팅 실패 알림 생성
 */
export async function createBettingFailedNotification(
    playerId: string,
    pollId: string,
    pollTitle: string,
    betAmount: number,
    optionName: string
): Promise<{ success: boolean; error?: string }> {
    return createNotification({
        playerId,
        type: "BETTING_FAILED",
        category: "BETTING",
        title: "😔 Betting Failed",
        message: `"${pollTitle}" Betting Failed`,
        description: `Selected Option: ${optionName} (${betAmount.toLocaleString()})`,
        actionType: "OPEN_POLL",
        actionUrl: `/polls/${pollId}`,
        entityType: "poll",
        entityId: pollId,
        entityData: { pollTitle, optionName },
        betAmount,
        priority: "MEDIUM",
        channels: ["in-app"],
        iconUrl: "/icons/betting-failed.svg",
    });
}

/**
 * 📋 폴 결과 발표 알림 생성
 */
export async function createPollResultNotification(
    playerId: string,
    pollId: string,
    pollTitle: string,
    winningOption: string,
    userParticipated: boolean
): Promise<{ success: boolean; error?: string }> {
    return createNotification({
        playerId,
        type: "POLL_RESULT_ANNOUNCED",
        category: "POLLS",
        title: "📊 Poll Result Announced!",
        message: `"${pollTitle}" Result Announced`,
        description: `Winning Option: ${winningOption}`,
        actionType: "OPEN_POLL",
        actionUrl: `/polls/${pollId}`,
        entityType: "poll",
        entityId: pollId,
        entityData: { pollTitle, winningOption, userParticipated },
        priority: userParticipated ? "HIGH" : "MEDIUM",
        channels: userParticipated ? ["in-app", "push"] : ["in-app"],
        iconUrl: "/icons/poll-result.svg",
        showBadge: userParticipated,
    });
}

/**
 * 💰 베팅 환불 알림 생성
 */
export async function createBettingRefundNotification(
    playerId: string,
    pollId: string,
    pollTitle: string,
    refundAmount: number,
    reason: string
): Promise<{ success: boolean; error?: string }> {
    return createNotification({
        playerId,
        type: "POLL_BETTING_REFUND",
        category: "BETTING",
        title: "💰 Betting Refund",
        message: `"${pollTitle}" Betting Refund`,
        description: `Refund Amount: ${refundAmount.toLocaleString()}`,
        actionType: "OPEN_POLL",
        actionUrl: `/polls/${pollId}`,
        entityType: "poll",
        entityId: pollId,
        entityData: { pollTitle, reason },
        rewardAmount: refundAmount,
        priority: "HIGH",
        channels: ["in-app", "push"],
        iconUrl: "/icons/betting-refund.svg",
        showBadge: true,
    });
}

/**
 * ⚡ 정산 완료 알림 생성
 */
export async function createSettlementCompleteNotification(
    playerId: string,
    pollId: string,
    pollTitle: string,
    totalWinners: number,
    totalPayout: number
): Promise<{ success: boolean; error?: string }> {
    return createNotification({
        playerId,
        type: "SETTLEMENT_COMPLETE",
        category: "BETTING",
        title: "⚡ Settlement Complete",
        message: `"${pollTitle}" Settlement Complete`,
        description: `Total ${totalWinners} winners, ${totalPayout.toLocaleString()} paid`,
        actionType: "OPEN_POLL",
        actionUrl: `/polls/${pollId}`,
        entityType: "poll",
        entityId: pollId,
        entityData: { pollTitle, totalWinners, totalPayout },
        priority: "MEDIUM",
        channels: ["in-app"],
        iconUrl: "/icons/settlement-complete.svg",
    });
}

export async function createRewardNotification(
    playerId: string,
    assetId: string,
    amount: number,
    type: NotificationType,
    category: NotificationCategory,
    title: string,
    message: string,
    description: string,
    reason: string
): Promise<{ success: boolean; error?: string }> {
    const asset = await prisma.asset.findUnique({
        where: { id: assetId },
        select: { id: true, name: true, symbol: true },
    });

    return createNotification({
        playerId,
        type,
        category,
        title,
        message,
        description,
        actionType: "NONE",
        actionUrl: "",
        entityType: "asset",
        entityId: assetId,
        entityData: {
            assetId,
            amount,
            reason,
            assetName: asset?.name || "Asset",
            assetSymbol: asset?.symbol || "TOKEN",
        },
        rewardAmount: amount,
        priority: "MEDIUM",
        channels: ["in-app", "push"],
        iconUrl: "/icons/reward.svg",
        showBadge: true,
    });
}
