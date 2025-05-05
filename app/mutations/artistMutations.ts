/// app/mutations/artistMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { artistKeys } from "../queryKeys";
import {
    createArtist,
    deleteArtist,
    updateArtist,
    createArtistMessage,
    updateArtistMessage,
    tokenGating,
} from "../actions/artists";

export function useCreateArtist() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createArtist,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: artistKeys.all });
            queryClient.invalidateQueries({
                queryKey: artistKeys.list(),
            });
            queryClient.invalidateQueries({
                queryKey: artistKeys.detail({ id: data.id }),
            });
        },
    });
}

export function useUpdateArtist() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateArtist,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: artistKeys.all });
            queryClient.invalidateQueries({ queryKey: artistKeys.list() });
            queryClient.invalidateQueries({
                queryKey: artistKeys.detail({ id: variables.id }),
            });
            queryClient.invalidateQueries({
                queryKey: artistKeys.detail({ name: variables.name }),
            });
            queryClient.invalidateQueries({
                queryKey: artistKeys.messages({ artistId: variables.id }),
            });
        },
    });
}

export function useDeleteArtist() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteArtist,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: artistKeys.all });
            queryClient.invalidateQueries({
                queryKey: artistKeys.list(),
            });
            queryClient.invalidateQueries({
                queryKey: artistKeys.detail({ id: variables.id }),
            });
        },
    });
}

export function useCreateArtistMessage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createArtistMessage,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: artistKeys.all });
            queryClient.invalidateQueries({
                queryKey: artistKeys.messages({ artistId: variables.artistId }),
            });
            queryClient.invalidateQueries({
                queryKey: artistKeys.detail({ id: variables.artistId }),
            });
        },
    });
}

export function useUpdateArtistMessage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateArtistMessage,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: artistKeys.all });
            queryClient.invalidateQueries({
                queryKey: artistKeys.detail({ id: variables.artistId }),
            });

            if (variables.artistId) {
                queryClient.invalidateQueries({
                    queryKey: artistKeys.messages({
                        artistId: variables.artistId,
                    }),
                });
            }
        },
    });
}

export function useTokenGating() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: tokenGating,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: artistKeys.tokenGating(variables),
            });
        },
    });
}
