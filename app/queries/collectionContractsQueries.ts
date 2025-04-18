/// app/queries/collectionContractsQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { collectionKeys } from "../queryKeys";
import {
    getCollectionContracts,
    getCollectionContract,
    listedCollections,
} from "../actions/collectionContracts";
import { createPublicClient, http } from "viem";
import { COLLECTION_ABI } from "../blockchain/abis/Collection";
import { QUERY_KEYS } from "../queryKeys";

/**
 * 모든 컬렉션 컨트랙트 조회 쿼리 훅
 */
export function useCollectionContractsQuery() {
    return useQuery({
        queryKey: [QUERY_KEYS.COLLECTION_CONTRACTS],
        queryFn: async () => {
            const result = await getCollectionContracts();
            if (!result.success || !result.data) {
                throw new Error(result.error || "Failed to fetch collections");
            }
            return result.data;
        },
    });
}

/**
 * 특정 ID의 컬렉션 컨트랙트 조회 쿼리 훅
 */
export function useCollectionContractQuery(id: string) {
    return useQuery({
        queryKey: [QUERY_KEYS.COLLECTION_CONTRACTS, id],
        queryFn: async () => {
            const result = await getCollectionContract(id);
            if (!result.success || !result.data) {
                throw new Error(result.error || "Failed to fetch collection");
            }
            return result.data;
        },
        enabled: !!id,
    });
}

/**
 * 컬렉션 컨트랙트 상태(paused, mintingEnabled) 조회 쿼리 훅
 */
export function useCollectionStatusQuery(
    address: string,
    networkId: string,
    rpcUrl: string
) {
    return useQuery({
        queryKey: collectionKeys.status(address),
        queryFn: async () => {
            if (!address || !rpcUrl)
                return { paused: false, mintingEnabled: false };

            const publicClient = createPublicClient({
                transport: http(rpcUrl),
            });

            try {
                const [paused, mintingEnabled] = await Promise.all([
                    publicClient.readContract({
                        address: address as `0x${string}`,
                        abi: COLLECTION_ABI,
                        functionName: "paused",
                    }),
                    publicClient.readContract({
                        address: address as `0x${string}`,
                        abi: COLLECTION_ABI,
                        functionName: "mintingEnabled",
                    }),
                ]);

                return {
                    paused: paused as boolean,
                    mintingEnabled: mintingEnabled as boolean,
                };
            } catch (error) {
                console.error("Error reading collection status:", error);
                return { paused: false, mintingEnabled: false };
            }
        },
        enabled: !!address && !!networkId && !!rpcUrl,
    });
}

/**
 * 민팅 가스비 예상 쿼리 훅
 */
export function useEstimateMintGasQuery(
    collectionAddress: string,
    networkId: string,
    to: string,
    quantity: number,
    privateKey?: string
) {
    return useQuery({
        queryKey: collectionKeys.estimateMintGas(
            collectionAddress,
            to,
            quantity
        ),
        queryFn: async () => {
            try {
                const { estimateMintGas } = await import(
                    "../actions/collectionContracts"
                );
                const result = await estimateMintGas({
                    collectionAddress,
                    networkId,
                    to,
                    quantity,
                    privateKey,
                });

                if (!result.success || !result.data) {
                    throw new Error(
                        result.error || "Failed to estimate gas cost"
                    );
                }

                return result.data;
            } catch (error) {
                console.error("Error in useEstimateMintGasQuery:", error);
                throw error;
            }
        },
        enabled: !!collectionAddress && !!networkId && !!to && quantity > 0,
    });
}

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
            if (!result.success || !result.data) {
                throw new Error(result.error || "Failed to fetch collection");
            }
            return {
                id: result.data.id,
                price: result.data.price,
                circulation: result.data.circulation,
            };
        },
        enabled: !!collectionId,
    });
}

export function useListedCollectionsQuery() {
    return useQuery({
        queryKey: collectionKeys.listed(),
        queryFn: async () => {
            const result = await listedCollections();
            if (result.length === 0) {
                throw new Error("No listed collections found");
            }
            return result;
        },
    });
}
