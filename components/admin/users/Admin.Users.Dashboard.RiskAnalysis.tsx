"use client";

import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Shield,
    AlertTriangle,
    Wallet,
    DollarSign,
    Activity,
    Zap,
    Target,
} from "lucide-react";

// hooks import
import { useUserDashboardRiskAnalysis } from "@/app/actions/userDashboard/hooks";

// 공통 컴포넌트 import
import { MetricCard, ChartCard } from "./shared/MetricCard";
import {
    DashboardLoading,
    DashboardError,
    formatNumber,
} from "./shared/DashboardStates";

// 의심스러운 활동 컴포넌트
interface SuspiciousActivityProps {
    data: Array<{
        userId: string;
        name: string;
        email: string;
        walletCount: number;
        recentWallets: Array<{
            address: string;
            network: string;
            createdAt: string;
        }>;
        riskScore: number;
    }>;
}

function SuspiciousActivity({ data }: SuspiciousActivityProps) {
    const getRiskLevel = (score: number) => {
        if (score >= 80)
            return { level: "high", color: "destructive", label: "HIGH" };
        if (score >= 60)
            return { level: "medium", color: "secondary", label: "MEDIUM" };
        return { level: "low", color: "outline", label: "LOW" };
    };

    const truncateAddress = (address: string) => {
        if (address.length <= 10) return address;
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    if (!data || data.length === 0) {
        return (
            <ChartCard
                title="의심스러운 활동"
                description="최근 24시간 내 생성된 지갑을 가진 사용자들"
            >
                <div className="text-center py-8">
                    <Shield className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
                    <p className="text-sm text-slate-400">
                        현재 의심스러운 활동이 감지되지 않았습니다.
                    </p>
                </div>
            </ChartCard>
        );
    }

    return (
        <ChartCard
            title="의심스러운 활동"
            description="최근 24시간 내 생성된 지갑을 가진 사용자들"
        >
            <div className="space-y-3">
                {data.slice(0, 5).map((user) => {
                    const risk = getRiskLevel(user.riskScore);
                    return (
                        <div
                            key={user.userId}
                            className="border border-slate-700 rounded-lg p-4 bg-slate-800/50 hover:bg-slate-800/70 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-slate-200">
                                            {user.name}
                                        </span>
                                        <Badge
                                            variant={risk.color as any}
                                            className="text-xs"
                                        >
                                            {risk.label}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-slate-400">
                                        {user.email}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs">
                                        <div className="flex items-center gap-1">
                                            <Wallet className="h-3 w-3" />
                                            <span className="text-slate-400">
                                                {user.walletCount}개 지갑
                                            </span>
                                        </div>
                                        <span className="text-red-400">
                                            리스크 스코어: {user.riskScore}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium text-slate-200 mb-1">
                                        최근 지갑 생성
                                    </div>
                                    <div className="space-y-1">
                                        {user.recentWallets
                                            .slice(0, 2)
                                            .map((wallet, idx) => (
                                                <div
                                                    key={idx}
                                                    className="text-xs text-slate-400 font-mono"
                                                >
                                                    {truncateAddress(
                                                        wallet.address
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ChartCard>
    );
}

// 고액 자산 보유자 컴포넌트
interface HighValueWalletsProps {
    data: Array<{
        playerId: string;
        nickname: string;
        totalAssets: number;
        riskScore: string;
        wallets: Array<{
            address: string;
            network: string;
        }>;
    }>;
}

function HighValueWallets({ data }: HighValueWalletsProps) {
    const truncateAddress = (address: string) => {
        if (address.length <= 10) return address;
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    if (!data || data.length === 0) {
        return (
            <ChartCard
                title="고액 자산 보유자"
                description="높은 가치의 자산을 보유한 사용자들"
            >
                <div className="text-center py-8">
                    <Target className="h-12 w-12 mx-auto text-slate-500 mb-4" />
                    <p className="text-sm text-slate-400">
                        고액 자산 보유자가 없습니다.
                    </p>
                </div>
            </ChartCard>
        );
    }

    return (
        <ChartCard
            title="고액 자산 보유자"
            description="높은 가치의 자산을 보유한 사용자들"
        >
            <div className="space-y-3">
                {data.slice(0, 5).map((holder) => (
                    <div
                        key={holder.playerId}
                        className="border border-slate-700 rounded-lg p-4 bg-slate-800/50 hover:bg-slate-800/70 transition-colors"
                    >
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-200">
                                        {holder.nickname}
                                    </span>
                                    <Badge
                                        variant={
                                            holder.riskScore === "high"
                                                ? "destructive"
                                                : "secondary"
                                        }
                                        className="text-xs"
                                    >
                                        {holder.riskScore === "high"
                                            ? "HIGH RISK"
                                            : "MEDIUM RISK"}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <Wallet className="h-3 w-3" />
                                    <span className="text-slate-400">
                                        {holder.wallets.length}개 지갑
                                    </span>
                                </div>
                                <div className="text-xs text-slate-400 space-y-1">
                                    {holder.wallets
                                        .slice(0, 2)
                                        .map((wallet, idx) => (
                                            <div
                                                key={idx}
                                                className="font-mono"
                                            >
                                                {truncateAddress(
                                                    wallet.address
                                                )}{" "}
                                                ({wallet.network})
                                            </div>
                                        ))}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-emerald-400">
                                    {formatNumber(holder.totalAssets)}
                                </div>
                                <div className="text-xs text-slate-400">
                                    총 자산 가치
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ChartCard>
    );
}

// 빈번한 거래 활동 컴포넌트
interface FrequentTransfersProps {
    data: Array<{
        userId: string;
        transactionCount: number;
        totalAmount: number;
        riskScore: string;
    }>;
}

function FrequentTransfers({ data }: FrequentTransfersProps) {
    if (!data || data.length === 0) {
        return (
            <ChartCard
                title="빈번한 거래 활동"
                description="최근 7일간 높은 거래 빈도를 보인 사용자들"
            >
                <div className="text-center py-8">
                    <Activity className="h-12 w-12 mx-auto text-slate-500 mb-4" />
                    <p className="text-sm text-slate-400">
                        빈번한 거래 활동이 감지되지 않았습니다.
                    </p>
                </div>
            </ChartCard>
        );
    }

    return (
        <ChartCard
            title="빈번한 거래 활동"
            description="최근 7일간 높은 거래 빈도를 보인 사용자들"
        >
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="border-slate-700">
                            <TableHead className="text-slate-300">
                                사용자 ID
                            </TableHead>
                            <TableHead className="text-slate-300">
                                거래 횟수
                            </TableHead>
                            <TableHead className="text-slate-300">
                                총 거래액
                            </TableHead>
                            <TableHead className="text-slate-300">
                                리스크 등급
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.slice(0, 5).map((transfer) => (
                            <TableRow
                                key={transfer.userId}
                                className="border-slate-700"
                            >
                                <TableCell className="font-medium text-slate-200">
                                    {transfer.userId}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-orange-400" />
                                        <span className="text-slate-200">
                                            {transfer.transactionCount}회
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-slate-200">
                                    {formatNumber(transfer.totalAmount)}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            transfer.riskScore === "high"
                                                ? "destructive"
                                                : "secondary"
                                        }
                                        className="text-xs"
                                    >
                                        {transfer.riskScore === "high"
                                            ? "HIGH RISK"
                                            : "MEDIUM RISK"}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </ChartCard>
    );
}

// 메인 RiskAnalysis 컴포넌트
export function AdminUsersDashboardRiskAnalysis() {
    const {
        suspiciousActivity,
        highValueWallets,
        frequentTransfers,
        isLoading,
        isError,
    } = useUserDashboardRiskAnalysis();

    if (isLoading) {
        return <DashboardLoading title="위험 분석 데이터" />;
    }

    if (isError) {
        return (
            <DashboardError
                title="위험 분석 오류"
                message="위험 분석 데이터를 불러오는 중 오류가 발생했습니다."
            />
        );
    }

    // 위험 레벨 통계 계산
    const totalSuspiciousUsers = suspiciousActivity?.length || 0;
    const totalHighValueUsers = highValueWallets?.length || 0;
    const totalFrequentUsers = frequentTransfers?.length || 0;
    const totalRiskUsers =
        totalSuspiciousUsers + totalHighValueUsers + totalFrequentUsers;

    return (
        <div className="space-y-8">
            {/* 헤더 */}
            <div className="space-y-1">
                <h2 className="text-2xl font-bold text-white">
                    위험 분석 대시보드
                </h2>
                <p className="text-slate-400">
                    보안 관점에서 위험 요소 및 의심스러운 활동 모니터링
                </p>
            </div>

            {/* 위험 요소 알림 */}
            {totalRiskUsers > 0 && (
                <Alert className="border-orange-500/50 bg-orange-950/50">
                    <AlertTriangle className="h-4 w-4 text-orange-400" />
                    <AlertTitle className="text-orange-200">
                        위험 요소 감지
                    </AlertTitle>
                    <AlertDescription className="text-orange-300">
                        총 {totalRiskUsers}명의 사용자에게서 위험 요소가
                        감지되었습니다. 지속적인 모니터링이 필요합니다.
                    </AlertDescription>
                </Alert>
            )}

            {/* 위험 메트릭 */}
            <div className="grid gap-6 md:grid-cols-4">
                <MetricCard
                    title="의심스러운 활동"
                    value={totalSuspiciousUsers}
                    description="24시간 내 신규 지갑 생성"
                    icon={AlertTriangle}
                />

                <MetricCard
                    title="고액 자산 보유자"
                    value={totalHighValueUsers}
                    description="높은 가치 자산 보유"
                    icon={DollarSign}
                />

                <MetricCard
                    title="빈번한 거래"
                    value={totalFrequentUsers}
                    description="7일간 10회 이상 거래"
                    icon={Activity}
                />

                <MetricCard
                    title="총 위험 요소"
                    value={totalRiskUsers}
                    description="모니터링 필요 사용자"
                    icon={Shield}
                />
            </div>

            {/* 상세 위험 분석 */}
            <div className="grid gap-6 md:grid-cols-2">
                <SuspiciousActivity data={suspiciousActivity || []} />
                <HighValueWallets data={highValueWallets || []} />
            </div>

            {/* 빈번한 거래 활동 */}
            <FrequentTransfers data={frequentTransfers || []} />

            {/* 보안 권장사항 */}
            <ChartCard
                title="보안 권장사항"
                description="위험 관리를 위한 권장 조치사항"
            >
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="p-4 bg-slate-800/50 rounded-lg">
                        <h4 className="font-medium text-slate-200 mb-2">
                            모니터링 강화
                        </h4>
                        <ul className="text-sm text-slate-400 space-y-1">
                            <li>• 24시간 내 다중 지갑 생성 사용자 추적</li>
                            <li>• 고액 자산 보유자 거래 패턴 분석</li>
                            <li>• 비정상적인 거래 빈도 감지</li>
                        </ul>
                    </div>

                    <div className="p-4 bg-slate-800/50 rounded-lg">
                        <h4 className="font-medium text-slate-200 mb-2">
                            자동 대응
                        </h4>
                        <ul className="text-sm text-slate-400 space-y-1">
                            <li>• 리스크 스코어 기반 자동 알림</li>
                            <li>• 임계값 초과 시 거래 일시 중단</li>
                            <li>• 관리자 즉시 통지 시스템</li>
                        </ul>
                    </div>

                    <div className="p-4 bg-slate-800/50 rounded-lg">
                        <h4 className="font-medium text-slate-200 mb-2">
                            예방 조치
                        </h4>
                        <ul className="text-sm text-slate-400 space-y-1">
                            <li>• 신규 지갑 생성 시 인증 강화</li>
                            <li>• 고액 거래 이중 인증 필수</li>
                            <li>• 의심스러운 패턴 사전 차단</li>
                        </ul>
                    </div>

                    <div className="p-4 bg-slate-800/50 rounded-lg">
                        <h4 className="font-medium text-slate-200 mb-2">
                            정기 검토
                        </h4>
                        <ul className="text-sm text-slate-400 space-y-1">
                            <li>• 주간 리스크 분석 보고서</li>
                            <li>• 월간 보안 정책 업데이트</li>
                            <li>• 분기별 위험 요소 재평가</li>
                        </ul>
                    </div>
                </div>
            </ChartCard>
        </div>
    );
}

export default AdminUsersDashboardRiskAnalysis;
