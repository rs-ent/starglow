/// components\admin\data-migrations\Admin.DataMigrations.Referral.tsx

"use client";

import { useState } from "react";

import { useToast } from "@/app/hooks/useToast";
import { useUserGet } from "@/app/hooks/useUser";
import { createReferralLogForMigration } from "@/app/actions/player";
import FileUploader from "@/components/atoms/FileUploader";
import { cn } from "@/lib/utils/tailwind";

import type { User, Player } from "@prisma/client";

export default function AdminDataMigrationsReferral() {
    const [csvData, setCsvData] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(50);

    const [isCreatingReferralLogs, setIsCreatingReferralLogs] = useState(false);
    const [referralLogProgress, setReferralLogProgress] = useState(0);
    const [migrationLog, setMigrationLog] = useState<string[]>([]);

    const { users } = useUserGet({
        getUsersInput: {
            providers: ["telegram"],
        },
    });

    const toast = useToast();

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
            setMigrationLog([]);
            toast.success("CSV file loaded successfully");
        } catch (error) {
            console.error("Error parsing CSV:", error);
            toast.error("Failed to parse CSV file");
        }
    };

    // 로그 추가 함수
    const addLog = (message: string) => {
        const timestamp = new Date().toISOString().slice(11, 19);
        setMigrationLog((prev) => [...prev, `[${timestamp}] ${message}`]);
    };

    // 개별 referral log 생성
    const handleCreateReferralLogForMigration = async (playerData: any) => {
        const playerName = playerData["Name"] || "Unknown";

        if (!playerData["recommenderId"]) {
            addLog(`⏭️ ${playerName}: No recommender ID, skipping`);
            return { success: false, skipped: true };
        }

        const referrerTelegramId = playerData["recommenderId"].replace(
            "TG_",
            ""
        );
        const referredTelegramId = playerData["SNS ID"].replace("TG_", "");

        try {
            addLog(`🔄 ${playerName}: Creating referral log...`);

            const result = await createReferralLogForMigration({
                referredTelegramId,
                referrerTelegramId,
                method: "telegram",
            });

            if (result.success) {
                if (result.skipped) {
                    addLog(`⏭️ ${playerName}: Referral log already exists`);
                } else {
                    addLog(
                        `✅ ${playerName}: Referral log created successfully`
                    );
                }
            } else {
                addLog(
                    `❌ ${playerName}: Failed to create referral log - ${result.error}`
                );
            }

            return result;
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            addLog(`💥 ${playerName}: Exception occurred - ${errorMessage}`);
            console.error("Referral log creation failed:", error);
            return { success: false, error: errorMessage };
        }
    };

    // 일괄 referral log 생성
    const handleCreateAllReferralLogs = async () => {
        setIsCreatingReferralLogs(true);
        setReferralLogProgress(0);
        setMigrationLog([]);

        const batchSize = 25; // SGP 마이그레이션과 동일한 배치 크기
        let successCount = 0;
        let failCount = 0;
        let skipCount = 0;

        const startTime = Date.now();
        addLog(
            `🚀 Starting referral log creation for ${csvData.length} players...`
        );
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
                    batch.map((playerData) =>
                        handleCreateReferralLogForMigration(playerData)
                    )
                );

                // 배치 결과 집계
                let batchSuccess = 0;
                let batchFail = 0;
                let batchSkip = 0;

                batchResults.forEach((result) => {
                    if (result.success && !result.skipped) {
                        batchSuccess++;
                        successCount++;
                    } else if (result.skipped) {
                        batchSkip++;
                        skipCount++;
                    } else {
                        batchFail++;
                        failCount++;
                    }
                });

                addLog(
                    `✅ Batch ${batchNumber} completed: ${batchSuccess} success, ${batchSkip} skipped, ${batchFail} failed`
                );

                // 진행률 업데이트
                const progress = Math.floor(
                    ((i + batch.length) / csvData.length) * 100
                );
                setReferralLogProgress(progress);

                // 지연 시간
                await new Promise((resolve) => setTimeout(resolve, 50));
            }

            const endTime = Date.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);

            addLog(`🎉 Referral log creation completed in ${duration}s`);
            addLog(
                `📊 Final results: ${successCount} successful, ${skipCount} skipped, ${failCount} failed`
            );

            toast.success(
                `Referral log creation completed: ${successCount} successful, ${skipCount} skipped, ${failCount} failed`
            );
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            addLog(`💥 Critical error: ${errorMessage}`);
            console.error("Batch referral log creation failed:", error);
            toast.error(
                `Referral log creation process encountered an error: ${errorMessage}`
            );
        } finally {
            setIsCreatingReferralLogs(false);
            addLog(`⏹️ Referral log creation process ended`);
        }
    };

    const totalPages = Math.ceil(csvData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = csvData.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">
                🔗 Referral Log Migration
            </h1>

            <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                    ⚠️ 중요 주의사항
                </h3>
                <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                    <li>
                        • <strong>사전 조건:</strong> Player 마이그레이션이 먼저
                        완료되어야 합니다
                    </li>
                    <li>
                        • <strong>중복 방지:</strong> 이미 존재하는 referral
                        log는 자동으로 스킵됩니다
                    </li>
                    <li>
                        • <strong>Quest 연동:</strong> Referral quest 자동 완료
                        처리 포함
                    </li>
                    <li>
                        • <strong>배치 처리:</strong> 25개씩 처리하여 안정성
                        확보
                    </li>
                </ul>
            </div>

            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    📋 필요한 CSV 컬럼
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>
                        • <strong>SNS ID:</strong> 추천받은 사용자의 Telegram ID
                        (TG_ prefix)
                    </li>
                    <li>
                        • <strong>recommenderId:</strong> 추천인의 Telegram ID
                        (TG_ prefix)
                    </li>
                    <li>
                        • <strong>Name:</strong> 플레이어 이름 (로그용)
                    </li>
                </ul>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Upload CSV File</h2>
                <FileUploader
                    bucket="data-migrations"
                    purpose="referral-migration"
                    onComplete={handleFileUpload}
                    accept={{ "text/csv": [".csv"] }}
                    multiple={false}
                    className="max-w-2xl"
                />
            </div>

            {csvData.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">
                        Referral Migration Data ({csvData.length} records)
                    </h2>

                    {/* 테이블 */}
                    <div className="overflow-auto max-h-[400px] mb-6">
                        <table className="min-w-full border border-[rgba(255,255,255,0.5)]">
                            <thead>
                                <tr className="bg-[rgba(255,255,255,0.3)]">
                                    <th className="border-b text-center text-sm font-bold py-2 px-4">
                                        Name
                                    </th>
                                    <th className="border-b text-center text-sm font-bold py-2 px-4">
                                        SNS ID
                                    </th>
                                    <th className="border-b text-center text-sm font-bold py-2 px-4">
                                        Recommender ID
                                    </th>
                                    <th className="border-b text-center text-sm font-bold py-2 px-4">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((row, rowIndex) => {
                                    const hasRecommender =
                                        row["recommenderId"] &&
                                        row["recommenderId"].trim() !== "";

                                    return (
                                        <tr
                                            key={rowIndex}
                                            className={cn(
                                                "divide-x divide-[rgba(255,255,255,0.1)]",
                                                rowIndex % 2 === 0
                                                    ? "bg-[rgba(255,255,255,0.1)]"
                                                    : "bg-[rgba(255,255,255,0.2)]"
                                            )}
                                        >
                                            <td className="py-2 px-4 text-xs">
                                                {row["Name"]}
                                            </td>
                                            <td className="py-2 px-4 text-xs">
                                                {row["SNS ID"]}
                                            </td>
                                            <td className="py-2 px-4 text-xs">
                                                {row["recommenderId"] || "N/A"}
                                            </td>
                                            <td className="py-2 px-4 text-xs text-center">
                                                {hasRecommender ? (
                                                    <span className="text-blue-400">
                                                        Ready
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        No Referrer
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
                    <div className="mt-4 flex items-center justify-between mb-6">
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

                    {/* 일괄 referral log 생성 버튼 */}
                    <div className="my-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleCreateAllReferralLogs}
                                disabled={isCreatingReferralLogs}
                                className={cn(
                                    "py-2 px-4 text-white rounded transition-colors",
                                    isCreatingReferralLogs
                                        ? "bg-orange-400 cursor-not-allowed"
                                        : "bg-orange-600 hover:bg-orange-700"
                                )}
                            >
                                {isCreatingReferralLogs
                                    ? "Creating Referral Logs..."
                                    : "Create All Referral Logs"}
                            </button>

                            {isCreatingReferralLogs && (
                                <div className="flex-1">
                                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                                        <div
                                            className="bg-orange-600 h-2.5 rounded-full"
                                            style={{
                                                width: `${referralLogProgress}%`,
                                            }}
                                        ></div>
                                    </div>
                                    <div className="text-xs mt-1 text-gray-400">
                                        {referralLogProgress}% Complete
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 실시간 마이그레이션 로그 */}
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
