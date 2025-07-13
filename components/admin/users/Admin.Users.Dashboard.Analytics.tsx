"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
    Globe,
    Target,
    Star,
    Zap,
    Calendar,
} from "lucide-react";
import {
    AreaChart,
    Area,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
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
import {
    DashboardLoading,
    DashboardError,
    formatNumber,
} from "./shared/DashboardStates";

// Chart color palette for consistent branding
const CHART_COLORS = [
    "#8b5cf6", // violet - primary brand color
    "#06b6d4", // cyan
    "#10b981", // emerald
    "#f59e0b", // amber
    "#ef4444", // red
    "#6366f1", // indigo
];

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
                title="Daily Active Users"
                value={formatNumber(latestDAU?.activeUsers || 0)}
                description="24h active user count"
                icon={Users}
                trend={{
                    value: Math.abs(dauGrowth),
                    isPositive: dauGrowth >= 0,
                }}
                badge={{ text: "REAL-TIME", variant: "default" }}
            />

            <MetricCard
                title="Monthly Active Users"
                value={formatNumber(latestMAU?.activeUsers || 0)}
                description="30-day active users"
                icon={Calendar}
                trend={{
                    value: Math.abs(mauGrowth),
                    isPositive: mauGrowth >= 0,
                }}
            />

            <MetricCard
                title="User Stickiness"
                value={`${stickiness.toFixed(1)}%`}
                description="DAU/MAU ratio"
                icon={Target}
                badge={{
                    text: stickiness > 20 ? "EXCELLENT" : "GOOD",
                    variant: stickiness > 20 ? "default" : "secondary",
                }}
            />

            <MetricCard
                title="Web3 Wallets"
                value={formatNumber(metrics?.totalWallets || 0)}
                description="Connected blockchain wallets"
                icon={Wallet}
                badge={{ text: "WEB3", variant: "secondary" }}
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
        <ChartCard
            title="User Growth Trends"
            description="Daily active users and acquisition patterns over the last 30 days"
        >
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
                            name="Total DAU"
                        />
                        <Area
                            type="monotone"
                            dataKey="newUsers"
                            stackId="2"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.8}
                            name="New Users"
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
            description: "Combined asset value",
        },
        {
            name: "Asset Holders",
            value: walletMetrics?.walletsWithAssets || 0,
            icon: Star,
            color: "text-purple-400",
            description: "Wallets with assets",
        },
        {
            name: "Multi-Wallet Users",
            value: walletMetrics?.multiWalletUsers || 0,
            icon: Wallet,
            color: "text-blue-400",
            description: "Power users (2+ wallets)",
        },
        {
            name: "Transaction Volume",
            value: walletMetrics?.totalWalletTransactions || 0,
            icon: Zap,
            color: "text-yellow-400",
            description: "Completed transactions",
        },
    ];

    return (
        <ChartCard
            title="Web3 Ecosystem Health"
            description="Blockchain activity and digital asset engagement metrics"
        >
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
                                    <p className="text-xs text-slate-400">
                                        {metric.description}
                                    </p>
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

// Network Distribution Pie Chart
interface NetworkDistributionProps {
    data: Array<{
        network: string;
        count: number;
        percentage: number;
    }>;
}

function NetworkDistribution({ data }: NetworkDistributionProps) {
    if (!data || data.length === 0) {
        return (
            <ChartCard
                title="Blockchain Network Distribution"
                description="User distribution across different blockchain networks"
            >
                <div className="text-center py-8">
                    <Globe className="h-12 w-12 mx-auto text-slate-500 mb-4" />
                    <p className="text-sm text-slate-400">
                        No network data available
                    </p>
                </div>
            </ChartCard>
        );
    }

    return (
        <ChartCard
            title="Blockchain Network Distribution"
            description="User distribution across different blockchain networks"
        >
            <div className="grid gap-6 md:grid-cols-2">
                {/* Pie Chart */}
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="count"
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={
                                            CHART_COLORS[
                                                index % CHART_COLORS.length
                                            ]
                                        }
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-slate-900 border border-slate-700 rounded-lg p-3">
                                                <p className="font-semibold text-white">
                                                    {data.network}
                                                </p>
                                                <p className="text-slate-300">
                                                    {formatNumber(data.count)}{" "}
                                                    users ({data.percentage}%)
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                </div>

                {/* Network List */}
                <div className="space-y-3">
                    {data.map((network, index) => (
                        <div
                            key={network.network}
                            className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-4 h-4 rounded"
                                    style={{
                                        backgroundColor:
                                            CHART_COLORS[
                                                index % CHART_COLORS.length
                                            ],
                                    }}
                                />
                                <span className="font-medium text-white">
                                    {network.network}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-300">
                                    {formatNumber(network.count)}
                                </span>
                                <Badge
                                    variant="outline"
                                    className="text-xs border-slate-600 text-slate-300"
                                >
                                    {network.percentage}%
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </ChartCard>
    );
}

// Business Intelligence Summary
function BusinessIntelligence() {
    return (
        <ChartCard
            title="Platform Intelligence"
            description="Key insights and competitive advantages for stakeholders"
        >
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
                {/* Header */}
                <div className="border-b border-slate-800 pb-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent">
                                Starglow Analytics
                            </h1>
                            <p className="text-xl text-slate-300">
                                Web3 Entertainment Platform Performance
                                Dashboard
                            </p>
                            <p className="text-sm text-slate-400">
                                Real-time insights for stakeholders and
                                investors
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Badge
                                variant="outline"
                                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-none px-3 py-1"
                            >
                                LIVE DATA
                            </Badge>
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
                                    <SelectItem value="7">
                                        Last 7 days
                                    </SelectItem>
                                    <SelectItem value="30">
                                        Last 30 days
                                    </SelectItem>
                                    <SelectItem value="90">
                                        Last 90 days
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
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
                <div className="grid gap-6 lg:grid-cols-2">
                    <Web3EcosystemMetrics
                        walletMetrics={walletMetrics}
                        networkData={network.data}
                    />
                    <NetworkDistribution
                        data={network.data?.networkDistribution || []}
                    />
                </div>

                {/* Business Intelligence */}
                <BusinessIntelligence />

                {/* Footer */}
                <div className="border-t border-slate-800 pt-6">
                    <div className="flex items-center justify-between text-slate-400">
                        <p className="text-sm">
                            Data updated in real-time • Last refresh:{" "}
                            {new Date().toLocaleTimeString()}
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-xs">LIVE</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminUsersDashboardAnalytics;
