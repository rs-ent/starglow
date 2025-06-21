/// app/mutations/artistFeedsMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    createArtistFeed,
    updateArtistFeed,
    deleteArtistFeed,
    createArtistFeedReaction,
    updateArtistFeedReaction,
    deleteArtistFeedReaction,
} from "../actions/artistFeeds";
import { artistFeedKeys } from "../queryKeys";

export function useCreateArtistFeed() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createArtistFeed,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: artistFeedKeys.list({
                    artistId: variables.input.artistId,
                }),
            });
            queryClient.invalidateQueries({
                queryKey: artistFeedKeys.byId(data?.id ?? ""),
            });
            queryClient.invalidateQueries({
                queryKey: artistFeedKeys.reactions({
                    artistFeedId: data?.id,
                }),
            });
            queryClient.invalidateQueries({
                queryKey: artistFeedKeys.all,
            });
        },
    });
}

export function useUpdateArtistFeed() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateArtistFeed,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: artistFeedKeys.list({
                    artistId: variables.input.artistId,
                }),
            });
            queryClient.invalidateQueries({
                queryKey: artistFeedKeys.byId(data?.id ?? ""),
            });
            queryClient.invalidateQueries({
                queryKey: artistFeedKeys.reactions({
                    artistFeedId: data?.id,
                }),
            });
            queryClient.invalidateQueries({
                queryKey: artistFeedKeys.all,
            });
        },
    });
}

export function useDeleteArtistFeed() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteArtistFeed,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: artistFeedKeys.list({
                    artistId: variables.input.artistId,
                }),
            });
            queryClient.invalidateQueries({
                queryKey: artistFeedKeys.all,
            });
            queryClient.invalidateQueries({
                queryKey: artistFeedKeys.byId(variables.input.id),
            });
            queryClient.invalidateQueries({
                queryKey: artistFeedKeys.reactions({
                    artistFeedId: variables.input.id,
                }),
            });
        },
    });
}

export function useCreateArtistFeedReaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createArtistFeedReaction,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: artistFeedKeys.reactions({
                    artistFeedId: variables.input.artistFeedId,
                }),
            });
            queryClient.invalidateQueries({
                queryKey: artistFeedKeys.all,
            });
            queryClient.invalidateQueries({
                queryKey: artistFeedKeys.byId(variables.input.artistFeedId),
            });
            queryClient.invalidateQueries({
                queryKey: artistFeedKeys.reactions({
                    artistFeedId: variables.input.artistFeedId,
                    playerId: variables.input.playerId,
                }),
            });
        },
    });
}

export function useUpdateArtistFeedReaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateArtistFeedReaction,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: artistFeedKeys.reactions({
                    artistFeedId: variables.input.artistFeedId,
                }),
            });
            queryClient.invalidateQueries({
                queryKey: artistFeedKeys.all,
            });
            queryClient.invalidateQueries({
                queryKey: artistFeedKeys.byId(variables.input.artistFeedId),
            });
            queryClient.invalidateQueries({
                queryKey: artistFeedKeys.reactions({
                    artistFeedId: variables.input.artistFeedId,
                    playerId: variables.input.playerId,
                }),
            });
        },
    });
}

export function useDeleteArtistFeedReaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteArtistFeedReaction,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: artistFeedKeys.reactions({
                    artistFeedId: variables.input.id,
                }),
            });
            queryClient.invalidateQueries({
                queryKey: artistFeedKeys.all,
            });
            queryClient.invalidateQueries({
                queryKey: artistFeedKeys.byId(variables.input.id),
            });
            queryClient.invalidateQueries({
                queryKey: artistFeedKeys.reactions({
                    artistFeedId: variables.input.id,
                }),
            });
        },
    });
}
