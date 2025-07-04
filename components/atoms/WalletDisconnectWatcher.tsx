"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAccount } from "wagmi";
import { useSession, signOut } from "next-auth/react";
import { useToast } from "@/app/hooks/useToast";

export function WalletDisconnectWatcher() {
    const { isConnected } = useAccount();
    const { data: session } = useSession();
    const toast = useToast();
    const processedAddresses = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (isConnected && session?.user) {
            processedAddresses.current.add("connected");
        }
    }, [isConnected, session?.user]);

    const handleExternalDisconnect = useCallback(async () => {
        if (!isConnected && processedAddresses.current.size > 0) {
            try {
                processedAddresses.current.clear();

                toast.info("Wallet disconnected externally. Signing out...");

                await signOut({ callbackUrl: "/?signedOut=true" });
            } catch (error) {
                console.error("Failed to handle external disconnect:", error);
            }
        }
    }, [isConnected, toast]);

    useEffect(() => {
        handleExternalDisconnect();
    }, [handleExternalDisconnect]);

    return null;
}
