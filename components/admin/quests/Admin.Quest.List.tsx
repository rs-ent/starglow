/// components/admin/quests/Admin.Quest.List.tsx

"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
    LayoutGrid,
    List,
    Plus,
    RefreshCw,
    Link,
    UserPlus,
    GripVertical,
    BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Quest, Artist, Asset } from "@prisma/client";

import { useArtistsGet } from "@/app/hooks/useArtists";
import { useAssetsGet } from "@/app/actions/assets/hooks";
import { useQuestGet, useQuestSet } from "@/app/hooks/useQuest";
import { useToast } from "@/app/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Import new components
import QuestsFilter, { type QuestFilterState } from "./Admin.Quest.Filter";
import QuestsTable from "./Admin.Quest.Table";
import QuestsCards from "./Admin.Quest.Cards";
import AdminQuestCreate from "./Admin.Quest.Create";

type QuestWithRelations = Quest & {
    artist?: Artist | null;
    rewardAsset?: Asset | null;
};

export default function AdminQuestList() {
    const router = useRouter();
    const { quests, isLoading, error } = useQuestGet({}) as {
        quests: { items: QuestWithRelations[] };
        isLoading: boolean;
        error: Error | null;
    };
    const { artists } = useArtistsGet({});
    const { assets } = useAssetsGet({
        getAssetsInput: { isActive: true },
    });
    const { deleteQuest, updateQuestOrder, updateQuestActive } = useQuestSet();
    const toast = useToast();

    // State management
    const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [showOrderChange, setShowOrderChange] = useState(false);
    const [viewMode, setViewMode] = useState<"table" | "cards">("table");
    const [filteredQuests, setFilteredQuests] = useState<QuestWithRelations[]>(
        []
    );
    const [sortedQuests, setSortedQuests] = useState<QuestWithRelations[]>([]);

    // Filter state
    const [filter, setFilter] = useState<QuestFilterState>({
        search: "",
        questType: "all",
        artistType: "all",
        artistId: "",
        repeatable: "all",
        activeStatus: "all",
        rewardAssetId: "",
    });

    // Registered types for quest creation
    const registeredTypes = useMemo(() => {
        if (!quests) return [];
        return [
            ...new Set(
                quests.items
                    .filter(
                        (
                            quest
                        ): quest is QuestWithRelations & { type: string } =>
                            quest.type !== null && quest.type !== undefined
                    )
                    .map((quest) => quest.type)
            ),
        ];
    }, [quests]);

    // Filter quests based on current filter state
    const applyFilters = useCallback(() => {
        if (!quests?.items) return;

        const filtered = quests.items.filter((quest) => {
            // Search filter
            if (
                filter.search &&
                !quest.title.toLowerCase().includes(filter.search.toLowerCase())
            ) {
                return false;
            }

            // Quest type filter
            if (
                filter.questType !== "all" &&
                quest.questType !== filter.questType
            ) {
                return false;
            }

            // Artist type filter
            if (filter.artistType === "world" && quest.artistId) {
                return false;
            }
            if (filter.artistType === "exclusive" && !quest.artistId) {
                return false;
            }

            // Specific artist filter
            if (filter.artistId && quest.artistId !== filter.artistId) {
                return false;
            }

            // Repeatable filter
            if (filter.repeatable === "repeatable" && !quest.repeatable) {
                return false;
            }
            if (filter.repeatable === "single" && quest.repeatable) {
                return false;
            }

            // Active status filter
            if (filter.activeStatus === "active" && !quest.isActive) {
                return false;
            }
            if (filter.activeStatus === "inactive" && quest.isActive) {
                return false;
            }

            // Reward asset filter
            if (
                filter.rewardAssetId &&
                quest.rewardAsset?.id !== filter.rewardAssetId
            ) {
                return false;
            }

            return true;
        });

        setFilteredQuests(filtered);
    }, [quests, filter]);

    // Apply filters when quest data or filter changes
    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    // Sort quests by order
    useEffect(() => {
        const sorted = [...filteredQuests].sort(
            (a, b) => (a.order || 0) - (b.order || 0)
        );
        setSortedQuests(sorted);
    }, [filteredQuests]);

    // Event handlers
    const handleEdit = (quest: Quest) => {
        setSelectedQuest(quest);
        setShowCreate(true);
    };

    const handleDelete = async (quest: Quest) => {
        const confirm = window.confirm(
            `『${quest.title}』\n퀘스트를 삭제하시겠습니까?`
        );
        if (confirm) {
            const result = await deleteQuest({ id: quest.id });
            if (result) {
                toast.success(`『${quest.title}』 퀘스트를 삭제했습니다.`);
            } else {
                toast.error(`『${quest.title}』 퀘스트 삭제에 실패했습니다.`);
            }
        }
    };

    const handleCreateModalClose = () => {
        setSelectedQuest(null);
        setShowCreate(false);
    };

    const handleOrderChange = async (newQuests: QuestWithRelations[]) => {
        setSortedQuests(newQuests);
        setFilteredQuests(newQuests);
    };

    const handleSaveOrderChange = async () => {
        const result = await updateQuestOrder({
            quests: sortedQuests.map((quest) => ({
                id: quest.id,
                order: quest.order ?? 0,
            })),
        });
        if (result) {
            toast.success("퀘스트 순서 변경 사항을 저장했습니다.");
            setShowOrderChange(false);
        } else {
            toast.error("퀘스트 순서 변경 사항을 저장하는데 실패했습니다.");
        }
    };

    const handleActiveChange = async (quest: Quest) => {
        const result = await updateQuestActive({
            questId: quest.id,
            isActive: !quest.isActive,
        });

        if (result) {
            toast.success(
                `『${quest.title}』 퀘스트가 ${
                    quest.isActive ? "비활성화" : "활성화"
                }되었습니다.`
            );
        } else {
            toast.error(`『${quest.title}』 퀘스트 상태 변경에 실패했습니다.`);
        }
    };

    // Statistics
    const stats = useMemo(() => {
        const total = filteredQuests.length;
        const active = filteredQuests.filter((q) => q.isActive).length;
        const url = filteredQuests.filter((q) => q.questType === "URL").length;
        const referral = filteredQuests.filter(
            (q) => q.questType === "REFERRAL"
        ).length;
        const world = filteredQuests.filter((q) => !q.artistId).length;
        const exclusive = filteredQuests.filter((q) => q.artistId).length;

        return { total, active, url, referral, world, exclusive };
    }, [filteredQuests]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-green-400 mx-auto mb-4" />
                    <p className="text-slate-400">퀘스트를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-400">오류 발생: {error.message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Modal */}
            {showCreate && (
                <AdminQuestCreate
                    onClose={handleCreateModalClose}
                    mode={selectedQuest ? "edit" : "create"}
                    open={showCreate}
                    initialData={selectedQuest}
                    registeredTypes={registeredTypes}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        퀘스트 관리
                    </h1>
                    <p className="text-slate-400 mt-1">
                        사용자 퀘스트와 보상을 관리하세요
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.refresh()}
                        className="bg-slate-700/50 border-slate-600 hover:bg-slate-600 text-white"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        새로고침
                    </Button>
                    <Button
                        onClick={() => setShowCreate(true)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        퀘스트 생성
                    </Button>
                </div>
            </div>

            {/* Statistics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Total Quests */}
                <Card className="p-4 bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400">
                                전체 퀘스트
                            </p>
                            <p className="text-2xl font-bold text-white">
                                {stats.total}
                            </p>
                        </div>
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <BarChart3 className="w-6 h-6 text-green-400" />
                        </div>
                    </div>
                </Card>

                {/* Active Quests */}
                <Card className="p-4 bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-700/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-400">
                                활성 퀘스트
                            </p>
                            <p className="text-2xl font-bold text-white">
                                {stats.active}
                            </p>
                        </div>
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <BarChart3 className="w-6 h-6 text-green-400" />
                        </div>
                    </div>
                </Card>

                {/* URL Quests */}
                <Card className="p-4 bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-700/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-400">URL 퀘스트</p>
                            <p className="text-2xl font-bold text-white">
                                {stats.url}
                            </p>
                        </div>
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Link className="w-6 h-6 text-blue-400" />
                        </div>
                    </div>
                </Card>

                {/* Referral Quests */}
                <Card className="p-4 bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-700/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-purple-400">
                                추천 퀘스트
                            </p>
                            <p className="text-2xl font-bold text-white">
                                {stats.referral}
                            </p>
                        </div>
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <UserPlus className="w-6 h-6 text-purple-400" />
                        </div>
                    </div>
                </Card>

                {/* World Quests */}
                <Card className="p-4 bg-gradient-to-br from-cyan-900/20 to-cyan-800/20 border-cyan-700/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-cyan-400">
                                World 퀘스트
                            </p>
                            <p className="text-2xl font-bold text-white">
                                {stats.world}
                            </p>
                        </div>
                        <div className="p-2 bg-cyan-500/20 rounded-lg">
                            <BarChart3 className="w-6 h-6 text-cyan-400" />
                        </div>
                    </div>
                </Card>

                {/* Exclusive Quests */}
                <Card className="p-4 bg-gradient-to-br from-pink-900/20 to-pink-800/20 border-pink-700/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-pink-400">
                                아티스트 전용
                            </p>
                            <p className="text-2xl font-bold text-white">
                                {stats.exclusive}
                            </p>
                        </div>
                        <div className="p-2 bg-pink-500/20 rounded-lg">
                            <BarChart3 className="w-6 h-6 text-pink-400" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <QuestsFilter
                filter={filter}
                onFilterChange={setFilter}
                artists={artists || []}
                assets={assets?.assets || []}
            />

            {/* View Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">보기:</span>
                        <div className="flex items-center bg-slate-700/50 rounded-lg p-1">
                            <Button
                                size="sm"
                                variant={
                                    viewMode === "table" ? "secondary" : "ghost"
                                }
                                onClick={() => setViewMode("table")}
                                className="h-8 px-3"
                            >
                                <List className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant={
                                    viewMode === "cards" ? "secondary" : "ghost"
                                }
                                onClick={() => setViewMode("cards")}
                                className="h-8 px-3"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Order change toggle */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant={showOrderChange ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => {
                                if (showOrderChange) {
                                    setShowOrderChange(false);
                                } else {
                                    setShowOrderChange(true);
                                }
                            }}
                            className="bg-slate-700/50 border-slate-600 hover:bg-slate-600 text-white"
                        >
                            <GripVertical className="w-4 h-4 mr-2" />
                            {showOrderChange ? "순서 변경 취소" : "순서 변경"}
                        </Button>

                        {showOrderChange && (
                            <Button
                                size="sm"
                                onClick={handleSaveOrderChange}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                변경사항 저장
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-slate-300">
                        {stats.total}개 퀘스트
                    </Badge>
                    {filter.search && (
                        <Badge
                            variant="outline"
                            className="text-blue-300 border-blue-500/50"
                        >
                            {`"${filter.search}" 검색중`}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Content */}
            {viewMode === "table" ? (
                <QuestsTable
                    quests={quests.items}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onActiveChange={handleActiveChange}
                    onOrderChange={handleOrderChange}
                    showOrderChange={showOrderChange}
                    onToggleOrderChange={() =>
                        setShowOrderChange(!showOrderChange)
                    }
                />
            ) : (
                <QuestsCards
                    quests={quests.items}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onActiveChange={handleActiveChange}
                />
            )}
        </div>
    );
}
