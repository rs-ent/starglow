/// app/story/network/queries.ts

import { useQuery } from "@tanstack/react-query";

import {
    getStoryNetwork,
    getStoryNetworks
} from "./actions";
import { queryKeys } from "../queryKeys";

import type {
    getStoryNetworkInput,
    getStoryNetworksInput} from "./actions";

export function useGetStoryNetworkQuery(input?: getStoryNetworkInput) {
    return useQuery({
        queryKey: queryKeys.storyNetwork.network(input?.id ?? ""),
        queryFn: () => getStoryNetwork(input),
        enabled: Boolean(input),
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24,
    });
}

export function useGetStoryNetworksQuery(input?: getStoryNetworksInput) {
    return useQuery({
        queryKey: queryKeys.storyNetwork.list(),
        queryFn: () => getStoryNetworks(input),
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24,
    });
}
