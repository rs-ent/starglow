/// app/story/metadata/mutations.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../queryKeys";
import {
    createMetadata,
    updateMetadata,
    deleteMetadata,
    uploadMedia,
    createBaseURI,
} from "./actions";

export function useCreateMetadataMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createMetadata,
        onSuccess: (data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.metadata.list({
                        type: variables.type,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.metadata.ipfs(data.cid),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.metadata.ipfs(data.url),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useUpdateMetadataMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateMetadata,
        onMutate: async (variables) => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.metadata.ipfs(
                    variables.cid || variables.url || ""
                ),
            });
            const previousData = queryClient.getQueryData(
                queryKeys.metadata.ipfs(
                    variables.id || variables.cid || variables.url || ""
                )
            );
            await queryClient.setQueryData(
                queryKeys.metadata.ipfs(
                    variables.id || variables.cid || variables.url || ""
                ),
                variables
            );
            await queryClient.setQueryData(
                queryKeys.metadata.list({
                    type: variables.type,
                }),
                (old: any) =>
                    old.filter((item: any) => item.id !== variables.id)
            );
            return { previousData };
        },
        onError: (_error, variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    queryKeys.metadata.ipfs(
                        variables.id || variables.cid || variables.url || ""
                    ),
                    context.previousData
                );
                queryClient.setQueryData(
                    queryKeys.metadata.list({
                        type: variables.type,
                    }),
                    context.previousData
                );
            }
        },
        onSettled: (_data, _error, variables, _context) => {
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.metadata.ipfs(
                        variables.id || variables.cid || variables.url || ""
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.metadata.list({
                        type: variables.type,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useDeleteMetadataMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteMetadata,
        onMutate: async (variables) => {
            await queryClient.cancelQueries({
                queryKey: queryKeys.metadata.ipfs(variables.id),
            });
            const previousData = queryClient.getQueryData(
                queryKeys.metadata.ipfs(variables.id)
            );
            await queryClient.setQueryData(
                queryKeys.metadata.ipfs(variables.id),
                null
            );
            return { previousData };
        },
        onError: (_error, variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    queryKeys.metadata.ipfs(variables.id),
                    context.previousData
                );
            }
        },
        onSettled: (data, _error, variables, _context) => {
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.metadata.ipfs(variables.id),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.metadata.list({
                        type: data?.type || "default",
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useUploadMediaMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: uploadMedia,
        onSuccess: (data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.metadata.list({
                        type: variables.type,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.metadata.ipfs(data.cid),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.metadata.ipfs(data.url),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useCreateBaseURIMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createBaseURI,
        onSuccess: (data, _variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.metadata.list({
                        type: "base-uri-directory",
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.metadata.ipfs(data.cid),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: queryKeys.metadata.ipfs(data.url),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}
