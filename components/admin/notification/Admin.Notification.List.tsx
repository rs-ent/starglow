/// components/admin/notification/Admin.Notification.List.tsx

"use client";

import { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Bell,
    Search,
    Filter,
    MoreHorizontal,
    CheckCircle,
    AlertTriangle,
    Eye,
    Trash2,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Edit,
} from "lucide-react";
import type {
    NotificationCategory,
    NotificationType,
    NotificationPriority,
} from "@prisma/client";
import type { NotificationWithEntity } from "@/app/actions/notification/actions";
import { AdminNotificationCreate } from "./Admin.Notification.Create";

interface NotificationFilters {
    search: string;
    category?: NotificationCategory;
    type?: NotificationType;
    priority?: NotificationPriority;
    isRead?: boolean;
    startDate?: string;
    endDate?: string;
}

const pageSize = 30;

export function AdminNotificationList() {
    const [filters, setFilters] = useState<NotificationFilters>({
        search: "",
    });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

    const [editingNotification, setEditingNotification] =
        useState<NotificationWithEntity | null>(null);

    // 알림 목록 조회
    const {
        notificationsData,
        isNotificationsLoading,
        refetchNotifications,
        markNotificationAsRead,
        markNotificationsAsRead,
        deleteNotification,
        isMarkNotificationAsReadPending,
        isMarkNotificationsAsReadPending,
        isDeleteNotificationPending,
    } = useNotifications({
        getNotificationsInput: {
            playerId: "admin", // 관리자용 - 실제로는 별도 로직 필요
            limit: pageSize,
            offset: (currentPage - 1) * pageSize,
            orderBy: "createdAt",
            orderDirection: "desc",
        },
    });

    // 필터링된 알림 목록
    const filteredNotifications = useMemo(() => {
        if (!notificationsData?.data) return [];

        return notificationsData.data.filter((notification) => {
            // 검색어 필터
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const titleMatch = notification.title
                    .toLowerCase()
                    .includes(searchLower);
                const messageMatch = notification.message
                    .toLowerCase()
                    .includes(searchLower);
                if (!titleMatch && !messageMatch) return false;
            }

            // 카테고리 필터
            if (
                filters.category &&
                notification.category !== filters.category
            ) {
                return false;
            }

            // 타입 필터
            if (filters.type && notification.type !== filters.type) {
                return false;
            }

            // 우선순위 필터
            if (
                filters.priority &&
                notification.priority !== filters.priority
            ) {
                return false;
            }

            // 읽음 상태 필터
            if (
                filters.isRead !== undefined &&
                notification.isRead !== filters.isRead
            ) {
                return false;
            }

            return true;
        });
    }, [notificationsData?.data, filters]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filteredNotifications.map((n) => n.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectItem = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds((prev) => [...prev, id]);
        } else {
            setSelectedIds((prev) => prev.filter((item) => item !== id));
        }
    };

    const handleMarkSelectedAsRead = async () => {
        if (selectedIds.length > 0) {
            await markNotificationsAsRead({
                notificationIds: selectedIds,
                playerId: "admin", // 실제로는 관리자 로직 필요
            });
            setSelectedIds([]);
        }
    };

    const handleDeleteSelected = async () => {
        for (const id of selectedIds) {
            await deleteNotification({
                notificationId: id,
                playerId: "admin", // 실제로는 관리자 로직 필요
            });
        }
        setSelectedIds([]);
    };

    const resetFilters = () => {
        setFilters({ search: "" });
        setCurrentPage(1);
    };

    const getPriorityColor = (priority: NotificationPriority) => {
        switch (priority) {
            case "URGENT":
                return "text-red-500";
            case "HIGH":
                return "text-orange-500";
            case "MEDIUM":
                return "text-blue-500";
            case "LOW":
                return "text-gray-400";
            default:
                return "text-blue-500";
        }
    };

    const getPriorityIcon = (priority: NotificationPriority) => {
        switch (priority) {
            case "URGENT":
                return <AlertTriangle className="h-4 w-4" />;
            case "HIGH":
                return <Bell className="h-4 w-4" />;
            case "MEDIUM":
                return <Bell className="h-4 w-4" />;
            case "LOW":
                return <Bell className="h-4 w-4" />;
            default:
                return <Bell className="h-4 w-4" />;
        }
    };

    const totalPages = Math.ceil((notificationsData?.total || 0) / pageSize);

    // 편집 모드 핸들러
    const handleEditNotification = (notification: NotificationWithEntity) => {
        setEditingNotification(notification);
    };

    const handleEditComplete = () => {
        setEditingNotification(null);
        refetchNotifications().catch((error) => {
            console.error("Error refetching notifications:", error);
        });
    };

    // 편집 모드일 때 편집 폼 렌더링
    if (editingNotification) {
        return (
            <AdminNotificationCreate
                editingNotification={editingNotification}
                onEditComplete={handleEditComplete}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">알림 목록 관리</h1>
                    <p className="text-muted-foreground">
                        시스템의 모든 알림을 조회하고 관리합니다
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetchNotifications()}
                        disabled={isNotificationsLoading}
                    >
                        <RefreshCw
                            className={`h-4 w-4 mr-2 ${
                                isNotificationsLoading ? "animate-spin" : ""
                            }`}
                        />
                        새로고침
                    </Button>
                </div>
            </div>

            {/* 필터링 섹션 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        필터 및 검색
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="search">검색</Label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="search"
                                    placeholder="제목 또는 메시지 검색..."
                                    value={filters.search}
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            search: e.target.value,
                                        }))
                                    }
                                    className="pl-8"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">카테고리</Label>
                            <Select
                                value={filters.category || ""}
                                onValueChange={(value) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        category:
                                            (value as NotificationCategory) ||
                                            undefined,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="전체 카테고리" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">
                                        전체 카테고리
                                    </SelectItem>
                                    <SelectItem value="BETTING">
                                        베팅
                                    </SelectItem>
                                    <SelectItem value="POLLS">폴</SelectItem>
                                    <SelectItem value="QUESTS">
                                        퀘스트
                                    </SelectItem>
                                    <SelectItem value="RAFFLES">
                                        래플
                                    </SelectItem>
                                    <SelectItem value="SOCIAL">소셜</SelectItem>
                                    <SelectItem value="ASSETS">자산</SelectItem>
                                    <SelectItem value="NFTS">NFT</SelectItem>
                                    <SelectItem value="ARTISTS">
                                        아티스트
                                    </SelectItem>
                                    <SelectItem value="BOARDS">
                                        게시판
                                    </SelectItem>
                                    <SelectItem value="EVENTS">
                                        이벤트
                                    </SelectItem>
                                    <SelectItem value="SYSTEM">
                                        시스템
                                    </SelectItem>
                                    <SelectItem value="GENERAL">
                                        일반
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority">우선순위</Label>
                            <Select
                                value={filters.priority || ""}
                                onValueChange={(value) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        priority:
                                            (value as NotificationPriority) ||
                                            undefined,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="전체 우선순위" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">
                                        전체 우선순위
                                    </SelectItem>
                                    <SelectItem value="URGENT">긴급</SelectItem>
                                    <SelectItem value="HIGH">높음</SelectItem>
                                    <SelectItem value="MEDIUM">보통</SelectItem>
                                    <SelectItem value="LOW">낮음</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="readStatus">읽음 상태</Label>
                            <Select
                                value={filters.isRead?.toString() || ""}
                                onValueChange={(value) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        isRead:
                                            value === ""
                                                ? undefined
                                                : value === "true",
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="전체 상태" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">전체 상태</SelectItem>
                                    <SelectItem value="false">
                                        읽지 않음
                                    </SelectItem>
                                    <SelectItem value="true">읽음</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={resetFilters}
                        >
                            필터 초기화
                        </Button>
                        <div className="text-sm text-muted-foreground">
                            총 {filteredNotifications.length}개의 알림
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 일괄 작업 */}
            {selectedIds.length > 0 && (
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                        <span>
                            {selectedIds.length}개의 알림이 선택되었습니다.
                        </span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleMarkSelectedAsRead}
                                disabled={isMarkNotificationsAsReadPending}
                            >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                읽음 처리
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={handleDeleteSelected}
                                disabled={isDeleteNotificationPending}
                            >
                                <Trash2 className="h-4 w-4 mr-1" />
                                삭제
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* 알림 목록 테이블 */}
            <Card>
                <CardHeader>
                    <CardTitle>알림 목록</CardTitle>
                    <CardDescription>
                        시스템에서 발송된 모든 알림을 관리합니다
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isNotificationsLoading ? (
                        <div className="text-center py-12">
                            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                            <p className="text-muted-foreground">
                                알림 목록을 불러오는 중...
                            </p>
                        </div>
                    ) : filteredNotifications.length > 0 ? (
                        <div className="space-y-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={
                                                    filteredNotifications.length >
                                                        0 &&
                                                    selectedIds.length ===
                                                        filteredNotifications.length
                                                }
                                                onCheckedChange={
                                                    handleSelectAll
                                                }
                                            />
                                        </TableHead>
                                        <TableHead className="w-12">
                                            상태
                                        </TableHead>
                                        <TableHead>제목</TableHead>
                                        <TableHead>카테고리</TableHead>
                                        <TableHead>우선순위</TableHead>
                                        <TableHead>생성일</TableHead>
                                        <TableHead className="w-12">
                                            액션
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredNotifications.map(
                                        (notification) => (
                                            <TableRow key={notification.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedIds.includes(
                                                            notification.id
                                                        )}
                                                        onCheckedChange={(
                                                            checked
                                                        ) =>
                                                            handleSelectItem(
                                                                notification.id,
                                                                checked as boolean
                                                            )
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {notification.isRead ? (
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                        ) : (
                                                            <Bell className="h-4 w-4 text-blue-500" />
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="font-medium">
                                                            {notification.title}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground truncate max-w-md">
                                                            {
                                                                notification.message
                                                            }
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {notification.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div
                                                        className={`flex items-center gap-1 ${getPriorityColor(
                                                            notification.priority
                                                        )}`}
                                                    >
                                                        {getPriorityIcon(
                                                            notification.priority
                                                        )}
                                                        <span className="text-sm">
                                                            {
                                                                notification.priority
                                                            }
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {new Date(
                                                            notification.createdAt
                                                        ).toLocaleString()}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>
                                                                액션
                                                            </DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    console.info(
                                                                        "View details:",
                                                                        notification.id
                                                                    )
                                                                }
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                상세 보기
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleEditNotification(
                                                                        notification
                                                                    )
                                                                }
                                                            >
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                편집
                                                            </DropdownMenuItem>
                                                            {!notification.isRead && (
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        markNotificationAsRead(
                                                                            {
                                                                                notificationId:
                                                                                    notification.id,
                                                                                playerId:
                                                                                    "admin",
                                                                            }
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isMarkNotificationAsReadPending
                                                                    }
                                                                >
                                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                                    읽음 처리
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    deleteNotification(
                                                                        {
                                                                            notificationId:
                                                                                notification.id,
                                                                            playerId:
                                                                                "admin",
                                                                        }
                                                                    )
                                                                }
                                                                disabled={
                                                                    isDeleteNotificationPending
                                                                }
                                                                className="text-red-600"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                삭제
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    )}
                                </TableBody>
                            </Table>

                            {/* 페이지네이션 */}
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    {(currentPage - 1) * pageSize + 1}-
                                    {Math.min(
                                        currentPage * pageSize,
                                        notificationsData?.total || 0
                                    )}{" "}
                                    of {notificationsData?.total || 0} 항목
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setCurrentPage((prev) =>
                                                Math.max(1, prev - 1)
                                            )
                                        }
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        이전
                                    </Button>
                                    <div className="text-sm">
                                        페이지 {currentPage} / {totalPages}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setCurrentPage((prev) =>
                                                Math.min(totalPages, prev + 1)
                                            )
                                        }
                                        disabled={currentPage === totalPages}
                                    >
                                        다음
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                알림이 없습니다
                            </h3>
                            <p className="text-muted-foreground">
                                현재 필터 조건에 맞는 알림이 없습니다.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
