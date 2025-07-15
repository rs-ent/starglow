/// app\nfts\page.tsx

import NFTs from "@/components/nfts/NFTs";

import type { Metadata } from "next";

// SEO 메타데이터 정의
export const metadata: Metadata = {
    title: "Glow",
    description: "Discover and collect unique artist NFTs on Starglow",
};

export default function NFTsEntryPage() {
    return <NFTs />;
}
