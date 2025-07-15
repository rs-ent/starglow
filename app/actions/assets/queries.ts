/// app/queries/assetsQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";

import {
    getAsset,
    getAssets,
    getAssetsContract,
    getAssetsContracts,
} from "@/app/actions/assets/actions";
import { assetKeys } from "@/app/queryKeys";

import type {
    GetAssetInput,
    GetAssetsInput,
    GetAssetsContractInput,
    GetAssetsContractsInput,
    Pagination,
} from "@/app/actions/assets/actions";

export function useAssets(input?: GetAssetsInput) {
    return useQuery({
        queryKey: assetKeys.all,
        queryFn: () => getAssets(input),
        staleTime: 1000 * 60,
        gcTime: 1000 * 60,
    });
}

export function useAsset(input?: GetAssetInput) {
    return useQuery({
        queryKey: assetKeys.byId(input?.id || ""),
        queryFn: () => getAsset(input),
        enabled: Boolean(input?.id),
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60,
    });
}

export function useAssetByName(input?: GetAssetInput) {
    return useQuery({
        queryKey: assetKeys.byName(input?.name || ""),
        queryFn: () => getAsset(input),
        enabled: Boolean(input?.name),
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60,
    });
}

export function useAssetBySymbol(input?: GetAssetInput) {
    return useQuery({
        queryKey: assetKeys.bySymbol(input?.symbol || ""),
        queryFn: () => getAsset(input),
        enabled: Boolean(input?.symbol),
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60,
    });
}

export function useAssetByContractAddress(input?: GetAssetInput) {
    return useQuery({
        queryKey: assetKeys.byContractAddress(input?.contractAddress || ""),
        queryFn: () => getAsset(input),
        enabled: Boolean(input?.contractAddress),
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60,
    });
}

export function useAssetsContract(input?: GetAssetsContractInput) {
    return useQuery({
        queryKey: assetKeys.contract(input?.address || ""),
        queryFn: () => getAssetsContract(input),
        enabled: !!input,
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60,
    });
}

export function useAssetsContracts(
    input?: GetAssetsContractsInput,
    pagination?: Pagination
) {
    return useQuery({
        queryKey: assetKeys.contracts(input),
        queryFn: () => getAssetsContracts(input, pagination),
        enabled: !!input,
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60,
    });
}
