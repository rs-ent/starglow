/// app\hooks\usePlayer.tsx

"use client";

import {
    InvitePlayerParams,
    SetPlayerInput,
    UpdatePlayerSettingsInput,
} from "@/app/actions/player";
import {
    useSetPlayerMutation,
    useInvitePlayerMutation,
    useUpdatePlayerSettingsMutation,
} from "@/app/mutations/playerMutations";
import {
    useDBUserFromPlayerQuery,
    usePlayerQuery,
} from "@/app/queries/playerQueries";

import type {
    GetPlayerInput,
    GetDBUserFromPlayerInput} from "@/app/actions/player";

export function usePlayerGet({
    getPlayerInput,
    getDBUserFromPlayerInput,
}: {
    getPlayerInput?: GetPlayerInput;
    getDBUserFromPlayerInput?: GetDBUserFromPlayerInput;
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

    return {
        player,
        isPlayerLoading,
        playerError,

        user,
        isUserLoading,
        userError,

        usePlayerQuery,
        useDBUserFromPlayerQuery,
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
