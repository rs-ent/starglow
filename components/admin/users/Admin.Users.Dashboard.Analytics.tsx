"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Users,
    Wallet,
    DollarSign,
    Target,
    Star,
    Calendar,
    Coins,
    Trophy,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
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
    BarChart,
    Bar,
    Cell,
} from "recharts";

// hooks import
import {
    useUserDashboardOverview,
    useUserDashboardActivityPatterns,
    useUserDashboard,
    useUserDashboardAssetAnalysis,
} from "@/app/actions/userDashboard/hooks";
import {
    useAssetHoldingRankingPaginated,
    useHourlyActivity,
    useDailyActivity,
} from "@/app/actions/userDashboard/queries";

// 공통 컴포넌트 import
import { ChartCard, DataCard } from "./shared/MetricCard";
import { DashboardLoading, DashboardError } from "./shared/DashboardStates";

// 정확한 숫자 표시를 위한 함수
function formatNumber(value: number): string {
    return value.toLocaleString();
}

// DAU/MAU 데이터 필터링 함수 (2025년 7월 7일 이후 데이터만)
function filterDataAfterDate(data: any[], cutoffDate: string) {
    if (!data || data.length === 0) return [];

    const cutoff = new Date(cutoffDate);
    return data.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= cutoff;
    });
}

// Asset Icon Component
const AssetIcon = ({ asset }: { asset: any }) => {
    if (asset.iconUrl) {
        return (
            <img
                src={asset.iconUrl}
                alt={asset.name || asset.symbol || "Asset"}
                className="h-4 w-4 rounded-full object-cover"
                onError={(e) => {
                    e.currentTarget.style.display = "none";
                }}
            />
        );
    }
    return <Coins className="h-4 w-4 text-slate-400" />;
};

// Pagination Component
interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    hasNextPage,
    hasPrevPage,
}: PaginationProps) {
    const getPageNumbers = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        // Calculate start and end page
        const start = Math.max(1, currentPage - delta);
        const end = Math.min(totalPages, currentPage + delta);

        for (let i = start; i <= end; i++) {
            range.push(i);
        }

        // Add first page
        if (start > 1) {
            rangeWithDots.push(1);
            if (start > 2) {
                rangeWithDots.push("...");
            }
        }

        // Add middle pages
        rangeWithDots.push(...range);

        // Add last page
        if (end < totalPages) {
            if (end < totalPages - 1) {
                rangeWithDots.push("...");
            }
            rangeWithDots.push(totalPages);
        }

        return rangeWithDots;
    };

    return (
        <div className="flex items-center justify-between border-t border-slate-700 pt-4">
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={!hasPrevPage}
                    className="text-slate-300 border-slate-600 hover:bg-slate-700"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                </Button>

                <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => (
                        <div key={index}>
                            {page === "..." ? (
                                <span className="px-2 py-1 text-slate-400">
                                    ...
                                </span>
                            ) : (
                                <Button
                                    variant={
                                        page === currentPage
                                            ? "default"
                                            : "outline"
                                    }
                                    size="sm"
                                    onClick={() => onPageChange(Number(page))}
                                    className={`text-xs ${
                                        page === currentPage
                                            ? "bg-purple-600 text-white"
                                            : "text-slate-300 border-slate-600 hover:bg-slate-700"
                                    }`}
                                >
                                    {page}
                                </Button>
                            )}
                        </div>
                    ))}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!hasNextPage}
                    className="text-slate-300 border-slate-600 hover:bg-slate-700"
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            <div className="text-sm text-slate-400">
                {currentPage} / {totalPages} pages
            </div>
        </div>
    );
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

    // 개선된 메트릭 계산
    const dauGrowth = previousDAU
        ? ((latestDAU?.activeUsers - previousDAU.activeUsers) /
              previousDAU.activeUsers) *
          100
        : 0;

    // MAU는 이제 growthRate를 직접 제공
    const mauGrowth = latestMAU?.growthRate || 0;

    const stickiness =
        latestMAU?.activeUsers > 0
            ? (latestDAU?.activeUsers / latestMAU.activeUsers) * 100
            : 0;

    // 신규 사용자 비율 (개선된 데이터에서 제공)
    const newUserRate = latestDAU?.newUserRate || 0;

    // 리텐션 비율 (개선된 데이터에서 제공)
    const retentionRate = latestMAU?.retentionRate || 0;

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            <DataCard
                title="DAU"
                value={formatNumber(latestDAU?.activeUsers || 0)}
                icon={Users}
                subtitle={`신규: ${newUserRate.toFixed(1)}% | 성장: ${
                    dauGrowth >= 0 ? "+" : ""
                }${dauGrowth.toFixed(1)}%`}
            />

            <DataCard
                title="MAU"
                value={formatNumber(latestMAU?.activeUsers || 0)}
                icon={Calendar}
                subtitle={`리텐션: ${retentionRate.toFixed(1)}% | 성장: ${
                    mauGrowth >= 0 ? "+" : ""
                }${mauGrowth.toFixed(1)}%`}
            />

            <DataCard
                title="Stickiness"
                value={`${stickiness.toFixed(1)}%`}
                icon={Target}
                subtitle="DAU/MAU 비율"
            />

            <DataCard
                title="New Users"
                value={formatNumber(latestDAU?.newUsers || 0)}
                icon={Star}
                subtitle="오늘 신규 가입"
            />

            <DataCard
                title="Wallets"
                value={formatNumber(metrics?.totalWallets || 0)}
                icon={Wallet}
                subtitle={`활성: ${formatNumber(metrics?.activeWallets || 0)}`}
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
    // 개선된 DAU 데이터로 트렌드 시각화 (추가 메트릭 포함)
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
            newUserRate: item.newUserRate || 0,
            retentionRate: item.retentionRate || 0,
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

