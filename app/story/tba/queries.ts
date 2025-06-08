/// app/story/tba/queries.ts

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import {
    getTBAContracts,
    getTBAContractsInput,
    getTBAAddresses,
    getTBAAddressesInput,
} from "./actions";

export function useGetTBAContractsQuery(input?: getTBAContractsInput) {
    return useQuery({
        queryKey: queryKeys.tba.contracts(input),
        queryFn: () => getTBAContracts(input),
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24,
    });
}

export function useGetTBAAddressesQuery(input: getTBAAddressesInput) {
    return useQuery({
        queryKey: queryKeys.tba.addresses(input.networkId),
        queryFn: () => getTBAAddresses(input),
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24,
        enabled: !!input.networkId,
    });
}
