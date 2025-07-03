/// components/admin/quests/Admin.Quest.Table.tsx

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
    GripVertical,
} from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Quest, Artist, Asset } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/tailwind";

type QuestWithRelations = Quest & {
    artist?: Artist | null;
    rewardAsset?: Asset | null;
};

interface QuestsTableProps {
    quests: QuestWithRelations[];
    onEdit: (quest: Quest) => void;
    onDelete: (quest: Quest) => void;
    onActiveChange: (quest: Quest) => void;
    onOrderChange: (quests: QuestWithRelations[]) => void;
    showOrderChange: boolean;
    onToggleOrderChange: () => void;
}

// Sortable Row Component
function SortableQuestRow({
    quest,
    onEdit,
    onDelete,
    onActiveChange,
    showOrderChange,
}: {
    quest: QuestWithRelations;
    onEdit: (quest: Quest) => void;
    onDelete: (quest: Quest) => void;
    onActiveChange: (quest: Quest) => void;
    showOrderChange: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: quest.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const getQuestTypeInfo = (quest: Quest) => {
        if (quest.questType === "REFERRAL") {
            return {
                icon: <UserPlus className="w-4 h-4 text-purple-400" />,
                label: "추천",
                className:
                    "bg-purple-500/20 text-purple-300 border-purple-500/50",
            };
        }
        return {
            icon: <Link className="w-4 h-4 text-blue-400" />,
            label: "URL",
            className: "bg-blue-500/20 text-blue-300 border-blue-500/50",
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

    const questType = getQuestTypeInfo(quest);
    const artistInfo = getArtistInfo(quest);

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={cn(
                "hover:bg-slate-700/30 transition-colors",
                quest.questType === "REFERRAL" &&
                    "border-l-2 border-purple-400/50"
            )}
        >
            {/* 드래그 핸들 */}
            {showOrderChange && (
                <td className="px-2 py-4">
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab hover:cursor-grabbing p-2 text-slate-400 hover:text-slate-200 transition-colors rounded hover:bg-slate-600/50"
                        title="드래그하여 순서 변경"
                    >
                        <GripVertical className="w-4 h-4" />
                    </div>
                </td>
            )}

            {/* 아이콘 */}
            <td className="px-4 py-4">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-700/50 flex items-center justify-center">
                    {quest.icon ? (
                        <img
                            src={quest.icon}
                            alt={quest.title}
                            className="w-8 h-8 object-contain"
                        />
                    ) : (
                        <Gift className="w-6 h-6 text-slate-400" />
                    )}
                </div>
            </td>

            {/* 퀘스트 정보 */}
            <td className="px-4 py-4">
                <div className="space-y-1">
                    <h3 className="font-semibold text-white text-sm leading-tight">
                        {quest.title}
                    </h3>
                    {quest.description && (
                        <p className="text-xs text-slate-400 line-clamp-2">
                            {quest.description}
                        </p>
                    )}
                </div>
            </td>

            {/* 타입 */}
            <td className="px-4 py-4">
                <Badge variant="outline" className={questType.className}>
                    <div className="flex items-center gap-1">
                        {questType.icon}
                        <span>{questType.label}</span>
                    </div>
                </Badge>
            </td>

            {/* 분류 */}
            <td className="px-4 py-4">
                <Badge variant="outline" className={artistInfo.className}>
                    <div className="flex items-center gap-1">
                        {artistInfo.icon}
                        <span>{artistInfo.label}</span>
                    </div>
                </Badge>
            </td>

            {/* 보상 */}
            <td className="px-4 py-4">
                {quest.rewardAmount && quest.rewardAsset ? (
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
                ) : (
                    <span className="text-slate-500 text-sm">보상 없음</span>
                )}
            </td>

            {/* 반복 여부 */}
            <td className="px-4 py-4">
                {quest.repeatable ? (
                    <Badge
                        variant="outline"
                        className="bg-green-500/20 text-green-300 border-green-500/50"
                    >
                        <div className="flex items-center gap-1">
                            <Repeat className="w-3 h-3" />
                            <span>
                                {quest.repeatableCount
                                    ? `${quest.repeatableCount}회`
                                    : "무제한"}
                            </span>
                        </div>
                    </Badge>
                ) : (
                    <Badge
                        variant="outline"
                        className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50"
                    >
                        <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            <span>일회성</span>
                        </div>
                    </Badge>
                )}
            </td>

            {/* 일정 */}
            <td className="px-4 py-4">
                <div className="space-y-1 text-xs">
                    {quest.startDate ? (
                        <div className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>시작: {formatDate(quest.startDate)}</span>
                        </div>
                    ) : (
                        <div className="text-slate-500">시작일 없음</div>
                    )}
                    {quest.endDate ? (
                        <div className="text-slate-400">
                            종료: {formatDate(quest.endDate)}
                        </div>
                    ) : (
                        <div className="text-slate-500">종료일 없음</div>
                    )}
                </div>
            </td>

            {/* 상태 */}
            <td className="px-4 py-4">
                <div className="space-y-2">
                    <Badge
                        variant="outline"
                        className={
                            quest.isActive
                                ? "bg-green-500/20 text-green-300 border-green-500/50"
                                : "bg-gray-500/20 text-gray-300 border-gray-500/50"
                        }
                    >
                        {quest.isActive ? "활성" : "비활성"}
                    </Badge>
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={quest.isActive}
                            onCheckedChange={() => onActiveChange(quest)}
                        />
                        <span className="text-xs text-slate-400">
                            {quest.isActive ? "ON" : "OFF"}
                        </span>
                    </div>
                </div>
            </td>

            {/* 관리 */}
            <td className="px-4 py-4">
                <div className="flex items-center justify-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(quest)}
                        className="bg-slate-700/50 border-slate-600 hover:bg-slate-600 text-white"
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
            </td>
        </tr>
    );
}

export default function QuestsTable({
    quests,
    onEdit,
    onDelete,
    onActiveChange,
    onOrderChange,
    showOrderChange,
}: QuestsTableProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = quests.findIndex((item) => item.id === active.id);
            const newIndex = quests.findIndex((item) => item.id === over.id);

            const newQuests = arrayMove(quests, oldIndex, newIndex).map(
                (quest, index) => ({
                    ...quest,
                    order: index * 10,
                })
            );

            onOrderChange(newQuests);
        }
    };

    return (
        <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700/50 backdrop-blur-sm overflow-hidden">
            {/* 순서 변경 컨트롤 */}
            {showOrderChange && (
                <div className="px-6 py-3 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-b border-yellow-600/30">
                    <div className="flex items-center gap-2 text-yellow-300">
                        <GripVertical className="w-4 h-4" />
                        <span className="text-sm font-medium">
                            드래그하여 퀘스트 순서를 변경하세요
                        </span>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <table className="w-full">
                        {/* 헤더 */}
                        <thead className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 border-b border-slate-600/50">
                            <tr>
                                {showOrderChange && (
                                    <th className="px-2 py-4 text-left text-sm font-semibold text-slate-200">
                                        순서
                                    </th>
                                )}
                                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-200">
                                    아이콘
                                </th>
                                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-200">
                                    퀘스트 정보
                                </th>
                                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-200">
                                    타입
                                </th>
                                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-200">
                                    분류
                                </th>
                                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-200">
                                    보상
                                </th>
                                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-200">
                                    반복
                                </th>
                                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-200">
                                    일정
                                </th>
                                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-200">
                                    상태
                                </th>
                                <th className="px-4 py-4 text-center text-sm font-semibold text-slate-200">
                                    관리
                                </th>
                            </tr>
                        </thead>

                        {/* 바디 */}
                        <tbody className="divide-y divide-slate-700/50">
                            <SortableContext
                                items={quests.map((quest) => quest.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {quests.map((quest) => (
                                    <SortableQuestRow
                                        key={quest.id}
                                        quest={quest}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onActiveChange={onActiveChange}
                                        showOrderChange={showOrderChange}
                                    />
                                ))}
                            </SortableContext>
                        </tbody>
                    </table>

                    {/* 빈 상태 */}
                    {quests.length === 0 && (
                        <div className="text-center py-12">
                            <Gift className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-300 mb-2">
                                퀘스트가 없습니다
                            </h3>
                            <p className="text-slate-400 text-sm">
                                새로운 퀘스트를 생성해보세요.
                            </p>
                        </div>
                    )}
                </DndContext>
            </div>
        </Card>
    );
}
