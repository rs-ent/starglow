"use client";

import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import {
    getPollParticipants,
    getSettlementAmountSinglePlayer,
    resumeSettlement,
} from "@/app/actions/polls/polls-bettingMode";
import type { Poll } from "@prisma/client";
import { formatAmount, formatPlayerName } from "@/lib/utils/formatting";
import LiveLog from "./Admin.Polls.BettingMode.Settlement.LiveLog";
import {
    usePlayerSelection,
    useSettlementCalculation,
    useBulkSettlement,
    useTabFiltering,
} from "./hooks/useBettingModeOptimized";
import {
    type CalculationDetails,
    type PlayerTab,
    type SortBy,
    type SortOrder,
} from "./types/betting-mode";
import {
    TabNavigation,
    ParticipantsTable,
    PlayerRow,
    Pagination,
    CalculationModal,
} from "./components/PlayerComponents";
import { RefreshCw, Calculator, X, Zap } from "lucide-react";

interface SettlementPlayersProps {
    poll: Poll;
    winningOptionIds: string[];
    onSelectedPlayersChange?: (selectedPlayers: string[]) => void;
    onBulkSettlementResult?: (result: {
        success: boolean;
        summary?: { totalSuccess: number; totalFailed: number };
        error?: string;
    }) => void;
}

