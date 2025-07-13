"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader as UITableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Users,
    Search,
    ArrowUpDown,
    Wallet,
    DollarSign,
    Activity,
    Calendar,
    Eye,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

// 🎯 hooks import
import { useUserDashboardTableData } from "@/app/actions/userDashboard/hooks";

// 🔧 공통 컴포넌트 import
import {
    MetricCard,
    DashboardLoading,
    DashboardError,
    ChartCard,
    formatNumber,
} from "./shared";

// 🔍 필터 타입 정의
interface UserTableFilters {
    search?: string;
    network?: string;
    hasAssets?: boolean;
    hasMultipleWallets?: boolean;
    isActive?: boolean;
    sortBy?: "createdAt" | "lastAccessedAt" | "assetCount" | "walletCount";
    sortOrder?: "asc" | "desc";
}

// 📊 테이블 헤더 컴포넌트
interface TableHeaderProps {
    filters: UserTableFilters;
    onFiltersChange: (filters: UserTableFilters) => void;
}

function TableHeader({ filters, onFiltersChange }: TableHeaderProps) {
    const [searchInput, setSearchInput] = useState(filters.search || "");

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onFiltersChange({ ...filters, search: searchInput });
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-white">
                        사용자 목록
                    </h3>
                    <p className="text-sm text-slate-400">
                        전체 사용자 데이터 및 지갑 정보
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge
                        variant="outline"
                        className="text-xs bg-slate-800 text-slate-200 border-slate-700"
                    >
                        <Users className="h-3 w-3 mr-1" />
                        USERS DATA
                    </Badge>
                </div>
            </div>

            {/* 🔍 필터 및 검색 */}
            <div className="flex flex-col sm:flex-row gap-4">
                <form onSubmit={handleSearchSubmit} className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="이름, 이메일, 지갑 주소로 검색..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-10 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
                        />
                    </div>
                </form>

                <div className="flex items-center gap-2">
                    <Select
                        value={filters.network || "all"}
                        onValueChange={(value) =>
                            onFiltersChange({
                                ...filters,
                                network: value === "all" ? undefined : value,
                            })
                        }
                    >
                        <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-slate-200">
                            <SelectValue placeholder="네트워크" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="all">모든 네트워크</SelectItem>
                            <SelectItem value="ethereum">Ethereum</SelectItem>
                            <SelectItem value="polygon">Polygon</SelectItem>
                            <SelectItem value="binance">Binance</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.sortBy || "createdAt"}
                        onValueChange={(value) =>
                            onFiltersChange({
                                ...filters,
                                sortBy: value as any,
                            })
                        }
                    >
                        <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-slate-200">
                            <SelectValue placeholder="정렬" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="createdAt">생성일</SelectItem>
                            <SelectItem value="lastAccessedAt">
                                마지막 활동
                            </SelectItem>
                            <SelectItem value="assetCount">자산 수</SelectItem>
                            <SelectItem value="walletCount">지갑 수</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            onFiltersChange({
                                ...filters,
                                sortOrder:
                                    filters.sortOrder === "desc"
                                        ? "asc"
                                        : "desc",
                            })
                        }
                        className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                    >
                        <ArrowUpDown className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* 🏷️ 필터 태그 */}
            <div className="flex flex-wrap gap-2">
                <Button
                    variant={filters.hasAssets ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                        onFiltersChange({
                            ...filters,
                            hasAssets: filters.hasAssets ? undefined : true,
                        })
                    }
                    className={
                        filters.hasAssets
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                    }
                >
                    <DollarSign className="h-3 w-3 mr-1" />
                    자산 보유
                </Button>
                <Button
                    variant={filters.hasMultipleWallets ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                        onFiltersChange({
                            ...filters,
                            hasMultipleWallets: filters.hasMultipleWallets
                                ? undefined
                                : true,
                        })
                    }
                    className={
                        filters.hasMultipleWallets
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                    }
                >
                    <Wallet className="h-3 w-3 mr-1" />
                    멀티 지갑
                </Button>
                <Button
                    variant={filters.isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                        onFiltersChange({
                            ...filters,
                            isActive: filters.isActive ? undefined : true,
                        })
                    }
                    className={
                        filters.isActive
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                    }
                >
                    <Activity className="h-3 w-3 mr-1" />
                    활성 사용자
                </Button>
            </div>
        </div>
    );
}

// 📄 페이지네이션 컴포넌트
interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

