/// components/nfts/NFTs.Collections.tsx

import { useFactoryGet } from "@/app/hooks/useFactoryContracts";
import { useMemo } from "react";
import { AlertDescription } from "../ui/alert";
import PartialLoading from "../atoms/PartialLoading";
import { Alert } from "../ui/alert";
import type { Collection } from "@/app/actions/factoryContracts";
import NFTsCollectionsList from "./NFTs.Collections.List";

export default function NFTsCollections() {
    const { everyCollections, isLoading, error, everyCollectionsQuery } =
        useFactoryGet({});

    const listedCollections = useMemo(() => {
        if (!everyCollections || everyCollections.length === 0) return [];
        return everyCollections.filter(
            (collection: Collection) => collection.isListed
        );
    }, [everyCollections]);

    const isEmpty = !listedCollections || listedCollections.length === 0;
    const isError = !!error || everyCollectionsQuery.isError;

    if (isLoading) {
        return <PartialLoading text="Loading collections..." size="sm" />;
    }

    if (isEmpty) {
        return (
            <Alert variant="destructive">
                <AlertDescription>
                    No collections found
                    <button
                        onClick={() => everyCollectionsQuery.refetch()}
                        className="ml-2 underline"
                    >
                        Try again
                    </button>
                </AlertDescription>
            </Alert>
        );
    }

    if (isError) {
        return (
            <Alert variant="destructive">
                <AlertDescription>
                    {error?.message ||
                        everyCollectionsQuery.error?.message ||
                        "Failed to load collections"}
                    <button
                        onClick={() => everyCollectionsQuery.refetch()}
                        className="ml-2 underline"
                    >
                        Try again
                    </button>
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="m-auto">
            <NFTsCollectionsList collections={listedCollections} />
        </div>
    );
}
