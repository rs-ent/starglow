/// app/hooks/useArtists.ts

"use client";

import {
    useCreateArtist,
    useUpdateArtist,
    useDeleteArtist,
    useCreateArtistMessage,
    useUpdateArtistMessage,
    useUpdateArtistOrder,
    useDeleteArtistMessage,
} from "@/app/mutations/artistMutations";
import {
    useArtists,
    useArtist,
    useArtistMessages,
    usePlayers,
    useGetArtistsForStarListQuery,
} from "@/app/queries/artistQueries";

import type {
    GetArtistsInput,
    GetArtistInput,
    GetArtistMessagesInput,
    GetPlayersInput,
} from "@/app/actions/artists";

export interface UseArtistsGetInput {
    getArtistsInput?: GetArtistsInput;
    getArtistInput?: GetArtistInput;
    getArtistMessagesInput?: GetArtistMessagesInput;
    getPlayersInput?: GetPlayersInput;
}

export function useArtistsGet(input?: UseArtistsGetInput) {
    const {
        data: artists,
        isLoading: isArtistsLoading,
        error: artistsError,
    } = useArtists(input?.getArtistsInput);

    const {
        data: artist,
        isLoading: isArtistLoading,
        error: artistError,
    } = useArtist(input?.getArtistInput);

    const {
        data: artistMessages,
        isLoading: isArtistMessagesLoading,
        error: artistMessagesError,
        refetch: refetchArtistMessages,
    } = useArtistMessages(input?.getArtistMessagesInput);

    const {
        data: players,
        isLoading: isPlayersLoading,
        error: playersError,
        refetch: refetchPlayers,
    } = usePlayers(input?.getPlayersInput);

    const {
        data: artistsForStarList,
        isLoading: isArtistsForStarListLoading,
        error: artistsForStarListError,
        refetch: refetchArtistsForStarList,
    } = useGetArtistsForStarListQuery();

    const isLoading =
        isArtistsLoading ||
        isArtistLoading ||
        isArtistMessagesLoading ||
        isPlayersLoading ||
        isArtistsForStarListLoading;
    const error =
        artistsError ||
        artistError ||
        artistMessagesError ||
        playersError ||
        artistsForStarListError;

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

        players,
        isPlayersLoading,
        playersError,
        refetchPlayers,

        artistsForStarList,
        isArtistsForStarListLoading,
        artistsForStarListError,
        refetchArtistsForStarList,

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

    const isLoading =
        isCreating ||
        isUpdating ||
        isDeleting ||
        isCreatingArtistMessage ||
        isUpdatingArtistMessage ||
        isUpdatingArtistOrder;

    const error =
        createArtistError ||
        updateArtistError ||
        deleteArtistError ||
        createArtistMessageError ||
        updateArtistMessageError ||
        updateArtistOrderError;

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

        isLoading,
        error,
    };
}
