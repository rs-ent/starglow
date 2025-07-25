/// app/queries/playerAssetsQueries.ts

"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

import {
    getPlayerAssets,
    getPlayerAsset,
    getPlayerAssetInstances,
} from "@/app/actions/playerAssets/actions";
import { playerAssetsKeys } from "@/app/queryKeys";

import type {
    GetPlayerAssetsInput,
    GetPlayerAssetInput,
    GetPlayerAssetInstancesInput,
    GetPlayerAssetsResult,
} from "@/app/actions/playerAssets/actions";

export function useGetPlayerAssets({
    getPlayerAssetsInput,
    realtime = false,
}: {
    getPlayerAssetsInput?: GetPlayerAssetsInput;
    realtime?: boolean;
}) {
    return useQuery({
        queryKey: playerAssetsKeys.balances(
            getPlayerAssetsInput?.filter?.playerId || "",
            getPlayerAssetsInput?.filter?.assetIds || []
        ),
        queryFn: () => getPlayerAssets(getPlayerAssetsInput),
        staleTime: realtime ? 0 : 500,
        gcTime: 1000,
        refetchOnWindowFocus: true,
        refetchIntervalInBackground: false,
    });
}

export function useInfinitePlayerAssetsQuery(input?: GetPlayerAssetsInput) {
    return useInfiniteQuery<
        GetPlayerAssetsResult,
        Error,
        GetPlayerAssetsResult,
        readonly ["playerAssets", "infinite", any],
        number
    >({
        queryKey: playerAssetsKeys.infinite(input),
        queryFn: ({ pageParam }: { pageParam: number }) =>
            getPlayerAssets({
                ...input,
                pagination: {
                    ...input?.pagination,
                    page: pageParam,
                    limit: input?.pagination?.limit || 12,
                },
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage: GetPlayerAssetsResult) => {
            if (lastPage.success && lastPage.data?.hasNext) {
                return lastPage.data.currentPage + 1;
            }
            return undefined;
        },
        getPreviousPageParam: (firstPage: GetPlayerAssetsResult) => {
            if (firstPage.success && firstPage.data?.hasPrevious) {
                return firstPage.data.currentPage - 1;
            }
            return undefined;
        },
        enabled: !!input?.filter?.playerId,
        staleTime: 500,
        gcTime: 1000,
        refetchOnWindowFocus: true,
    });
}

export function useGetPlayerAsset({
    getPlayerAssetInput,
}: {
    getPlayerAssetInput?: GetPlayerAssetInput;
}) {
    return useQuery({
        queryKey: playerAssetsKeys.detail(
            getPlayerAssetInput?.playerId || "",
            getPlayerAssetInput?.assetId || ""
        ),
        queryFn: () => getPlayerAsset(getPlayerAssetInput),
        staleTime: 500,
        gcTime: 1000,
        refetchOnWindowFocus: true,
    });
}

export function useGetPlayerAssetBalance({
    getPlayerAssetInput,
}: {
    getPlayerAssetInput?: GetPlayerAssetInput;
}) {
    return useQuery({
        queryKey: playerAssetsKeys.balance(
            getPlayerAssetInput?.playerId || "",
            getPlayerAssetInput?.assetId || ""
        ),
        queryFn: () => getPlayerAsset(getPlayerAssetInput),
        staleTime: 500,
        gcTime: 1000,
        refetchOnWindowFocus: true,
    });
}

export function useGetPlayerAssetInstances({
    getPlayerAssetInstancesInput,
}: {
    getPlayerAssetInstancesInput?: GetPlayerAssetInstancesInput;
}) {
    return useQuery({
        queryKey: playerAssetsKeys.instances(getPlayerAssetInstancesInput),
        queryFn: () => getPlayerAssetInstances(getPlayerAssetInstancesInput),
        enabled: !!getPlayerAssetInstancesInput,
        staleTime: 500,
        gcTime: 1000,
        refetchOnWindowFocus: true,
    });
}
