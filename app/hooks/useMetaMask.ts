/// app/hooks/useMetaMask.ts

"use client";

import { useCallback, useEffect, useState } from "react";

import { MetaMaskSDK } from "@metamask/sdk";

import { useToast } from "./useToast";
import {
    exportWalletToMetaMask,
    walletBackupPostProcess,
} from "@/app/story/userWallet/actions";

interface UseMetaMaskReturn {
    // SDK 상태
    sdk: MetaMaskSDK | null;
    isSDKReady: boolean;

    // 연결 상태
    isConnected: boolean;
    currentAccount: string | null;

    // 기본 액션
    connectSDK: () => Promise<void>;
    disconnectSDK: () => Promise<void>;

    // Export 관련
    exportWalletToMetaMask: (
        walletAddress: string
    ) => Promise<{ success: boolean; privateKey?: string; error?: string }>;
    confirmWalletExport: (walletAddress: string) => Promise<boolean>;
    isExporting: boolean;
    exportError: string | null;

    // 상태
    isLoading: boolean;
    error: string | null;
}

export function useMetaMask(userId?: string): UseMetaMaskReturn {
    const toast = useToast();

    const [sdk, setSdk] = useState<MetaMaskSDK | null>(null);
    const [isSDKReady, setIsSDKReady] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [currentAccount, setCurrentAccount] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    // SDK 초기화
    useEffect(() => {
        const initSDK = async () => {
            try {
                const sdkInstance = new MetaMaskSDK({
                    dappMetadata: {
                        name: "Starglow",
                        url: window.location.origin,
                        iconUrl: `${window.location.origin}/logo/starglow-logo.svg`,
                    },
                    logging: {
                        developerMode: process.env.NODE_ENV === "development",
                    },
                    storage: {
                        enabled: true,
                    },
                });

                setSdk(sdkInstance);
                setIsSDKReady(true);

                // 연결 상태 변화 감지
                const provider = sdkInstance.getProvider();
                if (provider) {
                    provider.on("accountsChanged", (...args: unknown[]) => {
                        const accounts = args[0] as string[];
                        setCurrentAccount(accounts[0] || null);
                        setIsConnected(accounts.length > 0);
                    });

                    provider.on("chainChanged", (...args: unknown[]) => {
                        const _chainId = args[0] as string;
                        console.info("Chain changed:", _chainId);
                    });

                    provider.on("connect", (...args: unknown[]) => {
                        const _connectInfo = args[0];
                        console.info("Connected:", _connectInfo);
                        setIsConnected(true);
                    });

                    provider.on("disconnect", () => {
                        setIsConnected(false);
                        setCurrentAccount(null);
                    });
                }
            } catch (err) {
                console.error("Failed to initialize MetaMask SDK:", err);
                setError("Failed to initialize MetaMask SDK");
            }
        };

        initSDK().catch((err) => {
            console.error("Failed to initialize MetaMask SDK:", err);
            setError("Failed to initialize MetaMask SDK");
        });
    }, []);

    // SDK 연결
    const connectSDK = useCallback(async () => {
        if (!sdk) {
            toast.error("MetaMask SDK not ready");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const accounts = await sdk.connect();
            if (accounts && accounts.length > 0) {
                setCurrentAccount(accounts[0]);
                setIsConnected(true);
                toast.success("Connected to MetaMask");
            }
        } catch (err: any) {
            const errorMessage = err.message || "Failed to connect";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [sdk, toast]);

    // SDK 연결 해제
    const disconnectSDK = useCallback(async () => {
        if (!sdk) return;

        try {
            await sdk.disconnect();
            setIsConnected(false);
            setCurrentAccount(null);
            toast.success("Disconnected from MetaMask");
        } catch (err: any) {
            console.error("Failed to disconnect:", err);
            toast.error("Failed to disconnect");
        }
    }, [sdk, toast]);

    // 지갑 Export 기능
    const exportWalletToMetaMaskHandler = useCallback(
        async (
            walletAddress: string
        ): Promise<{
            success: boolean;
            privateKey?: string;
            error?: string;
        }> => {
            setIsExporting(true);
            setExportError(null);

            try {
                if (!userId) {
                    throw new Error("User ID is required");
                }

                const result = await exportWalletToMetaMask({
                    userId,
                    walletAddress,
                });

                if (result.success) {
                    toast.success("Wallet exported successfully!");
                    return { success: true, privateKey: result.privateKey };
                } else {
                    setExportError(result.message);
                    toast.error(result.message);
                    return { success: false, error: result.error };
                }
            } catch (error: any) {
                const errorMessage = error.message || "Failed to export wallet";
                setExportError(errorMessage);
                toast.error(errorMessage);
                return { success: false, error: errorMessage };
            } finally {
                setIsExporting(false);
            }
        },
        [userId, toast]
    );

    // 지갑 Export 확인 기능
    const confirmWalletExportHandler = useCallback(
        async (walletAddress: string): Promise<boolean> => {
            try {
                if (!userId) {
                    throw new Error("User ID is required");
                }

                const result = await walletBackupPostProcess({
                    userId,
                    walletAddress,
                    newProvider: "metaMaskSDK", // MetaMask로 provider 변경
                });

                if (result.success) {
                    toast.success("Wallet export confirmed!");
                    return true;
                } else {
                    toast.error(result.message);
                    return false;
                }
            } catch (error: any) {
                const errorMessage =
                    error.message || "Failed to confirm export";
                toast.error(errorMessage);
                return false;
            }
        },
        [userId, toast]
    );

    return {
        // SDK 상태
        sdk,
        isSDKReady,

        // 연결 상태
        isConnected,
        currentAccount,

        // 기본 액션
        connectSDK,
        disconnectSDK,

        // Export 관련
        exportWalletToMetaMask: exportWalletToMetaMaskHandler,
        confirmWalletExport: confirmWalletExportHandler,
        isExporting,
        exportError,

        // 상태
        isLoading,
        error,
    };
}
