"use client";

import {
    useBlockchainNetworks,
    useFactoryContracts,
    useActiveFactoryContract,
    useEscrowWallets,
    useActiveEscrowWallet,
} from "../queries/blockchainQueries";
import {
    useAddBlockchainNetwork,
    useUpdateBlockchainNetwork,
    useSaveFactoryContract,
    useUpdateFactoryContractCollections,
    useSaveEscrowWallet,
    useUpdateEscrowWalletStatus,
    useUpdateEscrowWalletBalance,
    useGenerateWallet,
    useGetWalletBalance,
} from "../mutations/blockchainMutations";
import { useState } from "react";

// Integrated hook for blockchain network management
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

// Integrated hook for factory contract management
export function useFactoryContractsManager(networkId?: string) {
    const [selectedContractId, setSelectedContractId] = useState<string | null>(
        null
    );

    const contractsQuery = useFactoryContracts(networkId);
    const activeContractQuery = networkId
        ? useActiveFactoryContract(networkId)
        : { data: null, isLoading: false, error: null };
    const saveContractMutation = useSaveFactoryContract();
    const updateCollectionsMutation = useUpdateFactoryContractCollections();

    // Get the selected contract
    const selectedContract = selectedContractId
        ? contractsQuery.data?.find((c) => c.id === selectedContractId)
        : null;

    // Combine loading and error states
    const isLoading =
        contractsQuery.isLoading ||
        (activeContractQuery.isLoading && !!networkId) ||
        saveContractMutation.isPending ||
        updateCollectionsMutation.isPending;

    const error =
        contractsQuery.error ||
        activeContractQuery.error ||
        saveContractMutation.error ||
        updateCollectionsMutation.error;

    return {
        // Queries
        contracts: contractsQuery.data || [],
        activeContract: activeContractQuery.data || null,
        selectedContract,

        // State
        setSelectedContract: setSelectedContractId,

        // Loading & Error
        isLoading,
        error,
        isError: !!error,

        // Mutations
        saveContract: saveContractMutation.mutate,
        updateCollections: updateCollectionsMutation.mutate,

        // Status
        isSavingContract: saveContractMutation.isPending,
        isUpdatingCollections: updateCollectionsMutation.isPending,

        // Reset
        reset: () => {
            saveContractMutation.reset();
            updateCollectionsMutation.reset();
        },
    };
}

// Integrated hook for escrow wallet management
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
        getBalanceMutation.isPending;

    const error =
        walletsQuery.error ||
        activeWalletQuery.error ||
        saveWalletMutation.error ||
        updateStatusMutation.error ||
        updateBalanceMutation.error ||
        generateWalletMutation.error ||
        getBalanceMutation.error;

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

        // Status
        isSavingWallet: saveWalletMutation.isPending,
        isUpdatingStatus: updateStatusMutation.isPending,
        isUpdatingBalance: updateBalanceMutation.isPending,
        isGeneratingWallet: generateWalletMutation.isPending,
        isGettingBalance: getBalanceMutation.isPending,

        // Reset
        reset: () => {
            saveWalletMutation.reset();
            updateStatusMutation.reset();
            updateBalanceMutation.reset();
            generateWalletMutation.reset();
            getBalanceMutation.reset();
        },
    };
}

// Standalone wallet balance hook
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
