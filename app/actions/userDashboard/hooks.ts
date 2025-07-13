/// app/actions/userDashboard/hooks.ts

"use client";

import {
    // 🔗 Wallet-centric hooks (primary)
    useWalletDashboardMetrics,
    useWalletNetworkAnalysis,
    useWalletGrowthData,
    useWalletAssetAnalysis,
    useWalletUserTableData,
    useWalletActivityPatterns,
    useWalletRiskAnalysis,

    // 🎯 New asset analysis hooks
    useAssetHoldingRanking,
    useAssetAcquisitionPath,
    useAssetConcentration,
    useAssetAnalysisComplete,

    // 🔄 User-centric hooks (compatibility)
    useUserDashboardMetrics,
    useUserGrowthData,
    useUserTableData,
    useUserActivityAnalysis,
    useWalletNetworkDistribution,
    useReferralAnalysis,

    // 📈 Combined analytics hooks
    useDashboardOverview,
    useDashboardDetailedAnalysis,

    // 🔧 Utility hooks for specific data points
    useHourlyActivity,
    useDailyActivity,
    useWalletAgeDistribution,
    useTopReferrers,
    useSuspiciousActivity,
    useHighValueWallets,
    useFrequentTransfers,

    // 📈 DAU/MAU Analysis
    useDAUMAUAnalysis,
} from "./queries";

import type {
    UserDashboardTableFilters,
    UserDashboardGrowthPeriod,
} from "./queryKeys";

// 📊 Main Dashboard Hook Input Interface
export interface UseUserDashboardInput {
    // 📈 Growth data settings
    growthPeriod?: UserDashboardGrowthPeriod;

    // 📋 Table data settings
    tableDataPage?: number;
    tableDataPageSize?: number;
    tableDataFilters?: UserDashboardTableFilters;

    // 📊 Activity patterns settings
    activityPeriod?: UserDashboardGrowthPeriod;

    // 🔧 Utility data settings
    utilityPeriod?: UserDashboardGrowthPeriod;
}

