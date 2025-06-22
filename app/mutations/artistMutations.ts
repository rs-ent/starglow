/// app/mutations/artistMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    createArtist,
    deleteArtist,
    updateArtist,
    createArtistMessage,
    updateArtistMessage,
    deleteArtistMessage,
    tokenGating,
} from "../actions/artists";
import { artistKeys } from "../queryKeys";

export function useCreateArtist() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createArtist,
        onSuccess: (data, _variables) => {
            queryClient
                .invalidateQueries({ queryKey: artistKeys.all })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistKeys.list(),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistKeys.detail({ id: data.id }),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useUpdateArtist() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateArtist,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({ queryKey: artistKeys.all })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({ queryKey: artistKeys.list() })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistKeys.detail({ name: variables.name }),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistKeys.messages({ artistId: variables.id }),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useDeleteArtist() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteArtist,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({ queryKey: artistKeys.all })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistKeys.list(),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistKeys.detail({ id: variables.id }),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useCreateArtistMessage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createArtistMessage,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({ queryKey: artistKeys.all })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistKeys.messages({
                        artistId: variables.artistId,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistKeys.detail({ id: variables.artistId }),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useUpdateArtistMessage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateArtistMessage,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({ queryKey: artistKeys.all })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistKeys.detail({ id: variables.artistId }),
                })
                .catch((error) => {
                    console.error(error);
                });

            if (variables.artistId) {
                queryClient
                    .invalidateQueries({
                        queryKey: artistKeys.messages({
                            artistId: variables.artistId,
                        }),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        },
    });
}

export function useDeleteArtistMessage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteArtistMessage,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({ queryKey: artistKeys.all })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistKeys.messages({
                        artistId: variables.artistId,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistKeys.detail({ id: variables.artistId }),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useTokenGating() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: tokenGating,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: artistKeys.tokenGating(variables),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}
