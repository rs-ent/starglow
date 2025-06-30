/// components/admin/notification/Admin.Notification.Dashboard.tsx

"use client";

import { useState } from "react";
import { useNotifications } from "@/app/actions/notification/hooks";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Bell,
    Clock,
    CheckCircle,
    AlertTriangle,
    Plus,
    RefreshCw,
    Eye,
} from "lucide-react";
import type { NotificationCategory } from "@prisma/client";
import { AdminNotificationCreate } from "./Admin.Notification.Create";

export function AdminNotificationDashboard() {
    const [selectedCategory, setSelectedCategory] = useState<
        NotificationCategory | "ALL"
    >("ALL");
    const [isCreatingNotification, setIsCreatingNotification] = useState(false);

    // 전체 알림 목록 조회
    const {
        notificationsData: allNotifications,
        isNotificationsLoading: isAllLoading,
        refetchNotifications: refetchAll,
    } = useNotifications({
        getNotificationsInput: {
            playerId: "admin",
            limit: 50,
            orderBy: "createdAt",
            orderDirection: "desc",
        },
    });

    // 읽지 않은 알림 개수 조회
    const { unreadCountData, refetchUnreadCount } = useNotifications({
        getUnreadCountPlayerId: "admin",
    });

    const handleRefresh = () => {
        refetchAll().catch((error) => {
            console.error("Error refetching all notifications:", error);
        });
        refetchUnreadCount().catch((error) => {
            console.error("Error refetching unread count:", error);
        });
    };

    const handleCreateNotification = () => {
        setIsCreatingNotification(true);
    };

    const handleCreateComplete = () => {
        setIsCreatingNotification(false);
        refetchAll().catch((error) => {
            console.error("Error refetching all notifications:", error);
        });
        refetchUnreadCount().catch((error) => {
            console.error("Error refetching unread count:", error);
        });
    };

    // 생성 모드일 때 생성 폼 렌더링
    if (isCreatingNotification) {
        return (
            <AdminNotificationCreate onEditComplete={handleCreateComplete} />
        );
    }

    // 카테고리별 필터링
    const filteredNotifications =
        allNotifications?.data?.filter(
            (notification) =>
                selectedCategory === "ALL" ||
                notification.category === selectedCategory
        ) || [];

    // 카테고리별 개수 계산
    const categoryCounts =
        allNotifications?.data?.reduce((acc, notification) => {
            acc[notification.category] = (acc[notification.category] || 0) + 1;
            return acc;
        }, {} as Record<NotificationCategory, number>) || {};

    const totalNotifications = allNotifications?.data?.length || 0;
    const unreadCount = unreadCountData?.count || 0;
    const readCount = totalNotifications - unreadCount;

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">알림 관리 대시보드</h1>
                    <p className="text-muted-foreground">
                        등록된 알림을 확인하고 관리하세요
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isAllLoading}
                    >
                        <RefreshCw
                            className={`h-4 w-4 mr-2 ${
                                isAllLoading ? "animate-spin" : ""
                            }`}
                        />
                        새로고침
                    </Button>
                    <Button size="sm" onClick={handleCreateNotification}>
                        <Plus className="h-4 w-4 mr-2" />새 알림 생성
                    </Button>
                </div>
            </div>

            {/* 요약 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            전체 알림
                        </CardTitle>
                        <Bell className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {totalNotifications}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            등록된 총 알림 수
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            읽지 않음
                        </CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {unreadCount}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            확인이 필요한 알림
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            읽음 완료
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {readCount}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            처리 완료된 알림
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            읽음률
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {totalNotifications > 0
                                ? `${Math.round(
                                      (readCount / totalNotifications) * 100
                                  )}%`
                                : "0%"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            전체 알림 읽음률
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* 카테고리 필터 */}
            <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    <Badge
                        variant={
                            selectedCategory === "ALL" ? "default" : "secondary"
                        }
                        className="cursor-pointer"
                        onClick={() => setSelectedCategory("ALL")}
                    >
                        전체 ({totalNotifications})
                    </Badge>
                    {Object.entries(categoryCounts).map(([category, count]) => (
                        <Badge
                            key={category}
                            variant={
                                selectedCategory === category
                                    ? "default"
                                    : "outline"
                            }
                            className="cursor-pointer"
                            onClick={() =>
                                setSelectedCategory(
                                    category as NotificationCategory
                                )
                            }
                        >
                            {category} ({count as number})
                        </Badge>
                    ))}
                </div>

                {/* 알림 목록 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            {selectedCategory === "ALL"
                                ? "전체 알림"
                                : `${selectedCategory} 알림`}
                        </CardTitle>
                        <CardDescription>
                            {selectedCategory === "ALL"
                                ? "모든 카테고리의 알림을 표시합니다"
                                : `${selectedCategory} 카테고리의 알림을 표시합니다`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isAllLoading ? (
                            <div className="text-center py-8">
                                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    알림을 불러오는 중...
                                </p>
                            </div>
                        ) : filteredNotifications.length > 0 ? (
                            <div className="space-y-3">
                                {filteredNotifications
                                    .slice(0, 20)
                                    .map((notification) => (
                                        <div
                                            key={notification.id}
                                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50"
                                        >
                                            <div className="flex-shrink-0">
                                                {notification.isRead ? (
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <Bell className="h-4 w-4 text-blue-500" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-sm font-medium truncate">
                                                        {notification.title}
                                                    </h4>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        {notification.category}
                                                    </Badge>
                                                    <Badge
                                                        variant={
                                                            notification.priority ===
                                                            "URGENT"
                                                                ? "destructive"
                                                                : notification.priority ===
                                                                  "HIGH"
                                                                ? "default"
                                                                : "secondary"
                                                        }
                                                        className="text-xs"
                                                    >
                                                        {notification.priority}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-muted-foreground">
                                                        {notification.type}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        •
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(
                                                            notification.createdAt
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                {filteredNotifications.length > 20 && (
                                    <div className="text-center pt-4">
                                        <Button variant="outline" size="sm">
                                            더 보기 (
                                            {filteredNotifications.length - 20}
                                            개 더)
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">
                                    알림이 없습니다
                                </h3>
                                <p className="text-muted-foreground">
                                    {selectedCategory === "ALL"
                                        ? "등록된 알림이 없습니다."
                                        : `${selectedCategory} 카테고리에 알림이 없습니다.`}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* 상태 알림 */}
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    💡 <strong>안내:</strong> 실제 사용자 알림 데이터를 기반으로
                    표시됩니다. 관리자 권한으로 모든 알림을 확인할 수 있습니다.
                </AlertDescription>
            </Alert>
        </div>
    );
}
