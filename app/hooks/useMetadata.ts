import {
    useCollectionMetadata,
    useLinkableCollectionMetadata,
} from "../queries/metadataQueries";
import {
    useCreateCollectionMetadata,
    useCreateNFTMetadata,
    useLinkCollectionMetadata,
} from "../mutations/metadataMutations";

export function useMetadata(metadataId?: string) {
    const collectionMetadata = useCollectionMetadata(metadataId || "");
    const linkableMetadata = useLinkableCollectionMetadata();
    const createCollection = useCreateCollectionMetadata();
    const createNFTs = useCreateNFTMetadata();
    const linkMetadata = useLinkCollectionMetadata();

    return {
        // queries
        collectionMetadata: metadataId ? collectionMetadata.data : undefined,
        linkableMetadata: linkableMetadata.data,
        isLoading: collectionMetadata.isLoading || linkableMetadata.isLoading,

        // mutations
        createCollection: createCollection.mutate,
        createNFTs: createNFTs.mutate,
        linkMetadata: linkMetadata.mutate,

        // mutation states
        isCreating: createCollection.isPending,
        isCreatingNFTs: createNFTs.isPending,
        isLinking: linkMetadata.isPending,

        // errors
        error: collectionMetadata.error || linkableMetadata.error,
        createError: createCollection.error,
        createNFTsError: createNFTs.error,
        linkError: linkMetadata.error,
    };
}
