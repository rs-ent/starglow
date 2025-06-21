/// app\collections\[address]\page.tsx

import { Suspense } from "react";

import { notFound } from "next/navigation";

import NFTContents from "@/components/nfts/NFT.Contents";
import { prisma } from "@/lib/prisma/client";

interface CollectionPageProps {
    params: {
        address: string;
    };
}

// 로딩 상태 컴포넌트
function CollectionLoading() {
    return (
        <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
    );
}

// 실제 컬렉션 데이터를 가져오는 컴포넌트
async function CollectionContent({ address }: { address: string }) {
    try {
        const spg = await prisma.story_spg.findUnique({
            where: { address },
            include: {
                artist: true,
            },
        });

        if (!spg) {
            notFound();
            return null;
        }

        return <NFTContents spg={spg} />;
    } catch (error) {
        console.error("Error fetching collection:", error);
        notFound();
        return null;
    }
}

export default function CollectionPage({ params }: CollectionPageProps) {
    return (
        <Suspense fallback={<CollectionLoading />}>
            <CollectionContent address={params.address} />
        </Suspense>
    );
}
