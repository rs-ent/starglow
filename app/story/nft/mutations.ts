/// app/story/nft/mutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../queryKeys";
import {
    mint,
    registerAsIPAsset,
    mintAndRegisterAsIPAsset,
    batchRegisterAsIPAsset,
    tokenGating,
} from "./actions";

export function useMintMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: mint,
        onSuccess: (_data, _variables, _context) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.nft.list(),
            });
        },
        onError: (error, _variables, _context) => {
            console.error("Error minting NFT:", error);
        },
    });
}

export function useRegisterAsIPAssetMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: registerAsIPAsset,
        onSuccess: (_data, _variables, _context) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.nft.list(),
            });
        },
        onError: (error, _variables, _context) => {
            console.error("Error registering NFT as IP Asset:", error);
        },
    });
}

export function useBatchRegisterAsIPAssetMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: batchRegisterAsIPAsset,
        onSuccess: (_data, _variables, _context) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.nft.list(),
            });
        },
        onError: (error, _variables, _context) => {
            console.error("Error batch registering NFTs as IP Asset:", error);
        },
    });
}

export function useMintAndRegisterAsIPAssetMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: mintAndRegisterAsIPAsset,
        onSuccess: (_data, _variables, _context) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.nft.list(),
            });
        },
        onError: (error, _variables, _context) => {
            console.error(
                "Error minting and registering NFT as IP Asset:",
                error
            );
        },
    });
}
