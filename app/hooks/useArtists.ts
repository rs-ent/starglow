/// app/hooks/useArtists.ts

"use client";

import {
    useCreateArtist,
    useUpdateArtist,
    useDeleteArtist,
    useCreateArtistMessage,
    useUpdateArtistMessage,
    useUpdateArtistOrder,
    useTokenGating,
    useDeleteArtistMessage,
} from "@/app/mutations/artistMutations";
import {
    useArtists,
    useArtist,
    useArtistMessages,
    useTokenGatingQuery,
    usePlayers,
} from "@/app/queries/artistQueries";

import type {
    GetArtistsInput,
    GetArtistInput,
    GetArtistMessagesInput,
    TokenGatingInput,
    GetPlayersInput,
} from "@/app/actions/artists";

export function useArtistsGet({
    getArtistsInput,
    getArtistInput,
    getArtistMessagesInput,
    getTokenGatingInput,
    getPlayersInput,
}: {
    getArtistsInput?: GetArtistsInput;
    getArtistInput?: GetArtistInput;
    getArtistMessagesInput?: GetArtistMessagesInput;
    getTokenGatingInput?: TokenGatingInput;
    getPlayersInput?: GetPlayersInput;
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
        refetch: refetchArtistMessages,
    } = useArtistMessages(getArtistMessagesInput);

    const {
        data: tokenGatingResult,
        isLoading: isTokenGatingLoading,
        error: tokenGatingError,
    } = useTokenGatingQuery(getTokenGatingInput);

    const {
        data: players,
        isLoading: isPlayersLoading,
        error: playersError,
        refetch: refetchPlayers,
    } = usePlayers(getPlayersInput);

    const isLoading =
        isArtistsLoading ||
        isArtistLoading ||
        isArtistMessagesLoading ||
        isTokenGatingLoading ||
        isPlayersLoading;
    const error =
        artistsError ||
        artistError ||
        artistMessagesError ||
        tokenGatingError ||
        playersError;

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
        refetchArtistMessages,

        tokenGatingResult,
        isTokenGatingLoading,
        tokenGatingError,

        players,
        isPlayersLoading,
        playersError,
        refetchPlayers,

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
        mutateAsync: deleteArtistMessage,
        isPending: isDeletingArtistMessage,
        error: deleteArtistMessageError,
    } = useDeleteArtistMessage();

    const {
        mutateAsync: updateArtistOrder,
        isPending: isUpdatingArtistOrder,
        error: updateArtistOrderError,
    } = useUpdateArtistOrder();

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
        isUpdatingArtistOrder ||
        isTokenGating;
    const error =
        createArtistError ||
        updateArtistError ||
        deleteArtistError ||
        createArtistMessageError ||
        updateArtistMessageError ||
        updateArtistOrderError ||
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

        deleteArtistMessage,
        isDeletingArtistMessage,
        deleteArtistMessageError,

        updateArtistOrder,
        isUpdatingArtistOrder,
        updateArtistOrderError,

        tokenGating,
        isTokenGating,
        tokenGatingError,

        isLoading,
        error,
    };
}
