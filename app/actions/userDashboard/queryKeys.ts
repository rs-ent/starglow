/// app/actions/userDashboard/queryKeys.ts

// 🔗 UserDashboard Query Keys Type Definition
type UserDashboardKeysType = {
    all: readonly ["userDashboard"];

    // 📊 Core Metrics
    metrics: {
        all: readonly ["userDashboard", "metrics"];
        wallet: readonly ["userDashboard", "metrics", "wallet"];
        user: readonly ["userDashboard", "metrics", "user"]; // 호환성
    };

    // 📈 Growth Analysis
    growth: {
        all: readonly ["userDashboard", "growth"];
        wallet: (
            days: number
        ) => readonly ["userDashboard", "growth", "wallet", number];
        user: (
            days: number
        ) => readonly ["userDashboard", "growth", "user", number]; // 호환성
    };

    // 🌐 Network Analysis
    network: {
        all: readonly ["userDashboard", "network"];
        analysis: readonly ["userDashboard", "network", "analysis"];
        distribution: readonly ["userDashboard", "network", "distribution"]; // 호환성
    };

    // 💎 Asset Analysis
    assets: {
        all: readonly ["userDashboard", "assets"];
        analysis: readonly ["userDashboard", "assets", "analysis"];
        distribution: readonly ["userDashboard", "assets", "distribution"];
        topHolders: readonly ["userDashboard", "assets", "topHolders"];
        // 🎯 New asset analysis keys
        holdingRanking: readonly ["userDashboard", "assets", "holdingRanking"];
        holdingRankingPaginated: (
            assetId: string,
            page: number,
            pageSize: number
        ) => readonly [
            "userDashboard",
            "assets",
            "holdingRankingPaginated",
            string,
            number,
            number
        ];
        acquisitionPath: readonly [
            "userDashboard",
            "assets",
            "acquisitionPath"
        ];
        concentration: readonly ["userDashboard", "assets", "concentration"];
    };

    // 📋 User Tables
    tables: {
        all: readonly ["userDashboard", "tables"];
        wallet: (
            page: number,
            pageSize: number,
            filters?: any
        ) => readonly [
            "userDashboard",
            "tables",
            "wallet",
            number,
            number,
            any
        ];
        user: (
            page: number,
            pageSize: number,
            filters?: any
        ) => readonly ["userDashboard", "tables", "user", number, number, any]; // 호환성
    };

    // 📊 Activity Patterns
    activity: {
        all: readonly ["userDashboard", "activity"];
        patterns: (
            days: number
        ) => readonly ["userDashboard", "activity", "patterns", number];
        analysis: (
            days: number
        ) => readonly ["userDashboard", "activity", "analysis", number]; // 호환성
        hourly: (
            days: number
        ) => readonly ["userDashboard", "activity", "hourly", number];
        daily: (
            days: number
        ) => readonly ["userDashboard", "activity", "daily", number];
        ageDistribution: readonly [
            "userDashboard",
            "activity",
            "ageDistribution"
        ];
        dauMau: (
            days: number
        ) => readonly ["userDashboard", "activity", "dauMau", number];
    };

    // 🚨 Risk Analysis
    risk: {
        all: readonly ["userDashboard", "risk"];
        analysis: readonly ["userDashboard", "risk", "analysis"];
        suspicious: readonly ["userDashboard", "risk", "suspicious"];
        highValue: readonly ["userDashboard", "risk", "highValue"];
        frequentTransfers: readonly [
            "userDashboard",
            "risk",
            "frequentTransfers"
        ];
    };

    // 🎯 Referral Analysis
    referral: {
        all: readonly ["userDashboard", "referral"];
        analysis: readonly ["userDashboard", "referral", "analysis"];
        topReferrers: readonly ["userDashboard", "referral", "topReferrers"];
        growth: readonly ["userDashboard", "referral", "growth"];
    };

    // 📈 Analytics (General)
    analytics: {
        all: readonly ["userDashboard", "analytics"];
        overview: readonly ["userDashboard", "analytics", "overview"];
        trends: (
            days: number
        ) => readonly ["userDashboard", "analytics", "trends", number];
        comparison: (
            period1: string,
            period2: string
        ) => readonly [
            "userDashboard",
            "analytics",
            "comparison",
            string,
            string
        ];
    };
};

