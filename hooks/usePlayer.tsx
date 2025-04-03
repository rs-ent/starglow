/// hooks/usePlayer.tsx

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import {
    getPlayer as getPlayerAction,
    updatePlayerCurrency as updatePlayerCurrencyAction,
    addCompletedQuest as addCompletedQuestAction,
    resetPlayerData as resetPlayerDataAction,
} from "@/app/actions/player";
import { useToast } from "./useToast";

export function usePlayer(playerId: string) {
    const queryClient = useQueryClient();
    const toast = useToast();

    // get player
    const {
        data: player,
        isLoading,
        error,
    } = useQuery({
        queryKey: queryKeys.player.byId(playerId),
        queryFn: () => getPlayerAction(playerId),
        enabled: !!playerId,
    });

    // update player currency
    const updateCurrencyMutation = useMutation({
        mutationFn: updatePlayerCurrencyAction,
        onSuccess: (updatedPlayer) => {
            // invalidate player query
            queryClient.invalidateQueries({
                queryKey: queryKeys.player.byId(playerId),
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.currency });

            toast.success("Currency updated successfully!");
        },
        onError: (error: Error) => {
            toast.error("Failed to update currency: " + error.message);
        },
    });

    // add completed quest
    const addCompletedQuestMutation = useMutation({
        mutationFn: addCompletedQuestAction,
        onSuccess: (result) => {
            if (result.success) {
                // invalidate player query
                queryClient.invalidateQueries({
                    queryKey: queryKeys.player.byId(playerId),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.quests.all,
                });

                toast.success("Quest added to completed quests!");
            } else {
                toast.info(result.message || "Quest already completed");
            }
        },
        onError: (error: Error) => {
            toast.error("Failed to add completed quest: " + error.message);
        },
    });

    // reset player data
    const resetPlayerDataMutation = useMutation({
        mutationFn: () => resetPlayerDataAction(playerId),
        onSuccess: () => {
            // invalidate player query
            queryClient.invalidateQueries({
                queryKey: queryKeys.player.byId(playerId),
            });

            toast.success("Player data reset successfully!");
        },
        onError: (error: Error) => {
            toast.error("Failed to reset player data: " + error.message);
        },
    });

    // update currency
    const updateCurrency = async (
        currency: "points" | "SGP" | "SGT",
        amount: number
    ) => {
        return updateCurrencyMutation.mutateAsync({
            playerId,
            currency,
            amount,
        });
    };

    // add completed quest
    const addCompletedQuest = async (questId: string) => {
        return addCompletedQuestMutation.mutateAsync({
            playerId,
            questId,
        });
    };

    // get completed quests
    const getCompletedQuests = () => {
        return player?.questLogs || [];
    };

    // reset player data
    const resetPlayerData = async () => {
        return resetPlayerDataMutation.mutateAsync();
    };

    return {
        player,
        isLoading,
        error,
        updateCurrency,
        addCompletedQuest,
        getCompletedQuests,
        resetPlayerData,
    };
}
