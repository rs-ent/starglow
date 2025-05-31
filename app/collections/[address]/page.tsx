/// app\collections\[address]\page.tsx

import {notFound} from "next/navigation";
import NFTContents from "@/components/nfts/NFT.Contents";
import type {Collection} from "@/app/actions/factoryContracts";
import {Metadata} from "@prisma/client";
import {prisma} from "@/lib/prisma/client";
import {Suspense} from "react";

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
        const collectionData = await prisma.collectionContract.findUnique({
            where: { address },
            include: {
                network: true,
                factory: true,
                metadata: true,
                artist: true,
            },
        });

        if (!collectionData || !collectionData.metadata) {
            notFound();
            return null;
        }

        // 명시적으로 Collection 타입으로 캐스팅
        const collection: Collection = {
            ...collectionData,
            metadata: collectionData.metadata as Metadata,
        };

        return <NFTContents collection={collection} />;
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