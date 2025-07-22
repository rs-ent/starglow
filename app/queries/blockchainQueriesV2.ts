/// app/queries/blockchainQueriesV2.ts

"use client";

import { useQuery } from "@tanstack/react-query";

import { tokenGate } from "@/app/actions/blockchain";

import { blockchainKeys } from "../queryKeys";

import type { TokenGateInput } from "@/app/actions/blockchain";

export function useTokenGateQuery(input?: TokenGateInput) {
    return useQuery({
        queryKey: blockchainKeys.tokenGate(input),
        queryFn: () => tokenGate(input),
        enabled: !!input,
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchInterval: 1000 * 60 * 10, // 10 minutes (서버 부하 감소)
    });
}
