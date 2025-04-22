/// app/queries/collectionContractsQueries.ts

"use client";

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { collectionKeys } from "../queryKeys";
import {
    CollectionStatus,
    EstimateMintGasParams,
    EstimateMintGasResult,
    getCollectionContract,
    getCollectionContracts,
    listedCollections,
    getCollectionStatus,
    estimateMintGas,
} from "../actions/collectionContracts";

/**
 * 모든 컬렉션 컨트랙트 조회 쿼리 훅
 */
export function useCollectionContractsQuery() {
    return useQuery({
        queryKey: collectionKeys.lists(),
        queryFn: async () => {
            try {
                const result = await getCollectionContracts();
                if (!result?.success || !result?.data) {
                    throw new Error(
                        result.error || "Failed to fetch collections"
                    );
                }
                return result.data;
            } catch (error) {
                throw new Error("Failed to fetch collections");
            }
        },
    });
}

/**
 * 특정 ID의 컬렉션 컨트랙트 조회 쿼리 훅
 */
export function useCollectionContractQuery(id: string) {
    return useQuery({
        queryKey: collectionKeys.detail(id),
        queryFn: async () => {
            try {
                const result = await getCollectionContract(id);
                if (!result?.success || !result?.data) {
                    throw new Error(
                        result.error || "Failed to fetch collection"
                    );
                }
                return result;
            } catch (error) {
                throw new Error("Failed to fetch collection");
            }
        },
        enabled: !!id,
    });
}

/**
 * 컬렉션 컨트랙트 상태(paused, mintingEnabled) 조회 쿼리 훅
 */
export function useCollectionStatusQuery(address: string) {
    return useQuery({
        queryKey: collectionKeys.status(address),
        queryFn: async () => {
            try {
                const result = await getCollectionStatus(address);
                if (!result?.success || !result?.data) {
                    throw new Error(
                        result.error || "Failed to fetch collection status"
                    );
                }
                return result.data;
            } catch (error) {
                throw new Error("Failed to fetch collection status");
            }
        },
        enabled: !!address,
    });
}

/**
 * 민팅 가스비 예상 쿼리 훅
 */
export function useEstimateMintGasQuery(params: EstimateMintGasParams) {
    return useQuery({
        queryKey: collectionKeys.estimateMintGas(
            params.address,
            params.to,
            params.quantity
        ),
        queryFn: async () => {
            try {
                const result = (await estimateMintGas(
                    params
                )) as EstimateMintGasResult;
                if (!result?.success || !result?.data) {
                    throw new Error(
                        result.error || "Failed to estimate gas cost"
                    );
                }
                return result.data;
            } catch (error) {
                throw new Error("Failed to estimate gas cost");
            }
        },
        enabled: !!params.address && !!params.to && params.quantity > 0,
    });
}

/**
 * 컬렉션 설정 조회 쿼리 훅
 */
export interface CollectionSettings {
    id: string;
    price: number;
    circulation: number;
}

export function useCollectionSettingsQuery(collectionId: string) {
    return useQuery({
        queryKey: collectionKeys.settings(collectionId),
        queryFn: async () => {
            const result = await getCollectionContract(collectionId);
            console.log("useCollectionSettingsQuery result", result);
            if (!result?.success || !result?.data) {
                throw new Error(result.error || "Failed to fetch collection");
            }
            const data = result.data;
            return {
                id: data.id,
                price: data.price,
                circulation: data.circulation,
            };
        },
        enabled: !!collectionId,
    });
}

/**
 * 목록화된 컬렉션 조회 쿼리 훅
 */
export function useListedCollectionsQuery() {
    return useQuery({
        queryKey: collectionKeys.listed(),
        queryFn: async () => {
            try {
                const result = await listedCollections();
                if (!result?.length) {
                    throw new Error("No listed collections found");
                }
                return result;
            } catch (error) {
                throw new Error("Failed to fetch listed collections");
            }
        },
    });
}
