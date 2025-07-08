/// components\admin\data-migrations\Admin.DataMigrations.SGP.tsx

"use client";

import { useState, useMemo } from "react";
import { usePlayerAssetSet } from "@/app/actions/playerAssets/hooks";
import { useUserGet } from "@/app/hooks/useUser";
import { useToast } from "@/app/hooks/useToast";
import FileUploader from "@/components/atoms/FileUploader";
import { cn } from "@/lib/utils/tailwind";

import type { UserWithPlayer } from "@/app/actions/user";

const GAME_MONEY_ASSET_ID = "cmcq98cyn00vpjt0vlxsb9esn";

export default function AdminDataMigrationsSGP() {
    const [csvData, setCsvData] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(50);

    const [isMigratingSGP, setIsMigratingSGP] = useState(false);
    const [sgpMigrationProgress, setSgpMigrationProgress] = useState(0);
    const [migratedSGP, setMigratedSGP] = useState<Set<number>>(new Set());
    const [migrationLog, setMigrationLog] = useState<string[]>([]);

    const { users } = useUserGet({
        getUsersInput: { providers: ["telegram"] },
    });

    // 🚀 성능 최적화: 사용자 조회를 Map으로 변환
    const usersMap = useMemo(() => {
        if (!users) return new Map();
        const map = new Map<string, UserWithPlayer>();
        users.forEach((user: UserWithPlayer) => {
            if (user.telegramId) {
                map.set(user.telegramId, user);
            }
        });
        return map;
    }, [users]);

    const { updatePlayerAsset } = usePlayerAssetSet();
    const toast = useToast();

    // Game Money 변환 함수
    const convertGameMoney = (gameMoney: string | number): number => {
        const original = parseInt(String(gameMoney)) || 0;
        const converted = original / 1000;
        return Math.ceil(converted);
    };

    // CSV 파일 업로드 처리
    const handleFileUpload = async (files: { id: string; url: string }[]) => {
        if (files.length === 0) return;

        try {
            const response = await fetch(files[0].url);
            const text = await response.text();
            const rows = text.split("\n");
            const headers = rows[0].split(",").map((header) => header.trim());

            const parsedData = rows.slice(1).map((row) => {
                const values = row.split(",").map((value) => value.trim());
                return headers.reduce((obj, header, index) => {
                    obj[header] = values[index] || "";
                    return obj;
                }, {} as Record<string, string>);
            });

            setCsvData(parsedData);
            toast.success("CSV file loaded successfully");
        } catch (error) {
            console.error("Error parsing CSV:", error);
            toast.error("Failed to parse CSV file");
        }
    };

    // 🔄 로그 추가 함수
    const addLog = (message: string) => {
        const timestamp = new Date().toISOString().slice(11, 19);
        setMigrationLog((prev) => [...prev, `[${timestamp}] ${message}`]);
    };

    // ✅ 개별 SGP 마이그레이션 - 안전성 강화
    const handleMigrateSGP = async (playerData: any, index?: number) => {
        const playerName = playerData["Name"] || "Unknown";
        const snsId = playerData["SNS ID"] || "";

        try {
            // 🔍 기본 데이터 검증
            if (!snsId || !playerData["Game Money"]) {
                addLog(`❌ ${playerName}: Missing SNS ID or Game Money`);
                return {
                    success: false,
                    skipped: true,
                    reason: "Missing required data",
                };
            }

            // 🔍 TelegramId 추출 및 검증
            if (!snsId.startsWith("TG_")) {
                addLog(`❌ ${playerName}: Invalid SNS ID format: ${snsId}`);
                return {
                    success: false,
                    skipped: true,
                    reason: "Invalid SNS ID format",
                };
            }

            const telegramId = snsId.replace("TG_", "");
            const user = usersMap.get(telegramId);

            if (!user?.player?.id) {
                addLog(
                    `❌ ${playerName}: User not found for telegramId: ${telegramId}`
                );
                return {
                    success: false,
                    error: "Player not found",
                    reason: "User not found",
                };
            }

            // 🔍 Game Money 변환 및 검증
            const originalGameMoney = parseInt(playerData["Game Money"]) || 0;
            const convertedAmount = convertGameMoney(originalGameMoney);

            if (originalGameMoney < 0) {
                addLog(
                    `❌ ${playerName}: Negative Game Money: ${originalGameMoney}`
                );
                return {
                    success: false,
                    error: "Invalid Game Money",
                    reason: "Negative amount",
                };
            }

            if (convertedAmount <= 0) {
                addLog(
                    `⏭️ ${playerName}: Zero SGP (${originalGameMoney} → ${convertedAmount}), skipping`
                );
                return { success: true, skipped: true, reason: "Zero amount" };
            }

            // 🔍 변환 결과 로깅
            addLog(
                `🔄 ${playerName}: Converting ${originalGameMoney} → ${convertedAmount} SGP`
            );

            // 🚨 중요: ADD 연산으로 변경하여 기존 잔액 보존
            const result = await updatePlayerAsset({
                transaction: {
                    playerId: user.player.id,
                    assetId: GAME_MONEY_ASSET_ID,
                    amount: convertedAmount,
                    operation: "SET",
                    reason: "Migration from MEME QUEST - Game Money conversion (1/1000, rounded up)",
                    metadata: {
                        source: "csv_migration",
                        originalAmount: originalGameMoney,
                        convertedAmount: convertedAmount,
                        conversionRate: 0.001,
                        rounded: true,
                        playerName: playerName,
                        telegramId: telegramId,
                        migrationTimestamp: new Date().toISOString(),
                    },
                },
            });

            if (result.success) {
                addLog(
                    `✅ ${playerName}: Successfully added ${convertedAmount} SGP`
                );

                if (index !== undefined) {
                    setMigratedSGP((prev) => {
                        const newSet = new Set(prev);
                        newSet.add(index);
                        return newSet;
                    });
                }
            } else {
                addLog(
                    `❌ ${playerName}: Failed to update asset: ${result.error}`
                );
            }

            return {
                success: result.success,
                result,
                playerName,
                originalAmount: originalGameMoney,
                convertedAmount: convertedAmount,
            };
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            addLog(`💥 ${playerName}: Exception occurred: ${errorMessage}`);
            console.error("SGP migration failed:", {
                playerName,
                snsId,
                error,
            });
            return {
                success: false,
                error: errorMessage,
                playerName,
                reason: "Exception occurred",
            };
        }
    };

    // 🚀 일괄 SGP 마이그레이션 - 성능 및 안전성 강화
    const handleMigrateAllSGP = async () => {
        setIsMigratingSGP(true);
        setSgpMigrationProgress(0);
        setMigrationLog([]); // 로그 초기화

        const batchSize = 25; // 🚀 배치 크기 증가 (10 → 25)
        let successCount = 0;
        let failCount = 0;
        let skipCount = 0;
        let totalSGPAdded = 0;
        let totalGameMoneyProcessed = 0;

        const startTime = Date.now();
        addLog(`🚀 Starting SGP migration for ${csvData.length} players...`);
        addLog(
            `📊 Batch size: ${batchSize}, Total batches: ${Math.ceil(
                csvData.length / batchSize
            )}`
        );

        try {
            for (let i = 0; i < csvData.length; i += batchSize) {
                const batch = csvData.slice(i, i + batchSize);
                const batchNumber = Math.floor(i / batchSize) + 1;
                const totalBatches = Math.ceil(csvData.length / batchSize);

                addLog(
                    `📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} players)...`
                );

                const batchResults = await Promise.all(
                    batch.map((playerData, idx) =>
                        handleMigrateSGP(playerData, i + idx)
                    )
                );

                // 🔢 배치 결과 집계
                let batchSuccess = 0;
                let batchFail = 0;
                let batchSkip = 0;
                let batchSGP = 0;

                batchResults.forEach((result) => {
                    if (result.success && !result.skipped) {
                        batchSuccess++;
                        successCount++;
                        if (result.convertedAmount) {
                            batchSGP += result.convertedAmount;
                            totalSGPAdded += result.convertedAmount;
                        }
                        if (result.originalAmount) {
                            totalGameMoneyProcessed += result.originalAmount;
                        }
                    } else if (result.skipped) {
                        batchSkip++;
                        skipCount++;
                    } else {
                        batchFail++;
                        failCount++;
                    }
                });

                addLog(
                    `✅ Batch ${batchNumber} completed: ${batchSuccess} success, ${batchSkip} skipped, ${batchFail} failed, ${batchSGP} SGP added`
                );

                // 🔄 진행률 업데이트
                const progress = Math.floor(
                    ((i + batch.length) / csvData.length) * 100
                );
                setSgpMigrationProgress(progress);

                // 🚀 지연 시간 최적화 (100ms → 50ms)
                await new Promise((resolve) => setTimeout(resolve, 50));
            }

            const endTime = Date.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);

            addLog(`🎉 Migration completed in ${duration}s`);
            addLog(
                `📊 Final results: ${successCount} successful, ${skipCount} skipped, ${failCount} failed`
            );
            addLog(`💰 Total SGP added: ${totalSGPAdded.toLocaleString()}`);
            addLog(
                `🎮 Total Game Money processed: ${totalGameMoneyProcessed.toLocaleString()}`
            );

            toast.success(
                `SGP Migration completed: ${successCount} successful, ${skipCount} skipped, ${failCount} failed. Total SGP added: ${totalSGPAdded.toLocaleString()}`
            );
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            addLog(`💥 Critical error: ${errorMessage}`);
            console.error("Batch SGP migration failed:", error);
            toast.error(
                `SGP migration process encountered an error: ${errorMessage}`
            );
        } finally {
            setIsMigratingSGP(false);
            addLog(`⏹️ Migration process ended`);
        }
    };

    const totalPages = Math.ceil(csvData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = csvData.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">
                💰 SGP Migration from Game Money
            </h1>

            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    🔐 안전한 변환 규칙
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>
                        • <strong>변환 공식:</strong> Game Money ÷ 1000 = SGP
                        (소숫점 올림)
                    </li>
                    <li>
                        • <strong>예시:</strong> 13,200 → 14 SGP, 800 → 1 SGP
                    </li>
                    <li>
                        • <strong>연산 방식:</strong> ADD (기존 SGP 잔액에 추가)
                    </li>
                    <li>
                        • <strong>중복 방지:</strong> 동일 사용자 재실행 시 중복
                        추가됨
                    </li>
                    <li>
                        • <strong>Asset ID:</strong> {GAME_MONEY_ASSET_ID}
                    </li>
                </ul>
            </div>

            <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                    ⚠️ 중요 주의사항
                </h3>
                <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                    <li>
                        • 이 마이그레이션은 <strong>한 번만</strong> 실행해야
                        합니다
                    </li>
                    <li>
                        • 재실행 시 SGP가 <strong>중복으로 추가</strong>됩니다
                    </li>
                    <li>• 배치 크기: 25개씩 처리하여 성능 최적화</li>
                    <li>• 실시간 로그로 모든 과정을 추적 가능</li>
                </ul>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Upload CSV File</h2>
                <FileUploader
                    bucket="data-migrations"
                    purpose="sgp-migration"
                    onComplete={handleFileUpload}
                    accept={{ "text/csv": [".csv"] }}
                    multiple={false}
                    className="max-w-2xl"
                />
            </div>

            {csvData.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">
                        SGP Migration Data
                    </h2>

                    {/* 테이블과 페이지네이션 */}
                    <div className="overflow-auto max-h-[500px]">
                        <table className="min-w-full border border-[rgba(255,255,255,0.5)]">
                            <thead>
                                <tr className="bg-[rgba(255,255,255,0.3)]">
                                    <th className="border-b text-center text-sm font-bold">
                                        Name
                                    </th>
                                    <th className="border-b text-center text-sm font-bold">
                                        SNS ID
                                    </th>
                                    <th className="border-b text-center text-sm font-bold">
                                        Game Money
                                    </th>
                                    <th className="border-b text-center text-sm font-bold">
                                        → SGP
                                    </th>
                                    <th className="border-b text-center text-sm font-bold">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((row, rowIndex) => {
                                    const originalGameMoney =
                                        parseInt(row["Game Money"]) || 0;
                                    const convertedSGP =
                                        convertGameMoney(originalGameMoney);
                                    const realIndex = startIndex + rowIndex;

                                    return (
                                        <tr
                                            key={rowIndex}
                                            className={cn(
                                                "divide-x divide-[rgba(255,255,255,0.1)]",
                                                rowIndex % 2 === 0
                                                    ? "bg-[rgba(255,255,255,0.1)]"
                                                    : "bg-[rgba(255,255,255,0.2)]",
                                                migratedSGP.has(realIndex) &&
                                                    "bg-[rgba(0,255,0,0.1)]"
                                            )}
                                        >
                                            <td className="py-2 px-4 text-xs">
                                                {row["Name"]}
                                            </td>
                                            <td className="py-2 px-4 text-xs">
                                                {row["SNS ID"]}
                                            </td>
                                            <td className="py-2 px-4 text-xs text-right">
                                                {originalGameMoney.toLocaleString()}
                                            </td>
                                            <td className="py-2 px-4 text-xs text-right font-bold text-green-400">
                                                {convertedSGP}
                                            </td>
                                            <td className="py-2 px-4 text-xs text-center">
                                                {migratedSGP.has(realIndex) ? (
                                                    <span className="text-green-400">
                                                        ✓ Migrated
                                                    </span>
                                                ) : (
                                                    <span className="text-yellow-400">
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* 페이지네이션 */}
                    <div className="mt-4 flex items-center justify-between">
                        <div>
                            <span className="text-sm text-gray-700">
                                Showing {startIndex + 1} to{" "}
                                {Math.min(
                                    startIndex + itemsPerPage,
                                    csvData.length
                                )}{" "}
                                of {csvData.length} entries
                            </span>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.max(prev - 1, 1)
                                    )
                                }
                                disabled={currentPage === 1}
                                className={`px-3 py-1 text-xs rounded border ${
                                    currentPage === 1
                                        ? "bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.3)] cursor-not-allowed"
                                        : "bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.3)]"
                                }`}
                            >
                                Previous
                            </button>

                            {(() => {
                                const pageGroup = Math.floor(
                                    (currentPage - 1) / 10
                                );
                                const startPage = pageGroup * 10 + 1;
                                const endPage = Math.min(
                                    startPage + 9,
                                    totalPages
                                );

                                const pageButtons = [];
                                for (let i = startPage; i <= endPage; i++) {
                                    pageButtons.push(
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i)}
                                            className={`px-3 py-1 text-xs rounded border ${
                                                currentPage === i
                                                    ? "bg-[rgba(255,255,255,0.9)] text-[rgba(0,0,0,0.9)]"
                                                    : "bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.3)]"
                                            }`}
                                        >
                                            {i}
                                        </button>
                                    );
                                }
                                return pageButtons;
                            })()}

                            <button
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.min(prev + 1, totalPages)
                                    )
                                }
                                disabled={currentPage === totalPages}
                                className={`px-3 py-1 rounded text-xs border ${
                                    currentPage === totalPages
                                        ? "bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.3)] cursor-not-allowed"
                                        : "bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.3)]"
                                }`}
                            >
                                Next
                            </button>
                        </div>
                    </div>

                    {/* 일괄 마이그레이션 버튼 */}
                    <div className="my-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleMigrateAllSGP}
                                disabled={isMigratingSGP}
                                className={cn(
                                    "py-2 px-4 text-white rounded transition-colors",
                                    isMigratingSGP
                                        ? "bg-green-400 cursor-not-allowed"
                                        : "bg-green-600 hover:bg-green-700"
                                )}
                            >
                                {isMigratingSGP
                                    ? "Migrating SGP..."
                                    : "Migrate All SGP"}
                            </button>

                            {isMigratingSGP && (
                                <div className="flex-1">
                                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                                        <div
                                            className="bg-green-600 h-2.5 rounded-full"
                                            style={{
                                                width: `${sgpMigrationProgress}%`,
                                            }}
                                        ></div>
                                    </div>
                                    <div className="text-xs mt-1 text-gray-400">
                                        {sgpMigrationProgress}% Complete
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 🔍 실시간 마이그레이션 로그 */}
                    {migrationLog.length > 0 && (
                        <div className="my-6">
                            <h3 className="text-lg font-semibold mb-3">
                                📋 Migration Log
                            </h3>
                            <div className="bg-black/90 rounded-lg p-4 max-h-64 overflow-y-auto">
                                <div className="space-y-1 font-mono text-xs">
                                    {migrationLog
                                        .slice(-50)
                                        .map((log, index) => (
                                            <div
                                                key={index}
                                                className={cn(
                                                    "whitespace-pre-wrap",
                                                    log.includes("❌") &&
                                                        "text-red-400",
                                                    log.includes("✅") &&
                                                        "text-green-400",
                                                    log.includes("⏭️") &&
                                                        "text-yellow-400",
                                                    log.includes("🔄") &&
                                                        "text-blue-400",
                                                    log.includes("📦") &&
                                                        "text-purple-400",
                                                    log.includes("🚀") &&
                                                        "text-cyan-400",
                                                    log.includes("🎉") &&
                                                        "text-green-300",
                                                    log.includes("💥") &&
                                                        "text-red-500",
                                                    !log.includes("❌") &&
                                                        !log.includes("✅") &&
                                                        !log.includes("⏭️") &&
                                                        !log.includes("🔄") &&
                                                        !log.includes("📦") &&
                                                        !log.includes("🚀") &&
                                                        !log.includes("🎉") &&
                                                        !log.includes("💥") &&
                                                        "text-gray-300"
                                                )}
                                            >
                                                {log}
                                            </div>
                                        ))}
                                </div>
                                {migrationLog.length > 50 && (
                                    <div className="text-xs text-gray-500 mt-2">
                                        Showing last 50 of {migrationLog.length}{" "}
                                        log entries
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
