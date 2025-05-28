// app/hooks/useCollectionV2.ts

import { useUserVerifiedCollections } from "../queries/collectionContractsQueries";
import type { GetUserVerifiedCollectionsInput } from "../actions/collectionContracts";
import { useAddPageImagesMutation } from "../mutations/collectionContractsMutations";

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

export function useCollectionSet() {
    const {
        mutateAsync: addPageImages,
        isPending: isAddingPageImages,
        error: addPageImagesError,
        reset: resetPageImages,
    } = useAddPageImagesMutation();

    const isLoading = isAddingPageImages;
    const error = addPageImagesError;

    const reset = () => Promise.all([resetPageImages()]);

    return {
        addPageImages,
        isAddingPageImages,
        addPageImagesError,

        isLoading,
        error,

        reset,
    };
}
