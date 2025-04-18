/// app\queries\walletQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { getWalletsByUserId } from "../actions/wallet";
import { walletKeys } from "../queryKeys";
import type { WalletResponse } from "../actions/wallet";

export function useWalletsByUserIdQuery(userId: string) {
    return useQuery<WalletResponse>({
        queryKey: walletKeys.byUserId(userId),
        queryFn: () => getWalletsByUserId(userId),
        enabled: !!userId,
        retry: 2,
    });
}
