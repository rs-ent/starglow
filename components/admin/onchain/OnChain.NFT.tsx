/// components\organisms\OnChain.NFT.tsx

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2, Search, ArrowUpDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { CollectionContract, NFT } from "@prisma/client";
import { useCollectionContractsManager } from "@/app/hooks/useCollectionContracts";
function CollectionList({
    collections,
    selectedCollection,
    onSelectCollection,
}: {
    collections: CollectionContract[];
    selectedCollection: CollectionContract | null;
    onSelectCollection: (collection: CollectionContract) => void;
}) {
    return (
        <div className="space-y-2">
            {collections.map((collection) => (
                <Card
                    key={collection.id}
                    className={`cursor-pointer transition-colors ${
                        selectedCollection?.id === collection.id
                            ? "border-primary"
                            : ""
                    }`}
                    onClick={() => onSelectCollection(collection)}
                >
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold">
                                    {collection.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {collection.symbol}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm">
                                    {collection.mintedCount} /{" "}
                                    {collection.maxSupply}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function NFTList({
    collection,
    nfts,
    isLoading,
}: {
    collection: CollectionContract;
    nfts: NFT[];
    isLoading: boolean;
}) {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nfts.map((nft) => (
                /// NFT 카드 대신 테이블 형식으로 표시
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Token ID</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>Metadata</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>{nft.tokenId}</TableCell>
                            <TableCell>{nft.ownerAddress}</TableCell>
                            <TableCell>{nft.metadataUri}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            ))}
        </div>
    );
}

export default function OnChainNFTManager() {
    const { collections, selectedCollection, setSelectedCollection } =
        useCollectionContractsManager();

    return (
        <div className="space-y-4">
            <CollectionList
                collections={collections || []}
                selectedCollection={selectedCollection || null}
                onSelectCollection={setSelectedCollection}
            />
        </div>
    );
}
