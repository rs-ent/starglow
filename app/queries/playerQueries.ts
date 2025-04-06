/// app\queries\playerQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { getPlayer, getPlayerCurrency } from "@/app/actions/player";
import type { RewardCurrency } from "@/app/types/player";
import { queryKeys } from "@/app/queryKeys";
import { Player } from "@prisma/client";

export function usePlayerQuery(id: string) {
    return useQuery<Player>({
        queryKey: queryKeys.player.byId(id),
        queryFn: () => getPlayer(id),
        enabled: Boolean(id),
    });
}

export function usePlayerCurrencyQuery(
    playerId: string,
    currency: RewardCurrency
) {
    return useQuery<number>({
        queryKey: queryKeys.player.currency(playerId, currency),
        queryFn: () => getPlayerCurrency(playerId, currency),
        enabled: Boolean(playerId),
    });
}
