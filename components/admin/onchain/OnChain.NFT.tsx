"use client";

import { useState } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import {
    NFTFilters,
    NFTPaginationParams,
    NFTWithRelations,
} from "./OnChain.types";
import { useNFTs, useNFTDetails } from "@/app/hooks/useNFTs";
import { Loader2, Search, ArrowUpDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

// 메타데이터 타입 정의
interface NFTMetadata {
    name: string;
    image: string;
    description: string;
    external_url: string;
    animation_url: string;
    background_color: string;
    tokenId: number;
    attributes: {
        value: number | string;
        trait_type: string;
        display_type: "date" | "string" | "number";
    }[];
}

// NFT 필터 컴포넌트 개선
function NFTFiltersComponent({
    filters,
    onFiltersChange,
}: {
    filters: NFTFilters;
    onFiltersChange: (filters: NFTFilters) => void;
}) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search NFTs..."
                        value={filters.searchTerm || ""}
                        onChange={(e) =>
                            onFiltersChange({
                                ...filters,
                                searchTerm: e.target.value,
                            })
                        }
                        className="pl-9"
                    />
                </div>
                <Select
                    value={filters.networkId || ""}
                    onValueChange={(value) =>
                        onFiltersChange({
                            ...filters,
                            networkId: value,
                        })
                    }
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Network" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Networks</SelectItem>
                        {/* 네트워크 목록은 props로 받아오거나 query로 가져오기 */}
                    </SelectContent>
                </Select>
                <Select
                    value={filters.status || ""}
                    onValueChange={(value) =>
                        onFiltersChange({
                            ...filters,
                            status: value as
                                | "all"
                                | "listed"
                                | "unlisted"
                                | "burned",
                        })
                    }
                >
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="listed">Listed</SelectItem>
                        <SelectItem value="unlisted">Unlisted</SelectItem>
                        <SelectItem value="burned">Burned</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

// NFT 카드 컴포넌트 수정
function NFTCard({
    nft,
    onViewDetails,
}: {
    nft: NFTWithRelations;
    onViewDetails: (id: string) => void;
}) {
    const { data: metadata, isLoading: isLoadingMetadata } =
        useQuery<NFTMetadata>({
            queryKey: ["nft-metadata", nft.metadataUri],
            queryFn: async () => {
                if (!nft.metadataUri) return null;
                const response = await fetch(nft.metadataUri);
                if (!response.ok) throw new Error("Failed to fetch metadata");
                return response.json();
            },
            enabled: !!nft.metadataUri,
        });

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
                {/* NFT 이미지 */}
                <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-4">
                    {isLoadingMetadata ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : metadata?.image ? (
                        <img
                            src={metadata.image}
                            alt={metadata.name}
                            className="w-full h-full object-cover"
                        />
                    ) : null}
                </div>
                {/* NFT 정보 */}
                <div className="space-y-2">
                    <h3 className="font-semibold">
                        {metadata?.name ?? nft.name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                        {metadata?.description ?? nft.description}
                    </p>
                    <div className="flex justify-between items-center">
                        <span className="text-sm">
                            Collection: {nft.collection.name}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewDetails(nft.id)}
                        >
                            View Details
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// NFT 목록 컴포넌트 개선
function NFTListComponent({
    nfts,
    isLoading,
    pagination,
    onPaginationChange,
    onViewDetails,
}: {
    nfts:
        | { items: NFTWithRelations[]; total: number; pageCount: number }
        | undefined;
    isLoading: boolean;
    pagination: NFTPaginationParams;
    onPaginationChange: (pagination: NFTPaginationParams) => void;
    onViewDetails: (id: string) => void;
}) {
    // 정렬 옵션 변경 핸들러
    const handleSortChange = (field: NFTPaginationParams["sortBy"]) => {
        onPaginationChange({
            ...pagination,
            sortBy: field,
            sortDirection:
                pagination.sortBy === field &&
                pagination.sortDirection === "asc"
                    ? "desc"
                    : "asc",
        });
    };

    // 페이지 변경 핸들러
    const handlePageChange = (page: number) => {
        onPaginationChange({
            ...pagination,
            page,
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!nfts?.items.length) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No NFTs found
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 정렬 옵션 */}
            <div className="flex justify-end gap-2 my-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSortChange("mintedAt")}
                    className="flex items-center gap-2"
                >
                    Minted Date
                    <ArrowUpDown className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSortChange("tokenId")}
                    className="flex items-center gap-2"
                >
                    Token ID
                    <ArrowUpDown className="h-4 w-4" />
                </Button>
            </div>

            {/* NFT 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nfts.items.map((nft) => (
                    <NFTCard
                        key={nft.id}
                        nft={nft}
                        onViewDetails={onViewDetails}
                    />
                ))}
            </div>

            {/* 페이지네이션 */}
            <Pagination className="mt-4">
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={() =>
                                handlePageChange(pagination.page - 1)
                            }
                            className={
                                pagination.page === 1
                                    ? "pointer-events-none opacity-50"
                                    : ""
                            }
                        />
                    </PaginationItem>
                    {Array.from(
                        { length: nfts.pageCount },
                        (_, i) => i + 1
                    ).map((page) => (
                        <PaginationItem key={page}>
                            <PaginationLink
                                onClick={() => handlePageChange(page)}
                                isActive={pagination.page === page}
                            >
                                {page}
                            </PaginationLink>
                        </PaginationItem>
                    ))}
                    <PaginationItem>
                        <PaginationNext
                            onClick={() =>
                                handlePageChange(pagination.page + 1)
                            }
                            className={
                                pagination.page === nfts.pageCount
                                    ? "pointer-events-none opacity-50"
                                    : ""
                            }
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
}

// NFT 상세 정보 모달 컴포넌트 수정
function NFTDetailModalComponent({
    nftId,
    isOpen,
    onClose,
}: {
    nftId: string | null;
    isOpen: boolean;
    onClose: () => void;
}) {
    const { data: nft, isLoading } = useNFTDetails(nftId);
    const { data: metadata, isLoading: isLoadingMetadata } =
        useQuery<NFTMetadata>({
            queryKey: ["nft-metadata", nft?.metadataUri],
            queryFn: async () => {
                if (!nft?.metadataUri) return null;
                const response = await fetch(nft.metadataUri);
                if (!response.ok) throw new Error("Failed to fetch metadata");
                return response.json();
            },
            enabled: !!nft?.metadataUri,
        });

    // 날짜 포맷 함수
    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>NFT Details</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {isLoading || isLoadingMetadata ? (
                        <div className="flex justify-center">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : nft && metadata ? (
                        <>
                            <h2 className="text-2xl font-bold">
                                {metadata.name}
                            </h2>
                            <div className="aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden">
                                <img
                                    src={metadata.image}
                                    alt={metadata.name}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <p className="text-muted-foreground">
                                {metadata.description}
                            </p>

                            {/* Attributes */}
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                {metadata.attributes.map((attr, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-muted rounded-lg p-3"
                                    >
                                        <div className="text-sm font-medium">
                                            {attr.trait_type}
                                        </div>
                                        <div className="text-lg">
                                            {attr.display_type === "date"
                                                ? formatDate(
                                                      attr.value as number
                                                  )
                                                : attr.value}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* NFT 정보 */}
                            <div className="mt-4 space-y-2">
                                <div className="flex justify-between">
                                    <span>Token ID</span>
                                    <span className="font-mono">
                                        {metadata.tokenId}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Owner</span>
                                    <span className="font-mono">
                                        {nft.ownerAddress}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Collection</span>
                                    <span>{nft.collection.name}</span>
                                </div>
                                {metadata.external_url && (
                                    <div className="flex justify-between">
                                        <span>External URL</span>
                                        <a
                                            href={metadata.external_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                        >
                                            View
                                        </a>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div>NFT not found</div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// 메인 컴포넌트 수정
export default function OnChainNFTManager() {
    const [filters, setFilters] = useState<NFTFilters>({});
    const [selectedNftId, setSelectedNftId] = useState<string | null>(null);
    const [pagination, setPagination] = useState<NFTPaginationParams>({
        page: 1,
        limit: 20,
        sortBy: "mintedAt",
        sortDirection: "desc",
    });

    const { data: nfts, isLoading } = useNFTs(filters, pagination);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>NFT Manager</CardTitle>
                    <CardDescription>
                        Manage and monitor your NFT collections
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <NFTFiltersComponent
                        filters={filters}
                        onFiltersChange={setFilters}
                    />
                    <NFTListComponent
                        nfts={nfts}
                        isLoading={isLoading}
                        pagination={pagination}
                        onPaginationChange={setPagination}
                        onViewDetails={setSelectedNftId}
                    />
                </CardContent>
            </Card>

            <NFTDetailModalComponent
                nftId={selectedNftId}
                isOpen={!!selectedNftId}
                onClose={() => setSelectedNftId(null)}
            />
        </div>
    );
}
