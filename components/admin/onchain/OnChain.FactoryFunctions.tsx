/// components\admin\onchain\OnChain.FactoryFunctions.tsx
/// Factory Contract Functions Component

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Check,
    Plus,
    X,
    Trash2,
    RefreshCw,
    Loader2,
    AlertTriangle,
    Key,
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import CreateCollection from "./OnChain.CreateCollection";
import { CreateCollectionResult } from "./OnChain.Factory";
import { Factory } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFactoryGet, useFactorySet } from "@/app/hooks/useFactoryContracts";
import { useEscrowWalletManager } from "@/app/hooks/useBlockchain";
import { CollectionContract } from "@prisma/client";
interface FactoryFunctionsProps {
    factory: {
        address: string;
        networkId: string;
        id: string;
    };
    onClose: () => void;
    onCollectionCreated?: (collection: any) => void;
}

export default function FactoryFunctions({
    factory,
    onClose,
    onCollectionCreated,
}: FactoryFunctionsProps) {
    const [showCreateCollection, setShowCreateCollection] = useState(false);
    const [lastCreatedCollection, setLastCreatedCollection] =
        useState<CreateCollectionResult | null>(null);
    const toast = useToast();

    // 컬렉션 삭제 관련 상태
    const [collectionToDelete, setCollectionToDelete] = useState<string | null>(
        null
    );
    const [selectedWalletId, setSelectedWalletId] = useState<string>("");

    // 에스크로 지갑 관리자 가져오기
    const { wallets, getWalletWithPrivateKey } = useEscrowWalletManager();

    // useFactoryGet hook 사용하여 Factory의 컬렉션 목록 가져오기
    const { collections, isLoadingCollections } = useFactoryGet({
        networkId: factory.networkId,
        factoryId: factory.id,
    });

    // useFactorySet hook 사용하여 Factory의 작업 수행
    const {
        updateFactory,
        deleteCollection,
        refresh,
        isProcessing,
        isDeletingCollection,
    } = useFactorySet({
        networkId: factory.networkId,
    });

    // 컬렉션 생성 완료 시 처리
    const handleCollectionCreated = (result: CreateCollectionResult) => {
        setLastCreatedCollection(result);
        setShowCreateCollection(false);
        refresh(); // 컬렉션 목록 새로고침

        if (onCollectionCreated) {
            onCollectionCreated({
                name: result.name,
                symbol: result.symbol,
                address: result.collectionAddress,
                factoryAddress: factory.address,
                networkId: factory.networkId,
                transactionHash: result.transactionHash,
            });
        }
    };

    // 지갑 선택 핸들러
    const handleWalletSelect = async (walletId: string) => {
        setSelectedWalletId(walletId);
    };

    // 컬렉션 삭제 처리
    const handleDeleteCollection = async () => {
        if (!collectionToDelete || !selectedWalletId) {
            toast.error("Please select a wallet first");
            return;
        }

        try {
            const result = await deleteCollection({
                factoryId: factory.id,
                walletId: selectedWalletId,
                collectionAddress: collectionToDelete,
            });

            if (result.success) {
                toast.success("Collection deleted successfully");
                setCollectionToDelete(null);
                setSelectedWalletId("");
                refresh(); // 컬렉션 목록 새로고침
            } else {
                toast.error(`Failed to delete collection: ${result.error}`);
            }
        } catch (error) {
            toast.error(
                `Error: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }
    };

    // 컬렉션 목록 새로고침
    const handleRefresh = () => {
        refresh();
        toast.success("Collections list refreshed");
    };

    return (
        <div className="rounded-2xl bg-gradient-to-b from-muted/10 to-muted/5 p-8 space-y-8">
            {/* Header Section */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Factory className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold tracking-tight">
                        팩토리 관리
                    </h2>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg font-mono text-xs">
                        <span className="text-muted-foreground">
                            컨트랙트 주소:
                        </span>
                        <code className="text-primary">{factory.address}</code>
                    </div>
                </div>
            </div>

            {/* Success Alert */}
            {lastCreatedCollection && lastCreatedCollection.success && (
                <Alert className="bg-green-500/5 border border-green-500/20">
                    <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                            <Check className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="space-y-2 flex-1">
                            <AlertTitle className="text-green-500 font-semibold text-lg">
                                컬렉션 생성 성공
                            </AlertTitle>
                            <AlertDescription>
                                <div className="space-y-4">
                                    <p className="text-sm">
                                        새로운 컬렉션 "
                                        {lastCreatedCollection.name}"이
                                        생성되었습니다.
                                    </p>
                                    <div className="grid gap-4 text-sm">
                                        <div className="space-y-1.5">
                                            <span className="text-muted-foreground text-xs">
                                                컬렉션 주소
                                            </span>
                                            <code className="block w-full p-2 bg-muted/30 rounded-md font-mono">
                                                {
                                                    lastCreatedCollection.collectionAddress
                                                }
                                            </code>
                                        </div>
                                        <div className="space-y-1.5">
                                            <span className="text-muted-foreground text-xs">
                                                트랜잭션 해시
                                            </span>
                                            <code className="block w-full p-2 bg-muted/30 rounded-md font-mono">
                                                {
                                                    lastCreatedCollection.transactionHash
                                                }
                                            </code>
                                        </div>
                                    </div>
                                </div>
                            </AlertDescription>
                        </div>
                    </div>
                </Alert>
            )}

            {/* Create Collection Card */}
            <div className="grid gap-6">
                <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                    <CardHeader className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Plus className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">
                                    새로운 컬렉션 생성
                                </CardTitle>
                            </div>
                        </div>
                    </CardHeader>
                    <CardFooter>
                        <Button
                            onClick={() => setShowCreateCollection(true)}
                            className="w-full relative overflow-hidden group"
                            size="lg"
                            disabled={isProcessing}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {isProcessing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                                새로운 컬렉션 생성하기
                            </span>
                            <div className="absolute inset-0 bg-primary/10 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Create Collection Modal */}
            {showCreateCollection && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-background rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border">
                        <CreateCollection
                            factory={factory}
                            onClose={() => setShowCreateCollection(false)}
                            onSuccess={handleCollectionCreated}
                        />
                    </div>
                </div>
            )}

            {/* Delete Collection Confirmation Dialog */}
            <Dialog
                open={!!collectionToDelete}
                onOpenChange={(open) => !open && setCollectionToDelete(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>컬렉션 삭제 확인</DialogTitle>
                        <DialogDescription>
                            이 컬렉션을 삭제하시겠습니까? 이 작업은 취소할 수
                            없습니다.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-md">
                            <p className="text-sm font-semibold mb-1">
                                컬렉션 주소:
                            </p>
                            <code className="text-red-500 font-mono text-sm block break-all">
                                {collectionToDelete}
                            </code>
                        </div>

                        {/* Wallet Selection for Delete Action */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Key className="h-4 w-4 text-muted-foreground" />
                                <Label>삭제를 위한 지갑 선택</Label>
                            </div>
                            <Select
                                value={selectedWalletId}
                                onValueChange={handleWalletSelect}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="지갑 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    {wallets?.map((wallet) => (
                                        <SelectItem
                                            key={wallet.id}
                                            value={wallet.id}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-mono text-sm">
                                                    {wallet.address.substring(
                                                        0,
                                                        6
                                                    )}
                                                    ...
                                                    {wallet.address.substring(
                                                        wallet.address.length -
                                                            4
                                                    )}
                                                </span>
                                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                    {wallet.networkIds.join(
                                                        ", "
                                                    )}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-2">
                                이 컬렉션을 삭제하기 위해서는 해당 컬렉션을
                                생성한 지갑 또는 팩토리를 생성한 지갑을 선택해야
                                합니다.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setCollectionToDelete(null);
                                setSelectedWalletId("");
                            }}
                            disabled={isDeletingCollection}
                        >
                            취소
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteCollection}
                            disabled={isDeletingCollection || !selectedWalletId}
                        >
                            {isDeletingCollection ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    삭제 중...
                                </>
                            ) : (
                                "컬렉션 삭제"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
