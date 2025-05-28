/// components/nfts/NFT.Contents.PreRegistration.tsx

import { Collection } from "@/app/actions/factoryContracts";

interface NFTContentsPreRegistrationProps {
    collection: Collection;
}

export default function NFTContentsPreRegistration({
    collection,
}: NFTContentsPreRegistrationProps) {
    return (
        <div>
            <h3>Pre Registration</h3>
        </div>
    );
}
