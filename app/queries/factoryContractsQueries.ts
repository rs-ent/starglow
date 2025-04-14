/// app/queries/factoryContractsQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import {
    getFactoryContracts,
    getActiveFactoryContract,
} from "../actions/factoryContracts";
import { QUERY_KEYS } from "../queryKeys";

export interface FactoryContract {
    id: string;
    address: string;
    networkId: string;
    deployedBy: string;
    deployedAt: Date;
    transactionHash: string;
    isActive: boolean;
    collections: string[];
    network: {
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
}

/**
 * 네트워크 ID별 팩토리 컨트랙트 목록을 조회하는 쿼리 훅
 */
export function useFactoryContracts(networkId?: string) {
    return useQuery({
        queryKey: [QUERY_KEYS.FACTORY_CONTRACTS, { networkId }],
        queryFn: async () => {
            const result = await getFactoryContracts(networkId);
            if (!result.success || !result.data) {
                throw new Error(
                    result.error || "Failed to fetch factory contracts"
                );
            }
            return result.data;
        },
    });
}

/**
 * 특정 네트워크의 활성화된 팩토리 컨트랙트를 조회하는 쿼리 훅
 */
export function useActiveFactoryContract(networkId: string) {
    return useQuery({
        queryKey: [QUERY_KEYS.FACTORY_CONTRACTS, "active", networkId],
        queryFn: async () => {
            const result = await getActiveFactoryContract(networkId);
            if (!result.success || !result.data) {
                throw new Error(
                    result.error || "Failed to fetch active factory contract"
                );
            }
            return result.data;
        },
        enabled: !!networkId,
    });
}
