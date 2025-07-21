import { useState, useCallback, useMemo } from "react";
import type { Poll } from "@prisma/client";
import {
    getBettingModePolls,
    getBettingModeStats,
    getSettlementAmountSinglePlayer,
    bulkSettlementPlayers,
    getSettlementRewardLogs,
} from "@/app/actions/polls/polls-bettingMode";
import {
    type BettingStats,
    type PlayerTab,
    type PlayerSettlementStatus,
    type BulkSettlementResult,
    SAFETY_CONFIG,
} from "../types/betting-mode";

export function useStatusColors() {
    return useMemo(
        () => ({
            getStatusColor: (status: string) => {
                switch (status) {
                    case "ACTIVE":
                        return "text-green-400 bg-green-900/20 border border-green-800";
                    case "UPCOMING":
                        return "text-blue-400 bg-blue-900/20 border border-blue-800";
                    case "ENDED":
                        return "text-gray-400 bg-gray-900/20 border border-gray-800";
                    case "CANCELLED":
                        return "text-red-400 bg-red-900/20 border border-red-800";
                    default:
                        return "text-gray-400 bg-gray-900/20 border border-gray-800";
                }
            },
            getBettingStatusColor: (status: string) => {
                switch (status) {
                    case "OPEN":
                        return "text-green-400 bg-green-900/20 border border-green-800";
                    case "CLOSED":
                        return "text-red-400 bg-red-900/20 border border-red-800";
                    case "SETTLING":
                        return "text-yellow-400 bg-yellow-900/20 border border-yellow-800";
                    case "SETTLED":
                        return "text-blue-400 bg-blue-900/20 border border-blue-800";
                    case "CANCELLED":
                        return "text-red-400 bg-red-900/20 border border-red-800";
                    default:
                        return "text-gray-400 bg-gray-900/20 border border-gray-800";
                }
            },
        }),
        []
    );
}

