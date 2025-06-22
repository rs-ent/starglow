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
            await queryClient.setQueryData(
                queryKeys.escrowWallet.list(),
                (old: any) => [...(old ?? []), variables]
            );
            return { previousData };
        },
        onError: (_error, _variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    queryKeys.escrowWallet.list(),
                    context.previousData
                );
            }
        },
        onSettled: (data, _error, _variables, _context) => {
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.escrowWallet.list(),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.escrowWallet.all,
                })
                .catch((error) => {
                    console.error(error);
                });
            if (typeof data === "object" && data && "address" in data) {
                queryClient
                    .invalidateQueries({
                        queryKey: queryKeys.escrowWallet.wallet(data.address),
                    })
                    .catch((error) => {
                        console.error(error);
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
            await queryClient.setQueryData(
                queryKeys.escrowWallet.wallet(variables.address),
                variables
            );
            return { previousData };
        },
        onError: (_error, variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    queryKeys.escrowWallet.wallet(variables.address),
                    context.previousData
                );
            }
        },
        onSettled: (_data, _error, variables, _context) => {
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.escrowWallet.wallet(variables.address),
                })
                .catch((error) => {
                    console.error(error);
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
            await queryClient.setQueryData(
                queryKeys.escrowWallet.wallet(variables.address),
                variables
            );
            return { previousData };
        },
        onError: (_error, variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    queryKeys.escrowWallet.wallet(variables.address),
                    context.previousData
                );
            }
        },
        onSettled: (_data, _error, variables, _context) => {
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.escrowWallet.wallet(variables.address),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.escrowWallet.all,
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useFetchEscrowWalletsBalanceMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: fetchEscrowWalletsBalance,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.escrowWallet.balances(
                        variables.addresses
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
            variables.addresses.forEach((address) => {
                queryClient
                    .invalidateQueries({
                        queryKey: queryKeys.escrowWallet.balance(address),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            });
        },
    });
}

export function useAddEscrowWalletToSPGMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: addEscrowWalletToSPG,
        onSuccess: (_data, _variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.spg.list(),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}
