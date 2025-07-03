/// components/admin/quests/Admin.Quest.Filter.tsx

"use client";

import React, { useState } from "react";
import {
    Search,
    Filter,
    Link,
    UserPlus,
    Globe,
    User,
    Repeat,
    CheckCircle,
    XCircle,
    Zap,
} from "lucide-react";
import type { Artist, Asset } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export interface QuestFilterState {
    search: string;
    questType: "all" | "URL" | "REFERRAL";
    artistType: "all" | "world" | "exclusive";
    artistId: string;
    repeatable: "all" | "repeatable" | "single";
    activeStatus: "all" | "active" | "inactive";
    rewardAssetId: string;
}

interface QuestsFilterProps {
    filter: QuestFilterState;
    onFilterChange: (filter: QuestFilterState) => void;
    artists: Artist[];
    assets: Asset[];
}

export default function QuestsFilter({
    filter,
    onFilterChange,
    artists,
    assets,
}: QuestsFilterProps) {
    const [activeFilters, setActiveFilters] = useState<string[]>([]);

    const updateFilter = (key: keyof QuestFilterState, value: string) => {
        const newFilter = { ...filter, [key]: value };
        onFilterChange(newFilter);

        // Track active filters
        const newActiveFilters = [];
        if (newFilter.search) newActiveFilters.push("search");
        if (newFilter.questType !== "all") newActiveFilters.push("questType");
        if (newFilter.artistType !== "all") newActiveFilters.push("artistType");
        if (newFilter.artistId && newFilter.artistId !== "")
            newActiveFilters.push("artist");
        if (newFilter.repeatable !== "all") newActiveFilters.push("repeatable");
        if (newFilter.activeStatus !== "all")
            newActiveFilters.push("activeStatus");
        if (newFilter.rewardAssetId && newFilter.rewardAssetId !== "")
            newActiveFilters.push("reward");
        setActiveFilters(newActiveFilters);
    };

    const clearAllFilters = () => {
        const clearedFilter: QuestFilterState = {
            search: "",
            questType: "all",
            artistType: "all",
            artistId: "",
            repeatable: "all",
            activeStatus: "all",
            rewardAssetId: "",
        };
        onFilterChange(clearedFilter);
        setActiveFilters([]);
    };

    const selectedArtist = artists.find(
        (artist) => artist.id === filter.artistId
    );
    const selectedAsset = assets.find(
        (asset) => asset.id === filter.rewardAssetId
    );

    return (
        <Card className="p-6 bg-gradient-to-r from-slate-900/50 to-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
                <Filter className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-white">
                    퀘스트 필터링
                </h3>
                {activeFilters.length > 0 && (
                    <Badge
                        variant="secondary"
                        className="bg-green-500/20 text-green-300"
                    >
                        {activeFilters.length}개 활성
                    </Badge>
                )}
                {activeFilters.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-slate-400 hover:text-white"
                    >
                        모든 필터 초기화
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* 검색 */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                        placeholder="퀘스트 제목 검색..."
                        value={filter.search}
                        onChange={(e) => updateFilter("search", e.target.value)}
                        className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                    />
                </div>

                {/* 퀘스트 타입 필터 */}
                <Select
                    value={filter.questType}
                    onValueChange={(value) => updateFilter("questType", value)}
                >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue placeholder="퀘스트 타입" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">모든 타입</SelectItem>
                        <SelectItem value="URL">
                            <div className="flex items-center gap-2">
                                <Link className="w-4 h-4 text-blue-400" />
                                <span>URL 퀘스트</span>
                            </div>
                        </SelectItem>
                        <SelectItem value="REFERRAL">
                            <div className="flex items-center gap-2">
                                <UserPlus className="w-4 h-4 text-purple-400" />
                                <span>추천 퀘스트</span>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>

                {/* 아티스트 타입 필터 */}
                <Select
                    value={filter.artistType}
                    onValueChange={(value) => {
                        updateFilter("artistType", value);
                        if (value !== "exclusive") {
                            updateFilter("artistId", "");
                        }
                    }}
                >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue placeholder="아티스트 타입" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">모든 퀘스트</SelectItem>
                        <SelectItem value="world">
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-blue-400" />
                                <span>World 퀘스트</span>
                            </div>
                        </SelectItem>
                        <SelectItem value="exclusive">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-purple-400" />
                                <span>아티스트 전용</span>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>

                {/* 아티스트 필터 (exclusive일 때만 표시) */}
                {filter.artistType === "exclusive" && (
                    <Select
                        value={filter.artistId || "all"}
                        onValueChange={(value) =>
                            updateFilter(
                                "artistId",
                                value === "all" ? "" : value
                            )
                        }
                    >
                        <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                            <SelectValue placeholder="아티스트 선택" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">모든 아티스트</SelectItem>
                            {artists.map((artist) => (
                                <SelectItem key={artist.id} value={artist.id}>
                                    <div className="flex items-center gap-2">
                                        {artist.logoUrl && (
                                            <img
                                                src={artist.logoUrl}
                                                alt={artist.name}
                                                className="w-4 h-4 rounded-full object-cover"
                                            />
                                        )}
                                        <span>{artist.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {/* 반복 가능 여부 필터 */}
                <Select
                    value={filter.repeatable}
                    onValueChange={(value) => updateFilter("repeatable", value)}
                >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue placeholder="반복 여부" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">모든 퀘스트</SelectItem>
                        <SelectItem value="repeatable">
                            <div className="flex items-center gap-2">
                                <Repeat className="w-4 h-4 text-green-400" />
                                <span>반복 가능</span>
                            </div>
                        </SelectItem>
                        <SelectItem value="single">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-yellow-400" />
                                <span>일회성</span>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>

                {/* 활성화 상태 필터 */}
                <Select
                    value={filter.activeStatus}
                    onValueChange={(value) =>
                        updateFilter("activeStatus", value)
                    }
                >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue placeholder="활성화 상태" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">모든 상태</SelectItem>
                        <SelectItem value="active">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span>활성화</span>
                            </div>
                        </SelectItem>
                        <SelectItem value="inactive">
                            <div className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-red-400" />
                                <span>비활성화</span>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>

                {/* 보상 에셋 필터 */}
                <Select
                    value={filter.rewardAssetId || "all"}
                    onValueChange={(value) =>
                        updateFilter(
                            "rewardAssetId",
                            value === "all" ? "" : value
                        )
                    }
                >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue placeholder="보상 에셋" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">모든 보상</SelectItem>
                        {assets.map((asset) => (
                            <SelectItem key={asset.id} value={asset.id}>
                                <div className="flex items-center gap-2">
                                    {asset.iconUrl && (
                                        <img
                                            src={asset.iconUrl}
                                            alt={asset.name}
                                            className="w-4 h-4 rounded-full object-cover"
                                        />
                                    )}
                                    <span>
                                        {asset.name} ({asset.symbol})
                                    </span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* 활성 필터 표시 */}
            {activeFilters.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {filter.search && (
                        <Badge
                            variant="outline"
                            className="bg-blue-500/20 text-blue-300 border-blue-500/50"
                        >
                            {`검색: "${filter.search}"`}
                        </Badge>
                    )}
                    {filter.questType !== "all" && (
                        <Badge
                            variant="outline"
                            className="bg-purple-500/20 text-purple-300 border-purple-500/50"
                        >
                            타입: {filter.questType === "URL" ? "URL" : "추천"}
                        </Badge>
                    )}
                    {filter.artistType !== "all" && (
                        <Badge
                            variant="outline"
                            className="bg-green-500/20 text-green-300 border-green-500/50"
                        >
                            분류:{" "}
                            {filter.artistType === "world"
                                ? "World"
                                : "아티스트 전용"}
                        </Badge>
                    )}
                    {selectedArtist && (
                        <Badge
                            variant="outline"
                            className="bg-pink-500/20 text-pink-300 border-pink-500/50"
                        >
                            아티스트: {selectedArtist.name}
                        </Badge>
                    )}
                    {filter.repeatable !== "all" && (
                        <Badge
                            variant="outline"
                            className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50"
                        >
                            {filter.repeatable === "repeatable"
                                ? "반복 가능"
                                : "일회성"}
                        </Badge>
                    )}
                    {filter.activeStatus !== "all" && (
                        <Badge
                            variant="outline"
                            className="bg-red-500/20 text-red-300 border-red-500/50"
                        >
                            상태:{" "}
                            {filter.activeStatus === "active"
                                ? "활성화"
                                : "비활성화"}
                        </Badge>
                    )}
                    {selectedAsset && (
                        <Badge
                            variant="outline"
                            className="bg-orange-500/20 text-orange-300 border-orange-500/50"
                        >
                            보상: {selectedAsset.symbol}
                        </Badge>
                    )}
                </div>
            )}
        </Card>
    );
}
