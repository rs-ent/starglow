// app/hooks/useCollectionV2.ts

import { useAddPageImagesMutation } from "../mutations/collectionContractsMutations";
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
