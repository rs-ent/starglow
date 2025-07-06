/// app/actions/notification/testActions.ts

"use server";

import { createNotification } from "./actions";
import { prisma } from "@/lib/prisma/client";
import type {
    NotificationType,
    NotificationCategory,
    NotificationPriority,
} from "@prisma/client";

export interface TestNotificationInput {
    type: NotificationType;
    category?: NotificationCategory;
    title: string;
    message: string;
    description?: string;
    betAmount?: number;
    winAmount?: number;
    rewardAmount?: number;
    priority?: NotificationPriority;
}

export async function createTestNotification(
    input: TestNotificationInput
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        // Only allow in development environment
        if (process.env.NODE_ENV === "production") {
            return {
                success: false,
                error: "Test notifications not available in production",
            };
        }

        // Validate required fields
        if (!input.type || !input.title || !input.message) {
            return {
                success: false,
                error: "Missing required fields: type, title, message",
            };
        }

        // Find a test player - try to get the first available player
        let testPlayer = await prisma.player.findFirst({
            orderBy: { createdAt: "asc" },
        });

        // If no players exist, create a test player
        if (!testPlayer) {
            // Create a test user first
            const testUser = await prisma.user.create({
                data: {
                    id: "test-user-" + Date.now(),
                    name: "Test User",
                    email: "test@starglow.io",
                    provider: "test",
                    role: "user",
                    active: true,
                },
            });

            // Create a test player
            testPlayer = await prisma.player.create({
                data: {
                    name: "Test Player",
                    userId: testUser.id,
                    referralCode:
                        "TEST" + Date.now().toString(36).toUpperCase(),
                },
            });
        }

        // Create the test notification
        const result = await createNotification({
            playerId: testPlayer.id,
            type: input.type,
            category: input.category || "BETTING",
            title: input.title,
            message: input.message,
            description: input.description,
            betAmount: input.betAmount,
            winAmount: input.winAmount,
            rewardAmount: input.rewardAmount,
            priority: input.priority || "MEDIUM",
            actionType: "NONE",
            entityType: "test",
            entityId: "test-notification-" + Date.now(),
            tags: ["test", "development"],
            channels: ["in-app"],
        });

        if (result.success) {
            return {
                success: true,
                data: {
                    notificationId: result.data?.id,
                    playerId: testPlayer.id,
                    type: input.type,
                    message: "Test notification created successfully",
                },
            };
        } else {
            return {
                success: false,
                error: result.error || "Failed to create notification",
            };
        }
    } catch (error) {
        console.error("Test notification server action error:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Internal server error",
        };
    }
}

export async function createAllTestNotifications(): Promise<{
    success: boolean;
    data?: { count: number; results: any[] };
    error?: string;
}> {
    try {
        if (process.env.NODE_ENV === "production") {
            return {
                success: false,
                error: "Test notifications not available in production",
            };
        }

        const testNotifications = [
            {
                type: "POLL_BETTING_WIN" as NotificationType,
                category: "BETTING" as NotificationCategory,
                title: "🎉 축하합니다! 베팅 당첨!",
                message: "테스트 폴에서 2,000 토큰을 획득했습니다!",
                description: "투자: 1,000 → 수익: +1,000",
                betAmount: 1000,
                winAmount: 2000,
                priority: "URGENT" as NotificationPriority,
            },
            {
                type: "BETTING_FAILED" as NotificationType,
                category: "BETTING" as NotificationCategory,
                title: "😔 베팅 실패",
                message: "테스트 폴에서 베팅이 성공하지 못했습니다.",
                description: "선택한 옵션: Option A (1,000 토큰)",
                betAmount: 1000,
                priority: "MEDIUM" as NotificationPriority,
            },
            {
                type: "POLL_BETTING_REFUND" as NotificationType,
                category: "BETTING" as NotificationCategory,
                title: "💰 베팅 환불",
                message: "테스트 폴에서 1,000 토큰이 환불되었습니다.",
                description: "환불 사유: 승리자 없음",
                rewardAmount: 1000,
                priority: "HIGH" as NotificationPriority,
            },
            {
                type: "SETTLEMENT_COMPLETE" as NotificationType,
                category: "BETTING" as NotificationCategory,
                title: "⚡ 정산 완료",
                message: "테스트 폴의 정산이 완료되었습니다.",
                description: "총 15명에게 25,000 토큰 지급",
                priority: "MEDIUM" as NotificationPriority,
            },
        ];

        const results = [];
        for (const notification of testNotifications) {
            const result = await createTestNotification(notification);
            results.push(result);

            // Add a small delay between notifications
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const successCount = results.filter((r) => r.success).length;

        return {
            success: true,
            data: {
                count: successCount,
                results,
            },
        };
    } catch (error) {
        console.error("Create all test notifications error:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Internal server error",
        };
    }
}
