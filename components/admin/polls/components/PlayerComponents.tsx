import {
    Users,
    DollarSign,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Calculator,
    TrendingUp,
    TrendingDown,
    Trophy,
    XCircle,
    AlertTriangle,
    Info,
    X,
    CheckSquare,
    Square,
    Clock,
} from "lucide-react";
import {
    formatAmount,
    formatDate,
    formatPlayerName,
} from "@/lib/utils/formatting";
import {
    type PlayerTab,
    type SortBy,
    type SortOrder,
    type PlayerSettlementStatus,
    type CalculationDetails,
    type BulkSettlementResult,
} from "../types/betting-mode";

interface HeaderProps {
    totalParticipants: number;
    totalBetAmount: number;
    safetyCheck: any;
    onBulkSettlement: () => void;
    onRefresh: () => void;
    bulkSettling: boolean;
    loading: boolean;
}

export const Header = ({
    totalParticipants,
    totalBetAmount,
    safetyCheck,
    onRefresh,
    loading,
}: HeaderProps) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
                <Users className="w-4 h-4" />
                <span>총 참여자: {formatAmount(totalParticipants)}명</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
                <DollarSign className="w-4 h-4" />
                <span>총 베팅금: {formatAmount(totalBetAmount)}</span>
            </div>
            {safetyCheck.count > 0 && (
                <div
                    className={`flex items-center gap-2 text-sm ${
                        safetyCheck.isDanger
                            ? "text-red-400"
                            : safetyCheck.isWarning
                            ? "text-yellow-400"
                            : "text-blue-400"
                    }`}
                >
                    <CheckSquare className="w-4 h-4" />
                    <span>{safetyCheck.getMessage()}</span>
                </div>
            )}
        </div>
        <div className="flex items-center gap-2">
            <button
                onClick={onRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
                <RefreshCw
                    className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}
                />
                새로고침
            </button>
        </div>
    </div>
);

interface TabNavigationProps {
    activeTab: PlayerTab;
    tabStats: any;
    onTabChange: (tab: PlayerTab) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
}

