/// components/user/User.Rewards.Modal.Card.tsx

"use client";

import { memo, useCallback, useState, useMemo, useRef, useEffect } from "react";

import { formatDistanceToNow } from "date-fns";
import { XIcon } from "lucide-react";

import { useInfiniteRewardsLogs } from "@/app/hooks/useRewardsLogs";
import { usePlayerAssetsGet } from "@/app/actions/playerAssets/hooks";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import Funds from "../atoms/Funds";
import PartialLoading from "../atoms/PartialLoading";
import { Button } from "../ui/button";
import { useToast } from "@/app/hooks/useToast";
import type {
    PlayerAssetWithAsset,
    AssetInstanceWithRelations,
} from "@/app/actions/playerAssets/actions";
import type { RewardLog } from "@/app/actions/rewardsLogs";

interface UserRewardsModalCardProps {
    playerId?: string;
    reward: PlayerAssetWithAsset;
    closeModal: () => void;
}

function UserRewardsModalCard({
    playerId,
    reward,
    closeModal,
}: UserRewardsModalCardProps) {
    const [showPointsMissing, setShowPointsMissing] = useState(false);
    const [activeTab, setActiveTab] = useState<"items" | "total">(
        reward.asset.hasInstance ? "items" : "total"
    );

    const {
        playerAssetInstances,
        isPlayerAssetInstancesLoading,
        playerAssetInstancesError,
    } = usePlayerAssetsGet({
        getPlayerAssetInstancesInput: reward.asset.hasInstance
            ? {
                  playerId: playerId ?? "",
                  assetId: reward.asset.id,
              }
            : undefined,
    });

    const togglePointsMissing = useCallback(() => {
        setShowPointsMissing((prev) => !prev);
    }, []);

    const formatDate = useCallback((date: Date) => {
        const formattedDate = date.toLocaleDateString();
        const formattedTime = date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
        return `${formattedDate} ${formattedTime}`;
    }, []);

    const getRelativeTime = useCallback((date: Date) => {
        return formatDistanceToNow(date, { addSuffix: true });
    }, []);

    return (
        <div
            className={cn(
                "w-full max-w-[1000px] h-full max-h-[90vh] mx-auto",
                "flex flex-col",
                "border border-[rgba(255,255,255,0.1)]",
                "bg-gradient-to-br from-[#09021B] to-[#311473]",
                "rounded-[18px]",
                "shadow-lg",
                "relative",
                "overflow-hidden"
            )}
        >
            {/* 닫기 버튼 */}
            <button
                onClick={closeModal}
                className={cn(
                    "absolute top-4 right-4 z-20",
                    "p-2 rounded-lg",
                    "hover:bg-white/10 transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-white/30"
                )}
                aria-label="Close modal"
            >
                <XIcon
                    className={cn(
                        getResponsiveClass(25).frameClass,
                        "text-white"
                    )}
                />
            </button>

            {/* 포인트 미싱 정보 팝업 */}
            {showPointsMissing && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#5321C6] rounded-[18px] p-5 animate-fadeIn">
                    <div className="w-full max-w-[500px] max-h-full overflow-y-auto">
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-center mb-2">
                                <img
                                    src="/ui/information.svg"
                                    alt="info"
                                    className={
                                        getResponsiveClass(50).frameClass
                                    }
                                    loading="lazy"
                                />
                            </div>
                            <p
                                className={cn(
                                    getResponsiveClass(30).textClass,
                                    "font-bold"
                                )}
                            >
                                {`For the Starglowers who collected 'Points' through telegram mini app:`}
                            </p>
                            <p className={getResponsiveClass(25).textClass}>
                                <strong>Points</strong> are officially all
                                integrated into <strong>SGP</strong> from
                                05/20/2025 and no longer used. Rewards for
                                mission complete will be given in{" "}
                                <strong>SGP</strong>.
                            </p>
                            <p className={getResponsiveClass(25).textClass}>
                                They have the same value and are available to
                                exchange into <strong>SGT</strong> after token
                                generation.
                            </p>
                            <Button
                                className={cn(
                                    getResponsiveClass(25).textClass,
                                    "mt-4"
                                )}
                                onClick={togglePointsMissing}
                            >
                                Okay, got it
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col h-full max-h-full overflow-hidden">
                {/* 헤더 섹션 */}
                <header
                    className={cn(
                        "flex-shrink-0 flex-grow-0",
                        "pt-12 pb-6 px-6",
                        "text-center"
                    )}
                >
                    <h2
                        className={cn(
                            getResponsiveClass(35).textClass,
                            "font-bold mb-3"
                        )}
                        id="reward-modal-title"
                    >
                        {reward.asset.name}
                    </h2>

                    <div className="flex justify-center mb-3">
                        <img
                            src="/elements/el03.svg"
                            alt="el03"
                            className={getResponsiveClass(40).frameClass}
                            loading="lazy"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                    "/elements/el03.svg";
                            }}
                        />
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <Funds
                            funds={reward.balance}
                            fundsLabel={reward.asset.symbol}
                            fundsIcon={reward.asset.iconUrl ?? undefined}
                            frameSize={30}
                            textSize={30}
                            gapSize={20}
                            paddingSize={15}
                            className="bg-[rgba(255,255,255,0.1)]"
                        />

                        {/* hasInstance 자산 정보 */}
                        {reward.asset.hasInstance && (
                            <div
                                className={cn(
                                    getResponsiveClass(15).textClass,
                                    "text-white/60",
                                    "mt-1"
                                )}
                            >
                                {reward.balance} items owned
                            </div>
                        )}

                        {reward.asset.name === "SGP" && (
                            <button
                                className={cn(
                                    getResponsiveClass(15).textClass,
                                    "text-[rgba(255,255,255,0.4)]",
                                    "underline underline-offset-2",
                                    "cursor-pointer",
                                    "hover:text-white/60 transition-colors",
                                    "focus:outline-none focus:ring-2 focus:ring-white/30 rounded-sm",
                                    "mt-1"
                                )}
                                onClick={togglePointsMissing}
                            >
                                points are missing? →
                            </button>
                        )}
                    </div>
                </header>

                {/* 탭 네비게이션 - hasInstance인 경우에만 표시 */}
                {reward.asset.hasInstance && (
                    <div className={cn("flex gap-1 px-6")}>
                        <TabButton
                            label="Items"
                            isActive={activeTab === "items"}
                            onClick={() => setActiveTab("items")}
                        />
                        <TabButton
                            label="History"
                            isActive={activeTab === "total"}
                            onClick={() => setActiveTab("total")}
                        />
                    </div>
                )}

                {/* 보상 히스토리 섹션 */}
                <section
                    className={cn(
                        "flex-1",
                        "min-h-0",
                        "overflow-hidden",
                        "px-6 pb-6"
                    )}
                >
                    <div
                        className={cn(
                            "h-full pt-1",
                            "scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                        )}
                    >
                        <div className="max-w-[800px] mx-auto pt-1">
                            {reward.asset.hasInstance &&
                            activeTab === "items" ? (
                                <AssetInstancesView
                                    instances={
                                        playerAssetInstances?.data?.instances ||
                                        []
                                    }
                                    isLoading={isPlayerAssetInstancesLoading}
                                    error={playerAssetInstancesError}
                                />
                            ) : (
                                <RewardsHistoryView
                                    playerId={playerId}
                                    assetId={reward.asset.id}
                                    formatDate={formatDate}
                                    getRelativeTime={getRelativeTime}
                                />
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

// TabButton 컴포넌트
interface TabButtonProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
}

function TabButton({ label, isActive, onClick }: TabButtonProps) {
    return (
        <button
            className={cn(
                "flex-1 rounded-md text-sm font-medium transition-all duration-300",
                "flex items-center justify-center gap-2",
                "backdrop-blur-sm",

                isActive
                    ? [
                          "bg-gradient-to-r from-white/25 to-white/15",
                          "border border-white/30",
                          "text-white shadow-lg shadow-white/10",
                      ]
                    : [
                          "bg-gradient-to-br from-white/10 to-white/5",
                          "border border-white/10",
                          "text-white/60",
                          "hover:bg-gradient-to-br hover:from-white/20 hover:to-white/10",
                          "hover:border-white/20 hover:text-white/80",
                      ],
                getResponsiveClass(15).textClass,
                getResponsiveClass(20).paddingClass
            )}
            onClick={onClick}
        >
            <span>{label}</span>
        </button>
    );
}

// AssetInstancesView 컴포넌트
interface AssetInstancesViewProps {
    instances: AssetInstanceWithRelations[];
    isLoading: boolean;
    error: any;
}

function AssetInstancesView({
    instances,
    isLoading,
    error,
}: AssetInstancesViewProps) {
    const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

    // 상태별 필터링
    const filteredInstances = useMemo(() => {
        if (selectedStatus === "ALL") return instances;
        return instances.filter(
            (instance) => instance.status === selectedStatus
        );
    }, [instances, selectedStatus]);

    // 상태별 개수와 우선순위 정렬
    const statusCounts = useMemo(() => {
        const counts = instances.reduce((acc, instance) => {
            acc[instance.status] = (acc[instance.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // 상태별 우선순위 정렬
        const statusOrder = [
            "RECEIVED",
            "PENDING",
            "USED",
            "EXPIRED",
            "CANCELLED",
        ];
        const sortedEntries = Object.entries(counts).sort(([a], [b]) => {
            const aIndex = statusOrder.indexOf(a);
            const bIndex = statusOrder.indexOf(b);
            return (
                (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
            );
        });

        return Object.fromEntries(sortedEntries);
    }, [instances]);

    if (isLoading) {
        return (
            <div className="py-8">
                <PartialLoading text="Loading items..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-8 text-center">
                <p className="text-red-400">Failed to load items</p>
                <button
                    className="mt-2 text-sm text-white/60 underline underline-offset-2"
                    onClick={() => window.location.reload()}
                >
                    Try again
                </button>
            </div>
        );
    }

    if (instances.length === 0) {
        return (
            <div className="py-8 text-center">
                <p className="text-white/40">No items found</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-hidden mb-2">
            {/* 상태 필터 */}
            <div
                className={cn(
                    "flex overflow-x-auto pb-2",
                    getResponsiveClass(10).gapClass,
                    getResponsiveClass(10).marginYClass
                )}
            >
                <StatusFilterTab
                    label="All"
                    count={instances.length}
                    isActive={selectedStatus === "ALL"}
                    onClick={() => setSelectedStatus("ALL")}
                    status="ALL"
                />
                {Object.entries(statusCounts).map(([status, count]) => (
                    <StatusFilterTab
                        key={status}
                        label={status}
                        count={count}
                        isActive={selectedStatus === status}
                        onClick={() => setSelectedStatus(status)}
                        status={status}
                    />
                ))}
            </div>

            {/* 인스턴스 목록 */}
            <div
                className={cn(
                    "space-y-2 h-[200px] sm:h-[250px] md:h-[300px] lg:h-[300px] xl:h-[350px] overflow-y-auto",
                    "scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent",
                    "pb-6"
                )}
            >
                {filteredInstances.length === 0 ? (
                    <div
                        className={cn(
                            "text-center",
                            getResponsiveClass(40).paddingClass
                        )}
                    >
                        <p
                            className={cn(
                                "text-white/40",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            No {selectedStatus.toLowerCase()} items found
                        </p>
                    </div>
                ) : (
                    filteredInstances.map((instance) => (
                        <AssetInstanceCard
                            key={instance.id}
                            instance={instance}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

// StatusFilterTab 컴포넌트
interface StatusFilterTabProps {
    label: string;
    count: number;
    isActive: boolean;
    onClick: () => void;
    status: string;
}

function StatusFilterTab({
    label,
    count,
    isActive,
    onClick,
    status,
}: StatusFilterTabProps) {
    const getStatusColor = (status: string, isActive: boolean) => {
        if (!isActive) {
            return [
                "bg-gradient-to-br from-white/10 to-white/5",
                "border-white/10 text-white/60",
                "hover:bg-gradient-to-br hover:from-white/20 hover:to-white/10",
                "hover:border-white/20 hover:text-white/80",
            ];
        }

        switch (status) {
            case "RECEIVED":
                return [
                    "bg-gradient-to-r from-green-600 to-green-500",
                    "border-green-400/30 text-white",
                ];
            case "PENDING":
                return [
                    "bg-gradient-to-r from-yellow-600 to-yellow-500",
                    "border-yellow-400/30 text-white",
                ];
            case "USED":
                return [
                    "bg-gradient-to-r from-gray-600 to-gray-500",
                    "border-gray-400/30 text-white",
                ];
            case "EXPIRED":
                return [
                    "bg-gradient-to-r from-red-600 to-red-500",
                    "border-red-400/30 text-white",
                ];
            case "ALL":
                return [
                    "bg-gradient-to-r from-blue-600 to-blue-500",
                    "border-blue-400/30 text-white",
                ];
            default:
                return [
                    "bg-gradient-to-r from-purple-600 to-purple-500",
                    "border-purple-400/30 text-white",
                ];
        }
    };

    const colorClasses = getStatusColor(status, isActive);

    return (
        <button
            className={cn(
                "flex-shrink-0 rounded-lg font-medium transition-all duration-300",
                "flex items-center min-w-max",
                "border backdrop-blur-sm",
                colorClasses,
                getResponsiveClass(10).textClass,
                getResponsiveClass(15).paddingClass,
                getResponsiveClass(10).gapClass
            )}
            onClick={onClick}
        >
            <span className="capitalize">
                {label === "ALL" ? "All" : label.toLowerCase()}
            </span>
            <span
                className={cn(
                    "rounded-full font-bold px-1 py-0.5",
                    "bg-white/20 backdrop-blur-sm",
                    getResponsiveClass(5).textClass
                )}
            >
                {count}
            </span>
        </button>
    );
}

// AssetInstanceCard 컴포넌트
interface AssetInstanceCardProps {
    instance: AssetInstanceWithRelations;
}

function AssetInstanceCard({ instance }: AssetInstanceCardProps) {
    const toast = useToast();

    const getStatusBadge = (status: string) => {
        const configs = {
            RECEIVED: {
                color: "text-green-400 bg-green-400/10 border-green-400/20",
                icon: "✓",
            },
            PENDING: {
                color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
                icon: "⏳",
            },
            USED: {
                color: "text-gray-400 bg-gray-400/10 border-gray-400/20",
                icon: "✓",
            },
            EXPIRED: {
                color: "text-red-400 bg-red-400/10 border-red-400/20",
                icon: "⚠",
            },
            CANCELLED: {
                color: "text-orange-400 bg-orange-400/10 border-orange-400/20",
                icon: "✕",
            },
        };

        const config =
            configs[status as keyof typeof configs] || configs.PENDING;

        return (
            <span
                className={cn(
                    "rounded-full font-medium border backdrop-blur-sm",
                    "flex items-center",
                    config.color,
                    getResponsiveClass(10).textClass,
                    getResponsiveClass(10).paddingClass,
                    getResponsiveClass(5).gapClass
                )}
            >
                <span>{config.icon}</span>
                <span className="capitalize">{status.toLowerCase()}</span>
            </span>
        );
    };

    const formatDate = (date: Date) => {
        return (
            date.toLocaleDateString() +
            " " +
            date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            })
        );
    };

    const getRelativeTime = (date: Date) => {
        return formatDistanceToNow(date, { addSuffix: true });
    };

    return (
        <article
            className={cn(
                "rounded-[16px] transition-all duration-300 ease-out",
                "bg-gradient-to-br from-white/10 to-white/5",
                "border border-white/20 backdrop-blur-sm",
                "hover:bg-gradient-to-br hover:from-white/20 hover:to-white/10",
                "hover:border-white/30 hover:shadow-lg hover:shadow-white/10",
                getResponsiveClass(20).paddingClass
            )}
        >
            <div
                className={cn(
                    "flex items-start justify-between",
                    getResponsiveClass(15).gapClass
                )}
            >
                <div className="flex-1 min-w-0">
                    {/* 메인 정보 */}
                    <div
                        className={cn(
                            "flex items-center",
                            getResponsiveClass(15).gapClass
                        )}
                    >
                        <div className="flex-1">
                            <div
                                className={cn(
                                    "font-mono font-semibold inline-block cursor-pointer",
                                    "rounded-[6px] border border-white/10",
                                    "bg-gradient-to-br from-[rgba(0,0,0,0.65)] to-[rgba(0,0,0,0.5)]",
                                    instance.code
                                        ? getResponsiveClass(30).textClass
                                        : getResponsiveClass(5).textClass,
                                    getResponsiveClass(5).marginYClass,
                                    getResponsiveClass(10).paddingClass
                                )}
                                onClick={async () => {
                                    if (instance.code) {
                                        await navigator.clipboard
                                            .writeText(
                                                instance.code ||
                                                    instance.serialNumber ||
                                                    ""
                                            )
                                            .catch((err) => {
                                                console.error(err);
                                            });

                                        toast.success("Copied to clipboard");
                                    }
                                }}
                            >
                                #{instance.code || instance.serialNumber}
                            </div>
                            <div
                                className={cn(
                                    "text-white/50",
                                    getResponsiveClass(5).textClass
                                )}
                            >
                                {getRelativeTime(new Date(instance.createdAt))}
                            </div>
                        </div>
                        {getStatusBadge(instance.status)}
                    </div>

                    {/* 상세 정보 */}
                    <div
                        className={cn(
                            "space-y-2",
                            getResponsiveClass(10).gapClass
                        )}
                    >
                        {/* 만료일 */}
                        {instance.expiresAt && (
                            <div
                                className={cn(
                                    "flex items-center",
                                    getResponsiveClass(10).gapClass,
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                <span className="text-white/40">Expires:</span>
                                <span
                                    className={cn(
                                        new Date(instance.expiresAt) <
                                            new Date()
                                            ? "text-red-400 font-medium"
                                            : "text-white/60"
                                    )}
                                >
                                    {formatDate(new Date(instance.expiresAt))}
                                </span>
                            </div>
                        )}

                        {/* 사용 정보 */}
                        {instance.usedAt && (
                            <div
                                className={cn(
                                    "flex items-center",
                                    getResponsiveClass(10).gapClass,
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                <span className="text-white/40">Used:</span>
                                <span className="text-white/60">
                                    {formatDate(new Date(instance.usedAt))}
                                </span>
                            </div>
                        )}

                        {/* 사용 용도 */}
                        {instance.usedFor && (
                            <div
                                className={cn(
                                    "flex items-center",
                                    getResponsiveClass(10).gapClass,
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                <span className="text-white/40">Used for:</span>
                                <span className="text-white/60">
                                    {instance.usedFor}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}

// RewardsHistoryView 컴포넌트 - 무한 스크롤로 개선
interface RewardsHistoryViewProps {
    playerId?: string;
    assetId: string;
    formatDate: (date: Date) => string;
    getRelativeTime: (date: Date) => string;
}

function RewardsHistoryView({
    playerId,
    assetId,
    formatDate,
    getRelativeTime,
}: RewardsHistoryViewProps) {
    // 무한 스크롤을 위한 ref
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // 무한 스크롤 쿼리
    const {
        data: infiniteData,
        isLoading: isInfiniteLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        error: infiniteError,
    } = useInfiniteRewardsLogs({
        playerId: playerId ?? "",
        assetId: assetId,
    });

    // 모든 보상 로그를 하나의 배열로 합치기
    const allRewardsLogs = useMemo(() => {
        const data = infiniteData as any;
        if (!data?.pages) return [];
        return data.pages.flatMap((page: any) => page.rewardsLogs);
    }, [infiniteData]);

    // Intersection Observer로 무한 스크롤 구현
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const target = entries[0];
                if (
                    target.isIntersecting &&
                    hasNextPage &&
                    !isFetchingNextPage
                ) {
                    fetchNextPage().catch((error) => {
                        console.error("Failed to fetch next page:", error);
                    });
                }
            },
            {
                root: null,
                rootMargin: "50px", // 50px 전에 미리 로딩
                threshold: 0.1,
            }
        );

        const currentRef = loadMoreRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    return (
        <div
            className={cn(
                "space-y-2 h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] xl:h-[500px] overflow-y-auto",
                "scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent",
                "pb-6"
            )}
        >
            {/* 초기 로딩 상태 */}
            {isInfiniteLoading && allRewardsLogs.length === 0 && (
                <div className="py-8">
                    <PartialLoading text="Loading reward history..." />
                </div>
            )}

            {/* 에러 상태 */}
            {infiniteError && (
                <div className="py-8 text-center">
                    <p className="text-red-400">
                        Failed to load reward history
                    </p>
                    <button
                        className="mt-2 text-sm text-white/60 underline underline-offset-2"
                        onClick={() => window.location.reload()}
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* 데이터 없음 상태 */}
            {!isInfiniteLoading &&
                !infiniteError &&
                allRewardsLogs.length === 0 && (
                    <div className="py-8 text-center">
                        <p
                            className={cn(
                                getResponsiveClass(15).textClass,
                                "text-white/40"
                            )}
                        >
                            No reward history yet
                        </p>
                    </div>
                )}

            {/* 보상 히스토리 목록 */}
            {allRewardsLogs.map((log: RewardLog) => (
                <article
                    key={log.id}
                    className={cn(
                        "rounded-[16px] transition-all duration-300 ease-out",
                        "bg-gradient-to-br from-white/10 to-white/5",
                        "border border-white/20 backdrop-blur-sm",
                        "hover:bg-gradient-to-br hover:from-white/20 hover:to-white/10",
                        "hover:border-white/30 hover:shadow-lg hover:shadow-white/10",
                        getResponsiveClass(20).paddingClass
                    )}
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <p
                                className={cn(
                                    getResponsiveClass(15).textClass,
                                    "font-semibold",
                                    "line-clamp-2"
                                )}
                            >
                                {log.reason}
                            </p>
                            <div className="flex items-center mt-1">
                                <time
                                    className={cn(
                                        getResponsiveClass(10).textClass,
                                        "text-white/50",
                                        "block"
                                    )}
                                    title={formatDate(new Date(log.createdAt))}
                                >
                                    {getRelativeTime(new Date(log.createdAt))}
                                </time>
                            </div>
                        </div>

                        <div
                            className={cn(
                                getResponsiveClass(15).textClass,
                                "font-main",
                                (log.balanceAfter ?? 0) -
                                    (log.balanceBefore ?? 0) >=
                                    0
                                    ? "text-green-400"
                                    : "text-red-400"
                            )}
                        >
                            <div className={cn("flex-shrink-0", "text-right")}>
                                {(log.balanceAfter ?? 0) -
                                    (log.balanceBefore ?? 0) >=
                                0
                                    ? "+"
                                    : "-"}
                                {Math.abs(log.amount).toLocaleString()}{" "}
                                {log.asset?.symbol}
                            </div>
                        </div>
                    </div>
                </article>
            ))}

            {/* 무한 스크롤 로딩 영역 */}
            {(isFetchingNextPage || hasNextPage) && (
                <div ref={loadMoreRef} className="py-4 flex justify-center">
                    {isFetchingNextPage ? (
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full border-b-2 border-white/50 w-4 h-4"></div>
                            <span className="text-white/60 text-sm">
                                Loading more rewards...
                            </span>
                        </div>
                    ) : hasNextPage ? (
                        <span className="text-white/40 text-sm">
                            Scroll to load more
                        </span>
                    ) : (
                        <span className="text-white/40 text-sm">
                            {`🎉 You've reached the end!`}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

// 메모이제이션으로 불필요한 리렌더링 방지
export default memo(UserRewardsModalCard);
