/// app/story/userWallet/mutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../queryKeys";
import {
    connectWallet,
    verifyWalletSignature,
    updateWallet,
    deleteWallet,
} from "./actions";

export function useConnectWalletMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: connectWallet,
        onSuccess: (_, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.userWallet.list(variables.userId),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.userWallet.default(variables.userId),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useVerifyWalletSignatureMutation() {
    return useMutation({
        mutationFn: verifyWalletSignature,
    });
}

export function useUpdateWalletMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateWallet,
        onSuccess: (_, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.userWallet.list(variables.userId),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.userWallet.default(variables.userId),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useDeleteWalletMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteWallet,
        onSuccess: (_, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.userWallet.list(variables.userId),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}
