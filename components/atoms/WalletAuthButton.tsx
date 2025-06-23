/// components/atoms/WalletAuthButton.tsx

"use client";

import { useCallback } from "react";
import { useConnectors } from "wagmi";

import { useLoading } from "@/app/hooks/useLoading";
import { useWagmiConnection } from "@/app/story/userWallet/wagmi-hooks";
import { cn } from "@/lib/utils/tailwind";

import Button from "./Button";

interface WalletAuthButtonProps {
    provider: {
        id: string;
        name: string;
        color?: string;
        icon?: string;
    };
    callbackUrl?: string;
    className?: string;
}

export default function WalletAuthButton({
    provider,
    callbackUrl = "/",
    className,
}: WalletAuthButtonProps) {
    const { startLoading, endLoading } = useLoading();
    const { connect, isConnected } = useWagmiConnection();
    const connectors = useConnectors();

    const handleConnect = useCallback(async () => {
        // 이미 연결되어 있으면 리다이렉트
        if (isConnected) {
            window.location.href = callbackUrl;
            return;
        }

        // provider.id에 해당하는 커넥터 찾기
        const connector = connectors.find((c) => {
            // MetaMask 처리
            if (provider.id === "metamask") {
                return c.id === "metaMask" || c.name === "MetaMask";
            }
            // WalletConnect 처리
            if (provider.id === "walletconnect") {
                return c.id === "walletConnect" || c.name === "WalletConnect";
            }
            // Coinbase Wallet 처리
            if (provider.id === "coinbase") {
                return (
                    c.id === "coinbaseWallet" || c.name === "Coinbase Wallet"
                );
            }
            // 기타 지갑
            return c.id.toLowerCase() === provider.id.toLowerCase();
        });

        if (!connector) {
            console.error(`Connector not found for provider: ${provider.id}`);
            return;
        }

        try {
            startLoading();
            await connect(connector, callbackUrl);
        } catch (error) {
            console.error("Failed to connect wallet:", error);
        } finally {
            endLoading();
        }
    }, [
        connectors,
        provider.id,
        connect,
        callbackUrl,
        isConnected,
        startLoading,
        endLoading,
    ]);

    return (
        <Button
            variant="outline"
            onClick={handleConnect}
            className={cn(
                "w-full items-center justify-center",
                provider.color,
                className
            )}
        >
            {provider.icon && (
                <img
                    src={provider.icon}
                    alt={`${provider.name} icon`}
                    className="w-5 h-5"
                />
            )}
            <span className="ml-2">
                {isConnected ? "Continue with" : "Connect"} {provider.name}
            </span>
        </Button>
    );
}
