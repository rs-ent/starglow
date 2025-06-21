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
    useTokenGatingQuery,
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
    TokenGatingInput,
    GetUserSelectionInput,
    PaginationInput,
    GetPollLogsInput,
    GetPlayerPollLogsInput,
} from "../actions/polls";

export function usePollsGet({
    getPollsInput,
    tokenGatingInput,
    pollResultInput,
    pollsResultsInput,
    userSelectionInput,
    getPollLogsInput,
    getPlayerPollLogsInput,
    pagination,
}: {
    getPollsInput?: GetPollsInput;
    tokenGatingInput?: TokenGatingInput;
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
        data: tokenGating,
        isLoading: isLoadingTokenGating,
        error: tokenGatingError,
    } = useTokenGatingQuery(tokenGatingInput);

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
        isLoadingTokenGating ||
        isLoadingPollResult ||
        isLoadingPollsResults ||
        isLoadingUserSelection ||
        isLoadingPollLogs ||
        isLoadingPlayerPollLogs;
    const error =
        pollsError ||
        pollError ||
        tokenGatingError ||
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
        tokenGating,
        pollResult,
        pollsResults,
        userSelection,
        pollLogs,
        playerPollLogs,

        isLoadingPolls,
        isLoadingPoll,
        isLoadingTokenGating,
        isLoadingPollResult,
        isLoadingPollsResults,
        isLoadingUserSelection,
        isLoadingPollLogs,
        isLoadingPlayerPollLogs,

        pollsError,
        pollError,
        tokenGatingError,
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