export default function SettlementPlayers({
    poll,
    winningOptionIds,
    onSelectedPlayersChange,
    onBulkSettlementResult,
}: SettlementPlayersProps) {
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalParticipants, setTotalParticipants] = useState(0);
    const [totalBetAmount, setTotalBetAmount] = useState(0);
    const [sortBy, setSortBy] = useState<SortBy>("totalAmount");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [calculationModalOpen, setCalculationModalOpen] = useState(false);
    const [calculationDetails, setCalculationDetails] =
        useState<CalculationDetails | null>(null);
    const [playerWinStatus, setPlayerWinStatus] = useState<
        Record<string, boolean>
    >({});
    const [autoSettling, setAutoSettling] = useState(false);
    const [autoSettlementProgress, setAutoSettlementProgress] = useState<{
        currentBatch: number;
        totalBatches: number;
        processedCount: number;
        remainingCount: number;
        totalPlayers: number;
    } | null>(null);
    const autoSettlementCancelRef = useRef(false);

    const {
        selectedPlayers,
        handlePlayerSelect,
        handleSelectAll,
        handleDeselectAll,
        safetyCheck,
    } = usePlayerSelection();

    const {
        settlementAmounts,
        settlementResults,
        settlementStatus,
        calculateSettlementAmount,
    } = useSettlementCalculation(poll, winningOptionIds);

    const {
        bulkSettling,
        executeBulkSettlement,
    } = useBulkSettlement(poll, winningOptionIds);

    const { activeTab, setActiveTab, filteredParticipants, tabStats } =
        useTabFiltering(participants, playerWinStatus, settlementStatus);

    const fetchParticipants = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getPollParticipants({
                pollId: poll.id,
                page: currentPage,
                limit: 20,
                sortBy,
                sortOrder,
            });

            if (result.success) {
                setParticipants(result.participants);
                setTotalPages(result.pagination.totalPages);
                setTotalParticipants(result.summary.totalParticipants);
                setTotalBetAmount(result.summary.totalBetAmount);
            }
        } catch (error) {
            console.error("Failed to fetch participants:", error);
        } finally {
            setLoading(false);
        }
    }, [poll.id, currentPage, sortBy, sortOrder]);

    const checkPlayerWinStatus = useCallback(
        async (playerId: string) => {
            try {
                const result = await getSettlementAmountSinglePlayer({
                    pollId: poll.id,
                    playerId,
                    winningOptionIds,
                });

                if (result.success) {
                    const hasWinningBets = result.winningBets.some(
                        (bet) => bet.isWinningOption
                    );
                    setPlayerWinStatus((prev) => ({
                        ...prev,
                        [playerId]: hasWinningBets,
                    }));
                    return hasWinningBets;
                }
            } catch (error) {
                console.error("Failed to check player win status:", error);
            }
            return false;
        },
        [poll.id, winningOptionIds]
    );

    const generateCalculationSteps = useCallback(
        (result: any, poll: Poll) => {
            const steps = [];

            steps.push({
                step: "1. 총 베팅 금액",
                value: result.totalBetAmount,
                description: "플레이어가 베팅한 총 금액",
            });

            if (winningOptionIds.length === 0) {
                steps.push({
                    step: "2. 승리 옵션 없음",
                    value: 0,
                    description: "승리 옵션이 없으므로 전체 환불",
                });
                steps.push({
                    step: "3. 최종 정산 금액",
                    value: result.refundAmount,
                    description: "환불 금액 = 총 베팅 금액",
                });
            } else {
                const winningBets = result.winningBets.filter(
                    (bet: any) => bet.isWinningOption
                );
                const totalWinningAmount = winningBets.reduce(
                    (sum: number, bet: any) => sum + bet.betAmount,
                    0
                );

                steps.push({
                    step: "2. 승리 베팅 금액",
                    value: totalWinningAmount,
                    description: `승리 옵션에 베팅한 금액 (${winningBets.length}개 옵션)`,
                });

                if (totalWinningAmount > 0) {
                    const actualTotalBetAmount = result.pollTotalBetAmount || 0;
                    const totalPayoutPool = Math.max(
                        0,
                        actualTotalBetAmount - (poll.totalCommissionAmount || 0)
                    );

                    const totalWinningBetAmount =
                        result.totalWinningBetAmount || 0;
                    const payoutRatio =
                        totalWinningAmount / totalWinningBetAmount;
                    const calculatedPayout = Math.floor(
                        totalPayoutPool * payoutRatio
                    );

                    steps.push(
                        {
                            step: "3. 총 베팅 금액 (폴 전체)",
                            value: actualTotalBetAmount,
                            description: "폴 전체의 총 베팅 금액",
                        },
                        {
                            step: "4. 수수료",
                            value: poll.totalCommissionAmount || 0,
                            description: "하우스 수수료",
                        },
                        {
                            step: "5. 총 상금 풀",
                            value: totalPayoutPool,
                            description: `총 베팅 금액 - 수수료 (${actualTotalBetAmount} - ${
                                poll.totalCommissionAmount || 0
                            })`,
                        },
                        {
                            step: "6. 전체 승리 베팅",
                            value: totalWinningBetAmount,
                            description: "전체 승리 옵션에 베팅된 총 금액",
                        },
                        {
                            step: "7. 플레이어 배당 비율",
                            value: payoutRatio,
                            description: `플레이어 승리 베팅 / 전체 승리 베팅 (${totalWinningAmount} / ${totalWinningBetAmount})`,
                        },
                        {
                            step: "8. 계산된 상금",
                            value: calculatedPayout,
                            description: `상금 풀 × 배당 비율 (${totalPayoutPool} × ${payoutRatio.toFixed(
                                4
                            )})`,
                        },
                        {
                            step: "9. 최종 정산 금액",
                            value: result.payoutAmount,
                            description: "최종 지급 상금",
                        }
                    );
                } else {
                    steps.push(
                        {
                            step: "3. 승리 베팅 없음",
                            value: 0,
                            description: "승리 옵션에 베팅하지 않음",
                        },
                        {
                            step: "4. 최종 정산 금액",
                            value: result.refundAmount,
                            description: "환불 금액 = 0",
                        }
                    );
                }
            }

            return steps;
        },
        [winningOptionIds]
    );

    const handleBulkSettlement = useCallback(async () => {
        const result = await executeBulkSettlement(Array.from(selectedPlayers));
        if (result?.success) {
            fetchParticipants().catch((err) => {
                console.error("Error fetching participants:", err);
            });
        }
        if (onBulkSettlementResult && result) {
            onBulkSettlementResult(result);
        }
    }, [
        executeBulkSettlement,
        selectedPlayers,
        fetchParticipants,
        onBulkSettlementResult,
    ]);

    const handleAutoSettlement = useCallback(async () => {
        if (autoSettling) return;

        try {
            setAutoSettling(true);
            autoSettlementCancelRef.current = false;
            setAutoSettlementProgress(null);

            let currentBatch = 1;
            let totalProcessedCount = 0;
            let remainingCount = 0;

            while (!autoSettlementCancelRef.current) {

                const result = await resumeSettlement(poll.id, 25, 25000);

                if (!result.success) {
                    if (result.timeoutOccurred) {
                        await new Promise((resolve) =>
                            setTimeout(resolve, 1000)
                        );
                        continue;
                    } else {
                        throw new Error(result.error || "자동 정산 실패");
                    }
                }

                totalProcessedCount += result.processedCount || 0;
                remainingCount = result.remainingCount || 0;

                if (result.detailedProgress) {
                    setAutoSettlementProgress({
                        currentBatch,
                        totalBatches:
                            result.detailedProgress.batchInfo.totalBatches,
                        processedCount: totalProcessedCount,
                        remainingCount,
                        totalPlayers: result.detailedProgress.totalParticipants,
                    });
                }

                if (remainingCount === 0) {
                    break;
                }

                currentBatch++;
                await new Promise((resolve) => setTimeout(resolve, 500));
            }

            if (autoSettlementCancelRef.current) {
                onBulkSettlementResult?.({
                    success: false,
                    error: "자동 정산이 취소되었습니다",
                });
            } else {
            }

            await fetchParticipants();
        } catch (error) {
            console.error("자동 정산 오류:", error);
            onBulkSettlementResult?.({
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "자동 정산 중 오류 발생",
            });
        } finally {
            setAutoSettling(false);
            setAutoSettlementProgress(null);
            autoSettlementCancelRef.current = false;
        }
    }, [poll.id, autoSettling, fetchParticipants, onBulkSettlementResult]);

    const handleCancelAutoSettlement = useCallback(() => {
        autoSettlementCancelRef.current = true;
    }, []);

    const handleSort = useCallback(
        (newSortBy: SortBy) => {
            if (sortBy === newSortBy) {
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
            } else {
                setSortBy(newSortBy);
                setSortOrder("desc");
            }
            setCurrentPage(1);
        },
        [sortBy]
    );

    const handleTabChange = useCallback(
        (tab: PlayerTab) => {
            setActiveTab(tab);
            setCurrentPage(1);
        },
        [setActiveTab]
    );

    const handleShowCalculation = useCallback(
        async (playerId: string) => {
            const participant = participants.find(
                (p) => p.playerId === playerId
            );

            if (settlementResults[playerId]) {
                const calculationSteps = generateCalculationSteps(
                    settlementResults[playerId],
                    poll
                );

                setCalculationDetails({
                    playerId,
                    playerName: formatPlayerName(
                        playerId,
                        participant?.nickname
                    ),
                    totalBetAmount: settlementResults[playerId].totalBetAmount,
                    winningBets: settlementResults[playerId].winningBets,
                    payoutAmount: settlementResults[playerId].payoutAmount,
                    refundAmount: settlementResults[playerId].refundAmount,
                    commissionAmount:
                        settlementResults[playerId].commissionAmount,
                    calculationSteps,
                    rewardLogIssue: settlementResults[playerId].rewardLogIssue,
                });
                setCalculationModalOpen(true);
            }
        },
        [participants, settlementResults, generateCalculationSteps, poll]
    );

    // 개별 플레이어 승리/패배 상태 확인
    const handleCheckSinglePlayerStatus = useCallback(
        async (playerId: string) => {
            if (playerWinStatus[playerId] !== undefined) {
                alert("이미 확인된 플레이어입니다.");
                return;
            }

            try {
                await checkPlayerWinStatus(playerId);
                alert("승리/패배 상태를 확인했습니다.");
            } catch (error) {
                console.error("Error checking player win status:", error);
                alert("상태 확인 중 오류가 발생했습니다.");
            }
        },
        [playerWinStatus, checkPlayerWinStatus]
    );

    const handleForceResettle = useCallback(
        async (playerId: string) => {
            const playerStatus = settlementStatus[playerId];
            const participant = participants.find(
                (p) => p.playerId === playerId
            );
            const playerName = formatPlayerName(
                playerId,
                participant?.nickname
            );

            let confirmMessage = `🔄 강제 재정산 실행\n\n`;
            confirmMessage += `플레이어: ${playerName}\n`;
            confirmMessage += `ID: ${playerId}\n\n`;

            if (playerStatus?.status === "settled") {
                confirmMessage += `⚠️ 이미 정산된 플레이어입니다!\n`;
                confirmMessage += `기존 정산 금액: ${formatAmount(
                    playerStatus.settlementAmount
                )}\n`;
                confirmMessage += `정산 기록 수: ${
                    playerStatus.settlementLogs?.length || 0
                }개\n\n`;
                confirmMessage += `재정산하면 새로운 정산 기록이 추가됩니다.\n`;
            } else if (playerStatus?.status === "error") {
                confirmMessage += `❌ 정산 오류가 있는 플레이어입니다.\n`;
                confirmMessage += `오류 메시지: ${
                    playerStatus.mismatchMessage || "알 수 없는 오류"
                }\n\n`;
            } else if (playerStatus?.status === "missing_bet") {
                confirmMessage += `📭 베팅 기록이 없는 플레이어입니다.\n`;
                confirmMessage += `재정산해도 0원이 될 수 있습니다.\n\n`;
            }

            confirmMessage += `정말 재정산하시겠습니까?`;

            if (!confirm(confirmMessage)) {
                return;
            }

            try {
                const result = await executeBulkSettlement([playerId]);

                if (result?.success) {
                    const playerResult = result.results[0];
                    if (playerResult?.success) {
                        alert(
                            `재정산 완료!\n\n플레이어: ${playerName}\n정산 금액: ${formatAmount(
                                playerResult.settlementAmount
                            )}`
                        );
                    } else {
                        alert(
                            `재정산 실패!\n\n플레이어: ${playerName}\n오류: ${
                                playerResult?.error || "알 수 없는 오류"
                            }`
                        );
                    }
                } else {
                    alert(
                        `재정산 실패!\n\n오류: ${
                            result?.error || "알 수 없는 오류"
                        }`
                    );
                }

                await fetchParticipants();
                await calculateSettlementAmount(playerId);
            } catch (error) {
                console.error(`강제 재정산 오류 (${playerId}):`, error);
                alert(
                    `재정산 중 오류가 발생했습니다.\n\n${
                        error instanceof Error
                            ? error.message
                            : "알 수 없는 오류"
                    }`
                );
            }
        },
        [
            settlementStatus,
            participants,
            executeBulkSettlement,
            fetchParticipants,
            calculateSettlementAmount,
        ]
    );

    const memoizedPlayerRows = useMemo(() => {
        return filteredParticipants.map((participant) => (
            <PlayerRow
                key={participant.playerId}
                participant={participant}
                isSelected={selectedPlayers.has(participant.playerId)}
                isWinner={playerWinStatus[participant.playerId]}
                settlementAmount={settlementAmounts[participant.playerId]}
                settlementStatus={settlementStatus[participant.playerId]}
                settlementResults={settlementResults[participant.playerId]}
                onPlayerSelect={handlePlayerSelect}
                onShowCalculation={handleShowCalculation}
                onForceResettle={handleForceResettle}
                onCalculateSettlement={calculateSettlementAmount}
                onCheckPlayerStatus={handleCheckSinglePlayerStatus}
            />
        ));
    }, [
        filteredParticipants,
        selectedPlayers,
        playerWinStatus,
        settlementAmounts,
        settlementStatus,
        settlementResults,
        handlePlayerSelect,
        handleShowCalculation,
        handleForceResettle,
        calculateSettlementAmount,
        handleCheckSinglePlayerStatus,
    ]);

    // 수동 새로고침 - 버튼 클릭 시에만 실행
    const handleManualRefresh = useCallback(async () => {
        await fetchParticipants().catch((err) => {
            console.error("Error fetching participants:", err);
        });
    }, [fetchParticipants]);

    // 페이지 변경 시에만 데이터 다시 로드
    useEffect(() => {
        if (participants.length > 0) {
            handleManualRefresh().catch((err) => {
                console.error("Error fetching participants:", err);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, sortBy, sortOrder]);

    useEffect(() => {
        if (onSelectedPlayersChange) {
            onSelectedPlayersChange(Array.from(selectedPlayers));
        }
    }, [selectedPlayers, onSelectedPlayersChange]);

    return (
        <div className="space-y-4">
            <SettlementHeader
                totalParticipants={totalParticipants}
                totalBetAmount={totalBetAmount}
                safetyCheck={safetyCheck}
                onBulkSettlement={handleBulkSettlement}
                onRefresh={handleManualRefresh}
                bulkSettling={bulkSettling}
                loading={loading}
                autoSettling={autoSettling}
                autoSettlementProgress={autoSettlementProgress}
                onAutoSettlement={handleAutoSettlement}
                onCancelAutoSettlement={handleCancelAutoSettlement}
            />

            <TabNavigation
                activeTab={activeTab}
                tabStats={tabStats}
                onTabChange={handleTabChange}
                onSelectAll={() =>
                    handleSelectAll(participants.map((p) => p.playerId))
                }
                onDeselectAll={handleDeselectAll}
            />

            <ParticipantsTable
                loading={loading}
                activeTab={activeTab}
                memoizedRows={memoizedPlayerRows}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                onRefresh={fetchParticipants}
            />

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            <CalculationModal
                isOpen={calculationModalOpen}
                calculationDetails={calculationDetails}
                onClose={() => setCalculationModalOpen(false)}
            />

            {/* BulkSettlementResultModal 비활성화 - Settlement 컴포넌트에서 결과 표시 */}
            {/* <BulkSettlementResultModal
                result={bulkSettlementResult}
                onClose={clearResult}
            /> */}

            <LiveLog
                poll={poll}
                winningOptionIds={winningOptionIds}
                selectedPlayers={Array.from(selectedPlayers)}
                onLogUpdate={(logs) => {
                    console.info("LiveLog updated:", logs);
                }}
                onPollSettlementComplete={() => {
                    fetchParticipants().catch((err) => {
                        console.error("Error fetching participants:", err);
                    });
                }}
            />
        </div>
    );
}

const SettlementHeader = ({
    totalParticipants,
    totalBetAmount,
    safetyCheck,
    onBulkSettlement,
    onRefresh,
    bulkSettling,
    loading,
    autoSettling,
    autoSettlementProgress,
    onAutoSettlement,
    onCancelAutoSettlement,
}: {
    totalParticipants: number;
    totalBetAmount: number;
    safetyCheck: {
        count: number;
        isWarning: boolean;
        isDanger: boolean;
        canProceed: boolean;
        getMessage: () => string;
    };
    onBulkSettlement: () => void;
    onRefresh: () => void;
    bulkSettling: boolean;
    loading: boolean;
    autoSettling: boolean;
    autoSettlementProgress: {
        currentBatch: number;
        totalBatches: number;
        processedCount: number;
        remainingCount: number;
        totalPlayers: number;
    } | null;
    onAutoSettlement: () => void;
    onCancelAutoSettlement: () => void;
}) => {
    return (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-white">
                        정산 대상 플레이어
                    </h3>
                    <p className="text-sm text-gray-400">
                        총 {formatAmount(totalParticipants)}명 참여 · 총 베팅{" "}
                        {formatAmount(totalBetAmount)}
                    </p>
                </div>
                <button
                    onClick={onRefresh}
                    disabled={loading || bulkSettling || autoSettling}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <RefreshCw
                        className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                    />
                    새로고침
                </button>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBulkSettlement}
                        disabled={
                            !safetyCheck.canProceed ||
                            bulkSettling ||
                            autoSettling ||
                            safetyCheck.count === 0
                        }
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {bulkSettling ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                정산 중...
                            </>
                        ) : (
                            <>
                                <Calculator className="w-4 h-4" />
                                선택된 플레이어 일괄 정산
                            </>
                        )}
                    </button>

                    <button
                        onClick={
                            autoSettling
                                ? onCancelAutoSettlement
                                : onAutoSettlement
                        }
                        disabled={loading || bulkSettling}
                        className={`flex items-center gap-2 px-4 py-2 text-white text-sm rounded-md transition-colors ${
                            autoSettling
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-green-600 hover:bg-green-700"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {autoSettling ? (
                            <>
                                <X className="w-4 h-4" />
                                자동 정산 취소
                            </>
                        ) : (
                            <>
                                <Zap className="w-4 h-4" />
                                모든 플레이어 자동 정산
                            </>
                        )}
                    </button>
                </div>

                {autoSettlementProgress && (
                    <div className="bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white">
                                자동 정산 진행 중...
                            </span>
                            <span className="text-sm text-gray-300">
                                배치 {autoSettlementProgress.currentBatch}/
                                {autoSettlementProgress.totalBatches}
                            </span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>
                                    처리완료:{" "}
                                    {formatAmount(
                                        autoSettlementProgress.processedCount
                                    )}
                                    명
                                </span>
                                <span>
                                    남은플레이어:{" "}
                                    {formatAmount(
                                        autoSettlementProgress.remainingCount
                                    )}
                                    명
                                </span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${
                                            autoSettlementProgress.totalPlayers >
                                            0
                                                ? (autoSettlementProgress.processedCount /
                                                      autoSettlementProgress.totalPlayers) *
                                                  100
                                                : 0
                                        }%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div
                    className={`text-sm p-2 rounded-md ${
                        safetyCheck.isDanger
                            ? "bg-red-900/50 text-red-200 border border-red-700"
                            : safetyCheck.isWarning
                            ? "bg-yellow-900/50 text-yellow-200 border border-yellow-700"
                            : "bg-green-900/50 text-green-200 border border-green-700"
                    }`}
                >
                    {safetyCheck.getMessage()}
                </div>
            </div>
        </div>
    );
};
