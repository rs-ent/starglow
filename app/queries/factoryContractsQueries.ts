/// app/queries/factoryContractsQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import {
    getFactories,
    getCollections,
    GetFactoryInput,
    GetCollectionInput,
} from "../actions/factoryContracts";
import { factoryKeys } from "../queryKeys";

export function useFactories(input: GetFactoryInput) {
    const queryKey = input.networkId
        ? factoryKeys.byNetwork(input.networkId)
        : factoryKeys.all;

    return useQuery({
        queryKey,
        queryFn: () => getFactories(input),
    });
}

export function useFactoryCollections(input: GetCollectionInput) {
    const getQueryKey = () => {
        if (input.factoryId) {
            return factoryKeys.collections.all(input.factoryId);
        }
        if (input.networkId) {
            return factoryKeys.collections.byNetwork(input.networkId);
        }
        return factoryKeys.collections.global;
    };

    return useQuery({
        queryKey: getQueryKey(),
        queryFn: () => getCollections(input),
        enabled: !!input,
    });
}

export function useEveryCollections() {
    const queryKey = factoryKeys.collections.global;

    return useQuery({
        queryKey,
        queryFn: () => getCollections(),
        enabled: true,
    });
}
