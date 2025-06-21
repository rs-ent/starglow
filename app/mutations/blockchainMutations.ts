"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    addBlockchainNetwork,
    updateBlockchainNetwork,
    saveEscrowWallet,
    updateEscrowWalletStatus,
    updateEscrowWalletBalance,
    generateWallet,
    getWalletBalance,
    getEscrowWalletWithPrivateKey,
    estimateGasForTransactions
} from "../actions/blockchain";
import { QUERY_KEYS } from "../queryKeys";

import type {
    addBlockchainNetworkParams,
    saveEscrowWalletParams,
    EstimateGasForTransactionsInput} from "../actions/blockchain";

/**
 * 블록체인 네트워크 추가 뮤테이션 훅
 */
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

/**
 * 블록체인 네트워크 업데이트 뮤테이션 훅
 */
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

/**
 * 에스크로 지갑 저장 뮤테이션 훅
 */
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

/**
 * 에스크로 지갑 상태 업데이트 뮤테이션 훅
 */
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

/**
 * 에스크로 지갑 잔액 업데이트 뮤테이션 훅
 */
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

/**
 * 새 지갑 생성 뮤테이션 훅
 */
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

/**
 * 지갑 잔액 조회 뮤테이션 훅
 */
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

/**
 * 지갑의 private key를 가져오는 뮤테이션 훅
 */
export function useGetEscrowWalletWithPrivateKey() {
    return useMutation({
        mutationFn: async (id: string) => {
            const result = await getEscrowWalletWithPrivateKey(id);
            if (!result.success || !result.data) {
                throw new Error(
                    result.error || "Failed to get wallet private key"
                );
            }
            return result.data;
        },
    });
}

/**
 * 가스 추정을 위한 뮤테이션 훅
 */
export function useEstimateGas() {
    return useMutation({
        mutationFn: async (params: EstimateGasForTransactionsInput) => {
            const result = await estimateGasForTransactions(params);
            if (!result.success || !result.data) {
                throw new Error(result.error || "Failed to estimate gas");
            }
            return result.data;
        },
    });
}
