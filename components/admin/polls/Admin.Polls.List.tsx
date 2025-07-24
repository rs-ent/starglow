/// components/admin/polls/Admin.Polls.List.tsx

"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { LayoutGrid, List, Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Poll } from "@prisma/client";

import { usePollsSet } from "@/app/hooks/usePolls";
import { useToast } from "@/app/hooks/useToast";
import { usePollsResultsQuery } from "@/app/queries/pollsQueries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import PollCreateModal from "./Admin.Polls.CreateModal";
import PollsTable from "./Admin.Polls.Table";
import PollsCards from "./Admin.Polls.Cards";
import { getPollsForAdmin } from "@/app/actions/polls";

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

    const [polls, setPolls] = useState<Poll[]>([]);

    const fetchPolls = useCallback(async () => {
        const polls = await getPollsForAdmin();
        setPolls(polls);
    }, []);

    useEffect(() => {
        fetchPolls().catch((error) => {
            console.error("Error!", error);
        });
    }, []);

    const { updateActivePoll, deletePoll } = usePollsSet();

    const { data: pollsResults } = usePollsResultsQuery({
        pollIds: polls.map((poll) => poll.id),
    });
    const resultsData = useMemo(
        () => pollsResults?.results || [],
        [pollsResults]
    );

    // Statistics
    const stats = useMemo(() => {
        const total = polls.length;
        const active = polls.filter((p) => p.isActive).length;
        const betting = polls.filter((p) => p.bettingMode).length;

        // 베팅 모드와 일반 모드를 구분하여 계산
        let totalVotes = 0;
        let totalActualVotes = 0;

        resultsData.forEach((result) => {
            totalVotes += result.totalVotes;
            // 실제 득표수 계산 (베팅 모드에서는 actualVoteCount 합계)
            totalActualVotes +=
                result.results?.reduce(
                    (sum, r) => sum + (r.actualVoteCount || r.voteCount),
                    0
                ) || 0;
        });

        return { total, active, betting, totalVotes, totalActualVotes };
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

    const handleModalClose = useCallback(() => {
        setShowCreateModal(false);
        setEditPoll(null);
    }, []);

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
                            onClick={() => fetchPolls()}
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
                            {stats.totalActualVotes.toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-400">
                            실제 투표수
                        </div>
                        {stats.totalVotes !== stats.totalActualVotes && (
                            <div className="text-xs text-blue-400 mt-1">
                                베팅: {stats.totalVotes.toLocaleString()}
                            </div>
                        )}
                    </div>
                </div>
            </Card>

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
                        총 {polls.length}개 폴
                    </div>
                </div>
            </div>

            {/* Content */}
            {polls.length === 0 ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-400">폴을 불러오는 중...</p>
                </div>
            ) : viewType === "table" ? (
                <PollsTable
                    polls={polls}
                    results={resultsData}
                    onEdit={handleEditPoll}
                    onDelete={handleDeletePoll}
                    onActiveChange={handleActiveChange}
                />
            ) : (
                <PollsCards
                    polls={polls}
                    results={resultsData}
                    onEdit={handleEditPoll}
                    onDelete={handleDeletePoll}
                    onActiveChange={handleActiveChange}
                />
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
