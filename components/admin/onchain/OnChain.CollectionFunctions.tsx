/// components\admin\onchain\OnChain.CollectionFunctions.tsx
/// Collection Contract Functions Component

"use client";

import { useState, useEffect } from "react";

import {
    Loader2,
    Check,
    AlertTriangle,
    Pause,
    Play,
    Eye,
    EyeOff,
    Copy,
    ExternalLink,
    Settings,
} from "lucide-react";

import {
    useEscrowWalletManager,
    useBlockchainNetworksManager,
    useEstimateMintGas,
} from "@/app/hooks/useBlockchain";
import {
    useCollectionGet,
    useCollectionSet,
} from "@/app/hooks/useCollectionContracts";
import { useToast } from "@/app/hooks/useToast";
import { useUpdateCollectionSettingsMutation } from "@/app/mutations/collectionContractsMutations";
import DateTimePicker from "@/components/atoms/DateTimePicker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import OnChainCollectionPageImages from "./OnChain.CollectionPageImages";

import type { CollectionContract } from "@prisma/client";

interface CollectionFunctionsProps {
    collection: CollectionContract;
    onClose: () => void;
    onCollectionUpdated?: (collection: CollectionContract) => void;
}

export default function CollectionFunctions({
    collection,
    onClose,
    onCollectionUpdated,
}: CollectionFunctionsProps) {
    const toast = useToast();

    // 상태 관리
    const [mintQuantity, setMintQuantity] = useState("1");
    const [mintAddress, setMintAddress] = useState("");
    const [privateKey, setPrivateKey] = useState("");
    const [selectedWalletId, setSelectedWalletId] = useState<string>("");
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const [customGasSettings, setCustomGasSettings] = useState(false);
    const [gasLimit, setGasLimit] = useState("");
    const [gasPrice, setGasPrice] = useState("");
    const [showGasSettings, setShowGasSettings] = useState(false);
    const [isListed, setIsListed] = useState(collection.isListed);
    const [gasEstimateData, setGasEstimateData] = useState<any>(null);
    const [lastOperation, setLastOperation] = useState<{
        success: boolean;
        message: string;
        txHash?: string;
    } | null>(null);

    // 설정 상태
    const [price, setPrice] = useState(collection.price?.toString() || "0");
    const [circulation, setCirculation] = useState(
        collection.circulation?.toString() || "0"
    );
    const [preSaleStart, setPreSaleStart] = useState(
        collection.preSaleStart?.toString() || ""
    );
    const [preSaleEnd, setPreSaleEnd] = useState(
        collection.preSaleEnd?.toString() || ""
    );
    const [saleStart, setSaleStart] = useState(
        collection.saleStart?.toString() || ""
    );
    const [saleEnd, setSaleEnd] = useState(
        collection.saleEnd?.toString() || ""
    );
    const [glowStart, setGlowStart] = useState(
        collection.glowStart?.toString() || ""
    );
    const [glowEnd, setGlowEnd] = useState(
        collection.glowEnd?.toString() || ""
    );

    const [showPageImages, setShowPageImages] = useState(false);

    // 컬렉션 데이터 및 작업
    const {
        tokens,
        status,
        isLoading: isLoadingCollection,
    } = useCollectionGet({
        collectionAddress: collection.address,
        walletId: selectedWalletId,
    });

    const {
        mint,
        burn,
        pause,
        unpause,
        isProcessing,
        isMinting,
        isBurning,
        isPausing,
        isUnpausing,
        refresh,
    } = useCollectionSet({
        collectionAddress: collection.address,
        walletId: selectedWalletId,
    });

    // 지갑 및 네트워크 관리
    const {
        wallets,
        isLoading: isLoadingWallets,
        getWalletWithPrivateKey,
    } = useEscrowWalletManager();
    const { networks } = useBlockchainNetworksManager();

    // 가스 추정
    const { estimate, isEstimating: isGasEstimateLoading } =
        useEstimateMintGas();

    // 컬렉션 설정 업데이트
    const updateSettingsMutation = useUpdateCollectionSettingsMutation();
    const isUpdatingSettings = updateSettingsMutation.isPending;

    // 가스 추정 업데이트 (민팅 관련 입력 변경시)
    useEffect(() => {
        if (selectedWalletId && mintAddress && parseInt(mintQuantity) > 0) {
            handleEstimateGas();
        }
    }, [selectedWalletId, mintAddress, mintQuantity]);

    // 가스 추정 결과를 사용하여 가스 설정 필드 업데이트
    useEffect(() => {
        if (gasEstimateData && !customGasSettings && privateKey) {
            setGasLimit(gasEstimateData.gasLimit || "");
            setGasPrice(gasEstimateData.maxFeePerGas || "");
        }
    }, [gasEstimateData, customGasSettings, privateKey]);

    // 가스 추정 함수
    const handleEstimateGas = async () => {
        if (!selectedWalletId || !mintAddress || parseInt(mintQuantity) <= 0) {
            return;
        }

        try {
            const result = await estimate({
                collectionAddress: collection.address,
                walletId: selectedWalletId,
                quantity: parseInt(mintQuantity),
            });

            if (result) {
                setGasEstimateData(result);
            }
        } catch (error) {
            console.error("Error estimating gas:", error);
            toast.error("Failed to estimate gas");
        }
    };

    // 지갑 선택 핸들러
    const handleWalletSelect = async (walletId: string) => {
        try {
            setSelectedWalletId(walletId);
            const result = await getWalletWithPrivateKey(walletId);
            setPrivateKey(result.privateKey);

            const selectedWallet = wallets?.find(
                (wallet) => wallet.id === walletId
            );
            if (selectedWallet) {
                setMintAddress(selectedWallet.address);
            }
        } catch (error) {
            console.error("Error fetching private key:", error);
            toast.error("Failed to fetch wallet private key");
        }
    };

    // 민팅 핸들러
    const handleMint = async () => {
        if (!mintAddress || !privateKey) return;

        const quantity = parseInt(mintQuantity);
        if (isNaN(quantity) || quantity <= 0) return;

        try {
            const result = await mint({
                collectionAddress: collection.address,
                walletId: selectedWalletId,
                quantity,
                gasOptions: customGasSettings
                    ? {
                          gasLimit: BigInt(gasLimit),
                          maxFeePerGas: BigInt(gasPrice),
                      }
                    : undefined,
            });

            if (result.success) {
                let txHash = undefined;
                if (
                    result.data &&
                    Array.isArray(result.data) &&
                    result.data.length > 0 &&
                    "transactionHash" in result.data[0]
                ) {
                    txHash = result.data[0].transactionHash;
                }

                setLastOperation({
                    success: true,
                    message: `Successfully minted ${quantity} tokens`,
                    txHash: txHash,
                });

                await refresh();

                if (onCollectionUpdated) {
                    onCollectionUpdated({
                        ...collection,
                        mintedCount: (collection.mintedCount || 0) + quantity,
                    });
                }

                toast.success(`Successfully minted ${quantity} tokens`);
            } else {
                setLastOperation({
                    success: false,
                    message: result.error || "Failed to mint tokens",
                });
                toast.error(result.error || "Failed to mint tokens");
            }
        } catch (error) {
            console.error("Error minting tokens:", error);
            toast.error("Error minting tokens");
            setLastOperation({
                success: false,
                message:
                    error instanceof Error ? error.message : "Unknown error",
            });
        }
    };

    // 일시 중지/해제 핸들러
    const handleTogglePause = async () => {
        if (!privateKey) return;

        try {
            if (status?.isPaused) {
                const result = await unpause({
                    collectionAddress: collection.address,
                    walletId: selectedWalletId,
                });

                if (result.success) {
                    setLastOperation({
                        success: true,
                        message: "Collection unpaused successfully",
                        txHash: result.transactionHash,
                    });

                    if (onCollectionUpdated) {
                        onCollectionUpdated({
                            ...collection,
                        });
                    }

                    toast.success("Collection unpaused successfully");
                } else {
                    setLastOperation({
                        success: false,
                        message: result.error || "Failed to unpause collection",
                    });
                    toast.error(result.error || "Failed to unpause collection");
                }
            } else {
                const result = await pause({
                    collectionAddress: collection.address,
                    walletId: selectedWalletId,
                });

                if (result.success) {
                    setLastOperation({
                        success: true,
                        message: "Collection paused successfully",
                        txHash: result.transactionHash,
                    });

                    if (onCollectionUpdated) {
                        onCollectionUpdated({
                            ...collection,
                        });
                    }

                    toast.success("Collection paused successfully");
                } else {
                    setLastOperation({
                        success: false,
                        message: result.error || "Failed to pause collection",
                    });
                    toast.error(result.error || "Failed to pause collection");
                }
            }
        } catch (error) {
            console.error("Error toggling pause:", error);
            toast.error("Error toggling pause state");
            setLastOperation({
                success: false,
                message:
                    error instanceof Error ? error.message : "Unknown error",
            });
        }
    };

    // 설정 업데이트 핸들러
    const handleUpdateSettings = async () => {
        try {
            const result = await updateSettingsMutation.mutateAsync({
                collectionAddress: collection.address,
                price: Number(price),
                circulation: Number(circulation),
                isListed: isListed,
                preSaleStart: preSaleStart ? new Date(preSaleStart) : undefined,
                preSaleEnd: preSaleEnd ? new Date(preSaleEnd) : undefined,
                saleStart: saleStart ? new Date(saleStart) : undefined,
                saleEnd: saleEnd ? new Date(saleEnd) : undefined,
                glowStart: glowStart ? new Date(glowStart) : undefined,
                glowEnd: glowEnd ? new Date(glowEnd) : undefined,
            });

            if (result.success) {
                setLastOperation({
                    success: true,
                    message: "Collection settings updated successfully",
                });

                if (onCollectionUpdated) {
                    onCollectionUpdated({
                        ...collection,
                        price: Number(price),
                        circulation: Number(circulation),
                        isListed: isListed,
                    });
                }

                toast.success("Collection settings updated successfully");
            } else {
                setLastOperation({
                    success: false,
                    message: result.error || "Failed to update settings",
                });
                toast.error(result.error || "Failed to update settings");
            }
        } catch (error) {
            console.error("Failed to update settings:", error);
            toast.error("Failed to update settings");
            setLastOperation({
                success: false,
                message:
                    error instanceof Error ? error.message : "Unknown error",
            });
        }
    };

    // 유틸리티 함수들
    const getNetworkNames = (networkIds: string[]) => {
        if (!networks) return "None";
        return networkIds
            .map((id) => networks.find((n) => n.id === id)?.name || "Unknown")
            .join(", ");
    };

    const convertToGatewayUrl = (ipfsUrl: string): string => {
        if (!ipfsUrl) return "";
        if (ipfsUrl.startsWith("ipfs://")) {
            return `https://gateway.pinata.cloud/ipfs/${ipfsUrl.replace(
                "ipfs://",
                ""
            )}`;
        }
        return ipfsUrl.startsWith("http") ? ipfsUrl : ipfsUrl;
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const openExternalLink = (url: string) => {
        window.open(url, "_blank", "noopener,noreferrer");
    };

    // 설정 카드 컴포넌트
    const settingsCard = (
        <Card>
            <CardHeader>
                <CardTitle>Collection Settings</CardTitle>
                <CardDescription>
                    Update collection price and circulation
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="price">Price (＄)</Label>
                    <Input
                        id="price"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="Enter price in wei"
                        disabled={isUpdatingSettings}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="circulation">Maximum Circulation</Label>
                    <Input
                        id="circulation"
                        type="number"
                        value={circulation}
                        onChange={(e) => setCirculation(e.target.value)}
                        placeholder="Enter maximum circulation"
                        disabled={isUpdatingSettings}
                    />
                </div>

                {/* Pre-sale Period */}
                <div className="space-y-4 pt-4 border-t">
                    <Label className="font-medium">Pre-sale Period</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <DateTimePicker
                            label="Start Date"
                            value={
                                preSaleStart
                                    ? new Date(preSaleStart)
                                    : new Date()
                            }
                            onChange={(date) =>
                                setPreSaleStart(date.toISOString())
                            }
                            disabled={isUpdatingSettings}
                            minDate={new Date()}
                        />
                        <DateTimePicker
                            label="End Date"
                            value={
                                preSaleEnd ? new Date(preSaleEnd) : new Date()
                            }
                            onChange={(date) =>
                                setPreSaleEnd(date.toISOString())
                            }
                            disabled={isUpdatingSettings}
                            minDate={
                                preSaleStart
                                    ? new Date(preSaleStart)
                                    : new Date()
                            }
                        />
                    </div>
                </div>

                {/* Main Sale Period */}
                <div className="space-y-4 pt-4 border-t">
                    <Label className="font-medium">Main Sale Period</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <DateTimePicker
                            label="Start Date"
                            value={saleStart ? new Date(saleStart) : new Date()}
                            onChange={(date) =>
                                setSaleStart(date.toISOString())
                            }
                            disabled={isUpdatingSettings}
                            minDate={
                                preSaleEnd ? new Date(preSaleEnd) : new Date()
                            }
                        />
                        <DateTimePicker
                            label="End Date"
                            value={saleEnd ? new Date(saleEnd) : new Date()}
                            onChange={(date) => setSaleEnd(date.toISOString())}
                            disabled={isUpdatingSettings}
                            minDate={
                                saleStart ? new Date(saleStart) : new Date()
                            }
                        />
                    </div>
                </div>

                {/* Glow Period */}
                <div className="space-y-4 pt-4 border-t">
                    <Label className="font-medium">Glow Period</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <DateTimePicker
                            label="Start Date"
                            value={glowStart ? new Date(glowStart) : new Date()}
                            onChange={(date) =>
                                setGlowStart(date.toISOString())
                            }
                            disabled={isUpdatingSettings}
                            minDate={saleEnd ? new Date(saleEnd) : new Date()}
                        />
                        <DateTimePicker
                            label="End Date"
                            value={glowEnd ? new Date(glowEnd) : new Date()}
                            onChange={(date) => setGlowEnd(date.toISOString())}
                            disabled={isUpdatingSettings}
                            minDate={
                                glowStart ? new Date(glowStart) : new Date()
                            }
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="listed">Listed</Label>
                    <Switch
                        id="listed"
                        checked={isListed}
                        onCheckedChange={setIsListed}
                    />
                </div>

                <div>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setShowPageImages(!showPageImages);
                        }}
                    >
                        페이지 이미지 추가하기
                    </Button>
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    onClick={handleUpdateSettings}
                    disabled={isUpdatingSettings}
                    className="w-full"
                >
                    {isUpdatingSettings ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                        </>
                    ) : (
                        "Update Settings"
                    )}
                </Button>
            </CardFooter>
        </Card>
    );

    return (
        <div className="rounded-md bg-muted/40 p-4 space-y-4">
            <h3 className="text-lg font-semibold">컬렉션 컨트랙트 기능</h3>
            <div className="text-sm text-muted-foreground mb-4">
                이 NFT 컬렉션을 관리하고 상호작용하세요.
                <div className="mt-2 font-mono text-xs">
                    컬렉션 주소: {collection.address}
                </div>
                <div className="font-mono text-xs">
                    네트워크:{" "}
                    {networks?.find((n) => n.id === collection.networkId)
                        ?.name || "Unknown"}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>지갑</CardTitle>
                    <CardDescription>
                        컬렉션을 상호작용하기 위한 지갑을 선택하세요
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid w-full items-center gap-4">
                        <div className="space-y-2">
                            <Label>지갑 선택</Label>
                            <select
                                className="w-full p-2 rounded-md border bg-card"
                                value={selectedWalletId}
                                onChange={(e) =>
                                    handleWalletSelect(e.target.value)
                                }
                            >
                                <option value="">지갑 선택</option>
                                {wallets?.map((wallet) => (
                                    <option key={wallet.id} value={wallet.id}>
                                        {wallet.address} (
                                        {getNetworkNames(wallet.networkIds)})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="privateKey">Private Key</Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        setShowPrivateKey(!showPrivateKey)
                                    }
                                >
                                    {showPrivateKey ? (
                                        <>
                                            <EyeOff className="h-4 w-4 mr-1" />
                                            숨김
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="h-4 w-4 mr-1" />
                                            보기
                                        </>
                                    )}
                                </Button>
                            </div>
                            <Input
                                id="privateKey"
                                type={showPrivateKey ? "text" : "password"}
                                placeholder="프라이빗빗 키는 자동으로 로드됩니다"
                                value={privateKey}
                                disabled
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {lastOperation && (
                <Alert
                    className={
                        lastOperation.success ? "bg-slate-900" : "bg-red-900/20"
                    }
                >
                    {lastOperation.success ? (
                        <Check className="h-4 w-4 text-green-600" />
                    ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertTitle>
                        {lastOperation.success ? "Success" : "Error"}
                    </AlertTitle>
                    <AlertDescription>
                        {lastOperation.message}
                        {lastOperation.txHash && (
                            <div className="mt-2">
                                <span className="font-medium">
                                    Transaction:
                                </span>{" "}
                                <span className="font-mono text-sm">
                                    {lastOperation.txHash}
                                </span>
                            </div>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="mint" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="mint">민팅</TabsTrigger>
                    <TabsTrigger value="metadata">메타데이터</TabsTrigger>
                    <TabsTrigger value="settings">설정</TabsTrigger>
                </TabsList>

                <TabsContent value="mint" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>토큰 민팅</CardTitle>
                            <CardDescription>
                                지정된 주소에 새로운 NFT를 민팅하세요
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid w-full items-center gap-2">
                                <Label htmlFor="recipient">수신자 주소</Label>
                                <Input
                                    id="recipient"
                                    placeholder="0x..."
                                    value={mintAddress}
                                    onChange={(e) =>
                                        setMintAddress(e.target.value)
                                    }
                                />
                            </div>
                            <div className="grid w-full items-center gap-2">
                                <Label htmlFor="quantity">수량</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    placeholder="1"
                                    value={mintQuantity}
                                    onChange={(e) =>
                                        setMintQuantity(e.target.value)
                                    }
                                />
                            </div>

                            <div className="border rounded-md p-3 mt-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <div className="font-medium text-sm">
                                        가스 추정
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setShowGasSettings(!showGasSettings)
                                        }
                                    >
                                        <Settings className="h-4 w-4 mr-1" />
                                        {showGasSettings
                                            ? "Hide Settings"
                                            : "Show Settings"}
                                    </Button>
                                </div>

                                {mintAddress && parseInt(mintQuantity) > 0 ? (
                                    <div className="text-sm space-y-1">
                                        {!selectedWalletId ? (
                                            <div className="text-yellow-500">
                                                <AlertTriangle className="h-3 w-3 inline mr-1" />
                                                관리자 또는 에스크로 권한이 있는
                                                지갑을 선택하세요
                                            </div>
                                        ) : isGasEstimateLoading ? (
                                            <div className="flex items-center">
                                                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                                가스 추정 중...
                                            </div>
                                        ) : gasEstimateData ? (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">
                                                        예상 가스 비용:
                                                    </span>
                                                    <span className="font-mono">
                                                        {
                                                            gasEstimateData.estimatedGasCostInEth
                                                        }{" "}
                                                        {
                                                            gasEstimateData.networkSymbol
                                                        }
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>가스 한도:</span>
                                                    <span className="font-mono">
                                                        {
                                                            gasEstimateData.gasLimit
                                                        }
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-yellow-500">
                                                <AlertTriangle className="h-3 w-3 inline mr-1" />
                                                가스 추정 불가능
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground">
                                        수신자 주소와 수량을 입력하여 가스
                                        추정을 확인하세요
                                    </div>
                                )}

                                {showGasSettings && (
                                    <div className="pt-2 space-y-3 border-t mt-2">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="customGasSettings"
                                                checked={customGasSettings}
                                                onChange={(e) =>
                                                    setCustomGasSettings(
                                                        e.target.checked
                                                    )
                                                }
                                                className="mr-2"
                                            />
                                            <Label
                                                htmlFor="customGasSettings"
                                                className="text-sm"
                                            >
                                                사용자 지정 가스 설정 사용
                                            </Label>
                                        </div>

                                        {customGasSettings && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Label
                                                        htmlFor="gasLimit"
                                                        className="text-xs"
                                                    >
                                                        가스 한도
                                                    </Label>
                                                    <Input
                                                        id="gasLimit"
                                                        value={gasLimit}
                                                        onChange={(e) =>
                                                            setGasLimit(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="가스 한도"
                                                        className="h-8 text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label
                                                        htmlFor="gasPrice"
                                                        className="text-xs"
                                                    >
                                                        가스 가격 (wei)
                                                    </Label>
                                                    <Input
                                                        id="gasPrice"
                                                        value={gasPrice}
                                                        onChange={(e) =>
                                                            setGasPrice(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="가스 가격"
                                                        className="h-8 text-xs"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                onClick={handleMint}
                                disabled={status?.isPaused || !selectedWalletId}
                                className="w-full"
                            >
                                {isMinting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        민팅 중...
                                    </>
                                ) : (
                                    "NFT 민팅"
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="metadata" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Collection Metadata</CardTitle>
                            <CardDescription>
                                이 컬렉션과 관련된 메타데이터입니다.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <Label className="font-medium">
                                        Base URI
                                    </Label>
                                    <div className="flex items-center gap-2 mt-2 border rounded-md p-2">
                                        <div className="text-sm font-mono truncate flex-1">
                                            {collection.baseURI || "Not set"}
                                        </div>
                                        {collection.baseURI && (
                                            <div className="flex-shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        copyToClipboard(
                                                            collection.baseURI ||
                                                                "",
                                                            "Base URI"
                                                        )
                                                    }
                                                >
                                                    <Copy className="h-4 w-4 mr-1" />
                                                    복사
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        openExternalLink(
                                                            convertToGatewayUrl(
                                                                collection.baseURI ||
                                                                    ""
                                                            )
                                                        )
                                                    }
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-1" />
                                                    열기
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <Label className="font-medium">
                                        Contract URI
                                    </Label>
                                    <div className="flex items-center gap-2 mt-2 border rounded-md p-2">
                                        <div className="text-sm font-mono truncate flex-1">
                                            {collection.contractURI ||
                                                "Not set"}
                                        </div>
                                        {collection.contractURI && (
                                            <div className="flex-shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        copyToClipboard(
                                                            collection.contractURI ||
                                                                "",
                                                            "Contract URI"
                                                        )
                                                    }
                                                >
                                                    <Copy className="h-4 w-4 mr-1" />
                                                    Copy
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        openExternalLink(
                                                            convertToGatewayUrl(
                                                                collection.contractURI ||
                                                                    ""
                                                            )
                                                        )
                                                    }
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-1" />
                                                    Open
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>컬렉션 일시 중지</CardTitle>
                                <CardDescription>
                                    모든 전송 및 민팅을 일시적으로 중지
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    현재 상태:{" "}
                                    <span className="font-semibold">
                                        {status?.isPaused
                                            ? "일시 중지"
                                            : "활성화"}
                                    </span>
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    onClick={handleTogglePause}
                                    disabled={
                                        isPausing ||
                                        isUnpausing ||
                                        !selectedWalletId
                                    }
                                    variant={
                                        status?.isPaused
                                            ? "default"
                                            : "destructive"
                                    }
                                    className="w-full"
                                >
                                    {isPausing || isUnpausing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {status?.isPaused
                                                ? "Unpausing..."
                                                : "Pausing..."}
                                        </>
                                    ) : (
                                        <>
                                            {status?.isPaused ? (
                                                <>
                                                    <Play className="mr-2 h-4 w-4" />
                                                    컬렉션 일시 중지 해제
                                                </>
                                            ) : (
                                                <>
                                                    <Pause className="mr-2 h-4 w-4" />
                                                    컬렉션 일시 중지
                                                </>
                                            )}
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>

                        {settingsCard}
                    </div>
                </TabsContent>
            </Tabs>
            <div className="flex justify-end mt-6">
                <Button type="button" variant="outline" onClick={onClose}>
                    닫기
                </Button>
            </div>

            {showPageImages && (
                <Dialog open={showPageImages} onOpenChange={setShowPageImages}>
                    <DialogTitle>페이지 이미지</DialogTitle>
                    <DialogContent>
                        <OnChainCollectionPageImages collection={collection} />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
