"use client";

import React, { useState, useEffect } from "react";
import {
    Clock,
    AlertCircle,
    PlayCircle,
    CheckCircle,
    Loader2,
    Settings,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    getBettingSettlementPolls,
    manualSettlePoll,
} from "@/app/actions/polls";
import type { BettingSettlementPoll } from "@/app/actions/polls";
import ManualSettlementModal from "./Admin.Poll.Manual.Settlement.Modal";

const PHASE_LABELS = {
    PENDING: "정산 대기",
    PHASE_1_PREPARE: "Phase 1: 준비",
    PHASE_2_PROCESS: "Phase 2: 처리",
    PHASE_3_FINALIZE: "Phase 3: 완료",
    PHASE_4_NOTIFY: "Phase 4: 알림",
    COMPLETED: "완료됨",
} as const;

const PHASE_COLORS = {
    PENDING: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
    PHASE_1_PREPARE: "bg-blue-500/20 text-blue-300 border-blue-500/50",
    PHASE_2_PROCESS: "bg-purple-500/20 text-purple-300 border-purple-500/50",
    PHASE_3_FINALIZE: "bg-orange-500/20 text-orange-300 border-orange-500/50",
    PHASE_4_NOTIFY: "bg-green-500/20 text-green-300 border-green-500/50",
    COMPLETED: "bg-slate-500/20 text-slate-300 border-slate-500/50",
} as const;

