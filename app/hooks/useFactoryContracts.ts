/// app/hooks/useFactoryContracts.ts

"use client";

import { useState } from "react";
import {
    useFactoryContracts,
    useActiveFactoryContract,
} from "../queries/factoryContractsQueries";
import {
    useSaveFactoryContract,
    useUpdateFactoryContractCollections,
    useDeployFactoryContract,
    useCreateCollection,
} from "../mutations/factoryContractsMutations";

// 타입 정의 추가
export interface FactoryContract {
    id: string;
    address: string;
    networkId: string;
    name?: string;
    version?: string;
    verified?: boolean;
    deployedAt: Date;
    network: {
        symbol: string;
        name: string;
        id: string;
        chainId: number;
        rpcUrl: string;
        explorerUrl: string;
        isTestnet: boolean;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
    };
}

/**
 * 팩토리 컨트랙트 관리를 위한 통합 훅
 */
export function useFactoryContractsManager(networkId?: string) {
    const [selectedContractId, setSelectedContractId] = useState<string | null>(
        null
    );

    // 쿼리
    const contractsQuery = useFactoryContracts(networkId);
    const activeContractQuery = networkId
        ? useActiveFactoryContract(networkId)
        : { data: null, isLoading: false, error: null };

    // 뮤테이션
    const saveContractMutation = useSaveFactoryContract();
    const updateCollectionsMutation = useUpdateFactoryContractCollections();
    const deployContractMutation = useDeployFactoryContract();
    const createCollectionMutation = useCreateCollection();

    // 선택된 컨트랙트 얻기
    const selectedContract = selectedContractId
        ? contractsQuery.data?.find((c) => c.id === selectedContractId)
        : null;

    // 로딩 및 에러 상태 통합
    const isLoading =
        contractsQuery.isLoading ||
        (activeContractQuery.isLoading && !!networkId) ||
        saveContractMutation.isPending ||
        updateCollectionsMutation.isPending ||
        deployContractMutation.isPending ||
        createCollectionMutation.isPending;

    const error =
        contractsQuery.error ||
        activeContractQuery.error ||
        saveContractMutation.error ||
        updateCollectionsMutation.error ||
        deployContractMutation.error ||
        createCollectionMutation.error;

    return {
        // 쿼리 결과
        contracts: (contractsQuery.data || []) as FactoryContract[],
        activeContract: activeContractQuery.data || null,
        selectedContract,

        // 상태 관리
        setSelectedContract: setSelectedContractId,

        // 로딩 & 에러
        isLoading,
        error,
        isError: !!error,

        // refetch 함수 추가
        refetch: contractsQuery.refetch,

        // 뮤테이션
        saveContract: saveContractMutation.mutate,
        updateCollections: updateCollectionsMutation.mutate,
        deployContract: deployContractMutation.mutate,
        createCollection: createCollectionMutation.mutate,

        // 뮤테이션 상태
        isSavingContract: saveContractMutation.isPending,
        isUpdatingCollections: updateCollectionsMutation.isPending,
        isDeployingContract: deployContractMutation.isPending,
        isCreatingCollection: createCollectionMutation.isPending,

        // 리셋
        reset: () => {
            saveContractMutation.reset();
            updateCollectionsMutation.reset();
            deployContractMutation.reset();
            createCollectionMutation.reset();
        },
    };
}

/**
 * 팩토리 컨트랙트 배포를 위한 독립 훅
 */
export function useDeployFactory() {
    const deployMutation = useDeployFactoryContract();

    return {
        deployFactory: deployMutation.mutate,
        isDeploying: deployMutation.isPending,
        error: deployMutation.error,
        isError: !!deployMutation.error,
        reset: deployMutation.reset,
        data: deployMutation.data,
    };
}

/**
 * 팩토리를 통한 컬렉션 생성을 위한 독립 훅
 */
export function useFactoryCreateCollection() {
    const createMutation = useCreateCollection();

    return {
        createCollection: createMutation.mutate,
        mutateAsync: createMutation.mutateAsync,
        isCreating: createMutation.isPending,
        error: createMutation.error,
        isError: !!createMutation.error,
        reset: createMutation.reset,
        data: createMutation.data,
    };
}