// 시간대 정보 타입
interface TimezoneInfo {
    value: string;
    label: string;
    country: string;
    utcOffset: string;
}

const TIMEZONE_OPTIONS: TimezoneInfo[] = [
    {
        value: "Asia/Seoul",
        label: "한국 시간 (KST)",
        country: "🇰🇷 한국",
        utcOffset: "UTC+9",
    },
    {
        value: "Africa/Lagos",
        label: "나이지리아 시간 (WAT)",
        country: "🇳🇬 나이지리아",
        utcOffset: "UTC+1",
    },
    {
        value: "Asia/Taipei",
        label: "대만 시간 (CST)",
        country: "🇹🇼 대만",
        utcOffset: "UTC+8",
    },
    {
        value: "Asia/Dhaka",
        label: "방글라데시 시간 (BST)",
        country: "🇧🇩 방글라데시",
        utcOffset: "UTC+6",
    },
    {
        value: "Asia/Ho_Chi_Minh",
        label: "베트남 시간 (ICT)",
        country: "🇻🇳 베트남",
        utcOffset: "UTC+7",
    },
    {
        value: "Asia/Singapore",
        label: "싱가포르 시간 (SGT)",
        country: "🇸🇬 싱가포르",
        utcOffset: "UTC+8",
    },
    {
        value: "Europe/London",
        label: "영국 시간 (GMT/BST)",
        country: "🇬🇧 영국",
        utcOffset: "UTC+0/+1",
    },
    {
        value: "Asia/Kolkata",
        label: "인도 시간 (IST)",
        country: "🇮🇳 인도",
        utcOffset: "UTC+5:30",
    },
    {
        value: "Asia/Jakarta",
        label: "인도네시아 시간 (WIB)",
        country: "🇮🇩 인도네시아",
        utcOffset: "UTC+7",
    },
    {
        value: "Asia/Tokyo",
        label: "일본 시간 (JST)",
        country: "🇯🇵 일본",
        utcOffset: "UTC+9",
    },
    {
        value: "Asia/Shanghai",
        label: "중국 시간 (CST)",
        country: "🇨🇳 중국",
        utcOffset: "UTC+8",
    },
    {
        value: "Asia/Karachi",
        label: "파키스탄 시간 (PKT)",
        country: "🇵🇰 파키스탄",
        utcOffset: "UTC+5",
    },
    {
        value: "Europe/Paris",
        label: "프랑스 시간 (CET)",
        country: "🇫🇷 프랑스",
        utcOffset: "UTC+1/+2",
    },
    {
        value: "Asia/Manila",
        label: "필리핀 시간 (PST)",
        country: "🇵🇭 필리핀",
        utcOffset: "UTC+8",
    },
    {
        value: "Australia/Sydney",
        label: "호주 시간 (AEST)",
        country: "🇦🇺 호주",
        utcOffset: "UTC+10/+11",
    },
    {
        value: "America/Chicago",
        label: "미국 중부 시간 (CST/CDT)",
        country: "🇺🇸 미국 중부",
        utcOffset: "UTC-6/-5",
    },
    {
        value: "America/Los_Angeles",
        label: "미국 서부 시간 (PST/PDT)",
        country: "🇺🇸 미국 서부",
        utcOffset: "UTC-8/-7",
    },
    {
        value: "America/New_York",
        label: "미국 동부 시간 (EST/EDT)",
        country: "🇺🇸 미국 동부",
        utcOffset: "UTC-5/-4",
    },
    {
        value: "UTC",
        label: "협정세계시 (UTC)",
        country: "🌍 국제 표준",
        utcOffset: "UTC+0",
    },
];

