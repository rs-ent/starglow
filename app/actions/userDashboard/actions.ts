"use server";

import { prisma } from "@/lib/prisma/client";

// 🔗 Wallet 중심 대시보드 핵심 메트릭 조회
export async function getWalletDashboardMetrics() {
    try {
        const [
            totalWallets,
            activeWallets,
            walletsWithAssets,
            walletsWithMultipleAssets,
            uniqueWalletOwners,
            _multiWalletUsers,
            averageWalletsPerUser,
            totalWalletTransactions,
            walletsWithPayments,
            totalWalletValue,
        ] = await Promise.all([
            // 총 활성 지갑 수
            prisma.wallet.count({
                where: { status: "ACTIVE" },
            }),

            // 최근 30일 내 활동한 지갑 수 (지갑 기준 활성도)
            prisma.wallet.count({
                where: {
                    status: "ACTIVE",
                    lastAccessedAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                },
            }),

            // 자산을 보유한 지갑 수
            prisma.wallet.count({
                where: {
                    status: "ACTIVE",
                    user: {
                        player: {
                            playerAssets: { some: { balance: { gt: 0 } } },
                        },
                    },
                },
            }),

            // 2개 이상의 서로 다른 자산을 보유한 지갑 수
            prisma.wallet.count({
                where: {
                    status: "ACTIVE",
                    user: {
                        player: {
                            playerAssets: {
                                some: { balance: { gt: 0 } },
                            },
                        },
                    },
                },
            }),

            // 고유 지갑 소유자 수 (실제 사용자 수)
            prisma.user.count({
                where: {
                    active: true,
                    wallets: { some: { status: "ACTIVE" } },
                },
            }),

            // 멀티 지갑 사용자 수 (아래에서 실제 계산)
            Promise.resolve(0),

            // 사용자당 평균 지갑 수 계산용
            prisma.user.findMany({
                where: {
                    active: true,
                    wallets: { some: { status: "ACTIVE" } },
                },
                include: {
                    _count: {
                        select: {
                            wallets: { where: { status: "ACTIVE" } },
                        },
                    },
                },
            }),

            // 지갑 기반 트랜잭션 수 (결제 완료 기준)
            prisma.payment.count({
                where: {
                    status: "COMPLETED",
                    receiverWallet: { status: "ACTIVE" },
                },
            }),

            // 결제 활동이 있는 지갑 수
            prisma.wallet.count({
                where: {
                    status: "ACTIVE",
                    payments: { some: { status: "COMPLETED" } },
                },
            }),

            // 총 지갑 자산 가치 (대략적 계산)
            prisma.playerAsset.aggregate({
                where: {
                    balance: { gt: 0 },
                    player: {
                        user: {
                            wallets: { some: { status: "ACTIVE" } },
                        },
                    },
                },
                _sum: { balance: true },
            }),
        ]);

        // 실제 멀티 지갑 사용자 계산
        const actualMultiWalletUsers = averageWalletsPerUser.filter(
            (user: any) => user._count.wallets > 1
        ).length;

        // 평균 지갑 수 계산
        const avgWalletsPerUser =
            averageWalletsPerUser.length > 0
                ? averageWalletsPerUser.reduce(
                      (sum: number, user: any) => sum + user._count.wallets,
                      0
                  ) / averageWalletsPerUser.length
                : 0;

        // 지갑 활성도 비율 계산
        const walletActivityRate =
            totalWallets > 0 ? (activeWallets / totalWallets) * 100 : 0;

        // 자산 보유 비율
        const assetHoldingRate =
            totalWallets > 0 ? (walletsWithAssets / totalWallets) * 100 : 0;

        return {
            // 🔗 지갑 기본 메트릭
            totalWallets,
            activeWallets,
            walletsWithAssets,
            walletsWithMultipleAssets,
            walletActivityRate: Math.round(walletActivityRate * 100) / 100,
            assetHoldingRate: Math.round(assetHoldingRate * 100) / 100,

            // 👥 사용자 관련 메트릭
            uniqueWalletOwners,
            multiWalletUsers: actualMultiWalletUsers,
            avgWalletsPerUser: Math.round(avgWalletsPerUser * 100) / 100,

            // 💰 거래 활동 메트릭
            totalWalletTransactions,
            walletsWithPayments,
            totalWalletValue: (totalWalletValue as any)._sum?.balance || 0,

            // 📊 추가 계산 지표
            walletUtilizationRate:
                uniqueWalletOwners > 0
                    ? (walletsWithAssets / uniqueWalletOwners) * 100
                    : 0,
            paymentConversionRate:
                totalWallets > 0
                    ? (walletsWithPayments / totalWallets) * 100
                    : 0,
        };
    } catch (error) {
        console.error("Error fetching wallet dashboard metrics:", error);
        throw error;
    }
}

