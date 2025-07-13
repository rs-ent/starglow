"use client";

import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Users,
    Wallet,
    DollarSign,
    Target,
    Star,
    Zap,
    Calendar,
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

// hooks import
import {
    useUserDashboardOverview,
    useUserDashboardActivityPatterns,
    useUserDashboard,
} from "@/app/actions/userDashboard/hooks";

// 공통 컴포넌트 import
import { MetricCard, ChartCard } from "./shared/MetricCard";
import { DashboardLoading, DashboardError } from "./shared/DashboardStates";

// 정확한 숫자 표시를 위한 함수
function formatNumber(value: number): string {
    return value.toLocaleString();
}

// Key Performance Indicators Component
interface KPIOverviewProps {
    metrics: any;
    dauData: any[];
    mauData: any[];
}

function KPIOverview({ metrics, dauData, mauData }: KPIOverviewProps) {
    const latestDAU = dauData?.[dauData.length - 1];
    const latestMAU = mauData?.[mauData.length - 1];
    const previousDAU = dauData?.[dauData.length - 2];
    const previousMAU = mauData?.[mauData.length - 2];

    const dauGrowth = previousDAU
        ? ((latestDAU?.activeUsers - previousDAU.activeUsers) /
              previousDAU.activeUsers) *
          100
        : 0;

    const mauGrowth = previousMAU
        ? ((latestMAU?.activeUsers - previousMAU.activeUsers) /
              previousMAU.activeUsers) *
          100
        : 0;

    const stickiness = latestMAU
        ? (latestDAU?.activeUsers / latestMAU.activeUsers) * 100
        : 0;

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
                title="DAU"
                value={formatNumber(latestDAU?.activeUsers || 0)}
                icon={Users}
                trend={{
                    value: Math.abs(dauGrowth),
                    isPositive: dauGrowth >= 0,
                }}
            />

            <MetricCard
                title="MAU"
                value={formatNumber(latestMAU?.activeUsers || 0)}
                icon={Calendar}
                trend={{
                    value: Math.abs(mauGrowth),
                    isPositive: mauGrowth >= 0,
                }}
            />

            <MetricCard
                title="Stickiness"
                value={`${stickiness.toFixed(1)}%`}
                icon={Target}
            />

            <MetricCard
                title="Wallets"
                value={formatNumber(metrics?.totalWallets || 0)}
                icon={Wallet}
            />
        </div>
    );
}

// Growth Trends Chart Component
interface GrowthTrendsProps {
    dauData: any[];
    mauData: any[];
}

