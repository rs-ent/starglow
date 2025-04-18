"use client";

import { Fragment, useState, useCallback } from "react";
import { useCollectionContractsManager } from "@/app/hooks/useCollectionContracts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import {
    ExternalLink,
    Code,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
    Clock,
} from "lucide-react";
import PartialLoading from "@/components/atoms/PartialLoading";
import { CollectionContract } from "@/app/queries/collectionContractsQueries";
import CollectionFunctions from "./OnChain.CollectionFunctions";
import { cn } from "@/lib/utils/tailwind";

export default function OnChainCollection() {
    const { collections, isLoading, error, isError, refetch } =
        useCollectionContractsManager();

    // 어코디언 상태 관리
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);
    const [selectedCollection, setSelectedCollection] =
        useState<CollectionContract | null>(null);

    function formatDate(date: Date) {
        return format(new Date(date), "yyyy-MM-dd HH:mm:ss");
    }

    // Explorer URL 생성 함수
    function getExplorerAddressUrl(collection: CollectionContract) {
        return collection.network?.explorerUrl
            ? `${collection.network.explorerUrl}/address/${collection.address}`
            : undefined;
    }

    function getExplorerTxUrl(collection: CollectionContract) {
        return collection.network?.explorerUrl && collection.txHash
            ? `${collection.network.explorerUrl}/tx/${collection.txHash}`
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

    function handleCollectionUpdated(updatedCollection: CollectionContract) {
        // Refresh the collections list to reflect the changes
        refetch();
    }

    function handleRefreshCollection(collectionId: string) {
        // Refresh all collections for now
        refetch();
    }

    const toggleCollectionFunctionsCallback = useCallback(
        (collectionId: string) => {
            setOpenAccordion((prev) =>
                prev === collectionId ? null : collectionId
            );
        },
        []
    );

    return (
        <Card className="border-none shadow-md bg-gradient-to-b from-background to-muted/5">
            <CardHeader className="border-b bg-muted/5 rounded-t-lg">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <Code className="h-6 w-6 text-primary" />
                        NFT Collections
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        className="hover:bg-muted/50 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh All
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <PartialLoading text="Loading collections..." />
                    </div>
                ) : isError ? (
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
                                No NFT collections have been deployed yet.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="font-semibold">
                                        Name
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        Symbol
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        Network
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        Address
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        Max Supply
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        Mint Price
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        Created At
                                    </TableHead>
                                    <TableHead className="font-semibold">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {collections.map(
                                    (collection: CollectionContract) => (
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
                                                        {collection.network
                                                            ?.name ||
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
                                                                    .length - 6
                                                            )}
                                                        </code>
                                                        {collection.network
                                                            ?.explorerUrl && (
                                                            <a
                                                                href={getExplorerAddressUrl(
                                                                    collection
                                                                )}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-primary hover:text-primary/80 transition-colors"
                                                            >
                                                                <ExternalLink
                                                                    size={14}
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
                                                        {collection.maxSupply} (
                                                        {collection.mintedCount}{" "}
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
                                                            {collection.network
                                                                ?.symbol ||
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
                                                            Functions
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
                                                            onClick={() =>
                                                                handleRefreshCollection(
                                                                    collection.id
                                                                )
                                                            }
                                                            className="hover:bg-muted/50 transition-colors"
                                                        >
                                                            <RefreshCw className="h-4 w-4" />
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
                                                                    onCollectionUpdated={
                                                                        handleCollectionUpdated
                                                                    }
                                                                />
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </Fragment>
                                    )
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
