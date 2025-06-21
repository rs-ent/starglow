/// app/story/interaction/hooks.ts

"use client";

import { useGetUserVerifiedSPGsQuery } from "./queries";

import type { GetUserVerifiedSPGsInput } from "./actions";

interface UseStoryInteractionsInput {
    getUserVerifiedSPGsInput: GetUserVerifiedSPGsInput;
}

export function useStoryInteractions(input?: UseStoryInteractionsInput) {
    const {
        data: verifiedSPGs,
        isLoading: isLoadingVerifiedSPGs,
        isError: isErrorVerifiedSPGs,
        refetch: refetchVerifiedSPGs,
    } = useGetUserVerifiedSPGsQuery(input?.getUserVerifiedSPGsInput);

    return {
        verifiedSPGs,
        isLoadingVerifiedSPGs,
        isErrorVerifiedSPGs,
        refetchVerifiedSPGs,

        useGetUserVerifiedSPGsQuery,
    };
}
