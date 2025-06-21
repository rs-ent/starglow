"use client";

import { Fragment, useState, useCallback } from "react";

import { format } from "date-fns";
import {
    ExternalLink,
    Code,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
    Clock,
    Image,
} from "lucide-react";

import { useBlockchainNetworksManager } from "@/app/hooks/useBlockchain";
import { useFactoryGet } from "@/app/hooks/useFactoryContracts";
import PartialLoading from "@/components/atoms/PartialLoading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils/tailwind";

import CollectionFunctions from "./OnChain.CollectionFunctions";

import type { CollectionContract } from "@prisma/client";

interface OnChainCollectionProps {
    networkId: string;
    factoryId: string;
    onViewNFTs?: (collection: CollectionContract) => void;
}

export default function OnChainCollection({
    networkId,
    factoryId,
    onViewNFTs,
}: OnChainCollectionProps) {
    const { collections, isLoading, error } = useFactoryGet({
        networkId,
        factoryId,
    });

    const { networks } = useBlockchainNetworksManager();

    // 어코디언 상태 관리
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);
    const [selectedCollection, setSelectedCollection] =
        useState<CollectionContract | null>(null);

    function formatDate(date: Date) {
        return format(new Date(date), "yyyy-MM-dd HH:mm:ss");
    }

    // Explorer URL 생성 함수
    function getExplorerAddressUrl(collection: CollectionContract) {
        const network = networks?.find((n) => n.id === collection.networkId);
        return network?.explorerUrl
            ? `${network.explorerUrl}/address/${collection.address}`
            : undefined;
    }

    // 특정 Collection의 Functions 폼 토글
    function toggleCollectionFunctions(collection: CollectionContract) {
        setSelectedCollection(collection);

        // 선택된 어코디언 토글
        if (openAccordion === collection.id) {
            setOpenAccordion(null);
        } else {
            setOpenAccordion(collection.id);
        }
    }

    // NFT 목록 보기 핸들러
    function handleViewNFTs(collection: CollectionContract) {
        if (onViewNFTs) {
            onViewNFTs(collection);
        }
    }

    return (
        <Card className="border-none shadow-md bg-gradient-to-b from-background to-muted/5">
            <CardHeader className="border-b bg-muted/5 rounded-t-lg">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <Code className="h-6 w-6 text-primary" />
                        컬렉션
                    </CardTitle>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <PartialLoading text="Loading collections..." />
                    </div>
                ) : error ? (
                    <Alert
                        variant="destructive"
                        className="bg-red-500/5 border-red-500/20"
                    >
                        <AlertDescription className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            {error instanceof Error
                                ? error.message
                                : "Failed to load collections"}
                        </AlertDescription>
                    </Alert>
                ) : !collections || collections.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <div className="max-w-md mx-auto space-y-4">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                <Code className="h-10 w-10 text-primary" />
                            </div>
                            <p className="text-muted-foreground">
                                아직 배포된 컬렉션이 없습니다.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="font-semibold">
                                        이름
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        심볼
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        네트워크
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        주소
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        최대 공급량
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        발행 가격
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        생성 일시
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        기능
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {collections.map(
                                    (collection: CollectionContract) => {
                                        const network = networks?.find(
                                            (n) => n.id === collection.networkId
                                        );
                                        return (
                                            <Fragment key={collection.id}>
                                                <TableRow
                                                    className={cn(
                                                        "transition-colors hover:bg-muted/30",
                                                        openAccordion ===
                                                            collection.id &&
                                                            "bg-muted/20"
                                                    )}
                                                >
                                                    <TableCell className="font-medium">
                                                        {collection.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-primary/5"
                                                        >
                                                            {collection.symbol}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="secondary"
                                                            className="bg-blue-500/10 text-blue-500"
                                                        >
                                                            {network?.name ||
                                                                "Unknown Network"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-mono">
                                                        <div className="flex items-center gap-2">
                                                            <code className="px-2 py-1 bg-muted/30 rounded text-xs">
                                                                {collection.address.substring(
                                                                    0,
                                                                    8
                                                                )}
                                                                ...
                                                                {collection.address.substring(
                                                                    collection
                                                                        .address
                                                                        .length -
                                                                        6
                                                                )}
                                                            </code>
                                                            {network?.explorerUrl && (
                                                                <a
                                                                    href={getExplorerAddressUrl(
                                                                        collection
                                                                    )}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-primary hover:text-primary/80 transition-colors"
                                                                >
                                                                    <ExternalLink
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-muted/30"
                                                        >
                                                            {
                                                                collection.maxSupply
                                                            }{" "}
                                                            (
                                                            {
                                                                collection.mintedCount
                                                            }{" "}
                                                            minted)
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            <span>
                                                                {
                                                                    collection.mintPrice
                                                                }
                                                            </span>
                                                            <Badge
                                                                variant="outline"
                                                                className="bg-muted/30"
                                                            >
                                                                {network?.symbol ||
                                                                    "Unknown"}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Clock className="h-4 w-4" />
                                                            {formatDate(
                                                                collection.createdAt
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant={
                                                                    openAccordion ===
                                                                    collection.id
                                                                        ? "default"
                                                                        : "outline"
                                                                }
                                                                size="sm"
                                                                className="flex items-center gap-2"
                                                                onClick={() =>
                                                                    toggleCollectionFunctions(
                                                                        collection
                                                                    )
                                                                }
                                                            >
                                                                <Code className="h-4 w-4" />
                                                                관리
                                                                {openAccordion ===
                                                                collection.id ? (
                                                                    <ChevronUp className="h-4 w-4" />
                                                                ) : (
                                                                    <ChevronDown className="h-4 w-4" />
                                                                )}
                                                            </Button>

                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="flex items-center gap-2"
                                                                onClick={() =>
                                                                    handleViewNFTs(
                                                                        collection
                                                                    )
                                                                }
                                                            >
                                                                <Image className="h-4 w-4" />
                                                                NFT 목록
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>

                                                {openAccordion ===
                                                    collection.id && (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={8}
                                                            className="p-0"
                                                        >
                                                            <div className="border-t bg-muted/5 p-6">
                                                                {selectedCollection?.id ===
                                                                    collection.id && (
                                                                    <CollectionFunctions
                                                                        collection={
                                                                            selectedCollection
                                                                        }
                                                                        onClose={() =>
                                                                            setOpenAccordion(
                                                                                null
                                                                            )
                                                                        }
                                                                        onCollectionUpdated={(
                                                                            updatedCollection
                                                                        ) => {
                                                                            setSelectedCollection(
                                                                                updatedCollection
                                                                            );
                                                                        }}
                                                                    />
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </Fragment>
                                        );
                                    }
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