function GrowthTrends({ dauData }: GrowthTrendsProps) {
    // Combine last 30 days of DAU data for trend visualization
    const trendData = dauData?.slice(-30).map((item) => {
        const date = new Date(item.date);
        return {
            date: date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            }),
            dau: item.activeUsers,
            newUsers: item.newUsers,
            returning: item.returningUsers,
        };
    });

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 shadow-xl">
                    <p className="font-semibold text-white mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p
                            key={index}
                            className="text-sm"
                            style={{ color: entry.color }}
                        >
                            <span className="font-medium">{entry.name}:</span>{" "}
                            {formatNumber(entry.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <ChartCard title="Growth">
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                            dataKey="date"
                            fontSize={12}
                            tick={{ fill: "#9CA3AF" }}
                        />
                        <YAxis
                            fontSize={12}
                            tick={{ fill: "#9CA3AF" }}
                            tickFormatter={(value) => formatNumber(value)}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="dau"
                            stackId="1"
                            stroke="#8b5cf6"
                            fill="#8b5cf6"
                            fillOpacity={0.6}
                            name="DAU"
                            dot={{ r: 4, fill: "#8b5cf6" }}
                            activeDot={{ r: 4, fill: "#8b5cf6" }}
                        />
                        <Area
                            type="monotone"
                            dataKey="newUsers"
                            stackId="2"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.8}
                            name="New Users"
                            dot={{ r: 4, fill: "#10b981" }}
                            activeDot={{ r: 4, fill: "#10b981" }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
}

// Web3 Ecosystem Metrics
interface Web3MetricsProps {
    walletMetrics: any;
    networkData: any;
}

function Web3EcosystemMetrics({ walletMetrics }: Web3MetricsProps) {
    const ecosystemData = [
        {
            name: "Total Value",
            value: walletMetrics?.totalWalletValue || 0,
            icon: DollarSign,
            color: "text-emerald-400",
        },
        {
            name: "Asset Holders",
            value: walletMetrics?.walletsWithAssets || 0,
            icon: Star,
            color: "text-purple-400",
        },
        {
            name: "Multi-Wallet",
            value: walletMetrics?.multiWalletUsers || 0,
            icon: Wallet,
            color: "text-blue-400",
        },
        {
            name: "Transactions",
            value: walletMetrics?.totalWalletTransactions || 0,
            icon: Zap,
            color: "text-yellow-400",
        },
    ];

    return (
        <ChartCard title="Assets">
            <div className="grid gap-4 md:grid-cols-2">
                {ecosystemData.map((metric) => {
                    const IconComponent = metric.icon;
                    return (
                        <div
                            key={metric.name}
                            className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-slate-700 rounded-lg">
                                    <IconComponent
                                        className={`h-5 w-5 ${metric.color}`}
                                    />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white">
                                        {metric.name}
                                    </h4>
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {formatNumber(metric.value)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </ChartCard>
    );
}

// Business Intelligence Summary
function BusinessIntelligence() {
    return (
        <ChartCard title="Platform Info">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">
                        Market Position
                    </h4>
                    <div className="space-y-3">
                        <div className="p-3 bg-gradient-to-r from-purple-900/50 to-slate-800/50 rounded-lg border border-purple-700/50">
                            <h5 className="font-medium text-purple-200 mb-1">
                                🎯 Target Market Leadership
                            </h5>
                            <p className="text-sm text-purple-100">
                                First-mover advantage in K-pop Web3
                                entertainment with blockchain-native fan
                                engagement
                            </p>
                        </div>
                        <div className="p-3 bg-gradient-to-r from-emerald-900/50 to-slate-800/50 rounded-lg border border-emerald-700/50">
                            <h5 className="font-medium text-emerald-200 mb-1">
                                📈 Revenue Diversification
                            </h5>
                            <p className="text-sm text-emerald-100">
                                Multiple revenue streams: NFTs, digital assets,
                                premium features, and artist partnerships
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">
                        Growth Drivers
                    </h4>
                    <div className="space-y-3">
                        <div className="p-3 bg-gradient-to-r from-blue-900/50 to-slate-800/50 rounded-lg border border-blue-700/50">
                            <h5 className="font-medium text-blue-200 mb-1">
                                🚀 Viral User Acquisition
                            </h5>
                            <p className="text-sm text-blue-100">
                                Community-driven growth through fan referrals
                                and social sharing mechanisms
                            </p>
                        </div>
                        <div className="p-3 bg-gradient-to-r from-amber-900/50 to-slate-800/50 rounded-lg border border-amber-700/50">
                            <h5 className="font-medium text-amber-200 mb-1">
                                🎵 Artist Network Effects
                            </h5>
                            <p className="text-sm text-amber-100">
                                Each new artist brings their fanbase, creating
                                exponential user growth potential
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </ChartCard>
    );
}

// Main Analytics Component
export function AdminUsersDashboardAnalytics() {
    const [timePeriod, setTimePeriod] = useState<"7" | "30" | "90">("30");

    // Fetch analytics data
    const { metrics, network } = useUserDashboardOverview(
        Number(timePeriod) as 7 | 30 | 90
    );
    const { dauData, mauData } = useUserDashboardActivityPatterns(
        Number(timePeriod) as 7 | 30 | 90
    );
    const { walletMetrics } = useUserDashboard();

    const isLoading =
        metrics.isLoading || network.isLoading || !dauData || !mauData;
    const isError = metrics.isError || network.isError;

    if (isLoading) {
        return <DashboardLoading title="Analytics Dashboard" />;
    }

    if (isError) {
        return (
            <DashboardError
                title="Analytics Error"
                message="Failed to load analytics data. Please try again."
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
            <div className="container mx-auto px-6 py-8 space-y-8">
                {/* Time Period Selector */}
                <div className="flex justify-end">
                    <Select
                        value={timePeriod}
                        onValueChange={(value: "7" | "30" | "90") =>
                            setTimePeriod(value)
                        }
                    >
                        <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-slate-200">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Key Performance Indicators */}
                <KPIOverview
                    metrics={metrics.data}
                    dauData={dauData || []}
                    mauData={mauData || []}
                />

                {/* Growth Trends */}
                <GrowthTrends dauData={dauData || []} mauData={mauData || []} />

                {/* Web3 & Network Analytics */}
                <div>
                    <Web3EcosystemMetrics
                        walletMetrics={walletMetrics}
                        networkData={network.data}
                    />
                </div>

                {/* Business Intelligence */}
                <BusinessIntelligence />
            </div>
        </div>
    );
}

export default AdminUsersDashboardAnalytics;
