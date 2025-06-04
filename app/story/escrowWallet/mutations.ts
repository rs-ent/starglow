/// app/story/escrowWallet/mutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    registerEscrowWallet,
    fetchEscrowWalletPrivateKey,
    setActiveEscrowWallet,
    fetchEscrowWalletsBalance,
    addEscrowWalletToSPG,
} from "./actions";
import { queryKeys } from "../queryKeys";

export function useRegisterEscrowWalletMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: registerEscrowWallet,
        onMutate: async (variables) => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.escrowWallet.list(),
            });
            const previousData = queryClient.getQueryData(
                queryKeys.escrowWallet.list()
            );
            queryClient.setQueryData(
                queryKeys.escrowWallet.list(),
                (old: any) => [...(old ?? []), variables]
            );
            return { previousData };
        },
        onError: (error, variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    queryKeys.escrowWallet.list(),
                    context.previousData
                );
            }
        },
        onSettled: (data, error, variables, context) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.escrowWallet.list(),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.escrowWallet.all,
            });
            if (typeof data === "object" && data && "address" in data) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.escrowWallet.wallet(data.address),
                });
            }
        },
    });
}

export function useFetchEscrowWalletPrivateKeyMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: fetchEscrowWalletPrivateKey,
        onMutate: async (variables) => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.escrowWallet.wallet(variables.address),
            });
            const previousData = queryClient.getQueryData(
                queryKeys.escrowWallet.wallet(variables.address)
            );
            queryClient.setQueryData(
                queryKeys.escrowWallet.wallet(variables.address),
                variables
            );
            return { previousData };
        },
        onError: (error, variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    queryKeys.escrowWallet.wallet(variables.address),
                    context.previousData
                );
            }
        },
        onSettled: (data, error, variables, context) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.escrowWallet.wallet(variables.address),
            });
        },
    });
}

export function useSetActiveEscrowWalletMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: setActiveEscrowWallet,
        onMutate: async (variables) => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.escrowWallet.wallet(variables.address),
            });
            const previousData = queryClient.getQueryData(
                queryKeys.escrowWallet.wallet(variables.address)
            );
            queryClient.setQueryData(
                queryKeys.escrowWallet.wallet(variables.address),
                variables
            );
            return { previousData };
        },
        onError: (error, variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    queryKeys.escrowWallet.wallet(variables.address),
                    context.previousData
                );
            }
        },
        onSettled: (data, error, variables, context) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.escrowWallet.wallet(variables.address),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.escrowWallet.all,
            });
        },
    });
}

export function useFetchEscrowWalletsBalanceMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: fetchEscrowWalletsBalance,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.escrowWallet.balances(variables.addresses),
            });
            variables.addresses.forEach((address) => {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.escrowWallet.balance(address),
                });
            });
        },
    });
}

export function useAddEscrowWalletToSPGMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: addEscrowWalletToSPG,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.spg.list(),
            });
        },
    });
}
