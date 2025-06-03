/// app/story/metadata/hooks.ts

import { useGetMetadataQuery, useGetMetadataListQuery } from "./queries";
import {
    useCreateMetadataMutation,
    useUpdateMetadataMutation,
    useDeleteMetadataMutation,
    useUploadMediaMutation,
    useCreateBaseURIMutation,
} from "./mutations";
import { getMetadataInput, getMetadataListInput } from "./actions";

interface useMetadataInput {
    getMetadataInput?: getMetadataInput;
    getMetadataListInput?: getMetadataListInput;
}

export function useMetadata(input?: useMetadataInput) {
    const {
        data: metadata,
        isLoading: isLoadingMetadata,
        isError: isErrorMetadata,
        refetch: refetchMetadata,
    } = useGetMetadataQuery(input?.getMetadataInput);

    const {
        data: metadataList,
        isLoading: isLoadingMetadataList,
        isError: isErrorMetadataList,
        refetch: refetchMetadataList,
    } = useGetMetadataListQuery(input?.getMetadataListInput);

    const {
        mutate: createMetadata,
        mutateAsync: createMetadataAsync,
        isPending: isPendingCreateMetadata,
        isError: isErrorCreateMetadata,
    } = useCreateMetadataMutation();

    const {
        mutate: updateMetadata,
        mutateAsync: updateMetadataAsync,
        isPending: isPendingUpdateMetadata,
        isError: isErrorUpdateMetadata,
    } = useUpdateMetadataMutation();

    const {
        mutate: deleteMetadata,
        mutateAsync: deleteMetadataAsync,
        isPending: isPendingDeleteMetadata,
        isError: isErrorDeleteMetadata,
    } = useDeleteMetadataMutation();

    const {
        mutate: uploadMedia,
        mutateAsync: uploadMediaAsync,
        isPending: isPendingUploadMedia,
        isError: isErrorUploadMedia,
    } = useUploadMediaMutation();

    const {
        mutate: createBaseURI,
        mutateAsync: createBaseURIAsync,
        isPending: isPendingCreateBaseURI,
        isError: isErrorCreateBaseURI,
    } = useCreateBaseURIMutation();

    return {
        metadata,
        isLoadingMetadata,
        isErrorMetadata,
        refetchMetadata,

        metadataList,
        isLoadingMetadataList,
        isErrorMetadataList,
        refetchMetadataList,

        createMetadata,
        createMetadataAsync,
        isPendingCreateMetadata,
        isErrorCreateMetadata,

        updateMetadata,
        updateMetadataAsync,
        isPendingUpdateMetadata,
        isErrorUpdateMetadata,

        deleteMetadata,
        deleteMetadataAsync,
        isPendingDeleteMetadata,
        isErrorDeleteMetadata,

        uploadMedia,
        uploadMediaAsync,
        isPendingUploadMedia,
        isErrorUploadMedia,

        createBaseURI,
        createBaseURIAsync,
        isPendingCreateBaseURI,
        isErrorCreateBaseURI,

        useGetMetadataQuery,
        useGetMetadataListQuery,
        useCreateMetadataMutation,
        useUpdateMetadataMutation,
        useDeleteMetadataMutation,
        useUploadMediaMutation,
    };
}