// 🌐 네트워크별 지갑 분포 및 활동 분석
export async function getWalletNetworkAnalysis() {
    try {
        const [networkDistribution, networkActivity] = await Promise.all([
            // 네트워크별 지갑 분포
            prisma.wallet.groupBy({
                by: ["network"],
                where: { status: "ACTIVE" },
                _count: { id: true },
            }),

            // 네트워크별 활동 분석 (최근 30일)
            prisma.wallet.groupBy({
                by: ["network"],
                where: {
                    status: "ACTIVE",
                    lastAccessedAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                },
                _count: { id: true },
            }),
        ]);

        const totalWallets: number = networkDistribution.reduce(
            (sum: number, item: any) => sum + (item._count?.id || 0),
            0
        );

        return {
            networkDistribution: networkDistribution.map((item: any) => ({
                network: item.network,
                count: item._count?.id || 0,
                percentage:
                    totalWallets > 0
                        ? Math.round(
                              ((item._count?.id || 0) / totalWallets) * 10000
                          ) / 100
                        : 0,
            })),
            networkActivity: networkActivity.map((item: any) => {
                const distributionItem: any = networkDistribution.find(
                    (d: any) => d.network === item.network
                );
                const distributionCount: number =
                    distributionItem?._count?.id || 0;
                const activityCount: number = item._count?.id || 0;

                return {
                    network: item.network,
                    activeCount: activityCount,
                    activityRate:
                        distributionCount > 0
                            ? Math.round(
                                  (activityCount / distributionCount) * 10000
                              ) / 100
                            : 0,
                };
            }),
        };
    } catch (error) {
        console.error("Error fetching wallet network analysis:", error);
        throw error;
    }
}

// 📈 지갑 생성 및 활동 추이 분석
export async function getWalletGrowthData(days: number = 30) {
    try {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const [createdWallets, activeWallets] = await Promise.all([
            // 일별 지갑 생성 추이 - 타입 안전한 방식
            prisma.wallet.findMany({
                where: {
                    createdAt: {
                        gte: startDate,
                    },
                    status: "ACTIVE",
                },
                select: {
                    createdAt: true,
                },
                orderBy: {
                    createdAt: "asc",
                },
            }),

            // 일별 지갑 활동 추이 - 타입 안전한 방식
            prisma.wallet.findMany({
                where: {
                    lastAccessedAt: {
                        gte: startDate,
                    },
                    status: "ACTIVE",
                },
                select: {
                    lastAccessedAt: true,
                    id: true,
                },
                orderBy: {
                    lastAccessedAt: "asc",
                },
            }),
        ]);

        // 📊 JavaScript로 날짜별 집계 처리
        const walletCreationMap = new Map<string, number>();
        const walletActivityMap = new Map<string, Set<string>>();

        // 생성된 지갑 집계
        createdWallets.forEach((wallet) => {
            const dateKey = wallet.createdAt.toISOString().split("T")[0];
            walletCreationMap.set(
                dateKey,
                (walletCreationMap.get(dateKey) || 0) + 1
            );
        });

        // 활동한 지갑 집계 (중복 제거)
        activeWallets.forEach((wallet) => {
            const dateKey = wallet.lastAccessedAt.toISOString().split("T")[0];
            if (!walletActivityMap.has(dateKey)) {
                walletActivityMap.set(dateKey, new Set());
            }
            walletActivityMap.get(dateKey)!.add(wallet.id);
        });

        // 날짜별 정렬 및 누적 계산
        const sortedCreationDates = Array.from(walletCreationMap.keys()).sort();
        const sortedActivityDates = Array.from(walletActivityMap.keys()).sort();

        let cumulativeTotal = 0;
        const walletCreation = sortedCreationDates.map((date) => {
            const newWallets = walletCreationMap.get(date) || 0;
            cumulativeTotal += newWallets;
            return {
                date,
                newWallets,
                totalWallets: cumulativeTotal,
            };
        });

        const walletActivity = sortedActivityDates.map((date) => ({
            date,
            activeWallets: walletActivityMap.get(date)?.size || 0,
        }));

        return {
            walletCreation,
            walletActivity,
        };
    } catch (error) {
        console.error("Error fetching wallet growth data:", error);
        throw error;
    }
}

