/// components/admin/notification/Admin.Notification.Create.tsx

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Bell,
    Send,
    Target,
    Calendar,
    AlertTriangle,
    Edit,
    Link,
    Info,
    Eye,
} from "lucide-react";
import type {
    NotificationCategory,
    NotificationType,
    NotificationPriority,
    NotificationActionType,
} from "@prisma/client";
import type { NotificationWithEntity } from "@/app/actions/notification/actions";

// 알림 생성 폼 스키마
const createNotificationSchema = z.object({
    // 기본 정보
    type: z.string(),
    category: z.string(),
    title: z.string().min(1, "제목을 입력하세요"),
    message: z.string().min(1, "메시지를 입력하세요"),
    description: z.string().optional(),

    // 타겟 설정
    targetType: z.enum(["ALL", "SPECIFIC_PLAYERS", "FILTER"]),
    targetPlayerIds: z.array(z.string()).optional(),

    // 액션 설정
    actionType: z.string(),
    actionUrl: z.string().optional(),
    actionData: z.string().optional(), // JSON string

    // 관련 엔티티
    entityType: z.string().optional(),
    entityId: z.string().optional(),
    entityData: z.string().optional(), // JSON string

    // 베팅/보상 관련
    betAmount: z.number().optional(),
    winAmount: z.number().optional(),
    rewardAmount: z.number().optional(),

    // 우선순위 및 설정
    priority: z.string(),
    channels: z.array(z.string()),

    // UI 옵션
    iconUrl: z.string().optional(),
    imageUrl: z.string().optional(),
    showBadge: z.boolean(),

    // 스케줄링
    scheduledAt: z.string().optional(),
    expiresAt: z.string().optional(),

    // 메타데이터
    metadata: z.string().optional(), // JSON string
    tags: z.array(z.string()),
});

type CreateNotificationForm = z.infer<typeof createNotificationSchema>;

interface AdminNotificationCreateProps {
    editingNotification?: NotificationWithEntity;
    onEditComplete?: () => void;
}

