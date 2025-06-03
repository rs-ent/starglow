/// app/story/spg/queries.ts

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import {
    getSPGContracts,
    getSPGContractsInput,
    getSPG,
    getSPGInput,
    getSPGs,
    getSPGsInput,
} from "./actions";

export function useGetSPGContractsQuery(input?: getSPGContractsInput) {
    return useQuery({
        queryKey: queryKeys.spg.contracts(),
        queryFn: () => getSPGContracts(input),
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24,
    });
}

export function useGetSPGQuery(input?: getSPGInput) {
    return useQuery({
        queryKey: queryKeys.spg.collection(input),
        queryFn: () => getSPG(input),
        enabled: !!input,
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24,
    });
}

export function useGetSPGsQuery(input?: getSPGsInput) {
    return useQuery({
        queryKey: queryKeys.spg.collection(input),
        queryFn: () => getSPGs(input),
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24,
    });
}
