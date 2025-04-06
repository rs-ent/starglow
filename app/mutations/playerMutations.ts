/// app\mutations\playerMutations.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePlayerCurrency, setPlayer } from "@/app/actions/player";
import type { RewardCurrency } from "@/app/types/player";
import { queryKeys } from "@/app/queryKeys";
import { Player } from "@prisma/client";

type SetPlayerRequest = {
    userId?: string;
    telegramId?: string;
};

export function useSetPlayer() {
    const queryClient = useQueryClient();

    return useMutation<Player, Error, SetPlayerRequest>({
        mutationFn: async ({ userId, telegramId }) => {
            return setPlayer(userId, telegramId);
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.player.byId(data.id),
            });
        },
    });
}

type UpdateCurrencyRequest = {
    playerId: string;
    currency: RewardCurrency;
    amount: number;
};

export function useUpdatePlayerCurrency() {
    const queryClient = useQueryClient();

    return useMutation<Player, Error, UpdateCurrencyRequest>({
        mutationFn: async ({ playerId, currency, amount }) => {
            return updatePlayerCurrency(playerId, currency, amount);
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.player.byId(variables.playerId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.player.currency(
                    variables.playerId,
                    variables.currency
                ),
            });
        },
    });
}
