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
    CardDescription,
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
        activeWallet,
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
        isUpdatingBalance,
        isGettingBalance,
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

    function getNetworkNames(networkIds: string[]) {
        if (!networks) return "None";

        return networkIds
            .map((id) => {
                const network = networks.find((n) => n.id === id);
                return network?.name || "Unknown";
            })
            .join(", ");
    }

    function formatBalance(balance: JsonValue, networkIds: string[] = []) {
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
                .map(([token, amount]) => `${amount}`)
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
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Escrow Wallets</CardTitle>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setShowAddForm(!showAddForm)}
                    >
                        {showAddForm ? (
                            <>
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </>
                        ) : (
                            <>
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Add Wallet
                            </>
                        )}
                    </Button>
                </CardHeader>
                <CardContent>
                    {showAddForm && (
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Add New Escrow Wallet</CardTitle>
                                <CardDescription>
                                    Enter wallet details to add a new escrow
                                    wallet
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Generate Wallet
                                    </Label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleGenerateWallet}
                                        disabled={isGeneratingWallet}
                                    >
                                        {isGeneratingWallet ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            "Generate Wallet"
                                        )}
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Creates a new random wallet with address
                                        and private key
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">
                                        Wallet Address*
                                    </Label>
                                    <div className="flex items-center space-x-1">
                                        <Input
                                            id="address"
                                            value={newWallet.address}
                                            onChange={(e) =>
                                                handleAddressChange(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="0x..."
                                            required
                                        />
                                        {newWallet.address && (
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                type="button"
                                                onClick={() =>
                                                    copyToClipboard(
                                                        newWallet.address
                                                    )
                                                }
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

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="privateKey">
                                            Private Key*
                                        </Label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                setRevealPrivateKey(
                                                    !revealPrivateKey
                                                )
                                            }
                                        >
                                            {revealPrivateKey ? (
                                                <>
                                                    <EyeOff className="h-4 w-4 mr-1" />
                                                    Hide
                                                </>
                                            ) : (
                                                <>
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    Show
                                                </>
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
                                        required
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Private key will be encrypted before
                                        storage.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Supported Networks*</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {isLoadingNetworks ? (
                                            <div className="col-span-2 flex items-center justify-center p-4">
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                <span>Loading networks...</span>
                                            </div>
                                        ) : (
                                            networks?.map((network) => (
                                                <div
                                                    key={network.id}
                                                    className="flex items-center space-x-2"
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
                                                        className="text-sm font-normal"
                                                    >
                                                        {network.name}
                                                        {network.isTestnet &&
                                                            " (Testnet)"}
                                                    </Label>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    {newWallet.networkIds.length === 0 && (
                                        <p className="text-sm text-destructive">
                                            Select at least one network.
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end space-x-2">
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
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Add Wallet"
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <PartialLoading text="Loading wallets..." />
                        </div>
                    ) : isError ? (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>
                                {error instanceof Error
                                    ? error.message
                                    : "Failed to load wallets"}
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="overflow-x-auto">
                            {!wallets || wallets.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground mb-4">
                                        No escrow wallets have been added yet.
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowAddForm(true)}
                                    >
                                        Add Your First Wallet
                                    </Button>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Address</TableHead>
                                            <TableHead>Networks</TableHead>
                                            <TableHead>Balance</TableHead>
                                            <TableHead>Created At</TableHead>
                                            <TableHead>Last Updated</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {wallets.map((wallet) => (
                                            <TableRow key={wallet.id}>
                                                <TableCell className="font-mono">
                                                    <div
                                                        className="flex items-center space-x-1 cursor-pointer group"
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
                                                            <Check className="h-4 w-4 text-green-500 opacity-100" />
                                                        ) : (
                                                            <Copy className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getNetworkNames(
                                                        wallet.networkIds
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatBalance(
                                                        wallet.balance,
                                                        wallet.networkIds
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatDate(
                                                        wallet.createdAt
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatUpdatedAt(
                                                        wallet.updatedAt
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            wallet.isActive
                                                                ? "default"
                                                                : "outline"
                                                        }
                                                    >
                                                        {wallet.isActive
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-2">
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
                                                            >
                                                                Set Active
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
                                                        >
                                                            {updatingWalletId ===
                                                            wallet.id ? (
                                                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                            ) : (
                                                                <RefreshCw className="h-4 w-4 mr-1" />
                                                            )}
                                                            Update Balance
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
