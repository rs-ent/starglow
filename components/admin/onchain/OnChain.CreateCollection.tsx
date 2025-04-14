/// components\admin\onchain\OnChain.CreateCollection.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IPFSUploadResult } from "@/app/actions/files";
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
import OnChainMetadata from "./OnChain.Metadata";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useBlockchainNetworksManager } from "@/app/hooks/useBlockchain";

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
    const [privateKey, setPrivateKey] = useState("");
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const [collectionResult, setCollectionResult] =
        useState<CollectionCreationResult | null>(null);
    const [selectedWalletId, setSelectedWalletId] = useState<string>("");

    // useFactoryCreateCollection 훅 사용
    const {
        createCollection,
        isCreating: creatingCollection,
        error: createError,
        data: createData,
        reset: resetCreateCollection,
    } = useFactoryCreateCollection();

    // Metadata related states
    const [activeTab, setActiveTab] = useState("basic");
    const [metadataResult, setMetadataResult] =
        useState<IPFSUploadResult | null>(null);

    // 업로드된 메타데이터 목록 (DB에서 가져옴)
    const [uploadedMetadata, setUploadedMetadata] = useState<
        IPFSUploadResult[]
    >([]);

    // URI 관련 상태
    const [selectedBaseURI, setSelectedBaseURI] = useState<string>("");
    const [selectedContractURI, setSelectedContractURI] = useState<string>("");

    // 가스비 설정 상태
    const [useDefaultGas, setUseDefaultGas] = useState(true);
    const [gasForm, setGasForm] = useState({
        gasMaxFee: "20",
        gasMaxPriorityFee: "1.5",
        gasLimit: "500000",
    });

    const [collectionForm, setCollectionForm] = useState({
        name: "",
        symbol: "",
        maxSupply: "10000",
        mintPrice: "0",
    });

    const toast = useToast();
    const { getAllIPFSMetadata } = useFiles();

    // useEscrowWalletManager 훅 사용
    const {
        wallets,
        isLoading: isLoadingWallets,
        getWalletWithPrivateKey,
    } = useEscrowWalletManager();
    const { networks } = useBlockchainNetworksManager();

    // 컴포넌트 로드 시 DB에서 메타데이터 목록 가져오기
    const { metadata: ipfsMetadata, isLoading: isLoadingMetadata } =
        getAllIPFSMetadata("nft-metadata", 100);

    // 메타데이터 로딩 완료시 상태 업데이트
    useEffect(() => {
        if (ipfsMetadata && ipfsMetadata.length > 0) {
            setUploadedMetadata(ipfsMetadata);
        }
    }, [ipfsMetadata]);

    // 메타데이터가 선택되면 기본 URI 값 설정
    useEffect(() => {
        if (metadataResult) {
            setSelectedBaseURI(`ipfs://${metadataResult.cid}/`);
            setSelectedContractURI(
                metadataResult.ipfsUrl || `ipfs://${metadataResult.cid}`
            );
        }
    }, [metadataResult]);

    // 메타데이터 선택 상태 확인 (업로드 또는 선택)
    const hasSelectedMetadata =
        metadataResult !== null ||
        (selectedBaseURI !== "" && selectedContractURI !== "");

    function handleCollectionFormChange(
        field: keyof typeof collectionForm,
        value: string
    ) {
        setCollectionForm((prev) => ({ ...prev, [field]: value }));
    }

    function handleGasFormChange(field: keyof typeof gasForm, value: string) {
        setGasForm((prev) => ({ ...prev, [field]: value }));
    }

    // Handle metadata uploaded from OnChainMetadata component
    const handleMetadataUploaded = (result: IPFSUploadResult) => {
        setMetadataResult(result);

        // 새로 업로드된 메타데이터로 localStorage 및 상태 업데이트
        setUploadedMetadata((prev) => [result, ...prev]);

        setActiveTab("basic"); // Switch to basic tab
        toast.success("Metadata uploaded successfully");
    };

    // escrow wallet 선택 핸들러
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

    async function handleCreateCollection() {
        try {
            setCollectionResult(null);

            // Private key is required
            if (!privateKey) {
                throw new Error(
                    "Private key is required to create a collection."
                );
            }

            // URI 선택이 되어있는지 확인
            if (!selectedBaseURI || !selectedContractURI) {
                throw new Error(
                    "Please select Base URI and Contract URI for your collection."
                );
            }

            // Factory 컨트랙트 주소가 유효한지 확인
            if (!factory || !factory.address) {
                throw new Error(
                    "Invalid Factory contract address. Please check the factory configuration."
                );
            }

            // 컬렉션 생성 요청 - mutation 사용
            await createCollection({
                factoryAddress: factory.address,
                networkId: factory.networkId,
                name: collectionForm.name,
                symbol: collectionForm.symbol,
                maxSupply: parseInt(collectionForm.maxSupply),
                mintPrice: collectionForm.mintPrice,
                baseURI: selectedBaseURI,
                contractURI: selectedContractURI,
                privateKey,
                // 가스 옵션 추가
                useDefaultGas,
                gasMaxFee: !useDefaultGas ? gasForm.gasMaxFee : undefined,
                gasMaxPriorityFee: !useDefaultGas
                    ? gasForm.gasMaxPriorityFee
                    : undefined,
                gasLimit: !useDefaultGas ? gasForm.gasLimit : undefined,
            });

            // mutation 결과 처리
            if (createData) {
                const result = {
                    success: true,
                    message: "Collection created successfully",
                    collectionAddress: createData.collectionAddress,
                    transactionHash: createData.transactionHash,
                    name: createData.name,
                    symbol: createData.symbol,
                };

                setCollectionResult(result);
                toast.success(
                    `Successfully created collection "${createData.name}" (${createData.symbol})`
                );

                if (onSuccess) {
                    onSuccess(result);
                }
            }
        } catch (error) {
            console.error("Collection creation error:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred.";

            setCollectionResult({
                success: false,
                message: "Collection creation failed",
                error: errorMessage,
            });

            toast.error(`Failed to create collection: ${errorMessage}`);
        }
    }

    // 에러 발생 시 처리
    useEffect(() => {
        if (createError) {
            setCollectionResult({
                success: false,
                message: "Collection creation failed",
                error:
                    createError instanceof Error
                        ? createError.message
                        : "Unknown error occurred",
            });

            toast.error(
                `Failed to create collection: ${
                    createError instanceof Error
                        ? createError.message
                        : "Unknown error occurred"
                }`
            );
        }
    }, [createError, toast]);

    return (
        <div className="rounded-md bg-muted/40 p-4 space-y-4">
            <h3 className="text-lg font-semibold">Create New NFT Collection</h3>
            <div className="text-sm text-muted-foreground mb-4">
                Create a new NFT collection using this Factory contract.
                <div className="mt-2 font-mono text-xs">
                    Factory Address: {factory.address}
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="metadata">NFT Metadata</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Collection Details</CardTitle>
                            <CardDescription>
                                Basic information for your NFT collection
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
                                            handleCollectionFormChange(
                                                "name",
                                                e.target.value
                                            )
                                        }
                                        placeholder="My Awesome NFT"
                                        disabled={creatingCollection}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="collection-symbol">
                                        Symbol
                                    </Label>
                                    <Input
                                        id="collection-symbol"
                                        value={collectionForm.symbol}
                                        onChange={(e) =>
                                            handleCollectionFormChange(
                                                "symbol",
                                                e.target.value
                                            )
                                        }
                                        placeholder="NFT"
                                        disabled={creatingCollection}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="max-supply">
                                        Max Supply
                                    </Label>
                                    <Input
                                        id="max-supply"
                                        type="number"
                                        value={collectionForm.maxSupply}
                                        onChange={(e) =>
                                            handleCollectionFormChange(
                                                "maxSupply",
                                                e.target.value
                                            )
                                        }
                                        placeholder="10000"
                                        disabled={creatingCollection}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mint-price">
                                        Mint Price (wei)
                                    </Label>
                                    <Input
                                        id="mint-price"
                                        value={collectionForm.mintPrice}
                                        onChange={(e) =>
                                            handleCollectionFormChange(
                                                "mintPrice",
                                                e.target.value
                                            )
                                        }
                                        placeholder="50000000000000000"
                                        disabled={creatingCollection}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        50000000000000000 wei = 0.05 ETH
                                    </p>
                                </div>
                            </div>

                            {metadataResult && (
                                <div className="bg-green-50/5 p-4 rounded-md mt-4">
                                    <div className="flex items-center">
                                        <Check className="h-5 w-5 text-green-600 mr-2" />
                                        <h4 className="font-medium">
                                            Metadata uploaded successfully
                                        </h4>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Your metadata has been uploaded to IPFS
                                        and will be used for this collection.
                                    </p>
                                </div>
                            )}

                            {uploadedMetadata.length > 0 ? (
                                <div className="w-full space-y-4">
                                    <div className="space-y-2">
                                        <Label>Collection Metadata</Label>
                                        <Select
                                            value={
                                                selectedBaseURI
                                                    ? selectedBaseURI.replace(
                                                          "/",
                                                          ""
                                                      )
                                                    : ""
                                            }
                                            onValueChange={(value) => {
                                                const cid = value.replace(
                                                    "ipfs://",
                                                    ""
                                                );
                                                setSelectedBaseURI(
                                                    `ipfs://${cid}/`
                                                );
                                                setSelectedContractURI(
                                                    `ipfs://${cid}`
                                                );
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select Metadata" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {uploadedMetadata.map(
                                                    (meta) => (
                                                        <SelectItem
                                                            key={meta.cid || ""}
                                                            value={`ipfs://${
                                                                meta.cid || ""
                                                            }`}
                                                        >
                                                            {`Metadata: ${
                                                                meta.cid
                                                                    ? meta.cid
                                                                    : "Unknown"
                                                            }`}
                                                        </SelectItem>
                                                    )
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {selectedBaseURI && !metadataResult && (
                                        <div className="bg-green-50/5 p-4 rounded-md mt-2">
                                            <div className="flex items-center">
                                                <Check className="h-5 w-5 text-green-600 mr-2" />
                                                <h4 className="font-medium">
                                                    Metadata selected
                                                    successfully
                                                </h4>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-2">
                                                You have selected existing
                                                metadata from IPFS which will be
                                                used for this collection.
                                            </p>
                                        </div>
                                    )}

                                    {selectedBaseURI && (
                                        <div className="p-3 bg-muted rounded-md text-xs font-mono space-y-2 w-full">
                                            <div>
                                                <span className="font-semibold">
                                                    Base URI:{" "}
                                                </span>
                                                {selectedBaseURI}
                                            </div>
                                            <div>
                                                <span className="font-semibold">
                                                    Contract URI:{" "}
                                                </span>
                                                {selectedContractURI}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 border border-dashed rounded-md bg-muted w-full">
                                    <div className="text-center space-y-2">
                                        <h3 className="font-medium">
                                            No Metadata Available
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Please upload metadata in the
                                            Metadata tab before creating a
                                            collection.
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setActiveTab("metadata")
                                            }
                                        >
                                            Go to Metadata Tab
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="metadata" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create & Upload NFT Metadata</CardTitle>
                            <CardDescription>
                                Upload your NFT metadata to IPFS before creating
                                your collection
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <OnChainMetadata
                                onMetadataUploaded={handleMetadataUploaded}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="space-y-4 pt-4 border-t border-gray-200">
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="gas-max-fee">Max Fee (Gwei)</Label>
                            <Input
                                id="gas-max-fee"
                                value={gasForm.gasMaxFee}
                                onChange={(e) =>
                                    handleGasFormChange(
                                        "gasMaxFee",
                                        e.target.value
                                    )
                                }
                                placeholder="20"
                                disabled={creatingCollection}
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
                                    handleGasFormChange(
                                        "gasMaxPriorityFee",
                                        e.target.value
                                    )
                                }
                                placeholder="1.5"
                                disabled={creatingCollection}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gas-limit">Gas Limit</Label>
                            <Input
                                id="gas-limit"
                                value={gasForm.gasLimit}
                                onChange={(e) =>
                                    handleGasFormChange(
                                        "gasLimit",
                                        e.target.value
                                    )
                                }
                                placeholder="500000"
                                disabled={creatingCollection}
                            />
                        </div>
                    </div>
                )}

                <p className="text-xs text-muted-foreground">
                    Gas settings control the transaction fee. Higher values may
                    result in faster processing but cost more.
                </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="space-y-2">
                    <Label>Select Wallet</Label>
                    <select
                        className="w-full p-2 rounded-md border bg-card"
                        value={selectedWalletId}
                        onChange={(e) => handleWalletSelect(e.target.value)}
                        disabled={creatingCollection}
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
                            onClick={() => setShowPrivateKey(!showPrivateKey)}
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
                    <p className="text-sm text-muted-foreground">
                        Your private key is only used for signing the
                        transaction and is never stored.
                    </p>
                </div>
            </div>

            {collectionResult && (
                <div className="mt-4">
                    {collectionResult.success ? (
                        <Alert className="bg-slate-800">
                            <Check className="h-4 w-4 text-green-600" />
                            <AlertTitle>
                                Collection Created Successfully
                            </AlertTitle>
                            <AlertDescription>
                                Your new collection "{collectionResult.name}" (
                                {collectionResult.symbol}) has been created.
                                <div className="mt-2 grid grid-cols-1 gap-2">
                                    <div>
                                        <span className="font-medium">
                                            Address:
                                        </span>{" "}
                                        <span className="font-mono text-sm">
                                            {collectionResult.collectionAddress}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-medium">
                                            Transaction:
                                        </span>{" "}
                                        <span className="font-mono text-sm">
                                            {collectionResult.transactionHash}
                                        </span>
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Collection Creation Failed</AlertTitle>
                            <AlertDescription>
                                {collectionResult.error}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            )}

            <div className="flex justify-end space-x-2 mt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={creatingCollection}
                >
                    Cancel
                </Button>
                <Button
                    type="button"
                    onClick={handleCreateCollection}
                    disabled={
                        creatingCollection ||
                        !collectionForm.name ||
                        !collectionForm.symbol ||
                        !privateKey ||
                        !hasSelectedMetadata
                    }
                >
                    {creatingCollection ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