export function useBettingModePolls() {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchPolls = useCallback(async () => {
        setLoading(true);
        try {
            const pollsData = await getBettingModePolls();
            if (!pollsData) {
                throw new Error("폴 데이터를 받지 못했습니다");
            }
            setPolls(pollsData);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Failed to fetch betting mode polls:", error);
            setPolls([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const summaryStats = useMemo(
        () => ({
            totalPolls: polls.length,
            totalBetAmount: polls.reduce(
                (sum, poll) => sum + poll.totalBetsAmount,
                0
            ),
            totalVotes: polls.reduce((sum, poll) => sum + poll.totalVotes, 0),
            activePolls: polls.filter((poll) => poll.status === "ACTIVE")
                .length,
        }),
        [polls]
    );

    return {
        polls,
        loading,
        lastUpdated,
        summaryStats,
        fetchPolls,
    };
}

export function useBettingStats() {
    const [statsMap, setStatsMap] = useState<Record<string, BettingStats>>({});
    const [loadingStats, setLoadingStats] = useState<Set<string>>(new Set());

    const fetchStats = useCallback(
        async (pollId: string) => {
            if (statsMap[pollId]) return statsMap[pollId];

            setLoadingStats((prev) => new Set(prev).add(pollId));
            try {
                const stats = await getBettingModeStats({ pollId });
                if (!stats) {
                    throw new Error(
                        `폴 ${pollId}의 통계 데이터를 받지 못했습니다`
                    );
                }
                setStatsMap((prev) => ({ ...prev, [pollId]: stats }));
                return stats;
            } catch (error) {
                console.error(
                    `Failed to fetch betting stats for poll ${pollId}:`,
                    error
                );
                const defaultStats: BettingStats = {
                    totalParticipants: 0,
                    totalBets: 0,
                    totalAmount: 0,
                    averageBetAmount: 0,
                    topBettors: [],
                    optionStats: [],
                };
                setStatsMap((prev) => ({ ...prev, [pollId]: defaultStats }));
                return defaultStats;
            } finally {
                setLoadingStats((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(pollId);
                    return newSet;
                });
            }
        },
        [statsMap]
    );

    const batchFetchStats = useCallback(
        async (pollIds: string[]) => {
            const promises = pollIds
                .filter((id) => !statsMap[id] && !loadingStats.has(id))
                .map((id) => fetchStats(id));

            await Promise.allSettled(promises);
        },
        [statsMap, loadingStats, fetchStats]
    );

    return {
        statsMap,
        loadingStats,
        fetchStats,
        batchFetchStats,
    };
}

export function usePlayerSelection() {
    const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(
        new Set()
    );

    const handlePlayerSelect = useCallback(
        (playerId: string, isSelected: boolean) => {
            setSelectedPlayers((prev) => {
                const newSet = new Set(prev);
                if (isSelected) {
                    newSet.add(playerId);
                } else {
                    newSet.delete(playerId);
                }
                return newSet;
            });
        },
        []
    );

    const handleSelectAll = useCallback(
        (playerIds: string[], totalParticipants: number) => {
            const confirmed = confirm(
                `현재 페이지의 ${playerIds.length}명을 모두 선택하시겠습니까?\n\n` +
                    `⚠️ 주의: 이는 현재 페이지에만 해당됩니다.\n` +
                    `전체 참여자 수: ${totalParticipants}명`
            );

            if (confirmed) {
                setSelectedPlayers(new Set(playerIds));
            }
        },
        []
    );

    const handleDeselectAll = useCallback(() => {
        setSelectedPlayers(new Set());
    }, []);

    const safetyCheck = useMemo(() => {
        const count = selectedPlayers.size;
        return {
            count,
            isWarning: count > SAFETY_CONFIG.warningThreshold,
            isDanger: count > SAFETY_CONFIG.dangerThreshold,
            canProceed: count <= SAFETY_CONFIG.maxPlayersPerBatch,
            getMessage: () => {
                if (count === 0) return "선택된 플레이어가 없습니다.";
                if (count > SAFETY_CONFIG.maxPlayersPerBatch) {
                    return `⚠️ 위험: ${count}명은 처리 한계(${SAFETY_CONFIG.maxPlayersPerBatch}명)를 초과합니다!`;
                }
                if (count > SAFETY_CONFIG.dangerThreshold) {
                    return `🚨 위험: ${count}명은 상당히 많은 수입니다!`;
                }
                if (count > SAFETY_CONFIG.warningThreshold) {
                    return `⚠️ 경고: ${count}명은 많은 수입니다.`;
                }
                return `${count}명이 선택되었습니다.`;
            },
        };
    }, [selectedPlayers.size]);

    return {
        selectedPlayers,
        handlePlayerSelect,
        handleSelectAll,
        handleDeselectAll,
        safetyCheck,
        clearSelection: handleDeselectAll,
    };
}

export function useSettlementCalculation(
    poll: Poll,
    winningOptionIds: string[]
) {
    const [settlementAmounts, setSettlementAmounts] = useState<
        Record<string, number>
    >({});
    const [settlementResults, setSettlementResults] = useState<
        Record<string, any>
    >({});
    const [settlementStatus, setSettlementStatus] = useState<
        Record<string, PlayerSettlementStatus>
    >({});

    const calculateSettlementAmount = useCallback(
        async (playerId: string, showDetails: boolean = false) => {
            if (settlementAmounts[playerId] !== undefined && !showDetails) {
                return settlementAmounts[playerId];
            }

            try {
                const result = await getSettlementAmountSinglePlayer({
                    pollId: poll.id,
                    playerId,
                    winningOptionIds,
                });

                if (!result.success) {
                    console.error(
                        `Settlement calculation failed for player ${playerId}:`,
                        result.error
                    );
                    return 0;
                }

                const hasWinningBets = result.winningBets.some(
                    (bet) => bet.isWinningOption
                );
                const totalAmount = hasWinningBets
                    ? result.payoutAmount
                    : result.refundAmount;

                const settlementLogsResult = await getSettlementRewardLogs({
                    pollId: poll.id,
                    playerId,
                    assetId: poll.bettingAssetId || "default",
                    payoutAmount: totalAmount,
                });

                const isAlreadySettled =
                    settlementLogsResult.success &&
                    settlementLogsResult.settlementLogs.length > 0;

                setSettlementAmounts((prev) => ({
                    ...prev,
                    [playerId]: totalAmount,
                }));
                setSettlementResults((prev) => ({
                    ...prev,
                    [playerId]: result,
                }));

                let settlementStatusValue:
                    | "unsettled"
                    | "settled"
                    | "error"
                    | "missing_bet" = "unsettled";
                let canResettle = false;

                if (result.totalBetAmount === 0) {
                    settlementStatusValue = "missing_bet";
                } else if (isAlreadySettled) {
                    if (settlementLogsResult.error?.includes("mismatch")) {
                        settlementStatusValue = "error";
                        canResettle = true;
                    } else {
                        settlementStatusValue = "settled";
                        canResettle = true;
                    }
                } else {
                    settlementStatusValue = "unsettled";
                }

                setSettlementStatus((prev) => ({
                    ...prev,
                    [playerId]: {
                        isSettled: isAlreadySettled,
                        settlementAmount: isAlreadySettled
                            ? settlementLogsResult.totalSettlementAmount
                            : 0,
                        hasAmountMismatch:
                            settlementLogsResult.error?.includes("mismatch") ||
                            false,
                        mismatchMessage: settlementLogsResult.error,
                        status: settlementStatusValue,
                        canResettle,
                        settlementLogs: settlementLogsResult.settlementLogs,
                    },
                }));

                return totalAmount;
            } catch (error) {
                console.error("Failed to calculate settlement amount:", error);
                return 0;
            }
        },
        [poll.id, poll.bettingAssetId, winningOptionIds, settlementAmounts]
    );

    const batchCalculateSettlement = useCallback(
        async (playerIds: string[]) => {
            const promises = playerIds
                .filter((id) => settlementAmounts[id] === undefined)
                .map((id) => calculateSettlementAmount(id));

            await Promise.allSettled(promises);
        },
        [settlementAmounts, calculateSettlementAmount]
    );

    return {
        settlementAmounts,
        settlementResults,
        settlementStatus,
        calculateSettlementAmount,
        batchCalculateSettlement,
    };
}

export function useBulkSettlement(poll: Poll, winningOptionIds: string[]) {
    const [bulkSettling, setBulkSettling] = useState(false);
    const [bulkSettlementResult, setBulkSettlementResult] =
        useState<BulkSettlementResult | null>(null);

    const executeBulkSettlement = useCallback(
        async (playerIds: string[]) => {
            if (playerIds.length === 0) {
                setBulkSettlementResult({
                    success: false,
                    message: "정산할 플레이어를 선택해주세요.",
                    results: [],
                    summary: {
                        totalProcessed: 0,
                        totalSuccess: 0,
                        totalFailed: 0,
                        totalSettlementAmount: 0,
                    },
                });
                return;
            }

            const selectedCount = playerIds.length;
            let confirmMessage = `${selectedCount}명의 플레이어를 정산하시겠습니까?\n\n`;

            if (selectedCount > SAFETY_CONFIG.warningThreshold) {
                confirmMessage += `⚠️ 경고: ${selectedCount}명은 상당히 많은 수입니다!\n\n`;
            }

            confirmMessage += `선택된 플레이어 ID (처음 5개):\n${playerIds
                .slice(0, 5)
                .map((id) => id.slice(-6))
                .join(", ")}\n\n`;
            confirmMessage += `이 작업은 되돌릴 수 없습니다. 정말 진행하시겠습니까?`;

            if (!confirm(confirmMessage)) {
                return;
            }

            if (selectedCount > SAFETY_CONFIG.dangerThreshold) {
                if (
                    !confirm(
                        `다시 한번 확인합니다.\n\n${selectedCount}명 전체를 정산하시겠습니까?\n\n이는 매우 많은 수입니다!`
                    )
                ) {
                    return;
                }
            }

            setBulkSettling(true);
            try {
                const result = await bulkSettlementPlayers({
                    pollId: poll.id,
                    playerIds,
                    winningOptionIds,
                });

                setBulkSettlementResult(result);
                return result;
            } catch (error) {
                console.error("Failed to execute bulk settlement:", error);
                const errorResult: BulkSettlementResult = {
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                    results: [],
                    summary: {
                        totalProcessed: 0,
                        totalSuccess: 0,
                        totalFailed: 0,
                        totalSettlementAmount: 0,
                    },
                };
                setBulkSettlementResult(errorResult);
                return errorResult;
            } finally {
                setBulkSettling(false);
            }
        },
        [poll.id, winningOptionIds]
    );

    const clearResult = useCallback(() => {
        setBulkSettlementResult(null);
    }, []);

    return {
        bulkSettling,
        bulkSettlementResult,
        executeBulkSettlement,
        clearResult,
    };
}

export function useTabFiltering(
    participants: any[],
    playerWinStatus: Record<string, boolean>,
    settlementStatus: Record<string, PlayerSettlementStatus>
) {
    const [activeTab, setActiveTab] = useState<PlayerTab>("all");

    const filteredParticipants = useMemo(() => {
        return participants.filter((participant) => {
            if (activeTab === "all") return true;

            const isWinner = playerWinStatus[participant.playerId];
            const status = settlementStatus[participant.playerId]?.status;

            switch (activeTab) {
                case "winners":
                    return isWinner === true;
                case "losers":
                    return isWinner === false;
                case "settled":
                    return status === "settled";
                case "unsettled":
                    return !status || status === "unsettled";
                case "error":
                    return status === "error" || status === "missing_bet";
                default:
                    return true;
            }
        });
    }, [participants, playerWinStatus, settlementStatus, activeTab]);

    const tabStats = useMemo(() => {
        const allCount = participants.length;
        const winnersCount = participants.filter(
            (p) => playerWinStatus[p.playerId] === true
        ).length;
        const losersCount = participants.filter(
            (p) => playerWinStatus[p.playerId] === false
        ).length;
        const settledCount = participants.filter(
            (p) => settlementStatus[p.playerId]?.status === "settled"
        ).length;
        const unsettledCount = participants.filter(
            (p) =>
                !settlementStatus[p.playerId] ||
                settlementStatus[p.playerId]?.status === "unsettled"
        ).length;
        const errorCount = participants.filter(
            (p) =>
                settlementStatus[p.playerId]?.status === "error" ||
                settlementStatus[p.playerId]?.status === "missing_bet"
        ).length;

        return {
            allCount,
            winnersCount,
            losersCount,
            settledCount,
            unsettledCount,
            errorCount,
        };
    }, [participants, playerWinStatus, settlementStatus]);

    return {
        activeTab,
        setActiveTab,
        filteredParticipants,
        tabStats,
    };
}
