/// app\nfts\page.tsx

import NFTs from "@/components/nfts/NFTs";
import { getCollections } from "../actions/factoryContracts";

export default async function NFTsPage() {
    const { data: listedCollections } = await getCollections({
        isListed: true,
    });

    return <NFTs listedCollections={listedCollections || []} />;
}
