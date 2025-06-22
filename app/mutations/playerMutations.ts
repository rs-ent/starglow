/// app\mutations\playerMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    setPlayer,
    invitePlayer,
    updatePlayerSettings,
} from "@/app/actions/player";
import { playerKeys } from "@/app/queryKeys";

export function useSetPlayerMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: setPlayer,
        onSuccess: (data, _variables) => {
            queryClient
                .invalidateQueries({ queryKey: playerKeys.all })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: playerKeys.byId(data?.player?.id || ""),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useInvitePlayerMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: invitePlayer,
        onSuccess: (data, variables) => {
            queryClient
                .invalidateQueries({ queryKey: playerKeys.all })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: playerKeys.byId(variables?.referredUser.id || ""),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}

export function useUpdatePlayerSettingsMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updatePlayerSettings,
        onSuccess: (_data, variables) => {
            queryClient
                .invalidateQueries({ queryKey: playerKeys.all })
                .catch((error) => {
                    console.error(error);
                });
            queryClient
                .invalidateQueries({
                    queryKey: playerKeys.byId(variables?.playerId || ""),
                })
                .catch((error) => {
                    console.error(error);
                });
        },
    });
}
