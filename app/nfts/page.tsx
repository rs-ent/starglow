/// app\nfts\page.tsx

import NFTs from "@/components/nfts/NFTs";
import { getSPGs } from "../story/spg/actions";
import { Suspense } from "react";
import { Metadata } from "next";

// SEO 메타데이터 정의
export const metadata: Metadata = {
    title: "NFTs",
    description: "Discover and collect unique artist NFTs on Starglow",
};

// 로딩 상태 컴포넌트
function NFTsLoading() {
    return (
        <div className="relative flex flex-col w-full h-full overflow-hidden">
            <div className="fixed inset-0 bg-gradient-to-b from-[#09011b] to-[#311473] -z-20" />
            <div className="flex justify-center items-center h-screen">
                <div className="animate-pulse text-center">
                    <h2 className="text-4xl mb-4">NFTs</h2>
                    <p className="text-muted-foreground">Loading NFTs...</p>
                </div>
            </div>
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
