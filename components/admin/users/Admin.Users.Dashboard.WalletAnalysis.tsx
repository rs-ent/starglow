"use client";

import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Wallet, Activity, Users, BarChart3 } from "lucide-react";

// hooks import
import { useUserDashboard } from "@/app/actions/userDashboard/hooks";
import type { UserDashboardGrowthPeriod } from "@/app/actions/userDashboard/queryKeys";

// 공통 컴포넌트 import
import { MetricCard, ChartCard } from "./shared/MetricCard";
import {
    DashboardLoading,
    DashboardError,
    NoDataState,
    formatNumber,
} from "./shared/DashboardStates";

// 지갑 성장 차트 컴포넌트
interface WalletGrowthChartProps {
    data: Array<{
        date: string;
        newWallets: number;
        totalWallets: number;
    }>;
}

function WalletGrowthChart({ data }: WalletGrowthChartProps) {
    if (!data || data.length === 0) {
        return (
            <ChartCard
                title="지갑 성장 추이"
                description="일별 신규 지갑 생성 및 누적 현황"
            >
                <NoDataState message="지갑 성장 데이터가 없습니다." />
            </ChartCard>
        );
    }

    return (
        <ChartCard
            title="지갑 성장 추이"
            description="일별 신규 지갑 생성 및 누적 현황"
        >
            <div className="space-y-4">
                {data.slice(-7).map((item) => (
                    <div
                        key={item.date}
                        className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span className="text-sm font-medium text-slate-200">
                                {new Date(item.date).toLocaleDateString(
                                    "ko-KR",
                                    {
                                        month: "short",
                                        day: "numeric",
                                    }
                                )}
                            </span>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-sm font-medium text-emerald-400">
                                    +{formatNumber(item.newWallets)}
                                </p>
                                <p className="text-xs text-slate-400">신규</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-white">
                                    {formatNumber(item.totalWallets)}
                                </p>
                                <p className="text-xs text-slate-400">누적</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ChartCard>
    );
}

// 네트워크 활동 분석 컴포넌트
interface NetworkActivityProps {
    distribution: Array<{
        network: string;
        count: number;
        percentage: number;
    }>;
    activity: Array<{
        network: string;
        activeCount: number;
        activityRate: number;
    }>;
}

function NetworkActivityAnalysis({
    distribution,
    activity,
}: NetworkActivityProps) {
    if (!distribution || distribution.length === 0) {
        return (
            <ChartCard
                title="네트워크별 활동 분석"
                description="네트워크별 지갑 분포 및 활성도"
            >
                <NoDataState message="네트워크 활동 데이터가 없습니다." />
            </ChartCard>
        );
    }

    return (
        <ChartCard
            title="네트워크별 활동 분석"
            description="네트워크별 지갑 분포 및 활성도"
        >
            <div className="space-y-6">
                {distribution.map((item, index) => {
                    const activityData = activity.find(
                        (a) => a.network === item.network
                    );
                    return (
                        <div key={item.network} className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-4 h-4 rounded"
                                        style={{
                                            backgroundColor: `hsl(${
                                                index * 60
                                            }, 70%, 50%)`,
                                        }}
                                    />
                                    <span className="font-medium text-slate-200">
                                        {item.network}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-200">
                                        {formatNumber(item.count)}개
                                    </div>
                                    <div className="px-2 py-1 bg-slate-600 rounded text-xs text-slate-200">
                                        {item.percentage}%
                                    </div>
                                </div>
                            </div>

                            <div className="ml-7 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">
                                        활성도
                                    </span>
                                    <span className="font-medium text-white">
                                        {activityData?.activityRate || 0}%
                                    </span>
                                </div>
                                <Progress
                                    value={activityData?.activityRate || 0}
                                    className="h-2 bg-slate-800"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </ChartCard>
    );
}

// 지갑 연령대 분포 컴포넌트
interface WalletAgeDistributionProps {
    data: Array<{
        ageGroup: string;
        walletCount: number;
    }>;
}

function WalletAgeDistribution({ data }: WalletAgeDistributionProps) {
    if (!data || data.length === 0) {
        return (
            <ChartCard
                title="지갑 연령대별 분포"
                description="지갑 생성 시점에 따른 분포"
            >
                <NoDataState message="지갑 연령대 데이터가 없습니다." />
            </ChartCard>
        );
    }

    const total = data.reduce((sum, item) => sum + item.walletCount, 0);

    return (
        <ChartCard
            title="지갑 연령대별 분포"
            description="지갑 생성 시점에 따른 분포"
        >
            <div className="space-y-4">
                {data.map((item) => {
                    const percentage =
                        total > 0 ? (item.walletCount / total) * 100 : 0;
                    return (
                        <div key={item.ageGroup} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-200">
                                    {item.ageGroup}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-400">
                                        {formatNumber(item.walletCount)}
                                    </span>
                                    <div className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-200">
                                        {Math.round(percentage)}%
                                    </div>
                                </div>
                            </div>
                            <Progress
                                value={percentage}
                                className="h-2 bg-slate-800"
                            />
                        </div>
                    );
                })}
            </div>
        </ChartCard>
    );
}

// 메인 WalletAnalysis 컴포넌트
export function AdminUsersDashboardWalletAnalysis() {
    const [selectedPeriod, setSelectedPeriod] = useState<number>(30);

    const {
        walletMetrics,
        networkAnalysis,
        walletGrowth,
        walletAgeDistribution,
        isLoading,
        isError,
    } = useUserDashboard({
        growthPeriod: selectedPeriod as UserDashboardGrowthPeriod,
    });

    if (isLoading) {
        return <DashboardLoading title="지갑 분석 데이터" />;
    }

    if (isError) {
        return (
            <DashboardError
                title="지갑 분석 오류"
                message="지갑 분석 데이터를 불러오는 중 오류가 발생했습니다."
            />
        );
    }

    return (
        <div className="space-y-8">
            {/* 헤더 */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white">
                        지갑 분석 대시보드
                    </h2>
                    <p className="text-slate-400">
                        Web3 지갑 중심의 상세한 사용자 행동 분석
                    </p>
                </div>
                <Select
                    value={selectedPeriod.toString()}
                    onValueChange={(value) => setSelectedPeriod(Number(value))}
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

            {/* 핵심 지갑 메트릭 */}
            <div className="grid gap-6 md:grid-cols-4">
                <MetricCard
                    title="총 지갑 수"
                    value={walletMetrics?.totalWallets || 0}
                    description="활성 상태 지갑"
                    icon={Wallet}
                />

                <MetricCard
                    title="활성 지갑"
                    value={walletMetrics?.activeWallets || 0}
                    description={`${selectedPeriod}일 내 활동`}
                    icon={Activity}
                />

                <MetricCard
                    title="멀티 지갑 사용자"
                    value={walletMetrics?.multiWalletUsers || 0}
                    description="2개 이상 지갑 보유"
                    icon={Users}
                />

                <MetricCard
                    title="평균 지갑 수"
                    value={walletMetrics?.avgWalletsPerUser?.toFixed(1) || 0}
                    description="사용자당 평균"
                    icon={BarChart3}
                />
            </div>

            {/* 상세 분석 섹션 */}
            <div className="grid gap-6 md:grid-cols-2">
                <WalletGrowthChart data={walletGrowth?.walletCreation || []} />

                <NetworkActivityAnalysis
                    distribution={networkAnalysis?.networkDistribution || []}
                    activity={networkAnalysis?.networkActivity || []}
                />
            </div>

            {/* 추가 분석 */}
            <div className="grid gap-6 md:grid-cols-2">
                <WalletAgeDistribution data={walletAgeDistribution || []} />

                <ChartCard
                    title="지갑 활용 지표"
                    description="지갑 사용 패턴 및 효율성 분석"
                >
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-200">
                                    지갑 활용률
                                </span>
                                <span className="text-sm font-bold text-white">
                                    {Math.round(
                                        walletMetrics?.walletUtilizationRate ||
                                            0
                                    )}
                                    %
                                </span>
                            </div>
                            <Progress
                                value={
                                    walletMetrics?.walletUtilizationRate || 0
                                }
                                className="h-2 bg-slate-800"
                            />
                            <p className="text-xs text-slate-400">
                                자산을 보유한 지갑 비율
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-200">
                                    결제 전환율
                                </span>
                                <span className="text-sm font-bold text-white">
                                    {Math.round(
                                        walletMetrics?.paymentConversionRate ||
                                            0
                                    )}
                                    %
                                </span>
                            </div>
                            <Progress
                                value={
                                    walletMetrics?.paymentConversionRate || 0
                                }
                                className="h-2 bg-slate-800"
                            />
                            <p className="text-xs text-slate-400">
                                결제 활동이 있는 지갑 비율
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-200">
                                    자산 보유율
                                </span>
                                <span className="text-sm font-bold text-white">
                                    {Math.round(
                                        walletMetrics?.assetHoldingRate || 0
                                    )}
                                    %
                                </span>
                            </div>
                            <Progress
                                value={walletMetrics?.assetHoldingRate || 0}
                                className="h-2 bg-slate-800"
                            />
                            <p className="text-xs text-slate-400">
                                자산을 보유한 지갑 비율
                            </p>
                        </div>
                    </div>
                </ChartCard>
            </div>
        </div>
    );
}

export default AdminUsersDashboardWalletAnalysis;
