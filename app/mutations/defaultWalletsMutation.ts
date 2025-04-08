/// app/mutations/defaultWalletsMutation.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import { createPolygonWallet } from "../actions/defaultWallets";

export function useCreatePolygonWallet() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            return createPolygonWallet(userId);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.defaultWallets.polygon,
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.defaultWallets.all,
            });
            if (data.address) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.defaultWallets.byId(data.address),
                });
            }
            queryClient.invalidateQueries({
                queryKey: queryKeys.defaultWallets.byNetwork("polygon"),
            });
        },
    });
}
