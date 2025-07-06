/// components\admin\data-migrations\Admin.DataMigrations.Player.tsx

"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/app/hooks/useToast";
import { useUserGet, useUserSet } from "@/app/hooks/useUser";
import FileUploader from "@/components/atoms/FileUploader";
import { cn } from "@/lib/utils/tailwind";

import type { User, Player } from "@prisma/client";

export default function AdminDataMigrationsPlayer() {
    const [csvData, setCsvData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, _setItemsPerPage] = useState(50);
    const [selectedRow, setSelectedRow] = useState<number | null>(null);

    const [isMigratingAll, setIsMigratingAll] = useState(false);
    const [migrationProgress, setMigrationProgress] = useState(0);
    const [migratedPlayers, setMigratedPlayers] = useState<Set<number>>(
        new Set()
    );

    const { users } = useUserGet({
        getUsersInput: {
            providers: ["telegram"],
        },
    });

    const { setUserWithTelegram } = useUserSet();
    const toast = useToast();

    useEffect(() => {
        if (csvData.length > 0 && users && users.length > 0) {
            const newMigratedPlayers = new Set<number>();

            csvData.forEach((player, index) => {
                if (player["SNS ID"] && player["SNS ID"].startsWith("TG_")) {
                    const telegramId = player["SNS ID"].replace("TG_", "");
                    if (telegramId) {
                        const userExists = users.some(
                            (user) => user.telegramId === telegramId
                        );

                        if (userExists) {
                            newMigratedPlayers.add(index);
                        }
                    }
                }
            });

            setMigratedPlayers(newMigratedPlayers);
        }
    }, [csvData, users]);

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

            setHeaders(headers);
            setCsvData(parsedData);
            setSelectedRow(null);
            toast.success("CSV file loaded successfully");
        } catch (error) {
            console.error("Error parsing CSV:", error);
            toast.error("Failed to parse CSV file");
        }
    };

    const handleRowClick = (rowIndex: number) => {
        setSelectedRow(rowIndex === selectedRow ? null : rowIndex);
    };

    const handleMigratePlayer = async (playerData: any, index?: number) => {
        try {
            if (!playerData["SNS ID"] || migratedPlayers.has(index || -1)) {
                return { success: false, skipped: true };
            }

            const telegramId = playerData["SNS ID"].replace("TG_", "");
            if (!telegramId || isNaN(parseInt(telegramId, 10))) {
                console.error("Invalid Telegram ID:", playerData["SNS ID"]);
                return { success: false, error: "Invalid Telegram ID" };
            }

            let referrerCode: string | undefined;
            if (playerData["recommenderId"] && users) {
                const referrerTelegramId = playerData["recommenderId"].replace(
                    "TG_",
                    ""
                );
                const referrerUser = users.find(
                    (user) => user.telegramId === referrerTelegramId
                ) as User & { player: Player };

                if (referrerUser?.player?.referralCode) {
                    referrerCode = referrerUser.player.referralCode;
                }
            }

            const result = await setUserWithTelegram({
                user: {
                    id: parseInt(telegramId, 10),
                    username: playerData["Name"],
                    first_name: playerData["Name"],
                },
                referrerCode,
                withoutSessionRefresh: true,
            });

            if (index !== undefined) {
                setMigratedPlayers((prev) => {
                    const newSet = new Set(prev);
                    newSet.add(index);
                    return newSet;
                });
            }

            return { success: true, result };
        } catch (error) {
            console.error("Migration failed for player:", playerData, error);
            return { success: false, error };
        }
    };

    const handleMigrateAllPlayers = async () => {
        setIsMigratingAll(true);
        setMigrationProgress(0);

        const batchSize = 10;
        const results = [];
        let successCount = 0;
        let failCount = 0;
        let skipCount = 0;

        try {
            for (let i = 0; i < csvData.length; i += batchSize) {
                const batch = csvData.slice(i, i + batchSize);

                const batchResults = await Promise.all(
                    batch.map((playerData, idx) =>
                        handleMigratePlayer(playerData, i + idx)
                    )
                );

                batchResults.forEach((result) => {
                    if (result.success) successCount++;
                    else if (result.skipped) skipCount++;
                    else failCount++;
                });

                results.push(...batchResults);

                setMigrationProgress(
                    Math.floor(((i + batch.length) / csvData.length) * 100)
                );

                await new Promise((resolve) => setTimeout(resolve, 100));
            }

            toast.success(
                `Migration completed: ${successCount} successful, ${skipCount} skipped, ${failCount} failed`
            );
        } catch (error) {
            console.error("Batch migration failed:", error);
            toast.error("Migration process encountered an error");
        } finally {
            setIsMigratingAll(false);
        }

        return results;
    };

    /*
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
}
    */

    const totalPages = Math.ceil(csvData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = csvData.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">
                Migrate Player Data from MEME QUEST
            </h1>

            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    🔧 개선된 마이그레이션 프로세스
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>
                        • <strong>자동 Referrer 설정:</strong> Player 생성 시
                        CSV의 recommenderId를 통해 자동으로 referrer 관계 설정
                    </li>
                    <li>
                        • <strong>중복 방지:</strong> 이미 존재하는 사용자는
                        자동으로 스킵
                    </li>
                    <li>
                        • <strong>배치 처리:</strong> 10개씩 안전하게 처리하여
                        안정성 확보
                    </li>
                    <li>
                        • <strong>Referral Log:</strong> 별도 Referral Migration
                        컴포넌트에서 처리
                    </li>
                </ul>
            </div>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Upload CSV File</h2>
                <FileUploader
                    bucket="data-migrations"
                    purpose="player-migration"
                    onComplete={handleFileUpload}
                    accept={{
                        "text/csv": [".csv"],
                    }}
                    multiple={false}
                    className="max-w-2xl"
                />
            </div>

            {csvData.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">CSV Data</h2>

                    <div className="overflow-auto max-h-[500px]">
                        <table className="min-w-full border border-[rgba(255,255,255,0.5)]">
                            <thead>
                                <tr className="px-6 py-1 bg-[rgba(255,255,255,0.3)] divide-x divide-[rgba(255,255,255,0.3)]">
                                    {headers.map((header, index) => (
                                        <th
                                            key={index}
                                            className="border-b text-center text-sm font-bold"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((row, rowIndex) => (
                                    <tr
                                        key={rowIndex}
                                        onClick={() => handleRowClick(rowIndex)}
                                        className={cn(
                                            "divide-x divide-[rgba(255,255,255,0.1)]",
                                            rowIndex % 2 === 0
                                                ? "bg-[rgba(255,255,255,0.1)]"
                                                : "bg-[rgba(255,255,255,0.2)]",
                                            migratedPlayers.has(
                                                startIndex + rowIndex
                                            ) && "bg-[rgba(0,255,0,0.1)]"
                                        )}
                                    >
                                        {headers.map((header, colIndex) => (
                                            <td
                                                key={`${rowIndex}-${colIndex}`}
                                                className="py-2 px-4 border-b text-xs"
                                            >
                                                {row[header]}
                                            </td>
                                        ))}

                                        <td className="py-2 px-4 border-b text-xs text-center">
                                            {migratedPlayers.has(
                                                startIndex + rowIndex
                                            ) ? (
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
                                ))}
                            </tbody>
                        </table>
                    </div>

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

                    {/* 일괄 마이그레이션 버튼 및 진행 상태 표시 */}
                    <div className="my-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleMigrateAllPlayers}
                                disabled={isMigratingAll}
                                className={cn(
                                    "py-2 px-4 text-white rounded transition-colors",
                                    isMigratingAll
                                        ? "bg-blue-400 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700"
                                )}
                            >
                                {isMigratingAll
                                    ? "Migration in Progress..."
                                    : "Migrate All Players"}
                            </button>

                            {isMigratingAll && (
                                <div className="flex-1">
                                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                                        <div
                                            className="bg-blue-600 h-2.5 rounded-full"
                                            style={{
                                                width: `${migrationProgress}%`,
                                            }}
                                        ></div>
                                    </div>
                                    <div className="text-xs mt-1 text-gray-400">
                                        {migrationProgress}% Complete
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="md:col-span-1">
                        {selectedRow !== null ? (
                            <div className="mt-6 bg-[rgba(255,255,255,0.1)] p-4 rounded-lg border border-[rgba(255,255,255,0.2)]">
                                <h3 className="text-lg font-semibold mb-4">
                                    Selected Player
                                </h3>
                                <div className="space-y-2 mb-6">
                                    {headers.map((header, index) => (
                                        <div
                                            key={index}
                                            className="grid grid-cols-3 gap-2"
                                        >
                                            <span className="text-xs font-medium col-span-1">
                                                {header}:
                                            </span>
                                            <span className="text-xs col-span-2">
                                                {
                                                    paginatedData[selectedRow][
                                                        header
                                                    ]
                                                }
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() =>
                                        handleMigratePlayer(
                                            paginatedData[selectedRow]
                                        )
                                    }
                                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                >
                                    Migrate This Player
                                </button>
                            </div>
                        ) : (
                            <div className="bg-[rgba(255,255,255,0.1)] p-4 rounded-lg border border-[rgba(255,255,255,0.2)] flex items-center justify-center h-full">
                                <p className="text-center text-sm text-gray-400">
                                    Select a player from the table to view
                                    details
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
