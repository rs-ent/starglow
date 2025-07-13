"use client";

import { useState } from "react";
import { useRaffles } from "@/app/actions/raffles/hooks";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { AdminRafflesAnalyticsBasic } from "./Admin.Raffles.Analytics.Basic";
import { AdminRafflesAnalyticsRaffle } from "./Admin.Raffles.Analytics.Raffle";
import { AdminRafflesAnalyticsTimeline } from "./Admin.Raffles.Analytics.Timeline";
import { AdminRafflesAnalyticsRevenue } from "./Admin.Raffles.Analytics.Revenue";

interface AdminRafflesAnalyticsProps {
    onBack: () => void;
}

export function AdminRafflesAnalytics({ onBack }: AdminRafflesAnalyticsProps) {
    const [selectedRaffleId, setSelectedRaffleId] = useState<string>("");

    // 모든 래플 목록 조회
    const { rafflesData, isRafflesLoading } = useRaffles({
        getRafflesInput: { limit: 100 }, // 관리자는 모든 래플을 볼 수 있도록
    });

    if (isRafflesLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">
                    래플 목록을 불러오는 중...
                </div>
            </div>
        );
    }

    const raffles = rafflesData?.data || [];

    return (
        <div className="space-y-6 p-6">
            <Button variant="outline" onClick={onBack}>
                <ArrowLeftIcon className="w-4 h-4" />
                뒤로가기
            </Button>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">래플 분석</h1>
                <Badge variant="outline">총 {raffles.length}개 래플</Badge>
            </div>

            {/* 래플 선택 섹션 */}
            <Card>
                <CardHeader>
                    <CardTitle>분석할 래플 선택</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select
                        value={selectedRaffleId}
                        onValueChange={setSelectedRaffleId}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="분석할 래플을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                            {raffles.map((raffle) => (
                                <SelectItem key={raffle.id} value={raffle.id}>
                                    <div className="flex items-center justify-between w-full">
                                        <span className="font-medium">
                                            {raffle.title}
                                        </span>
                                        <div className="flex items-center gap-2 ml-4">
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                {raffle.status}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                참여자:{" "}
                                                {raffle._count?.participants ||
                                                    0}
                                                명
                                            </span>
                                        </div>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {selectedRaffleId && (
                        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                선택된 래플:{" "}
                                <span className="font-medium text-foreground">
                                    {
                                        raffles.find(
                                            (r) => r.id === selectedRaffleId
                                        )?.title
                                    }
                                </span>
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 선택된 래플이 있을 때만 분석 영역 표시 */}
            {selectedRaffleId && (
                <div className="space-y-6">
                    {/* 기본 통계 */}
                    <AdminRafflesAnalyticsBasic raffleId={selectedRaffleId} />

                    {/* 상품별 당첨 분석 */}
                    <AdminRafflesAnalyticsRaffle raffleId={selectedRaffleId} />

                    {/* 참가 시간대 분석 */}
                    <AdminRafflesAnalyticsTimeline
                        raffleId={selectedRaffleId}
                    />

                    {/* 수익성 상세 분석 */}
                    <AdminRafflesAnalyticsRevenue raffleId={selectedRaffleId} />
                </div>
            )}
        </div>
    );
}
