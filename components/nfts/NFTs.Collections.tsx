/// components/nfts/NFTs.Collections.tsx

import { AlertDescription } from "../ui/alert";
import { Alert } from "../ui/alert";
import NFTsCollectionsList from "./NFTs.Collections.List";
import { SPG } from "@/app/story/spg/actions";

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
