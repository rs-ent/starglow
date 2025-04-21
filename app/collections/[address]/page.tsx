/// app\collections\[address]\page.tsx

import { getCollectionContractByAddress } from "@/app/actions/collectionContracts";
import { notFound } from "next/navigation";
import Collection from "@/components/organisms/NFTs.Collection";
import { CollectionContract, Metadata } from "@prisma/client";
import NavBar from "@/components/organisms/NavBar";
interface CollectionPageProps {
    params: Promise<{
        address: string;
    }>;
}

export default async function CollectionPage({ params }: CollectionPageProps) {
    try {
        const { address } = await params;
        const collectionResponse = await getCollectionContractByAddress(
            address
        );
        if (!collectionResponse.success || !collectionResponse.data) {
            notFound();
        }
        const collection = collectionResponse.data as CollectionContract & {
            metadata: Metadata;
        };

        return (
            <>
                <div className="sticky top-0 z-10 backdrop-blur-md">
                    <NavBar />
                </div>
                <Collection collection={collection} />
            </>
        );
    } catch (error) {
        console.error("Error fetching collection:", error);
        notFound();
    }
}