// UTC 시간을 선택된 시간대로 변환하는 함수
function convertToTimezone(utcHour: number, targetTimezone: string): number {
    const utcDate = new Date();
    utcDate.setUTCHours(utcHour, 0, 0, 0);

    const targetDate = new Date(
        utcDate.toLocaleString("en-US", { timeZone: targetTimezone })
    );
    return targetDate.getHours();
}

// 요일을 선택된 시간대로 변환하는 함수 (날짜 변경선 고려)
function convertDayToTimezone(
    utcDay: number,
    utcHour: number,
    targetTimezone: string
): number {
    // 이번 주의 해당 요일로 날짜 설정
    const now = new Date();
    const currentDay = now.getUTCDay();
    const daysFromToday = utcDay - currentDay;

    const utcDate = new Date(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + daysFromToday
    );
    utcDate.setUTCHours(utcHour, 0, 0, 0);

    const targetDate = new Date(
        utcDate.toLocaleString("en-US", { timeZone: targetTimezone })
    );
    return targetDate.getDay();
}

// Activity Patterns Analysis Component
interface ActivityPatternsProps {
    hourlyData: any[];
    dailyData: any[];
    timePeriod: string;
}

function ActivityPatternsAnalysis({
    hourlyData,
    dailyData,
    timePeriod,
}: ActivityPatternsProps) {
    const [selectedTimezone, setSelectedTimezone] =
        useState<string>("Asia/Seoul");

    // 선택된 시간대 정보 찾기
    const currentTimezone = TIMEZONE_OPTIONS.find(
        (tz) => tz.value === selectedTimezone
    );

    // 시간대 변환된 시간별 데이터 생성
    const hourlyChartData = useMemo(() => {
        if (!hourlyData) return [];

        // 24시간 배열 초기화
        const convertedData = Array.from({ length: 24 }, (_, index) => ({
            hour: index,
            activity: 0,
            label:
                index === 0
                    ? "자정"
                    : index === 6
                    ? "오전 6시"
                    : index === 12
                    ? "정오"
                    : index === 18
                    ? "오후 6시"
                    : `${index}시`,
            hourDisplay: `${index}:00`,
        }));

        // UTC 시간을 선택된 시간대로 변환하여 데이터 매핑
        hourlyData.forEach((item, utcHour) => {
            const localHour = convertToTimezone(utcHour, selectedTimezone);
            convertedData[localHour].activity += item?.activityCount || 0;
        });

        return convertedData;
    }, [hourlyData, selectedTimezone]);

    const dayNames = useMemo(
        () => [
            "일요일",
            "월요일",
            "화요일",
            "수요일",
            "목요일",
            "금요일",
            "토요일",
        ],
        []
    );

    // 시간대 변환된 요일별 데이터 생성
    const dailyChartData = useMemo(() => {
        if (!dailyData) return [];

        // 7일 배열 초기화
        const convertedData = Array.from({ length: 7 }, (_, index) => ({
            day: dayNames[index],
            dayNumber: index,
            activity: 0,
            isWeekend: index === 0 || index === 6,
        }));

        // 시간대 변환 (날짜 변경선 고려)
        dailyData.forEach((item, utcDay) => {
            // 대표적으로 정오(12시)를 기준으로 요일 변환 계산
            const localDay = convertDayToTimezone(utcDay, 12, selectedTimezone);
            convertedData[localDay].activity += item?.activityCount || 0;
        });

        return convertedData;
    }, [dailyData, selectedTimezone, dayNames]);

    const maxHourlyActivity = Math.max(
        ...hourlyChartData.map((d: any) => d.activity)
    );
    const maxDailyActivity = Math.max(
        ...dailyChartData.map((d: any) => d.activity)
    );

    const peakHour = hourlyChartData.find(
        (d) => d.activity === maxHourlyActivity
    );
    const peakDay = dailyChartData.find((d) => d.activity === maxDailyActivity);

    const CustomHourlyTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 shadow-xl">
                    <p className="font-semibold text-white mb-2">
                        {data.label}
                    </p>
                    <p className="text-purple-400">
                        <span className="font-medium">활성 사용자:</span>{" "}
                        {formatNumber(data.activity)}
                    </p>
                </div>
            );
        }
        return null;
    };

    const CustomDailyTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 shadow-xl">
                    <p className="font-semibold text-white mb-2">{data.day}</p>
                    <p className="text-emerald-400">
                        <span className="font-medium">활성 사용자:</span>{" "}
                        {formatNumber(data.activity)}
                    </p>
                    {data.isWeekend && (
                        <p className="text-slate-400 text-sm">주말</p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* 시간대 선택 섹션 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                        활동 패턴 분석
                    </h3>
                    <p className="text-sm text-slate-400">
                        선택한 시간대 기준으로 사용자 활동 패턴을 분석합니다
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="text-sm text-slate-300">
                        <span className="font-medium">현재 시간대:</span>
                        <br className="sm:hidden" />
                        <span className="text-purple-400 ml-1">
                            {currentTimezone?.country} (
                            {currentTimezone?.utcOffset})
                        </span>
                    </div>

                    <Select
                        value={selectedTimezone}
                        onValueChange={setSelectedTimezone}
                    >
                        <SelectTrigger className="w-[280px] bg-slate-800 border-slate-600 text-slate-200">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600 max-h-60">
                            {TIMEZONE_OPTIONS.map((timezone) => (
                                <SelectItem
                                    key={timezone.value}
                                    value={timezone.value}
                                    className="text-slate-200 hover:bg-slate-700"
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {timezone.country}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {timezone.label} •{" "}
                                            {timezone.utcOffset}
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <ChartCard title="시간대별 활동 패턴">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400">
                                    최근 {timePeriod}일 기준
                                </p>
                                {peakHour && (
                                    <p className="text-sm text-purple-400 font-medium">
                                        피크 시간: {peakHour.label} (
                                        {formatNumber(peakHour.activity)}명)
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={hourlyChartData}
                                    margin={{
                                        top: 20,
                                        right: 30,
                                        left: 20,
                                        bottom: 5,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#374151"
                                    />
                                    <XAxis
                                        dataKey="hourDisplay"
                                        fontSize={11}
                                        tick={{ fill: "#9CA3AF" }}
                                        interval={2}
                                    />
                                    <YAxis
                                        fontSize={12}
                                        tick={{ fill: "#9CA3AF" }}
                                        tickFormatter={(value) =>
                                            formatNumber(value)
                                        }
                                    />
                                    <Tooltip
                                        content={<CustomHourlyTooltip />}
                                    />
                                    <Bar
                                        dataKey="activity"
                                        fill="#8b5cf6"
                                        radius={[2, 2, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="text-xs text-slate-400 space-y-1">
                            <p>
                                • 현재 시간대:{" "}
                                <span className="text-purple-300">
                                    {currentTimezone?.label}
                                </span>
                            </p>
                            <p>
                                • UTC에서 {currentTimezone?.utcOffset}로 변환된
                                데이터
                            </p>
                        </div>
                    </div>
                </ChartCard>

                <ChartCard title="요일별 활동 패턴">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400">
                                    최근 {timePeriod}일 기준
                                </p>
                                {peakDay && (
                                    <p className="text-sm text-emerald-400 font-medium">
                                        가장 활발한 요일: {peakDay.day} (
                                        {formatNumber(peakDay.activity)}명)
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={dailyChartData}
                                    margin={{
                                        top: 20,
                                        right: 30,
                                        left: 20,
                                        bottom: 5,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#374151"
                                    />
                                    <XAxis
                                        dataKey="day"
                                        fontSize={12}
                                        tick={{ fill: "#9CA3AF" }}
                                    />
                                    <YAxis
                                        fontSize={12}
                                        tick={{ fill: "#9CA3AF" }}
                                        tickFormatter={(value) =>
                                            formatNumber(value)
                                        }
                                    />
                                    <Tooltip content={<CustomDailyTooltip />} />
                                    <Bar
                                        dataKey="activity"
                                        radius={[2, 2, 0, 0]}
                                    >
                                        {dailyChartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={
                                                    entry.isWeekend
                                                        ? "#f59e0b"
                                                        : "#10b981"
                                                }
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="text-xs text-slate-400 space-y-1">
                            <p>• {currentTimezone?.country} 기준 요일별 분석</p>
                        </div>
                    </div>
                </ChartCard>
            </div>
        </div>
    );
}

// Web3 Ecosystem Metrics with Asset Rankings
interface Web3MetricsProps {
    walletMetrics: any;
    networkData: any;
    assetRankingData: any;
}

function Web3EcosystemMetrics({
    walletMetrics,
    assetRankingData,
}: Web3MetricsProps) {
    const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
    const [showRankings, setShowRankings] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [showPagination, setShowPagination] = useState(false);
    const pageSize = 20;

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
    ];

    // Get ranking data for selected asset
    const selectedAssetData = selectedAsset
        ? assetRankingData?.find(
              (asset: any) => asset.assetId === selectedAsset
          )
        : assetRankingData?.[0];

    // Selected asset ID for pagination
    const selectedAssetId =
        selectedAsset ||
        (assetRankingData?.length > 0 ? assetRankingData[0].assetId : null);

    // Get paginated data for selected asset
    const {
        data: paginatedData,
        isLoading: isPaginatedLoading,
        isError: isPaginatedError,
        error: paginatedError,
    } = useAssetHoldingRankingPaginated(
        selectedAssetId || "",
        currentPage,
        pageSize
    );

    // Reset page when asset changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedAsset]);

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-400" />;
        if (rank === 2) return <Trophy className="h-4 w-4 text-slate-400" />;
        if (rank === 3) return <Trophy className="h-4 w-4 text-amber-600" />;
        return (
            <span className="text-sm font-medium text-slate-400">{rank}</span>
        );
    };

    return (
        <ChartCard title="Assets">
            <div className="space-y-6">
                {/* Asset Metrics */}
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

                {/* Asset Rankings Toggle */}
                {assetRankingData && assetRankingData.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold text-white">
                                Asset Rankings
                            </h4>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowRankings(!showRankings)}
                                className="text-slate-300 border-slate-600 hover:bg-slate-700"
                            >
                                {showRankings ? (
                                    <>
                                        Hide Rankings
                                        <ChevronUp className="h-4 w-4 ml-1" />
                                    </>
                                ) : (
                                    <>
                                        Show Rankings
                                        <ChevronDown className="h-4 w-4 ml-1" />
                                    </>
                                )}
                            </Button>
                        </div>

                        {showRankings && (
                            <div className="space-y-4">
                                {/* Asset Selection */}
                                <div className="flex gap-2 flex-wrap">
                                    {assetRankingData
                                        .slice(0, 5)
                                        .map((asset: any) => (
                                            <button
                                                key={asset.assetId}
                                                onClick={() =>
                                                    setSelectedAsset(
                                                        asset.assetId
                                                    )
                                                }
                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                                                    selectedAsset ===
                                                        asset.assetId ||
                                                    (!selectedAsset &&
                                                        asset ===
                                                            assetRankingData[0])
                                                        ? "bg-slate-700 border-slate-600 text-white"
                                                        : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                                                }`}
                                            >
                                                <AssetIcon asset={asset} />
                                                <span className="text-sm font-medium">
                                                    {asset.name ||
                                                        asset.symbol ||
                                                        `Asset #${asset.assetId}`}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {formatNumber(
                                                        asset.totalHolders
                                                    )}
                                                </Badge>
                                            </button>
                                        ))}
                                </div>

                                {/* Top Holders Display */}
                                {selectedAssetData && (
                                    <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h5 className="font-semibold text-white">
                                                    {selectedAssetData.name ||
                                                        selectedAssetData.symbol}
                                                </h5>
                                                <p className="text-sm text-slate-400">
                                                    Total Holders:{" "}
                                                    {formatNumber(
                                                        selectedAssetData.totalHolders
                                                    )}{" "}
                                                    • Total Supply:{" "}
                                                    {formatNumber(
                                                        selectedAssetData.totalBalance
                                                    )}
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setShowPagination(
                                                        !showPagination
                                                    )
                                                }
                                                className="text-slate-300 border-slate-600 hover:bg-slate-700"
                                            >
                                                {showPagination
                                                    ? "Show Top 5"
                                                    : "View All"}
                                            </Button>
                                        </div>

                                        {!showPagination ? (
                                            <div className="space-y-2">
                                                {selectedAssetData.topHolders
                                                    ?.slice(0, 5)
                                                    .map(
                                                        (
                                                            holder: any,
                                                            index: number
                                                        ) => (
                                                            <div
                                                                key={
                                                                    holder.playerId
                                                                }
                                                                className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-colors"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-700">
                                                                        {getRankIcon(
                                                                            index +
                                                                                1
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-medium text-slate-200">
                                                                            {holder.nickname ||
                                                                                holder.playerName ||
                                                                                holder.userName ||
                                                                                `Player #${holder.playerId.slice(
                                                                                    -6
                                                                                )}`}
                                                                        </p>
                                                                        <p className="text-xs text-slate-400">
                                                                            {holder.percentage?.toFixed(
                                                                                2
                                                                            ) ||
                                                                                "0.00"}
                                                                            % of
                                                                            total
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-sm font-medium text-white">
                                                                        {formatNumber(
                                                                            holder.balance
                                                                        )}
                                                                    </p>
                                                                    <div className="w-16 bg-slate-700 rounded-full h-1.5">
                                                                        <div
                                                                            className="bg-purple-500 h-1.5 rounded-full"
                                                                            style={{
                                                                                width: `${Math.min(
                                                                                    holder.percentage ||
                                                                                        0,
                                                                                    100
                                                                                )}%`,
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {/* Paginated Holders Display */}
                                                {isPaginatedError ? (
                                                    <div className="text-center py-8">
                                                        <p className="text-red-400">
                                                            Error loading data.
                                                            Please try again.
                                                        </p>
                                                        <p className="text-slate-400 text-sm mt-1">
                                                            {
                                                                paginatedError?.message
                                                            }
                                                        </p>
                                                    </div>
                                                ) : isPaginatedLoading ? (
                                                    <div className="text-center py-8">
                                                        <div className="inline-flex items-center gap-2 text-slate-400">
                                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
                                                            Loading data...
                                                        </div>
                                                    </div>
                                                ) : paginatedData ? (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <h6 className="font-semibold text-white">
                                                                    {paginatedData
                                                                        .asset
                                                                        .name ||
                                                                        paginatedData
                                                                            .asset
                                                                            .symbol}
                                                                </h6>
                                                                <p className="text-sm text-slate-400">
                                                                    Total
                                                                    Holders:{" "}
                                                                    {formatNumber(
                                                                        paginatedData
                                                                            .asset
                                                                            .totalHolders
                                                                    )}{" "}
                                                                    • Total
                                                                    Supply:{" "}
                                                                    {formatNumber(
                                                                        paginatedData
                                                                            .asset
                                                                            .totalBalance
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <div className="text-sm text-slate-400">
                                                                {(
                                                                    (currentPage -
                                                                        1) *
                                                                        pageSize +
                                                                    1
                                                                ).toLocaleString()}{" "}
                                                                -
                                                                {Math.min(
                                                                    currentPage *
                                                                        pageSize,
                                                                    paginatedData
                                                                        .asset
                                                                        .totalHolders
                                                                ).toLocaleString()}{" "}
                                                                /
                                                                {paginatedData.asset.totalHolders.toLocaleString()}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            {paginatedData.holders.map(
                                                                (
                                                                    holder: any
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            holder.playerId
                                                                        }
                                                                        className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-colors"
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-700">
                                                                                {getRankIcon(
                                                                                    holder.rank
                                                                                )}
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-sm font-medium text-slate-200">
                                                                                    {holder.nickname ||
                                                                                        holder.playerName ||
                                                                                        holder.userName ||
                                                                                        `Player #${holder.playerId.slice(
                                                                                            -6
                                                                                        )}`}
                                                                                </p>
                                                                                <p className="text-xs text-slate-400">
                                                                                    {holder.percentage.toFixed(
                                                                                        2
                                                                                    )}

                                                                                    %
                                                                                    of
                                                                                    total
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-sm font-medium text-white">
                                                                                {formatNumber(
                                                                                    holder.balance
                                                                                )}
                                                                            </p>
                                                                            <div className="w-16 bg-slate-700 rounded-full h-1.5">
                                                                                <div
                                                                                    className="bg-purple-500 h-1.5 rounded-full"
                                                                                    style={{
                                                                                        width: `${Math.min(
                                                                                            holder.percentage,
                                                                                            100
                                                                                        )}%`,
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>

                                                        {/* Pagination */}
                                                        {paginatedData
                                                            .pagination
                                                            .totalPages > 1 && (
                                                            <Pagination
                                                                currentPage={
                                                                    paginatedData
                                                                        .pagination
                                                                        .currentPage
                                                                }
                                                                totalPages={
                                                                    paginatedData
                                                                        .pagination
                                                                        .totalPages
                                                                }
                                                                onPageChange={
                                                                    setCurrentPage
                                                                }
                                                                hasNextPage={
                                                                    paginatedData
                                                                        .pagination
                                                                        .hasNextPage
                                                                }
                                                                hasPrevPage={
                                                                    paginatedData
                                                                        .pagination
                                                                        .hasPrevPage
                                                                }
                                                            />
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8 text-slate-400">
                                                        No holder data available
                                                        for this asset.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
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

    // Fetch asset ranking data
    const { holdingRanking } = useUserDashboardAssetAnalysis();

    // Fetch activity patterns data
    const { data: hourlyData, isLoading: isHourlyLoading } = useHourlyActivity(
        Number(timePeriod) as 7 | 30 | 90
    );
    const { data: dailyData, isLoading: isDailyLoading } = useDailyActivity(
        Number(timePeriod) as 7 | 30 | 90
    );

    // Filter DAU/MAU data after July 7, 2025
    const filteredDauData = filterDataAfterDate(dauData || [], "2025-07-07");
    const filteredMauData = filterDataAfterDate(mauData || [], "2025-07-07");

    const isLoading =
        metrics.isLoading ||
        network.isLoading ||
        !dauData ||
        !mauData ||
        holdingRanking.isLoading ||
        isHourlyLoading ||
        isDailyLoading;
    const isError =
        metrics.isError || network.isError || holdingRanking.isError;

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
                    dauData={filteredDauData}
                    mauData={filteredMauData}
                />

                {/* Growth Trends */}
                <GrowthTrends
                    dauData={filteredDauData}
                    mauData={filteredMauData}
                />

                {/* Activity Patterns Analysis */}
                <ActivityPatternsAnalysis
                    hourlyData={hourlyData || []}
                    dailyData={dailyData || []}
                    timePeriod={timePeriod}
                />

                {/* Web3 & Network Analytics */}
                <div>
                    <Web3EcosystemMetrics
                        walletMetrics={walletMetrics}
                        networkData={network.data}
                        assetRankingData={holdingRanking?.data || []}
                    />
                </div>
            </div>
        </div>
    );
}

export default AdminUsersDashboardAnalytics;
