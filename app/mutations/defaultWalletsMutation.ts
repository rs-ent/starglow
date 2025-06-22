/// app/mutations/defaultWalletsMutation.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createWallet } from "../story/userWallet/actions";
import { queryKeys } from "../queryKeys";

export function useCreateWallet() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            return createWallet(userId);
        },
        onSuccess: (data) => {
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.defaultWallets.polygon,
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.defaultWallets.all,
                })
                .catch((error) => {
                    console.error(error);
                });
            if (data.address) {
                queryClient
                    .invalidateQueries({
                        queryKey: queryKeys.defaultWallets.byId(data.address),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.defaultWallets.byNetwork("polygon"),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}
