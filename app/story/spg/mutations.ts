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
        onSuccess: (data, _variables, _context) => {
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.spg.contracts(),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.spg.contract(data.address),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useCreateSPGMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createSPG,
        onSuccess: (data, _variables, _context) => {
            queryClient
                .invalidateQueries({ queryKey: queryKeys.spg.all })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({ queryKey: queryKeys.spg.list() })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.spg.collection({
                        address: data.address,
                    }),
                })
                .catch((error) => {
                    console.error(error);
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
        onError: (_error, _variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    queryKeys.storyNetwork.list(),
                    context.previousData
                );
            }
        },
        onSettled: (_data, _error, variables, _context) => {
            queryClient
                .invalidateQueries({ queryKey: queryKeys.spg.all })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({ queryKey: queryKeys.spg.list() })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.spg.collection({
                        address: variables.address,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useDeleteSPGMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteSPG,
        onSuccess: (_data, variables, _context) => {
            queryClient
                .invalidateQueries({ queryKey: queryKeys.spg.all })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({ queryKey: queryKeys.spg.list() })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.spg.collection({
                        address: variables.address,
                    }),
                })
                .catch((error) => {
                    console.error(error);
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
            await queryClient.setQueryData(queryKeys.spg.all, (old: any) => [
                ...(old ?? []),
                variables,
            ]);
            return { previousData };
        },
        onError: (_error, _variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    queryKeys.spg.all,
                    context.previousData
                );
            }
        },
        onSettled: (_data, _error, variables, _context) => {
            queryClient
                .invalidateQueries({ queryKey: queryKeys.spg.all })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({ queryKey: queryKeys.spg.list() })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.spg.collection({
                        address: variables.address,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}
