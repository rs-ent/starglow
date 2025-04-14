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
import { useCollectionStatusQuery } from "@/app/queries/collectionContractsQueries";
import {
    useToggleMintingMutation,
    useTogglePauseMutation,
    useMintTokensMutation,
} from "@/app/mutations/collectionContractsMutations";
import { useEscrowWalletManager } from "@/app/hooks/useBlockchain";
import { useBlockchainNetworksManager } from "@/app/hooks/useBlockchain";
import { useFiles } from "@/app/hooks/useFiles";
import { IPFSUploadResult } from "@/app/actions/files";
import Popup from "@/components/atoms/Popup";
import { useIPFSMetadata } from "@/app/queries/filesQueries";

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
    const [viewMetadata, setViewMetadata] = useState<IPFSUploadResult | null>(
        null
    );
    const [isViewerOpen, setIsViewerOpen] = useState(false);

    // IPFS 메타데이터 조회를 위해 직접 hook 사용
    const {
        data: selectedMetadataContent,
        isLoading: isLoadingSelectedMetadata,
        error: selectedMetadataError,
    } = useIPFSMetadata(isViewerOpen ? viewMetadata?.cid || "" : "");

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

    // 메타데이터 뷰어 열기
    const openMetadataViewer = async (contractURI: string) => {
        if (!contractURI) return;

        // baseURI에서 CID 추출
        const cid = contractURI.replace("ipfs://", "");

        setViewMetadata({
            success: true,
            cid,
            ipfsUrl: contractURI,
            gatewayUrl: convertToGatewayUrl(contractURI),
        });
        setIsViewerOpen(true);
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
                            <div className="flex gap-4 items-center">
                                <CardTitle>Collection Metadata</CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        collection.contractURI &&
                                        openMetadataViewer(
                                            collection.contractURI
                                        )
                                    }
                                    className="flex items-center gap-1"
                                    disabled={!collection.contractURI}
                                >
                                    <Eye className="h-4 w-4" />
                                    <span className="hidden sm:inline">
                                        View
                                    </span>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Base URI</Label>
                                <div className="flex items-center justify-between p-2 rounded-md bg-muted">
                                    <div className="font-mono text-sm break-all">
                                        {collection.baseURI || "Not set"}
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                collection.baseURI &&
                                                copyToClipboard(
                                                    collection.baseURI,
                                                    "Base URI"
                                                )
                                            }
                                            className="flex items-center gap-1"
                                        >
                                            <Copy className="h-4 w-4" />
                                            <span className="hidden sm:inline">
                                                Copy
                                            </span>
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Base path for all token metadata. Each
                                    token&apos;s metadata is accessed at{" "}
                                    {collection.baseURI || "[baseURI]"}
                                    /[tokenId]
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Contract URI</Label>
                                <div className="flex items-center justify-between p-2 rounded-md bg-muted">
                                    <div className="font-mono text-sm break-all">
                                        {collection.contractURI || "Not set"}
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                collection.contractURI &&
                                                copyToClipboard(
                                                    collection.contractURI,
                                                    "Contract URI"
                                                )
                                            }
                                            className="flex items-center gap-1"
                                        >
                                            <Copy className="h-4 w-4" />
                                            <span className="hidden sm:inline">
                                                Copy
                                            </span>
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Collection-level metadata used by
                                    marketplaces like OpenSea
                                </p>
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
                    </div>
                </TabsContent>
            </Tabs>

            {/* 메타데이터 뷰어 팝업 */}
            <Popup
                open={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
                width="min(90vw, 800px)"
                height="90vh"
                className="p-6 bg-gray-800"
            >
                <div className="h-full overflow-auto">
                    <h3 className="text-xl font-semibold mb-4">
                        Metadata Details
                    </h3>
                    <div className="flex gap-2 flex-wrap mb-4">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                                viewMetadata?.cid &&
                                copyToClipboard(viewMetadata.cid, "CID")
                            }
                            className="flex items-center gap-1"
                        >
                            <Copy className="h-4 w-4" />
                            Copy CID
                        </Button>

                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                                viewMetadata?.ipfsUrl &&
                                copyToClipboard(
                                    viewMetadata.ipfsUrl,
                                    "IPFS URL"
                                )
                            }
                            className="flex items-center gap-1"
                        >
                            <FileJson className="h-4 w-4" />
                            Copy IPFS URI
                        </Button>

                        {viewMetadata?.gatewayUrl && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                    openExternalLink(
                                        viewMetadata.gatewayUrl || ""
                                    )
                                }
                                className="flex items-center gap-1"
                            >
                                <ExternalLink className="h-4 w-4" />
                                View in Gateway
                            </Button>
                        )}
                    </div>

                    <div className="bg-muted p-3 rounded-md mb-4 font-mono text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <span className="font-semibold min-w-[80px]">
                                CID:
                            </span>
                            <code className="bg-black/10 dark:bg-white/10 p-1 rounded flex-1 overflow-auto">
                                {viewMetadata?.cid}
                            </code>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="font-semibold min-w-[80px]">
                                IPFS URI:
                            </span>
                            <code className="bg-black/10 dark:bg-white/10 p-1 rounded flex-1 overflow-auto">
                                {viewMetadata?.ipfsUrl}
                            </code>
                        </div>
                    </div>

                    <div className="h-[calc(100%-200px)] overflow-auto">
                        {isLoadingSelectedMetadata ? (
                            <div className="py-8 text-center">
                                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                                <p>Loading metadata...</p>
                            </div>
                        ) : selectedMetadataError ? (
                            <div className="py-8 text-center text-red-500">
                                <p>Error loading metadata.</p>
                                <p className="text-sm">
                                    {String(selectedMetadataError)}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="rounded-md overflow-hidden border">
                                    <div className="bg-muted p-2 border-b font-medium">
                                        JSON Metadata
                                    </div>
                                    <pre className="bg-slate-900 p-4 overflow-auto text-sm max-h-[300px] whitespace-pre-wrap">
                                        {JSON.stringify(
                                            selectedMetadataContent?.metadata,
                                            null,
                                            2
                                        )}
                                    </pre>
                                </div>

                                {selectedMetadataContent?.metadata?.image && (
                                    <div className="rounded-md overflow-hidden border">
                                        <div className="bg-muted p-2 border-b font-medium">
                                            Image Preview
                                        </div>
                                        <div className="p-4 flex justify-center bg-black">
                                            <img
                                                src={convertToGatewayUrl(
                                                    selectedMetadataContent
                                                        .metadata.image
                                                )}
                                                alt="NFT Preview"
                                                className="max-w-full max-h-60 object-contain rounded-md"
                                                onError={(e) => {
                                                    console.error(
                                                        "Image loading error:",
                                                        selectedMetadataContent
                                                            .metadata.image
                                                    );
                                                    (
                                                        e.target as HTMLImageElement
                                                    ).src =
                                                        "https://placehold.co/400x400/png?text=Image+Not+Available";
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </Popup>

            <div className="flex justify-end mt-6">
                <Button type="button" variant="outline" onClick={onClose}>
                    Close
                </Button>
            </div>
        </div>
    );
}
