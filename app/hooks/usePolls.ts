/// app/hooks/usePolls.ts

"use client";

import {
    useCreatePollMutation,
    useDeletePollMutation,
    useUpdatePollMutation,
    useParticipatePollMutation,
    useUpdateUserSelectionMutation,
} from "../mutations/pollsMutations";
import {
    usePollsQuery,
    usePollQuery,
    useTokenGatingQuery,
    usePollResultQuery,
    usePollsResultsQuery,
    useUserSelectionQuery,
} from "../queries/pollsQueries";
import type {
    GetPollsInput,
    GetPollResultInput,
    GetPollsResultsInput,
    TokenGatingInput,
    GetUserSelectionInput,
    PaginationInput,
} from "../actions/polls";

export function usePollsGet({
    getPollsInput,
    tokenGatingInput,
    pollResultInput,
    pollsResultsInput,
    userSelectionInput,
    pagination,
}: {
    getPollsInput?: GetPollsInput;
    tokenGatingInput?: TokenGatingInput;
    pollResultInput?: GetPollResultInput;
    pollsResultsInput?: GetPollsResultsInput;
    userSelectionInput?: GetUserSelectionInput;
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
        isLoadingUserSelection;
    const error =
        pollsError ||
        pollError ||
        tokenGatingError ||
        pollResultError ||
        pollsResultsError ||
        userSelectionError;

    return {
        pollsList,
        isLoading,
        error,
        poll,
        tokenGating,
        pollResult,
        pollsResults,
        userSelection,
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
        mutate: participatePoll,
        isPending: isParticipating,
        error: participateError,
    } = useParticipatePollMutation();

    const {
        mutate: updateUserSelection,
        isPending: isUpdatingUserSelection,
        error: updateUserSelectionError,
    } = useUpdateUserSelectionMutation();

    const isLoading =
        isCreating ||
        isUpdating ||
        isDeleting ||
        isParticipating ||
        isUpdatingUserSelection;
    const error =
        createError ||
        updateError ||
        deleteError ||
        participateError ||
        updateUserSelectionError;

    return {
        createPoll,
        updatePoll,
        deletePoll,
        participatePoll,
        updateUserSelection,
        isLoading,
        error,
    };
}
