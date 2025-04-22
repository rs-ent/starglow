/// app/hooks/useCollectionContracts.ts

"use client";

import { useState } from "react";
import {
    useCollectionContractsQuery,
    useCollectionContractQuery,
    useCollectionStatusQuery,
    useCollectionSettingsQuery,
    useEstimateMintGasQuery,
    useListedCollectionsQuery,
} from "../queries/collectionContractsQueries";
import {
    useMintTokensMutation,
    useSetBaseURIMutation,
    useTogglePauseMutation,
    useToggleMintingMutation,
    useUpdateCollectionSettingsMutation,
} from "../mutations/collectionContractsMutations";
import type {
    MintTokensParams,
    TogglePauseParams,
    ToggleMintingParams,
    EstimateMintGasParams,
} from "../actions/collectionContracts";
import type { CollectionContract } from "@prisma/client";
import { useToast } from "./useToast";

export function useCollectionContractsManager() {
    const [selectedCollection, setSelectedCollection] =
        useState<CollectionContract | null>(null);
    const [privateKey, setPrivateKey] = useState("");

    const collectionsQuery = useCollectionContractsQuery();
    const selectedCollectionQuery = useCollectionContractQuery(
        selectedCollection?.id || ""
    );

    const mintTokensMutation = useMintTokensMutation();
    const setBaseURIMutation = useSetBaseURIMutation();
    const togglePauseMutation = useTogglePauseMutation();
    const toggleMintingMutation = useToggleMintingMutation();

    const isLoading =
        collectionsQuery.isLoading ||
        selectedCollectionQuery.isLoading ||
        mintTokensMutation.isPending ||
        setBaseURIMutation.isPending ||
        togglePauseMutation.isPending ||
        toggleMintingMutation.isPending;

    const error =
        collectionsQuery.error ||
        selectedCollectionQuery.error ||
        mintTokensMutation.error ||
        setBaseURIMutation.error ||
        togglePauseMutation.error ||
        toggleMintingMutation.error;

    return {
        // Data
        collections: collectionsQuery.data,
        selectedCollection: selectedCollectionQuery.data,
        setSelectedCollection,

        // State
        isLoading,
        error,
        isError: !!error,

        // Wallet
        setPrivateKey,
        privateKey,

        // Utilities
        refetch: collectionsQuery.refetch,
        reset: () => {
            mintTokensMutation.reset();
            setBaseURIMutation.reset();
            togglePauseMutation.reset();
            toggleMintingMutation.reset();
        },
    };
}

export function useCollectionSettings(collectionId: string) {
    const toast = useToast();
    const { data: settings, isLoading } =
        useCollectionSettingsQuery(collectionId);
    const updateSettingsMutation = useUpdateCollectionSettingsMutation();

    const updateSettings = async (
        price: number,
        circulation: number,
        isListed: boolean
    ) => {
        try {
            const result = await updateSettingsMutation.mutateAsync({
                collectionId,
                price,
                circulation,
                isListed,
            });

            toast.success("Collection settings updated successfully");
            return result;
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to update settings";
            toast.error(message);
            throw error;
        }
    };

    return {
        settings,
        isLoading,
        updateSettings,
        isUpdating: updateSettingsMutation.isPending,
    };
}

type OperationResult = {
    success: boolean;
    message: string;
    txHash?: string;
};

export function useCollectionFunctions(collection: CollectionContract) {
    const toast = useToast();
    const [lastOperation, setLastOperation] = useState<OperationResult | null>(
        null
    );

    const { data: status, isLoading: isStatusLoading } =
        useCollectionStatusQuery(collection.address);
    const mintTokensMutation = useMintTokensMutation();
    const togglePauseMutation = useTogglePauseMutation();
    const toggleMintingMutation = useToggleMintingMutation();

    const handleOperationResult = (result: any, successMessage: string) => {
        const operationResult: OperationResult = {
            success: true,
            message: successMessage,
            txHash: result.transactionHash,
        };
        setLastOperation(operationResult);
        toast.success(successMessage);
    };

    const handleOperationError = (error: unknown, operation: string) => {
        const message =
            error instanceof Error
                ? error.message
                : `Unknown error ${operation}`;
        const operationResult: OperationResult = {
            success: false,
            message,
        };
        setLastOperation(operationResult);
        toast.error(message);
    };

    const mintTokens = async (params: MintTokensParams) => {
        try {
            const result = await mintTokensMutation.mutateAsync({
                ...params,
            });

            handleOperationResult(
                result,
                `Successfully minted ${params.quantity} tokens`
            );
            return result;
        } catch (error) {
            handleOperationError(error, "minting tokens");
            throw error;
        }
    };

    const togglePause = async (params: TogglePauseParams) => {
        try {
            const result = await togglePauseMutation.mutateAsync({
                ...params,
            });

            handleOperationResult(
                result,
                `Successfully ${
                    params.pause ? "paused" : "unpaused"
                } the collection`
            );
            return result;
        } catch (error) {
            handleOperationError(
                error,
                `${params.pause ? "pausing" : "unpausing"} collection`
            );
            throw error;
        }
    };

    const toggleMinting = async (params: ToggleMintingParams) => {
        try {
            const result = await toggleMintingMutation.mutateAsync({
                ...params,
            });

            handleOperationResult(
                result,
                `Successfully ${
                    params.enabled ? "enabled" : "disabled"
                } minting`
            );
            return result;
        } catch (error) {
            handleOperationError(
                error,
                `${params.enabled ? "enabling" : "disabling"} minting`
            );
            throw error;
        }
    };

    return {
        // Status
        status,
        lastOperation,

        // Operations
        mintTokens,
        togglePause,
        toggleMinting,

        // Mutation states
        isMinting: mintTokensMutation.isPending,
        isTogglingPause: togglePauseMutation.isPending,
        isTogglingMinting: toggleMintingMutation.isPending,
        isStatusLoading,

        // Reset
        resetLastOperation: () => setLastOperation(null),
    };
}

export function useListedCollections() {
    const {
        data: listedCollections,
        isLoading,
        isError,
        error,
        refetch,
    } = useListedCollectionsQuery();

    return {
        listedCollections,
        isLoading,
        isError,
        error,
        refetch,
        isEmpty: !listedCollections?.length,
    };
}

export function useEstimateMintGas(params: EstimateMintGasParams) {
    const { data: gasEstimate, isLoading: isGasEstimateLoading } =
        useEstimateMintGasQuery(params);

    console.log("gasEstimate", gasEstimate);

    return {
        gasEstimate,
        isGasEstimateLoading,
    };
}