// 🎯 Primary User Dashboard Hook
export function useUserDashboard(input?: UseUserDashboardInput) {
    // 📊 Core Metrics
    const walletMetrics = useWalletDashboardMetrics();
    const userMetrics = useUserDashboardMetrics();

    // 🌐 Network Analysis
    const networkAnalysis = useWalletNetworkAnalysis();
    const networkDistribution = useWalletNetworkDistribution();

    // 📈 Growth Data
    const growthPeriod = input?.growthPeriod ?? 30;
    const walletGrowth = useWalletGrowthData(growthPeriod);
    const userGrowth = useUserGrowthData(growthPeriod);

    // 💎 Asset Analysis
    const assetAnalysis = useWalletAssetAnalysis();

    // 🎯 New Asset Analysis
    const assetHoldingRanking = useAssetHoldingRanking();
    const assetAcquisitionPath = useAssetAcquisitionPath();
    const assetConcentration = useAssetConcentration();

    // 📋 Table Data
    const tableDataPage = input?.tableDataPage ?? 1;
    const tableDataPageSize = input?.tableDataPageSize ?? 50;
    const tableDataFilters = input?.tableDataFilters ?? {};

    const walletTableData = useWalletUserTableData(
        tableDataPage,
        tableDataPageSize,
        tableDataFilters
    );

    const userTableData = useUserTableData(
        tableDataPage,
        tableDataPageSize,
        tableDataFilters
    );

    // 📊 Activity Patterns
    const activityPeriod = input?.activityPeriod ?? 30;
    const activityPatterns = useWalletActivityPatterns(activityPeriod);
    const userActivityAnalysis = useUserActivityAnalysis(activityPeriod);

    // 🚨 Risk Analysis
    const riskAnalysis = useWalletRiskAnalysis();

    // 🎯 Referral Analysis
    const referralAnalysis = useReferralAnalysis();

    // 🔧 Utility Data
    const utilityPeriod = input?.utilityPeriod ?? 30;
    const hourlyActivity = useHourlyActivity(utilityPeriod);
    const dailyActivity = useDailyActivity(utilityPeriod);
    const walletAgeDistribution = useWalletAgeDistribution();
    const topReferrers = useTopReferrers();
    const suspiciousActivity = useSuspiciousActivity();
    const highValueWallets = useHighValueWallets();
    const frequentTransfers = useFrequentTransfers();

    // 📊 Combined Loading States
    const isMetricsLoading = walletMetrics.isLoading || userMetrics.isLoading;
    const isNetworkLoading =
        networkAnalysis.isLoading || networkDistribution.isLoading;
    const isGrowthLoading = walletGrowth.isLoading || userGrowth.isLoading;
    const isAssetAnalysisLoading =
        assetAnalysis.isLoading ||
        assetHoldingRanking.isLoading ||
        assetAcquisitionPath.isLoading ||
        assetConcentration.isLoading;
    const isTableLoading = walletTableData.isLoading || userTableData.isLoading;
    const isActivityLoading =
        activityPatterns.isLoading || userActivityAnalysis.isLoading;
    const isUtilityLoading =
        hourlyActivity.isLoading ||
        dailyActivity.isLoading ||
        walletAgeDistribution.isLoading ||
        topReferrers.isLoading ||
        suspiciousActivity.isLoading ||
        highValueWallets.isLoading ||
        frequentTransfers.isLoading;

    // 🚨 Combined Error States
    const isMetricsError = walletMetrics.isError || userMetrics.isError;
    const isNetworkError =
        networkAnalysis.isError || networkDistribution.isError;
    const isGrowthError = walletGrowth.isError || userGrowth.isError;
    const isAssetAnalysisError =
        assetAnalysis.isError ||
        assetHoldingRanking.isError ||
        assetAcquisitionPath.isError ||
        assetConcentration.isError;
    const isTableError = walletTableData.isError || userTableData.isError;
    const isActivityError =
        activityPatterns.isError || userActivityAnalysis.isError;
    const isUtilityError =
        hourlyActivity.isError ||
        dailyActivity.isError ||
        walletAgeDistribution.isError ||
        topReferrers.isError ||
        suspiciousActivity.isError ||
        highValueWallets.isError ||
        frequentTransfers.isError;

    return {
        // 📊 Core Metrics
        walletMetrics: walletMetrics.data,
        userMetrics: userMetrics.data,
        isMetricsLoading,
        isMetricsError,
        metricsError: walletMetrics.error || userMetrics.error,

        // 🌐 Network Analysis
        networkAnalysis: networkAnalysis.data,
        networkDistribution: networkDistribution.data,
        isNetworkLoading,
        isNetworkError,
        networkError: networkAnalysis.error || networkDistribution.error,

        // 📈 Growth Data
        walletGrowth: walletGrowth.data,
        userGrowth: userGrowth.data,
        isGrowthLoading,
        isGrowthError,
        growthError: walletGrowth.error || userGrowth.error,

        // 💎 Asset Analysis (기존)
        assetAnalysis: assetAnalysis.data,
        isAssetAnalysisLoading,
        isAssetAnalysisError,
        assetAnalysisError:
            assetAnalysis.error ||
            assetHoldingRanking.error ||
            assetAcquisitionPath.error ||
            assetConcentration.error,

        // 🎯 New Asset Analysis
        assetHoldingRanking: assetHoldingRanking.data,
        isAssetHoldingRankingLoading: assetHoldingRanking.isLoading,
        isAssetHoldingRankingError: assetHoldingRanking.isError,
        assetHoldingRankingError: assetHoldingRanking.error,

        assetAcquisitionPath: assetAcquisitionPath.data,
        isAssetAcquisitionPathLoading: assetAcquisitionPath.isLoading,
        isAssetAcquisitionPathError: assetAcquisitionPath.isError,
        assetAcquisitionPathError: assetAcquisitionPath.error,

        assetConcentration: assetConcentration.data,
        isAssetConcentrationLoading: assetConcentration.isLoading,
        isAssetConcentrationError: assetConcentration.isError,
        assetConcentrationError: assetConcentration.error,

        // 📋 Table Data
        walletTableData: walletTableData.data,
        userTableData: userTableData.data,
        isTableLoading,
        isTableError,
        tableError: walletTableData.error || userTableData.error,

        // 📊 Activity Patterns
        activityPatterns: activityPatterns.data,
        userActivityAnalysis: userActivityAnalysis.data,
        isActivityLoading,
        isActivityError,
        activityError: activityPatterns.error || userActivityAnalysis.error,

        // 🚨 Risk Analysis
        riskAnalysis: riskAnalysis.data,
        isRiskAnalysisLoading: riskAnalysis.isLoading,
        isRiskAnalysisError: riskAnalysis.isError,
        riskAnalysisError: riskAnalysis.error,

        // 🎯 Referral Analysis
        referralAnalysis: referralAnalysis.data,
        isReferralAnalysisLoading: referralAnalysis.isLoading,
        isReferralAnalysisError: referralAnalysis.isError,
        referralAnalysisError: referralAnalysis.error,

        // 🔧 Utility Data
        hourlyActivity: hourlyActivity.data,
        dailyActivity: dailyActivity.data,
        walletAgeDistribution: walletAgeDistribution.data,
        topReferrers: topReferrers.data,
        suspiciousActivity: suspiciousActivity.data,
        highValueWallets: highValueWallets.data,
        frequentTransfers: frequentTransfers.data,
        isUtilityLoading,
        isUtilityError,
        utilityError:
            hourlyActivity.error ||
            dailyActivity.error ||
            walletAgeDistribution.error ||
            topReferrers.error ||
            suspiciousActivity.error ||
            highValueWallets.error ||
            frequentTransfers.error,

        // 📊 Overall States
        isLoading:
            isMetricsLoading ||
            isNetworkLoading ||
            isGrowthLoading ||
            isAssetAnalysisLoading ||
            isTableLoading ||
            isActivityLoading ||
            riskAnalysis.isLoading ||
            referralAnalysis.isLoading ||
            isUtilityLoading,

        isError:
            isMetricsError ||
            isNetworkError ||
            isGrowthError ||
            isAssetAnalysisError ||
            isTableError ||
            isActivityError ||
            riskAnalysis.isError ||
            referralAnalysis.isError ||
            isUtilityError,

        // 🔄 Refetch Functions
        refetchMetrics: async () => {
            await Promise.all([walletMetrics.refetch(), userMetrics.refetch()]);
        },

        refetchAssetAnalysis: async () => {
            await Promise.all([
                assetAnalysis.refetch(),
                assetHoldingRanking.refetch(),
                assetAcquisitionPath.refetch(),
                assetConcentration.refetch(),
            ]);
        },

        refetchAll: async () => {
            await Promise.all([
                walletMetrics.refetch(),
                userMetrics.refetch(),
                networkAnalysis.refetch(),
                networkDistribution.refetch(),
                walletGrowth.refetch(),
                userGrowth.refetch(),
                assetAnalysis.refetch(),
                assetHoldingRanking.refetch(),
                assetAcquisitionPath.refetch(),
                assetConcentration.refetch(),
                walletTableData.refetch(),
                userTableData.refetch(),
                activityPatterns.refetch(),
                userActivityAnalysis.refetch(),
                riskAnalysis.refetch(),
                referralAnalysis.refetch(),
                hourlyActivity.refetch(),
                dailyActivity.refetch(),
                walletAgeDistribution.refetch(),
                topReferrers.refetch(),
                suspiciousActivity.refetch(),
                highValueWallets.refetch(),
                frequentTransfers.refetch(),
            ]);
        },

        // 📈 Hook References (for advanced usage)
        hooks: {
            walletMetrics,
            userMetrics,
            networkAnalysis,
            networkDistribution,
            walletGrowth,
            userGrowth,
            assetAnalysis,
            assetHoldingRanking,
            assetAcquisitionPath,
            assetConcentration,
            walletTableData,
            userTableData,
            activityPatterns,
            userActivityAnalysis,
            riskAnalysis,
            referralAnalysis,
            hourlyActivity,
            dailyActivity,
            walletAgeDistribution,
            topReferrers,
            suspiciousActivity,
            highValueWallets,
            frequentTransfers,
        },
    };
}

