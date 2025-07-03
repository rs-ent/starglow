/// components/admin/polls/Admin.Polls.Filter.tsx

"use client";

import React, { useState } from "react";
import {
    Search,
    Filter,
    BarChart3,
    Vote,
    User,
    CheckCircle,
    XCircle,
} from "lucide-react";
import type { Artist } from "@prisma/client";

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

export interface PollFilterState {
    search: string;
    type: "all" | "world" | "exclusive";
    pollMode: "all" | "regular" | "betting";
    activeStatus: "all" | "active" | "inactive";
    artistId: string;
}

interface PollsFilterProps {
    filter: PollFilterState;
    onFilterChange: (filter: PollFilterState) => void;
    artists: Artist[];
}

export default function PollsFilter({
    filter,
    onFilterChange,
    artists,
}: PollsFilterProps) {
    const [activeFilters, setActiveFilters] = useState<string[]>([]);

    const updateFilter = (key: keyof PollFilterState, value: string) => {
        const newFilter = { ...filter, [key]: value };
        onFilterChange(newFilter);

        // Track active filters
        const newActiveFilters = [];
        if (newFilter.search) newActiveFilters.push("search");
        if (newFilter.type !== "all") newActiveFilters.push("type");
        if (newFilter.pollMode !== "all") newActiveFilters.push("pollMode");
        if (newFilter.activeStatus !== "all")
            newActiveFilters.push("activeStatus");
        if (newFilter.artistId && newFilter.artistId !== "")
            newActiveFilters.push("artist");
        setActiveFilters(newActiveFilters);
    };

    const clearAllFilters = () => {
        const clearedFilter: PollFilterState = {
            search: "",
            type: "all",
            pollMode: "all",
            activeStatus: "all",
            artistId: "",
        };
        onFilterChange(clearedFilter);
        setActiveFilters([]);
    };

    const selectedArtist = artists.find(
        (artist) => artist.id === filter.artistId
    );

    return (
        <Card className="p-6 bg-gradient-to-r from-slate-900/50 to-slate-800/50 border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
                <Filter className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">폴 필터링</h3>
                {activeFilters.length > 0 && (
                    <Badge
                        variant="secondary"
                        className="bg-purple-500/20 text-purple-300"
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* 검색 */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                        placeholder="폴 제목 검색..."
                        value={filter.search}
                        onChange={(e) => updateFilter("search", e.target.value)}
                        className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                    />
                </div>

                {/* 폴 타입 필터 */}
                <Select
                    value={filter.type}
                    onValueChange={(value) => updateFilter("type", value)}
                >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue placeholder="폴 타입" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">
                            <div className="flex items-center gap-2">
                                <span>모든 폴</span>
                            </div>
                        </SelectItem>
                        <SelectItem value="world">
                            <div className="flex items-center gap-2">
                                <Vote className="w-4 h-4 text-blue-400" />
                                <span>World 폴</span>
                            </div>
                        </SelectItem>
                        <SelectItem value="exclusive">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-purple-400" />
                                <span>Exclusive 폴</span>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>

                {/* 베팅/일반 모드 필터 */}
                <Select
                    value={filter.pollMode}
                    onValueChange={(value) => updateFilter("pollMode", value)}
                >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue placeholder="폴 모드" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">모든 모드</SelectItem>
                        <SelectItem value="regular">
                            <div className="flex items-center gap-2">
                                <Vote className="w-4 h-4 text-blue-400" />
                                <span>일반 폴</span>
                            </div>
                        </SelectItem>
                        <SelectItem value="betting">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-orange-400" />
                                <span>🎰 베팅 폴</span>
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

                {/* 아티스트 필터 */}
                <Select
                    value={filter.artistId || "all"}
                    onValueChange={(value) =>
                        updateFilter("artistId", value === "all" ? "" : value)
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
                    {filter.type !== "all" && (
                        <Badge
                            variant="outline"
                            className="bg-purple-500/20 text-purple-300 border-purple-500/50"
                        >
                            타입:{" "}
                            {filter.type === "world" ? "World" : "Exclusive"}
                        </Badge>
                    )}
                    {filter.pollMode !== "all" && (
                        <Badge
                            variant="outline"
                            className="bg-orange-500/20 text-orange-300 border-orange-500/50"
                        >
                            모드:{" "}
                            {filter.pollMode === "betting" ? "🎰 베팅" : "일반"}
                        </Badge>
                    )}
                    {filter.activeStatus !== "all" && (
                        <Badge
                            variant="outline"
                            className="bg-green-500/20 text-green-300 border-green-500/50"
                        >
                            상태:{" "}
                            {filter.activeStatus === "active"
                                ? "활성화"
                                : "비활성화"}
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
                </div>
            )}
        </Card>
    );
}
