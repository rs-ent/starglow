"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DollarSign,
    Wallet,
    Trophy,
    Target,
    Coins,
    BarChart3,
    Users,
    Zap,
    Gift,
    Route,
    Layers,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

// hooks import
import {
    useUserDashboard,
    useUserDashboardAssetAnalysis,
} from "@/app/actions/userDashboard/hooks";
import { useAssetHoldingRankingPaginated } from "@/app/actions/userDashboard/queries";

// 공통 컴포넌트 import
import { MetricCard, ChartCard } from "./shared/MetricCard";
import {
    DashboardLoading,
    DashboardError,
    NoDataState,
    formatNumber,
} from "./shared/DashboardStates";

// 차트 색상 팔레트
const CHART_COLORS = [
    "#8b5cf6", // violet
    "#06b6d4", // cyan
    "#10b981", // emerald
    "#f59e0b", // amber
    "#ef4444", // red
    "#6366f1", // indigo
    "#ec4899", // pink
    "#84cc16", // lime
];

// 에셋 아이콘 컴포넌트
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

// 에셋별 보유 순위 컴포넌트 (페이지네이션 지원)
interface AssetHoldingRankingProps {
    data: Array<{
        assetId: string;
        name?: string;
        symbol?: string;
        iconUrl?: string;
        topHolders: Array<{
            playerId: string;
            nickname: string;
            playerName?: string;
            userName?: string;
            balance: number;
            percentage: number;
        }>;
        totalHolders: number;
        totalBalance: number;
    }>;
}

// 페이지네이션 컴포넌트
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

        // 시작과 끝 페이지 계산
        const start = Math.max(1, currentPage - delta);
        const end = Math.min(totalPages, currentPage + delta);

        for (let i = start; i <= end; i++) {
            range.push(i);
        }

        // 첫 페이지 추가
        if (start > 1) {
            rangeWithDots.push(1);
            if (start > 2) {
                rangeWithDots.push("...");
            }
        }

        // 중간 페이지들 추가
        rangeWithDots.push(...range);

        // 마지막 페이지 추가
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
                    이전
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
                    다음
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            <div className="text-sm text-slate-400">
                {currentPage} / {totalPages} 페이지
            </div>
        </div>
    );
}

function AssetHoldingRanking({ data }: AssetHoldingRankingProps) {
    const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 50;

    // 선택된 에셋 ID 결정
    const selectedAssetId =
        selectedAsset || (data.length > 0 ? data[0].assetId : null);

    // 페이지네이션된 데이터 가져오기
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

    // 에셋 변경 시 페이지를 1로 리셋
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedAsset]);

    if (!data || data.length === 0) {
        return (
            <ChartCard
                title="에셋별 보유 순위"
                description="각 에셋의 상위 보유자 랭킹 (전체 목록)"
            >
                <NoDataState message="에셋 보유 순위 데이터가 없습니다." />
            </ChartCard>
        );
    }

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-400" />;
        if (rank === 2) return <Trophy className="h-4 w-4 text-slate-400" />;
        if (rank === 3) return <Trophy className="h-4 w-4 text-amber-600" />;
        return (
            <span className="text-sm font-medium text-slate-400">{rank}</span>
        );
    };

    return (
        <ChartCard
            title="에셋별 보유 순위"
            description="각 에셋의 상위 보유자 랭킹 (전체 목록)"
        >
            <div className="space-y-6">
                {/* 에셋 선택 */}
                <div className="flex gap-2 flex-wrap">
                    {data.map((asset) => (
                        <button
                            key={asset.assetId}
                            onClick={() => setSelectedAsset(asset.assetId)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                                selectedAsset === asset.assetId ||
                                (!selectedAsset && asset === data[0])
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
                            <Badge variant="outline" className="text-xs">
                                {formatNumber(asset.totalHolders)}
                            </Badge>
                        </button>
                    ))}
                </div>

                {/* 페이지네이션된 보유 순위 */}
                {isPaginatedError ? (
                    <div className="text-center py-8">
                        <p className="text-red-400">
                            데이터를 불러오는 중 오류가 발생했습니다.
                        </p>
                        <p className="text-slate-400 text-sm mt-1">
                            {paginatedError?.message}
                        </p>
                    </div>
                ) : isPaginatedLoading ? (
                    <div className="text-center py-8">
                        <div className="inline-flex items-center gap-2 text-slate-400">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
                            데이터를 불러오는 중...
                        </div>
                    </div>
                ) : paginatedData ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    {paginatedData.asset.name ||
                                        paginatedData.asset.symbol}
                                </h3>
                                <p className="text-sm text-slate-400">
                                    총 보유자{" "}
                                    {formatNumber(
                                        paginatedData.asset.totalHolders
                                    )}
                                    명 • 총 발행량{" "}
                                    {formatNumber(
                                        paginatedData.asset.totalBalance
                                    )}
                                </p>
                            </div>
                            <div className="text-sm text-slate-400">
                                {(
                                    (currentPage - 1) * pageSize +
                                    1
                                ).toLocaleString()}{" "}
                                -{" "}
                                {Math.min(
                                    currentPage * pageSize,
                                    paginatedData.asset.totalHolders
                                ).toLocaleString()}{" "}
                                /{" "}
                                {paginatedData.asset.totalHolders.toLocaleString()}
                            </div>
                        </div>

                        <div className="space-y-2">
                            {paginatedData.holders.map((holder) => (
                                <div
                                    key={holder.playerId}
                                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700">
                                            {getRankIcon(holder.rank)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-200">
                                                {holder.nickname ||
                                                    holder.playerName ||
                                                    holder.userName ||
                                                    `Player #${holder.playerId.slice(
                                                        -6
                                                    )}`}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                전체의{" "}
                                                {holder.percentage.toFixed(2)}%
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-white">
                                            {formatNumber(holder.balance)}
                                        </p>
                                        <div className="w-20 bg-slate-700 rounded-full h-2">
                                            <div
                                                className="bg-purple-500 h-2 rounded-full"
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
                            ))}
                        </div>

                        {/* 페이지네이션 */}
                        {paginatedData.pagination.totalPages > 1 && (
                            <Pagination
                                currentPage={
                                    paginatedData.pagination.currentPage
                                }
                                totalPages={paginatedData.pagination.totalPages}
                                onPageChange={setCurrentPage}
                                hasNextPage={
                                    paginatedData.pagination.hasNextPage
                                }
                                hasPrevPage={
                                    paginatedData.pagination.hasPrevPage
                                }
                            />
                        )}
                    </div>
                ) : (
                    <NoDataState message="선택된 에셋의 보유자 데이터가 없습니다." />
                )}
            </div>
        </ChartCard>
    );
}