export const TabNavigation = ({
    activeTab,
    tabStats,
    onTabChange,
    onSelectAll,
    onDeselectAll,
}: TabNavigationProps) => (
    <div className="flex items-center gap-2 border-b border-gray-700 overflow-x-auto">
        {[
            {
                key: "all" as const,
                label: "전체",
                icon: Users,
                count: tabStats.allCount,
            },
            {
                key: "winners" as const,
                label: "승리자",
                icon: Trophy,
                count: tabStats.winnersCount,
            },
            {
                key: "losers" as const,
                label: "패배자",
                icon: XCircle,
                count: tabStats.losersCount,
            },
            {
                key: "settled" as const,
                label: "정산완료",
                icon: CheckSquare,
                count: tabStats.settledCount,
            },
            {
                key: "unsettled" as const,
                label: "미정산",
                icon: Clock,
                count: tabStats.unsettledCount,
            },
            {
                key: "error" as const,
                label: "오류",
                icon: AlertTriangle,
                count: tabStats.errorCount,
            },
        ].map(({ key, label, icon: Icon, count }) => (
            <button
                key={key}
                onClick={() => onTabChange(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${
                    activeTab === key
                        ? key === "winners"
                            ? "bg-green-600 text-white"
                            : key === "losers"
                            ? "bg-red-600 text-white"
                            : key === "settled"
                            ? "bg-green-600 text-white"
                            : key === "unsettled"
                            ? "bg-yellow-600 text-white"
                            : key === "error"
                            ? "bg-red-600 text-white"
                            : "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
            >
                <Icon className="w-4 h-4" />
                {label} ({count})
            </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
            <button
                onClick={onSelectAll}
                className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-500 transition-colors"
            >
                <CheckSquare className="w-3 h-3" />
                전체 선택
            </button>
            <button
                onClick={onDeselectAll}
                className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-500 transition-colors"
            >
                <Square className="w-3 h-3" />
                전체 해제
            </button>
        </div>
    </div>
);

interface ParticipantsTableProps {
    loading: boolean;
    activeTab: PlayerTab;
    memoizedRows: React.ReactNode;
    sortBy: SortBy;
    sortOrder: SortOrder;
    onSort: (sortBy: SortBy) => void;
    onRefresh: () => void;
}

export const ParticipantsTable = ({
    loading,
    activeTab,
    memoizedRows,
    sortBy,
    sortOrder,
    onSort,
    onRefresh,
}: ParticipantsTableProps) => {
    const getSortIcon = (column: SortBy) => {
        if (sortBy !== column) return null;
        return sortOrder === "asc" ? (
            <TrendingUp className="w-3 h-3" />
        ) : (
            <TrendingDown className="w-3 h-3" />
        );
    };

    const getEmptyMessage = () => {
        switch (activeTab) {
            case "winners":
                return "승리자가 없습니다";
            case "losers":
                return "패배자가 없습니다";
            case "settled":
                return "정산 완료된 플레이어가 없습니다";
            case "unsettled":
                return "미정산 플레이어가 없습니다";
            case "error":
                return "오류가 있는 플레이어가 없습니다";
            default:
                return "참여자가 없습니다";
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-700 border-b border-gray-600">
                        <tr>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                                선택
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                참여자
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors"
                                onClick={() => onSort("totalAmount")}
                            >
                                <div className="flex items-center gap-1">
                                    총 베팅금
                                    {getSortIcon("totalAmount")}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors"
                                onClick={() => onSort("betCount")}
                            >
                                <div className="flex items-center gap-1">
                                    베팅 횟수
                                    {getSortIcon("betCount")}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors"
                                onClick={() => onSort("createdAt")}
                            >
                                <div className="flex items-center gap-1">
                                    첫 베팅
                                    {getSortIcon("createdAt")}
                                </div>
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                                상태
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                                정산 금액
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-4 py-8 text-center text-gray-400"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        참여자 목록을 불러오는 중...
                                    </div>
                                </td>
                            </tr>
                        ) : memoizedRows ? (
                            memoizedRows
                        ) : (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-4 py-8 text-center text-gray-400"
                                >
                                    <div className="space-y-2">
                                        <p>{getEmptyMessage()}</p>
                                        <button
                                            onClick={onRefresh}
                                            className="text-blue-400 hover:text-blue-300 text-sm"
                                        >
                                            새로고침
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

interface PlayerRowProps {
    participant: any;
    isSelected: boolean;
    isWinner?: boolean;
    settlementAmount?: number;
    settlementStatus?: PlayerSettlementStatus;
    settlementResults?: any;
    onPlayerSelect: (playerId: string, isSelected: boolean) => void;
    onShowCalculation: (playerId: string) => void;
    onForceResettle: (playerId: string) => void;
    onCalculateSettlement: (playerId: string) => void;
    onCheckPlayerStatus: (playerId: string) => void;
}

export const PlayerRow = ({
    participant,
    isSelected,
    isWinner,
    settlementAmount,
    settlementStatus,
    settlementResults,
    onPlayerSelect,
    onShowCalculation,
    onForceResettle,
    onCalculateSettlement,
    onCheckPlayerStatus,
}: PlayerRowProps) => (
    <tr
        className={`hover:bg-gray-700 transition-colors ${
            isSelected ? "bg-blue-900/20 border-l-2 border-blue-500" : ""
        }`}
    >
        <td className="px-4 py-3">
            <div className="flex justify-center">
                <button
                    onClick={() =>
                        onPlayerSelect(participant.playerId, !isSelected)
                    }
                    className="flex items-center justify-center w-5 h-5 rounded border-2 transition-colors hover:bg-gray-600"
                >
                    {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-400" />
                    ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                    )}
                </button>
            </div>
        </td>
        <td className="px-4 py-3">
            <div className="space-y-1">
                <div className="font-medium text-white">
                    {formatPlayerName(
                        participant.playerId,
                        participant.nickname
                    )}
                </div>
                <div className="text-xs text-gray-400">
                    ID: {participant.playerId}
                </div>
            </div>
        </td>
        <td className="px-4 py-3">
            <div className="text-sm font-medium text-white">
                {formatAmount(participant.totalBetAmount)}
            </div>
        </td>
        <td className="px-4 py-3">
            <div className="text-sm text-gray-300">
                {participant.betCount}회
            </div>
        </td>
        <td className="px-4 py-3">
            <div className="text-sm text-gray-300">
                {formatDate(participant.firstBetAt)}
            </div>
        </td>
        <td className="px-4 py-3">
            <div className="text-center">
                {isWinner === undefined ? (
                    <button
                        onClick={() =>
                            onCheckPlayerStatus(participant.playerId)
                        }
                        className="flex items-center justify-center gap-1 px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                        title="승리/패배 상태 확인"
                    >
                        <Clock className="w-3 h-3" />
                        확인
                    </button>
                ) : isWinner ? (
                    <div className="flex items-center justify-center gap-1 text-xs text-green-400">
                        <Trophy className="w-3 h-3" />
                        승리
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-1 text-xs text-red-400">
                        <XCircle className="w-3 h-3" />
                        패배
                    </div>
                )}
            </div>
        </td>
        <td className="px-4 py-3">
            <div className="text-center">
                {settlementAmount !== undefined ? (
                    <SettlementAmountCell
                        settlementAmount={settlementAmount}
                        settlementStatus={settlementStatus}
                        settlementResults={settlementResults}
                        onShowCalculation={() =>
                            onShowCalculation(participant.playerId)
                        }
                        onForceResettle={() =>
                            onForceResettle(participant.playerId)
                        }
                    />
                ) : (
                    <button
                        onClick={() =>
                            onCalculateSettlement(participant.playerId)
                        }
                        className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-500 transition-colors"
                    >
                        <Calculator className="w-3 h-3" />
                        계산
                    </button>
                )}
            </div>
        </td>
    </tr>
);

interface SettlementAmountCellProps {
    settlementAmount: number;
    settlementStatus?: PlayerSettlementStatus;
    settlementResults?: any;
    onShowCalculation: () => void;
    onForceResettle: () => void;
}

const SettlementAmountCell = ({
    settlementAmount,
    settlementStatus,
    settlementResults,
    onShowCalculation,
    onForceResettle,
}: SettlementAmountCellProps) => (
    <div className="space-y-1">
        <div
            className={`text-sm font-medium ${
                settlementAmount > 0 ? "text-green-400" : "text-gray-400"
            }`}
        >
            {formatAmount(settlementAmount)}
        </div>

        {settlementStatus && (
            <div>
                {(() => {
                    switch (settlementStatus.status) {
                        case "settled":
                            return (
                                <div className="space-y-1">
                                    <div className="text-xs text-green-400 flex items-center justify-center gap-1">
                                        <CheckSquare className="w-3 h-3" />
                                        정산 완료 (
                                        {formatAmount(
                                            settlementStatus.settlementAmount
                                        )}
                                        )
                                    </div>
                                    {settlementStatus.settlementLogs &&
                                        settlementStatus.settlementLogs.length >
                                            0 && (
                                            <div className="text-xs text-gray-500">
                                                {
                                                    settlementStatus
                                                        .settlementLogs.length
                                                }
                                                개 정산 기록
                                            </div>
                                        )}
                                </div>
                            );
                        case "error":
                            return (
                                <div className="text-xs text-red-400 flex items-center justify-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    정산 오류 - 재정산 필요
                                </div>
                            );
                        case "missing_bet":
                            return (
                                <div className="text-xs text-orange-400 flex items-center justify-center gap-1">
                                    <XCircle className="w-3 h-3" />
                                    베팅 기록 없음
                                </div>
                            );
                        default:
                            return (
                                <div className="text-xs text-blue-400 flex items-center justify-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    정산 대기
                                </div>
                            );
                    }
                })()}
            </div>
        )}

        {settlementResults?.rewardLogIssue && (
            <div className="text-xs text-red-400 flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                RewardLog 불일치
            </div>
        )}

        <div className="flex flex-col gap-1">
            <button
                onClick={onShowCalculation}
                className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 transition-colors"
            >
                <Info className="w-3 h-3" />
                계산식
            </button>

            {settlementStatus?.canResettle && (
                <button
                    onClick={onForceResettle}
                    className="flex items-center gap-1 px-2 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-500 transition-colors"
                >
                    <RefreshCw className="w-3 h-3" />
                    재정산
                </button>
            )}
        </div>
    </div>
);

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
}: PaginationProps) => {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
                페이지 {currentPage} / {totalPages}
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white text-xs rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="w-3 h-3" />
                    이전
                </button>
                <button
                    onClick={() =>
                        onPageChange(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white text-xs rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    다음
                    <ChevronRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
};

interface CalculationModalProps {
    isOpen: boolean;
    calculationDetails: CalculationDetails | null;
    onClose: () => void;
}

export const CalculationModal = ({
    isOpen,
    calculationDetails,
    onClose,
}: CalculationModalProps) => {
    if (!isOpen || !calculationDetails) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">
                        정산 계산 상세
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="bg-gray-800 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-white mb-2">
                            플레이어 정보
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-400">이름:</span>
                                <span className="text-white ml-2">
                                    {calculationDetails.playerName}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-400">ID:</span>
                                <span className="text-white ml-2">
                                    {calculationDetails.playerId}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-400">
                                    총 베팅 금액:
                                </span>
                                <span className="text-white ml-2">
                                    {formatAmount(
                                        calculationDetails.totalBetAmount
                                    )}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-400">
                                    베팅 옵션 수:
                                </span>
                                <span className="text-white ml-2">
                                    {calculationDetails.winningBets.length}개
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-white mb-3">
                            베팅 상세
                        </h4>
                        <div className="space-y-2">
                            {calculationDetails.winningBets.map(
                                (bet, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400">
                                                옵션 {bet.optionId}:
                                            </span>
                                            <span className="text-white">
                                                {formatAmount(bet.betAmount)}
                                            </span>
                                        </div>
                                        <div
                                            className={`px-2 py-1 rounded text-xs ${
                                                bet.isWinningOption
                                                    ? "bg-green-900/20 text-green-400 border border-green-800"
                                                    : "bg-red-900/20 text-red-400 border border-red-800"
                                            }`}
                                        >
                                            {bet.isWinningOption
                                                ? "승리"
                                                : "패배"}
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-white mb-3">
                            계산 과정
                        </h4>
                        <div className="space-y-3">
                            {calculationDetails.calculationSteps.map(
                                (step, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-3 p-3 bg-gray-700 rounded"
                                    >
                                        <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-white mb-1">
                                                {step.step}
                                            </div>
                                            <div className="text-lg font-bold text-blue-400 mb-1">
                                                {formatAmount(step.value)}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {step.description}
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-white mb-3">
                            최종 결과
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-xs text-gray-400 mb-1">
                                    상금
                                </div>
                                <div className="text-lg font-bold text-green-400">
                                    {formatAmount(
                                        calculationDetails.payoutAmount
                                    )}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-gray-400 mb-1">
                                    환불
                                </div>
                                <div className="text-lg font-bold text-blue-400">
                                    {formatAmount(
                                        calculationDetails.refundAmount
                                    )}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-gray-400 mb-1">
                                    수수료
                                </div>
                                <div className="text-lg font-bold text-gray-400">
                                    {formatAmount(
                                        calculationDetails.commissionAmount
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {calculationDetails.rewardLogIssue && (
                        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                RewardLog 불일치 경고
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-gray-400">
                                        PollLog 금액:
                                    </span>
                                    <span className="text-white ml-2">
                                        {formatAmount(
                                            calculationDetails.rewardLogIssue
                                                .pollLogAmount
                                        )}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400">
                                        RewardLog 차감:
                                    </span>
                                    <span className="text-white ml-2">
                                        {formatAmount(
                                            calculationDetails.rewardLogIssue
                                                .rewardLogDeduction
                                        )}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400">차이:</span>
                                    <span className="text-red-400 ml-2">
                                        {formatAmount(
                                            calculationDetails.rewardLogIssue
                                                .missingAmount
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface BulkSettlementResultModalProps {
    result: BulkSettlementResult | null;
    onClose: () => void;
}

export const BulkSettlementResultModal = ({
    result,
    onClose,
}: BulkSettlementResultModalProps) => {
    if (!result) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">
                        일괄 정산 결과
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="bg-gray-800 rounded-lg p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-xs text-gray-400 mb-1">
                                    총 처리
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    {result.summary.totalProcessed}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-gray-400 mb-1">
                                    성공
                                </div>
                                <div className="text-2xl font-bold text-green-400">
                                    {result.summary.totalSuccess}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-gray-400 mb-1">
                                    실패
                                </div>
                                <div className="text-2xl font-bold text-red-400">
                                    {result.summary.totalFailed}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-gray-400 mb-1">
                                    총 정산 금액
                                </div>
                                <div className="text-2xl font-bold text-blue-400">
                                    {formatAmount(
                                        result.summary.totalSettlementAmount
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {result.results.length > 0 && (
                        <div className="bg-gray-800 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-white mb-3">
                                상세 결과
                            </h4>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {result.results.map((resultItem, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-center justify-between p-3 rounded ${
                                            resultItem.success
                                                ? "bg-green-900/20 border border-green-800"
                                                : "bg-red-900/20 border border-red-800"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="text-sm text-gray-400">
                                                {index + 1}.
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-white">
                                                    Player{" "}
                                                    {resultItem.playerId.slice(
                                                        -6
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {resultItem.message ||
                                                        resultItem.error}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div
                                                className={`text-sm font-medium ${
                                                    resultItem.success
                                                        ? "text-green-400"
                                                        : "text-red-400"
                                                }`}
                                            >
                                                {formatAmount(
                                                    resultItem.settlementAmount
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {resultItem.notificationSent
                                                    ? "알림 전송됨"
                                                    : "알림 실패"}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
