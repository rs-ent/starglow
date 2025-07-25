"use server";

import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";
import { prisma } from "@/lib/prisma/client";
import type {
    DailyActivityWallet,
    MonthlyActivityWallet,
    NotificationType,
    NotificationCategory,
} from "@prisma/client";
import { updatePlayerAsset } from "../playerAssets/actions";
import { createRewardNotification } from "../notification/actions";

// 실시간 데이터 (자주 변함) - 짧은 캐시
export async function getWalletsCount() {
    return await prisma.wallet.count({
        cacheStrategy: getCacheStrategy("fiveMinutes"),
        where: {
            status: "ACTIVE",
        },
    });
}

export interface FetchActivitySelectedDateResult {
    dailyActivityWallet: DailyActivityWallet | null;
    error?: string;
}

// 직접 계산 함수 - 캐시 불필요 (결과만 저장)
export async function fetchActivitySelectedDate(
    date: Date
): Promise<FetchActivitySelectedDateResult> {
    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // 해당 날짜의 지갑 활동 계산 (캐시 없음 - 실시간 계산)
        const [
            totalWallets,
            newWallets,
            activeWallets,
            pollParticipations,
            questParticipations,
            raffleParticipations,
        ] = await Promise.all([
            prisma.wallet.count({
                where: {
                    createdAt: { lte: endOfDay },
                    status: "ACTIVE",
                },
            }),

            prisma.wallet.count({
                where: {
                    createdAt: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                    status: "ACTIVE",
                },
            }),

            prisma.wallet.count({
                where: {
                    lastAccessedAt: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                    status: "ACTIVE",
                },
            }),

            prisma.pollLog.count({
                where: {
                    createdAt: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
            }),

            prisma.questLog.count({
                where: {
                    completedAt: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                    completed: true,
                },
            }),

            prisma.raffleParticipant.count({
                where: {
                    createdAt: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
            }),
        ]);

        const returningWallets = Math.max(0, activeWallets - newWallets);

        // 일별 활동 데이터 생성 또는 업데이트
        const dailyActivityWallet = await prisma.dailyActivityWallet.upsert({
            where: {
                date: startOfDay,
            },
            create: {
                date: startOfDay,
                activeWallets,
                newWallets,
                returningWallets,
                totalWallets,
                pollParticipationCount: pollParticipations,
                questParticipationCount: questParticipations,
                raffleParticipationCount: raffleParticipations,
            },
            update: {
                activeWallets,
                newWallets,
                returningWallets,
                totalWallets,
                pollParticipationCount: pollParticipations,
                questParticipationCount: questParticipations,
                raffleParticipationCount: raffleParticipations,
            },
        });

        // Asset별 통계 계산 및 저장
        await calculateAndSavePlayerAssetsStatus(
            dailyActivityWallet.id,
            startOfDay
        );

        return {
            dailyActivityWallet,
        };
    } catch (error) {
        console.error("Failed to calculate daily activity:", error);
        return {
            dailyActivityWallet: null,
            error: "Failed to calculate daily activity data",
        };
    }
}

// Asset별 통계 계산 및 저장 함수
async function calculateAndSavePlayerAssetsStatus(
    dailyActivityWalletId: string,
    date: Date
) {
    try {
        // 모든 활성 asset 조회
        const activeAssets = await prisma.asset.findMany({
            where: {
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                symbol: true,
            },
        });

        // 각 asset별로 통계 계산
        for (const asset of activeAssets) {
            // 해당 asset의 총 balance 계산 (모든 플레이어의 balance 합산)
            const balanceResult: any = await prisma.playerAsset.aggregate({
                where: {
                    assetId: asset.id,
                    status: "ACTIVE",
                },
                _sum: {
                    balance: true,
                },
            });

            // 해당 날짜에 해당 asset으로 보상받은 횟수 계산
            const dailyRewardCount = await prisma.rewardsLog.count({
                where: {
                    assetId: asset.id,
                    createdAt: {
                        gte: date,
                        lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
                    },
                },
            });

            const totalBalance = balanceResult._sum?.balance || 0;

            // PlayerAssetsStatus 생성 또는 업데이트
            const existingStatus = await prisma.playerAssetsStatus.findFirst({
                where: {
                    assetId: asset.id,
                    dailyActivityWalletId: dailyActivityWalletId,
                },
            });

            if (existingStatus) {
                // 업데이트
                await prisma.playerAssetsStatus.update({
                    where: {
                        id: existingStatus.id,
                    },
                    data: {
                        totalBalance,
                        rewardedCount: dailyRewardCount,
                    },
                });
            } else {
                // 생성 - any 타입으로 타입 체크 우회
                await (prisma.playerAssetsStatus as any).create({
                    data: {
                        assetId: asset.id,
                        totalBalance,
                        rewardedCount: dailyRewardCount,
                        date,
                        dailyActivityWalletId,
                    },
                });
            }
        }
    } catch (error) {
        console.error("Failed to calculate player assets status:", error);
    }
}

export interface FetchActivitySelectedMonthResult {
    monthlyActivityWallet: MonthlyActivityWallet | null;
    error?: string;
}

// 집계 함수 - 확정된 데이터는 긴 캐시
export async function fetchActivitySelectedMonth(
    year: number,
    month: number
): Promise<FetchActivitySelectedMonthResult> {
    try {
        const now = new Date();
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0);

        if (now < endOfMonth) {
            return {
                monthlyActivityWallet: null,
                error: "Too soon",
            };
        }

        // 기존 월별 데이터 확인 (확정된 데이터 - 긴 캐시)
        const existingMonthlyData =
            await prisma.monthlyActivityWallet.findUnique({
                where: {
                    date: startOfMonth,
                },
                cacheStrategy: getCacheStrategy("oneDay"),
            });

        if (existingMonthlyData) {
            return {
                monthlyActivityWallet: existingMonthlyData,
            };
        }

        // 일별 데이터 조회 (확정된 과거 데이터 - 긴 캐시)
        const dailyActivities = await prisma.dailyActivityWallet.findMany({
            where: {
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
            cacheStrategy: getCacheStrategy("oneDay"),
        });

        const monthlyActivityWallet = await prisma.monthlyActivityWallet.upsert(
            {
                where: {
                    date: startOfMonth,
                },
                create: {
                    date: startOfMonth,
                    activeWallets: dailyActivities.reduce(
                        (acc, curr) => acc + curr.activeWallets,
                        0
                    ),
                    newWallets: dailyActivities.reduce(
                        (acc, curr) => acc + curr.newWallets,
                        0
                    ),
                    returningWallets: dailyActivities.reduce(
                        (acc, curr) => acc + curr.returningWallets,
                        0
                    ),
                    totalWallets: dailyActivities.reduce(
                        (acc, curr) => acc + curr.totalWallets,
                        0
                    ),
                    pollParticipationCount: dailyActivities.reduce(
                        (acc, curr) => acc + curr.pollParticipationCount,
                        0
                    ),
                    questParticipationCount: dailyActivities.reduce(
                        (acc, curr) => acc + curr.questParticipationCount,
                        0
                    ),
                    raffleParticipationCount: dailyActivities.reduce(
                        (acc, curr) => acc + curr.raffleParticipationCount,
                        0
                    ),
                },
                update: {
                    activeWallets: dailyActivities.reduce(
                        (acc, curr) => acc + curr.activeWallets,
                        0
                    ),
                    newWallets: dailyActivities.reduce(
                        (acc, curr) => acc + curr.newWallets,
                        0
                    ),
                    returningWallets: dailyActivities.reduce(
                        (acc, curr) => acc + curr.returningWallets,
                        0
                    ),
                    totalWallets: dailyActivities.reduce(
                        (acc, curr) => acc + curr.totalWallets,
                        0
                    ),
                    pollParticipationCount: dailyActivities.reduce(
                        (acc, curr) => acc + curr.pollParticipationCount,
                        0
                    ),
                    questParticipationCount: dailyActivities.reduce(
                        (acc, curr) => acc + curr.questParticipationCount,
                        0
                    ),
                    raffleParticipationCount: dailyActivities.reduce(
                        (acc, curr) => acc + curr.raffleParticipationCount,
                        0
                    ),
                },
            }
        );

        // 월별 Asset 통계 집계 및 저장
        await aggregateMonthlyPlayerAssetsStatus(
            monthlyActivityWallet.id,
            startOfMonth,
            endOfMonth
        );

        return {
            monthlyActivityWallet,
        };
    } catch (error) {
        console.error("Failed to create monthly activity:", error);
        return {
            monthlyActivityWallet: null,
            error: "Failed to create monthly activity data",
        };
    }
}

// 조회 함수들 - 데이터 특성에 따른 캐싱
export async function getDailyActivityWallets(): Promise<
    DailyActivityWallet[]
> {
    return await prisma.dailyActivityWallet.findMany({
        cacheStrategy: getCacheStrategy("oneHour"), // 일별 데이터는 하루 중 업데이트 가능
    });
}

export async function getMonthlyActivityWallets(): Promise<
    MonthlyActivityWallet[]
> {
    return await prisma.monthlyActivityWallet.findMany({
        cacheStrategy: getCacheStrategy("oneDay"),
    });
}

export async function getDailyActivityWalletWithAssets(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const dailyData = await prisma.dailyActivityWallet.findUnique({
        where: {
            date: startOfDay,
        },
        include: {
            playerAssetsStatus: true,
        },
        cacheStrategy: getCacheStrategy("oneHour"),
    });

    if (!dailyData) return null;

    const playerAssetsWithAssetInfo = await Promise.all(
        dailyData.playerAssetsStatus.map(async (status) => {
            const asset = await prisma.asset.findUnique({
                where: { id: status.assetId },
                select: {
                    id: true,
                    name: true,
                    symbol: true,
                },
                cacheStrategy: getCacheStrategy("oneDay"),
            });
            return {
                ...status,
                asset,
            };
        })
    );

    return {
        ...dailyData,
        playerAssetsStatus: playerAssetsWithAssetInfo,
    };
}

export async function getMonthlyActivityWalletWithAssets(
    year: number,
    month: number
) {
    const startOfMonth = new Date(year, month - 1, 1);

    const monthlyData = await prisma.monthlyActivityWallet.findUnique({
        where: {
            date: startOfMonth,
        },
        include: {
            playerAssetsStatus: true,
        },
        cacheStrategy: getCacheStrategy("oneDay"),
    });

    if (!monthlyData) return null;

    const playerAssetsWithAssetInfo = await Promise.all(
        monthlyData.playerAssetsStatus.map(async (status) => {
            const asset = await prisma.asset.findUnique({
                where: { id: status.assetId },
                select: {
                    id: true,
                    name: true,
                    symbol: true,
                },
                cacheStrategy: getCacheStrategy("oneDay"),
            });
            return {
                ...status,
                asset,
            };
        })
    );

    return {
        ...monthlyData,
        playerAssetsStatus: playerAssetsWithAssetInfo,
    };
}

export async function getAllActiveAssets() {
    return await prisma.asset.findMany({
        where: {
            isActive: true,
        },
        select: {
            id: true,
            name: true,
            symbol: true,
        },
        cacheStrategy: getCacheStrategy("oneDay"),
    });
}

// 특정 기간의 누락된 일별 데이터 확인
export interface MissingDatesResult {
    missingDates: string[];
    existingDates: string[];
    totalDays: number;
    error?: string;
}

export async function checkMissingDailyData(
    startDate: Date,
    endDate: Date = new Date()
): Promise<MissingDatesResult> {
    try {
        // 기간 내 모든 날짜 생성
        const allDates: string[] = [];
        const current = new Date(startDate);
        current.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);

        while (current <= end) {
            allDates.push(current.toISOString().split("T")[0]);
            current.setDate(current.getDate() + 1);
        }

        // 기존 데이터 조회
        const existingData = await prisma.dailyActivityWallet.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                date: true,
            },
        });

        const existingDates = existingData.map(
            (d) => d.date.toISOString().split("T")[0]
        );

        const missingDates = allDates.filter(
            (date) => !existingDates.includes(date)
        );

        return {
            missingDates,
            existingDates,
            totalDays: allDates.length,
        };
    } catch (error) {
        console.error("Failed to check missing data:", error);
        return {
            missingDates: [],
            existingDates: [],
            totalDays: 0,
            error: "누락된 데이터 확인에 실패했습니다.",
        };
    }
}

