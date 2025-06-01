/// app/mutations/pollsMutations.ts

"use client";

import {useMutation, useQueryClient} from "@tanstack/react-query";
import {playerAssetsKeys, pollKeys} from "../queryKeys";
import {
    createPoll,
    deletePoll,
    participatePoll,
    updateActivePoll,
    updatePoll,
    updateUserSelection,
} from "../actions/polls";

export function useCreatePollMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createPoll,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: pollKeys.all });
            queryClient.invalidateQueries({
                queryKey: pollKeys.list(),
            });
            queryClient.invalidateQueries({
                queryKey: pollKeys.lists(),
            });
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
        onSuccess: (updatePoll) => {
            queryClient.invalidateQueries({ queryKey: pollKeys.all });
            queryClient.invalidateQueries({
                queryKey: pollKeys.detail(updatePoll.id),
            });
            queryClient.invalidateQueries({
                queryKey: pollKeys.list(),
            });
            queryClient.invalidateQueries({
                queryKey: pollKeys.lists(),
            });
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
            queryClient.invalidateQueries({ queryKey: pollKeys.all });
            queryClient.invalidateQueries({
                queryKey: pollKeys.detail(deletedPoll.id),
            });
            queryClient.invalidateQueries({
                queryKey: pollKeys.list(),
            });
            queryClient.invalidateQueries({
                queryKey: pollKeys.lists(),
            });
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
            queryClient.invalidateQueries({
                queryKey: pollKeys.logs(variables.poll.id as any),
            });
            queryClient.invalidateQueries({
                queryKey: pollKeys.log(data.data?.id || ""),
            });
            queryClient.invalidateQueries({
                queryKey: pollKeys.logByUser(
                    variables.poll.id,
                    variables.player.id
                ),
            });
            queryClient.invalidateQueries({
                queryKey: pollKeys.result(variables.poll.id),
            });
            queryClient.invalidateQueries({
                queryKey: pollKeys.playerLogs(variables.player.id),
            });
            queryClient.invalidateQueries({
                queryKey: playerAssetsKeys.balances(
                    variables.player.id,
                ),
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
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: pollKeys.logs((data.data?.id as any) || ""),
            });
            queryClient.invalidateQueries({
                queryKey: pollKeys.log(data.data?.id || ""),
            });
            queryClient.invalidateQueries({
                queryKey: pollKeys.logByUser(
                    data.data?.pollId || "",
                    data.data?.playerId || ""
                ),
            });
        },
    });
}

export function useUpdateActivePollMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateActivePoll,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: pollKeys.all,
            });
            queryClient.invalidateQueries({
                queryKey: pollKeys.detail(variables.pollId),
            });
            queryClient.invalidateQueries({
                queryKey: pollKeys.list(),
            });
            queryClient.invalidateQueries({
                queryKey: pollKeys.lists(),
            });
        },
    });
}
