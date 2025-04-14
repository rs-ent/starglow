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
} from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { useFiles } from "@/app/hooks/useFiles";
import { useFactoryCreateCollection } from "@/app/hooks/useFactoryContracts";
import { useEscrowWalletManager } from "@/app/hooks/useBlockchain";
import { OnChainMetadata } from "./OnChain.Metadata";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useBlockchainNetworksManager } from "@/app/hooks/useBlockchain";
import { METADATA_TYPE, isValidHexColor } from "@/app/actions/ipfs";
import { MetadataFormValues } from "./OnChain.Metadata";

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
    const toast = useToast();

    // 상태 관리
    const [privateKey, setPrivateKey] = useState("");
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const [selectedWalletId, setSelectedWalletId] = useState<string>("");
    const [selectedMetadata, setSelectedMetadata] = useState<string | null>(
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

    // 메타데이터 선택 핸들러
    const handleMetadataSelect = (metadataId: string) => {
        setSelectedMetadata(metadataId);
    };

    // Collection 생성 핸들러
    const handleCreateCollection = async () => {
        if (!selectedMetadata) {
            toast.error("Please select or create metadata first");
            return;
        }

        try {
            setCollectionResult(null);

            const result = await createCollectionMutation.mutateAsync({
                factoryAddress: factory.address,
                networkId: factory.networkId,
                name: collectionForm.name,
                symbol: collectionForm.symbol,
                maxSupply: parseInt(collectionForm.maxSupply),
                mintPrice: collectionForm.mintPrice,
                baseURI: selectedMetadata,
                contractURI: selectedMetadata,
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
        <div className="rounded-md bg-muted/40 p-4 space-y-4">
            <h3 className="text-lg font-semibold">Create New NFT Collection</h3>

            {/* Step 1: Select Metadata */}
            <Card>
                <CardHeader>
                    <CardTitle>1. Select Metadata</CardTitle>
                    <CardDescription>
                        Choose the metadata for your NFT collection
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <OnChainMetadata
                        onSelect={handleMetadataSelect}
                        selectedMetadataId={selectedMetadata}
                    />
                </CardContent>
            </Card>

            {/* Step 2: Collection Details */}
            <Card>
                <CardHeader>
                    <CardTitle>2. Collection Details</CardTitle>
                    <CardDescription>
                        Configure your collection settings
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="collection-name">
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
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="collection-symbol">Symbol</Label>
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
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="max-supply">Max Supply</Label>
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
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mint-price">Mint Price (wei)</Label>
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
                            />
                            <p className="text-xs text-muted-foreground">
                                50000000000000000 wei = 0.05 ETH
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Step 3: Deployment Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>3. Deployment Settings</CardTitle>
                    <CardDescription>
                        Configure deployment options
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                                className="font-mono"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Result Display */}
            {collectionResult && (
                <Alert
                    className={
                        collectionResult.success
                            ? "bg-slate-800"
                            : "bg-red-900/20"
                    }
                >
                    {collectionResult.success ? (
                        <Check className="h-4 w-4 text-green-600" />
                    ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertTitle>
                        {collectionResult.success ? "Success" : "Error"}
                    </AlertTitle>
                    <AlertDescription>
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
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    type="button"
                    onClick={handleCreateCollection}
                    disabled={!selectedMetadata || !privateKey}
                >
                    Create Collection
                </Button>
            </div>
        </div>
    );
}
