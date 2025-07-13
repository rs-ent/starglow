"use client";

import { useMemo } from "react";
import { useRaffles } from "@/app/actions/raffles/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    ClockIcon,
    TrendingUpIcon,
    CalendarIcon,
    BarChart3Icon,
} from "lucide-react";

interface AdminRafflesAnalyticsTimelineProps {
    raffleId: string;
}

export function AdminRafflesAnalyticsTimeline({
    raffleId,
}: AdminRafflesAnalyticsTimelineProps) {
    // 래플 참가자 데이터 (최대한 많이 가져오기)
    const { raffleParticipantsData, isRaffleParticipantsLoading } = useRaffles({
        getRaffleParticipantsInput: { raffleId, limit: 1000 },
    });

    // 시간대별 분석 데이터 계산
    const timelineAnalysis = useMemo(() => {
        if (!raffleParticipantsData?.data?.participants) {
            return null;
        }

        const participants = raffleParticipantsData.data.participants;

        // 24시간 분포 계산
        const hourlyDistribution = Array(24).fill(0);

        // 요일별 분포 계산 (0=일요일, 6=토요일)
        const weeklyDistribution = Array(7).fill(0);
        const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

        // 일별 트렌드 (최근 30일)
        const dailyTrend: { [date: string]: number } = {};

        // 시간대별 당첨률
        const hourlyWinRate = Array(24)
            .fill(0)
            .map(() => ({ total: 0, wins: 0 }));

        participants.forEach((participant) => {
            const date = new Date(participant.createdAt);
            const hour = date.getHours();
            const weekday = date.getDay();
            const dateStr = date.toISOString().split("T")[0];

            // 시간별 분포
            hourlyDistribution[hour]++;

            // 요일별 분포
            weeklyDistribution[weekday]++;

            // 일별 트렌드
            dailyTrend[dateStr] = (dailyTrend[dateStr] || 0) + 1;

            // 시간대별 당첨률
            hourlyWinRate[hour].total++;
            if (participant.prize && participant.prize.prizeType !== "EMPTY") {
                hourlyWinRate[hour].wins++;
            }
        });

        // 피크 시간대 찾기
        const maxHourlyParticipants = Math.max(...hourlyDistribution);
        const peakHours = hourlyDistribution
            .map((count, hour) => ({ hour, count }))
            .filter((item) => item.count === maxHourlyParticipants)
            .map((item) => item.hour);

        // 가장 조용한 시간대
        const minHourlyParticipants = Math.min(
            ...hourlyDistribution.filter((count) => count > 0)
        );
        const quietHours = hourlyDistribution
            .map((count, hour) => ({ hour, count }))
            .filter(
                (item) => item.count === minHourlyParticipants && item.count > 0
            )
            .map((item) => item.hour);

        // 주말 vs 평일 비교
        const weekendTotal = weeklyDistribution[0] + weeklyDistribution[6]; // 일+토
        const weekdayTotal = weeklyDistribution
            .slice(1, 6)
            .reduce((sum, count) => sum + count, 0);

        // 최근 일별 트렌드 (최근 30일)
        const recentDates = Object.keys(dailyTrend)
            .sort()
            .slice(-30)
            .map((date) => ({
                date,
                count: dailyTrend[date],
                dayName: new Date(date).toLocaleDateString("ko-KR", {
                    weekday: "short",
                }),
            }));

        return {
            hourlyDistribution,
            weeklyDistribution,
            weekdays,
            dailyTrend: recentDates,
            hourlyWinRate: hourlyWinRate.map((item, hour) => ({
                hour,
                total: item.total,
                wins: item.wins,
                winRate: item.total > 0 ? (item.wins / item.total) * 100 : 0,
            })),
            peakHours,
            quietHours,
            weekendTotal,
            weekdayTotal,
            totalParticipants: participants.length,
        };
    }, [raffleParticipantsData]);

    if (isRaffleParticipantsLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">
                    참가 시간대 분석 중...
                </div>
            </div>
        );
    }

    if (!timelineAnalysis) {
        return (
            <div className="text-center text-muted-foreground p-8">
                시간대 분석 데이터를 불러올 수 없습니다.
            </div>
        );
    }

    const formatHour = (hour: number) => {
        return `${hour.toString().padStart(2, "0")}:00`;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("ko-KR").format(amount);
    };

    const getMaxValue = (array: number[]) => Math.max(...array) || 1;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">참가 시간대 분석</h3>
                <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-muted-foreground">
                        총 {formatCurrency(timelineAnalysis.totalParticipants)}
                        명 분석
                    </span>
                </div>
            </div>

            {/* 요약 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            피크 시간대
                        </CardTitle>
                        <TrendingUpIcon className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {timelineAnalysis.peakHours
                                .map((hour) => formatHour(hour))
                                .join(", ")}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            최고{" "}
                            {formatCurrency(
                                getMaxValue(timelineAnalysis.hourlyDistribution)
                            )}
                            명 참가
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            한적한 시간
                        </CardTitle>
                        <ClockIcon className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {timelineAnalysis.quietHours
                                .map((hour) => formatHour(hour))
                                .join(", ")}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            최소{" "}
                            {formatCurrency(
                                Math.min(
                                    ...timelineAnalysis.hourlyDistribution.filter(
                                        (c) => c > 0
                                    )
                                )
                            )}
                            명 참가
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            주말 참가율
                        </CardTitle>
                        <CalendarIcon className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(
                                (timelineAnalysis.weekendTotal /
                                    timelineAnalysis.totalParticipants) *
                                100
                            ).toFixed(1)}
                            %
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {formatCurrency(timelineAnalysis.weekendTotal)}명 /
                            전체
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            평일 참가율
                        </CardTitle>
                        <BarChart3Icon className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(
                                (timelineAnalysis.weekdayTotal /
                                    timelineAnalysis.totalParticipants) *
                                100
                            ).toFixed(1)}
                            %
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {formatCurrency(timelineAnalysis.weekdayTotal)}명 /
                            전체
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* 24시간 분포 */}
            <Card>
                <CardHeader>
                    <CardTitle>24시간 참가 분포</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {timelineAnalysis.hourlyDistribution.map(
                            (count, hour) => {
                                const percentage =
                                    (count /
                                        getMaxValue(
                                            timelineAnalysis.hourlyDistribution
                                        )) *
                                    100;
                                const winRate =
                                    timelineAnalysis.hourlyWinRate[hour]
                                        .winRate;

                                return (
                                    <div
                                        key={hour}
                                        className="flex items-center gap-4"
                                    >
                                        <div className="w-12 text-sm font-mono">
                                            {formatHour(hour)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>
                                                    {formatCurrency(count)}명
                                                </span>
                                                <span className="text-muted-foreground">
                                                    당첨률: {winRate.toFixed(1)}
                                                    %
                                                </span>
                                            </div>
                                            <Progress
                                                value={percentage}
                                                className="h-2"
                                            />
                                        </div>
                                        <div className="w-16 text-sm text-right">
                                            {percentage.toFixed(1)}%
                                        </div>
                                    </div>
                                );
                            }
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 요일별 분포 */}
            <Card>
                <CardHeader>
                    <CardTitle>요일별 참가 분포</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-7 gap-2">
                        {timelineAnalysis.weeklyDistribution.map(
                            (count, index) => {
                                const percentage =
                                    (count /
                                        getMaxValue(
                                            timelineAnalysis.weeklyDistribution
                                        )) *
                                    100;
                                const isWeekend = index === 0 || index === 6;

                                return (
                                    <div key={index} className="text-center">
                                        <div
                                            className={`text-sm font-medium mb-2 ${
                                                isWeekend
                                                    ? "text-purple-600"
                                                    : "text-foreground"
                                            }`}
                                        >
                                            {timelineAnalysis.weekdays[index]}
                                        </div>
                                        <div className="text-2xl font-bold mb-1">
                                            {formatCurrency(count)}
                                        </div>
                                        <div className="text-xs text-muted-foreground mb-2">
                                            {percentage.toFixed(1)}%
                                        </div>
                                        <Progress
                                            value={percentage}
                                            className="h-2"
                                        />
                                    </div>
                                );
                            }
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 일별 트렌드 (최근 30일) */}
            <Card>
                <CardHeader>
                    <CardTitle>최근 30일 참가 트렌드</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {timelineAnalysis.dailyTrend.map((day) => {
                            const maxDailyCount = Math.max(
                                ...timelineAnalysis.dailyTrend.map(
                                    (d) => d.count
                                )
                            );
                            const percentage =
                                (day.count / (maxDailyCount || 1)) * 100;

                            return (
                                <div
                                    key={day.date}
                                    className="flex items-center gap-4"
                                >
                                    <div className="w-20 text-sm">
                                        {new Date(day.date).toLocaleDateString(
                                            "ko-KR",
                                            {
                                                month: "short",
                                                day: "numeric",
                                            }
                                        )}
                                    </div>
                                    <div className="w-8 text-xs text-muted-foreground">
                                        {day.dayName}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>
                                                {formatCurrency(day.count)}명
                                            </span>
                                            <span className="text-muted-foreground">
                                                {percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                        <Progress
                                            value={percentage}
                                            className="h-1.5"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
