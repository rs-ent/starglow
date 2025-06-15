/// components\admin\onchain\OnChain.EscrowWallet.tsx
/// Blockchain Escrow Wallet Component

"use client";

import { useState } from "react";
import { useEscrowWalletManager } from "@/app/hooks/useBlockchain";
import { useBlockchainNetworksManager } from "@/app/hooks/useBlockchain";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    PlusCircle,
    Check,
    X,
    RefreshCw,
    Eye,
    EyeOff,
    Copy,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import PartialLoading from "@/components/atoms/PartialLoading";
import { useToast } from "@/app/hooks/useToast";
import { JsonValue } from "@prisma/client/runtime/library";

// Wallet 타입 정의 추가
interface Wallet {
    id: string;
    address: string;
    privateKey?: string | null;
    networkIds: string[];
    isActive: boolean;
    balance: JsonValue;
    createdAt: Date;
    updatedAt: Date;
    keyHash: string;
    nonce: string;
}

export default function OnChainEscrowWallet() {
    const {
        wallets,
        isLoading,
        error,
        isError,
        saveWallet,
        updateStatus,
        updateBalance,
        generateWallet,
        getWalletBalance,
        isSavingWallet,
        isGeneratingWallet,
    } = useEscrowWalletManager();

    const { networks, isLoading: isLoadingNetworks } =
        useBlockchainNetworksManager();

    const toast = useToast();

    // 주소 복사 상태 관리
    const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

    const [showAddForm, setShowAddForm] = useState(false);
    const [revealPrivateKey, setRevealPrivateKey] = useState(false);
    const [updatingWalletId, setUpdatingWalletId] = useState<string | null>(
        null
    );
    const [newWallet, setNewWallet] = useState({
        address: "",
        privateKey: "",
        networkIds: [] as string[],
    });

    function formatDate(date: Date) {
        return format(new Date(date), "yyyy-MM-dd HH:mm:ss");
    }

    function formatUpdatedAt(date: Date) {
        const now = new Date();
        const updated = new Date(date);
        const diffInSeconds = Math.floor(
            (now.getTime() - updated.getTime()) / 1000
        );

        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600)
            return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400)
            return `${Math.floor(diffInSeconds / 3600)}h ago`;

        return format(updated, "yyyy-MM-dd HH:mm");
    }

    function handleNetworkChange(networkId: string) {
        if (newWallet.networkIds.includes(networkId)) {
            setNewWallet((prev) => ({
                ...prev,
                networkIds: prev.networkIds.filter((id) => id !== networkId),
            }));
        } else {
            setNewWallet((prev) => ({
                ...prev,
                networkIds: [...prev.networkIds, networkId],
            }));
        }
    }

    function handleAddressChange(address: string) {
        setNewWallet((prev) => ({ ...prev, address }));
    }

    function handlePrivateKeyChange(privateKey: string) {
        setNewWallet((prev) => ({ ...prev, privateKey }));
    }

    async function handleGenerateWallet() {
        try {
            const result = await generateWallet();
            setNewWallet({
                address: result.address,
                privateKey: result.privateKey,
                networkIds: [],
            });
        } catch (error) {
            console.error("Failed to generate wallet:", error);
            toast.error("Failed to generate wallet");
        }
    }

    async function handleAddWallet() {
        try {
            await saveWallet({
                address: newWallet.address,
                privateKey: newWallet.privateKey,
                networkIds: newWallet.networkIds,
            });
            // Reset form
            setNewWallet({
                address: "",
                privateKey: "",
                networkIds: [],
            });
            setShowAddForm(false);
            setRevealPrivateKey(false);
            toast.success("Wallet added successfully");
        } catch (error) {
            console.error("Failed to add wallet:", error);
            toast.error("Failed to add wallet");
        }
    }

    async function handleSetActive(id: string, isActive: boolean) {
        try {
            await updateStatus({ id, isActive });
            toast.success(`Wallet set as ${isActive ? "active" : "inactive"}`);
        } catch (error) {
            console.error("Failed to update wallet status:", error);
            toast.error("Failed to update wallet status");
        }
    }

    async function handleUpdateBalance(wallet: Wallet) {
        try {
            setUpdatingWalletId(wallet.id);

            // 월렛 지원 네트워크별로 잔액 조회
            const newBalances: Record<string, string> = {};

            // 각 네트워크별 잔액 조회
            for (const networkId of wallet.networkIds) {
                try {
                    const balanceResult = await getWalletBalance({
                        address: wallet.address,
                        networkId: networkId,
                    });

                    if (
                        balanceResult &&
                        balanceResult.network &&
                        balanceResult.network.symbol
                    ) {
                        // 네트워크 심볼을 키로 사용해 잔액 저장
                        newBalances[balanceResult.network.symbol] =
                            balanceResult.formatted;
                    }
                } catch (err) {
                    console.error(
                        `Failed to fetch balance for network ${networkId}:`,
                        err
                    );
                }
            }

            // 데이터베이스에 업데이트된 잔액 저장
            if (Object.keys(newBalances).length > 0) {
                await updateBalance({
                    id: wallet.id,
                    balance: newBalances,
                });
                toast.success("Wallet balance updated successfully");
            } else {
                toast.warning("No balances found for the wallet's networks");
            }
        } catch (error) {
            console.error("Failed to update wallet balance:", error);
            toast.error("Failed to update wallet balance");
        } finally {
            setUpdatingWalletId(null);
        }
    }

    function formatBalance(balance: JsonValue) {
        if (
            !balance ||
            typeof balance !== "object" ||
            Array.isArray(balance) ||
            Object.keys(balance as object).length === 0
        ) {
            return "No balance data";
        }

        try {
            return Object.entries(balance as Record<string, string>)
                .map(([_, amount]) => `${amount}`)
                .join(", ");
        } catch (error) {
            console.error("Error formatting balance:", error);
            return "Invalid balance data";
        }
    }

    // 주소 복사 함수
    async function copyToClipboard(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedAddress(text);

            // 1.5초 후 복사 표시 제거
            setTimeout(() => {
                setCopiedAddress(null);
            }, 1500);

            toast.success("Address copied to clipboard");
        } catch (err) {
            console.error("Failed to copy:", err);
            toast.error("Failed to copy address");
        }
    }

    return (
        <div className="space-y-6">
            <Card className="border-none shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-bold">
                            에스크로 지갑
                        </CardTitle>
                    </div>
                    <Button
                        variant={showAddForm ? "secondary" : "default"}
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="transition-all duration-200"
                    >
                        {showAddForm ? (
                            <div className="flex items-center gap-2">
                                <X className="h-4 w-4" />
                                <span>취소</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <PlusCircle className="h-4 w-4" />
                                <span>지갑 추가</span>
                            </div>
                        )}
                    </Button>
                </CardHeader>

                <CardContent className="pt-6">
                    {showAddForm && (
                        <Card className="mb-8 border-2 border-primary/10 bg-muted/5">
                            <CardHeader className="space-y-1">
                                <CardTitle className="text-xl">
                                    새로운 에스크로 지갑 추가
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Generate Wallet Section */}
                                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                                    <Label className="text-base font-medium">
                                        퀵뷰
                                    </Label>
                                    <Button
                                        variant="outline"
                                        onClick={handleGenerateWallet}
                                        disabled={isGeneratingWallet}
                                        className="w-full sm:w-auto"
                                    >
                                        {isGeneratingWallet ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>생성 중...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <RefreshCw className="h-4 w-4" />
                                                <span>새로운 지갑 생성</span>
                                            </div>
                                        )}
                                    </Button>
                                    <p className="text-sm text-muted-foreground">
                                        주소와 개인키가 자동으로 생성됩니다
                                    </p>
                                </div>

                                {/* Wallet Details Section */}
                                <div className="grid gap-6">
                                    {/* Address Input */}
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="address"
                                            className="text-sm font-medium"
                                        >
                                            지갑 주소
                                        </Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="address"
                                                value={newWallet.address}
                                                onChange={(e) =>
                                                    handleAddressChange(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="0x..."
                                                className="font-mono text-sm"
                                            />
                                            {newWallet.address && (
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() =>
                                                        copyToClipboard(
                                                            newWallet.address
                                                        )
                                                    }
                                                    className="shrink-0"
                                                >
                                                    {copiedAddress ===
                                                    newWallet.address ? (
                                                        <Check className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <Copy className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Private Key Input */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label
                                                htmlFor="privateKey"
                                                className="text-sm font-medium"
                                            >
                                                Private Key
                                            </Label>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    setRevealPrivateKey(
                                                        !revealPrivateKey
                                                    )
                                                }
                                                className="h-8"
                                            >
                                                {revealPrivateKey ? (
                                                    <div className="flex items-center gap-2">
                                                        <EyeOff className="h-4 w-4" />
                                                        <span>숨김</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <Eye className="h-4 w-4" />
                                                        <span>표시시</span>
                                                    </div>
                                                )}
                                            </Button>
                                        </div>
                                        <Input
                                            id="privateKey"
                                            type={
                                                revealPrivateKey
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={newWallet.privateKey}
                                            onChange={(e) =>
                                                handlePrivateKeyChange(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Enter private key"
                                            className="font-mono text-sm"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            개인키는 저장 전에 안전하게
                                            암호화됩니다
                                        </p>
                                    </div>

                                    {/* Networks Selection */}
                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium">
                                            지원되는 네트워크
                                        </Label>
                                        {isLoadingNetworks ? (
                                            <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg">
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                <span>네트워크 로드 중...</span>
                                            </div>
                                        ) : (
                                            <div className="grid sm:grid-cols-2 gap-3 p-4 bg-muted/30 rounded-lg">
                                                {networks?.map((network) => (
                                                    <div
                                                        key={network.id}
                                                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            id={`network-${network.id}`}
                                                            checked={newWallet.networkIds.includes(
                                                                network.id
                                                            )}
                                                            onChange={() =>
                                                                handleNetworkChange(
                                                                    network.id
                                                                )
                                                            }
                                                            className="h-4 w-4 rounded border-gray-300"
                                                        />
                                                        <Label
                                                            htmlFor={`network-${network.id}`}
                                                            className="text-sm font-normal cursor-pointer"
                                                        >
                                                            {network.name}
                                                            {network.isTestnet && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="ml-2 text-xs"
                                                                >
                                                                    Testnet
                                                                </Badge>
                                                            )}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-3 border-t pt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setNewWallet({
                                            address: "",
                                            privateKey: "",
                                            networkIds: [],
                                        });
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAddWallet}
                                    disabled={
                                        isSavingWallet ||
                                        !newWallet.address ||
                                        !newWallet.privateKey ||
                                        newWallet.networkIds.length === 0
                                    }
                                >
                                    {isSavingWallet ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>저장 중...</span>
                                        </div>
                                    ) : (
                                        "지갑 추가"
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {/* Wallets Table Section */}
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <PartialLoading text="지갑 로드 중..." />
                        </div>
                    ) : isError ? (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>
                                {error instanceof Error
                                    ? error.message
                                    : "Failed to load wallets"}
                            </AlertDescription>
                        </Alert>
                    ) : !wallets || wallets.length === 0 ? (
                        <div className="text-center py-12 space-y-4">
                            <p className="text-muted-foreground">
                                아직 지갑이 추가되지 않았습니다.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => setShowAddForm(true)}
                                className="gap-2"
                            >
                                <PlusCircle className="h-4 w-4" />
                                <span>첫 번째 지갑을 추가해보세요!</span>
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-lg border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>주소</TableHead>
                                        <TableHead>네트워크</TableHead>
                                        <TableHead>잔액</TableHead>
                                        <TableHead>생성일</TableHead>
                                        <TableHead>업데이트일</TableHead>
                                        <TableHead>상태</TableHead>
                                        <TableHead className="text-right">
                                            작업
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {wallets.map((wallet) => (
                                        <TableRow
                                            key={wallet.id}
                                            className="hover:bg-muted/5"
                                        >
                                            <TableCell className="font-mono">
                                                <div
                                                    className="flex items-center gap-2 group cursor-pointer"
                                                    onClick={() =>
                                                        copyToClipboard(
                                                            wallet.address
                                                        )
                                                    }
                                                >
                                                    <span className="truncate max-w-[150px]">
                                                        {wallet.address}
                                                    </span>
                                                    {copiedAddress ===
                                                    wallet.address ? (
                                                        <Check className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <Copy className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {wallet.networkIds.map(
                                                        (id) => {
                                                            const network =
                                                                networks?.find(
                                                                    (n) =>
                                                                        n.id ===
                                                                        id
                                                                );
                                                            return network ? (
                                                                <Badge
                                                                    key={id}
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                >
                                                                    {
                                                                        network.name
                                                                    }
                                                                </Badge>
                                                            ) : null;
                                                        }
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-mono text-sm">
                                                    {formatBalance(
                                                        wallet.balance
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-muted-foreground">
                                                    {formatDate(
                                                        wallet.createdAt
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-muted-foreground">
                                                    {formatUpdatedAt(
                                                        wallet.updatedAt
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        wallet.isActive
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                    className={
                                                        wallet.isActive
                                                            ? "bg-green-500/10 text-green-500"
                                                            : ""
                                                    }
                                                >
                                                    {wallet.isActive
                                                        ? "활성"
                                                        : "비활성"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-2">
                                                    {!wallet.isActive && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleSetActive(
                                                                    wallet.id,
                                                                    true
                                                                )
                                                            }
                                                            className="h-8"
                                                        >
                                                            활성화
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleUpdateBalance(
                                                                wallet
                                                            )
                                                        }
                                                        disabled={
                                                            updatingWalletId ===
                                                            wallet.id
                                                        }
                                                        className="h-8"
                                                    >
                                                        {updatingWalletId ===
                                                        wallet.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <RefreshCw className="h-4 w-4" />
                                                                <span>
                                                                    업데이트
                                                                </span>
                                                            </div>
                                                        )}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