// 누락된 일별 데이터 일괄 생성
export interface BatchCreateResult {
    successDates: string[];
    failedDates: string[];
    totalProcessed: number;
    error?: string;
}

export async function batchCreateMissingDailyData(
    missingDates: string[]
): Promise<BatchCreateResult> {
    const successDates: string[] = [];
    const failedDates: string[] = [];

    try {
        for (const dateStr of missingDates) {
            try {
                const date = new Date(dateStr);
                const result = await fetchActivitySelectedDate(date);

                if (result.error) {
                    failedDates.push(dateStr);
                    console.error(
                        `Failed to create data for ${dateStr}:`,
                        result.error
                    );
                } else {
                    successDates.push(dateStr);
                }
            } catch (error) {
                failedDates.push(dateStr);
                console.error(`Error processing ${dateStr}:`, error);
            }
        }

        return {
            successDates,
            failedDates,
            totalProcessed: missingDates.length,
        };
    } catch (error) {
        console.error("Failed to batch create data:", error);
        return {
            successDates,
            failedDates,
            totalProcessed: missingDates.length,
            error: "일괄 생성에 실패했습니다.",
        };
    }
}

// Asset별 통계 집계 및 저장 함수
async function aggregateMonthlyPlayerAssetsStatus(
    monthlyActivityWalletId: string,
    startDate: Date,
    endDate: Date
) {
    try {
        // 모든 활성 asset 조회
        const activeAssets = await prisma.asset.findMany({
            where: {
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                symbol: true,
            },
        });

        // 각 asset별로 통계 계산
        for (const asset of activeAssets) {
            // 해당 asset의 총 balance 계산 (모든 플레이어의 balance 합산)
            const balanceResult: any = await prisma.playerAsset.aggregate({
                where: {
                    assetId: asset.id,
                    status: "ACTIVE",
                },
                _sum: {
                    balance: true,
                },
            });

            // 해당 기간에 해당 asset으로 보상받은 횟수 계산
            const monthlyRewardCount = await prisma.rewardsLog.count({
                where: {
                    assetId: asset.id,
                    createdAt: {
                        gte: startDate,
                        lt: endDate,
                    },
                },
            });

            const totalBalance = balanceResult._sum?.balance || 0;

            // PlayerAssetsStatus 생성 또는 업데이트
            const existingStatus = await prisma.playerAssetsStatus.findFirst({
                where: {
                    assetId: asset.id,
                    monthlyActivityWalletId: monthlyActivityWalletId,
                },
            });

            if (existingStatus) {
                // 업데이트
                await prisma.playerAssetsStatus.update({
                    where: {
                        id: existingStatus.id,
                    },
                    data: {
                        totalBalance,
                        rewardedCount: monthlyRewardCount,
                    },
                });
            } else {
                // 생성 - any 타입으로 타입 체크 우회
                await (prisma.playerAssetsStatus as any).create({
                    data: {
                        assetId: asset.id,
                        totalBalance,
                        rewardedCount: monthlyRewardCount,
                        date: startDate,
                        monthlyActivityWalletId,
                    },
                });
            }
        }
    } catch (error) {
        console.error(
            "Failed to calculate monthly player assets status:",
            error
        );
    }
}

