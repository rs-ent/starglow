/// app/hooks/useArtists.ts

"use client";

import {
    useArtists,
    useArtist,
    useArtistMessages,
} from "@/app/queries/artistQueries";

import {
    useCreateArtist,
    useUpdateArtist,
    useDeleteArtist,
    useCreateArtistMessage,
    useUpdateArtistMessage,
} from "@/app/mutations/artistMutations";

import type {
    GetArtistsInput,
    GetArtistInput,
    GetArtistMessagesInput,
    CreateArtistInput,
    UpdateArtistInput,
    DeleteArtistInput,
    CreateArtistMessageInput,
    UpdateArtistMessageInput,
} from "@/app/actions/artists";

export function useArtistsGet({
    getArtistsInput,
    getArtistInput,
    getArtistMessagesInput,
}: {
    getArtistsInput?: GetArtistsInput;
    getArtistInput?: GetArtistInput;
    getArtistMessagesInput?: GetArtistMessagesInput;
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

    const isLoading =
        isArtistsLoading || isArtistLoading || isArtistMessagesLoading;
    const error = artistsError || artistError || artistMessagesError;

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

    const isLoading =
        isCreating ||
        isUpdating ||
        isDeleting ||
        isCreatingArtistMessage ||
        isUpdatingArtistMessage;
    const error =
        createArtistError ||
        updateArtistError ||
        deleteArtistError ||
        createArtistMessageError ||
        updateArtistMessageError;

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

        isLoading,
        error,
    };
}
