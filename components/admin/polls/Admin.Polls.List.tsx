/// components/admin/polls/Admin.Polls.List.tsx

"use client";

import React, { useState, useMemo, useCallback } from "react";
import { LayoutGrid, List, Plus, RefreshCw, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Poll } from "@prisma/client";

import { useArtistsGet } from "@/app/hooks/useArtists";
import { usePollsGet, usePollsSet } from "@/app/hooks/usePolls";
import { useToast } from "@/app/hooks/useToast";
import { usePollsResultsQuery } from "@/app/queries/pollsQueries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

import PollCreateModal from "./Admin.Polls.CreateModal";
import PollsFilter, { type PollFilterState } from "./Admin.Polls.Filter";
import PollsTable from "./Admin.Polls.Table";
import PollsCards from "./Admin.Polls.Cards";

interface PollListProps {
    viewType: "table" | "card";
}

export default function AdminPollsList({
    viewType: initialViewType,
}: PollListProps) {
    const toast = useToast();
    const router = useRouter();

    // State management
    const [viewType, setViewType] = useState<"table" | "card">(initialViewType);
    const [editPoll, setEditPoll] = useState<Poll | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        itemsPerPage: 24, // Increased for better card view
    });
    const [filter, setFilter] = useState<PollFilterState>({
        search: "",
        type: "all",
        pollMode: "all",
        activeStatus: "all",
        artistId: "",
    });

    // Data fetching
    const { pollsList, isLoading, error } = usePollsGet({ pagination });
    const { updateActivePoll, deletePoll } = usePollsSet();
    const { artists } = useArtistsGet({});

    const { polls, totalPages, pollIds } = useMemo(() => {
        return {
            polls: pollsList?.items || [],
            totalPages: pollsList?.totalPages || 0,
            pollIds: pollsList?.items.map((poll) => poll.id) || [],
        };
    }, [pollsList]);

    const { data: pollsResults } = usePollsResultsQuery({ pollIds });
    const resultsData = useMemo(
        () => pollsResults?.results || [],
        [pollsResults]
    );

    // Filter logic
    const filteredPolls = useMemo(() => {
        return polls.filter((poll) => {
            // Search filter
            if (
                filter.search &&
                !poll.title.toLowerCase().includes(filter.search.toLowerCase())
            ) {
                return false;
            }

            // Type filter (world/exclusive)
            if (filter.type === "world" && poll.artistId) return false;
            if (filter.type === "exclusive" && !poll.artistId) return false;

            // Poll mode filter (regular/betting)
            if (filter.pollMode === "regular" && poll.bettingMode) return false;
            if (filter.pollMode === "betting" && !poll.bettingMode)
                return false;

            // Active status filter
            if (filter.activeStatus === "active" && !poll.isActive)
                return false;
            if (filter.activeStatus === "inactive" && poll.isActive)
                return false;

            // Artist filter
            if (filter.artistId && poll.artistId !== filter.artistId)
                return false;

            return true;
        });
    }, [polls, filter]);

    // Statistics
    const stats = useMemo(() => {
        const total = polls.length;
        const active = polls.filter((p) => p.isActive).length;
        const betting = polls.filter((p) => p.bettingMode).length;
        const totalVotes = resultsData.reduce(
            (sum, result) => sum + result.totalVotes,
            0
        );

        return { total, active, betting, totalVotes };
    }, [polls, resultsData]);

    // Handlers
    const handleEditPoll = useCallback((poll: Poll) => {
        setEditPoll(poll);
        setShowCreateModal(true);
    }, []);

    const handleDeletePoll = useCallback(
        async (pollId: string) => {
            const poll = polls.find((p) => p.id === pollId);
            if (!poll) return;

            if (
                window.confirm(`정말로 "${poll.title}" 폴을 삭제하시겠습니까?`)
            ) {
                try {
                    await deletePoll(pollId);
                    toast.success("폴이 성공적으로 삭제되었습니다.");
                    router.refresh();
                } catch (error) {
                    console.error(error);
                    toast.error("폴 삭제 중 오류가 발생했습니다.");
                }
            }
        },
        [polls, deletePoll, toast, router]
    );

    const handleActiveChange = useCallback(
        async (poll: Poll, isActive: boolean) => {
            try {
                const result = await updateActivePoll({
                    pollId: poll.id,
                    isActive,
                });

                if (result) {
                    toast.success(
                        `『${poll.title}』 폴이 ${
                            isActive ? "활성화" : "비활성화"
                        }되었습니다.`
                    );
                }
            } catch (error) {
                console.error(error);
                toast.error("폴 상태 변경 중 오류가 발생했습니다.");
            }
        },
        [updateActivePoll, toast]
    );

    const handlePageChange = useCallback((page: number) => {
        setPagination((prev) => ({ ...prev, currentPage: page }));
    }, []);

    const handleFilterChange = useCallback((newFilter: PollFilterState) => {
        setFilter(newFilter);
        setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to first page
    }, []);

    const handleModalClose = useCallback(() => {
        setShowCreateModal(false);
        setEditPoll(null);
    }, []);

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="text-red-400 mb-4">⚠️ 오류 발생</div>
                <p className="text-slate-400">{error.message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Statistics */}
            <Card className="p-6 bg-gradient-to-r from-slate-900/50 to-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-white">
                            폴 관리
                        </h1>
                        <Badge
                            variant="outline"
                            className="bg-purple-500/20 text-purple-300 border-purple-500/50"
                        >
                            Admin Dashboard
                        </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.refresh()}
                            className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            새로고침
                        </Button>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />새 폴 생성
                        </Button>
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                        <div className="text-2xl font-bold text-white">
                            {stats.total}
                        </div>
                        <div className="text-sm text-slate-400">총 폴</div>
                    </div>
                    <div className="text-center p-4 bg-green-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-300">
                            {stats.active}
                        </div>
                        <div className="text-sm text-slate-400">활성 폴</div>
                    </div>
                    <div className="text-center p-4 bg-orange-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-orange-300">
                            {stats.betting}
                        </div>
                        <div className="text-sm text-slate-400">🎰 베팅 폴</div>
                    </div>
                    <div className="text-center p-4 bg-blue-500/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-300">
                            {stats.totalVotes.toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-400">총 투표수</div>
                    </div>
                </div>
            </Card>

            {/* Filters */}
            <PollsFilter
                filter={filter}
                onFilterChange={handleFilterChange}
                artists={artists || []}
            />

            {/* View Toggle and Results Info */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1">
                        <Button
                            size="sm"
                            variant={viewType === "table" ? "default" : "ghost"}
                            onClick={() => setViewType("table")}
                            className="px-3"
                        >
                            <List className="w-4 h-4 mr-1" />
                            테이블
                        </Button>
                        <Button
                            size="sm"
                            variant={viewType === "card" ? "default" : "ghost"}
                            onClick={() => setViewType("card")}
                            className="px-3"
                        >
                            <LayoutGrid className="w-4 h-4 mr-1" />
                            카드
                        </Button>
                    </div>

                    <div className="text-sm text-slate-400">
                        총 {filteredPolls.length}개 폴
                        {filter.search ||
                        filter.type !== "all" ||
                        filter.pollMode !== "all" ||
                        filter.activeStatus !== "all" ||
                        filter.artistId
                            ? ` (${polls.length}개 중 필터링됨)`
                            : ""}
                    </div>
                </div>

                {/* Betting Mode Quick Filter */}
                <Button
                    variant="outline"
                    onClick={() =>
                        handleFilterChange({
                            ...filter,
                            pollMode:
                                filter.pollMode === "betting"
                                    ? "all"
                                    : "betting",
                        })
                    }
                    className={`
                        ${
                            filter.pollMode === "betting"
                                ? "bg-orange-500/20 border-orange-500/50 text-orange-300"
                                : "bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600"
                        }
                    `}
                >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    베팅 폴만 보기
                </Button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-400">폴을 불러오는 중...</p>
                </div>
            ) : viewType === "table" ? (
                <PollsTable
                    polls={filteredPolls}
                    results={resultsData}
                    onEdit={handleEditPoll}
                    onDelete={handleDeletePoll}
                    onActiveChange={handleActiveChange}
                />
            ) : (
                <PollsCards
                    polls={filteredPolls}
                    results={resultsData}
                    onEdit={handleEditPoll}
                    onDelete={handleDeletePoll}
                    onActiveChange={handleActiveChange}
                />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() =>
                                        handlePageChange(
                                            pagination.currentPage - 1
                                        )
                                    }
                                    className={
                                        pagination.currentPage === 1
                                            ? "pointer-events-none opacity-50"
                                            : "cursor-pointer"
                                    }
                                />
                            </PaginationItem>
                            {Array.from(
                                { length: Math.min(totalPages, 5) },
                                (_, i) => {
                                    const page = i + 1;
                                    return (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                isActive={
                                                    pagination.currentPage ===
                                                    page
                                                }
                                                onClick={() =>
                                                    handlePageChange(page)
                                                }
                                                className="cursor-pointer"
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                }
                            )}
                            <PaginationItem>
                                <PaginationNext
                                    onClick={() =>
                                        handlePageChange(
                                            pagination.currentPage + 1
                                        )
                                    }
                                    className={
                                        pagination.currentPage === totalPages
                                            ? "pointer-events-none opacity-50"
                                            : "cursor-pointer"
                                    }
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}

            {/* Create/Edit Modal */}
            <PollCreateModal
                open={showCreateModal}
                onClose={handleModalClose}
                initialData={editPoll}
                mode={editPoll ? "edit" : "create"}
            />
        </div>
    );
}
