/// components\admin\onchain\OnChain.NFT.tsx

"use client";

import { useEffect, useState } from "react";
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
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationNext,
    PaginationLink,
    PaginationEllipsis,
} from "@/components/ui/pagination";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Loader2,
    Search,
    ArrowUpDown,
    MoreVertical,
    Layers,
} from "lucide-react";
import { CollectionContract, NFT } from "@prisma/client";
import { useCollectionGet } from "@/app/hooks/useCollectionContracts";
import {
    useNFTs,
    useNFTDetails,
    useGetOwnerByTokenIds,
} from "@/app/hooks/useNFTs";
import { NFTFilters, NFTPaginationParams } from "./OnChain.types";
import { useToast } from "@/app/hooks/useToast";
import { useBlockchainNetworksManager } from "@/app/hooks/useBlockchain";
import {
    useCollectionsByNetwork,
    useTokensLockStatus,
} from "@/app/queries/collectionContractsQueries";
import { useCollectionSet } from "@/app/hooks/useCollectionContracts";
import { useSession } from "next-auth/react";
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

export function NFTList({ collection }: { collection: CollectionContract }) {
    const toast = useToast();
    const { data: session } = useSession();

    const [filters, setFilters] = useState<NFTFilters & { address: string }>({
        collectionId: collection.id,
        status: "all",
        address: "",
    });

    const [pagination, setPagination] = useState<NFTPaginationParams>({
        page: 1,
        limit: 50,
        sortBy: "tokenId",
        sortDirection: "asc",
    });

    const { data: nfts, isLoading } = useNFTs(filters, pagination);

    const [copied, setCopied] = useState(false);
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success(`Copied to clipboard: ${text}`);
    };

    const { data: owners, isLoading: isLoadingOwners } = useGetOwnerByTokenIds({
        contractAddress: collection.address,
        tokenIds: nfts?.items.map((nft) => nft.tokenId.toString()) || [],
        networkId: collection.networkId,
    });

    const { data: tokensLockStatus, isLoading: isLoadingTokensLockStatus } =
        useTokensLockStatus({
            collectionAddress: collection.address,
            tokenIds: nfts?.items.map((nft) => nft.tokenId) || [],
        });

    const [nftList, setNftList] = useState<NFT[]>(nfts?.items || []);
    const [filteredNftList, setFilteredNftList] = useState<NFT[]>(
        nftList || []
    );

    const { lock, unlock, isLocking, isUnlocking, refresh } = useCollectionSet({
        collectionAddress: collection.address,
    });

    const handleLockUnlock = async (nft: NFT, isLocked: boolean) => {
        try {
            if (isLocked) {
                const confirm = window.confirm(
                    "Are you sure you want to unlock this NFT?"
                );
                if (!confirm) return;

                const result = await unlock({
                    userId: session?.user?.id ?? "",
                    collectionAddress: collection.address,
                    tokenIds: [nft.tokenId],
                });

                if (result.success) {
                    toast.success(`Token #${nft.tokenId} unlocked!`);
                } else {
                    toast.error(result.error ?? "Failed to unlock token");
                }
            } else {
                const confirm = window.confirm(
                    "Are you sure you want to lock this NFT?"
                );
                if (!confirm) return;

                const result = await lock({
                    userId: session?.user?.id ?? "",
                    collectionAddress: collection.address,
                    tokenIds: [nft.tokenId],
                    unlockScheduledAt: 0,
                });
                if (result.success) {
                    toast.success(`Token #${nft.tokenId} locked!`);
                } else {
                    toast.error(result.error ?? "Failed to lock token");
                }
            }
            await refresh();
        } catch (e) {
            toast.error("Failed to change lock status");
        }
    };

    useEffect(() => {
        if (nfts?.items) {
            setNftList(nfts.items);
            setFilteredNftList(nfts.items);
        }
    }, [nfts]);

    useEffect(() => {
        if (nfts && nfts.items && owners) {
            const updatedNfts = nfts.items.map((nft) => {
                const owner = owners.find(
                    (owner) => owner.tokenId === nft.tokenId.toString()
                );
                return {
                    ...nft,
                    currentOwnerAddress: owner?.ownerAddress || null,
                };
            });
            setNftList(updatedNfts);
            setFilteredNftList(updatedNfts);
        }
    }, [owners, nfts]);

    const handleSearchFilter = (searchText: string) => {
        setFilters({
            ...filters,
            address: searchText,
        });

        setFilteredNftList(
            searchText
                ? nftList.filter(
                      (nft) =>
                          nft.currentOwnerAddress?.includes(searchText) ||
                          nft.ownerAddress.includes(searchText)
                  )
                : nftList
        );
    };

    const FilterBar = () => (
        <div className="flex gap-4 mb-4">
            <Select
                value={filters.status}
                onValueChange={(value) =>
                    setFilters({
                        ...filters,
                        status: value as NFTFilters["status"],
                    })
                }
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="listed">Listed</SelectItem>
                    <SelectItem value="unlisted">Unlisted</SelectItem>
                    <SelectItem value="burned">Burned</SelectItem>
                </SelectContent>
            </Select>
            <Input
                placeholder="Search by owner address..."
                value={filters.address || ""}
                onChange={(e) => handleSearchFilter(e.target.value)}
                className="w-[300px]"
            />
        </div>
    );

    const PaginationUI = () => {
        if (!nfts || nfts.pageCount <= 1) return null;

        const currentPage = pagination.page;
        const totalPages = nfts.pageCount;
        const maxVisiblePages = 5;

        let startPage = Math.max(
            1,
            currentPage - Math.floor(maxVisiblePages / 2)
        );
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        return (
            <Pagination className="mt-4">
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={() =>
                                setPagination({
                                    ...pagination,
                                    page: Math.max(1, currentPage - 1),
                                })
                            }
                            className={
                                currentPage === 1
                                    ? "pointer-events-none opacity-50"
                                    : ""
                            }
                        />
                    </PaginationItem>

                    {startPage > 1 && (
                        <>
                            <PaginationItem>
                                <PaginationLink
                                    onClick={() =>
                                        setPagination({
                                            ...pagination,
                                            page: 1,
                                        })
                                    }
                                >
                                    1
                                </PaginationLink>
                            </PaginationItem>
                            {startPage > 2 && (
                                <PaginationItem>
                                    <PaginationEllipsis />
                                </PaginationItem>
                            )}
                        </>
                    )}

                    {Array.from(
                        { length: endPage - startPage + 1 },
                        (_, i) => startPage + i
                    ).map((page) => (
                        <PaginationItem key={page}>
                            <PaginationLink
                                onClick={() =>
                                    setPagination({
                                        ...pagination,
                                        page,
                                    })
                                }
                                isActive={currentPage === page}
                            >
                                {page}
                            </PaginationLink>
                        </PaginationItem>
                    ))}

                    {endPage < totalPages && (
                        <>
                            {endPage < totalPages - 1 && (
                                <PaginationItem>
                                    <PaginationEllipsis />
                                </PaginationItem>
                            )}
                            <PaginationItem>
                                <PaginationLink
                                    onClick={() =>
                                        setPagination({
                                            ...pagination,
                                            page: totalPages,
                                        })
                                    }
                                >
                                    {totalPages}
                                </PaginationLink>
                            </PaginationItem>
                        </>
                    )}

                    <PaginationItem>
                        <PaginationNext
                            onClick={() =>
                                setPagination({
                                    ...pagination,
                                    page: Math.min(totalPages, currentPage + 1),
                                })
                            }
                            className={
                                currentPage === totalPages
                                    ? "pointer-events-none opacity-50"
                                    : ""
                            }
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        );
    };

    const getLockStatus = (tokenId: number) => {
        if (!Array.isArray(tokensLockStatus)) {
            console.warn("tokensLockStatus is not an array", tokensLockStatus);
            return undefined;
        }
        return tokensLockStatus?.find((t) => t.tokenId === tokenId)?.isLocked;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">
                    {collection.name} NFTs
                </h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        Mint New NFT
                    </Button>
                    <Button variant="outline" size="sm">
                        Bulk Actions
                    </Button>
                </div>
            </div>

            <FilterBar />

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Token ID</TableHead>
                                <TableHead>Initial Owner</TableHead>
                                <TableHead>Current Owner</TableHead>
                                <TableHead>Minted At</TableHead>
                                <TableHead>Initial Transferred At</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-center"
                                    >
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredNftList.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-center py-8"
                                    >
                                        <div className="text-muted-foreground">
                                            No NFTs found
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredNftList.map((nft) => (
                                    <TableRow key={nft.id}>
                                        <TableCell>{nft.tokenId}</TableCell>
                                        <TableCell>
                                            <button
                                                className="font-mono max-w-[100px] overflow-hidden text-ellipsis hover:underline cursor-pointer"
                                                onClick={() =>
                                                    copyToClipboard(
                                                        nft.ownerAddress
                                                    )
                                                }
                                            >
                                                {nft.ownerAddress}
                                            </button>
                                        </TableCell>
                                        {isLoadingOwners ? (
                                            <TableCell>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            </TableCell>
                                        ) : (
                                            <TableCell className="font-mono">
                                                <button
                                                    className="font-mono max-w-[100px] overflow-hidden text-ellipsis hover:underline cursor-pointer"
                                                    onClick={() =>
                                                        copyToClipboard(
                                                            nft.currentOwnerAddress ||
                                                                nft.ownerAddress
                                                        )
                                                    }
                                                >
                                                    {nft.currentOwnerAddress ||
                                                        nft.ownerAddress}
                                                </button>
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            {new Date(
                                                nft.mintedAt
                                            ).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {nft.lastTransferredAt
                                                ? new Date(
                                                      nft.lastTransferredAt
                                                  ).toLocaleDateString()
                                                : "-"}
                                        </TableCell>
                                        <TableCell>
                                            {isLoadingTokensLockStatus ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : getLockStatus(nft.tokenId) ? (
                                                <span
                                                    title="Locked"
                                                    style={{ color: "#ff0000" }}
                                                >
                                                    Locked
                                                </span>
                                            ) : (
                                                <span
                                                    title="Unlocked"
                                                    style={{ color: "#ffffff" }}
                                                >
                                                    Unlocked
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        Transfer
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        disabled={
                                                            isLocking ||
                                                            isUnlocking
                                                        }
                                                        onClick={() =>
                                                            handleLockUnlock(
                                                                nft,
                                                                !!getLockStatus(
                                                                    nft.tokenId
                                                                )
                                                            )
                                                        }
                                                    >
                                                        {getLockStatus(
                                                            nft.tokenId
                                                        )
                                                            ? "Unlock"
                                                            : "Lock"}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        Burn
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        Airdrop Tokens
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    <PaginationUI />
                </CardContent>
            </Card>
        </div>
    );
}

export default function OnChainNFTManager({
    selectedCollection,
}: {
    selectedCollection: CollectionContract;
}) {
    return (
        <div className="space-y-6">
            <div className="bg-muted/20 p-4 rounded-lg mb-6">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Layers className="h-4 w-4" />
                    <span>
                        선택된 컬렉션:{" "}
                        <span className="font-semibold text-foreground">
                            {selectedCollection.name}
                        </span>
                    </span>
                </div>
            </div>

            <NFTList collection={selectedCollection} />
        </div>
    );
}
