/// app/actions/playerAssets.ts

"use server";

import { PlayerAssetStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma/client";

import type { AssetStatusChangeEvent } from "./assets";
import type {
    Prisma,
    PlayerAsset,
    AssetType,
    Player,
    Asset,
} from "@prisma/client";

export interface PlayerAssetResult<T> {
    success: boolean;
    data: T;
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
}

export interface GetPlayerAssetsInput {
    filter: GetPlayerAssetsFilter;
}

export type PlayerAssetWithAsset = PlayerAsset & {
    asset: Asset;
};

export async function getPlayerAssets(
    input?: GetPlayerAssetsInput
): Promise<PlayerAssetResult<PlayerAssetWithAsset[]>> {
    if (!input) {
        return {
            success: false,
            data: [],
            error: "No input",
        };
    }

    const where: Prisma.PlayerAssetWhereInput = {};
    const assetWhere: Prisma.AssetWhereInput = {};

    if (input?.filter.playerId) {
        where.playerId = input.filter.playerId;
    }

    if (input?.filter.assetId) {
        where.assetId = input.filter.assetId;
    }

    if (input?.filter.assetIds && input.filter.assetIds.length > 0) {
        where.assetId = { in: input.filter.assetIds };
    }

    if (input?.filter.assetType) {
        assetWhere.assetType = input.filter.assetType;
    }

    if (input?.filter.isActive !== undefined) {
        assetWhere.isActive = input.filter.isActive;
    }

    if (Object.keys(assetWhere).length > 0) {
        where.asset = assetWhere;
    }

    const playerAssets = await prisma.playerAsset.findMany({
        where,
        include: {
            asset: true,
            player: true,
        },
    });

    return {
        success: true,
        data: playerAssets as PlayerAssetWithAsset[],
    };
}

export interface GetPlayerAssetInput {
    playerId: string;
    assetId: string;
}

export async function getPlayerAsset(
    input?: GetPlayerAssetInput
): Promise<PlayerAssetResult<PlayerAsset | null>> {
    if (!input) {
        return {
            success: false,
            data: null,
            error: "No input",
        };
    }

    const playerAsset = await prisma.playerAsset.findUnique({
        where: {
            playerId_assetId: {
                playerId: input.playerId,
                assetId: input.assetId,
            },
        },
        include: {
            asset: true,
            player: true,
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
): Promise<PlayerAssetResult<PlayerAsset | null>> {
    if (!input) {
        return {
            success: false,
            data: null,
            error: "No input",
        };
    }

    if (input.transaction.amount < 0) {
        return {
            success: false,
            data: null,
            error: "Amount cannot be negative",
        };
    }

    // 🔒 Integer overflow 방지 (JavaScript Number.MAX_SAFE_INTEGER)
    if (input.transaction.amount > Number.MAX_SAFE_INTEGER) {
        return {
            success: false,
            data: null,
            error: "Amount exceeds maximum safe integer",
        };
    }

    const tx = (trx || prisma) as typeof prisma;
    const playerAsset = await tx.playerAsset.findUnique({
        where: {
            playerId_assetId: {
                playerId: input.transaction.playerId,
                assetId: input.transaction.assetId,
            },
        },
    });

    if (playerAsset) {
        switch (playerAsset.status) {
            case PlayerAssetStatus.INACTIVE:
                return {
                    success: false,
                    data: null,
                    error: "Asset is inactive",
                };
            case PlayerAssetStatus.FROZEN:
                return { success: false, data: null, error: "Asset is frozen" };
            case PlayerAssetStatus.DELETED:
                return {
                    success: false,
                    data: null,
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
                    data: null,
                    error: "Balance overflow detected",
                };
            }
            break;
        case "SUBTRACT":
            newBalance = oldBalance - input.transaction.amount;
            if (newBalance < 0) {
                return {
                    success: false,
                    data: null,
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
                    data: null,
                    error: "Balance exceeds maximum safe integer",
                };
            }
            break;
    }

    const updatedAsset = await tx.playerAsset.upsert({
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
        });
    }

    return { success: true, data: updatedAsset };
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

export async function batchUpdatePlayerAsset(
    inputs?: BatchUpdatePlayerAssetInput
): Promise<
    PlayerAssetResult<{
        results: PlayerAsset[];
        failed: PlayerAssetTransactionInput[];
    }>
> {
    if (!inputs) {
        return {
            success: false,
            data: {
                results: [],
                failed: [],
            },
            error: "No input",
        };
    }

    // 🔒 배치 처리를 트랜잭션으로 감싸서 원자성 보장
    try {
        const result = await prisma.$transaction(async (tx) => {
            const results: PlayerAsset[] = [];
            const failed: PlayerAssetTransactionInput[] = [];

            for (const input of inputs.txs) {
                try {
                    const result = await updatePlayerAsset(
                        { transaction: input },
                        tx
                    );
                    if (result.success && result.data) {
                        results.push(result.data);
                    } else {
                        failed.push(input);
                        // 🔒 배치 처리에서 하나라도 실패하면 전체 롤백
                        throw new Error(`Asset update failed: ${result.error}`);
                    }
                } catch (error) {
                    failed.push(input);
                    throw error; // 트랜잭션 롤백을 위해 에러를 다시 던짐
                }
            }

            return { results, failed };
        });

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        console.error("Batch update failed:", error);
        return {
            success: false,
            data: {
                results: [],
                failed: inputs.txs, // 모든 트랜잭션이 실패로 처리
            },
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
            where: {
                assetId,
                status: PlayerAssetStatus.ACTIVE,
            },
            include: { asset: true },
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

        const playerAsset = await tx.playerAsset.upsert({
            where: {
                playerId_assetId: {
                    playerId: input.playerId,
                    assetId: input.assetId,
                },
            },
            create: {
                playerId: input.playerId,
                assetId: input.assetId,
                balance: 0,
                status: PlayerAssetStatus.ACTIVE,
            },
            update: {},
            include: {
                asset: true,
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
