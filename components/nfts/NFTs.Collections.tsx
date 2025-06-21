/// components/nfts/NFTs.Collections.tsx

import NFTsCollectionsList from "./NFTs.Collections.List";
import { AlertDescription , Alert } from "../ui/alert";

import type { SPG } from "@/app/story/spg/actions";

export default function NFTsCollections({
    onBuyNowClick,
    spgs,
}: {
    onBuyNowClick: (spgs: SPG) => void;
    spgs: SPG[];
}) {
    if (!spgs || spgs.length === 0) {
        return (
            <Alert variant="destructive">
                <AlertDescription>No collections found</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="m-auto">
            <NFTsCollectionsList
                spgs={spgs}
                onBuyNowClick={onBuyNowClick}
            />
        </div>
    );
}
