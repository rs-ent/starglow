/// app\hooks\usePlayer.tsx

"use client";

import {
    useSetPlayerMutation,
    useInvitePlayerMutation,
    useUpdatePlayerSettingsMutation,
} from "@/app/mutations/playerMutations";
import {
    useDBUserFromPlayerQuery,
    usePlayerQuery,
    usePlayerImageQuery,
} from "@/app/queries/playerQueries";

import type {
    GetPlayerInput,
    GetDBUserFromPlayerInput,
    GetPlayerImageInput,
} from "@/app/actions/player";

export function usePlayerGet({
    getPlayerInput,
    getDBUserFromPlayerInput,
    getPlayerImageInput,
}: {
    getPlayerInput?: GetPlayerInput;
    getDBUserFromPlayerInput?: GetDBUserFromPlayerInput;
    getPlayerImageInput?: GetPlayerImageInput;
}) {
    const {
        data: player,
        isLoading: isPlayerLoading,
        error: playerError,
    } = usePlayerQuery(getPlayerInput);

    const {
        data: user,
        isLoading: isUserLoading,
        error: userError,
    } = useDBUserFromPlayerQuery(getDBUserFromPlayerInput);

    const {
        data: playerImage,
        isLoading: isPlayerImageLoading,
        error: playerImageError,
        refetch: refetchPlayerImage,
    } = usePlayerImageQuery(getPlayerImageInput);

    return {
        player,
        isPlayerLoading,
        playerError,

        user,
        isUserLoading,
        userError,

        playerImage,
        isPlayerImageLoading,
        playerImageError,
        refetchPlayerImage,

        usePlayerQuery,
        useDBUserFromPlayerQuery,
        usePlayerImageQuery,
    };
}

export function usePlayerSet() {
    const {
        mutateAsync: setPlayer,
        isPending: isSetPlayerPending,
        error: setPlayerError,
    } = useSetPlayerMutation();

    const {
        mutateAsync: invitePlayer,
        isPending: isInvitePlayerPending,
        error: invitePlayerError,
    } = useInvitePlayerMutation();

    const {
        mutateAsync: updatePlayerSettings,
        isPending: isUpdatePlayerSettingsPending,
        error: updatePlayerSettingsError,
    } = useUpdatePlayerSettingsMutation();

    return {
        setPlayer,
        isSetPlayerPending,
        setPlayerError,

        invitePlayer,
        isInvitePlayerPending,
        invitePlayerError,

        updatePlayerSettings,
        isUpdatePlayerSettingsPending,
        updatePlayerSettingsError,

        useSetPlayerMutation,
        useInvitePlayerMutation,
        useUpdatePlayerSettingsMutation,
    };
}
