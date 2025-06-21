/// components\admin\onchain\OnChain.CreateCollection.tsx

"use client";

import React, { useState, useEffect } from "react";

import {
    Loader2,
    Check,
    AlertTriangle,
    ExternalLink,
    Eye,
    Code,
    FileText,
    Settings,
    Cog,
} from "lucide-react";

import { useEscrowWalletManager , useBlockchainNetworksManager } from "@/app/hooks/useBlockchain";
import { useFactorySet } from "@/app/hooks/useFactoryContracts";
import { useMetadata } from "@/app/hooks/useMetadata";
import { useToast } from "@/app/hooks/useToast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils/tailwind";

import { OnChainMetadata } from "./OnChain.Metadata";

import type { METADATA_TYPE } from "@/app/actions/metadata";
import type { Metadata } from "@prisma/client";


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

    // 로딩 상태를 관리하기 위한 상태 추가
    const [isCreating, setIsCreating] = useState(false);

    // Hooks
    const { wallets, getWalletWithPrivateKey } = useEscrowWalletManager();
    const { networks } = useBlockchainNetworksManager();
    const { createCollection } = useFactorySet({
        networkId: factory.networkId,
    });

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
            toast.error("메타데이터를 먼저 선택해주세요");
            return;
        }

        try {
            setIsCreating(true); // 로딩 시작
            setCollectionResult(null);

            const result = await createCollection({
                factoryId: factory.id,
                walletId: selectedWalletId,
                params: {
                    name: collectionForm.name,
                    symbol: collectionForm.symbol,
                    maxSupply: parseInt(collectionForm.maxSupply),
                    mintPrice: parseInt(collectionForm.mintPrice),
                    baseURI: selectedMetadata.url,
                    contractURI: selectedMetadata.url,
                    collectionKey: selectedMetadata.collectionKey,
                },
            });

            if (!result.success || !result.data) {
                throw new Error(result.error || "컬렉션 생성 실패");
            }

            const creationResult = {
                success: true,
                message: "컬렉션이 성공적으로 생성되었습니다",
                collectionAddress: result.data.address,
                transactionHash: result.data.txHash || "",
                name: collectionForm.name,
                symbol: collectionForm.symbol,
            };

            // 메타데이터 링크 시도
            try {
                if (!result.data.address) {
                    throw new Error("컬렉션 주소를 받지 못했습니다");
                }

                const linkedMetadata = await linkMetadata({
                    metadataId: selectedMetadata.id,
                    collectionAddress: result.data.address,
                });

                toast.success(
                    `메타데이터가 컬렉션에 성공적으로 연결되었습니다: ${linkedMetadata}`
                );
            } catch (linkError) {
                console.error("메타데이터 연결 오류:", linkError);
                toast.error(
                    "컬렉션은 생성되었지만 메타데이터 연결에 실패했습니다"
                );
                creationResult.message += " (메타데이터 연결 실패)";
            }

            setCollectionResult(creationResult);
            toast.success(
                `"${collectionForm.name}" (${collectionForm.symbol}) 컬렉션이 성공적으로 생성되었습니다`
            );

            if (onSuccess) {
                onSuccess(creationResult);
            }
        } catch (error) {
            console.error("컬렉션 생성 오류:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "알 수 없는 오류가 발생했습니다";

            setCollectionResult({
                success: false,
                message: "컬렉션 생성에 실패했습니다",
                error: errorMessage,
            });

            toast.error(`컬렉션 생성 실패: ${errorMessage}`);
        } finally {
            setIsCreating(false); // 로딩 종료
        }
    };

    // Wallet 선택 핸들러
    const handleWalletSelect = async (walletId: string) => {
        try {
            setSelectedWalletId(walletId);
            const result = await getWalletWithPrivateKey(walletId);
            setPrivateKey(result.privateKey);
        } catch (error) {
            console.error("프라이빗 키 가져오기 실패:", error);
            toast.error("프라이빗 키를 가져오는데 실패했습니다");
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
                        새로운 NFT 컬렉션 생성
                    </h3>
                    <p className="text-muted-foreground">컬렉션 설정 및 배포</p>
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
                            <CardTitle>1. 메타데이터 선택</CardTitle>
                            <CardDescription>
                                컬렉션에 사용할 메타데이터를 선택하세요
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
                            <CardTitle>2. 메타데이터 확인</CardTitle>
                            <CardDescription>
                                컬렉션에 연결될 메타데이터를 확인하세요
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
                                        메타데이터 URL
                                    </h4>
                                    <div className="p-3 bg-muted/10 rounded-lg">
                                        <pre className="font-mono text-xs break-all overflow-x-auto">
                                            {selectedMetadata.url}
                                        </pre>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm text-primary">
                                        미리보기
                                    </h4>
                                    <a
                                        href={selectedMetadata.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                                    >
                                        메타데이터 보기{" "}
                                        <ExternalLink className="h-4 w-4 ml-2" />
                                    </a>
                                </div>
                            </div>

                            {selectedMetadata.metadata && (
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm text-primary">
                                        메타데이터 내용
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
                                메타데이터가 선택되지 않았습니다
                            </AlertTitle>
                            <AlertDescription>
                                먼저 1단계에서 메타데이터를 선택하세요
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
                            <CardTitle>3. 컬렉션 설정</CardTitle>
                            <CardDescription>
                                컬렉션 설정을 구성하세요
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
                                컬렉션 이름
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
                                심볼
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
                                최대 민팅 가능 수량 (안정성을 위해 공급량의 2배
                                선택해주세요)
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
                                민팅 가격 (wei)
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
                            <CardTitle>4. 배포 설정</CardTitle>
                            <CardDescription>
                                배포 옵션을 구성하세요
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
                                기본 가스 설정 사용
                            </Label>
                        </div>

                        {!useDefaultGas && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="gas-max-fee">
                                        최대 수수료 (Gwei)
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
                                        최대 우선 수수료 (Gwei)
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
                                    <Label htmlFor="gas-limit">가스 한도</Label>
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
                            <Label>지갑 선택</Label>
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
                    disabled={!selectedMetadata || !privateKey || isCreating}
                    className="bg-primary hover:bg-primary/90 transition-colors"
                >
                    {isCreating ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            생성 중...
                        </>
                    ) : (
                        "컬렉션 생성"
                    )}
                </Button>
            </div>
        </div>
    );
}
