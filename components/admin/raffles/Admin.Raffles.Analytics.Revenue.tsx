"use client";

import { useMemo } from "react";
import { useRaffles } from "@/app/actions/raffles/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DollarSignIcon,
    TrendingUpIcon,
    PieChartIcon,
    CalculatorIcon,
    AlertTriangleIcon,
    CheckCircleIcon,
} from "lucide-react";

interface AdminRafflesAnalyticsRevenueProps {
    raffleId: string;
}

export function AdminRafflesAnalyticsRevenue({
    raffleId,
}: AdminRafflesAnalyticsRevenueProps) {
    // 수익 분석 데이터 조회
    const { revenueAnalyticsData, isRevenueAnalyticsLoading } = useRaffles({
        revenueAnalyticsRaffleIds: [raffleId],
    });

    // 래플 상세 정보
    const { raffleData, isRaffleLoading } = useRaffles({
        getRaffleId: raffleId,
    });

    // 추가 분석 데이터 계산
    const revenueAnalysis = useMemo(() => {
        if (!revenueAnalyticsData?.data?.[0] || !raffleData?.data) {
            return null;
        }

        const revenue = revenueAnalyticsData.data[0];

        // 참가자당 수익성 분석
        const revenuePerParticipant =
            revenue.totalParticipants > 0
                ? revenue.totalRevenue / revenue.totalParticipants
                : 0;

        const costPerParticipant =
            revenue.totalParticipants > 0
                ? revenue.totalCosts / revenue.totalParticipants
                : 0;

        const profitPerParticipant = revenuePerParticipant - costPerParticipant;

        // 비용 구조 분석
        const costBreakdown = {
            prizeCosts: revenue.totalPrizeCost,
            operatingCosts: revenue.operatingCost,
            totalCosts: revenue.totalCosts,
        };

        const costPercentages = {
            prizeCostPercent:
                revenue.totalCosts > 0
                    ? (revenue.totalPrizeCost / revenue.totalCosts) * 100
                    : 0,
            operatingCostPercent:
                revenue.totalCosts > 0
                    ? (revenue.operatingCost / revenue.totalCosts) * 100
                    : 0,
        };

        // 수익성 등급 계산
        const getProfitabilityGrade = (margin: number) => {
            if (margin >= 50)
                return {
                    grade: "S",
                    color: "text-green-600",
                    bg: "bg-green-100",
                };
            if (margin >= 30)
                return {
                    grade: "A",
                    color: "text-blue-600",
                    bg: "bg-blue-100",
                };
            if (margin >= 15)
                return {
                    grade: "B",
                    color: "text-yellow-600",
                    bg: "bg-yellow-100",
                };
            if (margin >= 5)
                return {
                    grade: "C",
                    color: "text-orange-600",
                    bg: "bg-orange-100",
                };
            if (margin >= 0)
                return { grade: "D", color: "text-red-600", bg: "bg-red-100" };
            return { grade: "F", color: "text-red-800", bg: "bg-red-200" };
        };

        const profitabilityGrade = getProfitabilityGrade(revenue.profitMargin);

        // 시뮬레이션 데이터 (다른 참가비 설정 시나리오)
        const currentEntryFee = revenue.entryFeeAmount;
        const participantCount = revenue.totalParticipants;

        const scenarios = [
            { fee: currentEntryFee * 0.5, label: "50% 할인" },
            { fee: currentEntryFee * 0.8, label: "20% 할인" },
            { fee: currentEntryFee, label: "현재 설정" },
            { fee: currentEntryFee * 1.2, label: "20% 인상" },
            { fee: currentEntryFee * 1.5, label: "50% 인상" },
        ].map((scenario) => {
            const projectedRevenue = scenario.fee * participantCount;
            const projectedProfit = projectedRevenue - revenue.totalCosts;
            const projectedMargin =
                projectedRevenue > 0
                    ? (projectedProfit / projectedRevenue) * 100
                    : 0;

            return {
                ...scenario,
                projectedRevenue,
                projectedProfit,
                projectedMargin,
                grade: getProfitabilityGrade(projectedMargin),
            };
        });

        // 상품별 비용 효율성
        const prizeEfficiency = revenue.prizeDistribution.map((prize) => {
            const totalValue = prize.totalCost;
            const unitValue =
                prize.quantity > 0 ? prize.totalCost / prize.quantity : 0;
            const efficiency =
                revenue.totalRevenue > 0
                    ? (totalValue / revenue.totalRevenue) * 100
                    : 0;

            return {
                ...prize,
                unitValue,
                efficiency,
                isEfficient: efficiency <= 20, // 총 수익의 20% 이하면 효율적
            };
        });

        return {
            ...revenue,
            revenuePerParticipant,
            costPerParticipant,
            profitPerParticipant,
            costBreakdown,
            costPercentages,
            profitabilityGrade,
            scenarios,
            prizeEfficiency,
        };
    }, [revenueAnalyticsData, raffleData]);

    if (isRevenueAnalyticsLoading || isRaffleLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">수익성 분석 중...</div>
            </div>
        );
    }

    if (!revenueAnalysis) {
        return (
            <div className="text-center text-muted-foreground p-8">
                수익성 분석 데이터를 불러올 수 없습니다.
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("ko-KR").format(Math.round(amount));
    };

    const formatPercent = (value: number) => {
        return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">수익성 상세 분석</h3>
                <div className="flex items-center gap-2">
                    <div
                        className={`px-3 py-1 rounded-full text-sm font-bold ${revenueAnalysis.profitabilityGrade.bg} ${revenueAnalysis.profitabilityGrade.color}`}
                    >
                        {revenueAnalysis.profitabilityGrade.grade}등급
                    </div>
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">수익 개요</TabsTrigger>
                    <TabsTrigger value="structure">비용 구조</TabsTrigger>
                    <TabsTrigger value="efficiency">효율성 분석</TabsTrigger>
                    <TabsTrigger value="simulation">시나리오 분석</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    {/* 핵심 수익성 지표 */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    총 수익
                                </CardTitle>
                                <DollarSignIcon className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {formatCurrency(
                                        revenueAnalysis.totalRevenue
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    참가자{" "}
                                    {formatCurrency(
                                        revenueAnalysis.totalParticipants
                                    )}
                                    명
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    순이익
                                </CardTitle>
                                <TrendingUpIcon className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div
                                    className={`text-2xl font-bold ${
                                        revenueAnalysis.netProfit >= 0
                                            ? "text-green-600"
                                            : "text-red-600"
                                    }`}
                                >
                                    {formatCurrency(revenueAnalysis.netProfit)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    수익률:{" "}
                                    {formatPercent(
                                        revenueAnalysis.profitMargin
                                    )}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    ROI
                                </CardTitle>
                                <CalculatorIcon className="h-4 w-4 text-purple-600" />
                            </CardHeader>
                            <CardContent>
                                <div
                                    className={`text-2xl font-bold ${
                                        revenueAnalysis.roi >= 0
                                            ? "text-green-600"
                                            : "text-red-600"
                                    }`}
                                >
                                    {formatPercent(revenueAnalysis.roi)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    투자 대비 수익률
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    참가자당 수익
                                </CardTitle>
                                <DollarSignIcon className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                <div
                                    className={`text-2xl font-bold ${
                                        revenueAnalysis.profitPerParticipant >=
                                        0
                                            ? "text-green-600"
                                            : "text-red-600"
                                    }`}
                                >
                                    {formatCurrency(
                                        revenueAnalysis.profitPerParticipant
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    평균 순이익
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 수익 vs 비용 비교 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>수익 vs 비용 분석</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">
                                        총 수익
                                    </span>
                                    <span className="font-bold text-green-600">
                                        {formatCurrency(
                                            revenueAnalysis.totalRevenue
                                        )}
                                    </span>
                                </div>
                                <Progress value={100} className="h-3" />

                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">
                                        총 비용
                                    </span>
                                    <span className="font-bold text-red-600">
                                        -
                                        {formatCurrency(
                                            revenueAnalysis.totalCosts
                                        )}
                                    </span>
                                </div>
                                <Progress
                                    value={
                                        revenueAnalysis.totalRevenue > 0
                                            ? (revenueAnalysis.totalCosts /
                                                  revenueAnalysis.totalRevenue) *
                                              100
                                            : 0
                                    }
                                    className="h-3"
                                />

                                <div className="flex items-center justify-between border-t pt-2">
                                    <span className="text-base font-semibold">
                                        순이익
                                    </span>
                                    <span
                                        className={`text-xl font-bold ${
                                            revenueAnalysis.netProfit >= 0
                                                ? "text-green-600"
                                                : "text-red-600"
                                        }`}
                                    >
                                        {revenueAnalysis.netProfit >= 0
                                            ? "+"
                                            : ""}
                                        {formatCurrency(
                                            revenueAnalysis.netProfit
                                        )}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="structure" className="space-y-4">
                    {/* 비용 구조 분석 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PieChartIcon className="w-5 h-5" />
                                비용 구조 분석
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">
                                        상품 비용
                                    </span>
                                    <div className="text-right">
                                        <div className="font-bold">
                                            {formatCurrency(
                                                revenueAnalysis.costBreakdown
                                                    .prizeCosts
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {revenueAnalysis.costPercentages.prizeCostPercent.toFixed(
                                                1
                                            )}
                                            %
                                        </div>
                                    </div>
                                </div>
                                <Progress
                                    value={
                                        revenueAnalysis.costPercentages
                                            .prizeCostPercent
                                    }
                                    className="h-2"
                                />

                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">
                                        운영 비용
                                    </span>
                                    <div className="text-right">
                                        <div className="font-bold">
                                            {formatCurrency(
                                                revenueAnalysis.costBreakdown
                                                    .operatingCosts
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {revenueAnalysis.costPercentages.operatingCostPercent.toFixed(
                                                1
                                            )}
                                            %
                                        </div>
                                    </div>
                                </div>
                                <Progress
                                    value={
                                        revenueAnalysis.costPercentages
                                            .operatingCostPercent
                                    }
                                    className="h-2"
                                />

                                <div className="flex items-center justify-between border-t pt-2">
                                    <span className="text-base font-semibold">
                                        총 비용
                                    </span>
                                    <div className="text-right">
                                        <div className="text-xl font-bold">
                                            {formatCurrency(
                                                revenueAnalysis.costBreakdown
                                                    .totalCosts
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            100%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 단위 경제학 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>단위 경제학 (참가자당)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-green-600">
                                        {formatCurrency(
                                            revenueAnalysis.revenuePerParticipant
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        수익
                                    </div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-red-600">
                                        -
                                        {formatCurrency(
                                            revenueAnalysis.costPerParticipant
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        비용
                                    </div>
                                </div>
                                <div>
                                    <div
                                        className={`text-2xl font-bold ${
                                            revenueAnalysis.profitPerParticipant >=
                                            0
                                                ? "text-green-600"
                                                : "text-red-600"
                                        }`}
                                    >
                                        {revenueAnalysis.profitPerParticipant >=
                                        0
                                            ? "+"
                                            : ""}
                                        {formatCurrency(
                                            revenueAnalysis.profitPerParticipant
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        순이익
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="efficiency" className="space-y-4">
                    {/* 상품별 비용 효율성 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>상품별 비용 효율성</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {revenueAnalysis.prizeEfficiency.map(
                                    (prize, index) => (
                                        <div
                                            key={index}
                                            className="border rounded-lg p-4"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium">
                                                    {prize.prizeName}
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    {prize.isEfficient ? (
                                                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                                    ) : (
                                                        <AlertTriangleIcon className="w-4 h-4 text-amber-600" />
                                                    )}
                                                    <Badge
                                                        variant={
                                                            prize.isEfficient
                                                                ? "default"
                                                                : "secondary"
                                                        }
                                                    >
                                                        {prize.isEfficient
                                                            ? "효율적"
                                                            : "검토 필요"}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">
                                                        총 비용:
                                                    </span>
                                                    <div className="font-medium">
                                                        {formatCurrency(
                                                            prize.totalCost
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">
                                                        개당 비용:
                                                    </span>
                                                    <div className="font-medium">
                                                        {formatCurrency(
                                                            prize.unitValue
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">
                                                        수익 대비:
                                                    </span>
                                                    <div className="font-medium">
                                                        {prize.efficiency.toFixed(
                                                            1
                                                        )}
                                                        %
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-2">
                                                <Progress
                                                    value={prize.efficiency}
                                                    className="h-1.5"
                                                />
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="simulation" className="space-y-4">
                    {/* 참가비 시나리오 분석 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>참가비 시나리오 분석</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {revenueAnalysis.scenarios.map(
                                    (scenario, index) => (
                                        <div
                                            key={index}
                                            className="border rounded-lg p-4"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium">
                                                        {scenario.label}
                                                    </h4>
                                                    <Badge variant="outline">
                                                        {formatCurrency(
                                                            scenario.fee
                                                        )}
                                                    </Badge>
                                                </div>
                                                <div
                                                    className={`px-2 py-1 rounded text-sm font-bold ${scenario.grade.bg} ${scenario.grade.color}`}
                                                >
                                                    {scenario.grade.grade}등급
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">
                                                        예상 수익:
                                                    </span>
                                                    <div className="font-medium text-green-600">
                                                        {formatCurrency(
                                                            scenario.projectedRevenue
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">
                                                        예상 순이익:
                                                    </span>
                                                    <div
                                                        className={`font-medium ${
                                                            scenario.projectedProfit >=
                                                            0
                                                                ? "text-green-600"
                                                                : "text-red-600"
                                                        }`}
                                                    >
                                                        {scenario.projectedProfit >=
                                                        0
                                                            ? "+"
                                                            : ""}
                                                        {formatCurrency(
                                                            scenario.projectedProfit
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">
                                                        수익률:
                                                    </span>
                                                    <div
                                                        className={`font-medium ${
                                                            scenario.projectedMargin >=
                                                            0
                                                                ? "text-green-600"
                                                                : "text-red-600"
                                                        }`}
                                                    >
                                                        {formatPercent(
                                                            scenario.projectedMargin
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