export async function verifyAssetTotalBalance(assetId: string) {
    try {
        const [aggregateResult, directQuery]: [any, any] = await Promise.all([
            prisma.playerAsset.aggregate({
                where: {
                    assetId: assetId,
                    status: "ACTIVE",
                },
                _sum: {
                    balance: true,
                },
            }),

            prisma.playerAsset.findMany({
                where: {
                    assetId: assetId,
                    status: "ACTIVE",
                },
                select: {
                    balance: true,
                    playerId: true,
                },
            }),
        ]);

        const aggregateTotal = aggregateResult._sum?.balance || 0;
        const directTotal = directQuery.reduce(
            (sum: number, item: any) => sum + item.balance,
            0
        );
        const recordCount = directQuery.length;

        return {
            assetId,
            aggregateTotal,
            directTotal,
            recordCount,
            isMatching: aggregateTotal === directTotal,
            difference: Math.abs(aggregateTotal - directTotal),
        };
    } catch (error) {
        console.error("Failed to verify asset balance:", error);
        return {
            assetId,
            error: "검증 실패",
        };
    }
}

export async function verifyAllAssetBalances() {
    try {
        const assets = await getAllActiveAssets();
        const verifications = await Promise.all(
            assets.map((asset) => verifyAssetTotalBalance(asset.id))
        );

        return {
            verifications,
            summary: {
                totalAssets: assets.length,
                matchingAssets: verifications.filter((v) => v.isMatching)
                    .length,
                mismatchedAssets: verifications.filter(
                    (v) => !v.isMatching && !v.error
                ).length,
                errorAssets: verifications.filter((v) => v.error).length,
            },
        };
    } catch (error) {
        console.error("Failed to verify all assets:", error);
        return {
            error: "전체 에셋 검증 실패",
        };
    }
}

