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
    usePlayerProfileQuery,
} from "@/app/queries/playerQueries";

import type {
    GetPlayerInput,
    GetDBUserFromPlayerInput,
    GetPlayerProfileInput,
} from "@/app/actions/player";

export function usePlayerGet({
    getPlayerInput,
    getDBUserFromPlayerInput,
    getPlayerProfileInput,
}: {
    getPlayerInput?: GetPlayerInput;
    getDBUserFromPlayerInput?: GetDBUserFromPlayerInput;
    getPlayerProfileInput?: GetPlayerProfileInput;
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
        data: playerProfile,
        isLoading: isPlayerProfileLoading,
        error: playerProfileError,
        refetch: refetchPlayerProfile,
    } = usePlayerProfileQuery(getPlayerProfileInput);

    return {
        player,
        isPlayerLoading,
        playerError,

        user,
        isUserLoading,
        userError,

        playerProfile,
        isPlayerProfileLoading,
        playerProfileError,
        refetchPlayerProfile,

        usePlayerQuery,
        useDBUserFromPlayerQuery,
        usePlayerProfileQuery,
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
