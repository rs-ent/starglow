/// app\collections\[address]\page.tsx

import { notFound } from "next/navigation";
import Collection from "@/components/organisms/NFTs.Collection";
import { Metadata } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";

interface CollectionPageProps {
    params: Promise<{
        address: string;
    }>;
}

export default async function CollectionPage({ params }: CollectionPageProps) {
    try {
        const { address } = await params;
        const collectionData = await prisma.collectionContract.findUnique({
            where: { address },
            include: {
                network: true,
                factory: true,
                metadata: true,
            },
        });

        if (!collectionData || !collectionData.metadata) {
            notFound();
            return;
        }

        const collection = {
            ...collectionData,
            metadata: collectionData.metadata as Metadata,
        };

        return <Collection collection={collection} />;
    } catch (error) {
        console.error("Error fetching collection:", error);
        notFound();
    }
}
