/// app/hooks/usePlayerAssets.ts

"use client";

import {
    useUpdatePlayerAsset,
    useBatchUpdatePlayerAsset,
    useDeletePlayerAsset,
    useValidatePlayerAsset,
    useGrantPlayerAssetInstances,
    useWithdrawPlayerAssetInstances,
    useAutoExpirePlayerAssetInstances,
} from "@/app/actions/playerAssets/mutations";
import {
    useGetPlayerAssets,
    useGetPlayerAsset,
    useGetPlayerAssetBalance,
    useGetPlayerAssetInstances,
} from "@/app/actions/playerAssets/queries";

import type {
    GetPlayerAssetInput,
    GetPlayerAssetsInput,
    GetPlayerAssetInstancesInput,
} from "@/app/actions/playerAssets/actions";

export function usePlayerAssetsGet({
    getPlayerAssetsInput,
    getPlayerAssetInput,
    getPlayerAssetInstancesInput,
    realtime = false,
}: {
    getPlayerAssetsInput?: GetPlayerAssetsInput;
    getPlayerAssetInput?: GetPlayerAssetInput;
    getPlayerAssetInstancesInput?: GetPlayerAssetInstancesInput;
    realtime?: boolean;
}) {
    const {
        data: playerAssets,
        isLoading: isPlayerAssetsLoading,
        error: playerAssetsError,
        refetch: refetchPlayerAssets,
    } = useGetPlayerAssets({
        getPlayerAssetsInput,
        realtime,
    });

    const {
        data: playerAsset,
        isLoading: isPlayerAssetLoading,
        error: playerAssetError,
        refetch: refetchPlayerAsset,
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

    const {
        data: playerAssetInstances,
        isLoading: isPlayerAssetInstancesLoading,
        error: playerAssetInstancesError,
    } = useGetPlayerAssetInstances({
        getPlayerAssetInstancesInput,
    });

    return {
        playerAssets,
        isPlayerAssetsLoading,
        playerAssetsError,
        refetchPlayerAssets,

        playerAsset,
        isPlayerAssetLoading,
        playerAssetError,
        refetchPlayerAsset,

        playerBalance,
        isPlayerBalanceLoading,
        playerBalanceError,

        playerAssetInstances,
        isPlayerAssetInstancesLoading,
        playerAssetInstancesError,
    };
}

export function usePlayerAssetSet() {
    const {
        mutate: updatePlayerAssetBackground,
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

    const {
        mutateAsync: grantPlayerAssetInstances,
        isPending: isGrantPlayerAssetInstancesPending,
        error: grantPlayerAssetInstancesError,
    } = useGrantPlayerAssetInstances();

    const {
        mutateAsync: withdrawPlayerAssetInstances,
        isPending: isWithdrawPlayerAssetInstancesPending,
        error: withdrawPlayerAssetInstancesError,
    } = useWithdrawPlayerAssetInstances();

    const {
        mutateAsync: autoExpirePlayerAssetInstances,
        isPending: isAutoExpirePlayerAssetInstancesPending,
        error: autoExpirePlayerAssetInstancesError,
    } = useAutoExpirePlayerAssetInstances();

    const isPending =
        isUpdatePlayerAssetPending ||
        isBatchUpdatePlayerAssetPending ||
        isDeletePlayerAssetPending ||
        isValidatePlayerAssetPending ||
        isGrantPlayerAssetInstancesPending ||
        isWithdrawPlayerAssetInstancesPending ||
        isAutoExpirePlayerAssetInstancesPending;

    const error =
        updatePlayerAssetError ||
        batchUpdatePlayerAssetError ||
        deletePlayerAssetError ||
        validatePlayerAssetError ||
        grantPlayerAssetInstancesError ||
        withdrawPlayerAssetInstancesError ||
        autoExpirePlayerAssetInstancesError;

    return {
        updatePlayerAssetBackground,
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

        grantPlayerAssetInstances,
        isGrantPlayerAssetInstancesPending,
        grantPlayerAssetInstancesError,

        withdrawPlayerAssetInstances,
        isWithdrawPlayerAssetInstancesPending,
        withdrawPlayerAssetInstancesError,

        autoExpirePlayerAssetInstances,
        isAutoExpirePlayerAssetInstancesPending,
        autoExpirePlayerAssetInstancesError,

        isPending,
        error,
    };
}
