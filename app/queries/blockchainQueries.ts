"use client";

import { useQuery } from "@tanstack/react-query";

import {
    getBlockchainNetworks,
    getEscrowWallets,
    getActiveEscrowWallet,
    getBlockchainNetworkById,
} from "../actions/blockchain";
import { QUERY_KEYS } from "../queryKeys";

export interface Network {
    id: string;
    name: string;
    chainId: number;
    explorerUrl: string;
    rpcUrl: string;
    isTestnet: boolean;
    symbol: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface EscrowWallet {
    id: string;
    address: string;
    privateKey: string | null; // [ENCRYPTED] 표시되거나 null
    networkIds: string[];
    isActive: boolean;
    balance: Record<string, string>;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 블록체인 네트워크 목록 조회 쿼리 훅
 */
export function useBlockchainNetworks(includeInactive = false) {
    return useQuery({
        queryKey: [QUERY_KEYS.BLOCKCHAIN_NETWORKS, { includeInactive }],
        queryFn: async () => {
            const result = await getBlockchainNetworks(includeInactive);
            if (!result.success) {
                throw new Error(result.error || "Failed to fetch networks");
            }
            return result.networks;
        },
    });
}

/**
 * 블록체인 네트워크 상세 조회 쿼리 훅
 */
export function useBlockchainNetwork(id: string) {
    return useQuery({
        queryKey: [QUERY_KEYS.BLOCKCHAIN_NETWORKS, id],
        queryFn: async () => {
            const result = await getBlockchainNetworkById(id);
            if (!result.success || !result.data) {
                throw new Error(result.error || "Failed to fetch network");
            }
            return result.data;
        },
        enabled: !!id,
    });
}

/**
 * 에스크로 지갑 목록 조회 쿼리 훅
 */
export function useEscrowWallets() {
    return useQuery({
        queryKey: [QUERY_KEYS.ESCROW_WALLETS],
        queryFn: async () => {
            const result = await getEscrowWallets();
            if (!result.success || !result.data) {
                throw new Error(
                    result.error || "Failed to fetch escrow wallets"
                );
            }
            return result.data;
        },
    });
}

/**
 * 활성화된 에스크로 지갑 조회 쿼리 훅
 */
export function useActiveEscrowWallet() {
    return useQuery({
        queryKey: [QUERY_KEYS.ACTIVE_ESCROW_WALLET],
        queryFn: async () => {
            const result = await getActiveEscrowWallet();
            if (!result.success || !result.data) {
                throw new Error(
                    result.error || "Failed to fetch active escrow wallet"
                );
            }
            return result.data;
        },
    });
}
