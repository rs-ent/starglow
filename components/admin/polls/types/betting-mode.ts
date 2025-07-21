import type { Poll } from "@prisma/client";

export interface BettingStats {
    totalParticipants: number;
    totalBets: number;
    totalAmount: number;
    averageBetAmount: number;
    topBettors: Array<{
        playerId: string;
        nickname: string | null;
        totalAmount: number;
        betCount: number;
    }>;
    optionStats: Array<{
        optionId: string;
        totalAmount: number;
        participantCount: number;
        averageAmount: number;
    }>;
}

export interface CalculationDetails {
    playerId: string;
    playerName: string;
    totalBetAmount: number;
    winningBets: Array<{
        optionId: string;
        betAmount: number;
        isWinningOption: boolean;
    }>;
    payoutAmount: number;
    refundAmount: number;
    commissionAmount: number;
    calculationSteps: Array<{
        step: string;
        value: number;
        description: string;
    }>;
    rewardLogIssue?: {
        pollLogAmount: number;
        rewardLogDeduction: number;
        missingAmount: number;
    };
}

export interface LogEntry {
    id: string;
    timestamp: Date;
    level: "info" | "success" | "warning" | "error" | "debug";
    message: string;
    data?: any;
    playerId?: string;
    settlementAmount?: number;
    duration?: number;
}

export interface PlayerStatus {
    playerId: string;
    status: "pending" | "processing" | "completed" | "failed";
    settlementAmount?: number;
    error?: string;
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    calculationDetails?: any;
    validationResult?: {
        isValid: boolean;
        warnings: string[];
        errors: string[];
        calculationSummary: any;
    };
}

export interface SettlementProgress {
    isRunning: boolean;
    startTime?: Date;
    endTime?: Date;
    totalPlayers: number;
    processedPlayers: number;
    successfulPlayers: number;
    failedPlayers: number;
    totalSettlementAmount: number;
    currentBatch: number;
    totalBatches: number;
    logs: LogEntry[];
    playerStatuses: Record<string, PlayerStatus>;
    currentProcessingPlayer?: string;
    pollSettlementStatus?: {
        isSettled: boolean;
        settledAt?: Date;
        settledBy?: string;
        totalPlayers: number;
        settledPlayers: number;
        unsettledPlayers: number;
        settlementProgress: number;
        isFullySettled: boolean;
    };
}

export interface PollOption {
    optionId: string;
    name: string;
}

export interface ExtendedPoll extends Poll {
    options: any[];
}

export type PlayerTab =
    | "all"
    | "winners"
    | "losers"
    | "settled"
    | "unsettled"
    | "error";

export type SortBy = "totalAmount" | "betCount" | "createdAt";
export type SortOrder = "asc" | "desc";

export interface BulkSettlementResult {
    success: boolean;
    message?: string;
    error?: string;
    results: Array<{
        playerId: string;
        success: boolean;
        message?: string;
        error?: string;
        settlementAmount: number;
        notificationSent: boolean;
    }>;
    summary: {
        totalProcessed: number;
        totalSuccess: number;
        totalFailed: number;
        totalSettlementAmount: number;
    };
}

export interface PlayerSettlementStatus {
    isSettled: boolean;
    settlementAmount: number;
    hasAmountMismatch?: boolean;
    mismatchMessage?: string;
    status: "unsettled" | "settled" | "error" | "missing_bet";
    canResettle?: boolean;
    settlementLogs?: Array<{
        id: string;
        amount: number;
        createdAt: Date;
        reason: string | null;
    }>;
}

export interface SafetyCheckConfig {
    maxPlayersPerBatch: number;
    warningThreshold: number;
    dangerThreshold: number;
}

export const SAFETY_CONFIG: SafetyCheckConfig = {
    maxPlayersPerBatch: 100,
    warningThreshold: 50,
    dangerThreshold: 100,
};
