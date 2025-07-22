/// app/story/network/hooks.ts

import {
    useCreateStoryNetworkMutation,
    useUpdateStoryNetworkMutation,
    useDeleteStoryNetworkMutation,
} from "./mutations";
import {
    useGetStoryNetworkQuery,
    useGetStoryNetworksQuery,
    useGetDefaultStoryNetworkQuery,
} from "./queries";

import type { getStoryNetworkInput, getStoryNetworksInput } from "./actions";

interface useStoryNetworkInput {
    getStoryNetworkInput?: getStoryNetworkInput;
    getStoryNetworksInput?: getStoryNetworksInput;
}

export function useStoryNetwork(input?: useStoryNetworkInput) {
    const {
        data: storyNetwork,
        isLoading: isLoadingStoryNetwork,
        isError: isErrorStoryNetwork,
        refetch: refetchStoryNetwork,
    } = useGetStoryNetworkQuery(input?.getStoryNetworkInput);

    const {
        data: storyNetworks,
        isLoading: isLoadingStoryNetworks,
        isError: isErrorStoryNetworks,
        refetch: refetchStoryNetworks,
    } = useGetStoryNetworksQuery(input?.getStoryNetworksInput);

    const {
        mutate: createStoryNetwork,
        mutateAsync: createStoryNetworkAsync,
        isPending: isPendingCreateStoryNetwork,
        isError: isErrorCreateStoryNetwork,
    } = useCreateStoryNetworkMutation();

    const {
        mutate: updateStoryNetwork,
        mutateAsync: updateStoryNetworkAsync,
        isPending: isPendingUpdateStoryNetwork,
        isError: isErrorUpdateStoryNetwork,
    } = useUpdateStoryNetworkMutation();

    const {
        mutate: deleteStoryNetwork,
        mutateAsync: deleteStoryNetworkAsync,
        isPending: isPendingDeleteStoryNetwork,
        isError: isErrorDeleteStoryNetwork,
    } = useDeleteStoryNetworkMutation();

    const {
        data: defaultStoryNetwork,
        isLoading: isLoadingDefaultStoryNetwork,
        isError: isErrorDefaultStoryNetwork,
        refetch: refetchDefaultStoryNetwork,
    } = useGetDefaultStoryNetworkQuery();

    return {
        storyNetwork,
        isLoadingStoryNetwork,
        isErrorStoryNetwork,
        refetchStoryNetwork,

        storyNetworks,
        isLoadingStoryNetworks,
        isErrorStoryNetworks,
        refetchStoryNetworks,

        createStoryNetwork,
        createStoryNetworkAsync,
        isPendingCreateStoryNetwork,
        isErrorCreateStoryNetwork,

        updateStoryNetwork,
        updateStoryNetworkAsync,
        isPendingUpdateStoryNetwork,
        isErrorUpdateStoryNetwork,

        deleteStoryNetwork,
        deleteStoryNetworkAsync,
        isPendingDeleteStoryNetwork,
        isErrorDeleteStoryNetwork,

        defaultStoryNetwork,
        isLoadingDefaultStoryNetwork,
        isErrorDefaultStoryNetwork,
        refetchDefaultStoryNetwork,

        useGetStoryNetworkQuery,
        useGetStoryNetworksQuery,
        useCreateStoryNetworkMutation,
        useUpdateStoryNetworkMutation,
        useDeleteStoryNetworkMutation,
    };
}
