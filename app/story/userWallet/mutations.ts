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
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.userWallet.list(variables.userId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.userWallet.default(variables.userId),
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
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.userWallet.list(variables.userId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.userWallet.default(variables.userId),
            });
        },
    });
}

export function useDeleteWalletMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteWallet,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.userWallet.list(variables.userId),
            });
        },
    });
}