// 💎 지갑별 자산 보유 현황 분석
export async function getWalletAssetAnalysis() {
    try {
        const [assetDistribution, topAssetHolders, assetTypes] =
            await Promise.all([
                // 자산별 보유 지갑 수 (에셋 정보 포함)
                prisma.playerAsset.groupBy({
                    by: ["assetId"],
                    where: { balance: { gt: 0 } },
                    _count: { playerId: true },
                    _sum: { balance: true },
                }),

                // 자산을 가장 많이 보유한 지갑들
                prisma.player.findMany({
                    where: {
                        playerAssets: { some: { balance: { gt: 0 } } },
                        user: {
                            wallets: { some: { status: "ACTIVE" } },
                        },
                    },
                    orderBy: {
                        playerAssets: { _count: "desc" },
                    },
                    take: 10,
                    select: {
                        id: true,
                        nickname: true,
                        user: {
                            select: {
                                wallets: {
                                    where: { status: "ACTIVE" },
                                    select: {
                                        address: true,
                                        network: true,
                                        default: true,
                                    },
                                },
                            },
                        },
                        playerAssets: {
                            where: { balance: { gt: 0 } },
                            select: {
                                balance: true,
                                asset: {
                                    select: {
                                        name: true,
                                        symbol: true,
                                        assetType: true,
                                    },
                                },
                            },
                        },
                    },
                }),

                // 자산 타입별 분포
                prisma.asset.groupBy({
                    by: ["assetType"],
                    where: {
                        playerAssets: { some: { balance: { gt: 0 } } },
                    },
                    _count: { id: true },
                }),
            ]);

        // 에셋 정보를 가져와서 매핑
        const assetIds = assetDistribution.map((item: any) => item.assetId);
        const assetInfos = await prisma.asset.findMany({
            where: { id: { in: assetIds } },
            select: {
                id: true,
                name: true,
                symbol: true,
                iconUrl: true,
            },
        });

        const assetInfoMap = new Map(
            assetInfos.map((asset: any) => [asset.id, asset])
        );

        return {
            assetDistribution: assetDistribution.map((item: any) => {
                const assetInfo = assetInfoMap.get(item.assetId);
                return {
                    assetId: item.assetId,
                    name: assetInfo?.name,
                    symbol: assetInfo?.symbol,
                    iconUrl: assetInfo?.iconUrl,
                    holderCount: item._count.playerId,
                    totalBalance: item._sum.balance,
                };
            }),
            topAssetHolders: topAssetHolders.map((player: any) => ({
                playerId: player.id,
                nickname: player.nickname,
                wallets: player.user.wallets,
                totalAssets: player.playerAssets.reduce(
                    (sum: number, asset: any) => sum + asset.balance,
                    0
                ),
                assetTypes: player.playerAssets.length,
            })),
            assetTypes: assetTypes.map((item: any) => ({
                type: item.assetType,
                count: item._count.id,
            })),
        };
    } catch (error) {
        console.error("Error fetching wallet asset analysis:", error);
        throw error;
    }
}

// 🎯 새로운 에셋 분석 함수들

// 🏆 에셋별 보유 순위 분석 (기존 - 상위 10명만)
export async function getAssetHoldingRanking() {
    try {
        // 모든 활성 에셋 가져오기
        const assets = await prisma.asset.findMany({
            where: {
                isActive: true,
                playerAssets: { some: { balance: { gt: 0 } } },
            },
            select: {
                id: true,
                name: true,
                symbol: true,
                iconUrl: true,
            },
        });

        // 각 에셋별 보유 순위 데이터 생성
        const assetRankings = await Promise.all(
            assets.map(async (asset) => {
                // 해당 에셋의 보유자들 (상위 10명)
                const topHolders = await prisma.playerAsset.findMany({
                    where: {
                        assetId: asset.id,
                        balance: { gt: 0 },
                    },
                    orderBy: {
                        balance: "desc",
                    },
                    take: 10,
                    select: {
                        balance: true,
                        player: {
                            select: {
                                id: true,
                                name: true, // Player의 name 필드
                                nickname: true,
                                user: {
                                    select: {
                                        name: true, // User의 name 필드
                                    },
                                },
                            },
                        },
                    },
                });

                // 총 보유자 수와 총 발행량
                const [totalHolders, totalBalanceResult] = await Promise.all([
                    prisma.playerAsset.count({
                        where: {
                            assetId: asset.id,
                            balance: { gt: 0 },
                        },
                    }),
                    prisma.playerAsset.aggregate({
                        where: {
                            assetId: asset.id,
                            balance: { gt: 0 },
                        },
                        _sum: { balance: true },
                    }),
                ]);

                const totalSupply =
                    (totalBalanceResult._sum as any)?.balance || 0;

                return {
                    assetId: asset.id,
                    name: asset.name,
                    symbol: asset.symbol,
                    iconUrl: asset.iconUrl,
                    totalHolders,
                    totalBalance: totalSupply,
                    topHolders: topHolders.map((holder: any) => ({
                        playerId: holder.player.id,
                        nickname: holder.player.nickname,
                        playerName: holder.player.name, // Player의 name
                        userName: holder.player.user?.name, // User의 name
                        balance: holder.balance,
                        percentage:
                            totalSupply > 0
                                ? (holder.balance / totalSupply) * 100
                                : 0,
                    })),
                };
            })
        );

        return assetRankings;
    } catch (error) {
        console.error("Error fetching asset holding ranking:", error);
        throw error;
    }
}

