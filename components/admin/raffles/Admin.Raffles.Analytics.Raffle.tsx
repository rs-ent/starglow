"use client";

import { useState } from "react";
import { useRaffles } from "@/app/actions/raffles/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, TrendingUp, Package, Users } from "lucide-react";

interface AdminRafflesAnalyticsRaffleProps {
    raffleId: string;
}

export function AdminRafflesAnalyticsRaffle({
    raffleId,
}: AdminRafflesAnalyticsRaffleProps) {
    const [activeTab, setActiveTab] = useState("current");

    // 래플 상세 정보 (현재 활성 상품만)
    const { raffleData, isRaffleLoading } = useRaffles({
        getRaffleId: raffleId,
    });

    // 확률 분석 데이터 (모든 상품 포함)
    const { probabilityAnalyticsData, isProbabilityAnalyticsLoading } =
        useRaffles({
            probabilityAnalyticsRaffleIds: [raffleId],
        });

    if (isRaffleLoading || isProbabilityAnalyticsLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">
                    상품 분석 데이터를 불러오는 중...
                </div>
            </div>
        );
    }

    const raffle = raffleData?.data;
    const probabilityData = probabilityAnalyticsData?.data?.[0];

    if (!raffle || !probabilityData) {
        return (
            <div className="text-center text-muted-foreground p-8">
                분석 데이터를 불러올 수 없습니다.
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("ko-KR").format(amount);
    };

    const formatPercent = (value: number) => {
        return `${value.toFixed(1)}%`;
    };

    const getRarityColor = (tier: string) => {
        const colors = {
            COSMIC: "bg-purple-600",
            STELLAR: "bg-blue-600",
            CELESTIAL: "bg-cyan-600",
            DIVINE: "bg-green-600",
            LEGENDARY: "bg-yellow-600",
            EPIC: "bg-orange-600",
            RARE: "bg-red-600",
            UNCOMMON: "bg-gray-600",
            COMMON: "bg-slate-600",
        };
        return colors[tier as keyof typeof colors] || "bg-gray-600";
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">상품별 당첨 분석</h3>
                <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-muted-foreground">
                        실시간 데이터 분석 결과
                    </span>
                </div>
            </div>

            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
            >
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="current">현재 활성 상품</TabsTrigger>
                    <TabsTrigger value="historical">전체 상품 분석</TabsTrigger>
                </TabsList>

                <TabsContent value="current" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                현재 활성 상품 현황
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {raffle.prizes?.map((prize) => {
                                    const prizeAnalytics =
                                        probabilityData.prizeAnalytics.find(
                                            (p) => p.prizeId === prize.id
                                        );

                                    const theoreticalProb =
                                        prizeAnalytics?.theoreticalProbability ||
                                        0;
                                    const actualProb =
                                        prizeAnalytics?.actualProbability || 0;
                                    const actualWins =
                                        prizeAnalytics?.actualWins || 0;
                                    const quantity = prize.quantity || 0;

                                    return (
                                        <div
                                            key={prize.id}
                                            className="border rounded-lg p-4"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-3 h-3 rounded-full ${getRarityColor(
                                                            prize.rarityTier ||
                                                                "COMMON"
                                                        )}`}
                                                    />
                                                    <div>
                                                        <h4 className="font-medium">
                                                            {prize.title}
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {prize.prizeType ===
                                                                "ASSET" &&
                                                                prize.asset &&
                                                                `${formatCurrency(
                                                                    prize.assetAmount ||
                                                                        0
                                                                )} ${
                                                                    prize.asset
                                                                        .symbol
                                                                }`}
                                                            {prize.prizeType ===
                                                                "NFT" &&
                                                                prize.spg &&
                                                                `${prize.spg.name} NFT`}
                                                            {prize.prizeType ===
                                                                "EMPTY" && "꽝"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant={
                                                        prize.prizeType ===
                                                        "EMPTY"
                                                            ? "secondary"
                                                            : "default"
                                                    }
                                                >
                                                    {prize.rarityTier ||
                                                        "COMMON"}
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">
                                                        총 수량:
                                                    </span>
                                                    <div className="font-medium">
                                                        {formatCurrency(
                                                            quantity
                                                        )}
                                                        개
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">
                                                        이론 확률:
                                                    </span>
                                                    <div className="font-medium">
                                                        {formatPercent(
                                                            theoreticalProb
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">
                                                        실제 당첨:
                                                    </span>
                                                    <div className="font-medium">
                                                        {formatCurrency(
                                                            actualWins
                                                        )}
                                                        개
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">
                                                        실제 확률:
                                                    </span>
                                                    <div className="font-medium">
                                                        {formatPercent(
                                                            actualProb
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>소진율</span>
                                                    <span>
                                                        {formatPercent(
                                                            quantity > 0
                                                                ? (actualWins /
                                                                      quantity) *
                                                                      100
                                                                : 0
                                                        )}
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={
                                                        quantity > 0
                                                            ? (actualWins /
                                                                  quantity) *
                                                              100
                                                            : 0
                                                    }
                                                    className="h-2"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="historical" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                전체 상품 분석 (과거 데이터 포함)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {probabilityData.prizeAnalytics.map(
                                    (prizeAnalytics) => {
                                        const theoreticalProb =
                                            prizeAnalytics.theoreticalProbability;
                                        const actualProb =
                                            prizeAnalytics.actualProbability;
                                        const actualWins =
                                            prizeAnalytics.actualWins;
                                        const quantity =
                                            prizeAnalytics.quantity;

                                        return (
                                            <div
                                                key={prizeAnalytics.prizeId}
                                                className="border rounded-lg p-4"
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`w-3 h-3 rounded-full ${getRarityColor(
                                                                prizeAnalytics.rarityTier
                                                            )}`}
                                                        />
                                                        <div>
                                                            <h4 className="font-medium">
                                                                {
                                                                    prizeAnalytics.prizeName
                                                                }
                                                            </h4>
                                                            <p className="text-sm text-muted-foreground">
                                                                레어도:{" "}
                                                                {
                                                                    prizeAnalytics.rarityTier
                                                                }{" "}
                                                                (순서:{" "}
                                                                {
                                                                    prizeAnalytics.rarityOrder
                                                                }
                                                                )
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline">
                                                        참가자{" "}
                                                        {formatCurrency(
                                                            prizeAnalytics.participantCount
                                                        )}
                                                        명
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-muted-foreground">
                                                            총 수량:
                                                        </span>
                                                        <div className="font-medium">
                                                            {formatCurrency(
                                                                quantity
                                                            )}
                                                            개
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">
                                                            이론 확률:
                                                        </span>
                                                        <div className="font-medium">
                                                            {formatPercent(
                                                                theoreticalProb
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">
                                                            실제 당첨:
                                                        </span>
                                                        <div className="font-medium">
                                                            {formatCurrency(
                                                                actualWins
                                                            )}
                                                            개
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">
                                                            실제 확률:
                                                        </span>
                                                        <div className="font-medium">
                                                            {formatPercent(
                                                                actualProb
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-3 grid grid-cols-2 gap-4">
                                                    <div>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span>소진율</span>
                                                            <span>
                                                                {formatPercent(
                                                                    quantity > 0
                                                                        ? (actualWins /
                                                                              quantity) *
                                                                              100
                                                                        : 0
                                                                )}
                                                            </span>
                                                        </div>
                                                        <Progress
                                                            value={
                                                                quantity > 0
                                                                    ? (actualWins /
                                                                          quantity) *
                                                                      100
                                                                    : 0
                                                            }
                                                            className="h-2"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span>
                                                                확률 편차
                                                            </span>
                                                            <span
                                                                className={
                                                                    actualProb >
                                                                    theoreticalProb
                                                                        ? "text-green-600"
                                                                        : "text-red-600"
                                                                }
                                                            >
                                                                {actualProb >
                                                                theoreticalProb
                                                                    ? "+"
                                                                    : ""}
                                                                {formatPercent(
                                                                    actualProb -
                                                                        theoreticalProb
                                                                )}
                                                            </span>
                                                        </div>
                                                        <Progress
                                                            value={Math.abs(
                                                                actualProb -
                                                                    theoreticalProb
                                                            )}
                                                            className="h-2"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* 요약 통계 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        참가자 현황 요약
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold">
                                {formatCurrency(
                                    probabilityData.totalParticipants
                                )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                총 참가자
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold">
                                {formatCurrency(probabilityData.totalDraws)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                총 추첨
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold">
                                {formatCurrency(probabilityData.totalSlots)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                총 슬롯
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-600">
                                {formatPercent(
                                    probabilityData.totalParticipants > 0
                                        ? (probabilityData.totalDraws /
                                              probabilityData.totalParticipants) *
                                              100
                                        : 0
                                )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                추첨 완료율
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
