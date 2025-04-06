/// app\queries\questsQueries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import {
    getDailyQuest,
    getMissions,
    getQuestById,
    getCompletedQuests,
} from "@/app/actions/quests";
import { queryKeys } from "@/app/queryKeys";
import { Quest } from "@prisma/client";

export function useDailyQuests() {
    return useQuery<Quest[]>({
        queryKey: queryKeys.quests.daily(),
        queryFn: () => getDailyQuest(),
    });
}

export function useMissions() {
    return useQuery<Quest[]>({
        queryKey: queryKeys.quests.missions(),
        queryFn: () => getMissions(),
    });
}

export function useQuestById(id: string) {
    return useQuery<Quest | null>({
        queryKey: queryKeys.quests.byId(id),
        queryFn: () => getQuestById(id),
        enabled: !!id,
    });
}

export function useCompletedQuests(playerId: string) {    
    return useQuery<string[]>({
        queryKey: queryKeys.quests.completed(playerId),
        queryFn: () => getCompletedQuests(playerId),
        enabled: !!playerId,
    });
}
