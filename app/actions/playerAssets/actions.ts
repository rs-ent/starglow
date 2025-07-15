/// app/actions/playerAssets.ts

"use server";

import { PlayerAssetStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import { createAssetInstance } from "@/app/actions/assets/actions";
import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";

import type { AssetStatusChangeEvent } from "@/app/actions/assets/actions";
import type {
    Prisma,
    PlayerAsset,
    AssetType,
    Player,
    Asset,
    AssetInstance,
    AssetInstanceStatus,
    RewardsLog,
} from "@prisma/client";

export interface PlayerAssetResult<T> {
    success: boolean;
    data: T;
    error?: string;
}

export interface PlayerAssetUpdateResult {
    success: boolean;
    error?: string;
}

export interface PlayerAssetOperation {
    playerId: string;
    assetId: string;
    amount: number;
    operation: "ADD" | "SUBTRACT" | "SET";
}

export interface PlayerAssetTransactionInput {
    playerId: string;
    assetId: string;
    amount: number;
    operation: "ADD" | "SUBTRACT" | "SET";
    reason?: string;
    metadata?: any;
    questId?: string;
    questLogId?: string;
    pollId?: string;
    pollLogId?: string;
    tweetAuthorId?: string;
    tweetIds?: string[];
}

export interface GetPlayerAssetsFilter {
    playerId?: string;
    assetId?: string;
    assetIds?: string[];
    assetType?: AssetType;
    isActive?: boolean;
    includeDefaultAsset?: boolean;
}

export interface GetPlayerAssetsInput {
    filter?: GetPlayerAssetsFilter;
    pagination?: {
        page?: number;
        limit?: number;
    };
}

export type PlayerAssetWithAsset = {
    id: string;
    playerId: string;
    assetId: string;
    balance: number;
    status: string;
    updatedAt: Date;
    asset: {
        id: string;
        name: string;
        symbol: string;
        iconUrl: string | null;
        isActive: boolean;
        hasInstance: boolean;
    };
};

export interface GetPlayerAssetsResult {
    success: boolean;
    data?: {
        assets: PlayerAssetWithAsset[];
        totalCount: number;
        currentPage: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
    error?: string;
}

export async function getPlayerAssets(
    input?: GetPlayerAssetsInput
): Promise<GetPlayerAssetsResult> {
    if (!input) {
        return {
            success: false,
            data: {
                assets: [],
                totalCount: 0,
                currentPage: 1,
                totalPages: 0,
                hasNext: false,
                hasPrevious: false,
            },
            error: "No input",
        };
    }

    const page = input.pagination?.page || 1;
    const limit = input.pagination?.limit || 50;
    const offset = (page - 1) * limit;

    const where: Prisma.PlayerAssetWhereInput = {};
    const assetWhere: Prisma.AssetWhereInput = {};
    const filter = input?.filter;

    if (filter?.playerId) {
        where.playerId = filter.playerId;
    }

    if (filter?.assetId) {
        where.assetId = filter.assetId;
    }

    if (filter?.assetIds && filter.assetIds.length > 0) {
        where.assetId = { in: filter.assetIds };
    }

    if (filter?.assetType) {
        assetWhere.assetType = filter.assetType;
    }

    if (filter?.isActive !== undefined) {
        assetWhere.isActive = filter.isActive;
    }

    if (filter?.includeDefaultAsset !== undefined) {
        assetWhere.isDefault = filter.includeDefaultAsset;
    }

    if (Object.keys(assetWhere).length > 0) {
        where.asset = assetWhere;
    }

    const [playerAssets, totalCount] = await Promise.all([
        prisma.playerAsset.findMany({
            cacheStrategy: getCacheStrategy("realtime"),
            where,
            select: {
                id: true,
                playerId: true,
                assetId: true,
                balance: true,
                status: true,
                updatedAt: true,
                asset: {
                    select: {
                        id: true,
                        name: true,
                        symbol: true,
                        iconUrl: true,
                        description: true,
                        assetType: true,
                        isActive: true,
                        hasInstance: true,
                        imageUrl: true,
                        metadata: true,
                    },
                },
            },
            orderBy: { id: "asc" },
            skip: offset,
            take: limit,
        }),
        prisma.playerAsset.count({
            cacheStrategy: getCacheStrategy("realtime"),
            where,
        }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
        success: true,
        data: {
            assets: playerAssets as PlayerAssetWithAsset[],
            totalCount,
            currentPage: page,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1,
        },
    };
}

export interface GetPlayerAssetInput {
    playerId: string;
    assetId: string;
}

export async function getPlayerAsset(
    input?: GetPlayerAssetInput
): Promise<PlayerAssetResult<PlayerAssetWithAsset | null>> {
    if (!input) {
        return {
            success: false,
            data: null,
            error: "No input",
        };
    }

    const playerAsset = await prisma.playerAsset.findUnique({
        cacheStrategy: getCacheStrategy("realtime"),
        where: {
            playerId_assetId: {
                playerId: input.playerId,
                assetId: input.assetId,
            },
        },
        select: {
            id: true,
            playerId: true,
            assetId: true,
            balance: true,
            status: true,
            updatedAt: true,
            asset: {
                select: {
                    id: true,
                    name: true,
                    symbol: true,
                    isActive: true,
                    hasInstance: true,
                    iconUrl: true,
                },
            },
        },
    });

    return {
        success: true,
        data: playerAsset,
    };
}

export interface UpdatePlayerAssetInput {
    transaction: PlayerAssetTransactionInput;
}

export async function updatePlayerAsset(
    input?: UpdatePlayerAssetInput,
    trx?: any // Prisma v6 트랜잭션 타입 호환성을 위한 변경
): Promise<PlayerAssetUpdateResult> {
    if (!input) {
        return {
            success: false,
            error: "No input",
        };
    }

    if (input.transaction.amount < 0) {
        return {
            success: false,
            error: "Amount cannot be negative",
        };
    }

    if (input.transaction.amount > Number.MAX_SAFE_INTEGER) {
        return {
            success: false,
            error: "Amount exceeds maximum safe integer",
        };
    }

    const tx = (trx || prisma) as typeof prisma;

    const asset = await tx.asset.findUnique({
        cacheStrategy: getCacheStrategy("realtime"),
        where: { id: input.transaction.assetId },
    });

    if (!asset) {
        return {
            success: false,
            error: "Asset not found",
        };
    }

    if (!asset.isActive) {
        return {
            success: false,
            error: "Asset is not active",
        };
    }

    // 🔀 hasInstance에 따른 분기 처리
    if (asset.hasInstance) {
        return await updatePlayerAssetWithInstances(input, asset, tx);
    } else {
        return await updatePlayerAssetBalance(input, tx);
    }
}

// 🔧 Instance가 없는 자산 처리 (기존 로직)
async function updatePlayerAssetBalance(
    input: UpdatePlayerAssetInput,
    tx: typeof prisma
): Promise<PlayerAssetUpdateResult> {
    const playerAsset = await tx.playerAsset.findUnique({
        cacheStrategy: getCacheStrategy("realtime"),
        where: {
            playerId_assetId: {
                playerId: input.transaction.playerId,
                assetId: input.transaction.assetId,
            },
        },
        select: {
            status: true,
            balance: true,
        },
    });

    if (playerAsset) {
        switch (playerAsset.status) {
            case PlayerAssetStatus.INACTIVE:
                return {
                    success: false,
                    error: "Asset is inactive",
                };
            case PlayerAssetStatus.FROZEN:
                return { success: false, error: "Asset is frozen" };
            case PlayerAssetStatus.DELETED:
                return {
                    success: false,
                    error: "Asset is deleted",
                };
        }
    }

    const oldBalance = playerAsset?.balance || 0;
    let newBalance: number;

    switch (input.transaction.operation) {
        case "ADD":
            newBalance = oldBalance + input.transaction.amount;

            // 🔒 Addition overflow 검증
            if (
                newBalance > Number.MAX_SAFE_INTEGER ||
                newBalance < oldBalance
            ) {
                return {
                    success: false,
                    error: "Balance overflow detected",
                };
            }
            break;
        case "SUBTRACT":
            newBalance = oldBalance - input.transaction.amount;
            if (newBalance < 0) {
                return {
                    success: false,
                    error: "Insufficient balance",
                };
            }
            break;
        case "SET":
            newBalance = input.transaction.amount;

            // 🔒 SET 연산에서도 범위 검증
            if (newBalance > Number.MAX_SAFE_INTEGER) {
                return {
                    success: false,
                    error: "Balance exceeds maximum safe integer",
                };
            }
            break;
    }

    // 🎯 Performance optimization: Remove unnecessary select - data is not used by callers
    await tx.playerAsset.upsert({
        where: {
            playerId_assetId: {
                playerId: input.transaction.playerId,
                assetId: input.transaction.assetId,
            },
        },
        create: {
            playerId: input.transaction.playerId,
            assetId: input.transaction.assetId,
            balance: newBalance,
        },
        update: {
            balance: newBalance,
        },
    });

    if (
        input.transaction.operation === "ADD" ||
        input.transaction.operation === "SUBTRACT"
    ) {
        await tx.rewardsLog.create({
            data: {
                playerId: input.transaction.playerId,
                assetId: input.transaction.assetId,
                amount: input.transaction.amount,
                balanceBefore: oldBalance,
                balanceAfter: newBalance,
                questId: input.transaction.questId,
                questLogId: input.transaction.questLogId,
                pollId: input.transaction.pollId,
                pollLogId: input.transaction.pollLogId,
                tweetAuthorId: input.transaction.tweetAuthorId,
                tweetIds: input.transaction.tweetIds,
                reason: input.transaction.reason,
            },
            select: {
                id: true,
            },
        });
    }

    return { success: true };
}

// 🔧 Instance가 있는 자산 처리
async function updatePlayerAssetWithInstances(
    input: UpdatePlayerAssetInput,
    asset: Asset,
    tx: typeof prisma
): Promise<PlayerAssetUpdateResult> {
    const { transaction } = input;

    // 🔍 PlayerAsset 상태 확인 (일관성을 위해 추가)
    const existingPlayerAsset = await tx.playerAsset.findUnique({
        cacheStrategy: getCacheStrategy("realtime"),
        where: {
            playerId_assetId: {
                playerId: transaction.playerId,
                assetId: transaction.assetId,
            },
        },
        select: {
            status: true,
        },
    });

    if (existingPlayerAsset) {
        switch (existingPlayerAsset.status) {
            case PlayerAssetStatus.INACTIVE:
                return {
                    success: false,
                    error: "Player asset is inactive",
                };
            case PlayerAssetStatus.FROZEN:
                return {
                    success: false,
                    error: "Player asset is frozen",
                };
            case PlayerAssetStatus.DELETED:
                return {
                    success: false,
                    error: "Player asset is deleted",
                };
        }
    }

    switch (transaction.operation) {
        case "ADD":
            // 새로운 AssetInstance들 생성 및 지급
            const grantResult = await grantPlayerAssetInstances({
                playerId: transaction.playerId,
                asset: asset,
                amount: transaction.amount,
                source: transaction.reason || "balance_update",
                reason: transaction.reason,
                questId: transaction.questId,
                questLogId: transaction.questLogId,
                pollId: transaction.pollId,
                pollLogId: transaction.pollLogId,
                trx: tx,
            });

            if (!grantResult.success) {
                return { success: false, error: grantResult.error };
            }

            return { success: true };

        case "SUBTRACT":
            // 기존 AssetInstance들 소비/회수
            const withdrawResult = await withdrawPlayerAssetInstances({
                playerId: transaction.playerId,
                asset: asset,
                amount: transaction.amount,
                withdrawalType: "USED", // 기본값, 필요시 파라미터로 받을 수 있음
                reason: transaction.reason || "balance_update",
                questId: transaction.questId,
                questLogId: transaction.questLogId,
                pollId: transaction.pollId,
                pollLogId: transaction.pollLogId,
                trx: tx,
            });

            if (!withdrawResult.success) {
                return {
                    success: false,
                    error: withdrawResult.error,
                };
            }

            return { success: true };

        case "SET":
            // SET 연산은 복잡하므로 별도 처리 필요
            return await setPlayerAssetWithInstances(input, asset, tx);

        default:
            return { success: false, error: "Invalid operation" };
    }
}

// 🔧 Instance가 있는 자산의 SET 연산 처리
async function setPlayerAssetWithInstances(
    input: UpdatePlayerAssetInput,
    asset: Asset,
    tx: typeof prisma
): Promise<PlayerAssetUpdateResult> {
    const { transaction } = input;

    // 🔍 현재 PlayerAsset 조회
    const currentPlayerAsset = await tx.playerAsset.findUnique({
        cacheStrategy: getCacheStrategy("realtime"),
        where: {
            playerId_assetId: {
                playerId: transaction.playerId,
                assetId: transaction.assetId,
            },
        },
        select: {
            id: true,
            playerId: true,
            assetId: true,
            balance: true,
            status: true,
            updatedAt: true,
        },
    });

    const currentBalance = currentPlayerAsset?.balance || 0;
    const targetBalance = transaction.amount;
    const difference = targetBalance - currentBalance;

    // 목표 잔액과 현재 잔액이 같으면 아무것도 하지 않음
    if (difference === 0) {
        if (currentPlayerAsset) {
            return { success: true };
        } else if (targetBalance === 0) {
            // 목표가 0이고 PlayerAsset이 없으면 굳이 생성하지 않음
            return {
                success: true,
                error: "No PlayerAsset needed for zero balance",
            };
        } else {
            // PlayerAsset이 없고 목표 잔액이 0보다 크면 생성
            await tx.playerAsset.create({
                data: {
                    playerId: transaction.playerId,
                    assetId: transaction.assetId,
                    balance: 0,
                    status: "ACTIVE",
                },
            });
            return { success: true };
        }
    }

    if (difference > 0) {
        // 목표 > 현재: 차이만큼 인스턴스 생성
        const grantResult = await grantPlayerAssetInstances({
            playerId: transaction.playerId,
            asset: asset,
            amount: difference,
            source: transaction.reason || "balance_set",
            reason: transaction.reason || `Set balance to ${targetBalance}`,
            questId: transaction.questId,
            questLogId: transaction.questLogId,
            pollId: transaction.pollId,
            pollLogId: transaction.pollLogId,
            trx: tx,
        });

        if (!grantResult.success) {
            return { success: false, error: grantResult.error };
        }

        return { success: true };
    } else {
        // 목표 < 현재: 차이만큼 인스턴스 회수
        const withdrawAmount = Math.abs(difference);

        const withdrawResult = await withdrawPlayerAssetInstances({
            playerId: transaction.playerId,
            asset: asset,
            amount: withdrawAmount,
            withdrawalType: "USED",
            reason: transaction.reason || `Set balance to ${targetBalance}`,
            questId: transaction.questId,
            questLogId: transaction.questLogId,
            pollId: transaction.pollId,
            pollLogId: transaction.pollLogId,
            trx: tx,
        });

        if (!withdrawResult.success) {
            return { success: false, error: withdrawResult.error };
        }

        return { success: true };
    }
}

// 타입 정의 개선
interface RewardLogForRollback {
    id: string;
    playerId: string;
    assetId: string | null;
    amount: number;
    questLogId?: string | null;
    pollLogId?: string | null;
}

interface PlayerAssetForRollback {
    id: string;
    playerId: string;
    assetId: string;
    balance: number;
}

interface RollbackCalculation {
    playerAsset: PlayerAssetForRollback;
    totalRollbackAmount: number;
    finalBalance: number;
}

// 🔄 Helper Functions - 복잡한 로직을 작은 함수로 분리

async function getRewardLogsToRollback(
    input: RollbackPlayerAssetInput,
    tx: typeof prisma
): Promise<RewardLogForRollback[] | { error: string }> {
    if (input.rewardLogId) {
        const rewardLog = await tx.rewardsLog.findUnique({
            cacheStrategy: getCacheStrategy("realtime"),
            where: { id: input.rewardLogId },
            select: { id: true, playerId: true, assetId: true, amount: true },
        });

        if (!rewardLog) {
            return { error: "Reward log not found" };
        }

        return [rewardLog];
    }

    if (input.questLogId) {
        const rewardLogs = await tx.rewardsLog.findMany({
            cacheStrategy: getCacheStrategy("realtime"),
            where: { questLogId: input.questLogId },
            select: { id: true, playerId: true, assetId: true, amount: true },
        });

        return rewardLogs.length > 0
            ? rewardLogs
            : { error: "No reward logs found for quest" };
    }

    if (input.pollLogId) {
        const rewardLogs = await tx.rewardsLog.findMany({
            where: { pollLogId: input.pollLogId },
            select: { id: true, playerId: true, assetId: true, amount: true },
        });

        return rewardLogs.length > 0
            ? rewardLogs
            : { error: "No reward logs found for poll" };
    }

    if (input.directRollback) {
        return [
            {
                id: "direct-rollback",
                playerId: input.directRollback.playerId,
                assetId: input.directRollback.assetId,
                amount: input.directRollback.amount,
            },
        ];
    }

    return { error: "No rollback criteria specified" };
}

async function getPlayerAssetsForRollback(
    rewardLogs: RewardLogForRollback[],
    tx: typeof prisma
): Promise<PlayerAssetForRollback[]> {
    // 🔄 중복 제거를 Map으로 최적화
    const uniquePlayerAssets = new Map<
        string,
        { playerId: string; assetId: string }
    >();

    for (const log of rewardLogs) {
        if (!log.assetId) continue; // null/undefined assetId 건너뛰기
        const key = `${log.playerId}_${log.assetId}`;
        if (!uniquePlayerAssets.has(key)) {
            uniquePlayerAssets.set(key, {
                playerId: log.playerId,
                assetId: log.assetId,
            });
        }
    }

    if (uniquePlayerAssets.size === 0) {
        return [];
    }

    // 🔄 OR 조건 최적화
    return await tx.playerAsset.findMany({
        cacheStrategy: getCacheStrategy("realtime"),
        where: {
            OR: Array.from(uniquePlayerAssets.values()).map(
                ({ playerId, assetId }) => ({
                    playerId,
                    assetId,
                })
            ),
        },
        select: {
            id: true,
            playerId: true,
            assetId: true,
            balance: true,
        },
    });
}

function calculateRollbackAmounts(
    rewardLogs: RewardLogForRollback[],
    playerAssets: PlayerAssetForRollback[],
    warnings: string[],
    directRollback?: { playerId: string; assetId: string; amount: number }
): Map<string, RollbackCalculation> {
    const rollbackCalculations = new Map<string, RollbackCalculation>();

    // 🔄 플레이어 자산을 Map으로 인덱싱하여 조회 성능 향상
    const playerAssetMap = new Map<string, PlayerAssetForRollback>();
    for (const asset of playerAssets) {
        playerAssetMap.set(`${asset.playerId}_${asset.assetId}`, asset);
    }

    for (const rewardLog of rewardLogs) {
        const key = `${rewardLog.playerId}_${rewardLog.assetId}`;
        const playerAsset = playerAssetMap.get(key);

        if (!playerAsset) {
            if (directRollback) {
                warnings.push(
                    `Player asset not found for ${rewardLog.playerId}:${rewardLog.assetId}`
                );
                continue;
            } else {
                // 에러는 호출하는 쪽에서 처리
                continue;
            }
        }

        const existingCalc = rollbackCalculations.get(key);
        if (existingCalc) {
            existingCalc.totalRollbackAmount += rewardLog.amount;
            existingCalc.finalBalance =
                existingCalc.playerAsset.balance -
                existingCalc.totalRollbackAmount;
        } else {
            rollbackCalculations.set(key, {
                playerAsset,
                totalRollbackAmount: rewardLog.amount,
                finalBalance: playerAsset.balance - rewardLog.amount,
            });
        }
    }

    return rollbackCalculations;
}

function validateRollbackBalances(
    rollbackCalculations: Map<string, RollbackCalculation>
): string | null {
    for (const [key, calc] of rollbackCalculations) {
        if (calc.finalBalance < 0) {
            return `Insufficient balance for ${key}. Current: ${calc.playerAsset.balance}, Rollback: ${calc.totalRollbackAmount}, Final: ${calc.finalBalance}`;
        }
    }
    return null;
}

function createDryRunResult(
    rollbackCalculations: Map<string, RollbackCalculation>,
    rewardLogs: RewardLogForRollback[],
    warnings: string[]
): RollbackPlayerAssetResult {
    const totalRollbackAmount = Array.from(
        rollbackCalculations.values()
    ).reduce((sum, calc) => sum + calc.totalRollbackAmount, 0);

    const firstCalc = Array.from(rollbackCalculations.values())[0];

    return {
        success: true,
        data: {
            rolledBackAmount: totalRollbackAmount,
            finalBalance: firstCalc?.finalBalance || 0,
            affectedRewardLogIds: rewardLogs
                .map((log) => log.id)
                .filter((id) => id !== "direct-rollback"),
        },
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}

async function executeRollback(
    rollbackCalculations: Map<string, RollbackCalculation>,
    rewardLogs: RewardLogForRollback[],
    options: {
        deleteRewardLog: boolean;
        validateBalance: boolean;
        dryRun: boolean;
    },
    tx: typeof prisma,
    directRollback?: { playerId: string; assetId: string; amount: number }
) {
    return await tx.$transaction(async (innerTx) => {
        const updatePromises = Array.from(rollbackCalculations.values()).map(
            (calc) =>
                innerTx.playerAsset.update({
                    where: { id: calc.playerAsset.id },
                    data: { balance: calc.finalBalance },
                })
        );

        await Promise.all(updatePromises);

        // 🔄 로그 삭제 최적화
        if (options.deleteRewardLog && !directRollback) {
            const rewardLogIdsToDelete = rewardLogs
                .map((log) => log.id)
                .filter((id) => id !== "direct-rollback");

            if (rewardLogIdsToDelete.length > 0) {
                await innerTx.rewardsLog.deleteMany({
                    where: { id: { in: rewardLogIdsToDelete } },
                });
            }
        }

        const totalRollbackAmount = Array.from(
            rollbackCalculations.values()
        ).reduce((sum, calc) => sum + calc.totalRollbackAmount, 0);

        const firstCalc = Array.from(rollbackCalculations.values())[0];

        return {
            rolledBackAmount: totalRollbackAmount,
            finalBalance: firstCalc?.finalBalance || 0,
            affectedRewardLogIds: rewardLogs
                .map((log) => log.id)
                .filter((id) => id !== "direct-rollback"),
        };
    });
}

export interface RollbackPlayerAssetInput {
    rewardLogId?: string;
    questLogId?: string;
    pollLogId?: string;

    directRollback?: {
        playerId: string;
        assetId: string;
        amount: number;
    };

    options?: {
        deleteRewardLog?: boolean;
        validateBalance?: boolean;
        dryRun?: boolean;
    };

    trx?: any;
}

export interface RollbackPlayerAssetResult {
    success: boolean;
    data?: {
        rolledBackAmount: number;
        finalBalance: number;
        affectedRewardLogIds: string[];
    };
    error?: string;
    warnings?: string[];
}

export async function rollbackPlayerAsset(
    input: RollbackPlayerAssetInput
): Promise<RollbackPlayerAssetResult> {
    const tx = (input.trx || prisma) as typeof prisma;
    const options = {
        deleteRewardLog: input.options?.deleteRewardLog ?? true,
        validateBalance: input.options?.validateBalance ?? true,
        dryRun: input.options?.dryRun ?? false,
    };

    try {
        const warnings: string[] = [];

        // 🔄 Step 1: 롤백할 로그 조회 최적화
        const rewardLogsToRollback = await getRewardLogsToRollback(input, tx);

        if ("error" in rewardLogsToRollback) {
            return { success: false, error: rewardLogsToRollback.error };
        }

        if (rewardLogsToRollback.length === 0) {
            return {
                success: false,
                error: "No reward logs found to rollback",
            };
        }

        // 🔄 Step 2: 플레이어 자산 조회 최적화
        const playerAssets = await getPlayerAssetsForRollback(
            rewardLogsToRollback,
            tx
        );

        // 🔄 Step 3: 롤백 계산 최적화
        const rollbackCalculations = calculateRollbackAmounts(
            rewardLogsToRollback,
            playerAssets,
            warnings,
            input.directRollback
        );

        if (rollbackCalculations.size === 0) {
            return {
                success: false,
                error: "No valid player assets found for rollback",
                warnings: warnings.length > 0 ? warnings : undefined,
            };
        }

        // 🔄 Step 4: 잔액 검증
        if (options.validateBalance) {
            const validationError =
                validateRollbackBalances(rollbackCalculations);
            if (validationError) {
                return { success: false, error: validationError };
            }
        }

        // 🔄 Step 5: Dry run 처리
        if (options.dryRun) {
            return createDryRunResult(
                rollbackCalculations,
                rewardLogsToRollback,
                warnings
            );
        }

        // 🔄 Step 6: 실제 롤백 실행
        const result = await executeRollback(
            rollbackCalculations,
            rewardLogsToRollback,
            options,
            tx,
            input.directRollback
        );

        return {
            success: true,
            data: result,
            warnings: warnings.length > 0 ? warnings : undefined,
        };
    } catch (error) {
        console.error("Universal rollback failed:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Universal rollback failed",
        };
    }
}

export interface BatchUpdatePlayerAssetInput {
    txs: PlayerAssetTransactionInput[];
}

export interface BatchUpdatePlayerAssetResult {
    success: boolean;
    error?: string;
    processedCount?: number;
}

export async function batchUpdatePlayerAsset(
    inputs?: BatchUpdatePlayerAssetInput
): Promise<BatchUpdatePlayerAssetResult> {
    if (!inputs) {
        return {
            success: false,
            error: "No input",
        };
    }

    // 🔒 배치 처리를 트랜잭션으로 감싸서 원자성 보장
    try {
        await prisma.$transaction(async (tx) => {
            for (const input of inputs.txs) {
                const result = await updatePlayerAsset(
                    { transaction: input },
                    tx
                );
                if (!result.success) {
                    throw new Error(`Asset update failed: ${result.error}`);
                }
            }
        });

        return {
            success: true,
            processedCount: inputs.txs.length,
        };
    } catch (error) {
        console.error("Batch update failed:", error);
        return {
            success: false,
            error:
                error instanceof Error ? error.message : "Batch update failed",
        };
    }
}

export interface DeletePlayerAssetInput {
    playerId: string;
    assetId: string;
}

export async function deletePlayerAsset(
    input?: DeletePlayerAssetInput
): Promise<PlayerAssetResult<boolean>> {
    try {
        if (!input) {
            return {
                success: false,
                data: false,
                error: "No input",
            };
        }

        await prisma.playerAsset.update({
            where: {
                playerId_assetId: {
                    playerId: input.playerId,
                    assetId: input.assetId,
                },
            },
            data: {
                status: PlayerAssetStatus.DELETED,
            },
        });

        return {
            success: true,
            data: true,
        };
    } catch (error) {
        console.error(error);
        return {
            success: false,
            data: false,
            error: "Failed to delete player asset",
        };
    }
}

export async function updatePlayerAssetsOnAssetChange(
    event: AssetStatusChangeEvent
): Promise<PlayerAssetResult<void>> {
    try {
        const { assetId, newStatus } = event;

        const affectedPlayerAssets = await prisma.playerAsset.findMany({
            cacheStrategy: getCacheStrategy("realtime"),
            where: {
                assetId,
                status: PlayerAssetStatus.ACTIVE,
            },
            select: {
                id: true,
                playerId: true,
                assetId: true,
                balance: true,
                status: true,
                asset: {
                    select: {
                        id: true,
                        assetType: true,
                        isActive: true,
                    },
                },
            },
            take: 1000,
        });

        if (affectedPlayerAssets.length === 0) {
            return {
                success: true,
                data: undefined,
            };
        }

        await prisma.$transaction(async (tx) => {
            if (!newStatus.isActive) {
                // Asset이 비활성화된 경우
                await tx.playerAsset.updateMany({
                    where: { assetId },
                    data: {
                        status: PlayerAssetStatus.INACTIVE,
                    },
                });
            }

            // Asset 타입이 변경된 경우
            if (event.previousStatus.assetType !== newStatus.assetType) {
                await tx.playerAsset.updateMany({
                    where: { assetId },
                    data: {
                        status: PlayerAssetStatus.FROZEN,
                    },
                });
            }

            // 로그 기록
            for (const playerAsset of affectedPlayerAssets) {
                await tx.rewardsLog.create({
                    data: {
                        playerId: playerAsset.playerId,
                        assetId: playerAsset.assetId,
                        amount: 0,
                        balanceBefore: playerAsset.balance,
                        balanceAfter: playerAsset.balance,
                        reason: !newStatus.isActive
                            ? "Asset deactivated"
                            : "Asset type changed",
                    },
                    select: {
                        id: true,
                    },
                });
            }
        });

        return {
            success: true,
            data: undefined,
        };
    } catch (error) {
        console.error("Failed to update player assets on asset change:", error);
        return {
            success: false,
            data: undefined,
            error: "Failed to update player assets on asset change",
        };
    }
}

export interface ValidatePlayerAssetInput {
    playerId: string;
    assetId: string;
    requiredAmount?: number;
    requiredStatus?: PlayerAssetStatus;
}

export interface ValidatePlayerAssetResult {
    success: boolean;
    playerAsset: PlayerAsset | null;
    error?: string;
    isNew?: boolean;
}

export async function validatePlayerAsset(
    input?: ValidatePlayerAssetInput,
    externalTx?: any // Prisma v6 트랜잭션 타입 호환성을 위한 변경
): Promise<ValidatePlayerAssetResult> {
    if (!input) {
        return {
            success: false,
            playerAsset: null,
            error: "No input",
        };
    }

    try {
        const tx = (externalTx || prisma) as typeof prisma;
        const asset = await tx.asset.findUnique({
            cacheStrategy: getCacheStrategy("realtime"),
            where: { id: input.assetId },
        });

        if (!asset) {
            return {
                success: false,
                playerAsset: null,
                error: "Asset not found",
            };
        }

        if (!asset.isActive) {
            return {
                success: false,
                playerAsset: null,
                error: "Asset is not active",
            };
        }

        if (asset.assetType === "ONCHAIN" && !asset.contractAddress) {
            return {
                success: false,
                playerAsset: null,
                error: "Invalid ONCHAIN asset configuration",
            };
        }

        // 🎯 Performance optimization: Select only necessary fields to avoid overfetching
        // All fields are required as this returns a full PlayerAsset object and uses .id and .status
        const playerAsset = await tx.playerAsset.upsert({
            where: {
                playerId_assetId: {
                    playerId: input.playerId,
                    assetId: asset.id,
                },
            },
            create: {
                playerId: input.playerId,
                assetId: asset.id,
                balance: 0,
                status: "ACTIVE",
            },
            update: {},
            select: {
                id: true,
                playerId: true,
                assetId: true,
                balance: true,
                status: true,
                updatedAt: true,
            },
        });

        if (
            input.requiredStatus &&
            playerAsset.status !== input.requiredStatus
        ) {
            return {
                success: false,
                playerAsset,
                error: `Asset is ${playerAsset.status.toLowerCase()}`,
            };
        }

        if (
            input.requiredAmount &&
            playerAsset.balance < input.requiredAmount
        ) {
            return {
                success: false,
                playerAsset,
                isNew: !playerAsset.balance,
                error: "Insufficient balance",
            };
        }

        return {
            success: true,
            playerAsset,
            isNew: !playerAsset.balance,
        };
    } catch (error) {
        console.error("Failed to validate player asset:", error);
        return {
            success: false,
            playerAsset: null,
            error: "Failed to validate player asset",
        };
    }
}

export interface SetDefaultPlayerAssetInput {
    player: Player;
    trx?: any;
}

export async function setDefaultPlayerAsset(
    input?: SetDefaultPlayerAssetInput
): Promise<PlayerAssetResult<boolean>> {
    if (!input) {
        return {
            success: false,
            data: false,
            error: "No input provided",
        };
    }

    try {
        const tx = (input.trx || prisma) as typeof prisma;
        if (!input.player) {
            return {
                success: false,
                data: false,
                error: "Player not found",
            };
        }

        const defaultAssets = await tx.asset.findMany({
            cacheStrategy: getCacheStrategy("realtime"),
            where: {
                isDefault: true,
                isActive: true,
                NOT: {
                    playerAssets: {
                        some: {
                            playerId: input.player.id,
                        },
                    },
                },
            },
            select: {
                id: true,
            },
        });

        if (defaultAssets.length === 0) {
            return {
                success: true,
                data: true,
            };
        }

        await tx.playerAsset.createMany({
            data: defaultAssets.map(({ id }) => ({
                playerId: input.player.id,
                assetId: id,
                balance: 0,
                status: "ACTIVE",
            })),
            skipDuplicates: true,
        });

        return {
            success: true,
            data: true,
        };
    } catch (error) {
        console.error("Failed to set default player asset:", error);
        return {
            success: false,
            data: false,
            error: "Failed to set default player asset",
        };
    }
}

export interface GrantPlayerAssetInstancesInput {
    playerId: string;
    assetId?: string;
    asset?: Asset;
    amount: number;
    codePrefix?: string;
    source?: string;
    reason?: string;
    questId?: string;
    questLogId?: string;
    pollId?: string;
    pollLogId?: string;
    trx?: any;
}

export interface GrantPlayerAssetInstancesResult {
    success: boolean;
    data?: {
        assetInstances: AssetInstance[];
        playerAsset: PlayerAsset;
        rewardsLog: RewardsLog;
    };
    error?: string;
}

export async function grantPlayerAssetInstances(
    input: GrantPlayerAssetInstancesInput
): Promise<GrantPlayerAssetInstancesResult> {
    if (!input.playerId) {
        return { success: false, error: "Player ID is required" };
    }

    if (!input.assetId && !input.asset) {
        return {
            success: false,
            error: "Asset ID or asset object is required",
        };
    }

    if (!input.amount || input.amount <= 0) {
        return { success: false, error: "Amount must be greater than 0" };
    }

    if (input.amount > Number.MAX_SAFE_INTEGER) {
        return { success: false, error: "Amount exceeds maximum safe integer" };
    }

    const executeTransaction = async (tx: any) => {
        const asset =
            input.asset ||
            (await tx.asset.findUnique({
                where: { id: input.assetId, isActive: true },
            }));

        if (!asset) {
            throw new Error("Asset not found or not active");
        }

        if (!asset.isActive) {
            throw new Error("Asset is not active");
        }

        if (!asset.hasInstance) {
            throw new Error("Asset does not support instances");
        }

        const existingPlayerAsset = await tx.playerAsset.findUnique({
            where: {
                playerId_assetId: {
                    playerId: input.playerId,
                    assetId: asset.id,
                },
            },
            select: {
                balance: true,
            },
        });

        const balanceBefore = existingPlayerAsset?.balance || 0;

        // 🎯 Performance optimization: Select only necessary fields to avoid overfetching
        // All fields are required as this returns a full PlayerAsset object and uses .id and .status
        const playerAsset = await tx.playerAsset.upsert({
            where: {
                playerId_assetId: {
                    playerId: input.playerId,
                    assetId: asset.id,
                },
            },
            create: {
                playerId: input.playerId,
                assetId: asset.id,
                balance: 0,
                status: "ACTIVE",
            },
            update: {},
            select: {
                id: true,
                playerId: true,
                assetId: true,
                balance: true,
                status: true,
                updatedAt: true,
            },
        });

        if (playerAsset.status !== "ACTIVE") {
            throw new Error(
                `PlayerAsset is ${playerAsset.status.toLowerCase()}`
            );
        }

        const instanceResult = await createAssetInstance({
            asset,
            amount: input.amount,
            playerId: input.playerId,
            playerAssetId: playerAsset.id,
            codePrefix: input.codePrefix,
            source: input.source || "grant",
            trx: tx,
        });

        if (!instanceResult.success || !instanceResult.data) {
            throw new Error(
                instanceResult.error || "Failed to create asset instances"
            );
        }

        const updatedPlayerAsset = await tx.playerAsset.update({
            where: { id: playerAsset.id },
            data: {
                balance: { increment: input.amount },
            },
        });

        const rewardsLog = await tx.rewardsLog.create({
            data: {
                playerId: input.playerId,
                assetId: asset.id,
                amount: input.amount,
                balanceBefore: balanceBefore,
                balanceAfter: balanceBefore + input.amount,
                reason:
                    input.reason || `Asset instances granted: ${input.amount}`,
                questId: input.questId,
                questLogId: input.questLogId,
                pollId: input.pollId,
                pollLogId: input.pollLogId,
            },
            select: {
                id: true,
                playerId: true,
                assetId: true,
                amount: true,
                balanceBefore: true,
                balanceAfter: true,
                reason: true,
                createdAt: true,
                questId: true,
                questLogId: true,
                pollId: true,
                pollLogId: true,
            },
        });

        return {
            assetInstances: instanceResult.data,
            playerAsset: updatedPlayerAsset,
            rewardsLog,
        };
    };

    try {
        const result = input.trx
            ? await executeTransaction(input.trx)
            : await prisma.$transaction(executeTransaction);

        return { success: true, data: result };
    } catch (error) {
        console.error("Failed to grant asset instances:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to grant asset instances",
        };
    }
}

export interface WithdrawPlayerAssetInstancesInput {
    playerId: string;
    assetId?: string;
    asset?: Asset;
    amount: number;
    withdrawalType:
        | "USED"
        | "EXPIRED"
        | "CANCELLED"
        | "DESTROYED"
        | "EXCHANGED";
    reason?: string;
    usedFor?: string;
    usedLocation?: string;
    usedBy?: string;
    questId?: string;
    questLogId?: string;
    pollId?: string;
    pollLogId?: string;
    instanceIds?: string[]; // 특정 인스턴스들만 회수할 경우
    trx?: any;
}

export interface WithdrawPlayerAssetInstancesResult {
    success: boolean;
    data?: {
        withdrawnInstances: AssetInstance[];
        playerAsset: PlayerAsset;
        rewardsLog: RewardsLog;
    };
    error?: string;
}

export async function withdrawPlayerAssetInstances(
    input: WithdrawPlayerAssetInstancesInput
): Promise<WithdrawPlayerAssetInstancesResult> {
    if (!input.playerId) {
        return { success: false, error: "Player ID is required" };
    }

    if (!input.assetId && !input.asset) {
        return {
            success: false,
            error: "Asset ID or asset object is required",
        };
    }

    if (!input.amount || input.amount <= 0) {
        return { success: false, error: "Amount must be greater than 0" };
    }

    if (input.amount > Number.MAX_SAFE_INTEGER) {
        return { success: false, error: "Amount exceeds maximum safe integer" };
    }

    const executeTransaction = async (tx: any) => {
        const asset =
            input.asset ||
            (await tx.asset.findUnique({
                cacheStrategy: getCacheStrategy("realtime"),
                where: { id: input.assetId, isActive: true },
            }));

        if (!asset) {
            throw new Error("Asset not found or not active");
        }

        if (!asset.hasInstance) {
            throw new Error("Asset does not support instances");
        }

        // 🔍 PlayerAsset 확인
        const playerAsset = await tx.playerAsset.findUnique({
            cacheStrategy: getCacheStrategy("realtime"),
            where: {
                playerId_assetId: {
                    playerId: input.playerId,
                    assetId: asset.id,
                },
            },
            select: {
                id: true,
                balance: true,
                status: true,
            },
        });

        if (!playerAsset) {
            throw new Error("PlayerAsset not found");
        }

        if (playerAsset.status !== "ACTIVE") {
            throw new Error(
                `PlayerAsset is ${playerAsset.status.toLowerCase()}`
            );
        }

        if (playerAsset.balance < input.amount) {
            throw new Error(
                `Insufficient balance. Current: ${playerAsset.balance}, Required: ${input.amount}`
            );
        }

        // 🔍 회수할 AssetInstance 조회
        const whereCondition: any = {
            assetId: asset.id,
            playerId: input.playerId,
            status: {
                in: ["RECEIVED", "PENDING"], // 회수 가능한 상태만
            },
        };

        // 특정 인스턴스들만 회수하는 경우
        if (input.instanceIds && input.instanceIds.length > 0) {
            whereCondition.id = { in: input.instanceIds };
        }

        const availableInstances = await tx.assetInstance.findMany({
            cacheStrategy: getCacheStrategy("realtime"),
            where: whereCondition,
            take: input.amount,
            orderBy: [
                { expiresAt: "asc" }, // 만료일이 빠른 것부터 (FIFO)
                { createdAt: "asc" },
            ],
        });

        if (availableInstances.length < input.amount) {
            throw new Error(
                `Not enough available instances. Available: ${availableInstances.length}, Required: ${input.amount}`
            );
        }

        const instanceIds = availableInstances.map(
            (instance: AssetInstance) => instance.id
        );
        const balanceBefore = playerAsset.balance;

        // 🔄 AssetInstance 상태 업데이트
        const updateData: any = {
            status: input.withdrawalType,
            updatedAt: new Date(),
        };

        if (input.withdrawalType === "USED") {
            updateData.usedAt = new Date();
            updateData.usedBy = input.usedBy || input.playerId;
            updateData.usedFor = input.usedFor;
            updateData.usedLocation = input.usedLocation;
        }

        await tx.assetInstance.updateMany({
            where: { id: { in: instanceIds } },
            data: updateData,
        });

        // 🔄 PlayerAsset 잔액 감소
        const updatedPlayerAsset = await tx.playerAsset.update({
            where: { id: playerAsset.id },
            data: {
                balance: { decrement: input.amount },
            },
        });

        // 🔄 RewardsLog 생성 (음수 amount로 소비 기록)
        const rewardsLog = await tx.rewardsLog.create({
            data: {
                playerId: input.playerId,
                assetId: asset.id,
                amount: -input.amount, // 음수로 소비 표시
                balanceBefore: balanceBefore,
                balanceAfter: balanceBefore - input.amount,
                reason:
                    input.reason ||
                    `Asset instances ${input.withdrawalType.toLowerCase()}: ${
                        input.amount
                    }`,
                questId: input.questId,
                questLogId: input.questLogId,
                pollId: input.pollId,
                pollLogId: input.pollLogId,
            },
            select: {
                id: true,
                playerId: true,
                assetId: true,
                amount: true,
                balanceBefore: true,
                balanceAfter: true,
                reason: true,
                createdAt: true,
                questId: true,
                questLogId: true,
                pollId: true,
                pollLogId: true,
            },
        });

        // 🔄 업데이트된 AssetInstance 조회
        const withdrawnInstances = await tx.assetInstance.findMany({
            cacheStrategy: getCacheStrategy("realtime"),
            where: { id: { in: instanceIds } },
            select: {
                id: true,
                code: true,
                serialNumber: true,
                assetId: true,
                playerId: true,
                playerAssetId: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                expiresAt: true,
                usedAt: true,
                usedBy: true,
                usedFor: true,
                usedLocation: true,
                asset: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        assetType: true,
                        isActive: true,
                        hasInstance: true,
                        imageUrl: true,
                    },
                },
                player: {
                    select: {
                        id: true,
                        userId: true,
                        artistId: true,
                    },
                },
                playerAsset: {
                    select: {
                        id: true,
                        balance: true,
                        status: true,
                    },
                },
            },
        });

        return {
            withdrawnInstances,
            playerAsset: updatedPlayerAsset,
            rewardsLog,
        };
    };

    try {
        const result = input.trx
            ? await executeTransaction(input.trx)
            : await prisma.$transaction(executeTransaction);

        return { success: true, data: result };
    } catch (error) {
        console.error("Failed to withdraw asset instances:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to withdraw asset instances",
        };
    }
}

export interface AutoExpirePlayerAssetInstancesInput {
    batchSize?: number; // 한 번에 처리할 최대 인스턴스 수
    dryRun?: boolean; // 실제 처리하지 않고 결과만 확인
    trx?: any;
}

export interface AutoExpirePlayerAssetInstancesResult {
    success: boolean;
    data?: {
        expiredCount: number;
        affectedPlayers: string[];
        processedInstanceIds: string[];
    };
    error?: string;
}

export async function autoExpirePlayerAssetInstances(
    input?: AutoExpirePlayerAssetInstancesInput
): Promise<AutoExpirePlayerAssetInstancesResult> {
    const batchSize = input?.batchSize || 1000;
    const dryRun = input?.dryRun || false;

    const executeTransaction = async (tx: any) => {
        const now = new Date();

        // 🔍 만료된 AssetInstance 조회
        const expiredInstances = await tx.assetInstance.findMany({
            cacheStrategy: getCacheStrategy("realtime"),
            where: {
                status: {
                    in: ["RECEIVED", "PENDING"], // 활성 상태인 것만
                },
                expiresAt: {
                    lte: now, // 현재 시간보다 이전에 만료
                },
            },
            take: batchSize,
            select: {
                id: true,
                assetId: true,
                playerId: true,
                playerAssetId: true,
                expiresAt: true,
            },
            orderBy: {
                expiresAt: "asc", // 가장 오래된 것부터 처리
            },
        });

        if (expiredInstances.length === 0) {
            return {
                expiredCount: 0,
                affectedPlayers: [],
                processedInstanceIds: [],
            };
        }

        if (dryRun) {
            const affectedPlayers = [
                ...new Set(
                    expiredInstances.map(
                        (instance: AssetInstance) => instance.playerId
                    )
                ),
            ].filter((id): id is string => id !== null);

            return {
                expiredCount: expiredInstances.length,
                affectedPlayers,
                processedInstanceIds: expiredInstances.map(
                    (instance: AssetInstance) => instance.id
                ),
            };
        }

        // 🔄 플레이어별로 그룹화하여 잔액 업데이트
        const playerAssetUpdates = new Map<
            string,
            {
                playerAssetId: string;
                amount: number;
                assetId: string;
                playerId: string;
            }
        >();

        for (const instance of expiredInstances) {
            if (!instance.playerAssetId || !instance.playerId) continue;

            const key = instance.playerAssetId;
            const existing = playerAssetUpdates.get(key);

            if (existing) {
                existing.amount += 1;
            } else {
                playerAssetUpdates.set(key, {
                    playerAssetId: instance.playerAssetId,
                    amount: 1,
                    assetId: instance.assetId,
                    playerId: instance.playerId,
                });
            }
        }

        // 🔄 AssetInstance 상태를 EXPIRED로 변경
        await tx.assetInstance.updateMany({
            where: {
                id: {
                    in: expiredInstances.map(
                        (instance: AssetInstance) => instance.id
                    ),
                },
            },
            data: {
                status: "EXPIRED",
                updatedAt: now,
            },
        });

        // 🔄 PlayerAsset 잔액 감소 및 RewardsLog 생성
        for (const update of playerAssetUpdates.values()) {
            // PlayerAsset 잔액 감소
            const playerAssetBefore = await tx.playerAsset.findUnique({
                cacheStrategy: getCacheStrategy("realtime"),
                where: { id: update.playerAssetId },
                select: {
                    balance: true,
                },
            });

            if (
                playerAssetBefore &&
                playerAssetBefore.balance >= update.amount
            ) {
                await tx.playerAsset.update({
                    where: { id: update.playerAssetId },
                    data: {
                        balance: { decrement: update.amount },
                    },
                });

                // RewardsLog 생성
                await tx.rewardsLog.create({
                    data: {
                        playerId: update.playerId,
                        assetId: update.assetId,
                        amount: -update.amount, // 음수로 만료 표시
                        balanceBefore: playerAssetBefore.balance,
                        balanceAfter: playerAssetBefore.balance - update.amount,
                        reason: `Asset instances auto-expired: ${update.amount}`,
                    },
                    select: {
                        id: true,
                    },
                });
            }
        }

        const affectedPlayers = [
            ...new Set(
                Array.from(playerAssetUpdates.values()).map(
                    (update) => update.playerId
                )
            ),
        ];

        return {
            expiredCount: expiredInstances.length,
            affectedPlayers,
            processedInstanceIds: expiredInstances.map(
                (instance: AssetInstance) => instance.id
            ),
        };
    };

    try {
        const result = input?.trx
            ? await executeTransaction(input.trx)
            : await prisma.$transaction(executeTransaction);

        return { success: true, data: result };
    } catch (error) {
        console.error("Failed to auto-expire asset instances:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to auto-expire asset instances",
        };
    }
}

export interface GetPlayerAssetInstancesInput {
    playerId: string;
    assetId?: string;
    assetIds?: string[];
    status?: AssetInstanceStatus;
    statuses?: AssetInstanceStatus[];
    includeExpired?: boolean;
    includeUsed?: boolean;
    search?: string;
    pagination?: {
        page: number;
        limit: number;
    };
}

export type AssetInstanceWithRelations = {
    id: string;
    code: string;
    serialNumber: string | null;
    assetId: string;
    playerId: string | null;
    playerAssetId: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date | null;
    usedAt: Date | null;
    usedBy: string | null;
    usedFor: string | null;
    usedLocation: string | null;
    asset: {
        id: string;
        name: string;
        description: string | null;
        assetType: string;
        isActive: boolean;
        hasInstance: boolean;
        imageUrl: string | null;
    };
    player: {
        id: string;
        userId: string;
        artistId: string | null;
    } | null;
    playerAsset: {
        id: string;
        balance: number;
        status: string;
    } | null;
};

export interface GetPlayerAssetInstancesResult {
    success: boolean;
    data?: {
        instances: AssetInstanceWithRelations[];
        totalCount: number;
        currentPage: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
    error?: string;
}

export async function getPlayerAssetInstances(
    input?: GetPlayerAssetInstancesInput
): Promise<GetPlayerAssetInstancesResult> {
    if (!input) {
        return {
            success: false,
            error: "Input is required",
        };
    }

    try {
        const page = input.pagination?.page || 1;
        const limit = input.pagination?.limit || 50;
        const offset = (page - 1) * limit;

        const where: Prisma.AssetInstanceWhereInput = {
            playerId: input.playerId,
        };

        // 🔍 자산 ID 필터
        if (input.assetId) {
            where.assetId = input.assetId;
        } else if (input.assetIds && input.assetIds.length > 0) {
            where.assetId = { in: input.assetIds };
        }

        // 🔍 상태 필터
        if (input.status) {
            where.status = input.status;
        } else if (input.statuses && input.statuses.length > 0) {
            where.status = { in: input.statuses };
        } else {
            // 기본적으로 활성 상태만 조회
            const defaultStatuses: AssetInstanceStatus[] = [
                "PENDING",
                "RECEIVED",
            ];

            if (input.includeExpired) {
                defaultStatuses.push("EXPIRED");
            }

            if (input.includeUsed) {
                defaultStatuses.push("USED");
            }

            where.status = { in: defaultStatuses };
        }

        // 🔍 검색 조건 (코드 또는 시리얼 번호)
        if (input.search) {
            where.OR = [
                {
                    code: {
                        contains: input.search,
                        mode: "insensitive",
                    },
                },
                {
                    serialNumber: {
                        contains: input.search,
                        mode: "insensitive",
                    },
                },
            ];
        }

        // 🔍 데이터 조회
        const [instances, totalCount] = await Promise.all([
            prisma.assetInstance.findMany({
                cacheStrategy: getCacheStrategy("realtime"),
                where,
                select: {
                    id: true,
                    code: true,
                    serialNumber: true,
                    assetId: true,
                    playerId: true,
                    playerAssetId: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                    expiresAt: true,
                    usedAt: true,
                    usedBy: true,
                    usedFor: true,
                    usedLocation: true,
                    asset: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            assetType: true,
                            isActive: true,
                            hasInstance: true,
                            imageUrl: true,
                        },
                    },
                    player: {
                        select: {
                            id: true,
                            userId: true,
                            artistId: true,
                        },
                    },
                    playerAsset: {
                        select: {
                            id: true,
                            balance: true,
                            status: true,
                        },
                    },
                },
                orderBy: [{ createdAt: "desc" }, { id: "asc" }],
                skip: offset,
                take: limit,
            }),
            prisma.assetInstance.count({
                cacheStrategy: getCacheStrategy("realtime"),
                where,
            }),
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return {
            success: true,
            data: {
                instances: instances as any as AssetInstanceWithRelations[],
                totalCount,
                currentPage: page,
                totalPages,
                hasNext: page < totalPages,
                hasPrevious: page > 1,
            },
        };
    } catch (error) {
        console.error("Failed to get player asset instances:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to get player asset instances",
        };
    }
}
