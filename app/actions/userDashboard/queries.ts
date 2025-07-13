/// app/actions/userDashboard/queries.ts

"use client";

import { useQuery } from "@tanstack/react-query";

import { userDashboardKeys } from "./queryKeys";
import type {
    UserDashboardTableFilters,
    UserDashboardGrowthPeriod,
} from "./queryKeys";

import {
    // 🔗 Wallet-centric functions (primary)
    getWalletDashboardMetrics,
    getWalletNetworkAnalysis,
    getWalletGrowthData,
    getWalletAssetAnalysis,
    getWalletUserTableData,
    getWalletActivityPatterns,
    getWalletRiskAnalysis,

    // 🎯 New asset analysis functions
    getAssetHoldingRanking,
    getAssetHoldingRankingPaginated,
    getAssetAcquisitionPath,
    getAssetConcentration,

    // 🔄 User-centric functions (compatibility)
    getUserDashboardMetrics,
    getUserGrowthData,
    getUserTableData,
    getUserActivityAnalysis,
    getWalletNetworkDistribution,
    getReferralAnalysis,

    // 📈 DAU/MAU Analysis
    getDAUMAUAnalysis,
} from "./actions";

// 🎯 Caching Configuration
const DASHBOARD_CACHE_CONFIG = {
    // 📊 Core metrics: 3분 캐시
    metrics: {
        staleTime: 1000 * 60 * 3, // 3 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
    },
    // 📈 Growth data: 5분 캐시
    growth: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 15, // 15 minutes
    },
    // 📋 Table data: 1분 캐시 (더 자주 업데이트)
    tables: {
        staleTime: 1000 * 60 * 1, // 1 minute
        gcTime: 1000 * 60 * 5, // 5 minutes
    },
    // 🚨 Risk data: 10분 캐시 (덜 자주 변경)
    risk: {
        staleTime: 1000 * 60 * 10, // 10 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
    },
    // 🌐 Network/Asset analysis: 5분 캐시
    analysis: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 15, // 15 minutes
    },
} as const;

// 📊 Core Metrics Hooks

/**
 * 🔗 Wallet 중심 대시보드 메트릭 조회
 * - 총 지갑 수, 활성 지갑, 멀티 지갑 사용자 등
 */
export function useWalletDashboardMetrics() {
    return useQuery({
        queryKey: userDashboardKeys.metrics.wallet,
        queryFn: getWalletDashboardMetrics,
        staleTime: DASHBOARD_CACHE_CONFIG.metrics.staleTime,
        gcTime: DASHBOARD_CACHE_CONFIG.metrics.gcTime,
        refetchOnWindowFocus: true,
    });
}

/**
 * 👥 User 중심 대시보드 메트릭 조회 (호환성)
 * - 기존 User 메트릭 + 새로운 Wallet 메트릭 포함
 */
export function useUserDashboardMetrics() {
    return useQuery({
        queryKey: userDashboardKeys.metrics.user,
        queryFn: getUserDashboardMetrics,
        staleTime: DASHBOARD_CACHE_CONFIG.metrics.staleTime,
        gcTime: DASHBOARD_CACHE_CONFIG.metrics.gcTime,
        refetchOnWindowFocus: true,
    });
}

// 🌐 Network Analysis Hooks

/**
 * 🌐 네트워크별 지갑 분포 및 활동 분석
 * - 네트워크별 지갑 수, 활성도, 비율 등
 */
export function useWalletNetworkAnalysis() {
    return useQuery({
        queryKey: userDashboardKeys.network.analysis,
        queryFn: getWalletNetworkAnalysis,
        staleTime: DASHBOARD_CACHE_CONFIG.analysis.staleTime,
        gcTime: DASHBOARD_CACHE_CONFIG.analysis.gcTime,
        refetchOnWindowFocus: false,
    });
}

/**
 * 🌍 지갑 네트워크 분포 조회 (호환성)
 * - 기존 함수와의 호환성 유지
 */
export function useWalletNetworkDistribution() {
    return useQuery({
        queryKey: userDashboardKeys.network.distribution,
        queryFn: getWalletNetworkDistribution,
        staleTime: DASHBOARD_CACHE_CONFIG.analysis.staleTime,
        gcTime: DASHBOARD_CACHE_CONFIG.analysis.gcTime,
        refetchOnWindowFocus: false,
    });
}

// 📈 Growth Analysis Hooks

/**
 * 📈 지갑 생성 및 활동 추이 분석
 */
export function useWalletGrowthData(days: UserDashboardGrowthPeriod = 30) {
    return useQuery({
        queryKey: userDashboardKeys.growth.wallet(days),
        queryFn: () => getWalletGrowthData(days),
        staleTime: DASHBOARD_CACHE_CONFIG.growth.staleTime,
        gcTime: DASHBOARD_CACHE_CONFIG.growth.gcTime,
        refetchOnWindowFocus: false,
    });
}

