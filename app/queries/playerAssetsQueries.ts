/// app/queries/playerAssetsQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";

import {
    getPlayerAssets,
    getPlayerAsset,
} from "../actions/playerAssets";
import { playerAssetsKeys } from "../queryKeys";

import type {
    GetPlayerAssetsInput,
    GetPlayerAssetInput} from "../actions/playerAssets";

export function useGetPlayerAssets({
    getPlayerAssetsInput,
}: {
    getPlayerAssetsInput?: GetPlayerAssetsInput;
}) {
    return useQuery({
        queryKey: playerAssetsKeys.balances(
            getPlayerAssetsInput?.filter?.playerId || "",
            getPlayerAssetsInput?.filter?.assetIds || []
        ),
        queryFn: () => getPlayerAssets(getPlayerAssetsInput),
        staleTime: 1000 * 60 * 1,
        gcTime: 1000 * 60 * 5,
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
        staleTime: 1000 * 60 * 5,
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
        staleTime: 1000 * 60 * 0.5,
        gcTime: 1000 * 60 * 1,
    });
}
