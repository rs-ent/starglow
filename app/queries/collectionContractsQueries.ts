/// app/queries/collectionContractsQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { collectionKeys } from "../queryKeys";
import {
    getCollectionContracts,
    getCollectionContract,
} from "../actions/collectionContracts";
import { createPublicClient, http } from "viem";
import { COLLECTION_ABI } from "../blockchain/abis/Collection";
import { QUERY_KEYS } from "../queryKeys";

// 타입 정의
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
}

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
