/// app/hooks/useDefaultWallets.ts

"use client";

import { useState } from "react";
import { usePolygonWallet } from "../queries/defaultWalletsQueries";
import { useCreatePolygonWallet } from "../mutations/defaultWalletsMutation";
import { useToast } from "./useToast";

export function useDefaultWallets() {
    const [isCreating, setIsCreating] = useState(false);
    const toast = useToast();

    const createPolygonWallet = useCreatePolygonWallet();

    const getPolygonWallet = () => {
        const { data: wallet, isLoading } = usePolygonWallet();
        return { wallet, isLoading };
    };

    const createWallet = async (userId: string) => {
        setIsCreating(true);
        try {
            const result = await createPolygonWallet.mutateAsync(userId);
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
        getPolygonWallet,
        createWallet,
    };
}
