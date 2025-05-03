/// app\hooks\usePlayer.tsx

"use client";

import { usePlayerQuery } from "@/app/queries/playerQueries";
import {
    useSetPlayerMutation,
    useInvitePlayerMutation,
} from "@/app/mutations/playerMutations";
import {
    GetPlayerInput,
    InvitePlayerParams,
    SetPlayerInput,
} from "@/app/actions/player";

export function usePlayerGet({
    getPlayerInput,
}: {
    getPlayerInput?: GetPlayerInput;
}) {
    const {
        data: player,
        isLoading: isPlayerLoading,
        error: playerError,
    } = usePlayerQuery(getPlayerInput);

    return {
        player,
        isPlayerLoading,
        playerError,

        usePlayerQuery,
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