// 🎯 Asset Analysis Hook (새로 추가)
export function useUserDashboardAssetAnalysis() {
    return useAssetAnalysisComplete();
}

// 🎯 Simplified Dashboard Overview Hook
export function useUserDashboardOverview(
    period: UserDashboardGrowthPeriod = 30
) {
    return useDashboardOverview(period);
}

// 🔍 Detailed Dashboard Analysis Hook
export function useUserDashboardDetailedAnalysis(
    period: UserDashboardGrowthPeriod = 30
) {
    return useDashboardDetailedAnalysis(period);
}

// 📋 Table Data Hook
export function useUserDashboardTableData(
    page: number = 1,
    pageSize: number = 50,
    filters: UserDashboardTableFilters = {}
) {
    const walletTableData = useWalletUserTableData(page, pageSize, filters);
    const userTableData = useUserTableData(page, pageSize, filters);

    return {
        // 🔗 Wallet-centric data (primary)
        walletTableData: walletTableData.data,
        isWalletTableLoading: walletTableData.isLoading,
        isWalletTableError: walletTableData.isError,
        walletTableError: walletTableData.error,
        refetchWalletTable: walletTableData.refetch,

        // 👥 User-centric data (compatibility)
        userTableData: userTableData.data,
        isUserTableLoading: userTableData.isLoading,
        isUserTableError: userTableData.isError,
        userTableError: userTableData.error,
        refetchUserTable: userTableData.refetch,

        // 📊 Combined states
        isLoading: walletTableData.isLoading || userTableData.isLoading,
        isError: walletTableData.isError || userTableData.isError,
        error: walletTableData.error || userTableData.error,

        refetchAll: async () => {
            await Promise.all([
                walletTableData.refetch(),
                userTableData.refetch(),
            ]);
        },

        // 📈 Hook references
        hooks: {
            walletTableData,
            userTableData,
        },
    };
}

