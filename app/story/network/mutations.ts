/// app/story/network/mutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../queryKeys";
import {
    createStoryNetwork,
    updateStoryNetwork,
    deleteStoryNetwork,
} from "./actions";

export function useCreateStoryNetworkMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createStoryNetwork,
        onMutate: async (variables) => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.storyNetwork.list(),
            });
            const previousData = queryClient.getQueryData(
                queryKeys.storyNetwork.list()
            );
            await queryClient.setQueryData(
                queryKeys.storyNetwork.list(),
                (old: any) => [...(old ?? []), variables]
            );
            return { previousData };
        },
        onError: (_error, _variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    queryKeys.storyNetwork.list(),
                    context.previousData
                );
            }
        },
        onSettled: (data) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.storyNetwork.list(),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.storyNetwork.all,
            });
            if (typeof data === "object" && data && "id" in data) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.storyNetwork.network(data.id),
                });
            }
        },
    });
}

export function useUpdateStoryNetworkMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateStoryNetwork,
        onMutate: async (variables) => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.storyNetwork.network(variables.id),
            });
            const previousData = queryClient.getQueryData(
                queryKeys.storyNetwork.network(variables.id)
            );
            await queryClient.setQueryData(
                queryKeys.storyNetwork.network(variables.id),
                variables
            );
            return { previousData };
        },
        onError: (_error, variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    queryKeys.storyNetwork.network(variables.id),
                    context.previousData
                );
            }
        },
        onSettled: (_data, _error, variables, _context) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.storyNetwork.network(variables.id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.storyNetwork.all,
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.storyNetwork.list(),
            });
        },
    });
}

export function useDeleteStoryNetworkMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteStoryNetwork,
        onMutate: async (variables) => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.storyNetwork.network(variables.id),
            });
            const previousData = queryClient.getQueryData(
                queryKeys.storyNetwork.network(variables.id)
            );
            await queryClient.setQueryData(
                queryKeys.storyNetwork.network(variables.id),
                undefined
            );
            return { previousData };
        },
        onError: (_error, variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    queryKeys.storyNetwork.network(variables.id),
                    context.previousData
                );
            }
        },
        onSettled: (_data, _error, variables, _context) => {
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.storyNetwork.list(),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.storyNetwork.network(variables.id),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.storyNetwork.all,
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}