function Pagination({
    currentPage,
    totalPages,
    onPageChange,
}: PaginationProps) {
    return (
        <div className="flex items-center justify-between py-4">
            <div className="text-sm text-slate-400">
                페이지 {currentPage} / {totalPages}
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

// 🎯 메인 UserTable 컴포넌트
export function AdminUsersDashboardUserTable() {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(20);
    const [filters, setFilters] = useState<UserTableFilters>({
        sortBy: "createdAt",
        sortOrder: "desc",
    });

    const { walletTableData, isLoading, isError } = useUserDashboardTableData(
        currentPage,
        pageSize,
        filters
    );

    const truncateAddress = (address: string) => {
        if (!address || address.length <= 10) return address;
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getRiskBadge = (riskLevel: string) => {
        switch (riskLevel) {
            case "high":
                return (
                    <Badge variant="destructive" className="text-xs">
                        HIGH
                    </Badge>
                );
            case "medium":
                return (
                    <Badge variant="secondary" className="text-xs">
                        MEDIUM
                    </Badge>
                );
            case "low":
                return (
                    <Badge variant="outline" className="text-xs">
                        LOW
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="text-xs">
                        -
                    </Badge>
                );
        }
    };

    if (isLoading) {
        return <DashboardLoading title="사용자 테이블 데이터" />;
    }

    if (isError) {
        return (
            <DashboardError
                title="사용자 테이블 오류"
                message="사용자 테이블 데이터를 불러오는 중 오류가 발생했습니다."
            />
        );
    }

    return (
        <div className="space-y-8">
            <ChartCard
                title="사용자 데이터 테이블"
                description="상세한 사용자 정보 및 지갑 데이터"
            >
                <div className="space-y-6">
                    <TableHeader
                        filters={filters}
                        onFiltersChange={setFilters}
                    />

                    <div className="rounded-md border border-slate-700 overflow-hidden">
                        <Table>
                            <UITableHeader>
                                <TableRow className="border-slate-700 bg-slate-800/50">
                                    <TableHead className="text-slate-300">
                                        사용자 정보
                                    </TableHead>
                                    <TableHead className="text-slate-300">
                                        지갑 정보
                                    </TableHead>
                                    <TableHead className="text-slate-300">
                                        자산 현황
                                    </TableHead>
                                    <TableHead className="text-slate-300">
                                        활동 정보
                                    </TableHead>
                                    <TableHead className="text-slate-300">
                                        위험도
                                    </TableHead>
                                    <TableHead className="text-slate-300">
                                        가입일
                                    </TableHead>
                                    <TableHead className="text-slate-300"></TableHead>
                                </TableRow>
                            </UITableHeader>
                            <TableBody>
                                {walletTableData?.users.map((user) => (
                                    <TableRow
                                        key={user.userId}
                                        className="border-slate-700 hover:bg-slate-800/30"
                                    >
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="font-medium text-slate-200">
                                                    {user.name}
                                                </div>
                                                <div className="text-sm text-slate-400">
                                                    {user.email}
                                                </div>
                                                {user.nickname && (
                                                    <div className="text-xs text-slate-500">
                                                        @{user.nickname}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Wallet className="h-4 w-4 text-slate-400" />
                                                    <span className="text-sm font-medium text-slate-200">
                                                        {user.walletCount}개
                                                    </span>
                                                    {user.isMultiWallet && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-xs"
                                                        >
                                                            MULTI
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-400 font-mono">
                                                    {truncateAddress(
                                                        user.primaryWallet
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {(user.networks as string[])
                                                        .slice(0, 2)
                                                        .map(
                                                            (
                                                                network: string
                                                            ) => (
                                                                <Badge
                                                                    key={
                                                                        network
                                                                    }
                                                                    variant="outline"
                                                                    className="text-xs bg-slate-800 text-slate-300 border-slate-600"
                                                                >
                                                                    {network}
                                                                </Badge>
                                                            )
                                                        )}
                                                    {user.networks.length >
                                                        2 && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs bg-slate-800 text-slate-300 border-slate-600"
                                                        >
                                                            +
                                                            {user.networks
                                                                .length - 2}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <DollarSign className="h-4 w-4 text-slate-400" />
                                                    <span className="text-sm font-medium text-slate-200">
                                                        {formatNumber(
                                                            user.totalAssets
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    {user.assetCount}종류
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    활용률:{" "}
                                                    {Math.round(
                                                        user.walletUtilizationRate
                                                    )}
                                                    %
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Activity className="h-4 w-4 text-slate-400" />
                                                    <span className="text-sm font-medium text-slate-200">
                                                        {user.paymentCount}회
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    총{" "}
                                                    {formatNumber(
                                                        user.totalPayments
                                                    )}
                                                </div>
                                                {user.lastLoginAt && (
                                                    <div className="text-xs text-slate-400">
                                                        {formatDate(
                                                            user.lastLoginAt
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getRiskBadge(user.riskLevel)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                <span className="text-sm text-slate-200">
                                                    {formatDate(user.createdAt)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-slate-400 hover:text-slate-200"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalPages={walletTableData?.totalPages || 1}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </ChartCard>

            {/* 테이블 통계 */}
            <div className="grid gap-6 md:grid-cols-4">
                <MetricCard
                    title="총 사용자 수"
                    value={walletTableData?.totalCount || 0}
                    description="등록된 전체 사용자"
                    icon={Users}
                />

                <MetricCard
                    title="멀티 지갑 사용자"
                    value={
                        walletTableData?.users.filter((u) => u.isMultiWallet)
                            .length || 0
                    }
                    description="2개 이상 지갑 보유"
                    icon={Wallet}
                />

                <MetricCard
                    title="자산 보유 사용자"
                    value={
                        walletTableData?.users.filter((u) => u.totalAssets > 0)
                            .length || 0
                    }
                    description="자산을 보유한 사용자"
                    icon={DollarSign}
                />

                <MetricCard
                    title="활성 사용자"
                    value={
                        walletTableData?.users.filter((u) => u.isActive)
                            .length || 0
                    }
                    description="최근 활동한 사용자"
                    icon={Activity}
                />
            </div>
        </div>
    );
}

export default AdminUsersDashboardUserTable;
