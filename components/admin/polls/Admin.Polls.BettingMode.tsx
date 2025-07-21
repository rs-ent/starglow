/// components/admin/polls/Admin.Polls.BettingMode.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
    TrendingUp,
    BarChart3,
    Settings,
    RefreshCw,
    CheckCircle,
    Shield,
    Activity,
    Gavel,
} from "lucide-react";
import { usePollsGet } from "@/app/hooks/usePolls";
import { useToast } from "@/app/hooks/useToast";
import { usePollsResultsQuery } from "@/app/queries/pollsQueries";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/tailwind";
import AdminPollBettingSettlement from "./Admin.Poll.Betting.Settlement";

import type { PollsWithArtist, PollOption } from "@/app/actions/polls";

interface BettingPollWithStats extends PollsWithArtist {
    bettingStats: {
        totalPool: number;
        optionStats: Array<{
            optionId: string;
            name: string;
            betAmount: number;
            voteCount: number; // 실제 득표수 (투표한 사람의 수)
            betAmountFromVotes?: number; // 베팅 금액 합계 (검증용)
            percentage: number;
            currentOdds: number;
        }>;
        settlementRequired: boolean;
        canAutoSettle: boolean;
    };
}

export default function AdminPollsBettingMode() {
    const toast = useToast();
    const [selectedTab, setSelectedTab] = useState("overview");
    const [refreshing, setRefreshing] = useState(false);

    // 베팅 모드 폴만 가져오기
    const { pollsList } = usePollsGet({
        getPollsInput: {
            bettingMode: true,
        },
        pagination: {
            currentPage: 1,
            itemsPerPage: 100,
        },
    });

    const { bettingPolls, pollIds } = useMemo(() => {
        const bettingPolls = pollsList?.items || [];
        const pollIds = bettingPolls.map((poll) => poll.id);

        return { bettingPolls, pollIds };
    }, [pollsList]);

    const { data: pollsResults } = usePollsResultsQuery({
        pollIds,
    });

    // 베팅 폴 데이터 가공
    const bettingPollsWithStats = useMemo((): BettingPollWithStats[] => {
        if (!bettingPolls || !pollsResults) return [];

        return bettingPolls.map((poll) => {
            const result = pollsResults.results?.find(
                (r) => r.pollId === poll.id
            );
            const optionBetAmounts = (poll.optionBetAmounts as any) || {};
            const options = poll.options as unknown as PollOption[];

            const totalPool = Object.values(optionBetAmounts).reduce(
                (sum: number, amount: any) => sum + (amount || 0),
                0
            );

            const optionStats = options.map((option) => {
                const betAmount = optionBetAmounts[option.optionId] || 0;
                const resultData = result?.results?.find(
                    (r) => r.optionId === option.optionId
                );

                // 실제 득표수 (투표한 사람의 수)
                const actualVoteCount = resultData?.actualVoteCount || 0;
                // 베팅 금액 합계 (기존 voteCount)
                const betAmountFromVotes = resultData?.voteCount || 0;

                const percentage =
                    totalPool > 0 ? (betAmount / totalPool) * 100 : 0;
                const currentOdds = betAmount > 0 ? totalPool / betAmount : 0;

                return {
                    optionId: option.optionId,
                    name: option.name,
                    betAmount,
                    voteCount: actualVoteCount, // 실제 득표수로 변경
                    betAmountFromVotes, // 베팅 금액 합계 추가
                    percentage,
                    currentOdds,
                };
            });

            const now = new Date();
            const settlementRequired =
                poll.endDate < now &&
                (!poll.answerOptionIds || poll.answerOptionIds.length === 0);
            const canAutoSettle = !!(
                settlementRequired &&
                result &&
                result.totalVotes > 0
            );

            return {
                ...poll,
                bettingStats: {
                    totalPool,
                    optionStats,
                    settlementRequired,
                    canAutoSettle,
                },
            };
        });
    }, [bettingPolls, pollsResults]);

    // 자동 새로고침
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            // Refresh the page to get latest data
            window.location.reload();
        } catch (error) {
            console.error("Refresh error:", error);
            toast.error("새로고침 중 오류가 발생했습니다.");
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <div className="p-6 space-y-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{
                                duration: 20,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                        >
                            <BarChart3 className="w-8 h-8 text-orange-400" />
                        </motion.div>
                        <h1 className="text-3xl font-bold text-white">
                            Betting Mode Control
                        </h1>
                    </div>
                    <Badge
                        variant="outline"
                        className="bg-orange-500/20 text-orange-300 border-orange-500/50"
                    >
                        Live Dashboard
                    </Badge>
                </div>
                <Button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="bg-slate-700 hover:bg-slate-600"
                >
                    <RefreshCw
                        className={cn(
                            "w-4 h-4 mr-2",
                            refreshing && "animate-spin"
                        )}
                    />
                    새로고침
                </Button>
            </div>

            {/* 메인 컨텐츠 */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-700">
                    <TabsTrigger
                        value="overview"
                        className="text-white data-[state=active]:bg-slate-700"
                    >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        실시간 현황
                    </TabsTrigger>
                    <TabsTrigger
                        value="settlement"
                        className="text-white data-[state=active]:bg-slate-700"
                    >
                        <Gavel className="w-4 h-4 mr-2" />
                        베팅 정산
                    </TabsTrigger>
                    <TabsTrigger
                        value="monitoring"
                        className="text-white data-[state=active]:bg-slate-700"
                    >
                        <Shield className="w-4 h-4 mr-2" />
                        모니터링
                    </TabsTrigger>
                    <TabsTrigger
                        value="analytics"
                        className="text-white data-[state=active]:bg-slate-700"
                    >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        분석
                    </TabsTrigger>
                </TabsList>

                {/* 실시간 현황 탭 */}
                <TabsContent value="overview" className="space-y-6">
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Activity className="w-5 h-5" />
                                베팅 폴 현황
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {bettingPollsWithStats.map((poll) => (
                                    <Card
                                        key={poll.id}
                                        className="bg-slate-700/50 border-slate-600"
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-semibold text-white text-lg">
                                                            {poll.title}
                                                        </h3>
                                                        <Badge
                                                            variant={
                                                                poll.isActive
                                                                    ? "default"
                                                                    : "secondary"
                                                            }
                                                            className={cn(
                                                                poll.isActive
                                                                    ? "bg-green-500/20 text-green-300"
                                                                    : "bg-gray-500/20 text-gray-300"
                                                            )}
                                                        >
                                                            {poll.isActive
                                                                ? "활성"
                                                                : "비활성"}
                                                        </Badge>
                                                        {poll.bettingStats
                                                            .settlementRequired && (
                                                            <Badge className="bg-red-500/20 text-red-300 border-red-500/50">
                                                                정산 필요
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-slate-400 text-sm mb-2">
                                                        {formatDate(
                                                            poll.startDate
                                                        )}{" "}
                                                        ~{" "}
                                                        {formatDate(
                                                            poll.endDate
                                                        )}
                                                    </p>
                                                    <div className="flex items-center gap-6 text-sm">
                                                        <span className="text-green-300">
                                                            💰 총 베팅:{" "}
                                                            {poll.bettingStats.totalPool.toLocaleString()}
                                                        </span>
                                                        <span className="text-blue-300">
                                                            👥 참여자:{" "}
                                                            {poll.uniqueVoters}
                                                            명
                                                        </span>
                                                        <span className="text-yellow-300">
                                                            🏆 실제 득표:{" "}
                                                            {poll.bettingStats.optionStats.reduce(
                                                                (sum, option) =>
                                                                    sum +
                                                                    option.voteCount,
                                                                0
                                                            )}
                                                            표
                                                        </span>
                                                    </div>
                                                </div>
                                                {poll.bettingStats
                                                    .settlementRequired && (
                                                    <Button
                                                        onClick={() =>
                                                            setSelectedTab(
                                                                "settlement"
                                                            )
                                                        }
                                                        className="bg-orange-600 hover:bg-orange-700 text-white"
                                                    >
                                                        <Gavel className="w-4 h-4 mr-2" />
                                                        정산하기
                                                    </Button>
                                                )}
                                            </div>

                                            {/* 옵션별 베팅 현황 */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {poll.bettingStats.optionStats.map(
                                                    (option) => (
                                                        <div
                                                            key={
                                                                option.optionId
                                                            }
                                                            className="bg-slate-600/30 rounded-lg p-3 border border-slate-600/50"
                                                        >
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h4 className="font-medium text-white text-sm">
                                                                    {
                                                                        option.name
                                                                    }
                                                                </h4>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                >
                                                                    {option.currentOdds.toFixed(
                                                                        1
                                                                    )}
                                                                    x
                                                                </Badge>
                                                            </div>
                                                            <div className="space-y-1 text-xs">
                                                                <div className="flex justify-between text-slate-300">
                                                                    <span>
                                                                        실제
                                                                        득표:
                                                                    </span>
                                                                    <span className="font-medium text-green-300">
                                                                        {
                                                                            option.voteCount
                                                                        }
                                                                        표
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between text-slate-300">
                                                                    <span>
                                                                        베팅
                                                                        금액:
                                                                    </span>
                                                                    <span className="font-medium text-blue-300">
                                                                        {option.betAmount.toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between text-slate-300">
                                                                    <span>
                                                                        베팅
                                                                        비율:
                                                                    </span>
                                                                    <span className="font-medium">
                                                                        {option.percentage.toFixed(
                                                                            1
                                                                        )}
                                                                        %
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {/* 진행률 바 */}
                                                            <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
                                                                <div
                                                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                                                    style={{
                                                                        width: `${Math.min(
                                                                            option.percentage,
                                                                            100
                                                                        )}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 정산 관리 탭 */}
                <TabsContent value="settlement" className="space-y-6">
                    <AdminPollBettingSettlement />
                </TabsContent>

                {/* 모니터링 탭 */}
                <TabsContent value="monitoring" className="space-y-6">
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                시스템 모니터링
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <Settings className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                                <p className="text-slate-300">
                                    모니터링 대시보드 준비 중입니다.
                                </p>
                                <p className="text-slate-400 text-sm">
                                    이상 거래 감지, 사용자 활동 분석 등의 기능이
                                    추가될 예정입니다.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 분석 탭 */}
                <TabsContent value="analytics" className="space-y-6">
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                베팅 분석
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                                <p className="text-slate-300">
                                    분석 대시보드 준비 중입니다.
                                </p>
                                <p className="text-slate-400 text-sm">
                                    수익성 분석, 사용자 패턴, 예측 정확도 등의
                                    통계가 추가될 예정입니다.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