export function AdminNotificationCreate({
    editingNotification,
    onEditComplete,
}: AdminNotificationCreateProps) {
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [targetPlayerEmails, setTargetPlayerEmails] = useState<string>("");

    const isEditing = !!editingNotification;

    const {
        createNotification,
        createBulkNotifications,
        updateNotification,
        isCreateNotificationPending,
        isCreateBulkNotificationsPending,
        isUpdateNotificationPending,
    } = useNotifications();

    const form = useForm<CreateNotificationForm>({
        resolver: zodResolver(createNotificationSchema),
        defaultValues: {
            type: "GENERAL_INFO",
            category: "GENERAL",
            title: "",
            message: "",
            description: "",
            targetType: "ALL",
            targetPlayerIds: [],
            actionType: "NONE",
            actionUrl: "",
            actionData: "",
            entityType: "",
            entityId: "",
            entityData: "",
            priority: "MEDIUM",
            channels: ["in-app"],
            iconUrl: "",
            imageUrl: "",
            showBadge: false,
            scheduledAt: "",
            expiresAt: "",
            metadata: "",
            tags: [],
        },
    });

    // 편집 모드일 때 폼에 기존 데이터 채우기
    useEffect(() => {
        if (editingNotification) {
            form.reset({
                type: editingNotification.type,
                category: editingNotification.category,
                title: editingNotification.title,
                message: editingNotification.message,
                description: editingNotification.description || "",
                targetType: "SPECIFIC_PLAYERS", // 편집 시에는 특정 사용자로 설정
                targetPlayerIds: [],
                actionType: editingNotification.actionType,
                actionUrl: editingNotification.actionUrl || "",
                actionData: editingNotification.actionData
                    ? JSON.stringify(editingNotification.actionData)
                    : "",
                entityType: editingNotification.entityType || "",
                entityId: editingNotification.entityId || "",
                entityData: editingNotification.entityData
                    ? JSON.stringify(editingNotification.entityData)
                    : "",
                betAmount: editingNotification.betAmount || undefined,
                winAmount: editingNotification.winAmount || undefined,
                rewardAmount: editingNotification.rewardAmount || undefined,
                priority: editingNotification.priority,
                channels: editingNotification.sentChannels,
                iconUrl: editingNotification.iconUrl || "",
                imageUrl: editingNotification.imageUrl || "",
                showBadge: editingNotification.showBadge,
                scheduledAt: editingNotification.scheduledAt
                    ? new Date(editingNotification.scheduledAt)
                          .toISOString()
                          .slice(0, 16)
                    : "",
                expiresAt: editingNotification.expiresAt
                    ? new Date(editingNotification.expiresAt)
                          .toISOString()
                          .slice(0, 16)
                    : "",
                metadata: editingNotification.metadata
                    ? JSON.stringify(editingNotification.metadata)
                    : "",
                tags: editingNotification.tags,
            });
        }
    }, [editingNotification, form]);

    const watchedTargetType = form.watch("targetType");

    const onSubmit = async (data: CreateNotificationForm) => {
        try {
            // 메타데이터 파싱
            const parsedActionData = data.actionData
                ? JSON.parse(data.actionData)
                : undefined;
            const parsedEntityData = data.entityData
                ? JSON.parse(data.entityData)
                : undefined;
            const parsedMetadata = data.metadata
                ? JSON.parse(data.metadata)
                : undefined;

            if (isEditing && editingNotification) {
                // 편집 모드
                await updateNotification({
                    notificationId: editingNotification.id,
                    input: {
                        type: data.type as NotificationType,
                        category: data.category as NotificationCategory,
                        title: data.title,
                        message: data.message,
                        description: data.description,
                        actionType: data.actionType as NotificationActionType,
                        actionUrl: data.actionUrl,
                        actionData: parsedActionData,
                        entityType: data.entityType,
                        entityId: data.entityId,
                        entityData: parsedEntityData,
                        betAmount: data.betAmount,
                        winAmount: data.winAmount,
                        rewardAmount: data.rewardAmount,
                        priority: data.priority as NotificationPriority,
                        channels: data.channels,
                        iconUrl: data.iconUrl,
                        imageUrl: data.imageUrl,
                        showBadge: data.showBadge,
                        scheduledAt: data.scheduledAt
                            ? new Date(data.scheduledAt)
                            : undefined,
                        expiresAt: data.expiresAt
                            ? new Date(data.expiresAt)
                            : undefined,
                        metadata: parsedMetadata,
                        tags: data.tags,
                    },
                });

                onEditComplete?.();
            } else {
                // 생성 모드
                if (data.targetType === "ALL" || data.targetType === "FILTER") {
                    // 대량 알림 생성
                    const targetPlayerIds = await getFilteredPlayerIds(); // 필터 조건에 맞는 플레이어 ID 조회 로직 필요

                    await createBulkNotifications({
                        playerIds: targetPlayerIds,
                        notificationData: {
                            type: data.type as NotificationType,
                            category: data.category as NotificationCategory,
                            title: data.title,
                            message: data.message,
                            description: data.description,
                            actionType:
                                data.actionType as NotificationActionType,
                            actionUrl: data.actionUrl,
                            actionData: parsedActionData,
                            entityType: data.entityType,
                            entityId: data.entityId,
                            entityData: parsedEntityData,
                            betAmount: data.betAmount,
                            winAmount: data.winAmount,
                            rewardAmount: data.rewardAmount,
                            priority: data.priority as NotificationPriority,
                            channels: data.channels,
                            iconUrl: data.iconUrl,
                            imageUrl: data.imageUrl,
                            showBadge: data.showBadge,
                            scheduledAt: data.scheduledAt
                                ? new Date(data.scheduledAt)
                                : undefined,
                            expiresAt: data.expiresAt
                                ? new Date(data.expiresAt)
                                : undefined,
                            metadata: parsedMetadata,
                            tags: data.tags,
                        },
                    });
                } else {
                    // 개별 알림 생성
                    for (const playerId of data.targetPlayerIds || []) {
                        await createNotification({
                            playerId,
                            type: data.type as NotificationType,
                            category: data.category as NotificationCategory,
                            title: data.title,
                            message: data.message,
                            description: data.description,
                            actionType:
                                data.actionType as NotificationActionType,
                            actionUrl: data.actionUrl,
                            actionData: parsedActionData,
                            entityType: data.entityType,
                            entityId: data.entityId,
                            entityData: parsedEntityData,
                            betAmount: data.betAmount,
                            winAmount: data.winAmount,
                            rewardAmount: data.rewardAmount,
                            priority: data.priority as NotificationPriority,
                            channels: data.channels,
                            iconUrl: data.iconUrl,
                            imageUrl: data.imageUrl,
                            showBadge: data.showBadge,
                            scheduledAt: data.scheduledAt
                                ? new Date(data.scheduledAt)
                                : undefined,
                            expiresAt: data.expiresAt
                                ? new Date(data.expiresAt)
                                : undefined,
                            metadata: parsedMetadata,
                            tags: data.tags,
                        });
                    }
                }

                // 폼 초기화
                form.reset();
                setTargetPlayerEmails("");
            }
        } catch (error) {
            console.error(`알림 ${isEditing ? "수정" : "생성"} 실패:`, error);
        }
    };

    const getFilteredPlayerIds = async (): Promise<string[]> => {
        // TODO: 실제 필터 조건에 맞는 플레이어 ID들을 조회하는 로직
        return ["player1", "player2", "player3"];
    };

    const parsePlayerEmails = () => {
        // 이메일 목록을 파싱해서 플레이어 ID로 변환하는 로직
        const emails = targetPlayerEmails
            .split(",")
            .map((email) => email.trim())
            .filter(Boolean);
        // TODO: 이메일로 플레이어 ID 조회 로직
        form.setValue("targetPlayerIds", emails); // 임시로 이메일을 ID로 사용
    };

    const renderPreview = () => {
        const formData = form.getValues();
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        알림 미리보기
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="p-4 border rounded-lg bg-muted/20">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                                {formData.priority === "URGENT" && (
                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                )}
                                {formData.priority === "HIGH" && (
                                    <Bell className="h-5 w-5 text-orange-500" />
                                )}
                                {formData.priority === "MEDIUM" && (
                                    <Bell className="h-5 w-5 text-blue-500" />
                                )}
                                {formData.priority === "LOW" && (
                                    <Bell className="h-5 w-5 text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold">
                                        {formData.title || "제목"}
                                    </h4>
                                    <Badge
                                        variant="outline"
                                        className="text-xs"
                                    >
                                        {formData.category}
                                    </Badge>
                                    {formData.showBadge && (
                                        <Badge className="text-xs">NEW</Badge>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                    {formData.message || "메시지"}
                                </p>
                                {formData.description && (
                                    <p className="text-xs text-muted-foreground">
                                        {formData.description}
                                    </p>
                                )}
                                {formData.actionType !== "NONE" && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="mt-2"
                                    >
                                        {formData.actionType === "OPEN_URL" &&
                                            "링크 열기"}
                                        {formData.actionType === "OPEN_POLL" &&
                                            "폴 보기"}
                                        {formData.actionType ===
                                            "CLAIM_REWARD" && "보상 수령"}
                                        {formData.actionType === "NONE" &&
                                            "액션 없음"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-muted-foreground">
                        우선순위: {formData.priority} | 채널:{" "}
                        {formData.channels.join(", ")} | 타입: {formData.type}
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">
                        {isEditing ? "알림 수정" : "새 알림 생성"}
                    </h1>
                    <p className="text-muted-foreground">
                        {isEditing
                            ? "기존 알림을 수정합니다"
                            : "사용자에게 보낼 알림을 생성합니다"}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        {isPreviewMode ? "편집 모드" : "미리보기"}
                    </Button>
                    {isEditing && onEditComplete && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onEditComplete}
                        >
                            취소
                        </Button>
                    )}
                </div>
            </div>

            {isPreviewMode ? (
                renderPreview()
            ) : (
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        <Tabs defaultValue="basic" className="space-y-4">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="basic">
                                    기본 정보
                                </TabsTrigger>
                                <TabsTrigger value="target">
                                    타겟 설정
                                </TabsTrigger>
                                <TabsTrigger value="action">
                                    액션 설정
                                </TabsTrigger>
                                <TabsTrigger value="advanced">
                                    고급 설정
                                </TabsTrigger>
                            </TabsList>

                            {/* 기본 정보 탭 */}
                            <TabsContent value="basic" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>기본 정보</CardTitle>
                                        <CardDescription>
                                            알림의 기본 정보를 입력하세요
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="type"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            알림 타입
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={
                                                                field.onChange
                                                            }
                                                            defaultValue={
                                                                field.value
                                                            }
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="알림 타입 선택" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="GENERAL_INFO">
                                                                    일반 정보
                                                                </SelectItem>
                                                                <SelectItem value="SYSTEM_MAINTENANCE">
                                                                    시스템 점검
                                                                </SelectItem>
                                                                <SelectItem value="PROMOTIONAL">
                                                                    프로모션
                                                                </SelectItem>
                                                                <SelectItem value="WELCOME">
                                                                    환영 메시지
                                                                </SelectItem>
                                                                <SelectItem value="BETTING_SUCCESS">
                                                                    베팅 성공
                                                                </SelectItem>
                                                                <SelectItem value="POLL_BETTING_WIN">
                                                                    베팅 당첨
                                                                </SelectItem>
                                                                <SelectItem value="QUEST_COMPLETED">
                                                                    퀘스트 완료
                                                                </SelectItem>
                                                                <SelectItem value="RAFFLE_WIN">
                                                                    래플 당첨
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="category"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            카테고리
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={
                                                                field.onChange
                                                            }
                                                            defaultValue={
                                                                field.value
                                                            }
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="카테고리 선택" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="GENERAL">
                                                                    일반
                                                                </SelectItem>
                                                                <SelectItem value="SYSTEM">
                                                                    시스템
                                                                </SelectItem>
                                                                <SelectItem value="BETTING">
                                                                    베팅
                                                                </SelectItem>
                                                                <SelectItem value="POLLS">
                                                                    폴
                                                                </SelectItem>
                                                                <SelectItem value="QUESTS">
                                                                    퀘스트
                                                                </SelectItem>
                                                                <SelectItem value="RAFFLES">
                                                                    래플
                                                                </SelectItem>
                                                                <SelectItem value="SOCIAL">
                                                                    소셜
                                                                </SelectItem>
                                                                <SelectItem value="EVENTS">
                                                                    이벤트
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="title"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        제목 *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="알림 제목을 입력하세요"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="message"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        메시지 *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="알림 메시지를 입력하세요"
                                                            className="min-h-[100px]"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        상세 설명 (선택사항)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="추가 설명이 필요한 경우 입력하세요"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="priority"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            우선순위
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={
                                                                field.onChange
                                                            }
                                                            defaultValue={
                                                                field.value
                                                            }
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="우선순위 선택" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="LOW">
                                                                    낮음
                                                                </SelectItem>
                                                                <SelectItem value="MEDIUM">
                                                                    보통
                                                                </SelectItem>
                                                                <SelectItem value="HIGH">
                                                                    높음
                                                                </SelectItem>
                                                                <SelectItem value="URGENT">
                                                                    긴급
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="showBadge"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-base">
                                                                뱃지 표시
                                                            </FormLabel>
                                                            <FormDescription>
                                                                알림에 NEW
                                                                뱃지를
                                                                표시합니다
                                                            </FormDescription>
                                                        </div>
                                                        <FormControl>
                                                            <Switch
                                                                checked={
                                                                    field.value
                                                                }
                                                                onCheckedChange={
                                                                    field.onChange
                                                                }
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* 타겟 설정 탭 */}
                            <TabsContent value="target" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Target className="h-5 w-5" />
                                            타겟 설정
                                        </CardTitle>
                                        <CardDescription>
                                            알림을 받을 사용자를 설정하세요
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="targetType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        타겟 타입
                                                    </FormLabel>
                                                    <Select
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        defaultValue={
                                                            field.value
                                                        }
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="타겟 타입 선택" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="ALL">
                                                                모든 사용자
                                                            </SelectItem>
                                                            <SelectItem value="SPECIFIC_PLAYERS">
                                                                특정 사용자
                                                            </SelectItem>
                                                            <SelectItem value="FILTER">
                                                                조건 필터링
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {watchedTargetType ===
                                            "SPECIFIC_PLAYERS" && (
                                            <div className="space-y-2">
                                                <Label htmlFor="targetEmails">
                                                    사용자 이메일 목록
                                                </Label>
                                                <Textarea
                                                    id="targetEmails"
                                                    placeholder="이메일을 쉼표로 구분하여 입력하세요&#10;예: user1@example.com, user2@example.com"
                                                    value={targetPlayerEmails}
                                                    onChange={(e) =>
                                                        setTargetPlayerEmails(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="min-h-[100px]"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={parsePlayerEmails}
                                                >
                                                    이메일 파싱
                                                </Button>
                                            </div>
                                        )}

                                        {watchedTargetType === "FILTER" && (
                                            <Alert>
                                                <Info className="h-4 w-4" />
                                                <AlertDescription>
                                                    필터 조건은 현재 개발
                                                    중입니다. 임시로 최근 활성
                                                    사용자에게 발송됩니다.
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* 액션 설정 탭 */}
                            <TabsContent value="action" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Link className="h-5 w-5" />
                                            액션 설정
                                        </CardTitle>
                                        <CardDescription>
                                            알림 클릭 시 실행할 액션을
                                            설정하세요
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="actionType"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        액션 타입
                                                    </FormLabel>
                                                    <Select
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        defaultValue={
                                                            field.value
                                                        }
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="액션 타입 선택" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="NONE">
                                                                액션 없음
                                                            </SelectItem>
                                                            <SelectItem value="OPEN_APP">
                                                                앱 열기
                                                            </SelectItem>
                                                            <SelectItem value="OPEN_URL">
                                                                URL 열기
                                                            </SelectItem>
                                                            <SelectItem value="OPEN_POLL">
                                                                폴 열기
                                                            </SelectItem>
                                                            <SelectItem value="OPEN_QUEST">
                                                                퀘스트 열기
                                                            </SelectItem>
                                                            <SelectItem value="OPEN_RAFFLE">
                                                                래플 열기
                                                            </SelectItem>
                                                            <SelectItem value="CLAIM_REWARD">
                                                                보상 수령
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {form.watch("actionType") !==
                                            "NONE" && (
                                            <FormField
                                                control={form.control}
                                                name="actionUrl"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            액션 URL
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="예: /polls/123, https://example.com"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            액션 실행 시 이동할
                                                            URL을 입력하세요
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* 고급 설정 탭 */}
                            <TabsContent value="advanced" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calendar className="h-5 w-5" />
                                            고급 설정
                                        </CardTitle>
                                        <CardDescription>
                                            스케줄링, 채널, 메타데이터 등을
                                            설정하세요
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="scheduledAt"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            예약 발송 시간
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="datetime-local"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            지정하지 않으면 즉시
                                                            발송됩니다
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="expiresAt"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            만료 시간
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="datetime-local"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            이 시간 이후 알림은
                                                            숨겨집니다
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="iconUrl"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            아이콘 URL
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="https://example.com/icon.svg"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="imageUrl"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            이미지 URL
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="https://example.com/image.jpg"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="metadata"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        메타데이터 (JSON)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder='{"key": "value", "custom": "data"}'
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        추가 데이터를 JSON
                                                        형식으로 입력하세요
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                        {/* 액션 버튼 */}
                        <div className="flex items-center gap-4 pt-6 border-t">
                            <Button
                                type="submit"
                                disabled={
                                    isCreateNotificationPending ||
                                    isCreateBulkNotificationsPending ||
                                    isUpdateNotificationPending
                                }
                                className="flex items-center gap-2"
                            >
                                {isEditing ? (
                                    <Edit className="h-4 w-4" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                                {isCreateNotificationPending ||
                                isCreateBulkNotificationsPending ||
                                isUpdateNotificationPending
                                    ? `${isEditing ? "수정" : "발송"} 중...`
                                    : `알림 ${isEditing ? "수정" : "발송"}`}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => form.reset()}
                            >
                                {isEditing ? "원래대로" : "초기화"}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsPreviewMode(!isPreviewMode)}
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                미리보기
                            </Button>
                        </div>
                    </form>
                </Form>
            )}
        </div>
    );
}
