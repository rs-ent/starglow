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
} from "lucide-react";
import PartialLoading from "@/components/atoms/PartialLoading";
import { CollectionContract } from "@/app/queries/collectionContractsQueries";
import CollectionFunctions from "./OnChain.CollectionFunctions";

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
        <Card>
            <CardHeader>
                <CardTitle>NFT Collections</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                        <PartialLoading text="Loading collections..." />
                    </div>
                ) : isError ? (
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>
                            {error instanceof Error
                                ? error.message
                                : "Failed to load collections"}
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="overflow-x-auto">
                        {!collections || collections.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground mb-4">
                                    No NFT collections have been deployed yet.
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Symbol</TableHead>
                                        <TableHead>Network</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead>Max Supply</TableHead>
                                        <TableHead>Mint Price</TableHead>
                                        <TableHead>Created At</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {collections.map(
                                        (collection: CollectionContract) => (
                                            <Fragment key={collection.id}>
                                                <TableRow
                                                    className={`w-full ${
                                                        openAccordion ===
                                                        collection.id
                                                            ? "bg-muted/50"
                                                            : ""
                                                    }`}
                                                >
                                                    <TableCell>
                                                        {collection.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {collection.symbol}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">
                                                            {collection.network
                                                                ?.name ||
                                                                "Unknown Network"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-mono">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="truncate max-w-[120px]">
                                                                {
                                                                    collection.address
                                                                }
                                                            </span>
                                                            {collection.network
                                                                ?.explorerUrl && (
                                                                <a
                                                                    href={getExplorerAddressUrl(
                                                                        collection
                                                                    )}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-primary hover:text-primary/80"
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
                                                        {collection.maxSupply}
                                                    </TableCell>
                                                    <TableCell>
                                                        {collection.mintPrice}{" "}
                                                        {collection.network
                                                            ?.symbol ||
                                                            "Unknown"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatDate(
                                                            collection.createdAt
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex space-x-2">
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                className="flex items-center"
                                                                onClick={() =>
                                                                    toggleCollectionFunctions(
                                                                        collection
                                                                    )
                                                                }
                                                            >
                                                                <Code className="h-4 w-4 mr-1" />
                                                                Functions
                                                                {openAccordion ===
                                                                collection.id ? (
                                                                    <ChevronUp className="h-4 w-4 ml-1" />
                                                                ) : (
                                                                    <ChevronDown className="h-4 w-4 ml-1" />
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
                                                            >
                                                                <RefreshCw className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>

                                                {openAccordion ===
                                                    collection.id && (
                                                    <TableRow className="bg-muted/50">
                                                        <TableCell
                                                            colSpan={8}
                                                            className="p-0"
                                                        >
                                                            <div className="border-t border-t-muted py-4 px-6">
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
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
