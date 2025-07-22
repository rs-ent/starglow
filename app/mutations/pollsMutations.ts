/// app/mutations/pollsMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    createPoll,
    deletePoll,
    participatePoll,
    updateActivePoll,
    updatePoll,
    updateUserSelection,
} from "../actions/polls";
import { playerAssetsKeys, pollKeys } from "../queryKeys";

export function useCreatePollMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createPoll,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: pollKeys.list(),
                })
                .catch((error) => {
                    console.error(error);
                });

            queryClient
                .invalidateQueries({
                    queryKey: pollKeys.lists(),
                })
                .catch((error) => {
                    console.error(error);
                });

            if (variables.artistId) {
                queryClient
                    .invalidateQueries({
                        queryKey: pollKeys.artistAllActivePollCount(
                            variables.artistId
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        },
        onError: (error) => {
            console.error("Error creating poll:", error);
        },
    });
}

export function useUpdatePollMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updatePoll,
        onSuccess: (updatePoll, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: pollKeys.detail(updatePoll.id),
                })
                .catch((error) => {
                    console.error(error);
                });

            const shouldInvalidateList =
                variables.title !== undefined ||
                variables.status !== undefined ||
                variables.isActive !== undefined ||
                variables.category !== undefined ||
                variables.startDate !== undefined ||
                variables.endDate !== undefined ||
                variables.showOnPollPage !== undefined ||
                variables.showOnStarPage !== undefined ||
                variables.exposeInScheduleTab !== undefined ||
                variables.artistId !== undefined;

            if (shouldInvalidateList) {
                queryClient
                    .invalidateQueries({
                        queryKey: pollKeys.list(),
                    })
                    .catch((error) => {
                        console.error(error);
                    });

                queryClient
                    .invalidateQueries({
                        queryKey: pollKeys.lists(),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }

            if (variables.isActive !== undefined && variables.artistId) {
                queryClient
                    .invalidateQueries({
                        queryKey: pollKeys.artistAllActivePollCount(
                            variables.artistId
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        },
        onError: (error) => {
            console.error("Error updating poll:", error);
        },
    });
}

export function useDeletePollMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deletePoll,
        onSuccess: (deletedPoll) => {
            queryClient
                .invalidateQueries({
                    queryKey: pollKeys.detail(deletedPoll.id),
                })
                .catch((error) => {
                    console.error(error);
                });

            queryClient
                .invalidateQueries({
                    queryKey: pollKeys.list(),
                })
                .catch((error) => {
                    console.error(error);
                });

            queryClient
                .invalidateQueries({
                    queryKey: pollKeys.lists(),
                })
                .catch((error) => {
                    console.error(error);
                });

            if (deletedPoll.artistId) {
                queryClient
                    .invalidateQueries({
                        queryKey: pollKeys.artistAllActivePollCount(
                            deletedPoll.artistId
                        ),
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        },
        onError: (error) => {
            console.error("Error deleting poll:", error);
        },
    });
}

export function useParticipatePollMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: participatePoll,
        onSuccess: (data, variables) => {
            if (!data.success) {
                throw new Error(data.error || "Error participating in poll");
            }
            queryClient
                .invalidateQueries({
                    queryKey: pollKeys.logs({ playerId: variables.player.id }),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: pollKeys.log(data.data?.id || ""),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: pollKeys.logByUser(
                        variables.pollId,
                        variables.player.id
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: pollKeys.result(variables.pollId),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: pollKeys.playerLogs(
                        variables.player.id,
                        variables.pollId
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: pollKeys.playerLogs(variables.player.id),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: pollKeys.lists(),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: playerAssetsKeys.balances(variables.player.id),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        onError: (error) => {
            console.error("Error creating poll log:", error);
            throw error;
        },
    });
}

export function useUpdateUserSelectionMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateUserSelection,
        onSuccess: (data, _variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: pollKeys.logs((data.data?.id as any) || ""),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: pollKeys.log(data.data?.id || ""),
                })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: pollKeys.logByUser(
                        data.data?.pollId || "",
                        data.data?.playerId || ""
                    ),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useUpdateActivePollMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateActivePoll,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({
                    queryKey: pollKeys.detail(variables.pollId),
                })
                .catch((error) => {
                    console.error(error);
                });

            queryClient
                .invalidateQueries({
                    queryKey: pollKeys.list(),
                })
                .catch((error) => {
                    console.error(error);
                });

            queryClient
                .invalidateQueries({
                    queryKey: pollKeys.lists(),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}