// 🏆 특정 에셋의 페이지네이션된 보유 순위 분석
export async function getAssetHoldingRankingPaginated(
    assetId: string,
    page: number = 1,
    pageSize: number = 50
) {
    try {
        const skip = (page - 1) * pageSize;

        // 에셋 정보 가져오기
        const asset = await prisma.asset.findUnique({
            where: { id: assetId },
            select: {
                id: true,
                name: true,
                symbol: true,
                iconUrl: true,
                isActive: true,
            },
        });

        if (!asset || !asset.isActive) {
            throw new Error(`Asset not found or inactive: ${assetId}`);
        }

        // 해당 에셋의 보유자들 (페이지네이션)
        const [holders, totalHolders, totalBalanceResult] = await Promise.all([
            prisma.playerAsset.findMany({
                where: {
                    assetId: asset.id,
                    balance: { gt: 0 },
                },
                orderBy: {
                    balance: "desc",
                },
                skip,
                take: pageSize,
                select: {
                    balance: true,
                    player: {
                        select: {
                            id: true,
                            name: true,
                            nickname: true,
                            user: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                },
            }),
            // 총 보유자 수
            prisma.playerAsset.count({
                where: {
                    assetId: asset.id,
                    balance: { gt: 0 },
                },
            }),
            // 총 발행량
            prisma.playerAsset.aggregate({
                where: {
                    assetId: asset.id,
                    balance: { gt: 0 },
                },
                _sum: { balance: true },
            }),
        ]);

        const totalSupply = (totalBalanceResult._sum as any)?.balance || 0;
        const totalPages = Math.ceil(totalHolders / pageSize);

        // 순위 계산 (전체 순위에서의 위치)
        const startRank = skip + 1;

        return {
            asset: {
                assetId: asset.id,
                name: asset.name,
                symbol: asset.symbol,
                iconUrl: asset.iconUrl,
                totalHolders,
                totalBalance: totalSupply,
            },
            holders: holders.map((holder: any, index: number) => ({
                rank: startRank + index,
                playerId: holder.player.id,
                nickname: holder.player.nickname,
                playerName: holder.player.name,
                userName: holder.player.user?.name,
                balance: holder.balance,
                percentage:
                    totalSupply > 0 ? (holder.balance / totalSupply) * 100 : 0,
            })),
            pagination: {
                currentPage: page,
                pageSize,
                totalPages,
                totalItems: totalHolders,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };
    } catch (error) {
        console.error("Error fetching paginated asset holding ranking:", error);
        throw error;
    }
}

// 🛤️ 에셋 획득 경로 분석
export async function getAssetAcquisitionPath() {
    try {
        // 모든 활성 에셋 가져오기
        const assets = await prisma.asset.findMany({
            where: {
                isActive: true,
                rewardsLogs: { some: { amount: { gt: 0 } } },
            },
            select: {
                id: true,
                name: true,
                symbol: true,
                iconUrl: true,
            },
        });

        // 각 에셋별 획득 경로 분석
        const assetAcquisitionPaths = await Promise.all(
            assets.map(async (asset) => {
                // 해당 에셋의 모든 보상 로그 가져오기
                const rewardLogs = await prisma.rewardsLog.findMany({
                    where: {
                        assetId: asset.id,
                        amount: { gt: 0 },
                    },
                    select: {
                        amount: true,
                        questId: true,
                        pollId: true,
                        raffleId: true,
                        reason: true,
                    },
                });

                // 획득 경로별 집계
                const pathMap = new Map<
                    string,
                    { count: number; amount: number }
                >();

                rewardLogs.forEach((log) => {
                    let source = "other";

                    if (log.questId) {
                        source = "quest";
                    } else if (log.pollId) {
                        source = "poll";
                    } else if (log.raffleId) {
                        source = "raffle";
                    } else if (
                        log.reason?.includes("direct") ||
                        log.reason?.includes("admin")
                    ) {
                        source = "direct";
                    }

                    const current = pathMap.get(source) || {
                        count: 0,
                        amount: 0,
                    };
                    pathMap.set(source, {
                        count: current.count + 1,
                        amount: current.amount + log.amount,
                    });
                });

                // 총 수량 계산
                const totalAmount = Array.from(pathMap.values()).reduce(
                    (sum, item) => sum + item.amount,
                    0
                );

                // 비율 계산
                const acquisitionPaths = Array.from(pathMap.entries()).map(
                    ([source, data]) => ({
                        source,
                        count: data.count,
                        amount: data.amount,
                        percentage:
                            totalAmount > 0
                                ? (data.amount / totalAmount) * 100
                                : 0,
                    })
                );

                return {
                    assetId: asset.id,
                    name: asset.name,
                    symbol: asset.symbol,
                    iconUrl: asset.iconUrl,
                    acquisitionPaths,
                };
            })
        );

        return assetAcquisitionPaths;
    } catch (error) {
        console.error("Error fetching asset acquisition path:", error);
        throw error;
    }
}

// 📊 에셋 집중도 분석
export async function getAssetConcentration() {
    try {
        // 모든 활성 에셋 가져오기
        const assets = await prisma.asset.findMany({
            where: {
                isActive: true,
                playerAssets: { some: { balance: { gt: 0 } } },
            },
            select: {
                id: true,
                name: true,
                symbol: true,
                iconUrl: true,
            },
        });

        // 각 에셋별 집중도 분석
        const assetConcentrations = await Promise.all(
            assets.map(async (asset) => {
                // 해당 에셋의 모든 보유자 데이터
                const holders = await prisma.playerAsset.findMany({
                    where: {
                        assetId: asset.id,
                        balance: { gt: 0 },
                    },
                    select: {
                        balance: true,
                        updatedAt: true,
                    },
                    orderBy: {
                        balance: "desc",
                    },
                });

                if (holders.length === 0) {
                    return {
                        assetId: asset.id,
                        name: asset.name,
                        symbol: asset.symbol,
                        iconUrl: asset.iconUrl,
                        concentrationMetrics: {
                            giniCoefficient: 0,
                            top10Percentage: 0,
                            top1Percentage: 0,
                            activeHolders: 0,
                            concentrationLevel: "LOW" as const,
                        },
                    };
                }

                const totalBalance = holders.reduce(
                    (sum, holder) => sum + holder.balance,
                    0
                );
                const totalHolders = holders.length;

                // 지니계수 계산
                const giniCoefficient = calculateGiniCoefficient(
                    holders.map((h) => h.balance)
                );

                // 상위 10%와 1% 보유 비율 계산
                const top10Count = Math.max(1, Math.floor(totalHolders * 0.1));
                const top1Count = Math.max(1, Math.floor(totalHolders * 0.01));

                const top10Balance = holders
                    .slice(0, top10Count)
                    .reduce((sum, h) => sum + h.balance, 0);
                const top1Balance = holders
                    .slice(0, top1Count)
                    .reduce((sum, h) => sum + h.balance, 0);

                const top10Percentage =
                    totalBalance > 0 ? (top10Balance / totalBalance) * 100 : 0;
                const top1Percentage =
                    totalBalance > 0 ? (top1Balance / totalBalance) * 100 : 0;

                // 활성 보유자 수 (최근 30일 내 업데이트)
                const thirtyDaysAgo = new Date(
                    Date.now() - 30 * 24 * 60 * 60 * 1000
                );
                const activeHolders = holders.filter(
                    (h) => h.updatedAt >= thirtyDaysAgo
                ).length;

                // 집중도 레벨 결정
                let concentrationLevel: "LOW" | "MEDIUM" | "HIGH" | "EXTREME" =
                    "LOW";
                if (giniCoefficient > 0.8) {
                    concentrationLevel = "EXTREME";
                } else if (giniCoefficient > 0.6) {
                    concentrationLevel = "HIGH";
                } else if (giniCoefficient > 0.4) {
                    concentrationLevel = "MEDIUM";
                }

                return {
                    assetId: asset.id,
                    name: asset.name,
                    symbol: asset.symbol,
                    iconUrl: asset.iconUrl,
                    concentrationMetrics: {
                        giniCoefficient,
                        top10Percentage,
                        top1Percentage,
                        activeHolders,
                        concentrationLevel,
                    },
                };
            })
        );

        return assetConcentrations;
    } catch (error) {
        console.error("Error fetching asset concentration:", error);
        throw error;
    }
}

// 🔧 유틸리티 함수: 지니계수 계산
function calculateGiniCoefficient(balances: number[]): number {
    if (balances.length === 0) return 0;

    const sortedBalances = [...balances].sort((a, b) => a - b);
    const n = sortedBalances.length;
    const total = sortedBalances.reduce((sum, balance) => sum + balance, 0);

    if (total === 0) return 0;

    let gini = 0;
    for (let i = 0; i < n; i++) {
        gini += (2 * (i + 1) - n - 1) * sortedBalances[i];
    }

    return gini / (n * total);
}

// 🔍 지갑 중심 사용자 테이블 데이터 조회
export async function getWalletUserTableData(
    page: number = 1,
    pageSize: number = 50,
    filters: {
        search?: string;
        network?: string;
        hasAssets?: boolean;
        hasMultipleWallets?: boolean;
        isActive?: boolean;
        sortBy?: "createdAt" | "lastAccessedAt" | "assetCount" | "walletCount";
        sortOrder?: "asc" | "desc";
    } = {}
) {
    try {
        const skip = (page - 1) * pageSize;
        const {
            search,
            network,
            hasAssets,
            hasMultipleWallets,
            isActive,
            sortBy = "createdAt",
            sortOrder = "desc",
        } = filters;

        // 기본 WHERE 조건
        const whereConditions: any = {
            active: true,
            wallets: { some: { status: "ACTIVE" } },
        };

        // 검색 조건
        if (search) {
            whereConditions.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                {
                    wallets: {
                        some: {
                            address: { contains: search, mode: "insensitive" },
                        },
                    },
                },
                {
                    player: {
                        nickname: { contains: search, mode: "insensitive" },
                    },
                },
            ];
        }

        // 네트워크 필터
        if (network) {
            whereConditions.wallets = {
                some: { network: network, status: "ACTIVE" },
            };
        }

        // 자산 보유 필터
        if (hasAssets) {
            whereConditions.player = {
                playerAssets: { some: { balance: { gt: 0 } } },
            };
        }

        // 활성 사용자 필터
        if (isActive !== undefined) {
            whereConditions.active = isActive;
        }

        // 멀티 지갑 필터 (복잡한 조건이므로 별도 처리)
        if (hasMultipleWallets) {
            // 이 조건은 나중에 클라이언트 측에서 필터링
        }

        // 정렬 조건
        const orderBy: any = {};
        if (sortBy === "lastAccessedAt") {
            orderBy.wallets = { lastAccessedAt: sortOrder };
        } else if (sortBy === "assetCount") {
            orderBy.player = { playerAssets: { _count: sortOrder } };
        } else {
            orderBy.createdAt = sortOrder;
        }

        const [users, totalCount] = await Promise.all([
            prisma.user.findMany({
                skip,
                take: pageSize,
                where: whereConditions,
                orderBy,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    active: true,
                    createdAt: true,
                    lastLoginAt: true,
                    player: {
                        select: {
                            id: true,
                            nickname: true,
                            lastConnectedAt: true,
                            playerAssets: {
                                where: { balance: { gt: 0 } },
                                select: {
                                    balance: true,
                                    asset: {
                                        select: {
                                            name: true,
                                            symbol: true,
                                            assetType: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    wallets: {
                        where: { status: "ACTIVE" },
                        select: {
                            id: true,
                            address: true,
                            network: true,
                            default: true,
                            createdAt: true,
                            lastAccessedAt: true,
                        },
                    },
                    payments: {
                        where: { status: "COMPLETED" },
                        select: {
                            amount: true,
                            receiverWalletAddress: true,
                        },
                    },
                },
            }),
            prisma.user.count({ where: whereConditions }),
        ]);

        // 데이터 가공 및 멀티 지갑 필터링
        let processedUsers = users.map((user: any) => {
            const totalAssets =
                user.player?.playerAssets.reduce(
                    (sum: number, asset: any) => sum + asset.balance,
                    0
                ) || 0;

            const totalPayments = user.payments.reduce(
                (sum: number, payment: any) => sum + payment.amount,
                0
            );

            const primaryWallet =
                user.wallets.find((w: any) => w.default) || user.wallets[0];
            const networks = [
                ...new Set(user.wallets.map((w: any) => w.network)),
            ];

            return {
                userId: user.id,
                name: user.name,
                email: user.email,
                playerId: user.player?.id,
                nickname: user.player?.nickname,
                createdAt: user.createdAt,
                lastLoginAt: user.lastLoginAt,
                lastConnectedAt: user.player?.lastConnectedAt,

                // 🔗 지갑 정보
                walletCount: user.wallets.length,
                primaryWallet: primaryWallet?.address,
                networks: networks,

                // 💎 자산 정보
                assetCount: user.player?.playerAssets.length || 0,
                totalAssets,
                assetTypes:
                    user.player?.playerAssets.map(
                        (pa: any) => pa.asset.assetType
                    ) || [],

                // 💰 거래 정보
                totalPayments,
                paymentCount: user.payments.length,

                // 📊 지갑 활동 지표
                walletUtilizationRate:
                    user.wallets.length > 0 ? (totalAssets > 0 ? 100 : 0) : 0,
                isMultiWallet: user.wallets.length > 1,
                isActive: user.active,

                // 🎯 리스크 레벨 (지갑 기준)
                riskLevel:
                    user.wallets.length > 5
                        ? "high"
                        : user.wallets.length > 2
                        ? "medium"
                        : "low",
            };
        });

        // 멀티 지갑 필터 적용
        if (hasMultipleWallets) {
            processedUsers = processedUsers.filter(
                (user) => user.isMultiWallet
            );
        }

        return {
            users: processedUsers,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            currentPage: page,
            pageSize,
        };
    } catch (error) {
        console.error("Error fetching wallet user table data:", error);
        throw error;
    }
}

// 📊 지갑 활동 패턴 분석
export async function getWalletActivityPatterns(days: number = 30) {
    try {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const [recentActiveWallets, allActiveWallets] = await Promise.all([
            // 최근 활동한 지갑들 (시간대별, 요일별 분석용)
            prisma.wallet.findMany({
                where: {
                    lastAccessedAt: {
                        gte: startDate,
                    },
                    status: "ACTIVE",
                },
                select: {
                    lastAccessedAt: true,
                },
            }),

            // 모든 활성 지갑들 (연령대별 분포용)
            prisma.wallet.findMany({
                where: {
                    status: "ACTIVE",
                },
                select: {
                    createdAt: true,
                },
            }),
        ]);

        // 📊 JavaScript로 시간대별 집계 처리
        const hourlyActivityMap = new Map<number, number>();
        const dailyActivityMap = new Map<number, number>();

        // 시간대별 및 요일별 활동 집계
        recentActiveWallets.forEach((wallet) => {
            const hour = wallet.lastAccessedAt.getHours();
            const dayOfWeek = wallet.lastAccessedAt.getDay();

            // 시간대별 집계
            hourlyActivityMap.set(hour, (hourlyActivityMap.get(hour) || 0) + 1);

            // 요일별 집계
            dailyActivityMap.set(
                dayOfWeek,
                (dailyActivityMap.get(dayOfWeek) || 0) + 1
            );
        });

        // 📊 지갑 연령대별 분포 계산
        const now = new Date();
        const ageDistributionMap = new Map<string, number>();

        allActiveWallets.forEach((wallet) => {
            const daysDiff = Math.floor(
                (now.getTime() - wallet.createdAt.getTime()) /
                    (1000 * 60 * 60 * 24)
            );

            let ageGroup: string;
            if (daysDiff < 7) {
                ageGroup = "1주일 이내";
            } else if (daysDiff < 30) {
                ageGroup = "1개월 이내";
            } else if (daysDiff < 90) {
                ageGroup = "3개월 이내";
            } else if (daysDiff < 180) {
                ageGroup = "6개월 이내";
            } else {
                ageGroup = "6개월 이상";
            }

            ageDistributionMap.set(
                ageGroup,
                (ageDistributionMap.get(ageGroup) || 0) + 1
            );
        });

        // 📈 결과 포맷팅
        const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
            hour,
            activityCount: hourlyActivityMap.get(hour) || 0,
        }));

        const dailyActivity = Array.from({ length: 7 }, (_, dayOfWeek) => ({
            dayOfWeek,
            activityCount: dailyActivityMap.get(dayOfWeek) || 0,
        }));

        const ageGroupOrder = [
            "1주일 이내",
            "1개월 이내",
            "3개월 이내",
            "6개월 이내",
            "6개월 이상",
        ];
        const walletAgeDistribution = ageGroupOrder.map((ageGroup) => ({
            ageGroup,
            walletCount: ageDistributionMap.get(ageGroup) || 0,
        }));

        return {
            hourlyActivity,
            dailyActivity,
            walletAgeDistribution,
        };
    } catch (error) {
        console.error("Error fetching wallet activity patterns:", error);
        throw error;
    }
}

// 🚨 지갑 리스크 분석 (보안 관점)
export async function getWalletRiskAnalysis() {
    try {
        const [suspiciousActivity, highValueWallets, frequentTransfers] =
            await Promise.all([
                // 의심스러운 활동 패턴 - 최근 24시간 내 지갑 생성한 사용자들
                prisma.user.findMany({
                    where: {
                        active: true,
                        wallets: {
                            some: {
                                status: "ACTIVE",
                                createdAt: {
                                    gte: new Date(
                                        Date.now() - 24 * 60 * 60 * 1000
                                    ), // 최근 24시간
                                },
                            },
                        },
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        createdAt: true,
                        wallets: {
                            where: {
                                status: "ACTIVE",
                                createdAt: {
                                    gte: new Date(
                                        Date.now() - 24 * 60 * 60 * 1000
                                    ),
                                },
                            },
                            select: {
                                address: true,
                                network: true,
                                createdAt: true,
                            },
                        },
                    },
                }),

                // 고액 자산 보유 지갑
                prisma.player.findMany({
                    where: {
                        playerAssets: {
                            some: { balance: { gt: 100000 } }, // 임계값 설정
                        },
                    },
                    select: {
                        id: true,
                        nickname: true,
                        user: {
                            select: {
                                wallets: {
                                    where: { status: "ACTIVE" },
                                    select: {
                                        address: true,
                                        network: true,
                                    },
                                },
                            },
                        },
                        playerAssets: {
                            where: { balance: { gt: 0 } },
                            select: {
                                balance: true,
                                asset: {
                                    select: {
                                        name: true,
                                        symbol: true,
                                    },
                                },
                            },
                        },
                    },
                }),

                // 빈번한 거래 활동
                prisma.payment.groupBy({
                    by: ["userId"],
                    where: {
                        status: "COMPLETED",
                        createdAt: {
                            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 최근 7일
                        },
                    },
                    _count: { id: true },
                    _sum: { amount: true },
                    having: {
                        id: { _count: { gt: 10 } }, // 7일 내 10회 이상 거래
                    },
                }),
            ]);

        return {
            suspiciousActivity: suspiciousActivity.map((user: any) => ({
                userId: user.id,
                name: user.name,
                email: user.email,
                walletCount: user.wallets.length,
                recentWallets: user.wallets,
                riskScore: user.wallets.length * 10, // 간단한 리스크 점수
            })),
            highValueWallets: highValueWallets.map((player: any) => ({
                playerId: player.id,
                nickname: player.nickname,
                wallets: player.user.wallets,
                totalAssets: player.playerAssets.reduce(
                    (sum: number, asset: any) => sum + asset.balance,
                    0
                ),
                riskScore: player.user.wallets.length > 1 ? "high" : "medium",
            })),
            frequentTransfers: frequentTransfers.map((item: any) => ({
                userId: item.userId,
                transactionCount: item._count.id,
                totalAmount: item._sum.amount,
                riskScore: item._count.id > 20 ? "high" : "medium",
            })),
        };
    } catch (error) {
        console.error("Error fetching wallet risk analysis:", error);
        throw error;
    }
}

// 🔄 기존 User 중심 메트릭 (호환성 유지)
export async function getUserDashboardMetrics() {
    try {
        // 기존 코드 유지하되, 지갑 중심 메트릭을 추가로 포함
        const walletMetrics = await getWalletDashboardMetrics();

        const [totalUsers, activeUsers, paymentUsers] = await Promise.all([
            prisma.user.count({ where: { active: true } }),
            prisma.user.count({
                where: {
                    active: true,
                    lastLoginAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                },
            }),
            prisma.user.count({
                where: {
                    active: true,
                    payments: { some: { status: "COMPLETED" } },
                },
            }),
        ]);

        return {
            // 기존 User 메트릭
            totalUsers,
            activeUsers,
            paymentUsers,

            // 새로운 Wallet 메트릭
            ...walletMetrics,
        };
    } catch (error) {
        console.error("Error fetching user dashboard metrics:", error);
        throw error;
    }
}

// 🔄 기존 함수들 (호환성 유지)
export async function getUserGrowthData(days: number = 30) {
    // 기존 구현 유지
    return getWalletGrowthData(days);
}

export async function getUserTableData(
    page: number = 1,
    pageSize: number = 50,
    filters: any = {}
) {
    // 기존 구현을 새로운 지갑 중심 함수로 리다이렉트
    return getWalletUserTableData(page, pageSize, filters);
}

export async function getUserActivityAnalysis(days: number = 30) {
    // 기존 구현 유지하되 지갑 데이터 추가
    return getWalletActivityPatterns(days);
}

export async function getWalletNetworkDistribution() {
    // 기존 구현을 새로운 네트워크 분석 함수로 리다이렉트
    return getWalletNetworkAnalysis();
}

// 📈 DAU/MAU 분석 - 새로운 핵심 함수
export async function getDAUMAUAnalysis(days: number = 30) {
    try {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        // 📊 DAU 데이터 계산 (일별 활성 지갑 수)
        const activeWalletsByDay = await prisma.wallet.findMany({
            where: {
                status: "ACTIVE",
                lastAccessedAt: {
                    gte: startDate,
                },
            },
            select: {
                id: true,
                lastAccessedAt: true,
                userId: true,
            },
        });

        // 📅 MAU 데이터 계산 (월별 활성 지갑 수)
        const monthsBack = 6;
        const mauData = [];

        for (let i = monthsBack - 1; i >= 0; i--) {
            const monthStart = new Date(
                now.getFullYear(),
                now.getMonth() - i,
                1
            );
            const monthEnd = new Date(
                now.getFullYear(),
                now.getMonth() - i + 1,
                0
            );

            const [monthlyActiveWallets, monthlyNewWallets] = await Promise.all(
                [
                    // 해당 월에 활동한 지갑들
                    prisma.wallet.findMany({
                        where: {
                            status: "ACTIVE",
                            lastAccessedAt: {
                                gte: monthStart,
                                lte: monthEnd,
                            },
                        },
                        select: {
                            id: true,
                            userId: true,
                            createdAt: true,
                        },
                    }),

                    // 해당 월에 새로 생성된 지갑들
                    prisma.wallet.findMany({
                        where: {
                            status: "ACTIVE",
                            createdAt: {
                                gte: monthStart,
                                lte: monthEnd,
                            },
                        },
                        select: {
                            id: true,
                            userId: true,
                        },
                    }),
                ]
            );

            // 고유 사용자 수 계산
            const uniqueActiveUsers = new Set(
                monthlyActiveWallets.map((w) => w.userId)
            ).size;
            const uniqueNewUsers = new Set(
                monthlyNewWallets.map((w) => w.userId)
            ).size;

            // 이탈률 계산 (간단한 방식: 이전 달 대비)
            const prevMonthActiveUsers: number =
                i < monthsBack - 1
                    ? mauData[mauData.length - 1]?.activeUsers || 0
                    : 0;
            const churnRate: number =
                prevMonthActiveUsers > 0
                    ? Math.max(
                          0,
                          ((prevMonthActiveUsers - uniqueActiveUsers) /
                              prevMonthActiveUsers) *
                              100
                      )
                    : 0;

            mauData.push({
                month: monthStart.toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                }),
                activeUsers: uniqueActiveUsers,
                newUsers: uniqueNewUsers,
                churnRate: Math.round(churnRate * 100) / 100,
            });
        }

        // 📊 DAU 데이터 처리 (일별 집계)
        const dauMap = new Map<string, Set<string>>();
        const newUserMap = new Map<string, Set<string>>();

        activeWalletsByDay.forEach((wallet) => {
            const dateKey = wallet.lastAccessedAt.toISOString().split("T")[0];
            const userId = wallet.userId;

            // DAU 집계 (고유 사용자 기준)
            if (!dauMap.has(dateKey)) {
                dauMap.set(dateKey, new Set());
            }
            dauMap.get(dateKey)!.add(userId);

            // 신규 사용자 여부 확인 (7일 이내 생성된 지갑)
            const isNewUser =
                wallet.lastAccessedAt.getTime() -
                    new Date(
                        wallet.lastAccessedAt.getTime() -
                            7 * 24 * 60 * 60 * 1000
                    ).getTime() >
                0;
            if (isNewUser) {
                if (!newUserMap.has(dateKey)) {
                    newUserMap.set(dateKey, new Set());
                }
                newUserMap.get(dateKey)!.add(userId);
            }
        });

        // 📈 DAU 배열 생성
        const dauData = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateKey = date.toISOString().split("T")[0];

            const activeUsers = dauMap.get(dateKey)?.size || 0;
            const newUsers = newUserMap.get(dateKey)?.size || 0;
            const returningUsers = activeUsers - newUsers;

            dauData.push({
                date: dateKey,
                activeUsers,
                newUsers,
                returningUsers,
            });
        }

        return {
            dauData,
            mauData,
        };
    } catch (error) {
        console.error("Error fetching DAU/MAU analysis:", error);
        throw error;
    }
}

export async function getReferralAnalysis() {
    try {
        const [topReferrers, referralGrowth] = await Promise.all([
            prisma.player.findMany({
                where: { referralCount: { gt: 0 } },
                orderBy: { referralCount: "desc" },
                take: 10,
                select: {
                    id: true,
                    nickname: true,
                    referralCount: true,
                    createdAt: true,
                },
            }),

            prisma.referralLog.groupBy({
                by: ["method"],
                _count: { id: true },
            }),
        ]);

        return {
            topReferrers,
            referralGrowth,
        };
    } catch (error) {
        console.error("Error fetching referral analysis:", error);
        throw error;
    }
}