/**
 * 👥 사용자 성장 추이 데이터 조회 (호환성)
 */
export function useUserGrowthData(days: UserDashboardGrowthPeriod = 30) {
    return useQuery({
        queryKey: userDashboardKeys.growth.user(days),
        queryFn: () => getUserGrowthData(days),
        staleTime: DASHBOARD_CACHE_CONFIG.growth.staleTime,
        gcTime: DASHBOARD_CACHE_CONFIG.growth.gcTime,
        refetchOnWindowFocus: false,
    });
}

// 💎 Asset Analysis Hooks

/**
 * 💎 지갑별 자산 보유 현황 분석
 * - 자산별 보유 지갑 수, 상위 보유자, 자산 타입별 분포
 */
export function useWalletAssetAnalysis() {
    return useQuery({
        queryKey: userDashboardKeys.assets.analysis,
        queryFn: getWalletAssetAnalysis,
        staleTime: DASHBOARD_CACHE_CONFIG.analysis.staleTime,
        gcTime: DASHBOARD_CACHE_CONFIG.analysis.gcTime,
        refetchOnWindowFocus: false,
    });
}

// 🎯 New Asset Analysis Hooks

/**
 * 🏆 에셋별 보유 순위 분석
 * - 각 에셋의 상위 보유자 랭킹
 * - 에셋별 총 보유자 수 및 총 발행량
 */
export function useAssetHoldingRanking() {
    return useQuery({
        queryKey: userDashboardKeys.assets.holdingRanking,
        queryFn: getAssetHoldingRanking,
        staleTime: DASHBOARD_CACHE_CONFIG.analysis.staleTime,
        gcTime: DASHBOARD_CACHE_CONFIG.analysis.gcTime,
        refetchOnWindowFocus: false,
    });
}

/**
 * 🏆 특정 에셋의 페이지네이션된 보유 순위 분석
 * - 선택된 에셋의 모든 보유자를 페이지별로 조회
 * - 순위, 보유량, 비율 정보 포함
 */
export function useAssetHoldingRankingPaginated(
    assetId: string,
    page: number = 1,
    pageSize: number = 50
) {
    return useQuery({
        queryKey: userDashboardKeys.assets.holdingRankingPaginated(
            assetId,
            page,
            pageSize
        ),
        queryFn: () => getAssetHoldingRankingPaginated(assetId, page, pageSize),
        enabled: !!assetId, // assetId가 있을 때만 실행
        staleTime: DASHBOARD_CACHE_CONFIG.analysis.staleTime,
        gcTime: DASHBOARD_CACHE_CONFIG.analysis.gcTime,
        refetchOnWindowFocus: false,
        placeholderData: (previousData) => previousData, // 페이지네이션을 위해 이전 데이터 유지
    });
}

/**
 * 🛤️ 에셋 획득 경로 분석
 * - 퀘스트, 폴, 래플, 직접 지급 등 경로별 분포
 * - 각 경로별 획득 횟수 및 수량
 */
export function useAssetAcquisitionPath() {
    return useQuery({
        queryKey: userDashboardKeys.assets.acquisitionPath,
        queryFn: getAssetAcquisitionPath,
        staleTime: DASHBOARD_CACHE_CONFIG.analysis.staleTime,
        gcTime: DASHBOARD_CACHE_CONFIG.analysis.gcTime,
        refetchOnWindowFocus: false,
    });
}

/**
 * 📊 에셋 집중도 분석
 * - 지니계수, 상위 10%/1% 보유 비율
 * - 활성 보유자 수 및 집중도 레벨
 */
export function useAssetConcentration() {
    return useQuery({
        queryKey: userDashboardKeys.assets.concentration,
        queryFn: getAssetConcentration,
        staleTime: DASHBOARD_CACHE_CONFIG.analysis.staleTime,
        gcTime: DASHBOARD_CACHE_CONFIG.analysis.gcTime,
        refetchOnWindowFocus: false,
    });
}

// 📋 Table Data Hooks

/**
 * 🔍 지갑 중심 사용자 테이블 데이터 조회
 */
export function useWalletUserTableData(
    page: number = 1,
    pageSize: number = 50,
    filters: UserDashboardTableFilters = {}
) {
    return useQuery({
        queryKey: userDashboardKeys.tables.wallet(page, pageSize, filters),
        queryFn: () => getWalletUserTableData(page, pageSize, filters),
        staleTime: DASHBOARD_CACHE_CONFIG.tables.staleTime,
        gcTime: DASHBOARD_CACHE_CONFIG.tables.gcTime,
        refetchOnWindowFocus: false,
        placeholderData: (previousData) => previousData, // 페이지네이션을 위해 이전 데이터 유지
    });
}

