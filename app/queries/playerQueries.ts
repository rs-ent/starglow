/// app\queries\playerQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { playerKeys } from "@/app/queryKeys";
import { getPlayer } from "@/app/actions/player";
import type { GetPlayerInput } from "@/app/actions/player";

export function usePlayerQuery(input?: GetPlayerInput) {
    return useQuery({
        queryKey: playerKeys.byId(input?.playerId || ""),
        queryFn: () => getPlayer(input),
        enabled: Boolean(input?.playerId),
    });
}
