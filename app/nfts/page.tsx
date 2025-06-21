/// app\nfts\page.tsx

import { Suspense } from "react";


import PartialLoadingServer from "@/components/atoms/PartialLoadingServer";
import NFTs from "@/components/nfts/NFTs";

import { getSPGs } from "../story/spg/actions";

import type { Metadata } from "next";

// SEO 메타데이터 정의
export const metadata: Metadata = {
    title: "NFTs",
    description: "Discover and collect unique artist NFTs on Starglow",
};

// 로딩 상태 컴포넌트
function NFTsLoading() {
    return (
        <div className="relative flex flex-col w-full h-screen overflow-hidden items-center justify-center">
            <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />
            <PartialLoadingServer text="Preparing Special Gifts... 🎁" />
        </div>
    );
}

// NFT 데이터를 가져오는 컴포넌트
async function NFTsContent() {
    const spgs = await getSPGs();

    return <NFTs spgs={spgs || []} />;
}

export default function NFTsEntryPage() {
    return (
        <Suspense fallback={<NFTsLoading />}>
            <NFTsContent />
        </Suspense>
    );
}
