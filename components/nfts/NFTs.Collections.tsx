/// components/nfts/NFTs.Collections.tsx

import { AlertDescription } from "../ui/alert";
import { Alert } from "../ui/alert";
import type { Collection } from "@/app/actions/factoryContracts";
import NFTsCollectionsList from "./NFTs.Collections.List";

export default function NFTsCollections({
    onBuyNowClick,
    listedCollections,
}: {
    onBuyNowClick: (collection: Collection) => void;
    listedCollections: Collection[];
}) {
    if (!listedCollections || listedCollections.length === 0) {
        return (
            <Alert variant="destructive">
                <AlertDescription>No collections found</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="m-auto">
            <NFTsCollectionsList
                collections={listedCollections}
                onBuyNowClick={onBuyNowClick}
            />
        </div>
    );
}
