/// app/mutations/artistMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    createArtist,
    deleteArtist,
    updateArtist,
    updateArtistOrder,
    createArtistMessage,
    updateArtistMessage,
    deleteArtistMessage,
} from "../actions/artists";
import { artistKeys } from "../queryKeys";

export function useCreateArtist() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createArtist,
        onSuccess: (data, variables) => {
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

            queryClient
                .invalidateQueries({
                    queryKey: artistKeys.star(),
                })
                .catch((error) => {
                    console.error(error);
                });

            if (variables.playerIds && variables.playerIds.length > 0) {
                queryClient
                    .invalidateQueries({
                        queryKey: artistKeys.players(),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        },
    });
}

export function useUpdateArtist() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateArtist,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: artistKeys.detail({ id: variables.id }),
                })
                .catch((error) => {
                    console.error(error);
                });

            const shouldInvalidateList =
                variables.name !== undefined ||
                variables.order !== undefined ||
                variables.hidden !== undefined ||
                variables.imageUrl !== undefined ||
                variables.logoUrl !== undefined ||
                variables.backgroundColors !== undefined ||
                variables.foregroundColors !== undefined;

            if (shouldInvalidateList) {
                queryClient
                    .invalidateQueries({ queryKey: artistKeys.list() })
                    .catch((error) => {
                        console.error(error);
                    });

                queryClient
                    .invalidateQueries({
                        queryKey: artistKeys.star(),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }

            if (variables.playerIds !== undefined) {
                queryClient
                    .invalidateQueries({
                        queryKey: artistKeys.players(),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        },
    });
}

export function useUpdateArtistOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateArtistOrder,
        onSuccess: () => {
            queryClient
                .invalidateQueries({ queryKey: artistKeys.list() })
                .catch((error) => {
                    console.error(error);
                });

            queryClient
                .invalidateQueries({ queryKey: artistKeys.star() })
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

            queryClient
                .invalidateQueries({
                    queryKey: artistKeys.star(),
                })
                .catch((error) => {
                    console.error(error);
                });

            queryClient
                .invalidateQueries({
                    queryKey: artistKeys.players(),
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

                queryClient
                    .invalidateQueries({
                        queryKey: artistKeys.detail({ id: variables.artistId }),
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
