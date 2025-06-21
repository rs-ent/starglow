/// app/story/escrowWallet/queries.ts

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../queryKeys";
import {
    getEscrowWallets,
    getRegisteredEscrowWallets
} from "./actions";

import type {
    getEscrowWalletsInput,
    getRegisteredEscrowWalletsInput} from "./actions";

export function useGetEscrowWalletsQuery(input?: getEscrowWalletsInput) {
    return useQuery({
        queryKey: queryKeys.escrowWallet.list(),
        queryFn: () => getEscrowWallets(input),
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24,
    });
}

export function useGetRegisteredEscrowWalletsQuery(
    input?: getRegisteredEscrowWalletsInput
) {
    return useQuery({
        queryKey: queryKeys.escrowWallet.registeredWallets(
            input?.spgAddress || ""
        ),
        queryFn: () => getRegisteredEscrowWallets(input),
        enabled: !!input?.spgAddress,
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24,
    });
}
