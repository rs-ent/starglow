"use client";

import { useCallback, useState } from "react";
import { useDataFetcher } from "./components/DataFetcher";
import type {
    RefreshTarget,
    CombinedRafflePerformance,
} from "./components/DataFetcher";
import ActiveWallets from "./components/ActiveWallets";
import DailyActiveWallets from "./components/DailyActiveWallets";
import QuestPerformance from "./components/QuestPerformance";
import PollPerformance from "./components/PollPerformance";
import RafflePerformance from "./components/RafflePerformance";
import type {
    DailyActivityQuests,
    DailyActivityWallets,
    DailyActivityPolls,
} from "@prisma/client";

interface AdminUsersDashboardAnalyticsProps {
    className?: string;
}

export default function AdminUsersDashboardAnalytics({
    className = "",
}: AdminUsersDashboardAnalyticsProps) {
    const [walletsCount, setWalletsCount] = useState<number | null>(null);
    const [dailyWalletsData, setDailyWalletsData] = useState<
        DailyActivityWallets[] | null
    >(null);
    const [dailyQuestsData, setDailyQuestsData] = useState<
        DailyActivityQuests[] | null
    >(null);
    const [dailyPollsData, setDailyPollsData] = useState<
        DailyActivityPolls[] | null
    >(null);
    const [dailyRafflesData, setDailyRafflesData] = useState<
        CombinedRafflePerformance[] | null
    >(null);

    const { isLoading, error, lastUpdated, handleRefresh } = useDataFetcher();

    const onRefresh = useCallback(
        async (target: RefreshTarget) => {
            switch (target) {
                case "wallets":
                    const count = await handleRefresh("wallets");
                    if (typeof count === "number" && count !== null) {
                        setWalletsCount(count);
                    }
                    break;
                case "dailyActiveUsers":
                    const dailyWalletsResult = await handleRefresh(
                        "dailyActiveUsers"
                    );
                    if (Array.isArray(dailyWalletsResult)) {
                        setDailyWalletsData(
                            dailyWalletsResult as DailyActivityWallets[]
                        );
                    }
                    break;
                case "questPerformance":
                    const dailyQuestsResult = await handleRefresh(
                        "questPerformance"
                    );
                    if (Array.isArray(dailyQuestsResult)) {
                        setDailyQuestsData(
                            dailyQuestsResult as DailyActivityQuests[]
                        );
                    }
                    break;
                case "pollPerformance":
                    const dailyPollsResult = await handleRefresh(
                        "pollPerformance"
                    );
                    if (Array.isArray(dailyPollsResult)) {
                        setDailyPollsData(
                            dailyPollsResult as DailyActivityPolls[]
                        );
                    }
                    break;
                case "rafflePerformance":
                    const dailyRafflesResult = await handleRefresh(
                        "rafflePerformance"
                    );
                    if (Array.isArray(dailyRafflesResult)) {
                        setDailyRafflesData(
                            dailyRafflesResult as CombinedRafflePerformance[]
                        );
                    }
                    break;
                default:
                    console.warn(`Unknown refresh target: ${target}`);
                    break;
            }
        },
        [handleRefresh]
    );

    return (
        <div
            className={`relative min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black ${className}`}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>

            <div className="relative">
                <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-b border-slate-700/30 backdrop-blur-sm">
                    <div className="px-8 py-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-200 to-indigo-200 bg-clip-text text-transparent mb-2">
                                User Analytics
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
                        <ActiveWallets
                            walletsCount={walletsCount}
                            isLoading={isLoading}
                            error={error}
                            onRefresh={() => onRefresh("wallets")}
                            lastUpdated={lastUpdated}
                        />
                        <DailyActiveWallets
                            dailyWalletsData={dailyWalletsData || []}
                            isLoading={isLoading}
                            error={error}
                            onRefresh={() => onRefresh("dailyActiveUsers")}
                            lastUpdated={lastUpdated}
                        />
                        <QuestPerformance
                            dailyQuestsData={dailyQuestsData || []}
                            isLoading={isLoading}
                            error={error}
                            onRefresh={() => onRefresh("questPerformance")}
                            lastUpdated={lastUpdated}
                        />
                        <PollPerformance
                            dailyPollsData={dailyPollsData || []}
                            isLoading={isLoading}
                            error={error}
                            onRefresh={() => onRefresh("pollPerformance")}
                            lastUpdated={lastUpdated}
                        />
                        <RafflePerformance
                            dailyRafflesData={dailyRafflesData || []}
                            isLoading={isLoading}
                            error={error}
                            onRefresh={() => onRefresh("rafflePerformance")}
                            lastUpdated={lastUpdated}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
