/// components/admin/polls/Admin.Polls.BettingMode.tsx

"use client";

import { useCallback, useState, useMemo } from "react";
import { formatAmount, formatDate } from "@/lib/utils/formatting";
import SettlementModal from "./Admin.Polls.BettingMode.Settlement";
import {
    RefreshCw,
    Calendar,
    DollarSign,
    Users,
    TrendingUp,
    Calculator,
    ChevronDown,
    ChevronRight,
    Trophy,
    BarChart3,
} from "lucide-react";
import type { Poll } from "@prisma/client";
import {
    useBettingModePolls,
    useBettingStats,
    useStatusColors,
} from "./hooks/useBettingModeOptimized";
import type { BettingStats } from "./types/betting-mode";

export default function AdminPollsBettingMode() {
    const { polls, loading, lastUpdated, summaryStats, fetchPolls } =
        useBettingModePolls();
    const { statsMap, loadingStats, fetchStats } = useBettingStats();
    const { getStatusColor, getBettingStatusColor } = useStatusColors();

    const [expandedPolls, setExpandedPolls] = useState<Set<string>>(new Set());
    const [settlementModalOpen, setSettlementModalOpen] = useState(false);
    const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);

    const toggleExpanded = useCallback(
        async (pollId: string) => {
            const newExpanded = new Set(expandedPolls);
            if (newExpanded.has(pollId)) {
                newExpanded.delete(pollId);
            } else {
                newExpanded.add(pollId);
                if (!statsMap[pollId]) {
                    await fetchStats(pollId);
                }
            }
            setExpandedPolls(newExpanded);
        },
        [expandedPolls, statsMap, fetchStats]
    );

    const handleOpenSettlementModal = useCallback((poll: Poll) => {
        setSelectedPoll(poll);
        setSettlementModalOpen(true);
    }, []);

    const handleCloseSettlementModal = useCallback(() => {
        setSettlementModalOpen(false);
        setSelectedPoll(null);
    }, []);

    const handleSettlementComplete = useCallback(() => {
        fetchPolls().catch((err) => {
            console.error("Error fetching polls:", err);
        });
        void handleCloseSettlementModal();
    }, [fetchPolls, handleCloseSettlementModal]);

    const memoizedPollRows = useMemo(() => {
        return polls.map((poll) => {
            const isExpanded = expandedPolls.has(poll.id);
            const stats = statsMap[poll.id];
            const isLoadingStats = loadingStats.has(poll.id);

            return (
                <PollRow
                    key={poll.id}
                    poll={poll}
                    stats={stats}
                    isExpanded={isExpanded}
                    isLoadingStats={isLoadingStats}
                    onToggleExpanded={toggleExpanded}
                    onOpenSettlement={handleOpenSettlementModal}
                    getStatusColor={getStatusColor}
                    getBettingStatusColor={getBettingStatusColor}
                />
            );
        });
    }, [
        polls,
        expandedPolls,
        statsMap,
        loadingStats,
        toggleExpanded,
        handleOpenSettlementModal,
        getStatusColor,
        getBettingStatusColor,
    ]);

    return (
        <div className="space-y-6">
            <Header
                lastUpdated={lastUpdated}
                onRefresh={fetchPolls}
                loading={loading}
            />

            <div className="bg-gray-900 rounded-lg shadow-sm border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <TableHeader />
                        <tbody className="bg-gray-900 divide-y divide-gray-700">
                            {polls.length === 0 ? (
                                <EmptyState
                                    loading={loading}
                                    onRefresh={fetchPolls}
                                />
                            ) : (
                                memoizedPollRows
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {polls.length > 0 && <SummaryStats stats={summaryStats} />}

            {selectedPoll && (
                <SettlementModal
                    poll={selectedPoll}
                    isOpen={settlementModalOpen}
                    onClose={handleCloseSettlementModal}
                    onSettlementComplete={handleSettlementComplete}
                />
            )}
        </div>
    );
}

const Header = ({
    lastUpdated,
    onRefresh,
    loading,
}: {
    lastUpdated: Date | null;
    onRefresh: () => void;
    loading: boolean;
}) => (
    <div className="flex items-center justify-between">
        <div>
            <h2 className="text-2xl font-bold text-white">베팅모드 폴 관리</h2>
            <p className="text-gray-400 mt-1">
                베팅모드가 활성화된 폴 목록을 확인하고 관리합니다
            </p>
        </div>
        <div className="flex items-center gap-4">
            {lastUpdated && (
                <span className="text-sm text-gray-400">
                    마지막 업데이트: {formatDate(lastUpdated)}
                </span>
            )}
            <button
                onClick={onRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <RefreshCw
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                새로고침
            </button>
        </div>
    </div>
);

const TableHeader = () => (
    <thead className="bg-gray-800 border-b border-gray-700">
        <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                폴 정보
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                상태
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                베팅 상태
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                기간
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                참여 현황
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                베팅 금액
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                수동 정산
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                상세보기
            </th>
        </tr>
    </thead>
);

const EmptyState = ({
    loading,
    onRefresh,
}: {
    loading: boolean;
    onRefresh: () => void;
}) => (
    <tr>
        <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
            {loading ? (
                <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    데이터를 불러오는 중...
                </div>
            ) : (
                <div className="space-y-2">
                    <p>베팅모드 폴이 없습니다</p>
                    <button
                        onClick={onRefresh}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                        새로고침
                    </button>
                </div>
            )}
        </td>
    </tr>
);

const PollRow = ({
    poll,
    stats,
    isExpanded,
    isLoadingStats,
    onToggleExpanded,
    onOpenSettlement,
    getStatusColor,
    getBettingStatusColor,
}: {
    poll: Poll;
    stats?: BettingStats;
    isExpanded: boolean;
    isLoadingStats: boolean;
    onToggleExpanded: (pollId: string) => void;
    onOpenSettlement: (poll: Poll) => void;
    getStatusColor: (status: string) => string;
    getBettingStatusColor: (status: string) => string;
}) => (
    <>
        <tr className="hover:bg-gray-800 transition-colors">
            <td className="px-6 py-4">
                <div className="space-y-1">
                    <div className="font-medium text-white">
                        {poll.titleShorten || poll.title}
                    </div>
                    <div className="text-sm text-gray-400">ID: {poll.id}</div>
                    <div className="text-xs text-gray-500">
                        생성: {formatDate(poll.createdAt)}
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        poll.status
                    )}`}
                >
                    {poll.status}
                </span>
            </td>
            <td className="px-6 py-4">
                <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getBettingStatusColor(
                        poll.bettingStatus
                    )}`}
                >
                    {poll.bettingStatus}
                </span>
                {poll.isSettled && (
                    <div className="text-xs text-green-400 mt-1">정산 완료</div>
                )}
            </td>
            <td className="px-6 py-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm text-gray-300">
                        <Calendar className="w-3 h-3" />
                        <span>시작: {formatDate(poll.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-300">
                        <Calendar className="w-3 h-3" />
                        <span>종료: {formatDate(poll.endDate)}</span>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm text-gray-300">
                        <Users className="w-3 h-3" />
                        <span>투표: {formatAmount(poll.totalVotes)}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                        최소 베팅: {formatAmount(poll.minimumBet)}
                    </div>
                    <div className="text-xs text-gray-500">
                        최대 베팅: {formatAmount(poll.maximumBet)}
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm font-medium text-white">
                        <DollarSign className="w-3 h-3" />
                        <span>{formatAmount(poll.totalVotes)}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                        수수료율: {(poll.houseCommissionRate * 100).toFixed(1)}%
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex justify-center">
                    <button
                        onClick={() => onOpenSettlement(poll)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white text-xs rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Calculator className="w-3 h-3" />
                        수동 정산
                    </button>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex justify-center">
                    <button
                        onClick={() => onToggleExpanded(poll.id)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                    >
                        {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                        ) : (
                            <ChevronRight className="w-4 h-4" />
                        )}
                        {isLoadingStats ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                            <BarChart3 className="w-3 h-3" />
                        )}
                    </button>
                </div>
            </td>
        </tr>
        {isExpanded && stats && (
            <ExpandedPollDetails poll={poll} stats={stats} />
        )}
    </>
);

const ExpandedPollDetails = ({
    poll,
    stats,
}: {
    poll: Poll;
    stats: BettingStats;
}) => (
    <tr className="bg-gray-800/50">
        <td colSpan={8} className="px-6 py-4">
            <div className="space-y-4">
                <StatsGrid stats={stats} />
                {stats.topBettors.length > 0 && (
                    <TopBettorsSection topBettors={stats.topBettors} />
                )}
                {stats.optionStats.length > 0 && (
                    <OptionStatsSection
                        poll={poll}
                        optionStats={stats.optionStats}
                    />
                )}
            </div>
        </td>
    </tr>
);

const StatsGrid = ({ stats }: { stats: BettingStats }) => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">참여자</span>
            </div>
            <div className="text-2xl font-bold text-white">
                {formatAmount(stats.totalParticipants)}
            </div>
            <div className="text-xs text-gray-400">
                총 베팅: {formatAmount(stats.totalBets)}회
            </div>
        </div>
        <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-white">
                    총 베팅금액
                </span>
            </div>
            <div className="text-2xl font-bold text-white">
                {formatAmount(stats.totalAmount)}
            </div>
            <div className="text-xs text-gray-400">
                평균: {formatAmount(stats.averageBetAmount)}
            </div>
        </div>
        <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-white">
                    상위 베터
                </span>
            </div>
            <div className="text-2xl font-bold text-white">
                {stats.topBettors.length}
            </div>
            <div className="text-xs text-gray-400">TOP 10</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-white">
                    옵션별 통계
                </span>
            </div>
            <div className="text-2xl font-bold text-white">
                {stats.optionStats.length}
            </div>
            <div className="text-xs text-gray-400">옵션 수</div>
        </div>
    </div>
);

