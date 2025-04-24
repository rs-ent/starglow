/// components\admin\onchain\OnChain.CollectionFunctions.tsx
/// Collection Contract Functions Component

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/app/hooks/useToast";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    useEscrowWalletManager,
    useBlockchainNetworksManager,
    useEstimateMintGas,
} from "@/app/hooks/useBlockchain";
import {
    useCollectionGet,
    useCollectionSet,
} from "@/app/hooks/useCollectionContracts";
import { Switch } from "@/components/ui/switch";
import { CollectionContract } from "@prisma/client";
import { useUpdateCollectionSettingsMutation } from "@/app/mutations/collectionContractsMutations";

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
                <div className="space-y-2">
                    <Label htmlFor="listed">Listed</Label>
                    <Switch
                        id="listed"
                        checked={isListed}
                        onCheckedChange={setIsListed}
                    />
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
            <h3 className="text-lg font-semibold">
                Collection Contract Functions
            </h3>
            <div className="text-sm text-muted-foreground mb-4">
                Manage and interact with this NFT collection.
                <div className="mt-2 font-mono text-xs">
                    Collection Address: {collection.address}
                </div>
                <div className="font-mono text-xs">
                    Network:{" "}
                    {networks?.find((n) => n.id === collection.networkId)
                        ?.name || "Unknown"}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Wallet</CardTitle>
                    <CardDescription>
                        Select a wallet to interact with the contract
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid w-full items-center gap-4">
                        <div className="space-y-2">
                            <Label>Select Wallet</Label>
                            <select
                                className="w-full p-2 rounded-md border bg-card"
                                value={selectedWalletId}
                                onChange={(e) =>
                                    handleWalletSelect(e.target.value)
                                }
                            >
                                <option value="">Select a wallet</option>
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
                                type={showPrivateKey ? "text" : "password"}
                                placeholder="Private key will be loaded automatically"
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
                    <TabsTrigger value="mint">Mint</TabsTrigger>
                    <TabsTrigger value="metadata">Metadata</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="mint" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mint Tokens</CardTitle>
                            <CardDescription>
                                Mint new NFTs to a specified address
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid w-full items-center gap-2">
                                <Label htmlFor="recipient">
                                    Recipient Address
                                </Label>
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
                                <Label htmlFor="quantity">Quantity</Label>
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
                                        Gas Estimation
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
                                                Please select a wallet with
                                                admin or escrow permissions
                                            </div>
                                        ) : isGasEstimateLoading ? (
                                            <div className="flex items-center">
                                                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                                Estimating gas...
                                            </div>
                                        ) : gasEstimateData ? (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">
                                                        Estimated Gas Cost:
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
                                                    <span>Gas Limit:</span>
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
                                                Unable to estimate gas
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground">
                                        Enter recipient address and quantity to
                                        see gas estimation
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
                                                Use custom gas settings
                                            </Label>
                                        </div>

                                        {customGasSettings && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Label
                                                        htmlFor="gasLimit"
                                                        className="text-xs"
                                                    >
                                                        Gas Limit
                                                    </Label>
                                                    <Input
                                                        id="gasLimit"
                                                        value={gasLimit}
                                                        onChange={(e) =>
                                                            setGasLimit(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Gas Limit"
                                                        className="h-8 text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label
                                                        htmlFor="gasPrice"
                                                        className="text-xs"
                                                    >
                                                        Gas Price (wei)
                                                    </Label>
                                                    <Input
                                                        id="gasPrice"
                                                        value={gasPrice}
                                                        onChange={(e) =>
                                                            setGasPrice(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Gas Price"
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
                                        Minting...
                                    </>
                                ) : (
                                    "Mint NFTs"
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
                                View the metadata associated with this
                                collection
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
                                                    Copy
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
                                                    Open
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
                                <CardTitle>Pause Contract</CardTitle>
                                <CardDescription>
                                    Temporarily pause all transfers and minting
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Current status:{" "}
                                    <span className="font-semibold">
                                        {status?.isPaused ? "Paused" : "Active"}
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
                                                    Unpause Contract
                                                </>
                                            ) : (
                                                <>
                                                    <Pause className="mr-2 h-4 w-4" />
                                                    Pause Contract
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
                    Close
                </Button>
            </div>
        </div>
    );
}
