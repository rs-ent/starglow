/// app/hooks/useBlockchainV2.ts

"use client";

import { useTokenGateQuery } from "@/app/queries/blockchainQueriesV2";

import type { TokenGateInput } from "@/app/actions/blockchain";

export function useBlockchainGet({
    tokenGateInput,
}: {
    tokenGateInput: TokenGateInput;
}) {
    const {
        data: tokenGateData,
        isLoading: isTokenGateLoading,
        error: tokenGateError,
    } = useTokenGateQuery(tokenGateInput);

    const isLoading = isTokenGateLoading;

    const error = tokenGateError;

    return {
        tokenGateData,
        isTokenGateLoading,
        tokenGateError,

        isLoading,
        error,

        useTokenGateQuery,
    };
}
