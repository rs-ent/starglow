/// app/story/spg/mutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import {
    deploySPGNFTFactory,
    createSPG,
    updateSPG,
    deleteSPG,
    updateSPGUtils,
} from "./actions";

export function useDeploySPGNFTFactoryMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deploySPGNFTFactory,
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.spg.contracts(),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.spg.contract(data.address),
            });
        },
    });
}

export function useCreateSPGMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createSPG,
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.spg.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.spg.list() });
            queryClient.invalidateQueries({
                queryKey: queryKeys.spg.collection({
                    address: data.address,
                }),
            });
        },
    });
}

export function useUpdateSPGMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateSPG,
        onMutate: async (variables) => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.storyNetwork.list(),
            });
            const previousData = queryClient.getQueryData(
                queryKeys.storyNetwork.list()
            );
            queryClient.setQueryData(
                queryKeys.storyNetwork.list(),
                (old: any) => [...(old ?? []), variables]
            );
            return { previousData };
        },
        onError: (error, variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    queryKeys.storyNetwork.list(),
                    context.previousData
                );
            }
        },
        onSettled: (data, error, variables, context) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.spg.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.spg.list() });
            queryClient.invalidateQueries({
                queryKey: queryKeys.spg.collection({
                    address: variables.address,
                }),
            });
        },
    });
}

export function useDeleteSPGMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteSPG,
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.spg.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.spg.list() });
            queryClient.invalidateQueries({
                queryKey: queryKeys.spg.collection({
                    address: variables.address,
                }),
            });
        },
    });
}

export function useUpdateSPGUtilsMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateSPGUtils,
        onMutate: async (variables) => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.spg.all,
            });
            const previousData = queryClient.getQueryData(queryKeys.spg.all);
            queryClient.setQueryData(queryKeys.spg.all, (old: any) => [
                ...(old ?? []),
                variables,
            ]);
            return { previousData };
        },
        onError: (error, variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    queryKeys.spg.all,
                    context.previousData
                );
            }
        },
        onSettled: (data, error, variables, context) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.spg.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.spg.list() });
            queryClient.invalidateQueries({
                queryKey: queryKeys.spg.collection({
                    address: variables.address,
                }),
            });
        },
    });
}
