/// components/nfts/NFTs.Collections.tsx

"use client";

import type { SPG } from "@/app/story/spg/actions";
import NFTsCollectionsList from "./NFTs.Collections.List";

export default function NFTsCollections({
    onBuyNowClick,
}: {
    onBuyNowClick: (spgs: SPG) => void;
}) {
    return (
        <div className="m-auto">
            <NFTsCollectionsList onBuyNowClick={onBuyNowClick} />
        </div>
    );
}
