"use client";

import { Progress } from "@/components/ui/progress";
import {
    Users,
    Wallet,
    TrendingUp,
    Activity,
    DollarSign,
} from "lucide-react";

// hooks import
import { useUserDashboardOverview } from "@/app/actions/userDashboard/hooks";

// 공통 컴포넌트 import
import { MetricCard, ChartCard } from "./shared/MetricCard";

import {
    DashboardLoading,
    DashboardError,
    NoDataState,
} from "./shared/DashboardStates";

// 유틸리티 함수
function formatNumber(value: number): string {
    if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + "M";
    } else if (value >= 1000) {
        return (value / 1000).toFixed(1) + "K";
    }
    return value.toString();
}

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
                title="네트워크 분포"
                description="활성 지갑의 네트워크별 분포 현황"
            >
                <NoDataState message="네트워크 데이터가 없습니다." />
            </ChartCard>
        );
    }

    return (
        <ChartCard
            title="네트워크 분포"
            description="활성 지갑의 네트워크별 분포 현황"
        >
            <div className="space-y-4">
                {data.map((item, index) => (
                    <div
                        key={item.network}
                        className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                    backgroundColor: `hsl(${
                                        index * 60
                                    }, 70%, 50%)`,
                                }}
                            />
                            <span className="text-sm font-medium text-slate-200">
                                {item.network}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-400">
                                {formatNumber(item.count)}
                            </span>
                            <div className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-200">
                                {item.percentage}%
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ChartCard>
    );
}

export function AdminUsersDashboardOverview() {
    const { metrics, network, isLoading, isError, error } =
        useUserDashboardOverview(30);

    const walletMetrics = metrics.data;
    const networkAnalysis = network.data;

    if (isLoading) {
        return <DashboardLoading title="개요 데이터" />;
    }

    if (isError) {
        return (
            <DashboardError
                title="데이터 로딩 오류"
                message={error?.message || "알 수 없는 오류가 발생했습니다."}
                error={error || undefined}
            />
        );
    }

    return (
        <div className="space-y-8">
            {/* 핵심 메트릭 카드들 */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="총 활성 지갑"
                    value={walletMetrics?.totalWallets || 0}
                    description="전체 활성 상태 지갑 수"
                    icon={Wallet}
                    badge={{ text: "ACTIVE", variant: "default" }}
                />

                <MetricCard
                    title="활성 사용자"
                    value={walletMetrics?.activeWallets || 0}
                    description="최근 30일 내 활동한 지갑"
                    icon={Users}
                    progress={{
                        value: walletMetrics?.activeWallets || 0,
                        max: walletMetrics?.totalWallets || 1,
                    }}
                />

                <MetricCard
                    title="자산 보유 지갑"
                    value={walletMetrics?.walletsWithAssets || 0}
                    description="자산을 보유한 지갑 수"
                    icon={DollarSign}
                    trend={{
                        value: walletMetrics?.assetHoldingRate || 0,
                        isPositive: (walletMetrics?.assetHoldingRate || 0) > 50,
                    }}
                />

                <MetricCard
                    title="지갑 활용률"
                    value={`${Math.round(
                        walletMetrics?.walletActivityRate || 0
                    )}%`}
                    description="지갑 활성도 비율"
                    icon={Activity}
                    badge={{
                        text:
                            (walletMetrics?.walletActivityRate || 0) > 70
                                ? "HIGH"
                                : "NORMAL",
                        variant:
                            (walletMetrics?.walletActivityRate || 0) > 70
                                ? "default"
                                : "secondary",
                    }}
                />
            </div>

            {/* 상세 메트릭 */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="고유 사용자"
                    value={walletMetrics?.uniqueWalletOwners || 0}
                    description="실제 지갑 소유자 수"
                    icon={Users}
                />

                <MetricCard
                    title="멀티 지갑 사용자"
                    value={walletMetrics?.multiWalletUsers || 0}
                    description="2개 이상 지갑 보유"
                    icon={Wallet}
                    badge={{ text: "MULTI", variant: "secondary" }}
                />

                <MetricCard
                    title="총 거래 수"
                    value={walletMetrics?.totalWalletTransactions || 0}
                    description="완료된 결제 거래"
                    icon={TrendingUp}
                />

                <MetricCard
                    title="거래 활성 지갑"
                    value={walletMetrics?.walletsWithPayments || 0}
                    description="결제 활동이 있는 지갑"
                    icon={Activity}
                    progress={{
                        value: walletMetrics?.walletsWithPayments || 0,
                        max: walletMetrics?.totalWallets || 1,
                    }}
                />
            </div>

            {/* 네트워크 분포 및 핵심 지표 */}
            <div className="grid gap-6 md:grid-cols-2">
                <NetworkDistribution
                    data={networkAnalysis?.networkDistribution || []}
                />

                <ChartCard title="주요 지표" description="핵심 성과 지표 요약">
                    <div className="space-y-6">
                        <div className="space-y-2">
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
                        </div>

                        <div className="space-y-2">
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
                        </div>

                        <div className="pt-4 border-t border-slate-800">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-200">
                                    평균 지갑 수
                                </span>
                                <span className="text-sm font-bold text-white">
                                    {walletMetrics?.avgWalletsPerUser || 0}개
                                </span>
                            </div>
                        </div>
                    </div>
                </ChartCard>
            </div>
        </div>
    );
}

export default AdminUsersDashboardOverview;
