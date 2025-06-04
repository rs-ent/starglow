/// app/nfts/[address]/page.tsx

import { prisma } from "@/lib/prisma/client";
import { SPG } from "@/app/story/spg/actions";
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

    const spg = (await prisma.story_spg.findUnique({
        where: {
            address: address,
        },
        include: {
            artist: true,
        },
    })) as SPG;

    if (!spg) {
        return notFound();
    }

    return <NFT spg={spg} searchParams={searchParams} />;
}
