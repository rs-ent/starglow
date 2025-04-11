/// app\hooks\usePlayer.tsx

"use client";

import { useState } from "react";
import { Player } from "@prisma/client";
import type { RewardCurrency } from "@/app/types/player";
import {
    usePlayerQuery,
    usePlayerCurrencyQuery,
} from "@/app/queries/playerQueries";
import {
    useSetPlayer,
    useUpdatePlayerCurrency,
} from "@/app/mutations/playerMutations";
import { useToast } from "./useToast";
import type { User } from "next-auth";
export function usePlayer(playerId?: string) {
    const [isProcessing, setIsProcessing] = useState(false);
    const toast = useToast();

    const {
        data: player,
        isLoading: isLoadingPlayer,
        error: playerError,
    } = usePlayerQuery(playerId || "");

    const setPlayerMutation = useSetPlayer();
    const updatePlayerCurrencyMutation = useUpdatePlayerCurrency();

    const getPlayerCurrency = (currency: RewardCurrency) => {
        if (!playerId) return { amount: 0, isLoading: false, error: null };

        const {
            data: amount = 0,
            isLoading: isLoadingCurrency,
            error: currencyError,
        } = usePlayerCurrencyQuery(playerId, currency);

        return { amount, isLoading: isLoadingCurrency, error: currencyError };
    };

    const updateCurrency = async (
        currency: RewardCurrency,
        amount: number
    ): Promise<Player> => {
        if (!playerId) throw new Error("Player ID is required");
        setIsProcessing(true);

        try {
            const result = await updatePlayerCurrencyMutation.mutateAsync({
                playerId,
                currency,
                amount,
            });

            const actionText = amount > 0 ? "Added" : "Removed";
            toast.success(`${actionText} ${amount} ${currency}`);
            return result;
        } catch (error) {
            console.error("Error updating player currency:", error);
            toast.error("Failed to update currency");
            throw error;
        } finally {
            setIsProcessing(false);
        }
    };

    const setPlayer = async (request: {
        user?: User;
        telegramId?: string;
    }): Promise<Player> => {
        setIsProcessing(true);

        try {
            const result = await setPlayerMutation.mutateAsync(request);
            return result;
        } catch (error) {
            console.error("Error setting player:", error);
            toast.error("Failed to set player");
            throw error;
        } finally {
            setIsProcessing(false);
        }
    };

    return {
        player,
        isLoading: isLoadingPlayer,
        error: playerError,
        isProcessing,
        getPlayerCurrency,
        updateCurrency,
        setPlayer,
    };
}
