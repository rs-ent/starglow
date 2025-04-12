"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    addBlockchainNetwork,
    addBlockchainNetworkParams,
    updateBlockchainNetwork,
    saveFactoryContract,
    saveFactoryContractParams,
    updateFactoryContractCollections,
    saveEscrowWallet,
    saveEscrowWalletParams,
    updateEscrowWalletStatus,
    updateEscrowWalletBalance,
    generateWallet,
    getWalletBalance,
} from "../actions/blockchain";
import { QUERY_KEYS } from "../queryKeys";

// Add blockchain network
export function useAddBlockchainNetwork() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: addBlockchainNetworkParams) => {
            const result = await addBlockchainNetwork(params);
            if (!result.success || !result.data) {
                throw new Error(result.error || "Failed to add network");
            }
            return result.data;
        },
        onSuccess: () => {
            // Invalidate network list queries
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.BLOCKCHAIN_NETWORKS],
            });
        },
    });
}

// Update blockchain network
export function useUpdateBlockchainNetwork() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: { id: string; data: any }) => {
            const result = await updateBlockchainNetwork(
                params.id,
                params.data
            );
            if (!result.success || !result.data) {
                throw new Error(result.error || "Failed to update network");
            }
            return result.data;
        },
        onSuccess: (data) => {
            // Invalidate specific network and network list queries
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.BLOCKCHAIN_NETWORKS, data.id],
            });
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.BLOCKCHAIN_NETWORKS],
            });
        },
    });
}

// Save factory contract
export function useSaveFactoryContract() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: saveFactoryContractParams) => {
            const result = await saveFactoryContract(params);
            if (!result.success || !result.data) {
                throw new Error(
                    result.error || "Failed to save factory contract"
                );
            }
            return result.data;
        },
        onSuccess: (data) => {
            // Invalidate factory contract list queries
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.FACTORY_CONTRACTS],
            });
            queryClient.invalidateQueries({
                queryKey: [
                    QUERY_KEYS.FACTORY_CONTRACTS,
                    "active",
                    data.networkId,
                ],
            });
        },
    });
}

// Update factory contract collections
export function useUpdateFactoryContractCollections() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: { id: string; collections: string[] }) => {
            const result = await updateFactoryContractCollections(
                params.id,
                params.collections
            );
            if (!result.success || !result.data) {
                throw new Error(
                    result.error ||
                        "Failed to update factory contract collections"
                );
            }
            return result.data;
        },
        onSuccess: () => {
            // Invalidate factory contract list queries
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.FACTORY_CONTRACTS],
            });
        },
    });
}

// Save escrow wallet
export function useSaveEscrowWallet() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: saveEscrowWalletParams) => {
            const result = await saveEscrowWallet(params);
            if (!result.success || !result.data) {
                throw new Error(result.error || "Failed to save escrow wallet");
            }
            return result.data;
        },
        onSuccess: () => {
            // Invalidate escrow wallet list and active wallet queries
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.ESCROW_WALLETS],
            });
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.ACTIVE_ESCROW_WALLET],
            });
        },
    });
}

// Update escrow wallet status
export function useUpdateEscrowWalletStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: { id: string; isActive: boolean }) => {
            const result = await updateEscrowWalletStatus(
                params.id,
                params.isActive
            );
            if (!result.success || !result.data) {
                throw new Error(
                    result.error || "Failed to update escrow wallet status"
                );
            }
            return result.data;
        },
        onSuccess: () => {
            // Invalidate escrow wallet list and active wallet queries
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.ESCROW_WALLETS],
            });
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.ACTIVE_ESCROW_WALLET],
            });
        },
    });
}

// Update escrow wallet balance
export function useUpdateEscrowWalletBalance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: {
            id: string;
            balance: Record<string, string>;
        }) => {
            const result = await updateEscrowWalletBalance(
                params.id,
                params.balance
            );
            if (!result.success || !result.data) {
                throw new Error(
                    result.error || "Failed to update escrow wallet balance"
                );
            }
            return result.data;
        },
        onSuccess: () => {
            // Invalidate escrow wallet list and active wallet queries
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.ESCROW_WALLETS],
            });
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.ACTIVE_ESCROW_WALLET],
            });
        },
    });
}

// Generate new wallet
export function useGenerateWallet() {
    return useMutation({
        mutationFn: async () => {
            const result = await generateWallet();
            if (!result.success || !result.data) {
                throw new Error(result.error || "Failed to generate wallet");
            }
            return result.data;
        },
    });
}

// Get wallet balance
export function useGetWalletBalance() {
    return useMutation({
        mutationFn: async (params: { address: string; networkId: string }) => {
            const result = await getWalletBalance(params);
            if (!result.success || !result.data) {
                throw new Error(result.error || "Failed to get wallet balance");
            }
            return result.data;
        },
    });
}
