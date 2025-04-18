/// components/templates/NFTs.tsx

"use client";

import { useListedCollections } from "@/app/hooks/useCollectionContracts";
import { CollectionContract } from "@prisma/client";
import CollectionList from "@/components/organisms/NFTs.CollectionList";
import { Alert, AlertDescription } from "../ui/alert";
import { Loader2 } from "lucide-react";

export default function NFTs() {
    const { listedCollections, isLoading, isError, error, isEmpty, refetch } =
        useListedCollections();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (isError) {
        return (
            <Alert variant="destructive">
                <AlertDescription>
                    {error?.message || "Failed to load collections"}
                    <button
                        onClick={() => refetch()}
                        className="ml-2 underline"
                    >
                        Try again
                    </button>
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">NFT Collections</h1>
                {/* 필요한 경우 필터/정렬 컨트롤 추가 */}
            </div>

            {isEmpty ? (
                <div className="text-center text-muted-foreground py-8">
                    No collections available at the moment
                </div>
            ) : (
                <CollectionList collections={listedCollections || []} />
            )}
        </div>
    );
}
