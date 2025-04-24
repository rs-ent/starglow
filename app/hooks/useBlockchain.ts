"use client";

import {
    useBlockchainNetworks,
    useBlockchainNetwork,
    useEscrowWallets,
    useActiveEscrowWallet,
} from "../queries/blockchainQueries";
import {
    useAddBlockchainNetwork,
    useUpdateBlockchainNetwork,
    useSaveEscrowWallet,
    useUpdateEscrowWalletStatus,
    useUpdateEscrowWalletBalance,
    useGenerateWallet,
    useGetWalletBalance,
    useGetEscrowWalletWithPrivateKey,
    useEstimateGas,
} from "../mutations/blockchainMutations";
import { useState } from "react";

/**
 * 블록체인 네트워크 관리를 위한 통합 훅
 */
export function useBlockchainNetworksManager() {
    const networksQuery = useBlockchainNetworks();
    const addNetworkMutation = useAddBlockchainNetwork();
    const updateNetworkMutation = useUpdateBlockchainNetwork();

    // Combine loading and error states
    const isLoading =
        networksQuery.isLoading ||
        addNetworkMutation.isPending ||
        updateNetworkMutation.isPending;
    const error =
        networksQuery.error ||
        addNetworkMutation.error ||
        updateNetworkMutation.error;

    return {
        // Queries
        networks: networksQuery.data,
        isLoading,
        error,
        isError: !!error,

        // Mutations
        addNetwork: addNetworkMutation.mutate,
        updateNetwork: updateNetworkMutation.mutate,

        // Status
        isAddingNetwork: addNetworkMutation.isPending,
        isUpdatingNetwork: updateNetworkMutation.isPending,

        // Reset
        reset: () => {
            addNetworkMutation.reset();
            updateNetworkMutation.reset();
        },
    };
}

/**
 * 에스크로 지갑 관리를 위한 통합 훅
 */
export function useEscrowWalletManager() {
    const [selectedWalletId, setSelectedWalletId] = useState<string | null>(
        null
    );

    const walletsQuery = useEscrowWallets();
    const activeWalletQuery = useActiveEscrowWallet();
    const saveWalletMutation = useSaveEscrowWallet();
    const updateStatusMutation = useUpdateEscrowWalletStatus();
    const updateBalanceMutation = useUpdateEscrowWalletBalance();
    const generateWalletMutation = useGenerateWallet();
    const getBalanceMutation = useGetWalletBalance();
    const getWalletWithPrivateKeyMutation = useGetEscrowWalletWithPrivateKey();

    // Get the selected wallet
    const selectedWallet = selectedWalletId
        ? walletsQuery.data?.find((w) => w.id === selectedWalletId)
        : null;

    // Combine loading and error states
    const isLoading =
        walletsQuery.isLoading ||
        activeWalletQuery.isLoading ||
        saveWalletMutation.isPending ||
        updateStatusMutation.isPending ||
        updateBalanceMutation.isPending ||
        generateWalletMutation.isPending ||
        getBalanceMutation.isPending ||
        getWalletWithPrivateKeyMutation.isPending;

    const error =
        walletsQuery.error ||
        activeWalletQuery.error ||
        saveWalletMutation.error ||
        updateStatusMutation.error ||
        updateBalanceMutation.error ||
        generateWalletMutation.error ||
        getBalanceMutation.error ||
        getWalletWithPrivateKeyMutation.error;

    return {
        // Queries
        wallets: walletsQuery.data || [],
        activeWallet: activeWalletQuery.data,
        selectedWallet,

        // State
        setSelectedWallet: setSelectedWalletId,

        // Loading & Error
        isLoading,
        error,
        isError: !!error,

        // Mutations
        saveWallet: saveWalletMutation.mutate,
        updateStatus: updateStatusMutation.mutate,
        updateBalance: updateBalanceMutation.mutate,
        generateWallet: generateWalletMutation.mutateAsync,
        getWalletBalance: getBalanceMutation.mutateAsync,
        getWalletWithPrivateKey: getWalletWithPrivateKeyMutation.mutateAsync,

        // Status
        isSavingWallet: saveWalletMutation.isPending,
        isUpdatingStatus: updateStatusMutation.isPending,
        isUpdatingBalance: updateBalanceMutation.isPending,
        isGeneratingWallet: generateWalletMutation.isPending,
        isGettingBalance: getBalanceMutation.isPending,
        isGettingPrivateKey: getWalletWithPrivateKeyMutation.isPending,

        // Reset
        reset: () => {
            saveWalletMutation.reset();
            updateStatusMutation.reset();
            updateBalanceMutation.reset();
            generateWalletMutation.reset();
            getBalanceMutation.reset();
            getWalletWithPrivateKeyMutation.reset();
        },
    };
}

/**
 * 지갑 잔액 조회를 위한 독립 훅
 */
export function useWalletBalance() {
    const getBalanceMutation = useGetWalletBalance();

    return {
        getBalance: getBalanceMutation.mutateAsync,
        isLoading: getBalanceMutation.isPending,
        error: getBalanceMutation.error,
        isError: !!getBalanceMutation.error,
        reset: getBalanceMutation.reset,
    };
}

/**
 * 민팅 가스 추정을 위한 특화 훅
 */
export function useEstimateMintGas() {
    const estimateGasMutation = useEstimateGas();
    const [isEstimating, setIsEstimating] = useState(false);

    const estimate = async ({
        collectionAddress,
        walletId,
        quantity,
    }: {
        collectionAddress: string;
        walletId: string;
        quantity: number;
    }) => {
        if (!collectionAddress || !walletId || quantity <= 0) {
            return null;
        }

        setIsEstimating(true);
        try {
            return await estimateGasMutation.mutateAsync({
                collectionAddress,
                walletId,
                transactions: [{ functionName: "mint", args: [quantity] }],
            });
        } finally {
            setIsEstimating(false);
        }
    };

    return {
        estimate,
        isEstimating: isEstimating || estimateGasMutation.isPending,
        error: estimateGasMutation.error,
        reset: estimateGasMutation.reset,
    };
}

/**
 * 소각 가스 추정을 위한 특화 훅
 */
export function useEstimateBurnGas() {
    const estimateGasMutation = useEstimateGas();
    const [isEstimating, setIsEstimating] = useState(false);

    const estimate = async ({
        collectionAddress,
        walletId,
        tokenIds,
    }: {
        collectionAddress: string;
        walletId: string;
        tokenIds: number[];
    }) => {
        if (!collectionAddress || !walletId || tokenIds.length === 0) {
            return null;
        }

        setIsEstimating(true);
        try {
            return await estimateGasMutation.mutateAsync({
                collectionAddress,
                walletId,
                transactions: [{ functionName: "burn", args: [tokenIds] }],
            });
        } finally {
            setIsEstimating(false);
        }
    };

    return {
        estimate,
        isEstimating: isEstimating || estimateGasMutation.isPending,
        error: estimateGasMutation.error,
        reset: estimateGasMutation.reset,
    };
}
