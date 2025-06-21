/// app/story/spg/hooks.ts

import {
    useDeploySPGNFTFactoryMutation,
    useCreateSPGMutation,
    useUpdateSPGMutation,
    useDeleteSPGMutation,
    useUpdateSPGUtilsMutation,
} from "./mutations";
import {
    useGetSPGContractsQuery,
    useGetSPGQuery,
    useGetSPGsQuery,
} from "./queries";

import type { getSPGInput, getSPGsInput, getSPGContractsInput } from "./actions";

interface useSPGInput {
    getSPGInput?: getSPGInput;
    getSPGsInput?: getSPGsInput;
    getSPGContractsInput?: getSPGContractsInput;
}

export function useSPG(input?: useSPGInput) {
    const {
        data: getSPGContractsData,
        isLoading: getSPGContractsIsLoading,
        isError: getSPGContractsIsError,
        error: getSPGContractsError,
        refetch: getSPGContractsRefetch,
    } = useGetSPGContractsQuery(input?.getSPGContractsInput);

    const {
        data: getSPGData,
        isLoading: getSPGIsLoading,
        isError: getSPGIsError,
        error: getSPGError,
        refetch: getSPGRefetch,
    } = useGetSPGQuery(input?.getSPGInput);

    const {
        data: getSPGsData,
        isLoading: getSPGsIsLoading,
        isError: getSPGsIsError,
        error: getSPGsError,
        refetch: getSPGsRefetch,
    } = useGetSPGsQuery(input?.getSPGsInput);

    const {
        mutate: deploySPGNFTFactoryMutation,
        mutateAsync: deploySPGNFTFactoryMutationAsync,
        isPending: deploySPGNFTFactoryMutationIsPending,
        isError: deploySPGNFTFactoryMutationIsError,
    } = useDeploySPGNFTFactoryMutation();

    const {
        mutate: createSPGMutation,
        mutateAsync: createSPGMutationAsync,
        isPending: createSPGMutationIsPending,
        isError: createSPGMutationIsError,
    } = useCreateSPGMutation();

    const {
        mutate: updateSPGMutation,
        mutateAsync: updateSPGMutationAsync,
        isPending: updateSPGMutationIsPending,
        isError: updateSPGMutationIsError,
    } = useUpdateSPGMutation();

    const {
        mutate: deleteSPGMutation,
        mutateAsync: deleteSPGMutationAsync,
        isPending: deleteSPGMutationIsPending,
        isError: deleteSPGMutationIsError,
    } = useDeleteSPGMutation();

    const {
        mutate: updateSPGUtilsMutation,
        mutateAsync: updateSPGUtilsMutationAsync,
        isPending: updateSPGUtilsMutationIsPending,
        isError: updateSPGUtilsMutationIsError,
    } = useUpdateSPGUtilsMutation();

    return {
        getSPGContractsData,
        getSPGContractsIsLoading,
        getSPGContractsIsError,
        getSPGContractsError,
        getSPGContractsRefetch,

        getSPGData,
        getSPGIsLoading,
        getSPGIsError,
        getSPGError,
        getSPGRefetch,

        getSPGsData,
        getSPGsIsLoading,
        getSPGsIsError,
        getSPGsError,
        getSPGsRefetch,

        deploySPGNFTFactoryMutation,
        deploySPGNFTFactoryMutationAsync,
        deploySPGNFTFactoryMutationIsPending,
        deploySPGNFTFactoryMutationIsError,

        createSPGMutation,
        createSPGMutationAsync,
        createSPGMutationIsPending,
        createSPGMutationIsError,

        updateSPGMutation,
        updateSPGMutationAsync,
        updateSPGMutationIsPending,
        updateSPGMutationIsError,

        deleteSPGMutation,
        deleteSPGMutationAsync,
        deleteSPGMutationIsPending,
        deleteSPGMutationIsError,

        updateSPGUtilsMutation,
        updateSPGUtilsMutationAsync,
        updateSPGUtilsMutationIsPending,
        updateSPGUtilsMutationIsError,

        useGetSPGQuery,
        useGetSPGsQuery,
        useDeploySPGNFTFactoryMutation,
        useCreateSPGMutation,
        useUpdateSPGMutation,
        useDeleteSPGMutation,
    };
}