// 🔗 UserDashboard Query Keys Implementation
export const userDashboardKeys: UserDashboardKeysType = {
    all: ["userDashboard"] as const,

    // 📊 Core Metrics
    metrics: {
        all: ["userDashboard", "metrics"] as const,
        wallet: ["userDashboard", "metrics", "wallet"] as const,
        user: ["userDashboard", "metrics", "user"] as const,
    },

    // 📈 Growth Analysis
    growth: {
        all: ["userDashboard", "growth"] as const,
        wallet: (days: number) =>
            ["userDashboard", "growth", "wallet", days] as const,
        user: (days: number) =>
            ["userDashboard", "growth", "user", days] as const,
    },

    // 🌐 Network Analysis
    network: {
        all: ["userDashboard", "network"] as const,
        analysis: ["userDashboard", "network", "analysis"] as const,
        distribution: ["userDashboard", "network", "distribution"] as const,
    },

    // 💎 Asset Analysis
    assets: {
        all: ["userDashboard", "assets"] as const,
        analysis: ["userDashboard", "assets", "analysis"] as const,
        distribution: ["userDashboard", "assets", "distribution"] as const,
        topHolders: ["userDashboard", "assets", "topHolders"] as const,
        // 🎯 New asset analysis keys
        holdingRanking: ["userDashboard", "assets", "holdingRanking"] as const,
        holdingRankingPaginated: (
            assetId: string,
            page: number,
            pageSize: number
        ) =>
            [
                "userDashboard",
                "assets",
                "holdingRankingPaginated",
                assetId,
                page,
                pageSize,
            ] as const,
        acquisitionPath: [
            "userDashboard",
            "assets",
            "acquisitionPath",
        ] as const,
        concentration: ["userDashboard", "assets", "concentration"] as const,
    },

    // 📋 User Tables
    tables: {
        all: ["userDashboard", "tables"] as const,
        wallet: (page: number, pageSize: number, filters?: any) =>
            [
                "userDashboard",
                "tables",
                "wallet",
                page,
                pageSize,
                filters,
            ] as const,
        user: (page: number, pageSize: number, filters?: any) =>
            [
                "userDashboard",
                "tables",
                "user",
                page,
                pageSize,
                filters,
            ] as const,
    },

    // 📊 Activity Patterns
    activity: {
        all: ["userDashboard", "activity"] as const,
        patterns: (days: number) =>
            ["userDashboard", "activity", "patterns", days] as const,
        analysis: (days: number) =>
            ["userDashboard", "activity", "analysis", days] as const,
        hourly: (days: number) =>
            ["userDashboard", "activity", "hourly", days] as const,
        daily: (days: number) =>
            ["userDashboard", "activity", "daily", days] as const,
        ageDistribution: [
            "userDashboard",
            "activity",
            "ageDistribution",
        ] as const,
        dauMau: (days: number) =>
            ["userDashboard", "activity", "dauMau", days] as const,
    },

    // 🚨 Risk Analysis
    risk: {
        all: ["userDashboard", "risk"] as const,
        analysis: ["userDashboard", "risk", "analysis"] as const,
        suspicious: ["userDashboard", "risk", "suspicious"] as const,
        highValue: ["userDashboard", "risk", "highValue"] as const,
        frequentTransfers: [
            "userDashboard",
            "risk",
            "frequentTransfers",
        ] as const,
    },

    // 🎯 Referral Analysis
    referral: {
        all: ["userDashboard", "referral"] as const,
        analysis: ["userDashboard", "referral", "analysis"] as const,
        topReferrers: ["userDashboard", "referral", "topReferrers"] as const,
        growth: ["userDashboard", "referral", "growth"] as const,
    },

    // 📈 Analytics (General)
    analytics: {
        all: ["userDashboard", "analytics"] as const,
        overview: ["userDashboard", "analytics", "overview"] as const,
        trends: (days: number) =>
            ["userDashboard", "analytics", "trends", days] as const,
        comparison: (period1: string, period2: string) =>
            [
                "userDashboard",
                "analytics",
                "comparison",
                period1,
                period2,
            ] as const,
    },
} as const;

// 🔧 Helper Types for Query Key Parameters
export type UserDashboardMetricsType = "wallet" | "user";
export type UserDashboardGrowthPeriod = 7 | 15 | 30 | 60 | 90;
export type UserDashboardTableType = "wallet" | "user";
export type UserDashboardRiskType =
    | "suspicious"
    | "highValue"
    | "frequentTransfers";

// 📊 Query Input Types (for type safety)
export interface UserDashboardTableFilters {
    search?: string;
    network?: string;
    hasAssets?: boolean;
    hasMultipleWallets?: boolean;
    isActive?: boolean;
    sortBy?: "createdAt" | "lastAccessedAt" | "assetCount" | "walletCount";
    sortOrder?: "asc" | "desc";
}

export interface UserDashboardGrowthInput {
    days: UserDashboardGrowthPeriod;
    type?: "wallet" | "user";
}

export interface UserDashboardActivityInput {
    days: UserDashboardGrowthPeriod;
    includeHourly?: boolean;
    includeDaily?: boolean;
    includeAgeDistribution?: boolean;
}

// 🎯 Export all types for external use
export type { UserDashboardKeysType };

// 🔗 Default export
export default userDashboardKeys;
