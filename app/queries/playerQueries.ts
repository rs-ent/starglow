/// app\queries\playerQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";

import {
    getDBUserFromPlayer,
    getPlayer,
    getPlayerImage,
} from "@/app/actions/player";
import { playerKeys, queryKeys } from "@/app/queryKeys";

import type {
    GetDBUserFromPlayerInput,
    GetPlayerInput,
    GetPlayerImageInput,
} from "@/app/actions/player";

export function usePlayerQuery(input?: GetPlayerInput) {
    return useQuery({
        queryKey: playerKeys.byId(input?.playerId || ""),
        queryFn: () => getPlayer(input),
        enabled: Boolean(input?.playerId),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 5,
    });
}

export function useDBUserFromPlayerQuery(input?: GetDBUserFromPlayerInput) {
    return useQuery({
        queryKey: queryKeys.user.byPlayerId(input),
        queryFn: () => getDBUserFromPlayer(input),
        enabled: Boolean(input?.playerId),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 5,
    });
}

export function usePlayerImageQuery(input?: GetPlayerImageInput) {
    return useQuery({
        queryKey: playerKeys.image(input?.playerId || ""),
        queryFn: () => getPlayerImage(input),
        enabled: Boolean(input?.playerId),
        staleTime: 1000 * 60 * 30,
        gcTime: 1000 * 60 * 30,
    });
}
