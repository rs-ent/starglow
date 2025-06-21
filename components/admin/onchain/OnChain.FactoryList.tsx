/// components\admin\onchain\OnChain.FactoryList.tsx
/// Factory Contract List Component

"use client";

import { useState } from "react";

import { format } from "date-fns";
import {
    Code,
    ExternalLink,
    PlusCircle,
    ChevronDown,
    Shield,
    Clock,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Copy,
    Layers,
} from "lucide-react";

import { useBlockchainNetworksManager } from "@/app/hooks/useBlockchain";
import { useFactoryGet } from "@/app/hooks/useFactoryContracts";
import { useToast } from "@/app/hooks/useToast";
import PartialLoading from "@/components/atoms/PartialLoading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";

import FactoryFunctions from "./OnChain.FactoryFunctions";


import type { FactoryContract } from "@prisma/client";


interface FactoryListProps {
    networkId: string;
    onDeployClick: () => void;
    onSelectFactory: (factory: FactoryContract) => void;
}

export default function FactoryList({
    networkId,
    onDeployClick,
    onSelectFactory,
}: FactoryListProps) {
    const {
        factories,
        isLoadingFactories,
        error: factoriesError,
        factoriesQuery,
    } = useFactoryGet({ networkId });

    const { networks } = useBlockchainNetworksManager();

    const [openAccordion, setOpenAccordion] = useState<string | null>(null);
    const [selectedFactory, setSelectedFactory] =
        useState<FactoryContract | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const toast = useToast();

    // 복사 상태 관리
    const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

    function formatDate(date: Date) {
        return format(new Date(date), "yyyy-MM-dd HH:mm:ss");
    }

    function getExplorerAddressUrl(address: string, networkId: string) {
        const network = networks?.find((n) => n.id === networkId);
        return network ? `${network.explorerUrl}/address/${address}` : "#";
    }

    async function copyToClipboard(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedAddress(text);
            setTimeout(() => setCopiedAddress(null), 2000);
            toast.success("주소가 클립보드에 복사되었습니다");
        } catch (error) {
            toast.error("주소 복사 실패: " + error);
        }
    }

    async function handleRefresh() {
        setIsRefreshing(true);
        try {
            await factoriesQuery.refetch();
            toast.success("팩토리 목록이 새로고침되었습니다");
        } catch (error) {
            toast.error("팩토리 목록 새로고침 실패: " + error);
        } finally {
            setIsRefreshing(false);
        }
    }

    function toggleFactoryFunctions(factory: FactoryContract) {
        setSelectedFactory(factory);

        setOpenAccordion(openAccordion === factory.id ? null : factory.id);
    }

    return (
        <Card className="border-none shadow-md bg-gradient-to-b from-background to-muted/5">
            <CardHeader className="border-b bg-muted/5 rounded-t-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <Code className="h-6 w-6 text-primary" />
                            팩토리 컨트랙트 목록
                        </CardTitle>
                        <CardDescription className="text-base">
                            배포된 팩토리 컨트랙트 관리하기
                        </CardDescription>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="hover:bg-muted/50 transition-colors"
                        >
                            <RefreshCw
                                className={`h-4 w-4 mr-2 ${
                                    isRefreshing ? "animate-spin" : ""
                                }`}
                            />
                            새로고침
                        </Button>
                        <Button
                            onClick={onDeployClick}
                            className="bg-primary hover:bg-primary/90"
                        >
                            <PlusCircle className="h-4 w-4 mr-2" />새 컨트랙트
                            배포
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                {isLoadingFactories ? (
                    <div className="flex justify-center items-center py-12">
                        <PartialLoading text="컨트랙트 로딩 중..." />
                    </div>
                ) : factoriesError ? (
                    <Alert
                        variant="destructive"
                        className="bg-red-500/5 border-red-500/20"
                    >
                        <AlertDescription className="flex items-center gap-2">
                            <XCircle className="h-5 w-5" />
                            {factoriesError instanceof Error
                                ? factoriesError.message
                                : "컨트랙트 로딩 실패"}
                        </AlertDescription>
                    </Alert>
                ) : !factories || factories.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <div className="max-w-md mx-auto space-y-4">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                <Code className="h-10 w-10 text-primary" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold">
                                    팩토리 컨트랙트 없음
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                    첫 번째 팩토리 컨트랙트를 배포하여 NFT
                                    컬렉션을 관리해보세요.
                                </p>
                            </div>
                            <Button
                                onClick={onDeployClick}
                                className="bg-primary/10 text-primary hover:bg-primary/20"
                            >
                                <PlusCircle className="h-4 w-4 mr-2" />첫 번째
                                컨트랙트 배포하기
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {factories.map((factory: FactoryContract) => (
                            <Card
                                key={factory.id}
                                className={`overflow-hidden transition-all duration-200 hover:shadow-lg border ${
                                    openAccordion === factory.id
                                        ? "ring-2 ring-primary/20 bg-muted/5"
                                        : "hover:border-primary/20"
                                }`}
                            >
                                <CardContent className="p-0">
                                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-semibold text-lg">
                                                    팩토리 컨트랙트
                                                </span>
                                                <div className="flex gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-primary/10 text-primary"
                                                    >
                                                        <Shield className="h-3 w-3 mr-1" />
                                                        {factory.isActive
                                                            ? "활성화됨"
                                                            : "비활성화됨"}
                                                    </Badge>
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-blue-500/10 text-blue-500"
                                                    >
                                                        {networks?.find(
                                                            (n) =>
                                                                n.id ===
                                                                factory.networkId
                                                        )?.name ||
                                                            factory.networkId}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 text-sm">
                                                <div
                                                    className="font-mono bg-muted/30 px-3 py-1 rounded-md cursor-pointer 
                                                             hover:bg-primary/10 transition-colors flex items-center gap-2"
                                                    onClick={() =>
                                                        copyToClipboard(
                                                            factory.address
                                                        )
                                                    }
                                                >
                                                    {factory.address.substring(
                                                        0,
                                                        8
                                                    )}
                                                    ...
                                                    {factory.address.substring(
                                                        factory.address.length -
                                                            6
                                                    )}
                                                    {copiedAddress ===
                                                    factory.address ? (
                                                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                                                    ) : (
                                                        <Copy className="h-3 w-3 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <a
                                                    href={getExplorerAddressUrl(
                                                        factory.address,
                                                        factory.networkId
                                                    )}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary hover:text-primary/80 flex items-center gap-1"
                                                >
                                                    탐색기에서 보기
                                                    <ExternalLink size={12} />
                                                </a>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                            <div className="text-sm text-muted-foreground flex items-center gap-2 bg-muted/20 px-3 py-1 rounded-md">
                                                <Clock className="h-4 w-4" />
                                                {formatDate(factory.deployedAt)}
                                            </div>
                                            <Button
                                                variant={
                                                    openAccordion === factory.id
                                                        ? "default"
                                                        : "outline"
                                                }
                                                size="sm"
                                                className="flex items-center gap-2 min-w-[120px]"
                                                onClick={() =>
                                                    toggleFactoryFunctions(
                                                        factory
                                                    )
                                                }
                                            >
                                                <Code className="h-4 w-4" />
                                                관리
                                                <ChevronDown
                                                    className={`h-4 w-4 transition-transform ${
                                                        openAccordion ===
                                                        factory.id
                                                            ? "rotate-180"
                                                            : ""
                                                    }`}
                                                />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex items-center gap-2 min-w-[120px]"
                                                onClick={() =>
                                                    onSelectFactory(factory)
                                                }
                                            >
                                                <Layers className="h-4 w-4" />
                                                배포한 컬렉션
                                            </Button>
                                        </div>
                                    </div>

                                    {openAccordion === factory.id && (
                                        <div className="border-t bg-muted/5">
                                            {selectedFactory?.id ===
                                                factory.id && (
                                                <FactoryFunctions
                                                    factory={selectedFactory}
                                                    onClose={() =>
                                                        setOpenAccordion(null)
                                                    }
                                                />
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
