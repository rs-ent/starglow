/// app/queries/assetsQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";

import {
    getAsset,
    getAssets,
    getAssetsContract,
    getAssetsContracts,
} from "@/app/actions/assets";
import { assetKeys } from "@/app/queryKeys";

import type {
    GetAssetInput,
    GetAssetsInput,
    GetAssetsContractInput,
    GetAssetsContractsInput,
    Pagination,
} from "@/app/actions/assets";

export function useAssets(input?: GetAssetsInput) {
    return useQuery({
        queryKey: assetKeys.all,
        queryFn: () => getAssets(input),
        staleTime: 1000 * 60 * 60 * 1,
    });
}

export function useAsset(input?: GetAssetInput) {
    return useQuery({
        queryKey: assetKeys.byId(input?.id || ""),
        queryFn: () => getAsset(input),
        enabled: Boolean(input?.id),
    });
}

export function useAssetByName(input?: GetAssetInput) {
    return useQuery({
        queryKey: assetKeys.byName(input?.name || ""),
        queryFn: () => getAsset(input),
        enabled: Boolean(input?.name),
    });
}

export function useAssetBySymbol(input?: GetAssetInput) {
    return useQuery({
        queryKey: assetKeys.bySymbol(input?.symbol || ""),
        queryFn: () => getAsset(input),
        enabled: Boolean(input?.symbol),
    });
}

export function useAssetByContractAddress(input?: GetAssetInput) {
    return useQuery({
        queryKey: assetKeys.byContractAddress(input?.contractAddress || ""),
        queryFn: () => getAsset(input),
        enabled: Boolean(input?.contractAddress),
    });
}

export function useAssetsContract(input?: GetAssetsContractInput) {
    return useQuery({
        queryKey: assetKeys.contract(input?.address || ""),
        queryFn: () => getAssetsContract(input),
        enabled: !!input,
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
    });
}