// 에셋 획득 경로 분석 컴포넌트
interface AssetAcquisitionPathProps {
    data: Array<{
        assetId: string;
        name?: string;
        symbol?: string;
        iconUrl?: string;
        acquisitionPaths: Array<{
            source: string; // 'quest', 'poll', 'raffle', 'direct', 'other'
            count: number;
            amount: number;
            percentage: number;
        }>;
    }>;
}

function AssetAcquisitionPath({ data }: AssetAcquisitionPathProps) {
    const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

    if (!data || data.length === 0) {
        return (
            <ChartCard
                title="에셋 획득 경로 분석"
                description="에셋을 획득한 경로별 분포"
            >
                <NoDataState message="에셋 획득 경로 데이터가 없습니다." />
            </ChartCard>
        );
    }

    const selectedAssetData = selectedAsset
        ? data.find((asset) => asset.assetId === selectedAsset)
        : data[0];

    const getSourceIcon = (source: string) => {
        switch (source) {
            case "quest":
                return <Target className="h-4 w-4 text-blue-400" />;
            case "poll":
                return <BarChart3 className="h-4 w-4 text-green-400" />;
            case "raffle":
                return <Gift className="h-4 w-4 text-purple-400" />;
            case "direct":
                return <Zap className="h-4 w-4 text-yellow-400" />;
            default:
                return <Route className="h-4 w-4 text-slate-400" />;
        }
    };

    const getSourceLabel = (source: string) => {
        switch (source) {
            case "quest":
                return "퀘스트";
            case "poll":
                return "폴 참여";
            case "raffle":
                return "래플 당첨";
            case "direct":
                return "직접 지급";
            case "other":
                return "기타";
            default:
                return source;
        }
    };

    return (
        <ChartCard
            title="에셋 획득 경로 분석"
            description="에셋을 획득한 경로별 분포"
        >
            <div className="space-y-6">
                {/* 에셋 선택 */}
                <div className="flex gap-2 flex-wrap">
                    {data.map((asset) => (
                        <button
                            key={asset.assetId}
                            onClick={() => setSelectedAsset(asset.assetId)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                                selectedAsset === asset.assetId ||
                                (!selectedAsset && asset === data[0])
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
                        </button>
                    ))}
                </div>

                {/* 선택된 에셋의 획득 경로 */}
                {selectedAssetData && (
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* 파이 차트 */}
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                    <Pie
                                        data={
                                            selectedAssetData.acquisitionPaths
                                        }
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="percentage"
                                    >
                                        {selectedAssetData.acquisitionPaths.map(
                                            (entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={
                                                        CHART_COLORS[
                                                            index %
                                                                CHART_COLORS.length
                                                        ]
                                                    }
                                                />
                                            )
                                        )}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (
                                                active &&
                                                payload &&
                                                payload.length
                                            ) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3">
                                                        <p className="text-slate-200 font-medium">
                                                            {getSourceLabel(
                                                                data.source
                                                            )}
                                                        </p>
                                                        <p className="text-white font-bold">
                                                            {data.percentage.toFixed(
                                                                1
                                                            )}
                                                            %
                                                        </p>
                                                        <p className="text-slate-400">
                                                            {formatNumber(
                                                                data.count
                                                            )}
                                                            회 •{" "}
                                                            {formatNumber(
                                                                data.amount
                                                            )}
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* 획득 경로 상세 */}
                        <div className="space-y-3">
                            {selectedAssetData.acquisitionPaths.map((path) => (
                                <div
                                    key={path.source}
                                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                                >
                                    <div className="flex items-center gap-3">
                                        {getSourceIcon(path.source)}
                                        <div>
                                            <p className="font-medium text-slate-200">
                                                {getSourceLabel(path.source)}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {formatNumber(path.count)}회
                                                획득
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-white">
                                            {formatNumber(path.amount)}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {path.percentage.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </ChartCard>
    );
}

// 에셋 집중도 분석 컴포넌트
interface AssetConcentrationProps {
    data: Array<{
        assetId: string;
        name?: string;
        symbol?: string;
        iconUrl?: string;
        concentrationMetrics: {
            giniCoefficient: number;
            top10Percentage: number;
            top1Percentage: number;
            activeHolders: number;
            concentrationLevel: "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
        };
    }>;
}

function AssetConcentration({ data }: AssetConcentrationProps) {
    if (!data || data.length === 0) {
        return (
            <ChartCard
                title="에셋 집중도 분석"
                description="에셋별 보유 집중도 및 분산 정도"
            >
                <NoDataState message="에셋 집중도 데이터가 없습니다." />
            </ChartCard>
        );
    }

    const getConcentrationColor = (level: string) => {
        switch (level) {
            case "LOW":
                return "text-green-400";
            case "MEDIUM":
                return "text-yellow-400";
            case "HIGH":
                return "text-orange-400";
            case "EXTREME":
                return "text-red-400";
            default:
                return "text-slate-400";
        }
    };

    const getConcentrationLabel = (level: string) => {
        switch (level) {
            case "LOW":
                return "낮음";
            case "MEDIUM":
                return "보통";
            case "HIGH":
                return "높음";
            case "EXTREME":
                return "극심";
            default:
                return level;
        }
    };

    return (
        <ChartCard
            title="에셋 집중도 분석"
            description="에셋별 보유 집중도 및 분산 정도"
        >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.map((asset) => (
                    <div
                        key={asset.assetId}
                        className="p-4 rounded-lg bg-slate-800/50 border border-slate-700"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <AssetIcon asset={asset} />
                                <span className="text-sm font-medium text-slate-200">
                                    {asset.name ||
                                        asset.symbol ||
                                        `Asset #${asset.assetId}`}
                                </span>
                            </div>
                            <Badge
                                variant="outline"
                                className={`text-xs ${getConcentrationColor(
                                    asset.concentrationMetrics
                                        .concentrationLevel
                                )}`}
                            >
                                {getConcentrationLabel(
                                    asset.concentrationMetrics
                                        .concentrationLevel
                                )}
                            </Badge>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-xs text-slate-400">
                                    지니계수
                                </span>
                                <span className="text-xs text-white font-medium">
                                    {asset.concentrationMetrics.giniCoefficient.toFixed(
                                        3
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-xs text-slate-400">
                                    상위 10% 보유비율
                                </span>
                                <span className="text-xs text-white font-medium">
                                    {asset.concentrationMetrics.top10Percentage.toFixed(
                                        1
                                    )}
                                    %
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-xs text-slate-400">
                                    상위 1% 보유비율
                                </span>
                                <span className="text-xs text-white font-medium">
                                    {asset.concentrationMetrics.top1Percentage.toFixed(
                                        1
                                    )}
                                    %
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-xs text-slate-400">
                                    활성 보유자
                                </span>
                                <span className="text-xs text-white font-medium">
                                    {formatNumber(
                                        asset.concentrationMetrics.activeHolders
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ChartCard>
    );
}

// 메인 AssetAnalysis 컴포넌트
export function AdminUsersDashboardAssetAnalysis() {
    const {
        walletMetrics,
        assetAnalysis,
        isAssetAnalysisLoading,
        isAssetAnalysisError,
    } = useUserDashboard();

    // 새로운 에셋 분석 데이터
    const {
        holdingRanking,
        acquisitionPath,
        concentration,
        isLoading: isNewAssetAnalysisLoading,
        isError: isNewAssetAnalysisError,
    } = useUserDashboardAssetAnalysis();

    // 통합 로딩 및 에러 상태
    const isLoading = isAssetAnalysisLoading || isNewAssetAnalysisLoading;
    const isError = isAssetAnalysisError || isNewAssetAnalysisError;

    if (isLoading) {
        return <DashboardLoading title="에셋 분석 데이터" />;
    }

    if (isError) {
        return (
            <DashboardError
                title="에셋 분석 오류"
                message="에셋 분석 데이터를 불러오는 중 오류가 발생했습니다."
            />
        );
    }

    return (
        <div className="space-y-8">
            {/* 헤더 */}
            <div className="space-y-1">
                <h2 className="text-2xl font-bold text-white">
                    에셋 분석 대시보드
                </h2>
                <p className="text-slate-400">
                    에셋별 보유 순위 및 획득 경로 분석
                </p>
            </div>

            {/* 핵심 에셋 메트릭 */}
            <div className="grid gap-6 md:grid-cols-4">
                <MetricCard
                    title="에셋 보유 지갑"
                    value={walletMetrics?.walletsWithAssets || 0}
                    description="에셋을 보유한 지갑 수"
                    icon={Wallet}
                />

                <MetricCard
                    title="총 에셋 가치"
                    value={formatNumber(walletMetrics?.totalWalletValue || 0)}
                    description="전체 에셋 가치 합계"
                    icon={DollarSign}
                />

                <MetricCard
                    title="에셋 종류"
                    value={assetAnalysis?.assetTypes?.length || 0}
                    description="다양한 에셋 타입"
                    icon={Layers}
                />

                <MetricCard
                    title="활성 보유자"
                    value={formatNumber(walletMetrics?.walletsWithAssets || 0)}
                    description="현재 활성 에셋 보유자"
                    icon={Users}
                />
            </div>

            {/* 에셋별 보유 순위 */}
            <AssetHoldingRanking
                data={
                    holdingRanking?.data?.map((asset: any) => ({
                        ...asset,
                        iconUrl: asset.iconUrl || undefined,
                    })) || []
                }
            />

            {/* 에셋 획득 경로 분석 */}
            <AssetAcquisitionPath
                data={
                    acquisitionPath?.data?.map((asset: any) => ({
                        ...asset,
                        iconUrl: asset.iconUrl || undefined,
                    })) || []
                }
            />

            {/* 에셋 집중도 분석 */}
            <AssetConcentration
                data={
                    concentration?.data?.map((asset: any) => ({
                        ...asset,
                        iconUrl: asset.iconUrl || undefined,
                    })) || []
                }
            />

            {/* 에셋 트렌드 분석 */}
            <ChartCard
                title="에셋 트렌드 분석"
                description="에셋별 획득 및 보유 패턴 트렌드"
            >
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-white">
                            획득 활성도
                        </h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-300">
                                    퀘스트 참여도
                                </span>
                                <Badge
                                    variant="outline"
                                    className="text-xs border-green-600 text-green-400"
                                >
                                    HIGH
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-300">
                                    폴 참여도
                                </span>
                                <Badge
                                    variant="outline"
                                    className="text-xs border-blue-600 text-blue-400"
                                >
                                    MEDIUM
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-300">
                                    래플 참여도
                                </span>
                                <Badge
                                    variant="outline"
                                    className="text-xs border-purple-600 text-purple-400"
                                >
                                    GROWING
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-white">
                            보유 패턴
                        </h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-300">
                                    장기 보유자
                                </span>
                                <Badge
                                    variant="outline"
                                    className="text-xs border-blue-600 text-blue-400"
                                >
                                    72%
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-300">
                                    활성 거래자
                                </span>
                                <Badge
                                    variant="outline"
                                    className="text-xs border-green-600 text-green-400"
                                >
                                    18%
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-300">
                                    신규 유입
                                </span>
                                <Badge
                                    variant="outline"
                                    className="text-xs border-purple-600 text-purple-400"
                                >
                                    +12%
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </ChartCard>
        </div>
    );
}

export default AdminUsersDashboardAssetAnalysis;
