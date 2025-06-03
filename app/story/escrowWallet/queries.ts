/// app/story/escrowWallet/queries.ts

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import { getEscrowWallets, getEscrowWalletsInput } from "./actions";

export function useGetEscrowWalletsQuery(input?: getEscrowWalletsInput) {
    return useQuery({
        queryKey: queryKeys.escrowWallet.list(),
        queryFn: () => getEscrowWallets(input),
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24,
    });
}
