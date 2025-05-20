/// components/templates/NFTs.tsx

"use client";

import NFTsCollections from "./NFTs.Collections";

export default function NFTs() {
    return (
        <div className="overflow-hidden flex items-center justify-center w-screen h-screen">
            <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />
            <NFTsCollections />
        </div>
    );
}
