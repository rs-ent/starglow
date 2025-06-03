/// app\nfts\page.tsx

import NFTs from "@/components/nfts/NFTs";
import { getSPGs } from "../story/spg/actions";

export default async function NFTsPage() {
    const spgs = await getSPGs();

    return <NFTs spgs={spgs || []} />;
}