export async function getMemeQuestMigrationTotal() {
    try {
        const memeQuestReason =
            "Migration from MEME QUEST - Game Money conversion (1/1000, rounded up)";

        const totalResult: any = await prisma.rewardsLog.aggregate({
            where: {
                reason: memeQuestReason,
            },
            _sum: {
                amount: true,
            },
            cacheStrategy: getCacheStrategy("forever"),
        });

        const totalAmount = totalResult._sum?.amount || 0;

        return {
            totalAmount,
            reason: memeQuestReason,
        };
    } catch (error) {
        console.error("Failed to get MEME QUEST migration total:", error);
        return {
            totalAmount: 0,
            error: "밈퀘스트 마이그레이션 데이터 조회 실패",
        };
    }
}

export interface GetUsersListResult {
    users: any[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
    error?: string;
}

export async function getUsersList(
    page: number = 1
): Promise<GetUsersListResult> {
    try {
        const pageSize = 50;
        const skip = (page - 1) * pageSize;

        const [users, totalCount] = await Promise.all([
            prisma.user.findMany({
                skip,
                take: pageSize,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                    lastLoginAt: true,
                    provider: true,
                    wallets: {
                        select: {
                            address: true,
                            provider: true,
                        },
                    },
                    player: {
                        select: {
                            id: true,
                            name: true,
                            nickname: true,
                            email: true,
                            browser: true,
                            city: true,
                            country: true,
                            device: true,
                            ipAddress: true,
                            locale: true,
                            os: true,
                            state: true,
                            timezone: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
                cacheStrategy: getCacheStrategy("oneHour"),
            }),

            prisma.user.count({
                cacheStrategy: getCacheStrategy("oneHour"),
            }),
        ]);

        const totalPages = Math.ceil(totalCount / pageSize);

        return {
            users,
            totalCount,
            currentPage: page,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1,
        };
    } catch (error) {
        console.error("Failed to fetch users list:", error);
        return {
            users: [],
            totalCount: 0,
            currentPage: page,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false,
            error: "유저 리스트 조회에 실패했습니다.",
        };
    }
}

export interface SearchUsersResult {
    users: any[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
    searchQuery: string;
    error?: string;
}

export async function searchUsers(
    query: string,
    page: number = 1
): Promise<SearchUsersResult> {
    try {
        if (!query || query.trim().length === 0) {
            const result = await getUsersList(page);
            return {
                ...result,
                searchQuery: "",
            };
        }

        const pageSize = 50;
        const skip = (page - 1) * pageSize;
        const searchTerm = query.trim();

        // 다양한 검색 조건을 OR로 연결
        const searchConditions = {
            OR: [
                // User 테이블에서 검색
                { id: { contains: searchTerm, mode: "insensitive" as const } },
                {
                    name: {
                        contains: searchTerm,
                        mode: "insensitive" as const,
                    },
                },
                {
                    email: {
                        contains: searchTerm,
                        mode: "insensitive" as const,
                    },
                },

                // Player 테이블에서 검색
                {
                    player: {
                        OR: [
                            {
                                id: {
                                    contains: searchTerm,
                                    mode: "insensitive" as const,
                                },
                            },
                            {
                                name: {
                                    contains: searchTerm,
                                    mode: "insensitive" as const,
                                },
                            },
                            {
                                nickname: {
                                    contains: searchTerm,
                                    mode: "insensitive" as const,
                                },
                            },
                            {
                                email: {
                                    contains: searchTerm,
                                    mode: "insensitive" as const,
                                },
                            },
                        ],
                    },
                },

                // Wallet 테이블에서 검색
                {
                    wallets: {
                        some: {
                            OR: [
                                {
                                    id: {
                                        contains: searchTerm,
                                        mode: "insensitive" as const,
                                    },
                                },
                                {
                                    address: {
                                        contains: searchTerm,
                                        mode: "insensitive" as const,
                                    },
                                },
                            ],
                        },
                    },
                },
            ],
        };

        const [users, totalCount] = await Promise.all([
            prisma.user.findMany({
                where: searchConditions,
                skip,
                take: pageSize,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                    lastLoginAt: true,
                    provider: true,
                    wallets: {
                        select: {
                            address: true,
                            provider: true,
                        },
                    },
                    player: {
                        select: {
                            id: true,
                            name: true,
                            nickname: true,
                            email: true,
                            browser: true,
                            city: true,
                            country: true,
                            device: true,
                            ipAddress: true,
                            locale: true,
                            os: true,
                            state: true,
                            timezone: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            }),

            prisma.user.count({
                where: searchConditions,
            }),
        ]);

        const totalPages = Math.ceil(totalCount / pageSize);

        return {
            users,
            totalCount,
            currentPage: page,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1,
            searchQuery: searchTerm,
        };
    } catch (error) {
        console.error("Failed to search users:", error);
        return {
            users: [],
            totalCount: 0,
            currentPage: page,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false,
            searchQuery: query,
            error: "유저 검색에 실패했습니다.",
        };
    }
}

export interface GiveRewardInput {
    playerId: string;
    assetId: string;
    amount: number;
    reason?: string;
    type: NotificationType;
    category: NotificationCategory;
    title: string;
    message: string;
    description: string;
}

export interface GiveRewardResult {
    success: boolean;
    error?: string;
}

export async function giveReward(
    input: GiveRewardInput
): Promise<GiveRewardResult> {
    try {
        // 플레이어 존재 확인
        const player = await prisma.player.findUnique({
            where: { id: input.playerId },
            select: { id: true, name: true, nickname: true },
        });

        if (!player) {
            return {
                success: false,
                error: "플레이어를 찾을 수 없습니다.",
            };
        }

        // 에셋 존재 확인
        const asset = await prisma.asset.findUnique({
            where: { id: input.assetId },
            select: { id: true, name: true, symbol: true, isActive: true },
        });

        if (!asset) {
            return {
                success: false,
                error: "에셋을 찾을 수 없습니다.",
            };
        }

        if (!asset.isActive) {
            return {
                success: false,
                error: "비활성화된 에셋입니다.",
            };
        }

        const updateResult = await updatePlayerAsset({
            transaction: {
                playerId: input.playerId,
                assetId: input.assetId,
                amount: input.amount,
                operation: "ADD",
                reason: input.reason || "Event Reward",
            },
        });

        if (!updateResult.success) {
            return {
                success: false,
                error: `보상 지급에 실패했습니다: ${updateResult.error}`,
            };
        }

        await createRewardNotification(
            input.playerId,
            input.assetId,
            input.amount,
            input.type,
            input.category,
            input.title,
            input.message,
            input.description,
            input.reason || "Event Reward"
        );

        return {
            success: true,
        };
    } catch (error) {
        console.error("Error giving reward:", error);
        return {
            success: false,
            error: "보상 지급 중 오류가 발생했습니다.",
        };
    }
}