/**
 * 👥 통합 사용자 테이블 데이터 조회 (호환성)
 */
export function useUserTableData(
    page: number = 1,
    pageSize: number = 50,
    filters: any = {}
) {
    return useQuery({
        queryKey: userDashboardKeys.tables.user(page, pageSize, filters),
        queryFn: () => getUserTableData(page, pageSize, filters),
        staleTime: DASHBOARD_CACHE_CONFIG.tables.staleTime,
        gcTime: DASHBOARD_CACHE_CONFIG.tables.gcTime,
        refetchOnWindowFocus: false,
        placeholderData: (previousData) => previousData,
    });
}

// 📊 Activity Pattern Hooks

/**
 * 📊 지갑 활동 패턴 분석
 * - 시간대별, 요일별, 연령대별 활동 패턴
 */
export function useWalletActivityPatterns(
    days: UserDashboardGrowthPeriod = 30
) {
    return useQuery({
        queryKey: userDashboardKeys.activity.patterns(days),
        queryFn: () => getWalletActivityPatterns(days),
        staleTime: DASHBOARD_CACHE_CONFIG.analysis.staleTime,
        gcTime: DASHBOARD_CACHE_CONFIG.analysis.gcTime,
        refetchOnWindowFocus: false,
    });
}

/**
 * 📈 사용자 활동 분석 데이터 조회 (호환성)
 */
export function useUserActivityAnalysis(days: UserDashboardGrowthPeriod = 30) {
    return useQuery({
        queryKey: userDashboardKeys.activity.analysis(days),
        queryFn: () => getUserActivityAnalysis(days),
        staleTime: DASHBOARD_CACHE_CONFIG.analysis.staleTime,
        gcTime: DASHBOARD_CACHE_CONFIG.analysis.gcTime,
        refetchOnWindowFocus: false,
    });
}

// 🚨 Risk Analysis Hooks

/**
 * 🚨 지갑 리스크 분석
 * - 의심스러운 활동, 고액 자산 보유, 빈번한 거래 패턴
 */
export function useWalletRiskAnalysis() {
    return useQuery({
        queryKey: userDashboardKeys.risk.analysis,
        queryFn: getWalletRiskAnalysis,
        staleTime: DASHBOARD_CACHE_CONFIG.risk.staleTime,
        gcTime: DASHBOARD_CACHE_CONFIG.risk.gcTime,
        refetchOnWindowFocus: false,
    });
}

// 🎯 Referral Analysis Hooks

/**
 * 🎯 추천 시스템 분석
 * - 상위 추천자, 추천 성장 패턴
 */
export function useReferralAnalysis() {
    return useQuery({
        queryKey: userDashboardKeys.referral.analysis,
        queryFn: getReferralAnalysis,
        staleTime: DASHBOARD_CACHE_CONFIG.analysis.staleTime,
        gcTime: DASHBOARD_CACHE_CONFIG.analysis.gcTime,
        refetchOnWindowFocus: false,
    });
}

// 📈 Combined Analytics Hooks

/**
 * 🎯 대시보드 전체 개요 데이터
 * - 핵심 메트릭들을 한번에 가져오는 통합 훅
 */
export function useDashboardOverview(days: UserDashboardGrowthPeriod = 30) {
    const metrics = useWalletDashboardMetrics();
    const growth = useWalletGrowthData(days);
    const network = useWalletNetworkAnalysis();
    const referral = useReferralAnalysis();

    return {
        metrics,
        growth,
        network,
        referral,
        isLoading:
            metrics.isLoading ||
            growth.isLoading ||
            network.isLoading ||
            referral.isLoading,
        isError:
            metrics.isError ||
            growth.isError ||
            network.isError ||
            referral.isError,
        error: metrics.error || growth.error || network.error || referral.error,
    };
}

/**
 * 🔍 대시보드 상세 분석 데이터
 * - 자산, 활동 패턴, 리스크 분석을 포함한 상세 데이터
 */
export function useDashboardDetailedAnalysis(
    days: UserDashboardGrowthPeriod = 30
) {
    const assets = useWalletAssetAnalysis();
    const activity = useWalletActivityPatterns(days);
    const risk = useWalletRiskAnalysis();

    return {
        assets,
        activity,
        risk,
        isLoading: assets.isLoading || activity.isLoading || risk.isLoading,
        isError: assets.isError || activity.isError || risk.isError,
        error: assets.error || activity.error || risk.error,
    };
}

/**
 * 🎯 통합 에셋 분석 데이터
 * - 새로운 에셋 분석 함수들을 모두 포함한 통합 훅
 */
