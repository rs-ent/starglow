/// app\hooks\usePlayer.tsx

"use client";

import {
    useDBUserFromPlayerQuery,
    usePlayerQuery,
} from "@/app/queries/playerQueries";
import {
    useSetPlayerMutation,
    useInvitePlayerMutation,
} from "@/app/mutations/playerMutations";
import {
    GetPlayerInput,
    InvitePlayerParams,
    SetPlayerInput,
    GetDBUserFromPlayerInput,
} from "@/app/actions/player";

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

export function usePlayerSet({
    setPlayerInput,
    invitePlayerInput,
}: {
    setPlayerInput?: SetPlayerInput;
    invitePlayerInput?: InvitePlayerParams;
}) {
    const {
        mutateAsync: setPlayer,
        isPending: isSetPlayerPending,
        error: setPlayerError,
    } = useSetPlayerMutation(setPlayerInput);

    const {
        mutateAsync: invitePlayer,
        isPending: isInvitePlayerPending,
        error: invitePlayerError,
    } = useInvitePlayerMutation(invitePlayerInput);

    return {
        setPlayer,
        isSetPlayerPending,
        setPlayerError,

        invitePlayer,
        isInvitePlayerPending,
        invitePlayerError,

        useSetPlayerMutation,
        useInvitePlayerMutation,
    };
}
