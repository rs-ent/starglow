"use client";

import { useRaffles } from "@/app/actions/raffles/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, UsersIcon, TrophyIcon, CoinsIcon } from "lucide-react";

interface AdminRafflesAnalyticsBasicProps {
    raffleId: string;
}

export function AdminRafflesAnalyticsBasic({
    raffleId,
}: AdminRafflesAnalyticsBasicProps) {
    // 선택된 래플의 상세 정보 조회
    const { raffleData, isRaffleLoading } = useRaffles({
        getRaffleId: raffleId,
    });

    // 해당 래플의 수익 분석 데이터 조회
    const { revenueAnalyticsData, isRevenueAnalyticsLoading } = useRaffles({
        revenueAnalyticsRaffleIds: [raffleId],
    });

    if (isRaffleLoading || isRevenueAnalyticsLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                            <div className="h-16 bg-muted rounded"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const raffle = raffleData?.data;
    const revenueData = revenueAnalyticsData?.data?.[0];

    if (!raffle) {
        return (
            <div className="text-center text-muted-foreground p-8">
                래플 정보를 불러올 수 없습니다.
            </div>
        );
    }

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("ko-KR").format(amount);
    };

    return (
        <div className="space-y-6">
            {/* 래플 기본 정보 헤더 */}
            <div className="space-y-2">
                <h2 className="text-xl font-semibold">{raffle.title}</h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span>
                            {formatDate(raffle.startDate)} ~{" "}
                            {formatDate(raffle.endDate)}
                        </span>
                    </div>
                    <Badge
                        variant={
                            raffle.status === "ACTIVE" ? "default" : "secondary"
                        }
                    >
                        {raffle.status}
                    </Badge>
                    {raffle.artist && (
                        <span>아티스트: {raffle.artist.name}</span>
                    )}
                </div>
            </div>

            {/* 핵심 통계 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 참여자 수 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            총 참여자
                        </CardTitle>
                        <UsersIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(raffle._count?.participants || 0)}명
                        </div>
                        {raffle.maxParticipants && (
                            <p className="text-xs text-muted-foreground">
                                최대 {formatCurrency(raffle.maxParticipants)}명
                                (
                                {Math.round(
                                    ((raffle._count?.participants || 0) /
                                        raffle.maxParticipants) *
                                        100
                                )}
                                %)
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* 총 상품 수 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            총 상품
                        </CardTitle>
                        <TrophyIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(raffle._count?.prizes || 0)}개
                        </div>
                        <p className="text-xs text-muted-foreground">
                            당첨자 {formatCurrency(raffle._count?.winners || 0)}
                            명
                        </p>
                    </CardContent>
                </Card>

                {/* 참가비 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            참가비
                        </CardTitle>
                        <CoinsIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(raffle.entryFeeAmount || 0)}
                        </div>
                        {raffle.entryFeeAsset && (
                            <p className="text-xs text-muted-foreground">
                                {raffle.entryFeeAsset.symbol}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* 총 수익 (수익 분석 데이터가 있을 때만) */}
                {revenueData && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                총 수익
                            </CardTitle>
                            <CoinsIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(revenueData.totalRevenue)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                순이익 {formatCurrency(revenueData.netProfit)}(
                                {revenueData.profitMargin > 0 ? "+" : ""}
                                {revenueData.profitMargin.toFixed(1)}%)
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* 래플 설정 정보 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">래플 설정</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">
                                즉시 공개:
                            </span>
                            <Badge
                                variant={
                                    raffle.instantReveal
                                        ? "default"
                                        : "secondary"
                                }
                                className="ml-2"
                            >
                                {raffle.instantReveal ? "ON" : "OFF"}
                            </Badge>
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                다중 참여:
                            </span>
                            <Badge
                                variant={
                                    raffle.allowMultipleEntry
                                        ? "default"
                                        : "secondary"
                                }
                                className="ml-2"
                            >
                                {raffle.allowMultipleEntry ? "허용" : "불허"}
                            </Badge>
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                공개 래플:
                            </span>
                            <Badge
                                variant={
                                    raffle.isPublic ? "default" : "secondary"
                                }
                                className="ml-2"
                            >
                                {raffle.isPublic ? "공개" : "비공개"}
                            </Badge>
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                제한 수량:
                            </span>
                            <Badge
                                variant={
                                    raffle.isLimited ? "default" : "secondary"
                                }
                                className="ml-2"
                            >
                                {raffle.isLimited ? "제한" : "무제한"}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
