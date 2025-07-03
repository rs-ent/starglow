/// components/admin/quests/Admin.Quest.Cards.tsx

"use client";

import React from "react";
import {
    Edit,
    Trash2,
    Link,
    UserPlus,
    Globe,
    User,
    Repeat,
    Zap,
    Clock,
    Gift,
    Calendar,
    Trophy,
    Settings,
} from "lucide-react";
import type { Quest, Artist, Asset } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/tailwind";

type QuestWithRelations = Quest & {
    artist?: Artist | null;
    rewardAsset?: Asset | null;
};

interface QuestsCardsProps {
    quests: QuestWithRelations[];
    onEdit: (quest: Quest) => void;
    onDelete: (quest: Quest) => void;
    onActiveChange: (quest: Quest) => void;
}

export default function QuestsCards({
    quests,
    onEdit,
    onDelete,
    onActiveChange,
}: QuestsCardsProps) {
    const getQuestTypeInfo = (quest: Quest) => {
        if (quest.questType === "REFERRAL") {
            return {
                icon: <UserPlus className="w-4 h-4" />,
                label: "👥 추천 퀘스트",
                className:
                    "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50",
                cardBorder: "border-purple-400/30",
                headerBg: "bg-gradient-to-r from-purple-500/10 to-pink-500/10",
            };
        }
        return {
            icon: <Link className="w-4 h-4" />,
            label: "🔗 URL 퀘스트",
            className:
                "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/50",
            cardBorder: "border-blue-400/30",
            headerBg: "bg-gradient-to-r from-blue-500/10 to-cyan-500/10",
        };
    };

    const getArtistInfo = (quest: QuestWithRelations) => {
        if (quest.artist) {
            return {
                icon: <User className="w-4 h-4 text-purple-400" />,
                label: quest.artist.name,
                className:
                    "bg-purple-500/20 text-purple-300 border-purple-500/50",
            };
        }
        return {
            icon: <Globe className="w-4 h-4 text-blue-400" />,
            label: "World",
            className: "bg-blue-500/20 text-blue-300 border-blue-500/50",
        };
    };

    const getStatusInfo = (quest: Quest) => {
        if (!quest.isActive) {
            return {
                label: "비활성화",
                className: "bg-gray-500/20 text-gray-300 border-gray-500/50",
                dotColor: "bg-gray-400",
            };
        }

        const now = new Date();
        const isStarted = !quest.startDate || quest.startDate <= now;
        const isEnded = quest.endDate && quest.endDate <= now;

        if (!isStarted) {
            return {
                label: "예정",
                className: "bg-blue-500/20 text-blue-300 border-blue-500/50",
                dotColor: "bg-blue-400",
            };
        }

        if (isEnded) {
            return {
                label: "종료",
                className: "bg-red-500/20 text-red-300 border-red-500/50",
                dotColor: "bg-red-400",
            };
        }

        return {
            label: "진행중",
            className: "bg-green-500/20 text-green-300 border-green-500/50",
            dotColor: "bg-green-400",
        };
    };

    if (quests.length === 0) {
        return (
            <div className="text-center py-16">
                <Gift className="w-16 h-16 text-slate-400 mx-auto mb-6" />
                <h3 className="text-xl font-medium text-slate-300 mb-3">
                    퀘스트가 없습니다
                </h3>
                <p className="text-slate-400">새로운 퀘스트를 생성해보세요.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {quests.map((quest) => {
                const questType = getQuestTypeInfo(quest);
                const artistInfo = getArtistInfo(quest);
                const status = getStatusInfo(quest);

                return (
                    <Card
                        key={quest.id}
                        className={cn(
                            "group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden",
                            "bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm",
                            questType.cardBorder,
                            quest.questType === "REFERRAL" &&
                                "ring-1 ring-purple-400/20"
                        )}
                    >
                        {/* 헤더 */}
                        <CardHeader
                            className={cn("relative p-0", questType.headerBg)}
                        >
                            {/* 아이콘 배경 */}
                            <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                                {/* 패턴 오버레이 */}
                                <div className="absolute inset-0 opacity-10" />

                                {/* 중앙 아이콘 */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 flex items-center justify-center">
                                        {quest.icon ? (
                                            <img
                                                src={quest.icon}
                                                alt={quest.title}
                                                className="w-10 h-10 object-contain"
                                            />
                                        ) : (
                                            <Gift className="w-10 h-10 text-slate-400" />
                                        )}
                                    </div>
                                </div>

                                {/* 배지들 */}
                                <div className="absolute top-3 left-3 flex gap-2">
                                    <Badge
                                        variant="outline"
                                        className={questType.className}
                                    >
                                        <div className="flex items-center gap-1">
                                            {questType.icon}
                                            <span className="text-xs">
                                                {questType.label}
                                            </span>
                                        </div>
                                    </Badge>
                                </div>

                                {/* 상태 */}
                                <div className="absolute top-3 right-3">
                                    <Badge
                                        variant="outline"
                                        className={status.className}
                                    >
                                        <div className="flex items-center gap-1">
                                            <div
                                                className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    status.dotColor
                                                )}
                                            />
                                            <span className="text-xs">
                                                {status.label}
                                            </span>
                                        </div>
                                    </Badge>
                                </div>

                                {/* 아티스트 정보 */}
                                <div className="absolute bottom-3 left-3">
                                    <Badge
                                        variant="outline"
                                        className={artistInfo.className}
                                    >
                                        <div className="flex items-center gap-1">
                                            {artistInfo.icon}
                                            <span className="text-xs">
                                                {artistInfo.label}
                                            </span>
                                        </div>
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>

                        {/* 컨텐츠 */}
                        <CardContent className="p-4 space-y-4">
                            {/* 제목 */}
                            <div>
                                <h3 className="font-semibold text-white text-lg leading-tight mb-1">
                                    {quest.title}
                                </h3>
                                {quest.description && (
                                    <p className="text-sm text-slate-400 line-clamp-2">
                                        {quest.description}
                                    </p>
                                )}
                            </div>

                            {/* 보상 정보 */}
                            {quest.rewardAmount && quest.rewardAsset ? (
                                <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Trophy className="w-4 h-4 text-yellow-400" />
                                        <span className="text-xs text-slate-400">
                                            보상
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {quest.rewardAsset.iconUrl && (
                                            <img
                                                src={quest.rewardAsset.iconUrl}
                                                alt={quest.rewardAsset.name}
                                                className="w-6 h-6 rounded-full"
                                            />
                                        )}
                                        <div>
                                            <div className="text-white font-medium">
                                                {quest.rewardAmount.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {quest.rewardAsset.symbol}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3 bg-slate-700/20 rounded-lg border border-slate-600/20">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Gift className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs text-slate-400">
                                            보상
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-500">
                                        보상 없음
                                    </div>
                                </div>
                            )}

                            {/* 반복 및 일정 정보 */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* 반복 여부 */}
                                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        {quest.repeatable ? (
                                            <Repeat className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <Zap className="w-4 h-4 text-yellow-400" />
                                        )}
                                        <span className="text-xs text-slate-400">
                                            반복
                                        </span>
                                    </div>
                                    <div className="text-sm font-medium text-white">
                                        {quest.repeatable
                                            ? quest.repeatableCount
                                                ? `${quest.repeatableCount}회`
                                                : "무제한"
                                            : "일회성"}
                                    </div>
                                </div>

                                {/* 순서 */}
                                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Settings className="w-4 h-4 text-blue-400" />
                                        <span className="text-xs text-slate-400">
                                            순서
                                        </span>
                                    </div>
                                    <div className="text-sm font-medium text-white">
                                        {quest.order || 0}
                                    </div>
                                </div>
                            </div>

                            {/* 일정 정보 */}
                            {(quest.startDate || quest.endDate) && (
                                <div className="space-y-2">
                                    {quest.startDate && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-blue-400" />
                                            <span className="text-slate-400">
                                                시작:
                                            </span>
                                            <span className="text-white">
                                                {formatDate(quest.startDate)}
                                            </span>
                                        </div>
                                    )}
                                    {quest.endDate && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="w-4 h-4 text-red-400" />
                                            <span className="text-slate-400">
                                                종료:
                                            </span>
                                            <span className="text-white">
                                                {formatDate(quest.endDate)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 활성화 토글 */}
                            <div className="flex items-center justify-between p-3 bg-slate-700/20 rounded-lg">
                                <span className="text-sm text-slate-300">
                                    활성화 상태
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400">
                                        {quest.isActive ? "활성" : "비활성"}
                                    </span>
                                    <Switch
                                        checked={quest.isActive}
                                        onCheckedChange={() =>
                                            onActiveChange(quest)
                                        }
                                    />
                                </div>
                            </div>

                            {/* 액션 버튼들 */}
                            <div className="flex gap-2 pt-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onEdit(quest)}
                                    className="flex-1 bg-slate-700/50 border-slate-600 hover:bg-slate-600 text-white"
                                >
                                    <Edit className="w-3 h-3 mr-1" />
                                    수정
                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onDelete(quest)}
                                    className="bg-red-500/20 border-red-500/50 hover:bg-red-500/30 text-red-300"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
