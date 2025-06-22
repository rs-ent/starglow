/// app/hooks/usePlayerAssets.ts

"use client";

import {
    useUpdatePlayerAsset,
    useBatchUpdatePlayerAsset,
    useDeletePlayerAsset,
    useValidatePlayerAsset,
} from "../mutations/playerAssetsMutations";
import {
    useGetPlayerAssets,
    useGetPlayerAsset,
    useGetPlayerAssetBalance,
} from "../queries/playerAssetsQueries";

import type {
    GetPlayerAssetInput,
    GetPlayerAssetsInput,
} from "../actions/playerAssets";

export function usePlayerAssetsGet({
    getPlayerAssetsInput,
    getPlayerAssetInput,
}: {
    getPlayerAssetsInput?: GetPlayerAssetsInput;
    getPlayerAssetInput?: GetPlayerAssetInput;
}) {
    const {
        data: playerAssets,
        isLoading: isPlayerAssetsLoading,
        error: playerAssetsError,
    } = useGetPlayerAssets({
        getPlayerAssetsInput,
    });

    const {
        data: playerAsset,
        isLoading: isPlayerAssetLoading,
        error: playerAssetError,
    } = useGetPlayerAsset({
        getPlayerAssetInput,
    });

    const {
        data: playerBalance,
        isLoading: isPlayerBalanceLoading,
        error: playerBalanceError,
    } = useGetPlayerAssetBalance({
        getPlayerAssetInput,
    });

    return {
        playerAssets,
        isPlayerAssetsLoading,
        playerAssetsError,

        playerAsset,
        isPlayerAssetLoading,
        playerAssetError,

        playerBalance,
        isPlayerBalanceLoading,
        playerBalanceError,
    };
}

export function usePlayerAssetSet() {
    const {
        mutateAsync: updatePlayerAsset,
        isPending: isUpdatePlayerAssetPending,
        error: updatePlayerAssetError,
    } = useUpdatePlayerAsset();

    const {
        mutateAsync: batchUpdatePlayerAsset,
        isPending: isBatchUpdatePlayerAssetPending,
        error: batchUpdatePlayerAssetError,
    } = useBatchUpdatePlayerAsset();

    const {
        mutateAsync: deletePlayerAsset,
        isPending: isDeletePlayerAssetPending,
        error: deletePlayerAssetError,
    } = useDeletePlayerAsset();

    const {
        mutateAsync: validatePlayerAsset,
        isPending: isValidatePlayerAssetPending,
        error: validatePlayerAssetError,
    } = useValidatePlayerAsset();

    const isPending =
        isUpdatePlayerAssetPending ||
        isBatchUpdatePlayerAssetPending ||
        isDeletePlayerAssetPending ||
        isValidatePlayerAssetPending;

    const error =
        updatePlayerAssetError ||
        batchUpdatePlayerAssetError ||
        deletePlayerAssetError ||
        validatePlayerAssetError;

    return {
        updatePlayerAsset,
        isUpdatePlayerAssetPending,
        updatePlayerAssetError,

        batchUpdatePlayerAsset,
        isBatchUpdatePlayerAssetPending,
        batchUpdatePlayerAssetError,

        deletePlayerAsset,
        isDeletePlayerAssetPending,
        deletePlayerAssetError,

        validatePlayerAsset,
        isValidatePlayerAssetPending,
        validatePlayerAssetError,

        isPending,
        error,
    };
}
