/// components/polls/Polls.Contents.Total.Filter.tsx

"use client";

import { memo, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Filter } from "lucide-react";
import Image from "next/image";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import type { GetPollsInput, PollListData } from "@/app/actions/polls";

// 클라이언트 사이드 필터 타입 (GetPollsInput 확장)
export interface ClientPollFilters extends Omit<GetPollsInput, "status"> {
    actualStatus?: string;
    // 서버에서 지원하지 않는 필터들은 클라이언트 사이드에서 처리
    allowMultipleVote?: boolean;
    isOnchain?: boolean;
}

interface PollsFilterProps {
    filters: ClientPollFilters;
    onFiltersChange: (filters: ClientPollFilters) => void;
    allPolls: PollListData[];
    filteredCount: number;
    className?: string;
}

// 실제 상태 타입 정의
export type PollActualStatus = "UPCOMING" | "ONGOING" | "ENDED";

// 실제 상태 계산 함수
export const getPollActualStatus = (
    startDate: Date,
    endDate: Date
): PollActualStatus => {
    const now = new Date();

    if (now < startDate) {
        return "UPCOMING";
    } else if (now >= startDate && now < endDate) {
        return "ONGOING";
    } else {
        return "ENDED";
    }
};

// Poll 실제 상태 옵션들
const POLL_ACTUAL_STATUS_OPTIONS = [
    { value: "all", label: "All", emoji: "🗳️" },
    { value: "UPCOMING", label: "Upcoming", emoji: "⏰" },
    { value: "ONGOING", label: "Ongoing", emoji: "🔥" },
    { value: "ENDED", label: "Ended", emoji: "✅" },
];

// 베팅모드 옵션들
const BETTING_MODE_OPTIONS = [
    { value: "all", label: "All", emoji: "🎯" },
    { value: "true", label: "Betting Mode", emoji: "💰" },
    { value: "false", label: "Regular Poll", emoji: "📊" },
];

// 다중 투표 옵션들
const MULTIPLE_VOTE_OPTIONS = [
    { value: "all", label: "All", emoji: "🗳️" },
    { value: "true", label: "Multiple Vote", emoji: "✨" },
    { value: "false", label: "Single Vote", emoji: "🎯" },
];

// 정답 여부 옵션들
const HAS_ANSWER_OPTIONS = [
    { value: "all", label: "All", emoji: "🔍" },
    { value: "true", label: "Has Answer", emoji: "✅" },
    { value: "false", label: "No Answer", emoji: "❓" },
];

// 온체인 여부 옵션들
const IS_ONCHAIN_OPTIONS = [
    { value: "all", label: "All", emoji: "🌐" },
    { value: "true", label: "Onchain", emoji: "⛓️" },
    { value: "false", label: "Offchain", emoji: "💾" },
];

