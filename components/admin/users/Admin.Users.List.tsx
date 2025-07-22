"use client";

import { useState, useEffect } from "react";
import {
    searchUsers,
    giveReward,
    getAllActiveAssets,
    type SearchUsersResult,
} from "@/app/actions/userDashboard/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/app/hooks/useToast";
import {
    ChevronLeft,
    ChevronRight,
    Users,
    Wallet,
    Globe,
    Search,
    X,
    Gift,
    Send,
    RefreshCcw,
    Coins,
} from "lucide-react";

interface UserListData {
    id: string;
    name: string | null;
    email: string | null;
    createdAt: Date;
    lastLoginAt: Date | null;
    provider: string | null;
    wallets: {
        address: string;
        provider: string;
    }[];
    player: {
        id: string;
        name: string | null;
        nickname: string | null;
        email: string | null;
        browser: string | null;
        city: string | null;
        country: string | null;
        device: string | null;
        ipAddress: string | null;
        locale: string | null;
        os: string | null;
        state: string | null;
        timezone: string | null;
    } | null;
}

export default function AdminUsersList() {
    const toast = useToast();
    const [usersData, setUsersData] = useState<SearchUsersResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchInput, setSearchInput] = useState("");

    // 보상 지급 관련 state
    const [rewardModalOpen, setRewardModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserListData | null>(null);
    const [assets, setAssets] = useState<any[]>([]);
    const [selectedAssetId, setSelectedAssetId] = useState("");
    const [rewardAmount, setRewardAmount] = useState("");
    const [rewardReason, setRewardReason] = useState("관리자 보상 지급");
    const [isSubmittingReward, setIsSubmittingReward] = useState(false);

    // 알림 관련 state - ASSET_RECEIVED로 고정
    const [notificationType, setNotificationType] = useState("ASSET_RECEIVED");
    const [notificationCategory, setNotificationCategory] = useState("ASSETS");
    const [notificationTitle, setNotificationTitle] =
        useState("관리자 보상 지급");
    const [notificationMessage, setNotificationMessage] = useState("");
    const [notificationDescription, setNotificationDescription] = useState("");
    const [notificationActionType, setNotificationActionType] =
        useState("NONE");
    const [notificationPriority, setNotificationPriority] = useState("MEDIUM");
    const [actionUrl, setActionUrl] = useState("");

    const fetchUsers = async (page: number, query?: string) => {
        setLoading(true);
        try {
            const searchTerm = query !== undefined ? query : searchQuery;
            const data = await searchUsers(searchTerm, page);
            setUsersData(data);
            setCurrentPage(page);
        } catch (error) {
            console.error("사용자 목록 조회 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(1).catch((error) => {
            console.error("초기 사용자 목록 조회 실패:", error);
        });
        fetchAssets().catch((error) => {
            console.error("에셋 목록 조회 실패:", error);
        });
    }, []);

    const fetchAssets = async () => {
        try {
            const assetData = await getAllActiveAssets();
            setAssets(assetData);
        } catch (error) {
            console.error("에셋 목록 조회 실패:", error);
        }
    };

    const handlePageChange = (page: number) => {
        fetchUsers(page).catch((error) => {
            console.error("페이지 변경 오류:", error);
        });
    };

    const handleSearch = async () => {
        setSearchQuery(searchInput);
        setCurrentPage(1);
        await fetchUsers(1, searchInput);
    };

    const handleClearSearch = async () => {
        setSearchInput("");
        setSearchQuery("");
        setCurrentPage(1);
        await fetchUsers(1, "");
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch().catch((error) => {
                console.error("검색 오류:", error);
            });
        }
    };

    const openRewardModal = (user: UserListData) => {
        setSelectedUser(user);
        setRewardModalOpen(true);
        setSelectedAssetId("");
        setRewardAmount("");
        setRewardReason("Asset Rewarded by Admin");

        // 알림 필드 초기화
        setNotificationType("ASSET_RECEIVED");
        setNotificationCategory("ASSETS");
        setNotificationTitle("Asset Rewarded by Admin");
        setNotificationMessage("");
        setNotificationDescription("");
        setNotificationActionType("NONE");
        setNotificationPriority("MEDIUM");
        setActionUrl("");
    };

    const closeRewardModal = () => {
        setRewardModalOpen(false);
        setSelectedUser(null);
        setSelectedAssetId("");
        setRewardAmount("");
        setIsSubmittingReward(false);

        // 알림 필드 초기화
        setNotificationType("ASSET_RECEIVED");
        setNotificationCategory("ASSETS");
        setNotificationTitle("Asset Rewarded by Admin");
        setNotificationMessage("");
        setNotificationDescription("");
        setNotificationActionType("NONE");
        setNotificationPriority("MEDIUM");
        setActionUrl("");
    };

    const handleGiveReward = async () => {
        if (!selectedUser?.player?.id) {
            toast.error("플레이어 정보가 없습니다.");
            return;
        }

        if (!selectedAssetId) {
            toast.error("에셋을 선택해주세요.");
            return;
        }

        if (!rewardAmount || Number(rewardAmount) <= 0) {
            toast.error("올바른 수량을 입력해주세요.");
            return;
        }

        if (!notificationTitle.trim()) {
            toast.error("알림 제목을 입력해주세요.");
            return;
        }

        if (!notificationMessage.trim()) {
            toast.error("알림 메시지를 입력해주세요.");
            return;
        }

        try {
            setIsSubmittingReward(true);

            const result = await giveReward({
                playerId: selectedUser.player.id,
                assetId: selectedAssetId,
                amount: Number(rewardAmount),
                reason: rewardReason,
                type: notificationType as any,
                category: notificationCategory as any,
                title: notificationTitle,
                message: notificationMessage,
                description: notificationDescription,
            });

            if (result.success) {
                const selectedAsset = assets.find(
                    (a) => a.id === selectedAssetId
                );
                toast.success(
                    `${
                        selectedUser.name ||
                        selectedUser.player?.name ||
                        selectedUser.player?.nickname
                    }님에게 ${rewardAmount} ${selectedAsset?.symbol} 지급 완료!`
                );
                closeRewardModal();
            } else {
                toast.error(result.error || "보상 지급에 실패했습니다.");
            }
        } catch (error) {
            console.error("보상 지급 오류:", error);
            toast.error("보상 지급 중 오류가 발생했습니다.");
        } finally {
            setIsSubmittingReward(false);
        }
    };

    const formatDate = (date: Date | null) => {
        if (!date) return "-";
        return new Intl.DateTimeFormat("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(date));
    };

    const getProviderBadge = (provider: string | null) => {
        if (!provider) return <Badge variant="secondary">-</Badge>;

        const colors: Record<string, string> = {
            google: "bg-red-500",
            discord: "bg-indigo-500",
            telegram: "bg-blue-500",
            email: "bg-green-500",
        };

        return (
            <Badge
                className={`${colors[provider] || "bg-gray-500"} text-white`}
            >
                {provider.toUpperCase()}
            </Badge>
        );
    };

    if (loading && !usersData) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        사용자 목록
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (usersData?.error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-500">
                        <Users className="h-5 w-5" />
                        사용자 목록 - 오류
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-red-500">
                        {usersData.error}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const users = (usersData?.users as UserListData[]) || [];

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            사용자 목록
                        </div>
                        <Badge variant="outline" className="text-sm">
                            총 {usersData?.totalCount || 0}명
                            {searchQuery && ` (검색: "${searchQuery}")`}
                        </Badge>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="사용자 ID, 이름, 이메일, 지갑 주소 등으로 검색..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="pl-10 pr-10"
                                disabled={loading}
                            />
                            {searchInput && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSearchInput("")}
                                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        <Button
                            onClick={handleSearch}
                            disabled={loading || !searchInput.trim()}
                            className="flex items-center gap-2"
                        >
                            <Search className="h-4 w-4" />
                            검색
                        </Button>
                        {searchQuery && (
                            <Button
                                variant="outline"
                                onClick={handleClearSearch}
                                disabled={loading}
                                className="flex items-center gap-2"
                            >
                                <X className="h-4 w-4" />
                                초기화
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {users.map((user) => (
                            <Card
                                key={user.id}
                                className="border-l-4 border-l-blue-500"
                            >
                                <CardContent className="p-4">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-lg">
                                                    {user.name ||
                                                        user.player?.name ||
                                                        user.player?.nickname ||
                                                        "이름 없음"}
                                                </h3>
                                                {getProviderBadge(
                                                    user.provider
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground space-y-1">
                                                <div>ID: {user.id}</div>
                                                <div>
                                                    이메일:{" "}
                                                    {user.email ||
                                                        user.player?.email ||
                                                        "-"}
                                                </div>
                                                <div>
                                                    가입일:{" "}
                                                    {formatDate(user.createdAt)}
                                                </div>
                                                <div>
                                                    최근 로그인:{" "}
                                                    {formatDate(
                                                        user.lastLoginAt
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 font-medium">
                                                <Wallet className="h-4 w-4" />
                                                지갑 정보 ({user.wallets.length}
                                                개)
                                            </div>
                                            <div className="space-y-1 text-sm">
                                                {user.wallets.length > 0 ? (
                                                    user.wallets.map(
                                                        (wallet, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                >
                                                                    {
                                                                        wallet.provider
                                                                    }
                                                                </Badge>
                                                                <span className="font-mono text-xs">
                                                                    {wallet.address.slice(
                                                                        0,
                                                                        6
                                                                    )}
                                                                    ...
                                                                    {wallet.address.slice(
                                                                        -4
                                                                    )}
                                                                </span>
                                                            </div>
                                                        )
                                                    )
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        지갑 없음
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 font-medium">
                                                <Globe className="h-4 w-4" />
                                                기기/위치 정보
                                            </div>
                                            <div className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                                                <div>
                                                    브라우저:{" "}
                                                    {user.player?.browser ||
                                                        "-"}
                                                </div>
                                                <div>
                                                    OS: {user.player?.os || "-"}
                                                </div>
                                                <div>
                                                    기기:{" "}
                                                    {user.player?.device || "-"}
                                                </div>
                                                <div>
                                                    국가:{" "}
                                                    {user.player?.country ||
                                                        "-"}
                                                </div>
                                                <div>
                                                    도시:{" "}
                                                    {user.player?.city || "-"}
                                                </div>
                                                <div>
                                                    시간대:{" "}
                                                    {user.player?.timezone ||
                                                        "-"}
                                                </div>
                                            </div>
                                            {user.player?.ipAddress && (
                                                <div className="text-xs font-mono">
                                                    IP: {user.player.ipAddress}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 액션 버튼 */}
                                    <div className="flex justify-end pt-3 border-t mt-4">
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                openRewardModal(user)
                                            }
                                            disabled={!user.player?.id}
                                            className="flex items-center gap-2"
                                        >
                                            <Gift className="h-4 w-4" />
                                            보상 지급
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {users.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            {searchQuery
                                ? `"${searchQuery}"에 대한 검색 결과가 없습니다.`
                                : "사용자가 없습니다."}
                        </div>
                    )}
                </CardContent>
            </Card>

            {usersData && usersData.totalPages > 1 && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                페이지 {usersData.currentPage} /{" "}
                                {usersData.totalPages}({usersData.totalCount}명
                                중 {(usersData.currentPage - 1) * 50 + 1}-
                                {Math.min(
                                    usersData.currentPage * 50,
                                    usersData.totalCount
                                )}
                                명)
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        handlePageChange(currentPage - 1)
                                    }
                                    disabled={!usersData.hasPrevious || loading}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    이전
                                </Button>

                                <div className="flex items-center gap-1">
                                    {Array.from(
                                        {
                                            length: Math.min(
                                                5,
                                                usersData.totalPages
                                            ),
                                        },
                                        (_, i) => {
                                            const pageNum =
                                                Math.max(
                                                    1,
                                                    Math.min(
                                                        usersData.totalPages -
                                                            4,
                                                        Math.max(
                                                            1,
                                                            currentPage - 2
                                                        )
                                                    )
                                                ) + i;

                                            if (pageNum > usersData.totalPages)
                                                return null;

                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={
                                                        pageNum === currentPage
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        handlePageChange(
                                                            pageNum
                                                        )
                                                    }
                                                    disabled={loading}
                                                    className="w-8 h-8 p-0"
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        }
                                    )}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        handlePageChange(currentPage + 1)
                                    }
                                    disabled={!usersData.hasNext || loading}
                                >
                                    다음
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 보상 지급 모달 */}
            <Dialog open={rewardModalOpen} onOpenChange={closeRewardModal}>
                <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Gift className="h-5 w-5" />
                            보상 지급
                        </DialogTitle>
                    </DialogHeader>

                    {selectedUser && (
                        <div className="space-y-6">
                            {/* 선택된 사용자 정보 */}
                            <div className="bg-muted/50 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                        <Users className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {selectedUser.name ||
                                                selectedUser.player?.name ||
                                                selectedUser.player?.nickname ||
                                                "이름 없음"}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedUser.email ||
                                                selectedUser.player?.email ||
                                                "-"}
                                        </p>
                                    </div>
                                    {selectedUser.player?.id ? (
                                        <Badge className="ml-auto bg-green-500/10 text-green-500 border-green-500/20">
                                            플레이어 연결됨
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="destructive"
                                            className="ml-auto"
                                        >
                                            플레이어 없음
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* 에셋 선택 */}
                                <div className="space-y-2">
                                    <Label>에셋</Label>
                                    <Select
                                        value={selectedAssetId}
                                        onValueChange={setSelectedAssetId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="에셋 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {assets.map((asset) => (
                                                <SelectItem
                                                    key={asset.id}
                                                    value={asset.id}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span>
                                                            {asset.name}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            ({asset.symbol})
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* 수량 입력 */}
                                <div className="space-y-2">
                                    <Label>수량</Label>
                                    <Input
                                        type="number"
                                        value={rewardAmount}
                                        onChange={(e) =>
                                            setRewardAmount(e.target.value)
                                        }
                                        placeholder="0"
                                        min="1"
                                    />
                                </div>
                            </div>

                            {/* 사유 */}
                            <div className="space-y-2">
                                <Label>사유</Label>
                                <Textarea
                                    value={rewardReason}
                                    onChange={(e) =>
                                        setRewardReason(e.target.value)
                                    }
                                    placeholder="보상 지급 사유를 입력하세요"
                                    rows={3}
                                />
                            </div>

                            {/* 알림 설정 섹션 */}
                            <div className="space-y-4 border-t pt-4">
                                <h4 className="font-medium">알림 설정</h4>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* 알림 타입 - 고정값 */}
                                    <div className="space-y-2">
                                        <Label>알림 타입</Label>
                                        <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-600/50">
                                            <div className="flex items-center gap-2">
                                                <Gift className="w-4 h-4 text-green-400" />
                                                <span className="text-green-400 font-medium">
                                                    ASSET_RECEIVED
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">
                                                에셋 보상 알림
                                            </p>
                                        </div>
                                    </div>

                                    {/* 알림 카테고리 - 고정값 */}
                                    <div className="space-y-2">
                                        <Label>카테고리</Label>
                                        <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-600/50">
                                            <div className="flex items-center gap-2">
                                                <Coins className="w-4 h-4 text-blue-400" />
                                                <span className="text-blue-400 font-medium">
                                                    ASSETS
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">
                                                에셋 카테고리
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* 액션 타입 */}
                                    <div className="space-y-2">
                                        <Label>액션 타입</Label>
                                        <Select
                                            value={notificationActionType}
                                            onValueChange={
                                                setNotificationActionType
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NONE">
                                                    NONE
                                                </SelectItem>
                                                <SelectItem value="OPEN_APP">
                                                    OPEN_APP
                                                </SelectItem>
                                                <SelectItem value="OPEN_URL">
                                                    OPEN_URL
                                                </SelectItem>
                                                <SelectItem value="OPEN_WALLET">
                                                    OPEN_WALLET
                                                </SelectItem>
                                                <SelectItem value="CLAIM_REWARD">
                                                    CLAIM_REWARD
                                                </SelectItem>
                                                <SelectItem value="OPEN_SETTINGS">
                                                    OPEN_SETTINGS
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* 우선순위 */}
                                    <div className="space-y-2">
                                        <Label>우선순위</Label>
                                        <Select
                                            value={notificationPriority}
                                            onValueChange={
                                                setNotificationPriority
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="LOW">
                                                    LOW
                                                </SelectItem>
                                                <SelectItem value="MEDIUM">
                                                    MEDIUM
                                                </SelectItem>
                                                <SelectItem value="HIGH">
                                                    HIGH
                                                </SelectItem>
                                                <SelectItem value="URGENT">
                                                    URGENT
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* 알림 제목 */}
                                <div className="space-y-2">
                                    <Label>알림 제목</Label>
                                    <Input
                                        value={notificationTitle}
                                        onChange={(e) =>
                                            setNotificationTitle(e.target.value)
                                        }
                                        placeholder="알림 제목을 입력하세요"
                                    />
                                </div>

                                {/* 알림 메시지 */}
                                <div className="space-y-2">
                                    <Label>알림 메시지</Label>
                                    <Input
                                        value={notificationMessage}
                                        onChange={(e) =>
                                            setNotificationMessage(
                                                e.target.value
                                            )
                                        }
                                        placeholder="알림 메시지를 입력하세요"
                                    />
                                </div>

                                {/* 알림 설명 */}
                                <div className="space-y-2">
                                    <Label>알림 설명</Label>
                                    <Textarea
                                        value={notificationDescription}
                                        onChange={(e) =>
                                            setNotificationDescription(
                                                e.target.value
                                            )
                                        }
                                        placeholder="알림 상세 설명을 입력하세요"
                                        rows={3}
                                    />
                                </div>

                                {/* 액션 URL (옵션) */}
                                {notificationActionType === "OPEN_URL" && (
                                    <div className="space-y-2">
                                        <Label>액션 URL</Label>
                                        <Input
                                            value={actionUrl}
                                            onChange={(e) =>
                                                setActionUrl(e.target.value)
                                            }
                                            placeholder="https://..."
                                        />
                                    </div>
                                )}
                            </div>

                            {/* 플레이어 없을 때 경고 */}
                            {!selectedUser.player?.id && (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                                    <p className="text-sm text-destructive">
                                        이 사용자는 플레이어 계정이 연결되지
                                        않아 보상을 지급할 수 없습니다.
                                    </p>
                                </div>
                            )}

                            {/* 액션 버튼 */}
                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    onClick={closeRewardModal}
                                    disabled={isSubmittingReward}
                                >
                                    취소
                                </Button>
                                <Button
                                    onClick={handleGiveReward}
                                    disabled={
                                        isSubmittingReward ||
                                        !selectedAssetId ||
                                        !rewardAmount ||
                                        !selectedUser.player?.id ||
                                        !notificationTitle.trim() ||
                                        !notificationMessage.trim()
                                    }
                                >
                                    {isSubmittingReward ? (
                                        <>
                                            <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                                            지급중...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            보상 지급
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
