/// app/story/userWallet/queries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import {
    getDefaultUserWallet,
    getDefaultUserWalletInput,
    getWallets,
    getWalletsInput,
} from "./actions";
import { queryKeys } from "../queryKeys";

export function useGetDefaultUserWalletQuery(
    input?: getDefaultUserWalletInput
) {
    return useQuery({
        queryKey: queryKeys.userWallet.default(input?.userId ?? ""),
        queryFn: () => getDefaultUserWallet(input),
        enabled: Boolean(input),
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24,
    });
}

export function useGetWalletsQuery(input?: getWalletsInput) {
    return useQuery({
        queryKey: queryKeys.userWallet.list(input?.userId ?? ""),
        queryFn: () => getWallets(input),
        enabled: Boolean(input?.userId),
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24,
    });
}
