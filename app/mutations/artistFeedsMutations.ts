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
            queryClient
                .invalidateQueries({
                    queryKey: artistFeedKeys.list({
                        artistId: variables.input.artistId,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistFeedKeys.byId(data?.id ?? ""),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistFeedKeys.reactions({
                        artistFeedId: data?.id,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistFeedKeys.all,
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useUpdateArtistFeed() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateArtistFeed,
        onSuccess: (data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: artistFeedKeys.list({
                        artistId: variables.input.artistId,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistFeedKeys.byId(data?.id ?? ""),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistFeedKeys.reactions({
                        artistFeedId: data?.id,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistFeedKeys.all,
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useDeleteArtistFeed() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteArtistFeed,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: artistFeedKeys.list({
                        artistId: variables.input.artistId,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistFeedKeys.all,
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistFeedKeys.byId(variables.input.id),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistFeedKeys.reactions({
                        artistFeedId: variables.input.id,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useCreateArtistFeedReaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createArtistFeedReaction,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: artistFeedKeys.reactions({
                        artistFeedId: variables.input.artistFeedId,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistFeedKeys.all,
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistFeedKeys.byId(variables.input.artistFeedId),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistFeedKeys.reactions({
                        artistFeedId: variables.input.artistFeedId,
                        playerId: variables.input.playerId,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useUpdateArtistFeedReaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateArtistFeedReaction,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: artistFeedKeys.reactions({
                        artistFeedId: variables.input.artistFeedId,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistFeedKeys.all,
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistFeedKeys.byId(variables.input.artistFeedId),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistFeedKeys.reactions({
                        artistFeedId: variables.input.artistFeedId,
                        playerId: variables.input.playerId,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useDeleteArtistFeedReaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteArtistFeedReaction,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: artistFeedKeys.reactions({
                        artistFeedId: variables.input.id,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistFeedKeys.all,
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistFeedKeys.byId(variables.input.id),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: artistFeedKeys.reactions({
                        artistFeedId: variables.input.id,
                    }),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}
