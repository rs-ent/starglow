/// components/admin/polls/Admin.Polls.BettingMode.Settlement.tsx

"use client";

import { useCallback, useState } from "react";
import {
    getSettlementProgress,
    resumeSettlement,
    pauseSettlement,
} from "@/app/actions/polls/polls-bettingMode";
import { formatAmount, settlementCacheManager } from "@/lib/utils/formatting";
import SettlementPlayers from "./Admin.Polls.BettingMode.Settlement.Players";
import {
    Calculator,
    DollarSign,
    Users,
    AlertTriangle,
    CheckCircle,
    XCircle,
    RefreshCw,
    Loader2,
    UserCheck,
    Database,
    Trash2,
    BarChart3,
    Pause,
    SkipForward,
    Clock,
    TrendingUp,
} from "lucide-react";
import type { Poll } from "@prisma/client";
import { getBettingModeStats } from "@/app/actions/polls/polls-bettingMode";

interface SettlementModalProps {
    poll: Poll;
    isOpen: boolean;
    onClose: () => void;
    onSettlementComplete: () => void;
}

export default function SettlementModal({
    poll,
    isOpen,
    onClose,
    onSettlementComplete,
}: SettlementModalProps) {
    const [selectedWinningOptions, setSelectedWinningOptions] = useState<
        Set<string>
    >(new Set());
    const [settlementResult, setSettlementResult] = useState<{
        success: boolean;
        message: string;
        error?: string;
    } | null>(null);
    const [activeTab, setActiveTab] = useState<"preview" | "players">(
        "preview"
    );
    const [winningOptionConfirmed, setWinningOptionConfirmed] = useState(false);
    const [bettingStats, setBettingStats] = useState<any>(null);
    const [loadingBettingStats, setLoadingBettingStats] = useState(false);
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
    const [showCacheStats, setShowCacheStats] = useState(false);
    const [cacheStats, setCacheStats] = useState<any>(null);

    // 🆕 정산 진행 상태 관리
    const [settlementProgress, setSettlementProgress] = useState<any>(null);
    const [loadingProgress, setLoadingProgress] = useState(false);
    const [resuming, setResuming] = useState(false);
    const [pausing, setPausing] = useState(false);

    const refreshCacheStats = useCallback(() => {
        const stats = settlementCacheManager.getCacheStats();
        setCacheStats(stats);
    }, []);

    const clearCache = useCallback(() => {
        settlementCacheManager.clearCache(poll.id);
        const stats = settlementCacheManager.getCacheStats();
        setCacheStats(stats);
        alert("캐시가 삭제되었습니다.");
    }, [poll.id]);

    const clearAllCache = useCallback(() => {
        if (confirm("모든 캐시를 삭제하시겠습니까?")) {
            settlementCacheManager.clearCache();
            const stats = settlementCacheManager.getCacheStats();
            setCacheStats(stats);
            alert("모든 캐시가 삭제되었습니다.");
        }
    }, []);

    // 🆕 정산 진행 상태 확인
    const checkSettlementProgress = useCallback(async () => {
        setLoadingProgress(true);
        try {
            const result = await getSettlementProgress(poll.id);
            if (result.success) {
                setSettlementProgress(result);
            }
        } catch (error) {
            console.error("정산 진행 상태 확인 실패:", error);
        } finally {
            setLoadingProgress(false);
        }
    }, [poll.id]);

    // 🆕 정산 재개
    const handleResumeSettlement = useCallback(async () => {
        if (!settlementProgress?.progress) return;

        const remainingPlayers = settlementProgress.progress.unsettledPlayers;
        const confirmMessage =
            `🔄 정산 재개\n\n` +
            `남은 플레이어: ${remainingPlayers}명\n` +
            `현재 진행률: ${settlementProgress.progress.settlementProgress.toFixed(
                1
            )}%\n\n` +
            `재개하시겠습니까?`;

        if (!confirm(confirmMessage)) return;

        setResuming(true);
        try {
            const result = await resumeSettlement(poll.id);
            if (result.success) {
                setSettlementResult({
                    success: true,
                    message: `정산 재개됨: ${result.message}`,
                });
                const progressResult = await getSettlementProgress(poll.id);
                if (progressResult.success) {
                    setSettlementProgress(progressResult);
                }
            } else {
                setSettlementResult({
                    success: false,
                    message: result.error || "정산 재개 실패",
                });
            }
        } catch (error) {
            console.error("정산 재개 실패:", error);
            setSettlementResult({
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "정산 재개 중 오류 발생",
            });
        } finally {
            setResuming(false);
        }
    }, [poll.id, settlementProgress]);

    // 🆕 정산 일시정지
    const handlePauseSettlement = useCallback(async () => {
        if (!confirm("진행 중인 정산을 일시정지하시겠습니까?")) return;

        setPausing(true);
        try {
            const result = await pauseSettlement(poll.id);
            if (result.success) {
                setSettlementResult({
                    success: true,
                    message: "정산이 일시정지되었습니다.",
                });
                const progressResult = await getSettlementProgress(poll.id);
                if (progressResult.success) {
                    setSettlementProgress(progressResult);
                }
            } else {
                setSettlementResult({
                    success: false,
                    message: result.error || "정산 일시정지 실패",
                });
            }
        } catch (error) {
            console.error("정산 일시정지 실패:", error);
            setSettlementResult({
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "정산 일시정지 중 오류 발생",
            });
        } finally {
            setPausing(false);
        }
    }, [poll.id]);

    const formatPercentage = (value: number) => {
        return `${(value * 100).toFixed(1)}%`;
    };

    const handleOptionToggle = useCallback(
        (optionId: string) => {
            if (!winningOptionConfirmed) {
                alert("먼저 승리 옵션을 확인해주세요.");
                return;
            }

            setSelectedWinningOptions((prev) => {
                const newSet = new Set(prev);
                if (newSet.has(optionId)) {
                    newSet.delete(optionId);
                } else {
                    newSet.add(optionId);
                }
                return newSet;
            });
        },
        [winningOptionConfirmed]
    );

    const handleConfirmWinningOption = useCallback(async () => {
        if (!bettingStats) {
            alert("먼저 '베팅 통계 불러오기' 버튼을 클릭해주세요.");
            return;
        }

        if (
            !bettingStats.optionStats ||
            bettingStats.optionStats.length === 0
        ) {
            alert("베팅 데이터가 없습니다.");
            return;
        }

        // 가장 많은 참여자를 받은 옵션 찾기 (투표 수 기준)
        const topOption = bettingStats.optionStats.reduce(
            (prev: any, current: any) =>
                prev.participantCount > current.participantCount
                    ? prev
                    : current
        );

        const pollOptionsArray = poll.options as Array<{
            optionId: string;
            name: string;
        }>;

        const winningOption = pollOptionsArray.find(
            (opt) => opt.optionId === topOption.optionId
        );

        if (!winningOption) {
            alert("승리 옵션을 찾을 수 없습니다.");
            return;
        }

        const confirmed = confirm(
            `가장 많은 참여자를 받은 옵션은 "${winningOption.name}"입니다.\n` +
                `참여자: ${topOption.participantCount}명\n` +
                `베팅 금액: ${formatAmount(topOption.totalAmount)}\n\n` +
                `이 옵션으로 정산을 진행하시겠습니까?`
        );

        if (confirmed) {
            setSelectedWinningOptions(new Set([topOption.optionId]));
            setWinningOptionConfirmed(true);
        }
    }, [poll, bettingStats]);

    const resetState = useCallback(() => {
        setSelectedWinningOptions(new Set());
        setSettlementResult(null);
        setActiveTab("preview");
        setWinningOptionConfirmed(false);
    }, []);

    const handleClose = useCallback(() => {
        resetState();
        onClose();
    }, [resetState, onClose]);

    // 수동 베팅 통계 로딩
    const handleLoadBettingStats = useCallback(async () => {
        setLoadingBettingStats(true);
        try {
            const stats = await getBettingModeStats({ pollId: poll.id });
            setBettingStats(stats);
            alert("베팅 통계를 불러왔습니다.");
        } catch (error) {
            console.error("베팅 통계를 가져오는데 실패했습니다:", error);
            setBettingStats(null);
            alert("베팅 통계를 불러오는데 실패했습니다.");
        } finally {
            setLoadingBettingStats(false);
        }
    }, [poll.id]);

    if (!isOpen) return null;

    const pollOptions =
        (poll.options as Array<{ optionId: string; name: string }>) || [];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                베팅 정산 관리
                            </h2>
                            <p className="text-gray-400 mt-1">
                                {poll.titleShorten || poll.title}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() =>
                                    setShowCacheStats(!showCacheStats)
                                }
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                                title="캐시 통계 보기"
                            >
                                <Database className="w-4 h-4" />
                                캐시 관리
                            </button>
                            <button
                                onClick={handleClose}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 캐시 관리 패널 */}
                {showCacheStats && (
                    <div className="p-4 bg-gray-800 border-b border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-white flex items-center gap-2">
                                <BarChart3 className="w-5 h-5" />
                                정산 캐시 통계
                            </h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={refreshCacheStats}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-500 transition-colors"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    새로고침
                                </button>
                                <button
                                    onClick={clearCache}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white text-xs rounded-md hover:bg-orange-700 transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" />이 폴 캐시
                                    삭제
                                </button>
                                <button
                                    onClick={clearAllCache}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    전체 캐시 삭제
                                </button>
                            </div>
                        </div>

                        {cacheStats && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gray-900 p-3 rounded-lg">
                                    <div className="text-sm text-gray-400">
                                        총 캐시 항목
                                    </div>
                                    <div className="text-xl font-bold text-white">
                                        {cacheStats.totalEntries}
                                    </div>
                                </div>
                                <div className="bg-gray-900 p-3 rounded-lg">
                                    <div className="text-sm text-gray-400">
                                        유효한 캐시
                                    </div>
                                    <div className="text-xl font-bold text-green-400">
                                        {cacheStats.validEntries}
                                    </div>
                                </div>
                                <div className="bg-gray-900 p-3 rounded-lg">
                                    <div className="text-sm text-gray-400">
                                        만료된 캐시
                                    </div>
                                    <div className="text-xl font-bold text-red-400">
                                        {cacheStats.expiredEntries}
                                    </div>
                                </div>
                                <div className="bg-gray-900 p-3 rounded-lg">
                                    <div className="text-sm text-gray-400">
                                        메모리 사용량
                                    </div>
                                    <div className="text-xl font-bold text-blue-400">
                                        {cacheStats.memoryUsage}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-4 text-xs text-gray-500">
                            💡 캐시는 5분 후 자동 만료됩니다. 폴 상태가 변경되면
                            관련 캐시를 수동으로 삭제하세요.
                        </div>
                    </div>
                )}

                {/* 🆕 정산 진행 상태 패널 */}
                {settlementProgress && (
                    <div className="p-4 bg-gray-800 border-b border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-white flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                정산 진행 상태
                            </h3>
                            <div className="flex items-center gap-2">
                                {settlementProgress.progress.unsettledPlayers >
                                    0 &&
                                    !settlementProgress.progress
                                        .isFullySettled && (
                                        <button
                                            onClick={handleResumeSettlement}
                                            disabled={resuming}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                        >
                                            {resuming ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <SkipForward className="w-3 h-3" />
                                            )}
                                            정산 재개
                                        </button>
                                    )}

                                {settlementProgress.settlementLog?.status ===
                                    "PENDING" && (
                                    <button
                                        onClick={handlePauseSettlement}
                                        disabled={pausing}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white text-xs rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
                                    >
                                        {pausing ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <Pause className="w-3 h-3" />
                                        )}
                                        일시정지
                                    </button>
                                )}

                                <button
                                    onClick={checkSettlementProgress}
                                    disabled={loadingProgress}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-500 transition-colors"
                                >
                                    <RefreshCw
                                        className={`w-3 h-3 ${
                                            loadingProgress
                                                ? "animate-spin"
                                                : ""
                                        }`}
                                    />
                                    새로고침
                                </button>
                            </div>
                        </div>

                        {/* 진행률 표시 */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">
                                    정산 진행률
                                </span>
                                <span className="text-sm text-white">
                                    {settlementProgress.progress.settledPlayers}{" "}
                                    / {settlementProgress.progress.totalPlayers}
                                    (
                                    {settlementProgress.progress.settlementProgress.toFixed(
                                        1
                                    )}
                                    %)
                                </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-3">
                                <div
                                    className={`h-3 rounded-full transition-all duration-500 ${
                                        settlementProgress.progress
                                            .isFullySettled
                                            ? "bg-green-600"
                                            : settlementProgress.progress
                                                  .settlementProgress > 0
                                            ? "bg-blue-600"
                                            : "bg-gray-600"
                                    }`}
                                    style={{
                                        width: `${settlementProgress.progress.settlementProgress}%`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* 상태 정보 그리드 */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-900 p-3 rounded-lg">
                                <div className="text-sm text-gray-400 mb-1">
                                    전체 플레이어
                                </div>
                                <div className="text-xl font-bold text-white">
                                    {settlementProgress.progress.totalPlayers}
                                </div>
                            </div>
                            <div className="bg-gray-900 p-3 rounded-lg">
                                <div className="text-sm text-gray-400 mb-1">
                                    정산 완료
                                </div>
                                <div className="text-xl font-bold text-green-400">
                                    {settlementProgress.progress.settledPlayers}
                                </div>
                            </div>
                            <div className="bg-gray-900 p-3 rounded-lg">
                                <div className="text-sm text-gray-400 mb-1">
                                    미정산
                                </div>
                                <div className="text-xl font-bold text-yellow-400">
                                    {
                                        settlementProgress.progress
                                            .unsettledPlayers
                                    }
                                </div>
                            </div>
                            <div className="bg-gray-900 p-3 rounded-lg">
                                <div className="text-sm text-gray-400 mb-1">
                                    정산 상태
                                </div>
                                <div
                                    className={`text-lg font-bold ${
                                        settlementProgress.progress
                                            .isFullySettled
                                            ? "text-green-400"
                                            : settlementProgress.settlementLog
                                                  ?.status === "PENDING"
                                            ? "text-blue-400"
                                            : settlementProgress.settlementLog
                                                  ?.status === "PARTIAL"
                                            ? "text-yellow-400"
                                            : "text-gray-400"
                                    }`}
                                >
                                    {settlementProgress.progress.isFullySettled
                                        ? "완료"
                                        : settlementProgress.settlementLog
                                              ?.status === "PENDING"
                                        ? "진행중"
                                        : settlementProgress.settlementLog
                                              ?.status === "PARTIAL"
                                        ? "일시정지"
                                        : "대기"}
                                </div>
                            </div>
                        </div>

                        {/* 정산 로그 정보 */}
                        {settlementProgress.settlementLog && (
                            <div className="mt-4 p-3 bg-gray-900 rounded-lg">
                                <div className="text-sm text-gray-400 mb-2">
                                    정산 로그 정보
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                                    <div>
                                        <span className="text-gray-400">
                                            로그 ID:{" "}
                                        </span>
                                        <span className="text-white font-mono">
                                            {settlementProgress.settlementLog.id.slice(
                                                -8
                                            )}
                                        </span>
                                    </div>
                                    {settlementProgress.settlementLog
                                        .settlementStartedAt && (
                                        <div>
                                            <span className="text-gray-400">
                                                시작 시간:{" "}
                                            </span>
                                            <span className="text-white">
                                                {new Date(
                                                    settlementProgress.settlementLog.settlementStartedAt
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    {settlementProgress.settlementLog
                                        .totalPayout > 0 && (
                                        <div>
                                            <span className="text-gray-400">
                                                총 지급액:{" "}
                                            </span>
                                            <span className="text-green-400">
                                                {formatAmount(
                                                    settlementProgress
                                                        .settlementLog
                                                        .totalPayout
                                                )}
                                                원
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 재개 가능 상태 표시 */}
                        {settlementProgress.progress.unsettledPlayers > 0 &&
                            !settlementProgress.progress.isFullySettled && (
                                <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-yellow-400" />
                                        <span className="text-sm text-yellow-400">
                                            {
                                                settlementProgress.progress
                                                    .unsettledPlayers
                                            }
                                            명의 플레이어가 정산 대기 중입니다.
                                            재개 버튼을 눌러 계속 정산할 수
                                            있습니다.
                                        </span>
                                    </div>
                                </div>
                            )}

                        {/* 완료 상태 표시 */}
                        {settlementProgress.progress.isFullySettled && (
                            <div className="mt-3 p-3 bg-green-900/20 border border-green-800 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                    <span className="text-sm text-green-400">
                                        모든 플레이어의 정산이 완료되었습니다!
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="p-6 space-y-6">
                    {settlementResult ? (
                        <div className="space-y-4">
                            <div
                                className={`p-4 rounded-lg border ${
                                    settlementResult.success
                                        ? "bg-green-900/20 border-green-800 text-green-400"
                                        : "bg-red-900/20 border-red-800 text-red-400"
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    {settlementResult.success ? (
                                        <CheckCircle className="w-5 h-5" />
                                    ) : (
                                        <AlertTriangle className="w-5 h-5" />
                                    )}
                                    <span className="font-medium">
                                        {settlementResult.success
                                            ? "정산 완료"
                                            : "정산 실패"}
                                    </span>
                                </div>
                                <p className="text-sm">
                                    {settlementResult.message}
                                </p>
                                {settlementResult.error && (
                                    <p className="text-xs mt-2 opacity-75">
                                        {settlementResult.error}
                                    </p>
                                )}
                            </div>
                            {settlementResult.success && (
                                <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3 mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="w-4 h-4 text-blue-400" />
                                        <span className="text-sm font-medium text-blue-400">
                                            정산 결과를 확인해주세요
                                        </span>
                                    </div>
                                    <p className="text-xs text-blue-300">
                                        {`일괄정산이 완료되었습니다. 결과를 확인한
                                        후 "확인 완료" 버튼을 클릭하여 모달을
                                        닫아주세요.`}
                                    </p>
                                </div>
                            )}
                            <div className="flex gap-2">
                                {settlementResult.success ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                onSettlementComplete();
                                                handleClose();
                                            }}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            확인 완료
                                        </button>
                                        <button
                                            onClick={resetState}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            추가 정산하기
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleClose}
                                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                        >
                                            닫기
                                        </button>
                                        <button
                                            onClick={resetState}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            다시 시도
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-800 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <DollarSign className="w-4 h-4 text-green-400" />
                                        <span className="text-sm font-medium text-white">
                                            총 베팅 금액
                                        </span>
                                    </div>
                                    <div className="text-2xl font-bold text-white">
                                        {formatAmount(poll.totalVotes)}
                                    </div>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users className="w-4 h-4 text-blue-400" />
                                        <span className="text-sm font-medium text-white">
                                            총 투표 수
                                        </span>
                                    </div>
                                    <div className="text-2xl font-bold text-white">
                                        {bettingStats
                                            ? formatAmount(
                                                  bettingStats.totalParticipants
                                              )
                                            : "로딩 중..."}
                                    </div>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calculator className="w-4 h-4 text-orange-400" />
                                        <span className="text-sm font-medium text-white">
                                            수수료율
                                        </span>
                                    </div>
                                    <div className="text-2xl font-bold text-white">
                                        {formatPercentage(
                                            poll.houseCommissionRate
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-white">
                                    승리 옵션 선택
                                </h3>

                                {!winningOptionConfirmed && (
                                    <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle className="w-4 h-4 text-blue-400" />
                                            <span className="text-sm font-medium text-blue-400">
                                                승리 옵션 확인 필요
                                            </span>
                                        </div>
                                        <p className="text-sm text-blue-300 mb-3">
                                            정해진 승리 옵션을 확인하고
                                            선택해주세요.
                                        </p>

                                        {/* 로딩 상태 표시 */}
                                        {loadingBettingStats && (
                                            <div className="flex items-center gap-2 text-xs text-blue-300 mb-3">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                베팅 통계를 불러오는 중...
                                            </div>
                                        )}

                                        {/* 베팅 통계가 없을 때 수동 로딩 버튼 */}
                                        {!loadingBettingStats &&
                                            !bettingStats && (
                                                <div className="space-y-3 mb-2">
                                                    <div className="flex items-center gap-2 text-xs text-yellow-300">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        먼저 베팅 통계를
                                                        불러와주세요.
                                                    </div>
                                                    <button
                                                        onClick={
                                                            handleLoadBettingStats
                                                        }
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
                                                    >
                                                        <RefreshCw className="w-3 h-3" />
                                                        베팅 통계 불러오기
                                                    </button>
                                                </div>
                                            )}

                                        <button
                                            onClick={handleConfirmWinningOption}
                                            disabled={
                                                loadingBettingStats ||
                                                !bettingStats
                                            }
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {loadingBettingStats ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <CheckCircle className="w-4 h-4" />
                                            )}
                                            {loadingBettingStats
                                                ? "로딩 중..."
                                                : "승리 옵션 확인"}
                                        </button>
                                    </div>
                                )}

                                {winningOptionConfirmed && (
                                    <div className="bg-green-900/20 border border-green-800 rounded-lg p-4 mb-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                            <span className="text-sm font-medium text-green-400">
                                                승리 옵션 확인 완료
                                            </span>
                                        </div>
                                        <p className="text-sm text-green-300">
                                            이제 다른 옵션을 선택하거나 정산을
                                            진행할 수 있습니다.
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {pollOptions.map((option) => {
                                        const isSelected =
                                            selectedWinningOptions.has(
                                                option.optionId
                                            );

                                        return (
                                            <label
                                                key={option.optionId}
                                                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                                                    !winningOptionConfirmed
                                                        ? "bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed"
                                                        : isSelected
                                                        ? "bg-blue-900/20 border-blue-600 text-blue-400"
                                                        : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() =>
                                                        handleOptionToggle(
                                                            option.optionId
                                                        )
                                                    }
                                                    disabled={
                                                        !winningOptionConfirmed
                                                    }
                                                    className="sr-only"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium">
                                                        {option.name}
                                                    </div>
                                                    <div className="text-xs opacity-75">
                                                        ID: {option.optionId}
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <CheckCircle className="w-4 h-4" />
                                                )}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {selectedWinningOptions.size > 0 && (
                                <div className="border-t border-gray-700 pt-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <button
                                            onClick={() =>
                                                setActiveTab("players")
                                            }
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                                activeTab === "players"
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                            }`}
                                        >
                                            <UserCheck className="w-4 h-4" />
                                            참여자 목록
                                        </button>
                                    </div>

                                    {activeTab === "players" && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                                                    <UserCheck className="w-5 h-5" />
                                                    참여자 목록
                                                </h3>
                                                {selectedPlayers.length > 0 && (
                                                    <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3">
                                                        <div className="text-sm text-blue-400">
                                                            선택된 참여자:{" "}
                                                            {
                                                                selectedPlayers.length
                                                            }
                                                            명
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {selectedPlayers
                                                                .slice(0, 3)
                                                                .map(
                                                                    (
                                                                        playerId
                                                                    ) =>
                                                                        playerId.slice(
                                                                            -6
                                                                        )
                                                                )
                                                                .join(", ")}
                                                            {selectedPlayers.length >
                                                                3 && "..."}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <SettlementPlayers
                                                poll={poll}
                                                winningOptionIds={Array.from(
                                                    selectedWinningOptions
                                                )}
                                                onSelectedPlayersChange={
                                                    setSelectedPlayers
                                                }
                                                onBulkSettlementResult={(
                                                    result
                                                ) => {
                                                    if (result.success) {
                                                        setSettlementResult({
                                                            success: true,
                                                            message: `일괄 정산이 완료되었습니다. ${
                                                                result.summary
                                                                    ?.totalSuccess ||
                                                                0
                                                            }명 성공, ${
                                                                result.summary
                                                                    ?.totalFailed ||
                                                                0
                                                            }명 실패.`,
                                                        });
                                                    } else {
                                                        setSettlementResult({
                                                            success: false,
                                                            message:
                                                                "일괄 정산 중 오류가 발생했습니다.",
                                                            error: result.error,
                                                        });
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
