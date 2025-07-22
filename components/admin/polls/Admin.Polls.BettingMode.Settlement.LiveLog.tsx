"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
    bulkSettlementPlayers,
    getSettlementProgress,
    resumeSettlement,
} from "@/app/actions/polls/polls-bettingMode";
import type { Poll } from "@prisma/client";
import { formatAmount } from "@/lib/utils/formatting";
import {
    Play,
    Square,
    RefreshCw,
    FileText,
    Download,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    User,
    Loader2,
    Trophy,
    SkipForward,
} from "lucide-react";
import {
    type LogEntry,
    type PlayerStatus,
    type SettlementProgress,
    SAFETY_CONFIG,
} from "./types/betting-mode";

interface LiveLogProps {
    poll: Poll;
    winningOptionIds: string[];
    selectedPlayers: string[];
    onLogUpdate?: (logs: LogEntry[]) => void;
    onPollSettlementComplete?: (pollId: string) => void;
}

export default function LiveLog({
    poll,
    winningOptionIds,
    selectedPlayers,
    onLogUpdate,
    onPollSettlementComplete,
}: LiveLogProps) {
    const [progress, setProgress] = useState<SettlementProgress>({
        isRunning: false,
        totalPlayers: 0,
        processedPlayers: 0,
        successfulPlayers: 0,
        failedPlayers: 0,
        totalSettlementAmount: 0,
        currentBatch: 0,
        totalBatches: 0,
        logs: [],
        playerStatuses: {},
    });

    const [autoScroll, setAutoScroll] = useState(true);
    const [logLevel, setLogLevel] = useState<LogEntry["level"]>("info");
    const [showTimestamps, setShowTimestamps] = useState(true);
    const [showPlayerProgress, setShowPlayerProgress] = useState(true);
    const [showPollProgress, setShowPollProgress] = useState(true);
    const [resuming, setResuming] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const addLog = useCallback(
        (level: LogEntry["level"], message: string, data?: any) => {
            const logEntry: LogEntry = {
                id:
                    Date.now().toString() +
                    Math.random().toString(36).substr(2, 9),
                timestamp: new Date(),
                level,
                message,
                data,
            };

            setProgress((prev) => {
                const newLogs = [...prev.logs, logEntry];
                if (onLogUpdate) {
                    onLogUpdate(newLogs);
                }
                return { ...prev, logs: newLogs };
            });
        },
        [onLogUpdate]
    );

    const updatePlayerStatus = useCallback(
        (playerId: string, status: Partial<PlayerStatus>) => {
            setProgress((prev) => ({
                ...prev,
                playerStatuses: {
                    ...prev.playerStatuses,
                    [playerId]: {
                        ...prev.playerStatuses[playerId],
                        playerId,
                        ...status,
                    },
                },
            }));
        },
        []
    );

    const checkPollSettlementProgress = useCallback(async () => {
        try {
            const progressResult = await getSettlementProgress(poll.id);

            if (progressResult.success) {
                setProgress((prev) => ({
                    ...prev,
                    pollSettlementStatus: {
                        isSettled: poll.isSettled,
                        settledAt: poll.settledAt || undefined,
                        settledBy: poll.settledBy || undefined,
                        totalPlayers: progressResult.progress.totalPlayers,
                        settledPlayers: progressResult.progress.settledPlayers,
                        unsettledPlayers:
                            progressResult.progress.unsettledPlayers,
                        settlementProgress:
                            progressResult.progress.settlementProgress,
                        isFullySettled: progressResult.progress.isFullySettled,
                    },
                }));

                if (progressResult.progress.isFullySettled && !poll.isSettled) {
                    addLog("success", "폴 정산이 완료되었습니다!", {
                        totalPlayers: progressResult.progress.totalPlayers,
                        settledPlayers: progressResult.progress.settledPlayers,
                        settlementProgress:
                            progressResult.progress.settlementProgress,
                    });

                    if (onPollSettlementComplete) {
                        onPollSettlementComplete(poll.id);
                    }
                }
            }
        } catch (error) {
            console.error("Error checking poll settlement progress:", error);
        }
    }, [poll.id, poll.isSettled, poll.settledAt, poll.settledBy, addLog, onPollSettlementComplete]);

    const startSettlement = useCallback(async () => {
        if (selectedPlayers.length === 0) {
            addLog("warning", "선택된 플레이어가 없습니다.");
            return;
        }

        // 🚨 단계적 안전장치 시스템
        const playerCount = selectedPlayers.length;
        const playerIds = selectedPlayers
            .slice(0, 5)
            .map((id) => id.slice(-6))
            .join(", ");

        // 1단계: 50명 이상 - 기본 경고
        if (playerCount >= SAFETY_CONFIG.warningThreshold) {
            const warningMessage =
                `⚠️ 주의: ${playerCount}명의 플레이어를 정산합니다\n\n` +
                `정산 예상 시간: ${Math.ceil(playerCount * 0.1)}초\n` +
                `선택된 플레이어 ID (처음 5개): ${playerIds}\n\n` +
                `계속 진행하시겠습니까?`;

            if (!confirm(warningMessage)) {
                addLog(
                    "warning",
                    `사용자가 ${playerCount}명 정산을 취소했습니다.`
                );
                return;
            }
        }

        // 2단계: 100명 이상 - 위험 경고
        if (playerCount >= SAFETY_CONFIG.dangerThreshold) {
            const dangerMessage =
                `🚨 위험: ${playerCount}명 대량 정산!\n\n` +
                `⚠️ 이는 많은 수의 플레이어입니다.\n` +
                `예상 처리 시간: ${Math.ceil(playerCount * 0.1)}초\n` +
                `메모리 사용량: 약 ${Math.ceil(playerCount / 100)}MB\n\n` +
                `정말로 ${playerCount}명 전체를 정산하시겠습니까?\n` +
                `(되돌릴 수 없습니다)`;

            if (!confirm(dangerMessage)) {
                addLog(
                    "warning",
                    `사용자가 대량 정산(${playerCount}명)을 취소했습니다.`
                );
                return;
            }
        }

        // 3단계: 500명 이상 - 최종 확인
        if (playerCount >= 500) {
            const finalWarning =
                `🚨🚨 최종 확인 🚨🚨\n\n` +
                `${playerCount}명은 매우 많은 수입니다!\n\n` +
                `예상 처리 시간: ${Math.ceil(playerCount * 0.1)}초 (${Math.ceil(
                    (playerCount * 0.1) / 60
                )}분)\n` +
                `시스템 부하가 발생할 수 있습니다.\n\n` +
                `정말 진행하시겠습니까?\n\n` +
                `"예"를 입력하시면 진행됩니다.`;

            const userInput = prompt(finalWarning);
            if (userInput !== "예") {
                addLog(
                    "warning",
                    `사용자가 대용량 정산(${playerCount}명)을 취소했습니다.`
                );
                return;
            }
        }

        addLog("debug", `정산 대상 플레이어 확인`, {
            selectedPlayersCount: selectedPlayers.length,
            firstFewPlayers: selectedPlayers.slice(0, 5),
            lastFewPlayers: selectedPlayers.slice(-5),
        });

        const initialPlayerStatuses: Record<string, PlayerStatus> = {};
        selectedPlayers.forEach((playerId) => {
            initialPlayerStatuses[playerId] = {
                playerId,
                status: "pending",
            };
        });

        setProgress((prev) => ({
            ...prev,
            isRunning: true,
            startTime: new Date(),
            totalPlayers: selectedPlayers.length,
            processedPlayers: 0,
            successfulPlayers: 0,
            failedPlayers: 0,
            totalSettlementAmount: 0,
            currentBatch: 0,
            totalBatches: Math.ceil(selectedPlayers.length / 5),
            logs: [],
            playerStatuses: initialPlayerStatuses,
        }));

        addLog(
            "info",
            `일괄 정산 시작: ${selectedPlayers.length}명의 플레이어`,
            {
                pollId: poll.id,
                pollTitle: poll.title,
                winningOptionIds,
                selectedPlayers: selectedPlayers.slice(0, 10),
                totalSelectedCount: selectedPlayers.length,
            }
        );

        try {
            const startTime = Date.now();
            addLog("debug", "bulkSettlementPlayers 함수 호출 시작");

            addLog(
                "info",
                `정산 시작: ${selectedPlayers.length}명의 플레이어 처리`
            );

            const result = await bulkSettlementPlayers({
                pollId: poll.id,
                playerIds: selectedPlayers,
                winningOptionIds,
            });

            const endTime = Date.now();
            const duration = endTime - startTime;

            addLog("debug", "bulkSettlementPlayers 함수 호출 완료", {
                duration: `${duration}ms`,
                result: {
                    success: result.success,
                    totalProcessed: result.summary.totalProcessed,
                    totalSuccess: result.summary.totalSuccess,
                    totalFailed: result.summary.totalFailed,
                    totalSettlementAmount: result.summary.totalSettlementAmount,
                },
            });

            // 🔍 이미 정산된 플레이어 수 계산 (공통 사용을 위해 밖으로 이동)
            const alreadySettledCount = result.results.filter(
                (playerResult: any) => {
                    return (
                        playerResult.alreadySettled ||
                        playerResult.skipped ||
                        (playerResult.message &&
                            (playerResult.message.includes("already settled") ||
                                playerResult.message.includes("이미 정산") ||
                                playerResult.message.includes("skipping"))) ||
                        playerResult.status === "already_settled" ||
                        playerResult.status === "skipped"
                    );
                }
            ).length;

            const actualSuccessCount =
                result.summary.totalSuccess - alreadySettledCount;

            if (result.success) {
                let completionMessage = "일괄 정산 성공적으로 완료";
                if (alreadySettledCount > 0) {
                    completionMessage += ` (${alreadySettledCount}명 이미 정산됨)`;
                }

                addLog("success", completionMessage, {
                    totalProcessed: result.summary.totalProcessed,
                    totalSuccess: result.summary.totalSuccess,
                    actualSuccessCount, // 실제 새로 정산된 수
                    totalFailed: result.summary.totalFailed,
                    alreadySettledCount, // 이미 정산된 수
                    totalSettlementAmount: result.summary.totalSettlementAmount,
                    duration: `${duration}ms`,
                });

                result.results.forEach((playerResult: any, index) => {
                    // 🔍 디버깅: 실제 응답 구조 확인
                    if (index === 0) {
                        addLog("debug", "첫 번째 플레이어 결과 구조 확인", {
                            playerResult: {
                                playerId: playerResult.playerId,
                                success: playerResult.success,
                                message: playerResult.message,
                                status: playerResult.status,
                                alreadySettled: playerResult.alreadySettled,
                                skipped: playerResult.skipped,
                                error: playerResult.error,
                                allKeys: Object.keys(playerResult),
                            },
                        });
                    }

                    // 🔍 이미 정산된 플레이어 감지 (더 포괄적으로)
                    const isAlreadySettled =
                        playerResult.alreadySettled ||
                        playerResult.skipped ||
                        (playerResult.message &&
                            (playerResult.message.includes("already settled") ||
                                playerResult.message.includes("이미 정산") ||
                                playerResult.message.includes("skipping") ||
                                playerResult.message.includes(
                                    "already been settled"
                                ) ||
                                playerResult.message.includes("duplicate") ||
                                playerResult.message
                                    .toLowerCase()
                                    .includes("skip"))) ||
                        playerResult.status === "already_settled" ||
                        playerResult.status === "skipped" ||
                        (playerResult.error &&
                            (playerResult.error.includes("already settled") ||
                                playerResult.error.includes("이미 정산") ||
                                playerResult.error.includes("skipping")));

                    // 로그 레벨 결정
                    let logLevel: LogEntry["level"];
                    if (isAlreadySettled) {
                        logLevel = "info"; // warning에서 info로 변경하여 기본 필터에서 보이도록
                    } else {
                        logLevel = playerResult.success ? "success" : "error";
                    }

                    // 🔍 정산 상세 정보 포함
                    const hasValidationErrors =
                        playerResult.validationResult?.errors?.length > 0;
                    const hasValidationWarnings =
                        playerResult.validationResult?.warnings?.length > 0;

                    let message: string;

                    // 🔍 이미 정산된 사용자 특별 처리 (최우선)
                    if (isAlreadySettled) {
                        message = `플레이어 ${playerResult.playerId.slice(
                            -6
                        )} 이미 정산됨 - 건너뜀 ⚠️`;
                    }
                    // 🔍 베팅이 없는 사용자 특별 처리
                    else if (
                        playerResult.calculationDetails?.type === "NO_BET"
                    ) {
                        message = `플레이어 ${playerResult.playerId.slice(
                            -6
                        )} 베팅 없음 - 정산 대상 아님 ⚪`;
                    } else if (
                        playerResult.calculationDetails?.type === "ZERO_BET"
                    ) {
                        message = `플레이어 ${playerResult.playerId.slice(
                            -6
                        )} 0원 베팅 - 정산 대상 아님 ⚪`;
                    }
                    // 기본 성공/실패 메시지
                    else {
                        message = playerResult.success
                            ? `플레이어 ${playerResult.playerId.slice(
                                  -6
                              )} 정산 성공`
                            : `플레이어 ${playerResult.playerId.slice(
                                  -6
                              )} 정산 실패`;

                        // 추가 상태 표시
                        if (hasValidationErrors) {
                            message += ` ⚠️ 계산 오류 감지 (${playerResult.validationResult.errors.length}개)`;
                        } else if (hasValidationWarnings) {
                            message += ` ⚠️ 경고 (${playerResult.validationResult.warnings.length}개)`;
                        } else if (playerResult.validationResult?.isValid) {
                            message += ` ✓ 검증 완료`;
                        }
                    }

                    const endTime = new Date();
                    const playerStartTime = new Date(startTime + index * 50);
                    const processingDuration =
                        endTime.getTime() - playerStartTime.getTime();

                    // 플레이어 상태 업데이트
                    let playerStatus: PlayerStatus["status"];
                    if (isAlreadySettled) {
                        playerStatus = "completed"; // 이미 정산된 것으로 표시하되 별도 표기
                    } else {
                        playerStatus = playerResult.success
                            ? "completed"
                            : "failed";
                    }

                    updatePlayerStatus(playerResult.playerId, {
                        status: playerStatus,
                        settlementAmount: playerResult.settlementAmount,
                        error: playerResult.error,
                        endTime,
                        duration: processingDuration,
                        startTime: playerStartTime,
                        calculationDetails: playerResult.calculationDetails,
                        validationResult: playerResult.validationResult,
                    });

                    // 🔍 상세 로그 데이터 구성
                    const logData: any = {
                        playerId: playerResult.playerId,
                        settlementAmount: playerResult.settlementAmount,
                        notificationSent: playerResult.notificationSent,
                        error: playerResult.error,
                        message: playerResult.message,
                        duration: `${processingDuration}ms`,
                        isAlreadySettled,
                    };

                    // 🔍 이미 정산된 사용자 로그 데이터
                    if (isAlreadySettled) {
                        logData.alreadySettledReason = {
                            status: "already_settled",
                            reason: "이 플레이어는 이미 정산되어 처리를 건너뛰었습니다",
                            originalMessage: playerResult.message,
                            skippedAt: new Date().toISOString(),
                            hadPreviousSettlement: true,
                        };
                    }

                    // 🔍 베팅이 없는 사용자 로그 데이터 개선
                    if (
                        playerResult.calculationDetails?.type === "NO_BET" ||
                        playerResult.calculationDetails?.type === "ZERO_BET"
                    ) {
                        logData.noSettlementReason = {
                            type: playerResult.calculationDetails.type,
                            reason: playerResult.calculationDetails.reason,
                            isParticipant:
                                playerResult.calculationDetails.isParticipant ||
                                false,
                            betCount:
                                playerResult.calculationDetails.betCount || 0,
                        };
                    }

                    // 계산 상세 정보 추가
                    if (playerResult.calculationDetails) {
                        logData.calculation = {
                            type: playerResult.calculationDetails.type,
                            totalBet:
                                playerResult.calculationDetails.playerTotalBet,
                            winningBet:
                                playerResult.calculationDetails
                                    .playerWinningBet || 0,
                            payoutAmount:
                                playerResult.calculationDetails.finalPayout ||
                                0,
                            refundAmount:
                                playerResult.calculationDetails.refundAmount ||
                                0,
                            payoutRatio:
                                playerResult.calculationDetails.payoutRatio ||
                                0,
                        };

                        if (playerResult.calculationDetails.winningBets) {
                            logData.calculation.winningBets =
                                playerResult.calculationDetails.winningBets;
                        }
                        if (playerResult.calculationDetails.losingBets) {
                            logData.calculation.losingBets =
                                playerResult.calculationDetails.losingBets;
                        }
                    }

                    // 검증 결과 추가
                    if (playerResult.validationResult) {
                        logData.validation = {
                            isValid: playerResult.validationResult.isValid,
                            errors: playerResult.validationResult.errors,
                            warnings: playerResult.validationResult.warnings,
                            summary:
                                playerResult.validationResult
                                    .calculationSummary,
                        };
                    }

                    addLog(logLevel, message, logData);
                });

                await checkPollSettlementProgress();
            } else {
                addLog("error", "일괄 정산 실패", {
                    error: result.error,
                    results: result.results,
                });
            }

            setProgress((prev) => ({
                ...prev,
                isRunning: false,
                endTime: new Date(),
                processedPlayers: result.summary.totalProcessed,
                successfulPlayers: actualSuccessCount, // 실제 새로 정산된 수
                failedPlayers: result.summary.totalFailed,
                alreadySettledPlayers: alreadySettledCount, // 이미 정산된 수 추가
                totalSettlementAmount: result.summary.totalSettlementAmount,
                currentProcessingPlayer: undefined,
            }));
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
            addLog("error", `일괄 정산 중 오류 발생: ${errorMessage}`, {
                error: error,
                stack: error instanceof Error ? error.stack : undefined,
            });

            setProgress((prev) => ({
                ...prev,
                isRunning: false,
                endTime: new Date(),
                currentProcessingPlayer: undefined,
            }));
        }
    }, [
        poll.id,
        poll.title,
        selectedPlayers,
        winningOptionIds,
        addLog,
        updatePlayerStatus,
        checkPollSettlementProgress,
    ]);

    const clearLogs = useCallback(() => {
        setProgress((prev) => ({ ...prev, logs: [] }));
    }, []);

    // 🆕 LiveLog에서 정산 재개
    const handleResumeFromLiveLog = useCallback(async () => {
        if (!progress.pollSettlementStatus) return;

        const remainingPlayers = progress.pollSettlementStatus.unsettledPlayers;
        const confirmMessage =
            `🔄 LiveLog에서 정산 재개\n\n` +
            `남은 플레이어: ${remainingPlayers}명\n` +
            `현재 진행률: ${progress.pollSettlementStatus.settlementProgress.toFixed(
                1
            )}%\n\n` +
            `재개하시겠습니까?`;

        if (!confirm(confirmMessage)) return;

        setResuming(true);
        addLog("info", `정산 재개 시도: ${remainingPlayers}명 남음`);

        try {
            // 🔍 단계별 진행 상황 표시
            addLog("info", "🛡️ cron 안전 타임아웃 활성화 (30초)");
            addLog("info", "📋 승리 옵션 확인 중...");
            addLog("info", "🔍 미정산 플레이어 탐지 중...");

            const result = await resumeSettlement(poll.id);
            if (result.success && result.settlementResult) {
                // 🎯 상세 진행 정보 표시
                const progress = result.detailedProgress;

                if (progress) {
                    // 단계별 소요 시간 표시
                    addLog("info", `⏱️ 단계별 소요 시간:`);
                    if (progress.stageTimings.progressCheck) {
                        addLog(
                            "info",
                            `  📊 진행 상태 확인: ${progress.stageTimings.progressCheck}ms`
                        );
                    }
                    if (progress.stageTimings.pollInfoCheck) {
                        addLog(
                            "info",
                            `  📋 Poll 정보 조회: ${progress.stageTimings.pollInfoCheck}ms`
                        );
                    }
                    if (progress.stageTimings.playerDetection) {
                        addLog(
                            "info",
                            `  🔍 플레이어 탐지: ${progress.stageTimings.playerDetection}ms`
                        );
                    }
                    if (progress.stageTimings.batchPreparation) {
                        addLog(
                            "info",
                            `  🚀 배치 준비: ${progress.stageTimings.batchPreparation}ms`
                        );
                    }
                    if (progress.stageTimings.settlement) {
                        addLog(
                            "info",
                            `  ⚡ 정산 처리: ${progress.stageTimings.settlement}ms`
                        );
                    }
                    addLog(
                        "success",
                        `🏁 전체 완료: ${progress.stageTimings.total}ms`
                    );
                }

                // 승리 옵션 정보
                if (progress?.winningOptionInfo) {
                    const optionInfo = progress.winningOptionInfo;
                    addLog(
                        "success",
                        `🎯 ${
                            optionInfo.isAutoDetected
                                ? "자동으로 찾은"
                                : "선택된"
                        } 승리 옵션: ${optionInfo.optionName}`
                    );
                }

                // 참여자 통계
                if (progress) {
                    addLog(
                        "success",
                        `📊 전체 참여자: ${progress.totalParticipants}명, 이미 정산됨: ${progress.alreadySettled}명`
                    );
                    addLog(
                        "success",
                        `🎯 미정산된 사용자 ${progress.unsettledCount}명 발견`
                    );

                    // 배치 정보
                    const batch = progress.batchInfo;
                    addLog(
                        "info",
                        `📦 배치 정보: ${batch.currentBatch}/${batch.totalBatches} (배치당 최대 ${batch.batchSize}명)`
                    );
                }

                addLog("info", "🚀 진행합니다");

                // 처리 결과 알림
                addLog(
                    "info",
                    `👥 이번 배치 처리 완료: ${result.processedCount}명`
                );
                if ((result.remainingCount || 0) > 0) {
                    addLog(
                        "info",
                        `📋 처리 후 남은 인원: ${result.remainingCount}명`
                    );
                } else {
                    addLog("success", "🎉 모든 플레이어 정산 완료!");
                }

                // 🔍 정산 재개 결과 상세 분석
                const settlementResult = result.settlementResult;
                const alreadySettledCount = settlementResult.results.filter(
                    (playerResult: any) => {
                        return (
                            playerResult.alreadySettled ||
                            playerResult.skipped ||
                            (playerResult.message &&
                                (playerResult.message.includes(
                                    "already settled"
                                ) ||
                                    playerResult.message.includes(
                                        "이미 정산"
                                    ) ||
                                    playerResult.message.includes(
                                        "skipping"
                                    ))) ||
                            playerResult.status === "already_settled" ||
                            playerResult.status === "skipped"
                        );
                    }
                ).length;

                const actualSuccessCount =
                    settlementResult.summary.totalSuccess - alreadySettledCount;

                // 전체 배치 완료 메시지
                let completionMessage = `정산 재개 배치 완료: ${result.processedCount}명 처리`;
                if (alreadySettledCount > 0) {
                    completionMessage += ` (${alreadySettledCount}명 이미 정산됨)`;
                }
                if ((result.remainingCount || 0) > 0) {
                    completionMessage += `, ${
                        result.remainingCount || 0
                    }명 남음`;
                }

                addLog("success", completionMessage, {
                    processedCount: result.processedCount,
                    remainingCount: result.remainingCount,
                    totalProcessed: settlementResult.summary.totalProcessed,
                    totalSuccess: settlementResult.summary.totalSuccess,
                    actualSuccessCount,
                    totalFailed: settlementResult.summary.totalFailed,
                    alreadySettledCount,
                    totalSettlementAmount:
                        settlementResult.summary.totalSettlementAmount,
                    winningOptionIds: result.winningOptionIds,
                });

                // 🎯 각 플레이어별 상세 결과 표시 (startSettlement와 동일)
                settlementResult.results.forEach((playerResult: any) => {
                    // 🔍 이미 정산된 플레이어 감지
                    const isAlreadySettled =
                        playerResult.alreadySettled ||
                        playerResult.skipped ||
                        (playerResult.message &&
                            (playerResult.message.includes("already settled") ||
                                playerResult.message.includes("이미 정산") ||
                                playerResult.message.includes("skipping") ||
                                playerResult.message.includes(
                                    "already been settled"
                                ) ||
                                playerResult.message.includes("duplicate") ||
                                playerResult.message
                                    .toLowerCase()
                                    .includes("skip"))) ||
                        playerResult.status === "already_settled" ||
                        playerResult.status === "skipped" ||
                        (playerResult.error &&
                            (playerResult.error.includes("already settled") ||
                                playerResult.error.includes("이미 정산") ||
                                playerResult.error.includes("skipping")));

                    // 로그 레벨 결정
                    let logLevel: LogEntry["level"];
                    if (isAlreadySettled) {
                        logLevel = "info";
                    } else {
                        logLevel = playerResult.success ? "success" : "error";
                    }

                    // 🔍 정산 상세 정보 포함
                    const hasValidationErrors =
                        playerResult.validationResult?.errors?.length > 0;
                    const hasValidationWarnings =
                        playerResult.validationResult?.warnings?.length > 0;

                    let message: string;

                    // 🔍 이미 정산된 사용자 특별 처리
                    if (isAlreadySettled) {
                        message = `플레이어 ${playerResult.playerId.slice(
                            -6
                        )} 이미 정산됨 - 건너뜀 ⚠️`;
                    }
                    // 🔍 베팅이 없는 사용자 특별 처리
                    else if (
                        playerResult.calculationDetails?.type === "NO_BET"
                    ) {
                        message = `플레이어 ${playerResult.playerId.slice(
                            -6
                        )} 베팅 없음 - 정산 대상 아님 ⚪`;
                    } else if (
                        playerResult.calculationDetails?.type === "ZERO_BET"
                    ) {
                        message = `플레이어 ${playerResult.playerId.slice(
                            -6
                        )} 0원 베팅 - 정산 대상 아님 ⚪`;
                    }
                    // 승리자
                    else if (
                        playerResult.success &&
                        playerResult.settlementAmount > 0
                    ) {
                        message = `플레이어 ${playerResult.playerId.slice(
                            -6
                        )} 승리 정산 ✅ (+${formatAmount(
                            playerResult.settlementAmount
                        )})`;
                    }
                    // 패배자 (0원 정산)
                    else if (
                        playerResult.success &&
                        playerResult.settlementAmount === 0
                    ) {
                        message = `플레이어 ${playerResult.playerId.slice(
                            -6
                        )} 패배 정산 ❌ (0원)`;
                    }
                    // 기본 성공/실패 메시지
                    else {
                        message = playerResult.success
                            ? `플레이어 ${playerResult.playerId.slice(
                                  -6
                              )} 정산 성공`
                            : `플레이어 ${playerResult.playerId.slice(
                                  -6
                              )} 정산 실패`;

                        // 추가 상태 표시
                        if (hasValidationErrors) {
                            message += ` ⚠️ 계산 오류 감지 (${playerResult.validationResult.errors.length}개)`;
                        } else if (hasValidationWarnings) {
                            message += ` ⚠️ 경고 (${playerResult.validationResult.warnings.length}개)`;
                        } else if (playerResult.validationResult?.isValid) {
                            message += ` ✓ 검증 완료`;
                        }
                    }

                    // 플레이어 상태 업데이트
                    let playerStatus: PlayerStatus["status"];
                    if (isAlreadySettled) {
                        playerStatus = "completed";
                    } else {
                        playerStatus = playerResult.success
                            ? "completed"
                            : "failed";
                    }

                    updatePlayerStatus(playerResult.playerId, {
                        status: playerStatus,
                        settlementAmount: playerResult.settlementAmount,
                        error: playerResult.error,
                        endTime: new Date(),
                        duration: 50,
                        startTime: new Date(),
                        calculationDetails: playerResult.calculationDetails,
                        validationResult: playerResult.validationResult,
                    });

                    // 🔍 상세 로그 데이터 구성 (startSettlement와 동일)
                    const logData: any = {
                        playerId: playerResult.playerId,
                        settlementAmount: playerResult.settlementAmount,
                        notificationSent: playerResult.notificationSent,
                        error: playerResult.error,
                        message: playerResult.message,
                        isAlreadySettled,
                        batchType: "resume", // 재개 배치임을 표시
                    };

                    // 🔍 이미 정산된 사용자 로그 데이터
                    if (isAlreadySettled) {
                        logData.alreadySettledReason = {
                            status: "already_settled",
                            reason: "이 플레이어는 이미 정산되어 처리를 건너뛰었습니다",
                            originalMessage: playerResult.message,
                            skippedAt: new Date().toISOString(),
                            hadPreviousSettlement: true,
                        };
                    }

                    // 🔍 베팅이 없는 사용자 로그 데이터 개선
                    if (
                        playerResult.calculationDetails?.type === "NO_BET" ||
                        playerResult.calculationDetails?.type === "ZERO_BET"
                    ) {
                        logData.noSettlementReason = {
                            type: playerResult.calculationDetails.type,
                            reason: playerResult.calculationDetails.reason,
                            isParticipant:
                                playerResult.calculationDetails.isParticipant ||
                                false,
                            betCount:
                                playerResult.calculationDetails.betCount || 0,
                        };
                    }

                    // 계산 상세 정보 추가
                    if (playerResult.calculationDetails) {
                        logData.calculation = {
                            type: playerResult.calculationDetails.type,
                            totalBet:
                                playerResult.calculationDetails.playerTotalBet,
                            winningBet:
                                playerResult.calculationDetails
                                    .playerWinningBet || 0,
                            payoutAmount:
                                playerResult.calculationDetails.finalPayout ||
                                0,
                            refundAmount:
                                playerResult.calculationDetails.refundAmount ||
                                0,
                            payoutRatio:
                                playerResult.calculationDetails.payoutRatio ||
                                0,
                        };

                        if (playerResult.calculationDetails.winningBets) {
                            logData.calculation.winningBets =
                                playerResult.calculationDetails.winningBets;
                        }
                        if (playerResult.calculationDetails.losingBets) {
                            logData.calculation.losingBets =
                                playerResult.calculationDetails.losingBets;
                        }
                    }

                    // 검증 결과 추가
                    if (playerResult.validationResult) {
                        logData.validation = {
                            isValid: playerResult.validationResult.isValid,
                            errors: playerResult.validationResult.errors,
                            warnings: playerResult.validationResult.warnings,
                            summary:
                                playerResult.validationResult
                                    .calculationSummary,
                        };
                    }

                    addLog(logLevel, message, logData);
                });

                // 진행 상태 업데이트
                const progressResult = await getSettlementProgress(poll.id);
                if (progressResult.success) {
                    setProgress((prev) => ({
                        ...prev,
                        pollSettlementStatus: {
                            isSettled: poll.isSettled,
                            settledAt: poll.settledAt || undefined,
                            settledBy: poll.settledBy || undefined,
                            totalPlayers: progressResult.progress.totalPlayers,
                            settledPlayers:
                                progressResult.progress.settledPlayers,
                            unsettledPlayers:
                                progressResult.progress.unsettledPlayers,
                            settlementProgress:
                                progressResult.progress.settlementProgress,
                            isFullySettled:
                                progressResult.progress.isFullySettled,
                        },
                    }));
                }
            } else {
                // 🛡️ 타임아웃 에러 특별 처리
                if (result.timeoutOccurred) {
                    addLog("warning", "⏰ 타임아웃 발생: cron 안전 시간 초과");
                    addLog(
                        "info",
                        "💡 해결 방법: 더 작은 배치 크기로 다시 시도하거나 타임아웃 시간을 늘려주세요"
                    );
                    addLog(
                        "info",
                        `🔧 현재 설정: 배치 크기 25명, 타임아웃 30초`
                    );
                } else {
                    addLog(
                        "error",
                        `정산 재개 실패: ${result.error || "알 수 없는 오류"}`
                    );
                }
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "정산 재개 중 오류 발생";
            addLog("error", `정산 재개 오류: ${errorMessage}`);
        } finally {
            setResuming(false);
        }
    }, [
        addLog,
        updatePlayerStatus,
        poll.id,
        poll.isSettled,
        poll.settledAt,
        poll.settledBy,
        progress.pollSettlementStatus,
    ]);

    const exportLogs = useCallback(() => {
        const logData = {
            poll: {
                id: poll.id,
                title: poll.title,
                isSettled: poll.isSettled,
                settledAt: poll.settledAt,
                settledBy: poll.settledBy,
            },
            settlement: {
                startTime: progress.startTime,
                endTime: progress.endTime,
                totalPlayers: progress.totalPlayers,
                successfulPlayers: progress.successfulPlayers,
                failedPlayers: progress.failedPlayers,
                totalSettlementAmount: progress.totalSettlementAmount,
            },
            pollSettlementStatus: progress.pollSettlementStatus,
            playerStatuses: progress.playerStatuses,
            logs: progress.logs,
        };

        const blob = new Blob([JSON.stringify(logData, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `settlement-logs-${poll.id}-${
            new Date().toISOString().split("T")[0]
        }.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [poll, progress]);

    const filteredLogs = useMemo(() => {
        return progress.logs.filter((log) => {
            if (logLevel === "info") return log.level === "info";
            if (logLevel === "success") return log.level === "success";
            if (logLevel === "warning") return log.level === "warning";
            if (logLevel === "error") return log.level === "error";
            if (logLevel === "debug") return log.level === "debug";
            return true;
        });
    }, [progress.logs, logLevel]);

    const progressPercentage = useMemo(() => {
        return progress.totalPlayers > 0
            ? (progress.processedPlayers / progress.totalPlayers) * 100
            : 0;
    }, [progress.totalPlayers, progress.processedPlayers]);

    const playerStatusesArray = useMemo(() => {
        return Object.values(progress.playerStatuses);
    }, [progress.playerStatuses]);

    useEffect(() => {
        if (autoScroll && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [progress.logs, autoScroll]);

    useEffect(() => {
        checkPollSettlementProgress().catch((err) => {
            console.error("Error checking poll settlement progress:", err);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [poll.id]);

    return (
        <div className="space-y-4">
            <LiveLogHeader
                logLevel={logLevel}
                showTimestamps={showTimestamps}
                autoScroll={autoScroll}
                showPlayerProgress={showPlayerProgress}
                showPollProgress={showPollProgress}
                onLogLevelChange={setLogLevel}
                onShowTimestampsChange={setShowTimestamps}
                onAutoScrollChange={setAutoScroll}
                onShowPlayerProgressChange={setShowPlayerProgress}
                onShowPollProgressChange={setShowPollProgress}
                onStartSettlement={startSettlement}
                onClearLogs={clearLogs}
                onExportLogs={exportLogs}
                onResumeSettlement={handleResumeFromLiveLog}
                progress={progress}
                selectedPlayersCount={selectedPlayers.length}
                resuming={resuming}
            />

            {showPollProgress && progress.pollSettlementStatus && (
                <PollProgressSection
                    pollSettlementStatus={progress.pollSettlementStatus}
                />
            )}

            {progress.isRunning && (
                <SettlementProgressSection
                    progress={progress}
                    progressPercentage={progressPercentage}
                />
            )}

            {showPlayerProgress && playerStatusesArray.length > 0 && (
                <PlayerProgressSection playerStatuses={playerStatusesArray} />
            )}

            <LogsSection
                filteredLogs={filteredLogs}
                showTimestamps={showTimestamps}
                logsEndRef={logsEndRef}
            />
        </div>
    );
}

const LiveLogHeader = ({
    logLevel,
    showTimestamps,
    autoScroll,
    showPlayerProgress,
    showPollProgress,
    onLogLevelChange,
    onShowTimestampsChange,
    onAutoScrollChange,
    onShowPlayerProgressChange,
    onShowPollProgressChange,
    onStartSettlement,
    onClearLogs,
    onExportLogs,
    onResumeSettlement,
    progress,
    selectedPlayersCount,
    resuming,
}: any) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-white">실시간 로그</h3>
            <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">로그 레벨:</span>
                <select
                    value={logLevel}
                    onChange={(e) =>
                        onLogLevelChange(e.target.value as LogEntry["level"])
                    }
                    className="bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600"
                >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="debug">Debug</option>
                </select>
            </div>
            {[
                {
                    label: "타임스탬프",
                    checked: showTimestamps,
                    onChange: onShowTimestampsChange,
                },
                {
                    label: "자동 스크롤",
                    checked: autoScroll,
                    onChange: onAutoScrollChange,
                },
                {
                    label: "플레이어 진행률",
                    checked: showPlayerProgress,
                    onChange: onShowPlayerProgressChange,
                },
                {
                    label: "폴 정산 상태",
                    checked: showPollProgress,
                    onChange: onShowPollProgressChange,
                },
            ].map(({ label, checked, onChange }) => (
                <label
                    key={label}
                    className="flex items-center gap-2 text-sm text-gray-400"
                >
                    <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => onChange(e.target.checked)}
                        className="rounded border-gray-600 bg-gray-700"
                    />
                    {label}
                </label>
            ))}
        </div>
        <div className="flex items-center gap-2">
            <button
                onClick={onStartSettlement}
                disabled={progress.isRunning || selectedPlayersCount === 0}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={`LiveLog에서 ${selectedPlayersCount}명 정산 실행`}
            >
                {progress.isRunning ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                    <Play className="w-3 h-3" />
                )}
                정산 시작 ({selectedPlayersCount}명) [LiveLog]
            </button>

            {/* 🆕 재개 버튼 */}
            {progress.pollSettlementStatus &&
                progress.pollSettlementStatus.unsettledPlayers > 0 &&
                !progress.pollSettlementStatus.isFullySettled && (
                    <button
                        onClick={onResumeSettlement}
                        disabled={resuming || progress.isRunning}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title={`정산 재개: ${progress.pollSettlementStatus.unsettledPlayers}명 남음`}
                    >
                        {resuming ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <SkipForward className="w-3 h-3" />
                        )}
                        재개 ({progress.pollSettlementStatus.unsettledPlayers}
                        명) [LiveLog]
                    </button>
                )}
            <button
                onClick={onClearLogs}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-500 transition-colors"
            >
                <Square className="w-3 h-3" />
                로그 지우기
            </button>
            <button
                onClick={onExportLogs}
                disabled={progress.logs.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
                <Download className="w-3 h-3" />
                로그 내보내기
            </button>
        </div>
    </div>
);

const PollProgressSection = ({ pollSettlementStatus }: any) => (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-white">
                    폴 정산 상태
                </span>
            </div>
            <div className="text-xs text-gray-400">
                {pollSettlementStatus.isSettled &&
                    pollSettlementStatus.settledAt && (
                        <span>
                            완료:{" "}
                            {pollSettlementStatus.settledAt.toLocaleString()}
                        </span>
                    )}
            </div>
        </div>

        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">전체 정산 진행률</span>
                <span className="text-sm text-white">
                    {pollSettlementStatus.settledPlayers} /{" "}
                    {pollSettlementStatus.totalPlayers} (
                    {pollSettlementStatus.settlementProgress.toFixed(1)}%)
                </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                        pollSettlementStatus.isFullySettled
                            ? "bg-green-600"
                            : "bg-blue-600"
                    }`}
                    style={{
                        width: `${pollSettlementStatus.settlementProgress}%`,
                    }}
                />
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
                {
                    label: "전체 플레이어",
                    value: pollSettlementStatus.totalPlayers,
                    color: "text-white",
                },
                {
                    label: "정산 완료",
                    value: pollSettlementStatus.settledPlayers,
                    color: "text-green-400",
                },
                {
                    label: "미정산",
                    value: pollSettlementStatus.unsettledPlayers,
                    color: "text-yellow-400",
                },
                {
                    label: "폴 상태",
                    value: pollSettlementStatus.isFullySettled
                        ? "완료"
                        : "진행중",
                    color: pollSettlementStatus.isFullySettled
                        ? "text-green-400"
                        : "text-blue-400",
                },
            ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                    <div className="text-xs text-gray-400 mb-1">{label}</div>
                    <div className={`text-lg font-bold ${color}`}>{value}</div>
                </div>
            ))}
        </div>

        {pollSettlementStatus.isFullySettled && (
            <div className="mt-3 p-3 bg-green-900/20 border border-green-800 rounded-lg">
                <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">
                        모든 플레이어 정산 완료! 폴이 정산 완료 상태로
                        업데이트되었습니다.
                    </span>
                </div>
            </div>
        )}
    </div>
);

const SettlementProgressSection = ({ progress, progressPercentage }: any) => (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">
                    정산 진행 중
                </span>
            </div>
            <div className="text-xs text-gray-400">
                {progress.startTime && (
                    <span>시작: {progress.startTime.toLocaleTimeString()}</span>
                )}
            </div>
        </div>

        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">진행률</span>
                <span className="text-sm text-white">
                    {progress.processedPlayers} / {progress.totalPlayers} (
                    {progressPercentage.toFixed(1)}%)
                </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                />
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            {[
                {
                    label: "총 플레이어",
                    value: progress.totalPlayers,
                    color: "text-white",
                },
                {
                    label: "처리 완료",
                    value: progress.processedPlayers,
                    color: "text-blue-400",
                },
                {
                    label: "새로 정산",
                    value: progress.successfulPlayers,
                    color: "text-green-400",
                },
                {
                    label: "이미 정산됨",
                    value: (progress as any).alreadySettledPlayers || 0,
                    color: "text-yellow-400",
                },
                {
                    label: "실패",
                    value: progress.failedPlayers,
                    color: "text-red-400",
                },
            ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                    <div className="text-xs text-gray-400 mb-1">{label}</div>
                    <div className={`text-lg font-bold ${color}`}>{value}</div>
                </div>
            ))}
        </div>

        {progress.currentProcessingPlayer && (
            <div className="mt-3 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    <span className="text-sm text-blue-400">
                        현재 처리 중:{" "}
                        {progress.currentProcessingPlayer.slice(-6)}
                    </span>
                </div>
            </div>
        )}
    </div>
);

const PlayerProgressSection = ({ playerStatuses }: any) => {
    const getPlayerStatusIcon = (status: PlayerStatus["status"]) => {
        switch (status) {
            case "pending":
                return <Clock className="w-4 h-4 text-gray-400" />;
            case "processing":
                return (
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                );
            case "completed":
                return <CheckCircle className="w-4 h-4 text-green-400" />;
            case "failed":
                return <XCircle className="w-4 h-4 text-red-400" />;
            default:
                return <User className="w-4 h-4 text-gray-400" />;
        }
    };

    const getPlayerStatusColor = (status: PlayerStatus["status"]) => {
        switch (status) {
            case "pending":
                return "text-gray-400";
            case "processing":
                return "text-blue-400";
            case "completed":
                return "text-green-400";
            case "failed":
                return "text-red-400";
            default:
                return "text-gray-400";
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h4 className="text-sm font-medium text-white mb-3">
                플레이어별 진행 상황
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {playerStatuses.map((playerStatus: PlayerStatus) => (
                    <div
                        key={playerStatus.playerId}
                        className={`flex items-center gap-2 p-2 rounded border ${
                            playerStatus.status === "processing"
                                ? "bg-blue-900/20 border-blue-800"
                                : playerStatus.status === "completed"
                                ? "bg-green-900/20 border-green-800"
                                : playerStatus.status === "failed"
                                ? "bg-red-900/20 border-red-800"
                                : "bg-gray-700 border-gray-600"
                        }`}
                    >
                        {getPlayerStatusIcon(playerStatus.status)}
                        <div className="flex-1 min-w-0">
                            <div
                                className={`text-xs font-medium ${getPlayerStatusColor(
                                    playerStatus.status
                                )}`}
                            >
                                {playerStatus.playerId.slice(-6)}
                            </div>
                            {playerStatus.settlementAmount !== undefined && (
                                <div className="text-xs text-gray-400">
                                    {playerStatus.settlementAmount > 0
                                        ? `+${formatAmount(
                                              playerStatus.settlementAmount
                                          )}`
                                        : formatAmount(
                                              playerStatus.settlementAmount
                                          )}
                                </div>
                            )}
                        </div>
                        {playerStatus.duration && (
                            <div className="text-xs text-gray-500">
                                {playerStatus.duration}ms
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const LogsSection = ({ filteredLogs, showTimestamps, logsEndRef }: any) => {
    const getLogLevelColor = (level: LogEntry["level"]) => {
        switch (level) {
            case "success":
                return "text-green-400";
            case "warning":
                return "text-yellow-400";
            case "error":
                return "text-red-400";
            case "debug":
                return "text-blue-400";
            default:
                return "text-gray-300";
        }
    };

    const getLogLevelIcon = (level: LogEntry["level"]) => {
        switch (level) {
            case "success":
                return <CheckCircle className="w-4 h-4" />;
            case "warning":
                return <AlertTriangle className="w-4 h-4" />;
            case "error":
                return <XCircle className="w-4 h-4" />;
            case "debug":
                return <FileText className="w-4 h-4" />;
            default:
                return <FileText className="w-4 h-4" />;
        }
    };

    return (
        <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">
                        로그 ({filteredLogs.length}개)
                    </span>
                    <span className="text-xs text-gray-400">
                        {filteredLogs.length}개 표시
                    </span>
                </div>
            </div>
            <div className="h-96 overflow-y-auto p-4 space-y-2">
                {filteredLogs.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                        로그가 없습니다
                    </div>
                ) : (
                    <>
                        {filteredLogs.map((log: LogEntry) => (
                            <div
                                key={log.id}
                                className="flex items-start gap-3 p-3 bg-gray-800 rounded border border-gray-700"
                            >
                                <div
                                    className={`flex-shrink-0 ${getLogLevelColor(
                                        log.level
                                    )}`}
                                >
                                    {getLogLevelIcon(log.level)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {showTimestamps && (
                                            <span className="text-xs text-gray-500">
                                                {log.timestamp.toLocaleTimeString()}
                                            </span>
                                        )}
                                        <span
                                            className={`text-sm font-medium ${getLogLevelColor(
                                                log.level
                                            )}`}
                                        >
                                            {log.message}
                                        </span>
                                    </div>
                                    {log.data && (
                                        <div className="mt-2">
                                            {/* 🔍 이미 정산된 사용자 특별 표시 */}
                                            {log.data.alreadySettledReason && (
                                                <div className="mb-3 p-3 bg-yellow-900/20 border border-yellow-600 rounded-lg">
                                                    <h4 className="text-xs font-medium text-yellow-400 mb-2">
                                                        ⚠️ 이미 정산된 플레이어
                                                    </h4>
                                                    <div className="grid grid-cols-1 gap-2 text-xs">
                                                        <div>
                                                            <span className="text-gray-400">
                                                                상태:
                                                            </span>
                                                            <span className="ml-1 text-yellow-300 font-medium">
                                                                {
                                                                    log.data
                                                                        .alreadySettledReason
                                                                        .status
                                                                }
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">
                                                                건너뛴 시간:
                                                            </span>
                                                            <span className="ml-1 text-gray-300">
                                                                {new Date(
                                                                    log.data.alreadySettledReason.skippedAt
                                                                ).toLocaleTimeString()}
                                                            </span>
                                                        </div>
                                                        {log.data
                                                            .alreadySettledReason
                                                            .originalMessage && (
                                                            <div>
                                                                <span className="text-gray-400">
                                                                    원본 메시지:
                                                                </span>
                                                                <span className="ml-1 text-gray-300 text-xs">
                                                                    {
                                                                        log.data
                                                                            .alreadySettledReason
                                                                            .originalMessage
                                                                    }
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <span className="text-gray-400">
                                                                사유:
                                                            </span>
                                                            <span className="ml-1 text-gray-300 text-xs">
                                                                {
                                                                    log.data
                                                                        .alreadySettledReason
                                                                        .reason
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 p-2 bg-yellow-800/30 rounded text-xs text-yellow-300">
                                                        ⚠️ 이 플레이어는 이미
                                                        정산되어 처리를
                                                        건너뛰었습니다. 중복
                                                        정산 방지됨.
                                                    </div>
                                                </div>
                                            )}

                                            {/* 🔍 베팅이 없는 사용자 특별 표시 */}
                                            {log.data.noSettlementReason && (
                                                <div className="mb-3 p-3 bg-gray-900/20 border border-gray-600 rounded-lg">
                                                    <h4 className="text-xs font-medium text-gray-400 mb-2">
                                                        ⚪ 정산 대상 제외 사유
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div>
                                                            <span className="text-gray-400">
                                                                유형:
                                                            </span>
                                                            <span className="ml-1 text-gray-300 font-medium">
                                                                {log.data
                                                                    .noSettlementReason
                                                                    .type ===
                                                                "NO_BET"
                                                                    ? "베팅 없음"
                                                                    : "0원 베팅"}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">
                                                                참여 여부:
                                                            </span>
                                                            <span className="ml-1 text-gray-300">
                                                                {log.data
                                                                    .noSettlementReason
                                                                    .isParticipant
                                                                    ? "참여"
                                                                    : "미참여"}
                                                            </span>
                                                        </div>
                                                        {log.data
                                                            .noSettlementReason
                                                            .betCount > 0 && (
                                                            <div>
                                                                <span className="text-gray-400">
                                                                    베팅 횟수:
                                                                </span>
                                                                <span className="ml-1 text-gray-300">
                                                                    {
                                                                        log.data
                                                                            .noSettlementReason
                                                                            .betCount
                                                                    }
                                                                    회
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="col-span-2">
                                                            <span className="text-gray-400">
                                                                사유:
                                                            </span>
                                                            <span className="ml-1 text-gray-300 text-xs">
                                                                {
                                                                    log.data
                                                                        .noSettlementReason
                                                                        .reason
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 p-2 bg-gray-800 rounded text-xs text-gray-400">
                                                        💡 이 플레이어는 정산
                                                        대상이 아니므로 통계에서
                                                        제외됩니다.
                                                    </div>
                                                </div>
                                            )}

                                            {/* 🔍 정산 상세 정보 특별 표시 */}
                                            {log.data.calculation && (
                                                <div className="mb-3 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                                                    <h4 className="text-xs font-medium text-blue-400 mb-2">
                                                        💰 정산 계산 상세
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div>
                                                            <span className="text-gray-400">
                                                                유형:
                                                            </span>
                                                            <span
                                                                className={`ml-1 font-medium ${
                                                                    log.data
                                                                        .calculation
                                                                        .type ===
                                                                    "PAYOUT"
                                                                        ? "text-green-400"
                                                                        : log
                                                                              .data
                                                                              .calculation
                                                                              .type ===
                                                                          "REFUND"
                                                                        ? "text-yellow-400"
                                                                        : log
                                                                              .data
                                                                              .calculation
                                                                              .type ===
                                                                          "NO_BET"
                                                                        ? "text-gray-400"
                                                                        : log
                                                                              .data
                                                                              .calculation
                                                                              .type ===
                                                                          "ZERO_BET"
                                                                        ? "text-gray-400"
                                                                        : "text-gray-400"
                                                                }`}
                                                            >
                                                                {
                                                                    log.data
                                                                        .calculation
                                                                        .type
                                                                }
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">
                                                                총 베팅:
                                                            </span>
                                                            <span className="ml-1 text-white">
                                                                {formatAmount(
                                                                    log.data
                                                                        .calculation
                                                                        .totalBet
                                                                )}
                                                                원
                                                            </span>
                                                        </div>
                                                        {log.data.calculation
                                                            .winningBet > 0 && (
                                                            <div>
                                                                <span className="text-gray-400">
                                                                    승리 베팅:
                                                                </span>
                                                                <span className="ml-1 text-green-400">
                                                                    {formatAmount(
                                                                        log.data
                                                                            .calculation
                                                                            .winningBet
                                                                    )}
                                                                    원
                                                                </span>
                                                            </div>
                                                        )}
                                                        {log.data.calculation
                                                            .payoutAmount >
                                                            0 && (
                                                            <>
                                                                <div>
                                                                    <span className="text-gray-400">
                                                                        배당률:
                                                                    </span>
                                                                    <span className="ml-1 text-blue-400">
                                                                        {(
                                                                            log
                                                                                .data
                                                                                .calculation
                                                                                .payoutRatio *
                                                                            100
                                                                        ).toFixed(
                                                                            2
                                                                        )}
                                                                        %
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-400">
                                                                        페이아웃:
                                                                    </span>
                                                                    <span className="ml-1 text-green-400 font-medium">
                                                                        +
                                                                        {formatAmount(
                                                                            log
                                                                                .data
                                                                                .calculation
                                                                                .payoutAmount
                                                                        )}
                                                                        원
                                                                    </span>
                                                                </div>
                                                            </>
                                                        )}
                                                        {log.data.calculation
                                                            .refundAmount >
                                                            0 && (
                                                            <div>
                                                                <span className="text-gray-400">
                                                                    환불:
                                                                </span>
                                                                <span className="ml-1 text-yellow-400 font-medium">
                                                                    +
                                                                    {formatAmount(
                                                                        log.data
                                                                            .calculation
                                                                            .refundAmount
                                                                    )}
                                                                    원
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 🔍 검증 결과 표시 */}
                                            {log.data.validation && (
                                                <div
                                                    className={`mb-3 p-3 rounded-lg border ${
                                                        log.data.validation
                                                            .errors?.length > 0
                                                            ? "bg-red-900/20 border-red-800"
                                                            : log.data
                                                                  .validation
                                                                  .warnings
                                                                  ?.length > 0
                                                            ? "bg-yellow-900/20 border-yellow-800"
                                                            : "bg-green-900/20 border-green-800"
                                                    }`}
                                                >
                                                    <h4
                                                        className={`text-xs font-medium mb-2 ${
                                                            log.data.validation
                                                                .errors
                                                                ?.length > 0
                                                                ? "text-red-400"
                                                                : log.data
                                                                      .validation
                                                                      .warnings
                                                                      ?.length >
                                                                  0
                                                                ? "text-yellow-400"
                                                                : "text-green-400"
                                                        }`}
                                                    >
                                                        🔍 정산 검증 결과
                                                    </h4>

                                                    {log.data.validation.errors
                                                        ?.length > 0 && (
                                                        <div className="mb-2">
                                                            <div className="text-xs text-red-400 font-medium mb-1">
                                                                ❌ 오류:
                                                            </div>
                                                            {log.data.validation.errors.map(
                                                                (
                                                                    error: string,
                                                                    idx: number
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="text-xs text-red-300 ml-2"
                                                                    >
                                                                        •{" "}
                                                                        {error}
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    )}

                                                    {log.data.validation
                                                        .warnings?.length >
                                                        0 && (
                                                        <div className="mb-2">
                                                            <div className="text-xs text-yellow-400 font-medium mb-1">
                                                                ⚠️ 경고:
                                                            </div>
                                                            {log.data.validation.warnings.map(
                                                                (
                                                                    warning: string,
                                                                    idx: number
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="text-xs text-yellow-300 ml-2"
                                                                    >
                                                                        •{" "}
                                                                        {
                                                                            warning
                                                                        }
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    )}

                                                    {log.data.validation
                                                        .isValid && (
                                                        <div className="text-xs text-green-400">
                                                            ✅ 모든 검증 통과
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* 기본 데이터 표시 */}
                                            <details className="cursor-pointer">
                                                <summary className="text-xs text-gray-500 hover:text-gray-400 mb-2">
                                                    전체 로그 데이터 보기
                                                </summary>
                                                <pre className="text-xs text-gray-400 bg-gray-900 p-2 rounded overflow-x-auto">
                                                    {JSON.stringify(
                                                        log.data,
                                                        null,
                                                        2
                                                    )}
                                                </pre>
                                            </details>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </>
                )}
            </div>
        </div>
    );
};
