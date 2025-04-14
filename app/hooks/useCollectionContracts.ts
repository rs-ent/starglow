/// app/hooks/useCollectionContracts.ts

"use client";

import { useState } from "react";
import {
    useCollectionContractsQuery,
    useCollectionContractQuery,
    useCollectionStatusQuery,
} from "../queries/collectionContractsQueries";
import {
    useMintTokensMutation,
    useSetBaseURIMutation,
    useTogglePauseMutation,
    useToggleMintingMutation,
} from "../mutations/collectionContractsMutations";
import type {
    MintTokensParams,
    SetBaseURIParams,
    TogglePauseParams,
    ToggleMintingParams,
} from "../actions/collectionContracts";

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