export default function AdminPollBettingSettlement() {
    const [activeTab, setActiveTab] = useState<"settlement" | "verification">(
        "settlement"
    );
    const [polls, setPolls] = useState<BettingSettlementPoll[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [settlementModal, setSettlementModal] = useState<{
        isOpen: boolean;
        pollId: string;
    }>({ isOpen: false, pollId: "" });

    const loadPolls = async () => {
        try {
            setError(null);
            const data = await getBettingSettlementPolls();
            setPolls(data);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to load polls"
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadPolls();
    };

    const handleOpenSettlement = (pollId: string) => {
        setSettlementModal({ isOpen: true, pollId });
    };

    const handleCloseSettlement = () => {
        setSettlementModal({ isOpen: false, pollId: "" });
    };

    const handleSettlementSuccess = () => {
        loadPolls();
    };

    useEffect(() => {
        loadPolls();

        const interval = setInterval(loadPolls, 30000);
        return () => clearInterval(interval);
    }, []);

    const getPhaseIcon = (phase: string) => {
        switch (phase) {
            case "PENDING":
                return <Clock className="w-4 h-4" />;
            case "PHASE_1_PREPARE":
                return <Settings className="w-4 h-4" />;
            case "PHASE_2_PROCESS":
                return <Loader2 className="w-4 h-4 animate-spin" />;
            case "PHASE_3_FINALIZE":
                return <PlayCircle className="w-4 h-4" />;
            case "PHASE_4_NOTIFY":
                return <CheckCircle className="w-4 h-4" />;
            case "COMPLETED":
                return <CheckCircle className="w-4 h-4" />;
            default:
                return <AlertCircle className="w-4 h-4" />;
        }
    };

    const getTimeStatus = (endDate: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - endDate.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(
            (diffMs % (1000 * 60 * 60)) / (1000 * 60)
        );

        if (diffMs < 0) {
            return { text: "아직 종료되지 않음", color: "text-blue-400" };
        } else if (diffHours < 1) {
            return {
                text: `${diffMinutes}분 전 종료`,
                color: "text-yellow-400",
            };
        } else if (diffHours < 24) {
            return {
                text: `${diffHours}시간 전 종료`,
                color: "text-orange-400",
            };
        } else {
            const diffDays = Math.floor(diffHours / 24);
            return { text: `${diffDays}일 전 종료`, color: "text-red-400" };
        }
    };

    return (
        <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-r from-slate-900/50 to-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-white">
                            베팅 정산 시스템
                        </h1>
                        <Badge
                            variant="outline"
                            className="bg-orange-500/20 text-orange-300 border-orange-500/50"
                        >
                            Management Dashboard
                        </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                        {activeTab === "settlement" && (
                            <Button
                                variant="outline"
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600"
                            >
                                {refreshing ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Clock className="w-4 h-4 mr-2" />
                                )}
                                새로고침
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex border-b border-slate-700 mb-6">
                    <button
                        onClick={() => setActiveTab("settlement")}
                        className={`px-4 py-2 font-medium transition-colors ${
                            activeTab === "settlement"
                                ? "text-orange-300 border-b-2 border-orange-500"
                                : "text-slate-400 hover:text-slate-300"
                        }`}
                    >
                        <Settings className="w-4 h-4 mr-2 inline" />
                        정산 관리
                    </button>
                    <button
                        onClick={() => setActiveTab("verification")}
                        className={`px-4 py-2 font-medium transition-colors ${
                            activeTab === "verification"
                                ? "text-blue-300 border-b-2 border-blue-500"
                                : "text-slate-400 hover:text-slate-300"
                        }`}
                    >
                        <CheckCircle className="w-4 h-4 mr-2 inline" />
                        정산 검증
                    </button>
                </div>

                {activeTab === "settlement" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                            <div className="text-2xl font-bold text-white">
                                {polls.length}
                            </div>
                            <div className="text-sm text-slate-400">
                                정산 대기 폴
                            </div>
                        </div>
                        <div className="text-center p-4 bg-orange-500/20 rounded-lg">
                            <div className="text-2xl font-bold text-orange-300">
                                {
                                    polls.filter(
                                        (p) => p.bettingStatus === "SETTLING"
                                    ).length
                                }
                            </div>
                            <div className="text-sm text-slate-400">
                                정산 진행 중
                            </div>
                        </div>
                        <div className="text-center p-4 bg-yellow-500/20 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-300">
                                {
                                    polls.filter(
                                        (p) => p.bettingStatus === "OPEN"
                                    ).length
                                }
                            </div>
                            <div className="text-sm text-slate-400">
                                정산 대기
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {activeTab === "settlement" && (
                <>
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-slate-400">
                                베팅 정산 폴을 불러오는 중...
                            </p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <div className="text-red-400 mb-4">
                                ⚠️ 오류 발생
                            </div>
                            <p className="text-slate-400 mb-4">{error}</p>
                            <Button onClick={handleRefresh} variant="outline">
                                다시 시도
                            </Button>
                        </div>
                    ) : polls.length === 0 ? (
                        <Card className="p-8 text-center bg-slate-800/30 border-slate-700/50">
                            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">
                                모든 베팅 정산이 완료되었습니다
                            </h3>
                            <p className="text-slate-400">
                                현재 정산이 필요한 베팅 폴이 없습니다.
                            </p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {polls.map((poll) => {
                                const timeStatus = getTimeStatus(poll.endDate);
                                const phaseKey =
                                    poll.settlementPhase as keyof typeof PHASE_LABELS;
                                const phaseLabel =
                                    PHASE_LABELS[phaseKey] ||
                                    poll.settlementPhase;
                                const phaseColor =
                                    PHASE_COLORS[phaseKey] ||
                                    PHASE_COLORS.PENDING;

                                return (
                                    <Card
                                        key={poll.id}
                                        className="p-6 bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <h3 className="text-lg font-semibold text-white">
                                                        {poll.title}
                                                    </h3>
                                                    <Badge
                                                        variant="outline"
                                                        className={phaseColor}
                                                    >
                                                        {getPhaseIcon(
                                                            poll.settlementPhase ||
                                                                "PENDING"
                                                        )}
                                                        <span className="ml-1">
                                                            {phaseLabel}
                                                        </span>
                                                    </Badge>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            poll.bettingStatus ===
                                                            "SETTLING"
                                                                ? "bg-orange-500/20 text-orange-300 border-orange-500/50"
                                                                : "bg-blue-500/20 text-blue-300 border-blue-500/50"
                                                        }
                                                    >
                                                        {poll.bettingStatus}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <div className="text-slate-400">
                                                            종료 시간
                                                        </div>
                                                        <div className="text-white">
                                                            {poll.endDate.toLocaleString(
                                                                "ko-KR"
                                                            )}
                                                        </div>
                                                        <div
                                                            className={
                                                                timeStatus.color
                                                            }
                                                        >
                                                            {timeStatus.text}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-slate-400">
                                                            총 베팅 금액
                                                        </div>
                                                        <div className="text-white font-medium">
                                                            {poll.totalBetAmount.toLocaleString()}{" "}
                                                            SGP
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-slate-400">
                                                            수수료
                                                        </div>
                                                        <div className="text-white">
                                                            {poll.totalCommission.toLocaleString()}{" "}
                                                            SGP
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-slate-400">
                                                            마지막 업데이트
                                                        </div>
                                                        <div className="text-white">
                                                            {poll.updatedAt.toLocaleString(
                                                                "ko-KR",
                                                                {
                                                                    month: "short",
                                                                    day: "numeric",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                }
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {poll.settlementPhase &&
                                                    poll.settlementPhase !==
                                                        "PENDING" && (
                                                        <div className="mt-3 p-3 bg-slate-700/30 rounded-lg">
                                                            <div className="text-sm text-slate-400 mb-1">
                                                                정산 진행 상황
                                                            </div>
                                                            <div className="text-xs text-slate-300">
                                                                Phase:{" "}
                                                                {
                                                                    poll.settlementPhase
                                                                }
                                                            </div>
                                                        </div>
                                                    )}
                                            </div>

                                            <div className="flex flex-col gap-2 ml-4">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        window.open(
                                                            `/polls/${poll.id}`,
                                                            "_blank"
                                                        )
                                                    }
                                                    className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600"
                                                >
                                                    폴 보기
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setActiveTab(
                                                            "verification"
                                                        );
                                                        // 검증 컴포넌트에 poll ID 전달하는 로직이 필요하면 추가
                                                    }}
                                                    className="bg-blue-500/20 border-blue-500/50 text-blue-300 hover:bg-blue-500/30"
                                                >
                                                    검증
                                                </Button>
                                                {poll.bettingStatus ===
                                                    "OPEN" && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="bg-orange-500/20 border-orange-500/50 text-orange-300 hover:bg-orange-500/30"
                                                        onClick={() =>
                                                            handleOpenSettlement(
                                                                poll.id
                                                            )
                                                        }
                                                    >
                                                        수동 정산
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    <div className="text-center text-sm text-slate-500">
                        자동 새로고침: 30초마다 • 마지막 업데이트:{" "}
                        {new Date().toLocaleTimeString("ko-KR")}
                    </div>
                </>
            )}

            <ManualSettlementModal
                pollId={settlementModal.pollId}
                isOpen={settlementModal.isOpen}
                onClose={handleCloseSettlement}
                onSuccess={handleSettlementSuccess}
            />
        </div>
    );
}
