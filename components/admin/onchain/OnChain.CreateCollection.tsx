/// components\admin\onchain\OnChain.CreateCollection.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Loader2,
    Check,
    AlertTriangle,
    ExternalLink,
    Eye,
    EyeOff,
    Code,
    FileText,
    Settings,
    Cog,
} from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { useFactoryCreateCollection } from "@/app/hooks/useFactoryContracts";
import { useEscrowWalletManager } from "@/app/hooks/useBlockchain";
import { OnChainMetadata } from "./OnChain.Metadata";
import { Switch } from "@/components/ui/switch";
import { useBlockchainNetworksManager } from "@/app/hooks/useBlockchain";
import { METADATA_TYPE } from "@/app/actions/metadata";
import { Metadata } from "@prisma/client";
import { useMetadata } from "@/app/hooks/useMetadata";
import { cn } from "@/lib/utils/tailwind";

/**
 * 컬렉션 생성 결과 인터페이스
 */
interface CollectionCreationResult {
    success: boolean;
    message?: string;
    collectionAddress?: string;
    transactionHash?: string;
    name?: string;
    symbol?: string;
    error?: string;
}

interface CreateCollectionProps {
    factory: {
        address: string;
        networkId: string;
        id: string;
    };
    onClose: () => void;
    onSuccess?: (result: CollectionCreationResult) => void;
}