// 🚨 Risk Analysis Hook
export function useUserDashboardRiskAnalysis() {
    const riskAnalysis = useWalletRiskAnalysis();
    const suspiciousActivity = useSuspiciousActivity();
    const highValueWallets = useHighValueWallets();
    const frequentTransfers = useFrequentTransfers();

    return {
        // 🚨 Risk data
        riskAnalysis: riskAnalysis.data,
        suspiciousActivity: suspiciousActivity.data,
        highValueWallets: highValueWallets.data,
        frequentTransfers: frequentTransfers.data,

        // 📊 Loading states
        isRiskAnalysisLoading: riskAnalysis.isLoading,
        isSuspiciousActivityLoading: suspiciousActivity.isLoading,
        isHighValueWalletsLoading: highValueWallets.isLoading,
        isFrequentTransfersLoading: frequentTransfers.isLoading,

        // 🚨 Error states
        isRiskAnalysisError: riskAnalysis.isError,
        isSuspiciousActivityError: suspiciousActivity.isError,
        isHighValueWalletsError: highValueWallets.isError,
        isFrequentTransfersError: frequentTransfers.isError,

        // 📊 Combined states
        isLoading:
            riskAnalysis.isLoading ||
            suspiciousActivity.isLoading ||
            highValueWallets.isLoading ||
            frequentTransfers.isLoading,

        isError:
            riskAnalysis.isError ||
            suspiciousActivity.isError ||
            highValueWallets.isError ||
            frequentTransfers.isError,

        error:
            riskAnalysis.error ||
            suspiciousActivity.error ||
            highValueWallets.error ||
            frequentTransfers.error,

        // 🔄 Refetch functions
        refetchAll: async () => {
            await Promise.all([
                riskAnalysis.refetch(),
                suspiciousActivity.refetch(),
                highValueWallets.refetch(),
                frequentTransfers.refetch(),
            ]);
        },

        // 📈 Hook references
        hooks: {
            riskAnalysis,
            suspiciousActivity,
            highValueWallets,
            frequentTransfers,
        },
    };
}

// 📊 Activity Patterns Hook (with DAU/MAU)
export function useUserDashboardActivityPatterns(
    period: UserDashboardGrowthPeriod = 30
) {
    // 📈 DAU/MAU 데이터 (핵심)
    const dauMauAnalysis = useDAUMAUAnalysis(period);

    // 📊 기존 활동 패턴 (상세 정보용)
    const activityPatterns = useWalletActivityPatterns(period);
    const hourlyActivity = useHourlyActivity(period);
    const dailyActivity = useDailyActivity(period);
    const walletAgeDistribution = useWalletAgeDistribution();

    return {
        // 📈 DAU/MAU data (primary)
        dauData: dauMauAnalysis.data?.dauData,
        mauData: dauMauAnalysis.data?.mauData,

        // 📊 Detailed activity data
        activityPatterns: activityPatterns.data,
        hourlyActivity: hourlyActivity.data,
        dailyActivity: dailyActivity.data,
        walletAgeDistribution: walletAgeDistribution.data,

        // 📊 Loading states
        isDAUMAULoading: dauMauAnalysis.isLoading,
        isActivityPatternsLoading: activityPatterns.isLoading,
        isHourlyActivityLoading: hourlyActivity.isLoading,
        isDailyActivityLoading: dailyActivity.isLoading,
        isWalletAgeDistributionLoading: walletAgeDistribution.isLoading,

        // 🚨 Error states
        isDAUMAUError: dauMauAnalysis.isError,
        isActivityPatternsError: activityPatterns.isError,
        isHourlyActivityError: hourlyActivity.isError,
        isDailyActivityError: dailyActivity.isError,
        isWalletAgeDistributionError: walletAgeDistribution.isError,

        // 📊 Combined states
        isLoading:
            dauMauAnalysis.isLoading ||
            activityPatterns.isLoading ||
            hourlyActivity.isLoading ||
            dailyActivity.isLoading ||
            walletAgeDistribution.isLoading,

        isError:
            dauMauAnalysis.isError ||
            activityPatterns.isError ||
            hourlyActivity.isError ||
            dailyActivity.isError ||
            walletAgeDistribution.isError,

        error:
            dauMauAnalysis.error ||
            activityPatterns.error ||
            hourlyActivity.error ||
            dailyActivity.error ||
            walletAgeDistribution.error,

        // 🔄 Refetch functions
        refetchAll: async () => {
            await Promise.all([
                dauMauAnalysis.refetch(),
                activityPatterns.refetch(),
                hourlyActivity.refetch(),
                dailyActivity.refetch(),
                walletAgeDistribution.refetch(),
            ]);
        },

        // 📈 Hook references
        hooks: {
            dauMauAnalysis,
            activityPatterns,
            hourlyActivity,
            dailyActivity,
            walletAgeDistribution,
        },
    };
}
