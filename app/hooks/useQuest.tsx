/// app\hooks\useQuest.tsx

"use client";

import { useState } from "react";
import type { RewardCurrency } from "@/app/types/player";
import {
    useDailyQuests,
    useMissions,
    useQuestById,
    useCompletedQuests,
} from "@/app/queries/questsQueries";
import {
    useCompleteQuest,
    useAddRewards,
} from "@/app/mutations/questsMutations";
import { useToast } from "./useToast";

export function useQuests() {
    const [isProcessing, setIsProcessing] = useState(false);
    const toast = useToast();

    const completedQuestMutation = useCompleteQuest();
    const addRewardsMutation = useAddRewards();

    const getDailyQuests = () => {
        const { data: quests = [], isLoading } = useDailyQuests();
        return { quests, isLoading };
    };

    const getMissions = () => {
        const { data: missions = [], isLoading } = useMissions();
        return { missions, isLoading };
    };

    const getQuestById = (id: string) => {
        const { data: quest = null, isLoading } = useQuestById(id);
        return { quest, isLoading };
    };

    const getCompletedQuests = (playerId: string) => {
        const { data: completedQuests = [], isLoading } =
            useCompletedQuests(playerId);
        return { completedQuests, isLoading };
    };

    const completeQuest = async (
        playerId: string,
        questId: string,
        rewards: number,
        rewardCurrency: RewardCurrency
    ) => {
        setIsProcessing(true);
        try {
            const result = await completedQuestMutation.mutateAsync({
                playerId,
                questId,
                rewards,
                rewardCurrency,
            });
            toast.success("Quest Completed successfully!");
            return result;
        } catch (error) {
            toast.error("Failed to complete quest. Please try again.");
            throw error;
        } finally {
            setIsProcessing(false);
        }
    };

    const addPlayerRewards = async (params: {
        playerId: string;
        questId: string;
        questLogId: string;
        amount: number;
        currency: RewardCurrency;
        reason?: string;
        pollId?: string;
        pollLogId?: string;
    }) => {
        try {
            const result = await addRewardsMutation.mutateAsync(params);
            toast.success("Rewards added successfully");
            return result;
        } catch (error) {
            console.error("Error adding rewards:", error);
            toast.error("Failed to add rewards");
            throw error;
        }
    };

    return {
        isProcessing,
        getDailyQuests,
        getMissions,
        getQuestById,
        getCompletedQuests,
        completeQuest,
        addPlayerRewards,
    };
}
