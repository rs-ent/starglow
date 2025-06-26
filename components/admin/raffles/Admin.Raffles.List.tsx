/// components/admin/raffles/Admin.Raffles.List.tsx

"use client";

import { useState, useMemo } from "react";
import { useRaffles } from "@/app/actions/raffles/hooks";
import { calculateRaffleStatus } from "@/app/actions/raffles/utils";
import { useToast } from "@/app/hooks/useToast";

import {
    FaArrowLeft,
    FaPlus,
    FaEdit,
    FaTrash,
    FaEye,
    FaEyeSlash,
    FaSearch,
    FaFilter,
    FaDice,
    FaCalendarAlt,
    FaUsers,
    FaGift,
    FaCrown,
    FaClock,
    FaCheckCircle,
    FaTimesCircle,
    FaSpinner,
} from "react-icons/fa";
import { TbTopologyStar3 } from "react-icons/tb";

import type { RaffleWithDetails } from "@/app/actions/raffles/actions";
import type { RaffleStatus } from "@/app/actions/raffles/utils";

interface AdminRafflesListProps {
    onBack: () => void;
    onEdit: (raffle: RaffleWithDetails) => void;
    onCreateNew: () => void;
}

export default function AdminRafflesList({
    onBack,
    onEdit,
    onCreateNew,
}: AdminRafflesListProps) {
    const toast = useToast();

    // 래플 데이터 조회
    const {
        rafflesData,
        isRafflesLoading,
        isRafflesError,
        rafflesError,
        refetchRaffles,
    } = useRaffles({
        getRafflesInput: {},
    });

    // 🔍 필터 및 검색 상태
    const [statusFilter, setStatusFilter] = useState<RaffleStatus | "ALL">(
        "ALL"
    );
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<"createdAt" | "endDate" | "title">(
        "createdAt"
    );
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // 📊 필터링 및 정렬된 래플 목록
    const filteredRaffles = useMemo(() => {
        if (!rafflesData?.success || !rafflesData.data) return [];

        const filtered = rafflesData.data.filter(
            (raffle: RaffleWithDetails) => {
                // 검색어 필터
                const matchesSearch =
                    raffle.title
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    raffle.description
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    raffle.artist?.name
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase());

                // 상태 필터
                const raffleStatus = calculateRaffleStatus(
                    raffle.startDate,
                    raffle.endDate,
                    raffle.drawDate
                );
                const matchesStatus =
                    statusFilter === "ALL" || raffleStatus === statusFilter;

                return matchesSearch && matchesStatus;
            }
        );

        // 정렬
        filtered.sort((a: RaffleWithDetails, b: RaffleWithDetails) => {
            let aValue: any = a[sortBy];
            let bValue: any = b[sortBy];

            if (sortBy === "createdAt" || sortBy === "endDate") {
                aValue = new Date(aValue).getTime();
                bValue = new Date(bValue).getTime();
            } else if (sortBy === "title") {
                aValue = aValue?.toLowerCase() || "";
                bValue = bValue?.toLowerCase() || "";
            }

            if (sortOrder === "asc") {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    }, [rafflesData, searchTerm, statusFilter, sortBy, sortOrder]);

    // 🎨 상태별 스타일
    const getStatusStyle = (status: RaffleStatus) => {
        switch (status) {
            case "UPCOMING":
                return "bg-blue-500/20 text-blue-300 border-blue-500/30";
            case "ACTIVE":
                return "bg-green-500/20 text-green-300 border-green-500/30";
            case "WAITING_DRAW":
                return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
            case "COMPLETED":
                return "bg-gray-500/20 text-gray-300 border-gray-500/30";
            default:
                return "bg-gray-500/20 text-gray-300 border-gray-500/30";
        }
    };

    // 🎯 상태별 아이콘
    const getStatusIcon = (status: RaffleStatus) => {
        switch (status) {
            case "UPCOMING":
                return <FaClock className="text-blue-400" />;
            case "ACTIVE":
                return <FaSpinner className="text-green-400" />;
            case "WAITING_DRAW":
                return <FaDice className="text-yellow-400" />;
            case "COMPLETED":
                return <FaCheckCircle className="text-gray-400" />;
            default:
                return <FaTimesCircle className="text-gray-400" />;
        }
    };

    // 🔧 액션 핸들러들
    const handleEdit = (raffleId: string) => {
        const raffle = rafflesData?.data?.find(
            (r: RaffleWithDetails) => r.id === raffleId
        );
        if (raffle) {
            onEdit(raffle);
        } else {
            toast.error("Raffle not found!");
        }
    };

    const handleToggleActive = (_raffleId: string, isActive: boolean) => {
        toast.info(
            `${isActive ? "Deactivate" : "Activate"} functionality coming soon!`
        );
        // TODO: 활성화/비활성화 뮤테이션
    };

    const handleDelete = (_raffleId: string, title: string) => {
        if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
            toast.info("Delete functionality coming soon!");
            // TODO: 삭제 뮤테이션
        }
    };

    const handleViewDetails = (_raffleId: string) => {
        toast.info("View details functionality coming soon!");
        // TODO: 상세 모달 또는 페이지로 이동
    };

    // 📊 통계 계산
    const stats = useMemo(() => {
        if (!rafflesData?.success || !rafflesData.data)
            return { total: 0, active: 0, upcoming: 0, completed: 0 };

        const counts = rafflesData.data.reduce(
            (
                acc: {
                    total: number;
                    active: number;
                    upcoming: number;
                    completed: number;
                },
                raffle: RaffleWithDetails
            ) => {
                acc.total++;
                const status = calculateRaffleStatus(
                    raffle.startDate,
                    raffle.endDate,
                    raffle.drawDate
                );
                if (status === "ACTIVE") acc.active++;
                else if (status === "UPCOMING") acc.upcoming++;
                else if (status === "COMPLETED") acc.completed++;
                return acc;
            },
            { total: 0, active: 0, upcoming: 0, completed: 0 }
        );

        return counts;
    }, [rafflesData]);

    if (isRafflesLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex items-center gap-3 text-white">
                    <FaSpinner className="animate-spin text-2xl" />
                    <span className="text-lg">Loading raffles...</span>
                </div>
            </div>
        );
    }

    if (isRafflesError) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <div className="text-red-400 text-lg mb-4">
                    Error loading raffles: {rafflesError?.message}
                </div>
                <button
                    onClick={() => refetchRaffles()}
                    className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-300 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] bg-gradient-to-br from-[#181c2b] to-[#2a2342] p-8 rounded-2xl shadow-2xl border border-purple-900/30 relative overflow-hidden">
            {/* Background decoration */}
            <TbTopologyStar3 className="absolute text-[18rem] text-purple-900/10 right-[-4rem] top-[-6rem] pointer-events-none select-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl transition-colors"
                    >
                        <FaArrowLeft className="text-white" />
                    </button>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                        <FaDice className="text-purple-400" />
                        Raffle{" "}
                        <span className="text-purple-400">Management</span>
                    </h1>
                </div>

                <button
                    onClick={onCreateNew}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
                >
                    <FaPlus />
                    New Raffle
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <FaDice className="text-2xl text-purple-400" />
                        <div>
                            <div className="text-2xl font-bold text-white">
                                {stats.total}
                            </div>
                            <div className="text-sm text-gray-400">
                                Total Raffles
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <FaSpinner className="text-2xl text-green-400" />
                        <div>
                            <div className="text-2xl font-bold text-white">
                                {stats.active}
                            </div>
                            <div className="text-sm text-gray-400">Active</div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <FaClock className="text-2xl text-blue-400" />
                        <div>
                            <div className="text-2xl font-bold text-white">
                                {stats.upcoming}
                            </div>
                            <div className="text-sm text-gray-400">
                                Upcoming
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <FaCheckCircle className="text-2xl text-gray-400" />
                        <div>
                            <div className="text-2xl font-bold text-white">
                                {stats.completed}
                            </div>
                            <div className="text-sm text-gray-400">
                                Completed
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                placeholder="Search raffles by title, description, or artist..."
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <FaFilter className="text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value as RaffleStatus | "ALL"
                                )
                            }
                            className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                        >
                            <option value="ALL">All Status</option>
                            <option value="UPCOMING">Upcoming</option>
                            <option value="ACTIVE">Active</option>
                            <option value="WAITING_DRAW">Waiting Draw</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-2">
                        <select
                            value={`${sortBy}-${sortOrder}`}
                            onChange={(e) => {
                                const [by, order] = e.target.value.split("-");
                                setSortBy(
                                    by as "createdAt" | "endDate" | "title"
                                );
                                setSortOrder(order as "asc" | "desc");
                            }}
                            className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                        >
                            <option value="createdAt-desc">Newest First</option>
                            <option value="createdAt-asc">Oldest First</option>
                            <option value="endDate-asc">End Date (Soon)</option>
                            <option value="endDate-desc">
                                End Date (Late)
                            </option>
                            <option value="title-asc">Title A-Z</option>
                            <option value="title-desc">Title Z-A</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Raffles List */}
            <div className="space-y-4">
                {filteredRaffles.length === 0 ? (
                    <div className="text-center py-12">
                        <FaDice className="text-6xl text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-400 mb-2">
                            No raffles found
                        </h3>
                        <p className="text-gray-500">
                            {searchTerm || statusFilter !== "ALL"
                                ? "Try adjusting your filters"
                                : "Create your first raffle to get started"}
                        </p>
                    </div>
                ) : (
                    filteredRaffles.map((raffle: RaffleWithDetails) => {
                        const status = calculateRaffleStatus(
                            raffle.startDate,
                            raffle.endDate,
                            raffle.drawDate
                        );

                        return (
                            <div
                                key={raffle.id}
                                className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    {/* Main Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-white">
                                                {raffle.title}
                                            </h3>
                                            <span
                                                className={`px-3 py-1 text-sm rounded-full border ${getStatusStyle(
                                                    status
                                                )}`}
                                            >
                                                <span className="flex items-center gap-1">
                                                    {getStatusIcon(status)}
                                                    {status.replace("_", " ")}
                                                </span>
                                            </span>
                                            {raffle.instantReveal && (
                                                <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                                                    Instant Reveal
                                                </span>
                                            )}
                                            {!raffle.isActive && (
                                                <span className="px-2 py-1 text-xs bg-red-500/20 text-red-300 rounded-full border border-red-500/30">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-gray-400 mb-3">
                                            {raffle.description ||
                                                "No description"}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                                            {raffle.artist && (
                                                <div className="flex items-center gap-1">
                                                    <FaCrown className="text-yellow-400" />
                                                    {raffle.artist.name}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <FaUsers className="text-blue-400" />
                                                {raffle._count?.participants ||
                                                    0}{" "}
                                                participants
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <FaGift className="text-pink-400" />
                                                {raffle._count?.prizes || 0}{" "}
                                                prizes
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <FaCalendarAlt className="text-green-400" />
                                                Ends:{" "}
                                                {new Date(
                                                    raffle.endDate
                                                ).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() =>
                                                handleViewDetails(raffle.id)
                                            }
                                            className="p-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-300 transition-colors"
                                            title="View Details"
                                        >
                                            <FaEye />
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleEdit(raffle.id)
                                            }
                                            className="p-3 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg text-yellow-300 transition-colors"
                                            title="Edit Raffle"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleToggleActive(
                                                    raffle.id,
                                                    raffle.isActive
                                                )
                                            }
                                            className={`p-3 border rounded-lg transition-colors ${
                                                raffle.isActive
                                                    ? "bg-gray-500/20 hover:bg-gray-500/30 border-gray-500/30 text-gray-300"
                                                    : "bg-green-500/20 hover:bg-green-500/30 border-green-500/30 text-green-300"
                                            }`}
                                            title={
                                                raffle.isActive
                                                    ? "Deactivate"
                                                    : "Activate"
                                            }
                                        >
                                            {raffle.isActive ? (
                                                <FaEyeSlash />
                                            ) : (
                                                <FaEye />
                                            )}
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDelete(
                                                    raffle.id,
                                                    raffle.title
                                                )
                                            }
                                            className="p-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-300 transition-colors"
                                            title="Delete Raffle"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Results Count */}
            {filteredRaffles.length > 0 && (
                <div className="mt-6 text-center text-gray-400">
                    Showing {filteredRaffles.length} of{" "}
                    {rafflesData?.data?.length || 0} raffles
                </div>
            )}
        </div>
    );
}
