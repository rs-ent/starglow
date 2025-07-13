"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    Calendar,
    Activity,
    BarChart3,
    Target,
    Info,
} from "lucide-react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
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
import { useUserDashboardActivityPatterns } from "@/app/actions/userDashboard/hooks";
import type { UserDashboardGrowthPeriod } from "@/app/actions/userDashboard/queryKeys";

// 공통 컴포넌트 import
import { MetricCard, ChartCard } from "./shared/MetricCard";
import {
    DashboardLoading,
    DashboardError,
    formatNumber,
    formatDate,
} from "./shared/DashboardStates";

// 상세 정보 컴포넌트 import
import { AdminUsersDashboardActivityPatternsDetail } from "./Admin.Users.Dashboard.ActivityPatterns.Detail";

// DAU 트렌드 차트 컴포넌트
interface DAUTrendChartProps {
    data: Array<{
        date: string;
        activeUsers: number;
        newUsers: number;
        returningUsers: number;
    }>;
}

function DAUTrendChart({ data }: DAUTrendChartProps) {
    const latest7Days = data.slice(-7);

    const chartData = latest7Days.map((item, index) => {
        const prevDay = index > 0 ? latest7Days[index - 1] : null;
        const change = prevDay ? item.activeUsers - prevDay.activeUsers : 0;
        const changePercentage = prevDay
            ? (change / prevDay.activeUsers) * 100
            : 0;

        return {
            ...item,
            date: formatDate(item.date),
            change,
            changePercentage: Math.round(changePercentage * 10) / 10,
        };
    });

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-800 p-4 border border-slate-600 rounded-lg shadow-lg">
                    <p className="font-medium text-white">{label}</p>
                    <div className="space-y-1 mt-2">
                        <p className="text-sm text-blue-400">
                            <span className="font-medium">총 활성 사용자:</span>{" "}
                            {formatNumber(data.activeUsers)}
                        </p>
                        <p className="text-sm text-emerald-400">
                            <span className="font-medium">신규 사용자:</span>{" "}
                            {formatNumber(data.newUsers)}
                        </p>
                        <p className="text-sm text-purple-400">
                            <span className="font-medium">재방문 사용자:</span>{" "}
                            {formatNumber(data.returningUsers)}
                        </p>
                        {data.change !== 0 && (
                            <p
                                className={`text-sm ${
                                    data.change > 0
                                        ? "text-emerald-400"
                                        : "text-red-400"
                                }`}
                            >
                                <span className="font-medium">전일 대비:</span>{" "}
                                {data.change > 0 ? "+" : ""}
                                {data.change} ({data.changePercentage}%)
                            </p>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <ChartCard
            title="DAU 트렌드 (최근 7일)"
            description="일일 활성 사용자 수 변화 추이"
        >
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                        <XAxis
                            dataKey="date"
                            fontSize={12}
                            tick={{ fill: "#94a3b8" }}
                        />
                        <YAxis
                            fontSize={12}
                            tick={{ fill: "#94a3b8" }}
                            tickFormatter={(value) => formatNumber(value)}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="activeUsers"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            name="총 활성 사용자"
                            dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                            activeDot={{
                                r: 6,
                                stroke: "#3b82f6",
                                strokeWidth: 2,
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="newUsers"
                            stroke="#10b981"
                            strokeWidth={2}
                            name="신규 사용자"
                            dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                            activeDot={{
                                r: 6,
                                stroke: "#10b981",
                                strokeWidth: 2,
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="returningUsers"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            name="재방문 사용자"
                            dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                            activeDot={{
                                r: 6,
                                stroke: "#8b5cf6",
                                strokeWidth: 2,
                            }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
}

// MAU 월별 트렌드 컴포넌트
interface MAUTrendChartProps {
    data: Array<{
        month: string;
        activeUsers: number;
        newUsers: number;
        churnRate: number;
    }>;
}

function MAUTrendChart({ data }: MAUTrendChartProps) {
    const latest6Months = data.slice(-6);

    const chartData = latest6Months.map((item, index) => {
        const prevMonth = index > 0 ? latest6Months[index - 1] : null;
        const growth = prevMonth ? item.activeUsers - prevMonth.activeUsers : 0;
        const growthRate = prevMonth
            ? (growth / prevMonth.activeUsers) * 100
            : 0;

        return {
            ...item,
            growth,
            growthRate: Math.round(growthRate * 10) / 10,
        };
    });

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-800 p-4 border border-slate-600 rounded-lg shadow-lg">
                    <p className="font-medium text-white">{label}</p>
                    <div className="space-y-1 mt-2">
                        <p className="text-sm text-blue-400">
                            <span className="font-medium">
                                월간 활성 사용자:
                            </span>{" "}
                            {formatNumber(data.activeUsers)}
                        </p>
                        <p className="text-sm text-emerald-400">
                            <span className="font-medium">신규 사용자:</span>{" "}
                            {formatNumber(data.newUsers)}
                        </p>
                        <p className="text-sm text-red-400">
                            <span className="font-medium">이탈률:</span>{" "}
                            {data.churnRate.toFixed(1)}%
                        </p>
                        {data.growth !== 0 && (
                            <p
                                className={`text-sm ${
                                    data.growth > 0
                                        ? "text-emerald-400"
                                        : "text-red-400"
                                }`}
                            >
                                <span className="font-medium">전월 대비:</span>{" "}
                                {data.growth > 0 ? "+" : ""}
                                {formatNumber(data.growth)} ({data.growthRate}%)
                            </p>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <ChartCard
            title="MAU 트렌드 (최근 6개월)"
            description="월간 활성 사용자 수 변화 추이"
        >
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                        <XAxis
                            dataKey="month"
                            fontSize={12}
                            tick={{ fill: "#94a3b8" }}
                        />
                        <YAxis
                            fontSize={12}
                            tick={{ fill: "#94a3b8" }}
                            tickFormatter={(value) => formatNumber(value)}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar
                            dataKey="activeUsers"
                            fill="#3b82f6"
                            name="총 활성 사용자"
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="newUsers"
                            fill="#10b981"
                            name="신규 사용자"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
}

// DAU/MAU 비율 차트 컴포넌트
interface DAUMAUStickinessChartProps {
    dauData: Array<{
        date: string;
        activeUsers: number;
        newUsers: number;
        returningUsers: number;
    }>;
    mauData: Array<{
        month: string;
        activeUsers: number;
        newUsers: number;
        churnRate: number;
    }>;
}

function DAUMAUStickinessChart({
    dauData,
    mauData,
}: DAUMAUStickinessChartProps) {
    const latestMAU = mauData[mauData.length - 1]?.activeUsers || 1;

    const stickinessData = dauData.slice(-7).map((item) => {
        const stickiness = (item.activeUsers / latestMAU) * 100;
        return {
            date: formatDate(item.date),
            stickiness: Math.round(stickiness * 10) / 10,
            activeUsers: item.activeUsers,
            mauUsers: latestMAU,
        };
    });

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-800 p-4 border border-slate-600 rounded-lg shadow-lg">
                    <p className="font-medium text-white">{label}</p>
                    <div className="space-y-1 mt-2">
                        <p className="text-sm text-orange-400">
                            <span className="font-medium">DAU/MAU 비율:</span>{" "}
                            {data.stickiness}%
                        </p>
                        <p className="text-sm text-blue-400">
                            <span className="font-medium">DAU:</span>{" "}
                            {formatNumber(data.activeUsers)}
                        </p>
                        <p className="text-sm text-emerald-400">
                            <span className="font-medium">MAU:</span>{" "}
                            {formatNumber(data.mauUsers)}
                        </p>
                        <p className="text-sm text-slate-400">
                            <span className="font-medium">평가:</span>{" "}
                            {data.stickiness > 20
                                ? "우수"
                                : data.stickiness > 10
                                ? "양호"
                                : "개선필요"}
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <ChartCard
            title="DAU/MAU 비율 (Stickiness)"
            description="사용자 참여도 및 플랫폼 충성도 지표"
        >
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stickinessData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                        <XAxis
                            dataKey="date"
                            fontSize={12}
                            tick={{ fill: "#94a3b8" }}
                        />
                        <YAxis
                            fontSize={12}
                            tick={{ fill: "#94a3b8" }}
                            tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="stickiness"
                            stroke="#f59e0b"
                            fill="#fbbf24"
                            fillOpacity={0.3}
                            strokeWidth={2}
                            name="DAU/MAU 비율 (%)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
}

// DAU/MAU 핵심 지표 컴포넌트
interface DAUMAUOverviewProps {
    dauData: Array<{
        date: string;
        activeUsers: number;
        newUsers: number;
        returningUsers: number;
    }>;
    mauData: Array<{
        month: string;
        activeUsers: number;
        newUsers: number;
        churnRate: number;
    }>;
}

function DAUMAUOverview({ dauData, mauData }: DAUMAUOverviewProps) {
    const latestDAU = dauData[dauData.length - 1];
    const latestMAU = mauData[mauData.length - 1];
    const previousDAU = dauData[dauData.length - 2];
    const previousMAU = mauData[mauData.length - 2];

    const last7Days = dauData.slice(-7);
    const avgDAU =
        last7Days.reduce((sum, day) => sum + day.activeUsers, 0) /
        last7Days.length;

    const stickiness = latestMAU
        ? (latestDAU?.activeUsers / latestMAU.activeUsers) * 100
        : 0;

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

    return (
        <div className="grid gap-6 md:grid-cols-4">
            <MetricCard
                title="오늘의 DAU"
                value={latestDAU?.activeUsers || 0}
                description={formatDate(
                    latestDAU?.date || new Date().toISOString()
                )}
                icon={Users}
                trend={{
                    value: Math.abs(dauGrowth),
                    isPositive: dauGrowth >= 0,
                }}
            />

            <MetricCard
                title="이번 달 MAU"
                value={latestMAU?.activeUsers || 0}
                description={latestMAU?.month || "현재 월"}
                icon={Calendar}
                trend={{
                    value: Math.abs(mauGrowth),
                    isPositive: mauGrowth >= 0,
                }}
            />

            <MetricCard
                title="7일 평균 DAU"
                value={Math.round(avgDAU)}
                description="최근 7일 평균"
                icon={BarChart3}
            />

            <MetricCard
                title="DAU/MAU 비율"
                value={`${stickiness.toFixed(1)}%`}
                description="사용자 참여도 (Stickiness)"
                icon={Target}
                badge={{
                    text:
                        stickiness > 20
                            ? "EXCELLENT"
                            : stickiness > 10
                            ? "GOOD"
                            : "NEEDS IMPROVEMENT",
                    variant:
                        stickiness > 20
                            ? "default"
                            : stickiness > 10
                            ? "secondary"
                            : "destructive",
                }}
            />
        </div>
    );
}

// 메인 ActivityPatterns 컴포넌트
export function AdminUsersDashboardActivityPatterns() {
    const [selectedPeriod, setSelectedPeriod] = useState<number>(30);
    const [activeTab, setActiveTab] = useState<"overview" | "detail">(
        "overview"
    );

    const {
        dauData,
        mauData,
        isDAUMAULoading,
        isDAUMAUError,
        isLoading: detailLoading,
        isError: detailError,
    } = useUserDashboardActivityPatterns(
        selectedPeriod as UserDashboardGrowthPeriod
    );

    const isLoading =
        (activeTab === "overview" && isDAUMAULoading) ||
        (activeTab === "detail" && detailLoading);
    const isError =
        (activeTab === "overview" && isDAUMAUError) ||
        (activeTab === "detail" && detailError);

    if (isLoading) {
        return <DashboardLoading title="활동 패턴 분석" />;
    }

    if (isError) {
        return (
            <DashboardError
                title="활동 패턴 분석 오류"
                message="활동 패턴 데이터를 불러오는 중 오류가 발생했습니다."
            />
        );
    }

    return (
        <div className="space-y-8">
            {/* 헤더 */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white">
                        활동 패턴 분석
                    </h2>
                    <p className="text-slate-400">
                        DAU/MAU 중심의 사용자 활동 분석
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge
                        variant="default"
                        className="text-xs bg-slate-800 text-slate-200 border-slate-700"
                    >
                        REALTIME DATA
                    </Badge>
                    <Select
                        value={selectedPeriod.toString()}
                        onValueChange={(value) =>
                            setSelectedPeriod(Number(value))
                        }
                    >
                        <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-slate-200">
                            <SelectValue placeholder="기간 선택" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="7">최근 7일</SelectItem>
                            <SelectItem value="30">최근 30일</SelectItem>
                            <SelectItem value="90">최근 90일</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* 탭 기반 컨텐츠 */}
            <Tabs
                value={activeTab}
                onValueChange={(value) =>
                    setActiveTab(value as "overview" | "detail")
                }
            >
                <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-700">
                    <TabsTrigger
                        value="overview"
                        className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                    >
                        <Activity className="h-4 w-4" />
                        <span>DAU/MAU 개요</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="detail"
                        className="flex items-center gap-2 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
                    >
                        <Info className="h-4 w-4" />
                        <span>상세 정보</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8">
                    {/* DAU/MAU 핵심 지표 */}
                    <DAUMAUOverview
                        dauData={dauData || []}
                        mauData={mauData || []}
                    />

                    {/* 트렌드 차트 */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <DAUTrendChart data={dauData || []} />
                        <MAUTrendChart data={mauData || []} />
                    </div>

                    {/* DAU/MAU 비율 차트 */}
                    <DAUMAUStickinessChart
                        dauData={dauData || []}
                        mauData={mauData || []}
                    />

                    {/* 인사이트 */}
                    <ChartCard
                        title="주요 인사이트"
                        description="DAU/MAU 데이터 기반 핵심 인사이트"
                    >
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="p-4 bg-slate-800/50 rounded-lg">
                                <h4 className="font-medium text-slate-200 mb-2">
                                    사용자 참여도
                                </h4>
                                <p className="text-sm text-slate-400">
                                    DAU/MAU 비율이{" "}
                                    {(
                                        ((dauData?.[dauData.length - 1]
                                            ?.activeUsers || 0) /
                                            (mauData?.[mauData.length - 1]
                                                ?.activeUsers || 1)) *
                                        100
                                    ).toFixed(1)}
                                    %로, 사용자들이{" "}
                                    {((dauData?.[dauData.length - 1]
                                        ?.activeUsers || 0) /
                                        (mauData?.[mauData.length - 1]
                                            ?.activeUsers || 1)) *
                                        100 >
                                    20
                                        ? "매우 활발하게"
                                        : "꾸준히"}{" "}
                                    플랫폼을 이용하고 있습니다.
                                </p>
                            </div>

                            <div className="p-4 bg-slate-800/50 rounded-lg">
                                <h4 className="font-medium text-slate-200 mb-2">
                                    성장 추세
                                </h4>
                                <p className="text-sm text-slate-400">
                                    최근 7일 평균 DAU는{" "}
                                    {Math.round(
                                        (dauData
                                            ?.slice(-7)
                                            .reduce(
                                                (sum, day) =>
                                                    sum + day.activeUsers,
                                                0
                                            ) || 0) / 7
                                    )}
                                    명이며, 지속적인 성장세를 보이고 있습니다.
                                </p>
                            </div>
                        </div>
                    </ChartCard>
                </TabsContent>

                <TabsContent value="detail">
                    <AdminUsersDashboardActivityPatternsDetail />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default AdminUsersDashboardActivityPatterns;
