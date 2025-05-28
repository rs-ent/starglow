/// app/hooks/useArtistFeeds.ts

"use client";

import {
    useArtistFeedsQuery,
    useArtistFeedReactionsQuery,
} from "@/app/queries/artistFeedsQueries";
import {
    useCreateArtistFeed,
    useUpdateArtistFeed,
    useDeleteArtistFeed,
    useCreateArtistFeedReaction,
    useUpdateArtistFeedReaction,
    useDeleteArtistFeedReaction,
} from "@/app/mutations/artistFeedsMutations";
import type {
    GetArtistFeedsInput,
    GetArtistFeedReactionsInput,
    CreateArtistFeedInput,
    UpdateArtistFeedInput,
    DeleteArtistFeedInput,
    CreateArtistFeedReactionInput,
    UpdateArtistFeedReactionInput,
    DeleteArtistFeedReactionInput,
    ArtistFeedWithReactions,
} from "@/app/actions/artistFeeds";

export function useArtistFeedsGet({
    getArtistFeedsInput,
    getArtistFeedReactionsInput,
}: {
    getArtistFeedsInput?: GetArtistFeedsInput;
    getArtistFeedReactionsInput?: GetArtistFeedReactionsInput;
}) {
    const {
        data: artistFeeds,
        isLoading: isLoadingArtistFeeds,
        isError: isErrorArtistFeeds,
        refetch: refetchArtistFeeds,
    } = useArtistFeedsQuery(getArtistFeedsInput);
    const {
        data: artistFeedReactions,
        isLoading: isLoadingArtistFeedReactions,
        isError: isErrorArtistFeedReactions,
        refetch: refetchArtistFeedReactions,
    } = useArtistFeedReactionsQuery(getArtistFeedReactionsInput);

    const isLoading = isLoadingArtistFeeds || isLoadingArtistFeedReactions;
    const error = isErrorArtistFeeds || isErrorArtistFeedReactions;

    const refetch = () =>
        Promise.all([refetchArtistFeeds(), refetchArtistFeedReactions()]);

    return {
        artistFeeds,
        artistFeedReactions,

        isLoading,
        error,

        refetchArtistFeeds,
        refetchArtistFeedReactions,

        refetch,
    };
}

export function useArtistFeedsSet() {
    const {
        mutateAsync: createArtistFeed,
        isPending: isPendingCreateArtistFeed,
        error: errorCreateArtistFeed,
    } = useCreateArtistFeed();
    const {
        mutateAsync: updateArtistFeed,
        isPending: isPendingUpdateArtistFeed,
        error: errorUpdateArtistFeed,
    } = useUpdateArtistFeed();
    const {
        mutateAsync: deleteArtistFeed,
        isPending: isPendingDeleteArtistFeed,
        error: errorDeleteArtistFeed,
    } = useDeleteArtistFeed();

    const {
        mutateAsync: createArtistFeedReaction,
        isPending: isPendingCreateArtistFeedReaction,
        error: errorCreateArtistFeedReaction,
    } = useCreateArtistFeedReaction();
    const {
        mutateAsync: updateArtistFeedReaction,
        isPending: isPendingUpdateArtistFeedReaction,
        error: errorUpdateArtistFeedReaction,
    } = useUpdateArtistFeedReaction();
    const {
        mutateAsync: deleteArtistFeedReaction,
        isPending: isPendingDeleteArtistFeedReaction,
        error: errorDeleteArtistFeedReaction,
    } = useDeleteArtistFeedReaction();

    const isPending =
        isPendingCreateArtistFeed ||
        isPendingUpdateArtistFeed ||
        isPendingDeleteArtistFeed ||
        isPendingCreateArtistFeedReaction ||
        isPendingUpdateArtistFeedReaction ||
        isPendingDeleteArtistFeedReaction;
    const error =
        errorCreateArtistFeed ||
        errorUpdateArtistFeed ||
        errorDeleteArtistFeed ||
        errorCreateArtistFeedReaction ||
        errorUpdateArtistFeedReaction ||
        errorDeleteArtistFeedReaction;

    return {
        createArtistFeed,
        updateArtistFeed,
        deleteArtistFeed,
        createArtistFeedReaction,
        updateArtistFeedReaction,
        deleteArtistFeedReaction,

        isPending,
        error,
    };
}
