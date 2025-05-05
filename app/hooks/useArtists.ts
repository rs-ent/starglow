/// app/hooks/useArtists.ts

"use client";

import {
    useArtists,
    useArtist,
    useArtistMessages,
    useTokenGatingQuery,
} from "@/app/queries/artistQueries";

import {
    useCreateArtist,
    useUpdateArtist,
    useDeleteArtist,
    useCreateArtistMessage,
    useUpdateArtistMessage,
    useTokenGating,
} from "@/app/mutations/artistMutations";

import type {
    GetArtistsInput,
    GetArtistInput,
    GetArtistMessagesInput,
    TokenGatingInput,
} from "@/app/actions/artists";

export function useArtistsGet({
    getArtistsInput,
    getArtistInput,
    getArtistMessagesInput,
    getTokenGatingInput,
}: {
    getArtistsInput?: GetArtistsInput;
    getArtistInput?: GetArtistInput;
    getArtistMessagesInput?: GetArtistMessagesInput;
    getTokenGatingInput?: TokenGatingInput;
}) {
    const {
        data: artists,
        isLoading: isArtistsLoading,
        error: artistsError,
    } = useArtists(getArtistsInput);

    const {
        data: artist,
        isLoading: isArtistLoading,
        error: artistError,
    } = useArtist(getArtistInput);

    const {
        data: artistMessages,
        isLoading: isArtistMessagesLoading,
        error: artistMessagesError,
    } = useArtistMessages(getArtistMessagesInput);

    const {
        data: tokenGatingResult,
        isLoading: isTokenGatingLoading,
        error: tokenGatingError,
    } = useTokenGatingQuery(getTokenGatingInput);

    const isLoading =
        isArtistsLoading ||
        isArtistLoading ||
        isArtistMessagesLoading ||
        isTokenGatingLoading;
    const error =
        artistsError || artistError || artistMessagesError || tokenGatingError;

    return {
        artists,
        isArtistsLoading,
        artistsError,

        artist,
        isArtistLoading,
        artistError,

        artistMessages,
        isArtistMessagesLoading,
        artistMessagesError,

        tokenGatingResult,
        isTokenGatingLoading,
        tokenGatingError,

        isLoading,
        error,
    };
}

export function useArtistSet() {
    const {
        mutateAsync: createArtist,
        isPending: isCreating,
        error: createArtistError,
    } = useCreateArtist();

    const {
        mutateAsync: updateArtist,
        isPending: isUpdating,
        error: updateArtistError,
    } = useUpdateArtist();

    const {
        mutateAsync: deleteArtist,
        isPending: isDeleting,
        error: deleteArtistError,
    } = useDeleteArtist();

    const {
        mutateAsync: createArtistMessage,
        isPending: isCreatingArtistMessage,
        error: createArtistMessageError,
    } = useCreateArtistMessage();

    const {
        mutateAsync: updateArtistMessage,
        isPending: isUpdatingArtistMessage,
        error: updateArtistMessageError,
    } = useUpdateArtistMessage();

    const {
        mutateAsync: tokenGating,
        isPending: isTokenGating,
        error: tokenGatingError,
    } = useTokenGating();

    const isLoading =
        isCreating ||
        isUpdating ||
        isDeleting ||
        isCreatingArtistMessage ||
        isUpdatingArtistMessage ||
        isTokenGating;
    const error =
        createArtistError ||
        updateArtistError ||
        deleteArtistError ||
        createArtistMessageError ||
        updateArtistMessageError ||
        tokenGatingError;

    return {
        createArtist,
        isCreating,
        createArtistError,

        updateArtist,
        isUpdating,
        updateArtistError,

        deleteArtist,
        isDeleting,
        deleteArtistError,

        createArtistMessage,
        isCreatingArtistMessage,
        createArtistMessageError,

        updateArtistMessage,
        isUpdatingArtistMessage,
        updateArtistMessageError,

        tokenGating,
        isTokenGating,
        tokenGatingError,

        isLoading,
        error,
    };
}
