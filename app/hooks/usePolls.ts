/// app/hooks/usePolls.ts

"use client";

import {
    useCreatePollMutation,
    useDeletePollMutation,
    useUpdatePollMutation,
    useParticipatePollMutation,
    useUpdateUserSelectionMutation,
    useUpdateActivePollMutation,
} from "../mutations/pollsMutations";
import {
    usePollsQuery,
    usePollQuery,
    usePollResultQuery,
    usePollsResultsQuery,
    useUserSelectionQuery,
    usePlayerPollLogsQuery,
    usePollLogsQuery,
} from "../queries/pollsQueries";

import type {
    GetPollsInput,
    GetPollResultInput,
    GetPollsResultsInput,
    GetUserSelectionInput,
    PaginationInput,
    GetPollLogsInput,
    GetPlayerPollLogsInput,
} from "../actions/polls";

export function usePollsGet({
    getPollsInput,
    pollResultInput,
    pollsResultsInput,
    userSelectionInput,
    getPollLogsInput,
    getPlayerPollLogsInput,
    pagination,
}: {
    getPollsInput?: GetPollsInput;
    pollResultInput?: GetPollResultInput;
    pollsResultsInput?: GetPollsResultsInput;
    userSelectionInput?: GetUserSelectionInput;
    getPollLogsInput?: GetPollLogsInput;
    getPlayerPollLogsInput?: GetPlayerPollLogsInput;
    pagination?: PaginationInput;
}) {
    const {
        data: pollsList,
        isLoading: isLoadingPolls,
        error: pollsError,
    } = usePollsQuery({ input: getPollsInput, pagination });

    const {
        data: poll,
        isLoading: isLoadingPoll,
        error: pollError,
    } = usePollQuery(getPollsInput?.id || "");

    const {
        data: pollResult,
        isLoading: isLoadingPollResult,
        error: pollResultError,
    } = usePollResultQuery(pollResultInput);

    const {
        data: pollsResults,
        isLoading: isLoadingPollsResults,
        error: pollsResultsError,
    } = usePollsResultsQuery(pollsResultsInput);

    const {
        data: pollLogs,
        isLoading: isLoadingPollLogs,
        error: pollLogsError,
    } = usePollLogsQuery(getPollLogsInput);

    const {
        data: playerPollLogs,
        isLoading: isLoadingPlayerPollLogs,
        error: playerPollLogsError,
    } = usePlayerPollLogsQuery(getPlayerPollLogsInput);

    const {
        data: userSelection,
        isLoading: isLoadingUserSelection,
        error: userSelectionError,
    } = useUserSelectionQuery(userSelectionInput);

    const isLoading =
        isLoadingPolls ||
        isLoadingPoll ||
        isLoadingPollResult ||
        isLoadingPollsResults ||
        isLoadingUserSelection ||
        isLoadingPollLogs ||
        isLoadingPlayerPollLogs;
    const error =
        pollsError ||
        pollError ||
        pollResultError ||
        pollsResultsError ||
        userSelectionError ||
        pollLogsError ||
        playerPollLogsError;

    return {
        pollsList,
        isLoading,
        error,
        poll,
        pollResult,
        pollsResults,
        userSelection,
        pollLogs,
        playerPollLogs,

        isLoadingPolls,
        isLoadingPoll,
        isLoadingPollResult,
        isLoadingPollsResults,
        isLoadingUserSelection,
        isLoadingPollLogs,
        isLoadingPlayerPollLogs,

        pollsError,
        pollError,
        pollResultError,
        pollsResultsError,
        userSelectionError,
        pollLogsError,
        playerPollLogsError,
    };
}

export function usePollsSet() {
    const {
        mutate: createPoll,
        isPending: isCreating,
        error: createError,
    } = useCreatePollMutation();

    const {
        mutate: updatePoll,
        isPending: isUpdating,
        error: updateError,
    } = useUpdatePollMutation();

    const {
        mutate: deletePoll,
        isPending: isDeleting,
        error: deleteError,
    } = useDeletePollMutation();

    const {
        mutateAsync: participatePoll,
        isPending: isParticipating,
        error: participateError,
    } = useParticipatePollMutation();

    const {
        mutate: updateUserSelection,
        isPending: isUpdatingUserSelection,
        error: updateUserSelectionError,
    } = useUpdateUserSelectionMutation();

    const {
        mutateAsync: updateActivePoll,
        isPending: isUpdatingActivePoll,
        error: updateActivePollError,
    } = useUpdateActivePollMutation();

    const isLoading =
        isCreating ||
        isUpdating ||
        isDeleting ||
        isParticipating ||
        isUpdatingUserSelection ||
        isUpdatingActivePoll;

    const error =
        createError ||
        updateError ||
        deleteError ||
        participateError ||
        updateUserSelectionError ||
        updateActivePollError;

    return {
        createPoll,
        updatePoll,
        deletePoll,
        participatePoll,
        updateUserSelection,
        updateActivePoll,

        isLoading,
        error,
    };
}
