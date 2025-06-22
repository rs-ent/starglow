/// app/mutations/nftsMutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { verifyOwnership, getOwnerByTokenIds } from "@/app/actions/nfts";
import { queryKeys } from "@/app/queryKeys";

export function useVerifyNFTOwnershipMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: verifyOwnership,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.nft.ownership(
                        variables.contractAddress,
                        variables.tokenIds,
                        variables.ownerAddress,
                        variables.networkId
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useGetOwnerByTokenIdsMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: getOwnerByTokenIds,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.nft.owner(
                        variables.contractAddress,
                        variables.tokenIds,
                        variables.networkId
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}
