"use client";

import { useQuery } from "@tanstack/react-query";
import {
    getBlockchainNetworks,
    getFactoryContracts,
    getActiveFactoryContract,
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

export interface FactoryContract {
    id: string;
    address: string;
    networkId: string;
    deployedBy: string;
    deployedAt: Date;
    transactionHash: string;
    isActive: boolean;
    collections: string[];
    network: Network;
}

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
