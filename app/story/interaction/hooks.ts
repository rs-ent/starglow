/// app/story/interaction/hooks.ts

import { useGetUserVerifiedSPGsQuery } from "./queries";
import { GetUserVerifiedSPGsInput } from "./actions";

interface UseWeb3InteractionsInput {
    getUserVerifiedSPGsInput: GetUserVerifiedSPGsInput;
}

export function useWeb3Interactions(input?: UseWeb3InteractionsInput) {
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
