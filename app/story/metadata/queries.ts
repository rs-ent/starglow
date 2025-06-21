/// app/story/metadata/queries.ts

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../queryKeys";
import {
    getMetadata,
    getMetadataList
} from "./actions";

import type {
    getMetadataInput,
    getMetadataListInput} from "./actions";

export function useGetMetadataQuery(input?: getMetadataInput) {
    return useQuery({
        queryKey: queryKeys.metadata.ipfs(
            input?.id || input?.cid || input?.url || ""
        ),
        queryFn: () => getMetadata(input),
        enabled: Boolean(input),
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24,
    });
}

export function useGetMetadataListQuery(input?: getMetadataListInput) {
    return useQuery({
        queryKey: queryKeys.metadata.list(input),
        queryFn: () => getMetadataList(input),
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24,
    });
}
