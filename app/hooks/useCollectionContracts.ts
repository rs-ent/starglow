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
    SetBaseURIParams,
    TogglePauseParams,
    ToggleMintingParams,
} from "../actions/collectionContracts";
import { useToast } from "./useToast";

export interface CollectionContract {
    id: string;
    address: string;
    name: string;
    symbol: string;
    factoryAddress?: string;
    network?: {
        id: string;
        name: string;
        chainId: number;
        rpcUrl: string;
        explorerUrl: string;
        symbol: string;
        isTestnet: boolean;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
    };
    maxSupply: number;
    mintPrice: string;
    baseURI?: string;
    contractURI?: string;
    createdAt: Date;
    txHash?: string | null;
    factory?: any;
    paused?: boolean;
    mintingEnabled?: boolean;
    price: number;
    circulation: number;
    mintedCount: number;
    isListed: boolean;
}

/**
 * 컬렉션 컨트랙트 관리를 위한 통합 훅
 */
export function useCollectionContractsManager() {
    const [selectedCollectionId, setSelectedCollectionId] = useState<
        string | null
    >(null);
    const [privateKey, setPrivateKey] = useState("");

    // 쿼리
    const collectionsQuery = useCollectionContractsQuery();
    const selectedCollectionQuery = selectedCollectionId
        ? useCollectionContractQuery(selectedCollectionId)
        : { data: null, isLoading: false, error: null };

    // 선택된 컬렉션
    const selectedCollection = selectedCollectionId
        ? selectedCollectionQuery.data
        : null;

    // 뮤테이션
    const mintTokensMutation = useMintTokensMutation();
    const setBaseURIMutation = useSetBaseURIMutation();
    const togglePauseMutation = useTogglePauseMutation();
    const toggleMintingMutation = useToggleMintingMutation();

    // 상태 로딩 및 에러 통합
    const isLoading =
        collectionsQuery.isLoading ||
        (selectedCollectionId ? selectedCollectionQuery.isLoading : false) ||
        mintTokensMutation.isPending ||
        setBaseURIMutation.isPending ||
        togglePauseMutation.isPending ||
        toggleMintingMutation.isPending;

    const error =
        collectionsQuery.error ||
        (selectedCollectionId ? selectedCollectionQuery.error : null) ||
        mintTokensMutation.error ||
        setBaseURIMutation.error ||
        togglePauseMutation.error ||
        toggleMintingMutation.error;

    // Mint tokens
    const mintTokens = async (params: Omit<MintTokensParams, "privateKey">) => {
        if (!privateKey) {
            throw new Error("Private key is required");
        }

        return mintTokensMutation.mutateAsync({
            ...params,
            privateKey,
        });
    };

    // Set base URI
    const setBaseURI = async (params: Omit<SetBaseURIParams, "privateKey">) => {
        if (!privateKey) {
            throw new Error("Private key is required");
        }

        return setBaseURIMutation.mutateAsync({
            ...params,
            privateKey,
        });
    };

    // Toggle pause state
    const togglePause = async (
        params: Omit<TogglePauseParams, "privateKey">
    ) => {
        if (!privateKey) {
            throw new Error("Private key is required");
        }

        return togglePauseMutation.mutateAsync({
            ...params,
            privateKey,
        });
    };

    // Toggle minting status
    const toggleMinting = async (
        params: Omit<ToggleMintingParams, "privateKey">
    ) => {
        if (!privateKey) {
            throw new Error("Private key is required");
        }

        return toggleMintingMutation.mutateAsync({
            ...params,
            privateKey,
        });
    };

    return {
        // 컬렉션 데이터
        collections: collectionsQuery.data,
        selectedCollection,
        setSelectedCollection: setSelectedCollectionId,

        // 로딩 & 에러
        isLoading,
        error,
        isError: !!error,

        // 리프레시
        refetch: collectionsQuery.refetch,

        // 지갑 상태
        setPrivateKey,

        // 컬렉션 작업
        mintTokens,
        setBaseURI,
        togglePause,
        toggleMinting,

        // 작업 상태
        isMinting: mintTokensMutation.isPending,
        isSettingBaseURI: setBaseURIMutation.isPending,
        isTogglingPause: togglePauseMutation.isPending,
        isTogglingMinting: toggleMintingMutation.isPending,

        // 리셋
        reset: () => {
            mintTokensMutation.reset();
            setBaseURIMutation.reset();
            togglePauseMutation.reset();
            toggleMintingMutation.reset();
        },
    };
}

