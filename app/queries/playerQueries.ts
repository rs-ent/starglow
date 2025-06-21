/// app\queries\playerQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";

import { getDBUserFromPlayer, getPlayer } from "@/app/actions/player";
import { playerKeys, queryKeys } from "@/app/queryKeys";

import type {
    GetDBUserFromPlayerInput,
    GetPlayerInput,
} from "@/app/actions/player";

export function usePlayerQuery(input?: GetPlayerInput) {
    return useQuery({
        queryKey: playerKeys.byId(input?.playerId || ""),
        queryFn: () => getPlayer(input),
        enabled: Boolean(input?.playerId),
    });
}

export function useDBUserFromPlayerQuery(input?: GetDBUserFromPlayerInput) {
    return useQuery({
        queryKey: queryKeys.user.byPlayerId(input),
        queryFn: () => getDBUserFromPlayer(input),
        enabled: Boolean(input?.playerId),
    });
}
