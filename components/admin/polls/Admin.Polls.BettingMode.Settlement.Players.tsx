"use client";

import { useCallback, useState, useEffect, useMemo } from "react";
import {
    getPollParticipants,
    getSettlementAmountSinglePlayer,
} from "@/app/actions/polls/polls-bettingMode";
import type { Poll } from "@prisma/client";
import {
    formatAmount,
    formatPlayerName,
} from "@/lib/utils/formatting";
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
    Header,
    TabNavigation,
    ParticipantsTable,
    PlayerRow,
    Pagination,
    CalculationModal,
    BulkSettlementResultModal,
} from "./components/PlayerComponents";

interface SettlementPlayersProps {
    poll: Poll;
    winningOptionIds: string[];
    onSelectedPlayersChange?: (selectedPlayers: string[]) => void;
}

export default function SettlementPlayers({
    poll,
    winningOptionIds,
    onSelectedPlayersChange,
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
        bulkSettlementResult,
        executeBulkSettlement,
        clearResult,
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
    }, [executeBulkSettlement, selectedPlayers, fetchParticipants]);

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
        [
            participants,
            settlementResults,
            generateCalculationSteps,
            poll,
        ]
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
    ]);

    useEffect(() => {
        fetchParticipants().catch((err) => {
            console.error("Error fetching participants:", err);
        });
    }, [fetchParticipants]);

    useEffect(() => {
        participants.forEach((participant) => {
            if (playerWinStatus[participant.playerId] === undefined) {
                checkPlayerWinStatus(participant.playerId).catch((err) => {
                    console.error("Error checking player win status:", err);
                });
            }
        });
    }, [participants, checkPlayerWinStatus, playerWinStatus]);

    useEffect(() => {
        if (onSelectedPlayersChange) {
            onSelectedPlayersChange(Array.from(selectedPlayers));
        }
    }, [selectedPlayers, onSelectedPlayersChange]);

    return (
        <div className="space-y-4">
            <Header
                totalParticipants={totalParticipants}
                totalBetAmount={totalBetAmount}
                safetyCheck={safetyCheck}
                onBulkSettlement={handleBulkSettlement}
                onRefresh={fetchParticipants}
                bulkSettling={bulkSettling}
                loading={loading}
            />

            <TabNavigation
                activeTab={activeTab}
                tabStats={tabStats}
                onTabChange={handleTabChange}
                onSelectAll={() =>
                    handleSelectAll(
                        participants.map((p) => p.playerId),
                        totalParticipants
                    )
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

            <BulkSettlementResultModal
                result={bulkSettlementResult}
                onClose={clearResult}
            />

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
