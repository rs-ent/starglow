/// app/queries/nftQueries.ts

import { getOwnerByTokenIds, verifyOwnership } from "@/app/actions/nfts";
import { queryKeys } from "@/app/queryKeys";

export function getOwnerByTokenIdsQuery({
    contractAddress,
    tokenIds,
    networkId,
}: {
    contractAddress: string;
    tokenIds: string[];
    networkId: string;
}) {
    return {
        queryKey: queryKeys.nft.owner(contractAddress, tokenIds, networkId),
        queryFn: () =>
            getOwnerByTokenIds({
                contractAddress,
                tokenIds,
                networkId,
            }),
    };
}

export function verifyNFTOwnershipQuery({
    contractAddress,
    tokenIds,
    ownerAddress,
    networkId,
}: {
    contractAddress: string;
    tokenIds: string[];
    ownerAddress: string;
    networkId: string;
}) {
    return {
        queryKey: queryKeys.nft.ownership(
            contractAddress,
            tokenIds,
            ownerAddress,
            networkId
        ),
        queryFn: () =>
            verifyOwnership({
                contractAddress,
                tokenIds,
                ownerAddress,
                networkId,
            }),
    };
}
