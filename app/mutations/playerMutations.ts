/// app\mutations\playerMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    setPlayer,
    SetPlayerInput,
    invitePlayer,
    InvitePlayerParams,
    updatePlayerSettings,
    UpdatePlayerSettingsInput,
} from "@/app/actions/player";
import { playerKeys } from "@/app/queryKeys";

export function useSetPlayerMutation(input?: SetPlayerInput) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: setPlayer,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: playerKeys.all });
            queryClient.invalidateQueries({
                queryKey: playerKeys.byId(data?.player?.id || ""),
            });
        },
    });
}

export function useInvitePlayerMutation(input?: InvitePlayerParams) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: invitePlayer,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: playerKeys.all });
            queryClient.invalidateQueries({
                queryKey: playerKeys.byId(variables?.referredUser.id || ""),
            });
        },
    });
}

export function useUpdatePlayerSettingsMutation(
    input?: UpdatePlayerSettingsInput
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updatePlayerSettings,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: playerKeys.all });
            queryClient.invalidateQueries({
                queryKey: playerKeys.byId(variables?.playerId || ""),
            });
        },
    });
}
