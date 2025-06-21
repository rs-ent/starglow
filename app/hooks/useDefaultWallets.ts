/// app/hooks/useDefaultWallets.ts

"use client";

import { useState } from "react";

import { useToast } from "./useToast";
import { useCreateWallet } from "../mutations/defaultWalletsMutation";
import { useWallet } from "../queries/defaultWalletsQueries";

export function useDefaultWallets() {
    const [isCreating, setIsCreating] = useState(false);
    const toast = useToast();

    const createDefaultWallet = useCreateWallet();

    const getWallet = () => {
        const { data: wallet, isLoading } = useWallet();
        return { wallet, isLoading };
    };

    const createWallet = async (userId: string) => {
        setIsCreating(true);
        try {
            const result = await createDefaultWallet.mutateAsync(userId);
            if (result.success) {
                toast.success("Polygon wallet created successfully");
                return result;
            } else {
                toast.error("Failed to create polygon wallet");
                console.error(
                    "Failed to create polygon wallet",
                    result.message
                );
                return result;
            }
        } catch (error) {
            console.error("Error creating polygon wallet", error);
            toast.error("Failed to create polygon wallet");
            throw error;
        } finally {
            setIsCreating(false);
        }
    };

    return {
        isCreating,
        getWallet,
        createWallet,
    };
}