/**
 * 특정 컬렉션 상태(paused, mintingEnabled) 조회 훅
 */
export function useCollectionStatus(
    address: string,
    networkId: string,
    rpcUrl: string
) {
    return useCollectionStatusQuery(address, networkId, rpcUrl);
}

export function useCollectionSettings(collectionId: string) {
    const toast = useToast();

    const {
        data: settings,
        isLoading,
        error,
    } = useCollectionSettingsQuery(collectionId);

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

            if (!result.success) {
                throw new Error(result.error || "Failed to update settings");
            }

            toast.success("Collection settings updated successfully");
        } catch (error) {
            toast.error("Failed to update collection settings");
        }
    };

    return {
        settings,
        isLoading,
        error,
        updateSettings,
        isUpdating: updateSettingsMutation.isPending,
    };
}

export function useCollectionFunctions(collection: CollectionContract) {
    const toast = useToast();
    const [lastOperation, setLastOperation] = useState<{
        success: boolean;
        message: string;
        txHash?: string;
    } | null>(null);

    const { data: status, isLoading: isStatusLoading } =
        useCollectionStatusQuery(
            collection.address,
            collection.network?.id || "",
            collection.network?.rpcUrl || ""
        );

    const estimateGas = (to: string, quantity: number, privateKey?: string) => {
        return useEstimateMintGasQuery(
            collection.address,
            collection.network?.id || "",
            to,
            quantity,
            privateKey
        );
    };

    const mintTokensMutation = useMintTokensMutation();
    const togglePauseMutation = useTogglePauseMutation();
    const toggleMintingMutation = useToggleMintingMutation();

    const mintTokens = async (params: {
        to: string;
        quantity: number;
        privateKey: string;
        gasLimit?: string;
        gasPrice?: string;
    }) => {
        try {
            const result = await mintTokensMutation.mutateAsync({
                collectionAddress: collection.address,
                networkId: collection.network?.id || "",
                ...params,
            });

            handleOperationResult(
                result,
                `Successfully minted ${result.data?.quantity} tokens`
            );
            return result;
        } catch (error) {
            toast.error("Failed to mint tokens");
            handleOperationError(error, "Failed to mint tokens");
            throw error;
        }
    };

    const togglePause = async (params: {
        pause: boolean;
        privateKey: string;
    }) => {
        try {
            const result = await togglePauseMutation.mutateAsync({
                collectionAddress: collection.address,
                networkId: collection.network?.id || "",
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

    const toggleMinting = async (params: {
        enabled: boolean;
        privateKey: string;
    }) => {
        try {
            const result = await toggleMintingMutation.mutateAsync({
                collectionAddress: collection.address,
                networkId: collection.network?.id || "",
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

    const handleOperationResult = (result: any, successMessage: string) => {
        if (result.success) {
            setLastOperation({
                success: true,
                message: successMessage,
                txHash: result.data?.transactionHash,
            });
            toast.success(successMessage);
        } else {
            throw new Error(result.error || "Unknown error");
        }
    };

    const handleOperationError = (error: unknown, operation: string) => {
        const errorMessage =
            error instanceof Error
                ? error.message
                : `Unknown error ${operation}`;
        setLastOperation({
            success: false,
            message: errorMessage,
        });
        toast.error(errorMessage);
    };

    return {
        // Status
        status,
        isStatusLoading,
        lastOperation,

        // Operations
        estimateGas,
        mintTokens,
        togglePause,
        toggleMinting,

        // Mutation states
        isMinting: mintTokensMutation.isPending,
        isTogglingPause: togglePauseMutation.isPending,
        isTogglingMinting: toggleMintingMutation.isPending,

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
        isEmpty: listedCollections?.length === 0,
    };
}
