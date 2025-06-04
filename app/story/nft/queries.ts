/// app/story/nft/queries.ts

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import {
    getNFTs,
    getNFTsInput,
    getOwners,
    getOwnersInput,
    getCirculation,
    getCirculationInput,
} from "./actions";

export function useNFTsQuery(input?: getNFTsInput) {
    return useQuery({
        queryKey: queryKeys.nft.list(input),
        queryFn: () => getNFTs(input),
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24,
    });
}
export function useOwnersQuery(input?: getOwnersInput) {
    return useQuery({
        queryKey: queryKeys.nft.owners(input?.tokenIds || []),
        queryFn: () => getOwners(input),
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24,
        enabled: !!input?.tokenIds,
    });
}

export function useCirculationQuery(input?: getCirculationInput) {
    return useQuery({
        queryKey: queryKeys.nft.circulation(input?.spgAddress || ""),
        queryFn: () => getCirculation(input),
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24,
        enabled: !!input?.spgAddress,
    });
}