function PollsFilter({
    filters,
    onFiltersChange,
    allPolls,
    filteredCount,
    className,
}: PollsFilterProps) {
    const [isOpen, setIsOpen] = useState(false);

    // 반응형 클래스들 - 모든 요소에 동일하게 적용
    const containerPadding = getResponsiveClass(25);
    const filterGap = getResponsiveClass(20);
    const sectionGap = getResponsiveClass(15); // 필터 섹션 간 간격
    const labelText = getResponsiveClass(15);
    const resultText = getResponsiveClass(15);
    const buttonPadding = getResponsiveClass(20);
    const pillGap = getResponsiveClass(10); // 필터 pill 간 간격
    const sectionMargin = getResponsiveClass(25); // 섹션 하단 마진

    // allPolls에서 아티스트 정보 직접 추출
    const availableArtists = useMemo(() => {
        if (!allPolls) return [];

        const uniqueArtists = new Map();

        allPolls.forEach((poll) => {
            if (poll.artist && !uniqueArtists.has(poll.artist.id)) {
                uniqueArtists.set(poll.artist.id, poll.artist);
            }
        });

        return Array.from(uniqueArtists.values());
    }, [allPolls]);

    // 아티스트가 없는 polls가 있는지 확인
    const hasNoArtistPolls = useMemo(() => {
        return allPolls.some((poll) => poll.artistId === null);
    }, [allPolls]);

    // 사용 가능한 실제 상태들 필터링
    const availableActualStatuses = useMemo(() => {
        if (!allPolls) return POLL_ACTUAL_STATUS_OPTIONS;

        const actualStatusSet = new Set(
            allPolls.map((poll) =>
                getPollActualStatus(poll.startDate, poll.endDate)
            )
        );

        return POLL_ACTUAL_STATUS_OPTIONS.filter(
            (option) =>
                option.value === "all" ||
                actualStatusSet.has(option.value as PollActualStatus)
        );
    }, [allPolls]);

    // 베팅모드 옵션 필터링
    const availableBettingModes = useMemo(() => {
        if (!allPolls) return BETTING_MODE_OPTIONS;

        const hasBetting = allPolls.some((poll) => poll.bettingMode === true);
        const hasRegular = allPolls.some((poll) => poll.bettingMode === false);

        return BETTING_MODE_OPTIONS.filter((option) => {
            if (option.value === "all") return true;
            if (option.value === "true") return hasBetting;
            if (option.value === "false") return hasRegular;
            return false;
        });
    }, [allPolls]);

    // 다중 투표 옵션 필터링
    const availableMultipleVoteOptions = useMemo(() => {
        if (!allPolls) return MULTIPLE_VOTE_OPTIONS;

        const hasMultiple = allPolls.some(
            (poll) => poll.allowMultipleVote === true
        );
        const hasSingle = allPolls.some(
            (poll) => poll.allowMultipleVote === false
        );

        return MULTIPLE_VOTE_OPTIONS.filter((option) => {
            if (option.value === "all") return true;
            if (option.value === "true") return hasMultiple;
            if (option.value === "false") return hasSingle;
            return false;
        });
    }, [allPolls]);

    // 정답 여부 옵션 필터링
    const availableHasAnswerOptions = useMemo(() => {
        if (!allPolls) return HAS_ANSWER_OPTIONS;

        const hasAnswerTrue = allPolls.some((poll) => poll.hasAnswer === true);
        const hasAnswerFalse = allPolls.some(
            (poll) => poll.hasAnswer === false
        );

        return HAS_ANSWER_OPTIONS.filter((option) => {
            if (option.value === "all") return true;
            if (option.value === "true") return hasAnswerTrue;
            if (option.value === "false") return hasAnswerFalse;
            return false;
        });
    }, [allPolls]);

    // 온체인 여부 옵션 필터링
    const availableIsOnchainOptions = useMemo(() => {
        if (!allPolls) return IS_ONCHAIN_OPTIONS;

        const hasOnchain = allPolls.some((poll) => poll.isOnchain === true);
        const hasOffchain = allPolls.some((poll) => poll.isOnchain === false);

        return IS_ONCHAIN_OPTIONS.filter((option) => {
            if (option.value === "all") return true;
            if (option.value === "true") return hasOnchain;
            if (option.value === "false") return hasOffchain;
            return false;
        });
    }, [allPolls]);

    // 사용 가능한 리워드 자산들
    const availableRewardAssets = useMemo(() => {
        if (!allPolls) return [];

        const uniqueAssets = new Map();

        allPolls.forEach((poll) => {
            if (
                poll.participationRewardAsset &&
                !uniqueAssets.has(poll.participationRewardAsset.id)
            ) {
                uniqueAssets.set(
                    poll.participationRewardAsset.id,
                    poll.participationRewardAsset
                );
            }
        });

        return Array.from(uniqueAssets.values());
    }, [allPolls]);

    // 리워드 자산이 없는 polls가 있는지 확인
    const hasNoRewardAssetPolls = useMemo(() => {
        return allPolls.some(
            (poll) => poll.participationRewardAssetId === null
        );
    }, [allPolls]);

    const handleFilterChange = (key: keyof ClientPollFilters, value: any) => {
        // Boolean 필드들은 문자열을 boolean으로 변환
        let convertedValue = value;

        if (value === "all") {
            convertedValue = undefined;
        } else if (
            key === "bettingMode" ||
            key === "allowMultipleVote" ||
            key === "hasAnswer" ||
            key === "isOnchain"
        ) {
            convertedValue = value === "true";
        }

        onFiltersChange({
            ...filters,
            [key]: convertedValue,
        });
    };

    const handleResetFilters = () => {
        onFiltersChange({});
    };

    const hasActiveFilters = useMemo(() => {
        return Object.values(filters).some(
            (value) => value !== undefined && value !== null
        );
    }, [filters]);

    const toggleFilter = () => {
        setIsOpen(!isOpen);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={cn(
                "bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20",
                "backdrop-blur-lg border border-purple-500/30 rounded-2xl shadow-2xl",
                "overflow-hidden relative",
                className
            )}
        >
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/5 to-pink-400/5 animate-pulse" />

            {/* Toggle Header */}
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={toggleFilter}
                className={cn(
                    "relative z-10 cursor-pointer",
                    "hover:bg-white/5 transition-all duration-300",
                    containerPadding.paddingClass
                )}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="rounded-xl bg-gradient-to-r from-white/20 to-white/30 p-2"
                        >
                            <Filter
                                className={cn(
                                    "text-white",
                                    getResponsiveClass(25).frameClass
                                )}
                            />
                        </motion.div>
                        <div>
                            <motion.h3
                                className={cn(
                                    "font-bold text-[rgba(255,255,255,0.8)]",
                                    labelText.textClass
                                )}
                            >
                                Filters
                            </motion.h3>
                            <motion.div
                                className={cn(
                                    "text-cyan-300 font-medium mt-1",
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                <span className="text-purple-300">
                                    {filteredCount}
                                </span>
                                <span className="text-gray-400 mx-1">of</span>
                                <span className="text-pink-300">
                                    {allPolls.length}
                                </span>
                                <span className="text-gray-400 ml-1">
                                    polls
                                </span>
                                {hasActiveFilters && (
                                    <span className="ml-2 px-2 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs">
                                        Filtered
                                    </span>
                                )}
                            </motion.div>
                        </div>
                    </div>

                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-purple-300"
                    >
                        <ChevronDown
                            className={cn(getResponsiveClass(30).frameClass)}
                        />
                    </motion.div>
                </div>
            </motion.div>

            {/* Collapsible Content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div
                            className={cn(
                                "relative z-10 border-t border-white/10",
                                containerPadding.paddingClass,
                                "pt-6"
                            )}
                        >
                            <div
                                className={cn(
                                    filterGap.gapClass,
                                    "flex flex-wrap"
                                )}
                            >
                                {/* Artist Filter */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className={cn(
                                        "w-full",
                                        sectionMargin.marginYClass
                                    )}
                                >
                                    <label
                                        className={cn(
                                            "block text-purple-300 font-medium",
                                            labelText.textClass,
                                            sectionGap.marginYClass
                                        )}
                                    >
                                        👑 Artists
                                    </label>
                                    <div
                                        className={cn(
                                            "flex flex-wrap",
                                            pillGap.gapClass
                                        )}
                                    >
                                        <FilterPill
                                            isSelected={
                                                filters.artistId === undefined
                                            }
                                            onClick={() =>
                                                handleFilterChange(
                                                    "artistId",
                                                    "all"
                                                )
                                            }
                                            label="All"
                                            emoji="🌟"
                                        />
                                        {hasNoArtistPolls && (
                                            <FilterPill
                                                isSelected={
                                                    filters.artistId === null
                                                }
                                                onClick={() =>
                                                    handleFilterChange(
                                                        "artistId",
                                                        null
                                                    )
                                                }
                                                label="General"
                                                emoji="🌍"
                                            />
                                        )}
                                        {availableArtists.map((artist) => (
                                            <FilterPill
                                                key={artist.id}
                                                isSelected={
                                                    filters.artistId ===
                                                    artist.id
                                                }
                                                onClick={() =>
                                                    handleFilterChange(
                                                        "artistId",
                                                        artist.id
                                                    )
                                                }
                                                label={artist.name}
                                                artist={artist}
                                            />
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Status, Type, Vote Grid */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className={cn(
                                        "w-full grid grid-cols-1 md:grid-cols-3",
                                        filterGap.gapClass,
                                        sectionMargin.marginYClass
                                    )}
                                >
                                    {/* Status Filter */}
                                    <div>
                                        <label
                                            className={cn(
                                                "block text-blue-300 font-medium",
                                                labelText.textClass,
                                                sectionGap.marginYClass
                                            )}
                                        >
                                            📊 Status
                                        </label>
                                        <div
                                            className={cn(
                                                "flex flex-wrap",
                                                pillGap.gapClass
                                            )}
                                        >
                                            {availableActualStatuses.map(
                                                (option) => (
                                                    <FilterPill
                                                        key={option.value}
                                                        isSelected={
                                                            filters.actualStatus ===
                                                                option.value ||
                                                            (!filters.actualStatus &&
                                                                option.value ===
                                                                    "all")
                                                        }
                                                        onClick={() =>
                                                            handleFilterChange(
                                                                "actualStatus",
                                                                option.value
                                                            )
                                                        }
                                                        label={option.label}
                                                        emoji={option.emoji}
                                                    />
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {/* Type Filter */}
                                    <div>
                                        <label
                                            className={cn(
                                                "block text-green-300 font-medium",
                                                labelText.textClass,
                                                sectionGap.marginYClass
                                            )}
                                        >
                                            🎲 Type
                                        </label>
                                        <div
                                            className={cn(
                                                "flex flex-wrap",
                                                pillGap.gapClass
                                            )}
                                        >
                                            {availableBettingModes.map(
                                                (option) => (
                                                    <FilterPill
                                                        key={option.value}
                                                        isSelected={
                                                            (filters.bettingMode ===
                                                                undefined &&
                                                                option.value ===
                                                                    "all") ||
                                                            (option.value ===
                                                                "true" &&
                                                                filters.bettingMode ===
                                                                    true) ||
                                                            (option.value ===
                                                                "false" &&
                                                                filters.bettingMode ===
                                                                    false)
                                                        }
                                                        onClick={() =>
                                                            handleFilterChange(
                                                                "bettingMode",
                                                                option.value
                                                            )
                                                        }
                                                        label={option.label}
                                                        emoji={option.emoji}
                                                    />
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {/* Vote Filter */}
                                    <div>
                                        <label
                                            className={cn(
                                                "block text-yellow-300 font-medium",
                                                labelText.textClass,
                                                sectionGap.marginYClass
                                            )}
                                        >
                                            🗳️ Vote Mode
                                        </label>
                                        <div
                                            className={cn(
                                                "flex flex-wrap",
                                                pillGap.gapClass
                                            )}
                                        >
                                            {availableMultipleVoteOptions.map(
                                                (option) => (
                                                    <FilterPill
                                                        key={option.value}
                                                        isSelected={
                                                            (filters.allowMultipleVote ===
                                                                undefined &&
                                                                option.value ===
                                                                    "all") ||
                                                            (option.value ===
                                                                "true" &&
                                                                filters.allowMultipleVote ===
                                                                    true) ||
                                                            (option.value ===
                                                                "false" &&
                                                                filters.allowMultipleVote ===
                                                                    false)
                                                        }
                                                        onClick={() =>
                                                            handleFilterChange(
                                                                "allowMultipleVote",
                                                                option.value
                                                            )
                                                        }
                                                        label={option.label}
                                                        emoji={option.emoji}
                                                    />
                                                )
                                            )}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Answer & Onchain Grid */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className={cn(
                                        "w-full grid grid-cols-1 md:grid-cols-2",
                                        filterGap.gapClass,
                                        sectionMargin.marginYClass
                                    )}
                                >
                                    {/* Answer Filter */}
                                    <div>
                                        <label
                                            className={cn(
                                                "block text-orange-300 font-medium",
                                                labelText.textClass,
                                                sectionGap.marginYClass
                                            )}
                                        >
                                            🔍 Answer Status
                                        </label>
                                        <div
                                            className={cn(
                                                "flex flex-wrap",
                                                pillGap.gapClass
                                            )}
                                        >
                                            {availableHasAnswerOptions.map(
                                                (option) => (
                                                    <FilterPill
                                                        key={option.value}
                                                        isSelected={
                                                            (filters.hasAnswer ===
                                                                undefined &&
                                                                option.value ===
                                                                    "all") ||
                                                            (option.value ===
                                                                "true" &&
                                                                filters.hasAnswer ===
                                                                    true) ||
                                                            (option.value ===
                                                                "false" &&
                                                                filters.hasAnswer ===
                                                                    false)
                                                        }
                                                        onClick={() =>
                                                            handleFilterChange(
                                                                "hasAnswer",
                                                                option.value
                                                            )
                                                        }
                                                        label={option.label}
                                                        emoji={option.emoji}
                                                    />
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {/* Onchain Filter */}
                                    <div>
                                        <label
                                            className={cn(
                                                "block text-indigo-300 font-medium",
                                                labelText.textClass,
                                                sectionGap.marginYClass
                                            )}
                                        >
                                            ⛓️ Blockchain
                                        </label>
                                        <div
                                            className={cn(
                                                "flex flex-wrap",
                                                pillGap.gapClass
                                            )}
                                        >
                                            {availableIsOnchainOptions.map(
                                                (option) => (
                                                    <FilterPill
                                                        key={option.value}
                                                        isSelected={
                                                            (filters.isOnchain ===
                                                                undefined &&
                                                                option.value ===
                                                                    "all") ||
                                                            (option.value ===
                                                                "true" &&
                                                                filters.isOnchain ===
                                                                    true) ||
                                                            (option.value ===
                                                                "false" &&
                                                                filters.isOnchain ===
                                                                    false)
                                                        }
                                                        onClick={() =>
                                                            handleFilterChange(
                                                                "isOnchain",
                                                                option.value
                                                            )
                                                        }
                                                        label={option.label}
                                                        emoji={option.emoji}
                                                    />
                                                )
                                            )}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Reward Asset Filter */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className={cn(
                                        "w-full",
                                        filterGap.gapClass,
                                        sectionMargin.marginYClass
                                    )}
                                >
                                    <label
                                        className={cn(
                                            "block text-cyan-300 font-medium",
                                            labelText.textClass,
                                            sectionGap.marginYClass
                                        )}
                                    >
                                        🎁 Reward Asset
                                    </label>
                                    <div
                                        className={cn(
                                            "flex flex-wrap",
                                            pillGap.gapClass
                                        )}
                                    >
                                        <FilterPill
                                            isSelected={
                                                filters.participationRewardAssetId ===
                                                undefined
                                            }
                                            onClick={() =>
                                                handleFilterChange(
                                                    "participationRewardAssetId",
                                                    "all"
                                                )
                                            }
                                            label="All"
                                            emoji="🌟"
                                        />
                                        {hasNoRewardAssetPolls && (
                                            <FilterPill
                                                isSelected={
                                                    filters.participationRewardAssetId ===
                                                    null
                                                }
                                                onClick={() =>
                                                    handleFilterChange(
                                                        "participationRewardAssetId",
                                                        null
                                                    )
                                                }
                                                label="No Reward"
                                                emoji="❌"
                                            />
                                        )}
                                        {availableRewardAssets.map((asset) => (
                                            <FilterPill
                                                key={asset.id}
                                                isSelected={
                                                    filters.participationRewardAssetId ===
                                                    asset.id
                                                }
                                                onClick={() =>
                                                    handleFilterChange(
                                                        "participationRewardAssetId",
                                                        asset.id
                                                    )
                                                }
                                                label={asset.symbol}
                                                asset={asset}
                                            />
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Reset Button */}
                                {hasActiveFilters && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="w-full flex justify-center"
                                    >
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleResetFilters}
                                            className={cn(
                                                "bg-gradient-to-r from-red-500/20 to-orange-500/20",
                                                "backdrop-blur-sm border border-red-500/30 rounded-full",
                                                "text-red-300 hover:text-red-200 font-medium",
                                                "hover:from-red-500/30 hover:to-orange-500/30",
                                                "transition-all duration-300",
                                                buttonPadding.paddingClass,
                                                resultText.textClass
                                            )}
                                        >
                                            <span className="flex items-center gap-2">
                                                🔄 Reset All Filters
                                            </span>
                                        </motion.button>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Filter Pill Component
const FilterPill = memo(
    ({
        isSelected,
        onClick,
        label,
        emoji,
        artist,
        asset,
    }: {
        isSelected: boolean;
        onClick: () => void;
        label: string;
        emoji?: string;
        artist?: any;
        asset?: any;
    }) => {
        // 모든 필터 pill에서 동일한 크기 사용
        const pillText = getResponsiveClass(15);
        const pillPadding = getResponsiveClass(20);
        const pillIcon = getResponsiveClass(20);

        return (
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClick}
                className={cn(
                    "flex items-center gap-1 rounded-full",
                    "backdrop-blur-sm border transition-all duration-300",
                    "font-medium cursor-pointer",
                    pillText.textClass,
                    pillPadding.paddingClass,
                    isSelected
                        ? "bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-purple-400/50 text-white shadow-lg font-bold"
                        : "bg-white/5 border-gray-600/30 text-gray-300 hover:bg-white/10 hover:border-gray-500/50 font-medium"
                )}
            >
                {artist && artist.logoUrl ? (
                    <Image
                        src={artist.logoUrl}
                        alt={artist.name}
                        width={20}
                        height={20}
                        className={cn("object-contain", pillIcon.frameClass)}
                    />
                ) : asset && asset.iconUrl ? (
                    <Image
                        src={asset.iconUrl}
                        alt={asset.name}
                        width={20}
                        height={20}
                        className={cn("object-contain", pillIcon.frameClass)}
                    />
                ) : (
                    emoji && <span>{emoji}</span>
                )}
                {label}
            </motion.button>
        );
    }
);

FilterPill.displayName = "FilterPill";

export default memo(PollsFilter);