export function useAssetAnalysisComplete() {
    const holdingRanking = useAssetHoldingRanking();
    const acquisitionPath = useAssetAcquisitionPath();
    const concentration = useAssetConcentration();

    return {
        holdingRanking,
        acquisitionPath,
        concentration,
        isLoading:
            holdingRanking.isLoading ||
            acquisitionPath.isLoading ||
            concentration.isLoading,
        isError:
            holdingRanking.isError ||
            acquisitionPath.isError ||
            concentration.isError,
        error:
            holdingRanking.error ||
            acquisitionPath.error ||
            concentration.error,
        refetchAll: async () => {
            await Promise.all([
                holdingRanking.refetch(),
                acquisitionPath.refetch(),
                concentration.refetch(),
            ]);
        },
    };
}

// 🔧 Utility Hooks for Specific Data Points

/**
 * ⏰ 시간대별 활동 데이터만 조회
 */
export function useHourlyActivity(days: UserDashboardGrowthPeriod = 30) {
    return useQuery({
        queryKey: userDashboardKeys.activity.hourly(days),
        queryFn: () => getWalletActivityPatterns(days),
        select: (data) => data?.hourlyActivity || [],
        staleTime: DASHBOARD_CACHE_CONFIG.analysis.staleTime,
        gcTime: DASHBOARD_CACHE_CONFIG.analysis.gcTime,
        refetchOnWindowFocus: false,
    });
}

/**
 * 📅 일별 활동 데이터만 조회
 */
export function useDailyActivity(days: UserDashboardGrowthPeriod = 30) {
    return useQuery({
        queryKey: userDashboardKeys.activity.daily(days),
        queryFn: () => getWalletActivityPatterns(days),
        select: (data) => data?.dailyActivity || [],
        staleTime: DASHBOARD_CACHE_CONFIG.analysis.staleTime,
        gcTime: DASHBOARD_CACHE_CONFIG.analysis.gcTime,
        refetchOnWindowFocus: false,
    });
}

/**
 * 📈 DAU/MAU 분석 데이터 조회
 */
export function useDAUMAUAnalysis(days: UserDashboardGrowthPeriod = 30) {
    return useQuery({
        queryKey: userDashboardKeys.activity.dauMau(days),
        queryFn: () => getDAUMAUAnalysis(days),
        staleTime: DASHBOARD_CACHE_CONFIG.analysis.staleTime,
        gcTime: DASHBOARD_CACHE_CONFIG.analysis.gcTime,
        refetchOnWindowFocus: false,
    });
}

/**
 * 👴 지갑 연령대별 분포만 조회
 */
export function useWalletAgeDistribution() {
    return useQuery({
        queryKey: userDashboardKeys.activity.ageDistribution,
        queryFn: () => getWalletActivityPatterns(30),
        select: (data) => data?.walletAgeDistribution || [],
        staleTime: DASHBOARD_CACHE_CONFIG.analysis.staleTime,
        gcTime: DASHBOARD_CACHE_CONFIG.analysis.gcTime,
        refetchOnWindowFocus: false,
    });
}

/**
 * 🏆 상위 추천자만 조회
 */
export function useTopReferrers() {
    return useQuery({
        queryKey: userDashboardKeys.referral.topReferrers,
        queryFn: getReferralAnalysis,
        select: (data) => data?.topReferrers || [],
        staleTime: DASHBOARD_CACHE_CONFIG.analysis.staleTime,
        gcTime: DASHBOARD_CACHE_CONFIG.analysis.gcTime,
        refetchOnWindowFocus: false,
    });
}

/**
 * 🚨 의심스러운 활동만 조회
 */
export function useSuspiciousActivity() {
    return useQuery({
        queryKey: userDashboardKeys.risk.suspicious,
        queryFn: getWalletRiskAnalysis,
        select: (data) => data?.suspiciousActivity || [],
        staleTime: DASHBOARD_CACHE_CONFIG.risk.staleTime,
        gcTime: DASHBOARD_CACHE_CONFIG.risk.gcTime,
        refetchOnWindowFocus: false,
    });
}

/**
 * 💎 고액 자산 보유 지갑만 조회
 */
export function useHighValueWallets() {
    return useQuery({
        queryKey: userDashboardKeys.risk.highValue,
        queryFn: getWalletRiskAnalysis,
        select: (data) => data?.highValueWallets || [],
        staleTime: DASHBOARD_CACHE_CONFIG.risk.staleTime,
        gcTime: DASHBOARD_CACHE_CONFIG.risk.gcTime,
        refetchOnWindowFocus: false,
    });
}

/**
 * 🔄 빈번한 거래 활동만 조회
 */
export function useFrequentTransfers() {
    return useQuery({
        queryKey: userDashboardKeys.risk.frequentTransfers,
        queryFn: getWalletRiskAnalysis,
        select: (data) => data?.frequentTransfers || [],
        staleTime: DASHBOARD_CACHE_CONFIG.risk.staleTime,
        gcTime: DASHBOARD_CACHE_CONFIG.risk.gcTime,
        refetchOnWindowFocus: false,
    });
}
