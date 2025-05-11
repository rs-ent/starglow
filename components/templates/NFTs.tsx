/// components/templates/NFTs.tsx

"use client";

import { useFactoryGet } from "@/app/hooks/useFactoryContracts";
import CollectionList from "@/components/organisms/NFTs.CollectionList";
import { Alert, AlertDescription } from "../ui/alert";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";

export default function NFTs() {
    const { collections, isLoading, error, factoriesQuery, collectionsQuery } =
        useFactoryGet({});

    const listedCollections = useMemo(() => {
        if (!collections || collections.length === 0) return [];
        return collections.filter((collection) => collection.isListed);
    }, [collections]);

    const isEmpty = !listedCollections || listedCollections.length === 0;
    const isError = !!error || collectionsQuery.isError;

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
                    {error?.message ||
                        collectionsQuery.error?.message ||
                        "Failed to load collections"}
                    <button
                        onClick={() => collectionsQuery.refetch()}
                        className="ml-2 underline"
                    >
                        Try again
                    </button>
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">NFT Collections</h1>
                </div>

                {isEmpty ? (
                    <div className="text-center text-muted-foreground py-8">
                        No collections available at the moment
                    </div>
                ) : (
                    <CollectionList collections={listedCollections} />
                )}
            </div>
        </>
    );
}
