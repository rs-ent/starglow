/// app/story/nft/mutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import {
    mint,
    registerAsIPAsset,
    mintAndRegisterAsIPAsset,
    batchRegisterAsIPAsset,
} from "./actions";

export function useMintMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: mint,
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.nft.list(),
            });
        },
        onError: (error, variables, context) => {
            console.error("Error minting NFT:", error);
        },
    });
}

export function useRegisterAsIPAssetMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: registerAsIPAsset,
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.nft.list(),
            });
        },
        onError: (error, variables, context) => {
            console.error("Error registering NFT as IP Asset:", error);
        },
    });
}

export function useBatchRegisterAsIPAssetMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: batchRegisterAsIPAsset,
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.nft.list(),
            });
        },
        onError: (error, variables, context) => {
            console.error("Error batch registering NFTs as IP Asset:", error);
        },
    });
}

export function useMintAndRegisterAsIPAssetMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: mintAndRegisterAsIPAsset,
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.nft.list(),
            });
        },
        onError: (error, variables, context) => {
            console.error(
                "Error minting and registering NFT as IP Asset:",
                error
            );
        },
    });
}
