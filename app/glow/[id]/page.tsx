/// app/nfts/[address]/page.tsx

import { notFound } from "next/navigation";

import NFT from "@/components/nfts/NFT";
import { prisma } from "@/lib/prisma/client";

import type { SPG } from "@/app/story/spg/actions";

interface NFTPageProps {
    params: Promise<{ id: string }>;
}

export default async function NFTPage(props: NFTPageProps) {
    const params = await props.params;
    const id = params.id;

    const spg = (await prisma.story_spg.findUnique({
        where: {
            id: id,
        },
        include: {
            artist: true,
        },
    })) as SPG;

    if (!spg) {
        return notFound();
    }

    return <NFT spg={spg} />;
}