const TopBettorsSection = ({
    topBettors,
}: {
    topBettors: BettingStats["topBettors"];
}) => (
    <div className="bg-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            상위 베터 TOP 10
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {topBettors.map((bettor, index) => (
                <div key={bettor.playerId} className="bg-gray-600 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">
                            #{index + 1}
                        </span>
                        <span className="text-xs text-gray-400">
                            {bettor.betCount}회
                        </span>
                    </div>
                    <div className="font-medium text-white truncate">
                        {bettor.nickname ||
                            `Player ${bettor.playerId.slice(-6)}`}
                    </div>
                    <div className="text-sm text-green-400 font-medium">
                        {formatAmount(bettor.totalAmount)}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const OptionStatsSection = ({
    poll,
    optionStats,
}: {
    poll: Poll;
    optionStats: BettingStats["optionStats"];
}) => (
    <div className="bg-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            옵션별 베팅 현황
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {optionStats.map((option) => (
                <div key={option.optionId} className="bg-gray-600 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">참여자</span>
                        <span className="text-xs text-gray-400">
                            {option.participantCount}명
                        </span>
                    </div>
                    <div className="font-medium text-white truncate">
                        {(
                            poll.options as Array<{
                                optionId: string;
                                name: string;
                            }>
                        )?.find(
                            (pollOption) =>
                                pollOption.optionId === option.optionId
                        )?.name || option.optionId}
                    </div>
                    <div className="text-sm text-blue-400 font-medium">
                        {formatAmount(option.totalAmount)}
                    </div>
                    <div className="text-xs text-gray-400">
                        평균: {formatAmount(option.averageAmount)}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const SummaryStats = ({ stats }: { stats: any }) => (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-400">총 폴 수:</span>
                <span className="font-medium text-white">
                    {stats.totalPolls}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-400">총 베팅 금액:</span>
                <span className="font-medium text-white">
                    {formatAmount(stats.totalBetAmount)}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-400">총 투표 수:</span>
                <span className="font-medium text-white">
                    {formatAmount(stats.totalVotes)}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-gray-400">활성 폴:</span>
                <span className="font-medium text-white">
                    {stats.activePolls}
                </span>
            </div>
        </div>
    </div>
);
