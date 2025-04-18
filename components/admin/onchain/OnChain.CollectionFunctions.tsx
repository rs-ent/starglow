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
    RefreshCw,
    Upload,
    Eye,
    EyeOff,
    Copy,
    ExternalLink,
    FileJson,
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
import { CollectionContract } from "@/app/queries/collectionContractsQueries";
import {
    useCollectionStatusQuery,
    useEstimateMintGasQuery,
} from "@/app/queries/collectionContractsQueries";
import {
    useToggleMintingMutation,
    useTogglePauseMutation,
    useMintTokensMutation,
} from "@/app/mutations/collectionContractsMutations";
import { useEscrowWalletManager } from "@/app/hooks/useBlockchain";
import { useBlockchainNetworksManager } from "@/app/hooks/useBlockchain";
import Popup from "@/components/atoms/Popup";
import { useMetadata } from "@/app/hooks/useMetadata";
import { METADATA_TYPE } from "@/app/actions/metadata";
import { useCollectionSettings } from "@/app/hooks/useCollectionContracts";

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

    const [mintQuantity, setMintQuantity] = useState("1");
    const [mintAddress, setMintAddress] = useState("");
    const [privateKey, setPrivateKey] = useState("");
    const [lastOperation, setLastOperation] = useState<{
        success: boolean;
        message: string;
        txHash?: string;
    } | null>(null);

    const [selectedWalletId, setSelectedWalletId] = useState<string>("");
    const {
        wallets,
        isLoading: isLoadingWallets,
        getWalletWithPrivateKey,
    } = useEscrowWalletManager();
    const { networks } = useBlockchainNetworksManager();
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const [isViewerOpen, setIsViewerOpen] = useState(false);

    // Fetch current collection status
    const { data: status, isLoading: isLoadingStatus } =
        useCollectionStatusQuery(
            collection.address,
            collection.network?.id || "",
            collection.network?.rpcUrl || ""
        );

    // Update collection with status data
    useEffect(() => {
        if (status && !isLoadingStatus) {
            collection.paused = status.paused;
            collection.mintingEnabled = status.mintingEnabled;
        }
    }, [status, isLoadingStatus, collection]);

    // Set up mutations
    const mintTokensMutation = useMintTokensMutation();
    const togglePauseMutation = useTogglePauseMutation();
    const toggleMintingMutation = useToggleMintingMutation();

    // 선택된 지갑이 변경될 때마다 받는 사람 주소 업데이트
    useEffect(() => {
        if (selectedWalletId && wallets) {
            const selectedWallet = wallets.find(
                (wallet) => wallet.id === selectedWalletId
            );
            if (selectedWallet) {
                setMintAddress(selectedWallet.address);
            }
        }
    }, [selectedWalletId, wallets]);

    // 가스비 관련 상태
    const [customGasSettings, setCustomGasSettings] = useState(false);
    const [gasLimit, setGasLimit] = useState("");
    const [gasPrice, setGasPrice] = useState("");
    const [showGasSettings, setShowGasSettings] = useState(false);

    // 가스비 예상 쿼리
    const { data: gasEstimate, isLoading: isLoadingGasEstimate } =
        useEstimateMintGasQuery(
            collection.address,
            collection.network?.id || "",
            mintAddress,
            parseInt(mintQuantity) || 1,
            privateKey
        );

    // 가스비 예상이 업데이트되면 기본값 설정
    useEffect(() => {
        if (gasEstimate && !customGasSettings && privateKey) {
            setGasLimit(gasEstimate.gasLimit.toString());
            setGasPrice(gasEstimate.gasPrice.toString());
        }
    }, [gasEstimate, customGasSettings, privateKey]);

    // Handle minting new tokens
    const handleMint = async () => {
        if (!mintAddress) {
            toast.error("Recipient address is required");
            return;
        }

        const quantity = parseInt(mintQuantity);
        if (isNaN(quantity) || quantity <= 0) {
            toast.error("Quantity must be a positive number");
            return;
        }

        if (!privateKey) {
            toast.error("Private key is required");
            return;
        }

        try {
            const result = await mintTokensMutation.mutateAsync({
                collectionAddress: collection.address,
                networkId: collection.network?.id || "",
                to: mintAddress,
                quantity,
                privateKey,
                ...(customGasSettings && {
                    gasLimit,
                    gasMaxFee: gasPrice,
                }),
            });

            if (result.success) {
                setLastOperation({
                    success: true,
                    message: `Successfully minted ${quantity} token(s) to ${mintAddress}`,
                    txHash: result.data?.transactionHash,
                });

                if (onCollectionUpdated) {
                    onCollectionUpdated({
                        ...collection,
                    });
                }

                toast.success(`Minted ${quantity} token(s)`);
            } else {
                throw new Error(result.error || "Unknown error");
            }
        } catch (error) {
            console.error("Error minting tokens:", error);
            setLastOperation({
                success: false,
                message: `Failed to mint tokens: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
            });
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Unknown error minting tokens"
            );
        }
    };

    // Handle pausing/unpausing the contract
    const handleTogglePause = async () => {
        const pause = !collection.paused;
        const operation = pause ? "pause" : "unpause";

        if (!privateKey) {
            toast.error("Private key is required");
            return;
        }

        try {
            const result = await togglePauseMutation.mutateAsync({
                collectionAddress: collection.address,
                networkId: collection.network?.id || "",
                pause,
                privateKey,
            });

            if (result.success) {
                setLastOperation({
                    success: true,
                    message: `Successfully ${operation}d the collection`,
                    txHash: result.data?.transactionHash,
                });

                if (onCollectionUpdated) {
                    onCollectionUpdated({
                        ...collection,
                        paused: pause,
                    });
                }

                toast.success(
                    `Collection ${pause ? "paused" : "unpaused"} successfully`
                );
            } else {
                throw new Error(result.error || "Unknown error");
            }
        } catch (error) {
            console.error(`Error ${operation}ing collection:`, error);
            setLastOperation({
                success: false,
                message: `Failed to ${operation} collection: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
            });
            toast.error(
                error instanceof Error
                    ? error.message
                    : `Unknown error ${operation}ing collection`
            );
        }
    };

    // Handle toggling minting status
    const handleToggleMinting = async () => {
        const enabled = !collection.mintingEnabled;
        const operation = enabled ? "enable" : "disable";

        if (!privateKey) {
            toast.error("Private key is required");
            return;
        }

        try {
            const result = await toggleMintingMutation.mutateAsync({
                collectionAddress: collection.address,
                networkId: collection.network?.id || "",
                enabled,
                privateKey,
            });

            if (result.success) {
                setLastOperation({
                    success: true,
                    message: `Successfully ${operation}d minting`,
                    txHash: result.data?.transactionHash,
                });

                if (onCollectionUpdated) {
                    onCollectionUpdated({
                        ...collection,
                        mintingEnabled: enabled,
                    });
                }

                toast.success(
                    `Minting ${enabled ? "enabled" : "disabled"} successfully`
                );
            } else {
                throw new Error(result.error || "Unknown error");
            }
        } catch (error) {
            console.error(`Error ${operation}ing minting:`, error);
            setLastOperation({
                success: false,
                message: `Failed to ${operation} minting: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
            });
            toast.error(
                error instanceof Error
                    ? error.message
                    : `Unknown error ${operation}ing minting`
            );
        }
    };

    // Private key 가져오기
    async function handleWalletSelect(walletId: string) {
        try {
            setSelectedWalletId(walletId);
            const result = await getWalletWithPrivateKey(walletId);
            setPrivateKey(result.privateKey);
        } catch (error) {
            console.error("Error fetching private key:", error);
            toast.error("Failed to get wallet private key");
        }
    }

    function getNetworkNames(networkIds: string[]) {
        if (!networks) return "None";
        return networkIds
            .map((id) => {
                const network = networks.find(
                    (n: { id: string }) => n.id === id
                );
                return network?.name || "Unknown";
            })
            .join(", ");
    }

    // IPFS URL을 게이트웨이 URL로 변환하는 함수
    const convertToGatewayUrl = (ipfsUrl: string): string => {
        if (!ipfsUrl) return "";

        // ipfs:// 형식 처리
        if (ipfsUrl.startsWith("ipfs://")) {
            const cid = ipfsUrl.replace("ipfs://", "");
            return `https://gateway.pinata.cloud/ipfs/${cid}`;
        }

        // 이미 HTTP URL인 경우 그대로 반환
        if (ipfsUrl.startsWith("http")) {
            return ipfsUrl;
        }

        return ipfsUrl;
    };

    // 클립보드에 복사
    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    // 외부 링크 열기
    const openExternalLink = (url: string) => {
        window.open(url, "_blank", "noopener,noreferrer");
    };

    // Collection 설정 관련 상태와 로직
    const {
        settings,
        isLoading: isLoadingSettings,
        updateSettings,
        isUpdating: isUpdatingSettings,
    } = useCollectionSettings(collection.id);

    const [price, setPrice] = useState(collection.price.toString());
    const [circulation, setCirculation] = useState(
        collection.circulation.toString()
    );

    // settings가 로드되면 상태 업데이트
    useEffect(() => {
        if (settings) {
            setPrice(settings.price.toString());
            setCirculation(settings.circulation.toString());
        }
    }, [settings]);

    // 설정 업데이트 핸들러
    const handleUpdateSettings = async () => {
        try {
            await updateSettings(Number(price), Number(circulation));

            if (onCollectionUpdated) {
                onCollectionUpdated({
                    ...collection,
                    price: Number(price),
                    circulation: Number(circulation),
                });
            }
        } catch (error) {
            console.error("Failed to update settings:", error);
        }
    };

    // Settings 탭에 추가할 카드
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
                        disabled={isLoadingSettings}
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
                        disabled={isLoadingSettings}
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    onClick={handleUpdateSettings}
                    disabled={isUpdatingSettings || isLoadingSettings}
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
                    Network: {collection.network?.name || "Unknown"}
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

                            {/* 가스비 예상 및 설정 */}
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
                                        {!privateKey ? (
                                            <div className="text-yellow-500">
                                                <AlertTriangle className="h-3 w-3 inline mr-1" />
                                                Please select a wallet with
                                                admin or escrow permissions
                                            </div>
                                        ) : isLoadingGasEstimate ? (
                                            <div className="flex items-center">
                                                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                                Estimating gas...
                                            </div>
                                        ) : gasEstimate ? (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">
                                                        Estimated Gas Cost:
                                                    </span>
                                                    <span className="font-mono">
                                                        {
                                                            gasEstimate.estimatedGasCostInEth
                                                        }{" "}
                                                        {
                                                            gasEstimate.networkSymbol
                                                        }
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>Gas Limit:</span>
                                                    <span className="font-mono">
                                                        {gasEstimate.gasLimit.toString()}
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
                                disabled={
                                    mintTokensMutation.isPending ||
                                    !collection.mintingEnabled ||
                                    !privateKey
                                }
                                className="w-full"
                            >
                                {mintTokensMutation.isPending ? (
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
                                        {collection.paused
                                            ? "Paused"
                                            : "Active"}
                                    </span>
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    onClick={handleTogglePause}
                                    disabled={
                                        togglePauseMutation.isPending ||
                                        !privateKey
                                    }
                                    variant={
                                        collection.paused
                                            ? "default"
                                            : "destructive"
                                    }
                                    className="w-full"
                                >
                                    {togglePauseMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {collection.paused
                                                ? "Unpausing..."
                                                : "Pausing..."}
                                        </>
                                    ) : (
                                        <>
                                            {collection.paused ? (
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

                        <Card>
                            <CardHeader>
                                <CardTitle>Minting Status</CardTitle>
                                <CardDescription>
                                    Enable or disable minting functionality
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Current status:{" "}
                                    <span className="font-semibold">
                                        {collection.mintingEnabled
                                            ? "Enabled"
                                            : "Disabled"}
                                    </span>
                                </p>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    onClick={handleToggleMinting}
                                    disabled={
                                        toggleMintingMutation.isPending ||
                                        !privateKey
                                    }
                                    variant={
                                        collection.mintingEnabled
                                            ? "destructive"
                                            : "default"
                                    }
                                    className="w-full"
                                >
                                    {toggleMintingMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {collection.mintingEnabled
                                                ? "Disabling..."
                                                : "Enabling..."}
                                        </>
                                    ) : (
                                        <>
                                            {collection.mintingEnabled
                                                ? "Disable Minting"
                                                : "Enable Minting"}
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
