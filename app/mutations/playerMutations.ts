/// app\mutations\playerMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    setPlayer,
    invitePlayer,
    updatePlayerSettings,
} from "@/app/actions/player";
import { playerKeys } from "@/app/queryKeys";

async function invalidatePlayerQueries(
    queryClient: ReturnType<typeof useQueryClient>,
    playerIds: string[],
    includeProfile = false
) {
    try {
        const invalidationPromises = playerIds
            .map((playerId) => [
                queryClient
                    .invalidateQueries({
                        queryKey: playerKeys.byId(playerId),
                    })
                    .catch((error) => {
                        console.error(error);
                    }),
                ...(includeProfile
                    ? [
                          queryClient
                              .invalidateQueries({
                                  queryKey: playerKeys.profile(playerId),
                              })
                              .catch((error) => {
                                  console.error(error);
                              }),
                      ]
                    : []),
            ])
            .flat();

        await Promise.all(invalidationPromises);
    } catch (error) {
        console.error("[Player Query Invalidation]", error);
    }
}

export function useSetPlayerMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: setPlayer,
        onSuccess: (data, _variables) => {
            if (data?.player?.id) {
                invalidatePlayerQueries(queryClient, [data.player.id]).catch(
                    (error) => {
                        console.error(error);
                    }
                );
            }
        },
    });
}

export function useInvitePlayerMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: invitePlayer,
        onSuccess: (data, variables) => {
            const playerIds = [
                data?.referredPlayer?.id,
                data?.referrerPlayer?.id,
                variables?.referredUser?.id,
            ].filter((id): id is string => Boolean(id));

            if (playerIds.length > 0) {
                invalidatePlayerQueries(queryClient, playerIds).catch(
                    (error) => {
                        console.error(error);
                    }
                );
            }
        },
    });
}

export function useUpdatePlayerSettingsMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updatePlayerSettings,
        onMutate: async (variables) => {
            if (!variables?.playerId) return;

            await queryClient.cancelQueries({
                queryKey: playerKeys.profile(variables.playerId),
            });

            const previousProfile = queryClient.getQueryData(
                playerKeys.profile(variables.playerId)
            );

            queryClient.setQueryData(
                playerKeys.profile(variables.playerId),
                (old: any) => {
                    if (!old) return old;
                    return {
                        ...old,
                        ...(variables.nickname !== undefined && {
                            name: variables.nickname,
                        }),
                        ...(variables.image !== undefined && {
                            image: variables.image,
                        }),
                    };
                }
            );

            return { previousProfile };
        },
        onError: (err, variables, context) => {
            if (context?.previousProfile && variables?.playerId) {
                queryClient.setQueryData(
                    playerKeys.profile(variables.playerId),
                    context.previousProfile
                );
            }
        },
        onSuccess: (_data, variables) => {
            if (variables?.playerId) {
                invalidatePlayerQueries(
                    queryClient,
                    [variables.playerId],
                    true
                ).catch((error) => {
                    console.error(error);
                });
            }
        },
    });
}
