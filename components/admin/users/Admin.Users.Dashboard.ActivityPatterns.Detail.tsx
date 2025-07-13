"use client";

import { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Activity,
    Clock,
    Calendar,
    Timer,
    BarChart3,
    Target,
    Zap,
} from "lucide-react";

// 🎯 hooks import
import { useUserDashboardActivityPatterns } from "@/app/actions/userDashboard/hooks";
import type { UserDashboardGrowthPeriod } from "@/app/actions/userDashboard/queryKeys";

// 🔧 공통 컴포넌트 import
import { MetricCard, DashboardLoading, DashboardError } from "./shared";
import {
    getTimeLabel,
    getDayLabel,
    getDayShortLabel,
    getActivityIntensity,
    formatNumber,
    getAgeGroupColor,
} from "./shared";

// ⏰ 시간대별 활동 차트 컴포넌트
interface HourlyActivityChartProps {
    data: Array<{
        hour: number;
        activityCount: number;
    }>;
}

function HourlyActivityChart({ data }: HourlyActivityChartProps) {
    const maxActivity = Math.max(...data.map((d) => d.activityCount));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    시간대별 활동 패턴
                </CardTitle>
                <CardDescription>24시간 기준 사용자 활동 분포</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* 시간대 히트맵 */}
                    <div className="grid grid-cols-12 gap-1">
                        {data.map((item) => (
                            <div key={item.hour} className="text-center">
                                <div
                                    className={`h-8 rounded flex items-center justify-center text-white text-xs font-medium ${getActivityIntensity(
                                        item.activityCount,
                                        maxActivity
                                    )}`}
                                    title={`${getTimeLabel(item.hour)}: ${
                                        item.activityCount
                                    } 활동`}
                                >
                                    {item.hour}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {formatNumber(item.activityCount)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 피크 시간대 분석 */}
                    <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">피크 시간대</h4>
                        <div className="grid grid-cols-2 gap-4">
                            {data
                                .sort(
                                    (a, b) => b.activityCount - a.activityCount
                                )
                                .slice(0, 4)
                                .map((item, index) => (
                                    <div
                                        key={item.hour}
                                        className="flex items-center gap-2"
                                    >
                                        <Badge
                                            variant={
                                                index === 0
                                                    ? "default"
                                                    : "secondary"
                                            }
                                        >
                                            #{index + 1}
                                        </Badge>
                                        <span className="text-sm">
                                            {getTimeLabel(item.hour)}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            {item.activityCount}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// 📅 요일별 활동 차트 컴포넌트
interface DailyActivityChartProps {
    data: Array<{
        dayOfWeek: number;
        activityCount: number;
    }>;
}

function DailyActivityChart({ data }: DailyActivityChartProps) {
    const maxActivity = Math.max(...data.map((d) => d.activityCount));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    요일별 활동 패턴
                </CardTitle>
                <CardDescription>주간 사용자 활동 분포</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.map((item) => {
                        const percentage =
                            maxActivity > 0
                                ? (item.activityCount / maxActivity) * 100
                                : 0;
                        const isWeekend =
                            item.dayOfWeek === 0 || item.dayOfWeek === 6;

                        return (
                            <div key={item.dayOfWeek} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium w-16">
                                            {getDayShortLabel(item.dayOfWeek)}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            {getDayLabel(item.dayOfWeek)}
                                        </span>
                                        {isWeekend && (
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                주말
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">
                                            {formatNumber(item.activityCount)}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            {Math.round(percentage)}%
                                        </Badge>
                                    </div>
                                </div>
                                <div className="relative">
                                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${
                                                isWeekend
                                                    ? "bg-purple-500"
                                                    : "bg-blue-500"
                                            }`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

// 👴 지갑 연령대별 분포 컴포넌트
interface WalletAgeDistributionProps {
    data: Array<{
        ageGroup: string;
        walletCount: number;
    }>;
}

function WalletAgeDistribution({ data }: WalletAgeDistributionProps) {
    const total = data.reduce((sum, item) => sum + item.walletCount, 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Timer className="h-5 w-5" />
                    지갑 연령대별 분포
                </CardTitle>
                <CardDescription>지갑 생성 시점 기준 분포</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.map((item) => {
                        const percentage =
                            total > 0 ? (item.walletCount / total) * 100 : 0;
                        return (
                            <div key={item.ageGroup} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`w-3 h-3 rounded-full ${getAgeGroupColor(
                                                item.ageGroup
                                            )}`}
                                        />
                                        <span className="text-sm font-medium">
                                            {item.ageGroup}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">
                                            {formatNumber(item.walletCount)}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            {Math.round(percentage)}%
                                        </Badge>
                                    </div>
                                </div>
                                <div className="relative">
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${getAgeGroupColor(
                                                item.ageGroup
                                            )}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

// 🎯 상세 정보 컴포넌트
export function AdminUsersDashboardActivityPatternsDetail() {
    const [selectedPeriod, setSelectedPeriod] = useState<number>(30);

    const {
        hourlyActivity,
        dailyActivity,
        walletAgeDistribution,
        isLoading,
        isError,
    } = useUserDashboardActivityPatterns(
        selectedPeriod as UserDashboardGrowthPeriod
    );

    if (isLoading) {
        return <DashboardLoading title="활동 패턴 상세 정보" />;
    }

    if (isError) {
        return (
            <DashboardError
                title="활동 패턴 상세 정보 오류"
                message="활동 패턴 상세 데이터를 불러오는 중 오류가 발생했습니다."
            />
        );
    }

    // 활동 패턴 요약 계산
    const totalActivity =
        hourlyActivity?.reduce((sum, item) => sum + item.activityCount, 0) || 0;
    const peakHour = hourlyActivity?.reduce(
        (max, item) => (item.activityCount > max.activityCount ? item : max),
        { hour: 0, activityCount: 0 }
    );
    const peakDay = dailyActivity?.reduce(
        (max, item) => (item.activityCount > max.activityCount ? item : max),
        { dayOfWeek: 0, activityCount: 0 }
    );

    return (
        <div className="space-y-6">
            {/* 📊 헤더 */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold">
                        활동 패턴 상세 정보
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        시간대별, 요일별 사용자 활동 패턴 분석
                    </p>
                </div>
                <Select
                    value={selectedPeriod.toString()}
                    onValueChange={(value) => setSelectedPeriod(Number(value))}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="기간 선택" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">최근 7일</SelectItem>
                        <SelectItem value="30">최근 30일</SelectItem>
                        <SelectItem value="90">최근 90일</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* 🎯 활동 패턴 요약 */}
            <div className="grid gap-4 md:grid-cols-4">
                <MetricCard
                    title="총 활동 수"
                    value={totalActivity}
                    description={`${selectedPeriod}일 기간 내`}
                    icon={Activity}
                />

                <MetricCard
                    title="피크 시간대"
                    value={`${peakHour?.hour || 0}시`}
                    description={`${formatNumber(
                        peakHour?.activityCount || 0
                    )}회 활동`}
                    icon={Zap}
                />

                <MetricCard
                    title="최고 활동 요일"
                    value={`${getDayShortLabel(peakDay?.dayOfWeek || 0)}요일`}
                    description={`${formatNumber(
                        peakDay?.activityCount || 0
                    )}회 활동`}
                    icon={Calendar}
                />

                <MetricCard
                    title="평균 시간당 활동"
                    value={
                        hourlyActivity?.length
                            ? Math.round(totalActivity / hourlyActivity.length)
                            : 0
                    }
                    description="시간당 평균"
                    icon={BarChart3}
                />
            </div>

            {/* 📊 활동 패턴 차트 */}
            <div className="grid gap-6 md:grid-cols-2">
                <HourlyActivityChart data={hourlyActivity || []} />
                <DailyActivityChart data={dailyActivity || []} />
            </div>

            {/* 📈 추가 분석 */}
            <div className="grid gap-6 md:grid-cols-2">
                <WalletAgeDistribution data={walletAgeDistribution || []} />

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            활동 패턴 인사이트
                        </CardTitle>
                        <CardDescription>
                            주요 활동 패턴 분석 결과
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <h4 className="font-medium text-blue-900 mb-1">
                                    🕐 활동 시간대
                                </h4>
                                <p className="text-sm text-blue-800">
                                    가장 활발한 시간대는 {peakHour?.hour || 0}
                                    시이며, 이 시간대에{" "}
                                    {formatNumber(peakHour?.activityCount || 0)}
                                    회의 활동이 있었습니다.
                                </p>
                            </div>

                            <div className="p-3 bg-green-50 rounded-lg">
                                <h4 className="font-medium text-green-900 mb-1">
                                    📅 활동 요일
                                </h4>
                                <p className="text-sm text-green-800">
                                    {
                                        [
                                            "일",
                                            "월",
                                            "화",
                                            "수",
                                            "목",
                                            "금",
                                            "토",
                                        ][peakDay?.dayOfWeek || 0]
                                    }
                                    요일에 가장 높은 활동량을 보이며, 총{" "}
                                    {formatNumber(peakDay?.activityCount || 0)}
                                    회의 활동이 있었습니다.
                                </p>
                            </div>

                            <div className="p-3 bg-purple-50 rounded-lg">
                                <h4 className="font-medium text-purple-900 mb-1">
                                    📊 활동 강도
                                </h4>
                                <p className="text-sm text-purple-800">
                                    시간당 평균{" "}
                                    {formatNumber(
                                        hourlyActivity?.length
                                            ? Math.round(
                                                  totalActivity /
                                                      hourlyActivity.length
                                              )
                                            : 0
                                    )}
                                    회의 활동이 발생하고 있습니다.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default AdminUsersDashboardActivityPatternsDetail;
