// app/hooks/useCollectionV2.ts

import { useUserVerifiedCollections } from "../queries/collectionContractsQueries";
import type { GetUserVerifiedCollectionsInput } from "../actions/collectionContracts";

interface UseCollectionGetProps {
    getUserVerifiedCollectionsInput?: GetUserVerifiedCollectionsInput;
}

export function useCollectionGet({
    getUserVerifiedCollectionsInput,
}: UseCollectionGetProps = {}) {
    const {
        data: userVerifiedCollections,
        isLoading: isUserVerifiedCollectionsLoading,
        error: userVerifiedCollectionsError,
        refetch: refetchUserVerifiedCollections,
    } = useUserVerifiedCollections(getUserVerifiedCollectionsInput);

    const isLoading = isUserVerifiedCollectionsLoading;
    const error = userVerifiedCollectionsError;

    const refetch = async () => {
        await refetchUserVerifiedCollections();
    };

    return {
        userVerifiedCollections,
        isUserVerifiedCollectionsLoading,
        userVerifiedCollectionsError,
        refetchUserVerifiedCollections,

        isLoading,
        error,

        refetch,
    };
}