export default function CreateCollection({
    factory,
    onClose,
    onSuccess,
}: CreateCollectionProps) {
    const { linkableMetadata, linkMetadata } = useMetadata({
        metadataId: "",
    });

    const toast = useToast();

    // 상태 관리
    const [privateKey, setPrivateKey] = useState("");
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const [selectedWalletId, setSelectedWalletId] = useState<string>("");
    const [selectedMetadata, setSelectedMetadata] = useState<Metadata | null>(
        null
    );

    const [collectionResult, setCollectionResult] =
        useState<CollectionCreationResult | null>(null);

    // 가스비 설정 상태
    const [useDefaultGas, setUseDefaultGas] = useState(true);
    const [gasForm, setGasForm] = useState({
        gasMaxFee: "20",
        gasMaxPriorityFee: "1.5",
        gasLimit: "500000",
    });

    // Collection 폼 상태
    const [collectionForm, setCollectionForm] = useState({
        name: "",
        symbol: "",
        maxSupply: "10000",
        mintPrice: "0",
    });

    // Hooks
    const {
        wallets,
        isLoading: isLoadingWallets,
        getWalletWithPrivateKey,
    } = useEscrowWalletManager();
    const { networks } = useBlockchainNetworksManager();
    const createCollectionMutation = useFactoryCreateCollection();

    // 메타데이터가 로드되면 컬렉션 폼을 업데이트
    useEffect(() => {
        if (
            selectedMetadata &&
            linkableMetadata &&
            linkableMetadata.length > 0
        ) {
            const metadataContent = selectedMetadata?.metadata as METADATA_TYPE; // Set the collection name based on metadata name
            setCollectionForm((prev) => ({
                ...prev,
                name: metadataContent.name,
            }));

            // Generate symbol from the name (use first letters or abbreviated version)
            const words = metadataContent.name.split(" ");
            let symbol = "";

            if (words.length <= 3) {
                // If 3 or fewer words, use first letter of each word
                symbol = words
                    .map((word) => word.charAt(0).toUpperCase())
                    .join("");
            } else {
                // If more than 3 words, use first 3 words' first letters
                symbol = words
                    .slice(0, 3)
                    .map((word) => word.charAt(0).toUpperCase())
                    .join("");
            }

            // Make sure the symbol is at least 2 characters
            if (symbol.length < 2 && metadataContent.name.length >= 2) {
                symbol = metadataContent.name.slice(0, 2).toUpperCase();
            }

            // Remove special characters, keep only alphanumeric characters
            symbol = symbol.replace(/[^A-Z0-9]/g, "");

            // If after removing special characters the symbol is empty or too short,
            // generate a simple default symbol
            if (symbol.length < 2) {
                symbol = "NFT";
            }

            // Update the symbol
            setCollectionForm((prev) => ({
                ...prev,
                symbol: symbol,
            }));
        }
    }, [selectedMetadata, linkableMetadata]);

    // Collection 생성 핸들러
    const handleCreateCollection = async () => {
        if (!selectedMetadata) {
            toast.error("Please select or create metadata first");
            return;
        }

        try {
            setCollectionResult(null);

            const result = await createCollectionMutation.mutateAsync({
                collectionKey: selectedMetadata.collectionKey,
                factoryAddress: factory.address,
                networkId: factory.networkId,
                name: collectionForm.name,
                symbol: collectionForm.symbol,
                maxSupply: parseInt(collectionForm.maxSupply),
                mintPrice: collectionForm.mintPrice,
                baseURI: selectedMetadata.url,
                contractURI: selectedMetadata.url,
                privateKey,
                useDefaultGas,
                gasMaxFee: !useDefaultGas ? gasForm.gasMaxFee : undefined,
                gasMaxPriorityFee: !useDefaultGas
                    ? gasForm.gasMaxPriorityFee
                    : undefined,
                gasLimit: !useDefaultGas ? gasForm.gasLimit : undefined,
            });

            const creationResult = {
                success: true,
                message: "Collection created successfully",
                collectionAddress: result.collectionAddress,
                transactionHash: result.transactionHash,
                name: collectionForm.name,
                symbol: collectionForm.symbol,
            };

            // 메타데이터 링크 시도
            try {
                if (!result.collectionAddress) {
                    throw new Error("No collection address received");
                }

                const linkedMetadata = await linkMetadata({
                    metadataId: selectedMetadata.id,
                    collectionAddress: result.collectionAddress,
                });

                toast.success(
                    `Successfully linked metadata to collection: ${linkedMetadata}`
                );
            } catch (linkError) {
                console.error("Metadata linking error:", linkError);
                toast.error("Collection created but metadata linking failed");
                creationResult.message += " (but metadata linking failed)";
            }

            setCollectionResult(creationResult);
            toast.success(
                `Successfully created collection "${collectionForm.name}" (${collectionForm.symbol})`
            );

            if (onSuccess) {
                onSuccess(creationResult);
            }
        } catch (error) {
            console.error("Collection creation error:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred";

            setCollectionResult({
                success: false,
                message: "Collection creation failed",
                error: errorMessage,
            });

            toast.error(`Failed to create collection: ${errorMessage}`);
        }
    };

    // Wallet 선택 핸들러
    const handleWalletSelect = async (walletId: string) => {
        try {
            setSelectedWalletId(walletId);
            const result = await getWalletWithPrivateKey(walletId);
            setPrivateKey(result.privateKey);
        } catch (error) {
            console.error("Error fetching private key:", error);
            toast.error("Failed to get wallet private key");
        }
    };

    return (
        <div className="rounded-xl bg-gradient-to-b from-background/80 to-muted/5 p-6 space-y-6 shadow-lg border border-muted/20">
            <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Code className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold tracking-tight">
                        Create New NFT Collection
                    </h3>
                    <p className="text-muted-foreground">
                        Configure and deploy your NFT collection
                    </p>
                </div>
            </div>

            {/* Step 1: Select Metadata */}
            <Card className="bg-card/50 border-muted/10 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="border-b border-muted/10 bg-muted/5">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <CardTitle>1. Select Metadata</CardTitle>
                            <CardDescription>
                                Choose the metadata for your NFT collection
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <OnChainMetadata
                        onSelect={(metadata) => setSelectedMetadata(metadata)}
                        selectedMetadata={selectedMetadata}
                    />
                </CardContent>
            </Card>

            {/* Metadata Verification Step */}
            <Card className="bg-card/50 border-muted/10 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="border-b border-muted/10 bg-muted/5">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Eye className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <CardTitle>2. Verify Metadata</CardTitle>
                            <CardDescription>
                                Review the metadata that will be linked to your
                                collection
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    {selectedMetadata ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm text-primary">
                                        Metadata URL
                                    </h4>
                                    <div className="p-3 bg-muted/10 rounded-lg">
                                        <pre className="font-mono text-xs break-all overflow-x-auto">
                                            {selectedMetadata.url}
                                        </pre>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm text-primary">
                                        Preview
                                    </h4>
                                    <a
                                        href={selectedMetadata.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                                    >
                                        View metadata{" "}
                                        <ExternalLink className="h-4 w-4 ml-2" />
                                    </a>
                                </div>
                            </div>

                            {selectedMetadata.metadata && (
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm text-primary">
                                        Metadata Contents
                                    </h4>
                                    <div className="p-4 bg-muted/10 rounded-lg max-h-48 overflow-y-auto">
                                        <pre className="text-xs">
                                            {JSON.stringify(
                                                selectedMetadata.metadata,
                                                null,
                                                2
                                            )}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Alert
                            variant="destructive"
                            className="bg-destructive/5 border-destructive/20"
                        >
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            <AlertTitle className="font-semibold">
                                Metadata Not Selected
                            </AlertTitle>
                            <AlertDescription>
                                Please select a metadata in Step 1 before
                                proceeding.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Step 3: Collection Details */}
            <Card className="bg-card/50 border-muted/10 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="border-b border-muted/10 bg-muted/5">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Settings className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <CardTitle>3. Collection Details</CardTitle>
                            <CardDescription>
                                Configure your collection settings
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label
                                htmlFor="collection-name"
                                className="text-sm font-medium"
                            >
                                Collection Name
                            </Label>
                            <Input
                                id="collection-name"
                                value={collectionForm.name}
                                onChange={(e) =>
                                    setCollectionForm((prev) => ({
                                        ...prev,
                                        name: e.target.value,
                                    }))
                                }
                                placeholder="My Awesome NFT"
                                className="bg-background/50"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label
                                htmlFor="collection-symbol"
                                className="text-sm font-medium"
                            >
                                Symbol
                            </Label>
                            <Input
                                id="collection-symbol"
                                value={collectionForm.symbol}
                                onChange={(e) =>
                                    setCollectionForm((prev) => ({
                                        ...prev,
                                        symbol: e.target.value,
                                    }))
                                }
                                placeholder="NFT"
                                className="bg-background/50"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label
                                htmlFor="max-supply"
                                className="text-sm font-medium"
                            >
                                Max Supply
                            </Label>
                            <Input
                                id="max-supply"
                                type="number"
                                value={collectionForm.maxSupply}
                                onChange={(e) =>
                                    setCollectionForm((prev) => ({
                                        ...prev,
                                        maxSupply: e.target.value,
                                    }))
                                }
                                placeholder="10000"
                                className="bg-background/50"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label
                                htmlFor="mint-price"
                                className="text-sm font-medium"
                            >
                                Mint Price (wei)
                            </Label>
                            <Input
                                id="mint-price"
                                value={collectionForm.mintPrice}
                                onChange={(e) =>
                                    setCollectionForm((prev) => ({
                                        ...prev,
                                        mintPrice: e.target.value,
                                    }))
                                }
                                placeholder="50000000000000000"
                                className="bg-background/50"
                            />
                            <p className="text-xs text-muted-foreground">
                                50000000000000000 wei = 0.05 ETH
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Step 4: Deployment Settings */}
            <Card className="bg-card/50 border-muted/10 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="border-b border-muted/10 bg-muted/5">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Cog className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <CardTitle>4. Deployment Settings</CardTitle>
                            <CardDescription>
                                Configure deployment options
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    {/* Gas Settings */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="use-default-gas"
                                checked={useDefaultGas}
                                onCheckedChange={setUseDefaultGas}
                            />
                            <Label htmlFor="use-default-gas">
                                Use default gas settings
                            </Label>
                        </div>

                        {!useDefaultGas && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="gas-max-fee">
                                        Max Fee (Gwei)
                                    </Label>
                                    <Input
                                        id="gas-max-fee"
                                        value={gasForm.gasMaxFee}
                                        onChange={(e) =>
                                            setGasForm((prev) => ({
                                                ...prev,
                                                gasMaxFee: e.target.value,
                                            }))
                                        }
                                        placeholder="20"
                                        className="bg-background/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gas-max-priority-fee">
                                        Max Priority Fee (Gwei)
                                    </Label>
                                    <Input
                                        id="gas-max-priority-fee"
                                        value={gasForm.gasMaxPriorityFee}
                                        onChange={(e) =>
                                            setGasForm((prev) => ({
                                                ...prev,
                                                gasMaxPriorityFee:
                                                    e.target.value,
                                            }))
                                        }
                                        placeholder="1.5"
                                        className="bg-background/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gas-limit">Gas Limit</Label>
                                    <Input
                                        id="gas-limit"
                                        value={gasForm.gasLimit}
                                        onChange={(e) =>
                                            setGasForm((prev) => ({
                                                ...prev,
                                                gasLimit: e.target.value,
                                            }))
                                        }
                                        placeholder="500000"
                                        className="bg-background/50"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Wallet Selection */}
                    <div className="space-y-4">
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
                                        {wallet.networkIds
                                            .map((id) => {
                                                const network = networks?.find(
                                                    (n) => n.id === id
                                                );
                                                return network?.name || id;
                                            })
                                            .join(", ")}
                                        )
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="privateKey">Private Key</Label>
                            <Input
                                id="privateKey"
                                type={showPrivateKey ? "text" : "password"}
                                value={privateKey}
                                disabled
                                className="font-mono bg-background/50"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Result Display */}
            {collectionResult && (
                <Alert
                    className={cn(
                        "border rounded-lg p-4",
                        collectionResult.success
                            ? "bg-green-500/5 border-green-500/20"
                            : "bg-destructive/5 border-destructive/20"
                    )}
                >
                    {collectionResult.success ? (
                        <Check className="h-5 w-5 text-green-500" />
                    ) : (
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                    )}
                    <AlertTitle className="font-semibold">
                        {collectionResult.success ? "Success" : "Error"}
                    </AlertTitle>
                    <AlertDescription className="mt-2">
                        {collectionResult.message}
                        {collectionResult.collectionAddress && (
                            <div className="mt-2">
                                <div>
                                    <span className="font-medium">
                                        Address:{" "}
                                    </span>
                                    <span className="font-mono text-sm">
                                        {collectionResult.collectionAddress}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium">
                                        Transaction:{" "}
                                    </span>
                                    <span className="font-mono text-sm">
                                        {collectionResult.transactionHash}
                                    </span>
                                </div>
                            </div>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-muted/10">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="hover:bg-muted/50 transition-colors"
                >
                    Cancel
                </Button>
                <Button
                    type="button"
                    onClick={handleCreateCollection}
                    disabled={!selectedMetadata || !privateKey}
                    className="bg-primary hover:bg-primary/90 transition-colors"
                >
                    {createCollectionMutation.isCreating ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        "Create Collection"
                    )}
                </Button>
            </div>
        </div>
    );
}
