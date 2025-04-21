import {
    useCollectionMetadata,
    useLinkableCollectionMetadata,
    useMetadataByCollectionAddress,
} from "../queries/metadataQueries";
import {
    useCreateCollectionMetadata,
    useCreateNFTMetadata,
    useLinkCollectionMetadata,
    useRecoverNFTMetadata,
} from "../mutations/metadataMutations";

export function useMetadata({
    metadataId,
    collectionAddress,
}: {
    metadataId?: string;
    collectionAddress?: string;
}) {
    const collectionMetadata = useCollectionMetadata(metadataId || "");
    const linkableMetadata = useLinkableCollectionMetadata();
    const createCollection = useCreateCollectionMetadata();
    const createNFTs = useCreateNFTMetadata();
    const linkMetadata = useLinkCollectionMetadata();
    const metadataByCollectionAddress = useMetadataByCollectionAddress(
        collectionAddress || ""
    );
    const recoverNFTMetadata = useRecoverNFTMetadata();

    return {
        // queries
        collectionMetadata: metadataId ? collectionMetadata.data : undefined,
        metadataByCollectionAddress: metadataByCollectionAddress.data,
        linkableMetadata: linkableMetadata.data,
        isLoading:
            collectionMetadata.isLoading ||
            linkableMetadata.isLoading ||
            metadataByCollectionAddress.isLoading,

        // mutations
        createCollection: createCollection.mutate,
        createNFTs: createNFTs.mutate,
        linkMetadata: linkMetadata.mutate,
        recoverNFTMetadata: recoverNFTMetadata.mutateAsync,

        // mutation states
        isCreating: createCollection.isPending,
        isCreatingNFTs: createNFTs.isPending,
        isLinking: linkMetadata.isPending,
        isRecovering: recoverNFTMetadata.isPending,

        // errors
        error:
            collectionMetadata.error ||
            linkableMetadata.error ||
            metadataByCollectionAddress.error,
        createError: createCollection.error,
        createNFTsError: createNFTs.error,
        linkError: linkMetadata.error,
        recoverError: recoverNFTMetadata.error,
    };
}
