/// components/admin/artists/Admin.Artists.List.tsx

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
    GripVertical,
    RefreshCw,
    Plus,
    Users,
    Eye,
    EyeOff,
    Building,
    Star,
    BarChart3,
} from "lucide-react";

import { useArtistsGet, useArtistSet } from "@/app/hooks/useArtists";
import { useToast } from "@/app/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import AdminArtistsCreate from "./Admin.Artists.Create";

import type { Artist } from "@prisma/client";

// Filter state interface
interface ArtistFilterState {
    search: string;
    visibility: "all" | "visible" | "hidden";
    hasPlayers: "all" | "with" | "without";
    hasCollections: "all" | "with" | "without";
}

export default function AdminArtistsList() {
    const { artists, isLoading, error } = useArtistsGet({});
    const {
        deleteArtist,
        isDeleting,
        updateArtistOrder,
        isUpdatingArtistOrder,
    } = useArtistSet();
    const toast = useToast();

    const [createOpen, setCreateOpen] = useState(false);
    const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
    const [showOrderChange, setShowOrderChange] = useState(false);
    const [sortedArtists, setSortedArtists] = useState<Artist[]>([]);

    // Filter state
    const [filter, setFilter] = useState<ArtistFilterState>({
        search: "",
        visibility: "all",
        hasPlayers: "all",
        hasCollections: "all",
    });

    // Sort artists by order
    const sortedArtistsList = useMemo(() => {
        if (!artists) return [];
        return [...artists].sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [artists]);

    // Apply filters
    const filteredArtists = useMemo(() => {
        return sortedArtistsList.filter((artist: any) => {
            // Search filter
            if (
                filter.search &&
                !artist.name
                    .toLowerCase()
                    .includes(filter.search.toLowerCase()) &&
                !artist.company
                    ?.toLowerCase()
                    .includes(filter.search.toLowerCase())
            ) {
                return false;
            }

            // Visibility filter
            if (filter.visibility === "visible" && artist.hidden) return false;
            if (filter.visibility === "hidden" && !artist.hidden) return false;

            // Players filter
            if (
                filter.hasPlayers === "with" &&
                (!artist.players || artist.players.length === 0)
            )
                return false;
            if (
                filter.hasPlayers === "without" &&
                artist.players &&
                artist.players.length > 0
            )
                return false;

            // Collections filter
            if (
                filter.hasCollections === "with" &&
                (!artist.collectionContracts ||
                    artist.collectionContracts.length === 0)
            )
                return false;
            if (
                filter.hasCollections === "without" &&
                artist.collectionContracts &&
                artist.collectionContracts.length > 0
            )
                return false;

            return true;
        });
    }, [sortedArtistsList, filter]);

    // Update sorted artists when filtered artists change
    useEffect(() => {
        setSortedArtists(filteredArtists);
    }, [filteredArtists]);

    // Statistics
    const stats = useMemo(() => {
        const total = sortedArtistsList.length;
        const visible = sortedArtistsList.filter((a: any) => !a.hidden).length;
        const hidden = sortedArtistsList.filter((a: any) => a.hidden).length;
        const withPlayers = sortedArtistsList.filter(
            (a: any) => a.players && a.players.length > 0
        ).length;
        const totalPlayers = sortedArtistsList.reduce(
            (sum: number, artist: any) => sum + (artist.players?.length || 0),
            0
        );
        const totalCollections = sortedArtistsList.reduce(
            (sum: number, artist: any) =>
                sum + (artist.collectionContracts?.length || 0),
            0
        );
        const totalQuests = sortedArtistsList.reduce(
            (sum: number, artist: any) => sum + (artist.quests?.length || 0),
            0
        );
        const totalPolls = sortedArtistsList.reduce(
            (sum: number, artist: any) => sum + (artist.polls?.length || 0),
            0
        );

        return {
            total,
            visible,
            hidden,
            withPlayers,
            totalPlayers,
            totalCollections,
            totalQuests,
            totalPolls,
        };
    }, [sortedArtistsList]);

    // Handle drag and drop ordering
    const handleOrderChange = (newArtists: Artist[]) => {
        const updatedArtists = newArtists.map((artist, index) => ({
            ...artist,
            order: index + 1,
        }));
        setSortedArtists(updatedArtists);
    };

    const handleSaveOrderChange = async () => {
        try {
            const orders = sortedArtists.map((artist, index) => ({
                id: artist.id,
                order: index + 1,
            }));

            await updateArtistOrder({ orders });
            toast.success("아티스트 순서 변경 사항을 저장했습니다.");
            setShowOrderChange(false);
        } catch (error) {
            toast.error("아티스트 순서 변경 사항을 저장하는데 실패했습니다.");
            console.error("Error updating artist order:", error);
        }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData("text/plain", index.toString());
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));

        if (dragIndex === dropIndex) return;

        const newArtists = [...sortedArtists];
        const draggedArtist = newArtists[dragIndex];

        // Remove dragged item
        newArtists.splice(dragIndex, 1);
        // Insert at new position
        newArtists.splice(dropIndex, 0, draggedArtist);

        handleOrderChange(newArtists);
    };

    const handleFilterChange = useCallback(
        (newFilter: Partial<ArtistFilterState>) => {
            setFilter((prev) => ({ ...prev, ...newFilter }));
        },
        []
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-green-400 mx-auto mb-4" />
                    <p className="text-slate-400">아티스트를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-400">오류 발생: {error.message}</p>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto space-y-6">
            {createOpen && (
                <AdminArtistsCreate
                    mode={selectedArtist ? "update" : "create"}
                    initialData={selectedArtist}
                    onSuccess={() => {
                        setCreateOpen(false);
                        setSelectedArtist(null);
                    }}
                    onCancel={() => {
                        setCreateOpen(false);
                        setSelectedArtist(null);
                    }}
                />
            )}

            {/* Header with Statistics */}
            <Card className="p-6 bg-gradient-to-r from-slate-900/50 to-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-white">
                            아티스트 관리
                        </h1>
                        <Badge
                            variant="outline"
                            className="bg-blue-500/20 text-blue-300 border-blue-500/50"
                        >
                            Admin Dashboard
                        </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.reload()}
                            className="bg-slate-700/50 border-slate-600 hover:bg-slate-600 text-white"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            새로고침
                        </Button>
                        <Button
                            onClick={() => {
                                setSelectedArtist(null);
                                setCreateOpen(true);
                            }}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            아티스트 추가
                        </Button>
                    </div>
                </div>

                {/* Statistics Dashboard */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    {/* Total Artists */}
                    <Card className="p-4 bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-700/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400">
                                    총 아티스트
                                </p>
                                <p className="text-2xl font-bold text-white">
                                    {stats.total}
                                </p>
                            </div>
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Star className="w-6 h-6 text-blue-400" />
                            </div>
                        </div>
                    </Card>

                    {/* Visible Artists */}
                    <Card className="p-4 bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-700/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-400">
                                    공개 아티스트
                                </p>
                                <p className="text-2xl font-bold text-white">
                                    {stats.visible}
                                </p>
                            </div>
                            <div className="p-2 bg-green-500/20 rounded-lg">
                                <Eye className="w-6 h-6 text-green-400" />
                            </div>
                        </div>
                    </Card>

                    {/* Hidden Artists */}
                    <Card className="p-4 bg-gradient-to-br from-red-900/20 to-red-800/20 border-red-700/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-400">
                                    숨김 아티스트
                                </p>
                                <p className="text-2xl font-bold text-white">
                                    {stats.hidden}
                                </p>
                            </div>
                            <div className="p-2 bg-red-500/20 rounded-lg">
                                <EyeOff className="w-6 h-6 text-red-400" />
                            </div>
                        </div>
                    </Card>

                    {/* Artists with Players */}
                    <Card className="p-4 bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-700/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-purple-400">
                                    플레이어 연결
                                </p>
                                <p className="text-2xl font-bold text-white">
                                    {stats.withPlayers}
                                </p>
                            </div>
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <Users className="w-6 h-6 text-purple-400" />
                            </div>
                        </div>
                    </Card>

                    {/* Total Players */}
                    <Card className="p-4 bg-gradient-to-br from-cyan-900/20 to-cyan-800/20 border-cyan-700/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-cyan-400">
                                    총 플레이어
                                </p>
                                <p className="text-2xl font-bold text-white">
                                    {stats.totalPlayers}
                                </p>
                            </div>
                            <div className="p-2 bg-cyan-500/20 rounded-lg">
                                <Users className="w-6 h-6 text-cyan-400" />
                            </div>
                        </div>
                    </Card>

                    {/* Total Collections */}
                    <Card className="p-4 bg-gradient-to-br from-orange-900/20 to-orange-800/20 border-orange-700/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-orange-400">
                                    총 컬렉션
                                </p>
                                <p className="text-2xl font-bold text-white">
                                    {stats.totalCollections}
                                </p>
                            </div>
                            <div className="p-2 bg-orange-500/20 rounded-lg">
                                <Building className="w-6 h-6 text-orange-400" />
                            </div>
                        </div>
                    </Card>

                    {/* Total Quests */}
                    <Card className="p-4 bg-gradient-to-br from-yellow-900/20 to-yellow-800/20 border-yellow-700/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-yellow-400">
                                    총 퀘스트
                                </p>
                                <p className="text-2xl font-bold text-white">
                                    {stats.totalQuests}
                                </p>
                            </div>
                            <div className="p-2 bg-yellow-500/20 rounded-lg">
                                <BarChart3 className="w-6 h-6 text-yellow-400" />
                            </div>
                        </div>
                    </Card>

                    {/* Total Polls */}
                    <Card className="p-4 bg-gradient-to-br from-pink-900/20 to-pink-800/20 border-pink-700/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-pink-400">총 폴</p>
                                <p className="text-2xl font-bold text-white">
                                    {stats.totalPolls}
                                </p>
                            </div>
                            <div className="p-2 bg-pink-500/20 rounded-lg">
                                <BarChart3 className="w-6 h-6 text-pink-400" />
                            </div>
                        </div>
                    </Card>
                </div>
            </Card>

            {/* Filters */}
            <Card className="p-4 bg-slate-900/50 border-slate-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="space-y-2">
                        <label className="text-sm text-slate-400">검색</label>
                        <Input
                            placeholder="아티스트명 또는 회사명으로 검색..."
                            value={filter.search}
                            onChange={(e) =>
                                handleFilterChange({ search: e.target.value })
                            }
                            className="bg-slate-800/50 border-slate-600 text-white"
                        />
                    </div>

                    {/* Visibility Filter */}
                    <div className="space-y-2">
                        <label className="text-sm text-slate-400">
                            공개 상태
                        </label>
                        <Select
                            value={filter.visibility}
                            onValueChange={(value: any) =>
                                handleFilterChange({ visibility: value })
                            }
                        >
                            <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-600">
                                <SelectItem value="all">전체</SelectItem>
                                <SelectItem value="visible">공개</SelectItem>
                                <SelectItem value="hidden">숨김</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Players Filter */}
                    <div className="space-y-2">
                        <label className="text-sm text-slate-400">
                            플레이어 연결
                        </label>
                        <Select
                            value={filter.hasPlayers}
                            onValueChange={(value: any) =>
                                handleFilterChange({ hasPlayers: value })
                            }
                        >
                            <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-600">
                                <SelectItem value="all">전체</SelectItem>
                                <SelectItem value="with">연결됨</SelectItem>
                                <SelectItem value="without">
                                    연결 안됨
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Collections Filter */}
                    <div className="space-y-2">
                        <label className="text-sm text-slate-400">
                            컬렉션 연결
                        </label>
                        <Select
                            value={filter.hasCollections}
                            onValueChange={(value: any) =>
                                handleFilterChange({ hasCollections: value })
                            }
                        >
                            <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-600">
                                <SelectItem value="all">전체</SelectItem>
                                <SelectItem value="with">연결됨</SelectItem>
                                <SelectItem value="without">
                                    연결 안됨
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

            {/* View Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Order change toggle */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant={showOrderChange ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => {
                                if (showOrderChange) {
                                    setShowOrderChange(false);
                                    setSortedArtists(filteredArtists);
                                } else {
                                    setShowOrderChange(true);
                                }
                            }}
                            className="bg-slate-700/50 border-slate-600 hover:bg-slate-600 text-white"
                        >
                            <GripVertical className="w-4 h-4 mr-2" />
                            {showOrderChange ? "순서 변경 취소" : "순서 변경"}
                        </Button>

                        {showOrderChange && (
                            <Button
                                size="sm"
                                onClick={handleSaveOrderChange}
                                disabled={isUpdatingArtistOrder}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                {isUpdatingArtistOrder
                                    ? "저장 중..."
                                    : "변경사항 저장"}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-slate-300">
                        {filteredArtists.length}개 아티스트
                    </Badge>
                    {(filter.search ||
                        filter.visibility !== "all" ||
                        filter.hasPlayers !== "all" ||
                        filter.hasCollections !== "all") && (
                        <Badge
                            variant="outline"
                            className="text-blue-300 border-blue-500/50"
                        >
                            필터링됨
                        </Badge>
                    )}
                </div>
            </div>

            {/* Artists Table */}
            <Card className="bg-slate-900/50 border-slate-700/50">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-slate-700/50">
                                {showOrderChange && (
                                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-300 w-16">
                                        순서
                                    </th>
                                )}
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                                    로고
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                                    이름
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                                    상태
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                                    설명
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                                    회사
                                </th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">
                                    플레이어
                                </th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">
                                    컬렉션
                                </th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">
                                    퀘스트
                                </th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">
                                    폴
                                </th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-slate-300">
                                    작업
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {sortedArtists.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={showOrderChange ? 11 : 10}
                                        className="text-center py-8 text-slate-400"
                                    >
                                        {filter.search ||
                                        filter.visibility !== "all" ||
                                        filter.hasPlayers !== "all" ||
                                        filter.hasCollections !== "all"
                                            ? "필터 조건에 맞는 아티스트가 없습니다."
                                            : "등록된 아티스트가 없습니다."}
                                    </td>
                                </tr>
                            )}
                            {sortedArtists.map((artist: any, index: number) => (
                                <tr
                                    key={artist.id}
                                    className={`hover:bg-slate-800/50 transition-colors ${
                                        showOrderChange ? "cursor-move" : ""
                                    }`}
                                    draggable={showOrderChange}
                                    onDragStart={(e) =>
                                        handleDragStart(e, index)
                                    }
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, index)}
                                >
                                    {showOrderChange && (
                                        <td className="px-4 py-3">
                                            <div className="flex items-center">
                                                <GripVertical className="w-4 h-4 text-slate-400 mr-2" />
                                                <span className="text-sm text-slate-400">
                                                    {index + 1}
                                                </span>
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-4 py-3">
                                        {artist.logoUrl ? (
                                            <img
                                                src={artist.logoUrl}
                                                alt={artist.name}
                                                className="w-12 h-12 object-contain rounded-lg"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
                                                <Star className="w-6 h-6 text-slate-400" />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-white">
                                            {artist.name}
                                        </div>
                                        {artist.code && (
                                            <div className="text-sm text-slate-400">
                                                {artist.code}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge
                                            variant={
                                                artist.hidden
                                                    ? "destructive"
                                                    : "secondary"
                                            }
                                            className={
                                                artist.hidden
                                                    ? "bg-red-500/20 text-red-300 border-red-500/50"
                                                    : "bg-green-500/20 text-green-300 border-green-500/50"
                                            }
                                        >
                                            {artist.hidden ? "숨김" : "공개"}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-sm text-slate-300 max-w-[200px] truncate">
                                            {artist.description || "-"}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-sm text-slate-300">
                                            {artist.company || "-"}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {artist.players &&
                                        artist.players.length > 0 ? (
                                            <div className="space-y-1">
                                                <Badge
                                                    variant="outline"
                                                    className="text-purple-300 border-purple-500/50"
                                                >
                                                    {artist.players.length}명
                                                </Badge>
                                                <div className="flex flex-wrap gap-1 justify-center">
                                                    {artist.players
                                                        .slice(0, 2)
                                                        .map((player: any) => (
                                                            <div
                                                                key={player.id}
                                                                className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full max-w-[60px] truncate"
                                                                title={
                                                                    player.name ||
                                                                    player.nickname ||
                                                                    "Unknown"
                                                                }
                                                            >
                                                                {player.name ||
                                                                    player.nickname ||
                                                                    "Unknown"}
                                                            </div>
                                                        ))}
                                                    {artist.players.length >
                                                        2 && (
                                                        <div className="text-xs text-slate-400">
                                                            +
                                                            {artist.players
                                                                .length - 2}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-slate-500">
                                                -
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {artist.collectionContracts &&
                                        artist.collectionContracts.length >
                                            0 ? (
                                            <Badge
                                                variant="outline"
                                                className="text-orange-300 border-orange-500/50"
                                            >
                                                {
                                                    artist.collectionContracts
                                                        .length
                                                }
                                                개
                                            </Badge>
                                        ) : (
                                            <span className="text-slate-500">
                                                -
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {artist.quests &&
                                        artist.quests.length > 0 ? (
                                            <Badge
                                                variant="outline"
                                                className="text-yellow-300 border-yellow-500/50"
                                            >
                                                {artist.quests.length}개
                                            </Badge>
                                        ) : (
                                            <span className="text-slate-500">
                                                -
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {artist.polls &&
                                        artist.polls.length > 0 ? (
                                            <Badge
                                                variant="outline"
                                                className="text-pink-300 border-pink-500/50"
                                            >
                                                {artist.polls.length}개
                                            </Badge>
                                        ) : (
                                            <span className="text-slate-500">
                                                -
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2 justify-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedArtist(artist);
                                                    setCreateOpen(true);
                                                }}
                                                disabled={showOrderChange}
                                                className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600"
                                            >
                                                수정
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={showOrderChange}
                                                onClick={() => {
                                                    if (!artist.code) {
                                                        toast.error(
                                                            "코드를 먼저 설정해주세요"
                                                        );
                                                        return;
                                                    }
                                                    window.open(
                                                        `/artists/${artist.code}`,
                                                        "_blank"
                                                    );
                                                }}
                                                className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600"
                                            >
                                                관리
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={async () => {
                                                    if (
                                                        window.confirm(
                                                            `${artist.name} 아티스트를 삭제하시겠습니까?`
                                                        )
                                                    ) {
                                                        try {
                                                            await deleteArtist({
                                                                id: artist.id,
                                                            });
                                                            toast.success(
                                                                `${artist.name} 아티스트를 삭제했습니다.`
                                                            );
                                                        } catch (error) {
                                                            console.error(
                                                                "아티스트 삭제 중 오류 발생:",
                                                                error
                                                            );
                                                            toast.error(
                                                                "아티스트 삭제 중 오류가 발생했습니다."
                                                            );
                                                        }
                                                    }
                                                }}
                                                disabled={
                                                    isDeleting ||
                                                    showOrderChange
                                                }
                                                className="bg-red-600/80 hover:bg-red-600 border-red-500/50"
                                            >
                                                {isDeleting
                                                    ? "삭제 중..."
                                                    : "삭제"}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
