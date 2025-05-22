/// app/nfts/[address]/page.tsx

import { prisma } from "@/lib/prisma/client";
import type { Collection } from "@/app/actions/factoryContracts";
import { notFound } from "next/navigation";
import NFT from "@/components/nfts/NFT";

interface NFTPageProps {
    params: Promise<{ address: string }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function NFTPage(props: NFTPageProps) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const address = params.address;

    const collection = (await prisma.collectionContract.findUnique({
        where: {
            address: address,
        },
        include: {
            metadata: true,
        },
    })) as Collection;

    if (!collection) {
        return notFound();
    }

    return <NFT collection={collection} searchParams={searchParams} />;
}
