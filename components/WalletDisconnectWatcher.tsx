"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useSession, signOut } from "next-auth/react";
import { useToast } from "@/app/hooks/useToast";

export function WalletDisconnectWatcher() {
    const { isConnected } = useAccount();
    const { data: session } = useSession();
    const toast = useToast();
    const processedAddresses = useRef<Set<string>>(new Set());

    // 연결 상태 추적
    useEffect(() => {
        if (isConnected && session?.user) {
            // 지갑이 연결되었을 때 추적 시작
            processedAddresses.current.add("connected");
        }
    }, [isConnected, session?.user]);

    // 외부에서 지갑 연결 해제 감지
    useEffect(() => {
        const handleExternalDisconnect = async () => {
            // 지갑이 연결 해제되었고, 이전에 연결된 상태였던 경우
            if (!isConnected && processedAddresses.current.size > 0) {
                try {
                    processedAddresses.current.clear();

                    toast.info(
                        "Wallet disconnected externally. Signing out..."
                    );

                    await signOut({ callbackUrl: "/?signedOut=true" });
                } catch (error) {
                    console.error(
                        "Failed to handle external disconnect:",
                        error
                    );
                }
            }
        };

        handleExternalDisconnect().catch((e) => {
            console.error("Failed to handle external disconnect:", e);
        });
    }, [isConnected, toast]);

    // 이 컴포넌트는 UI를 렌더링하지 않음
    return null;
}
