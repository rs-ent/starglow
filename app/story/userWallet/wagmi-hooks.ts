/// app/story/userWallet/wagmi-hooks.ts

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { WalletStatus } from "@prisma/client";
import { useSession, signIn } from "next-auth/react";
import {
    useAccount,
    useConnect,
    useDisconnect,
    useChainId,
    useSwitchChain,
    useConnections,
} from "wagmi";
import { BaseError } from "wagmi";

import { useToast } from "@/app/hooks/useToast";

import { useUserWallet } from "./hooks";
import { useStoryNetwork } from "../network/hooks";

import type { BlockchainNetwork } from "@prisma/client";
import type { Connector } from "wagmi";

export function useWagmiConnection() {
    const toast = useToast();
    const [isSettingUser, setIsSettingUser] = useState(false);
    const { storyNetworks } = useStoryNetwork({
        getStoryNetworksInput: {
            isActive: true,
        },
    });

    const { data: session, update: updateSession } = useSession();
    const { address, isConnected, chain } = useAccount();
    const { connect, connectors } = useConnect({
        mutation: {
            onError: (error) => {
                handleWagmiError(error);
            },
        },
    });
    const { disconnect } = useDisconnect();
    const chainId = useChainId();
    const { switchChain, chains } = useSwitchChain({
        mutation: {
            onError: (error) => {
                handleWagmiError(error);
            },
        },
    });
    const connections = useConnections();

    const isProcessingConnection = useRef(false);
    const callbackUrlRef = useRef<string | null>(null);
    const processedAddresses = useRef<Set<string>>(new Set());

    const {
        connectWalletAsync,
        updateWalletAsync,
        isPendingConnectWallet,
        isSuccessConnectWallet,
        isErrorConnectWallet,

        verifyWalletSignature,
        verifyWalletSignatureAsync,
        isPendingVerifyWalletSignature,
        isSuccessVerifyWalletSignature,
        isErrorVerifyWalletSignature,

        updateWallet,
        isPendingUpdateWallet,
        isSuccessUpdateWallet,
        isErrorUpdateWallet,
    } = useUserWallet();

    const currentNetwork = storyNetworks
        ? (storyNetworks as BlockchainNetwork[]).find(
              (network: BlockchainNetwork) => network.chainId === chainId
          )
        : null;

    const handleWagmiError = useCallback(
        (error: Error) => {
            if (error instanceof BaseError) {
                const errorMessage = error.shortMessage || error.message;

                if (error.name === "UserRejectedRequestError") {
                    toast.info("Connection request was cancelled");
                } else if (error.name === "ChainMismatchError") {
                    toast.error("Please switch to the correct network");
                } else if (error.name === "ConnectorNotFoundError") {
                    toast.error("No wallet found. Please install a wallet");
                } else {
                    toast.error(errorMessage);
                }

                console.error("Wagmi error:", {
                    name: error.name,
                    message: error.message,
                    details: error.details,
                });
            } else {
                toast.error("An unexpected error occurred");
                console.error("Unknown error:", error);
            }
        },
        [toast]
    );

    const handleConnect = useCallback(
        async (selectedConnector: Connector, callbackUrl?: string) => {
            try {
                if (isProcessingConnection.current) {
                    return;
                }

                isProcessingConnection.current = true;
                callbackUrlRef.current = callbackUrl || null;

                await connect({ connector: selectedConnector });
            } catch (error) {
                console.error("Failed to connect wallet:", error);
                handleWagmiError(error as Error);
            } finally {
                isProcessingConnection.current = false;
            }
        },
        [connect, handleWagmiError]
    );

    useEffect(() => {
        const processConnection = async () => {
            if (!isConnected || !address || isProcessingConnection.current) {
                return;
            }

            if (processedAddresses.current.has(address)) {
                console.info(`Address ${address} already processed, skipping`);
                return;
            }

            const currentConnection = connections.find((conn) =>
                conn.accounts.includes(address)
            );

            if (!currentConnection) {
                console.warn(`No connection found for address: ${address}`);
                return;
            }

            try {
                isProcessingConnection.current = true;
                processedAddresses.current.add(address);

                const user = session?.user;
                if (!user && !isSettingUser) {
                    setIsSettingUser(true);

                    const result = await signIn("wallet", {
                        walletAddress: address,
                        provider: currentConnection.connector.id,
                        redirect: false,
                    });

                    if (result?.ok) {
                        await connectWalletWithRetry(
                            address,
                            currentConnection.connector.id
                        );

                        if (callbackUrlRef.current) {
                            window.location.href = callbackUrlRef.current;
                            callbackUrlRef.current = null;
                        }
                        return;
                    } else {
                        const errorMsg = result?.error || "SignIn failed";
                        console.error(`SignIn failed:`, {
                            error: errorMsg,
                            result,
                        });
                        throw new Error(`Authentication failed: ${errorMsg}`);
                    }
                }

                if (user) {
                    console.info(
                        `Existing user session found, connecting wallet:`,
                        {
                            userId: user.id,
                            userName: user.name,
                        }
                    );

                    await connectWalletWithRetry(
                        address,
                        currentConnection.connector.id
                    );

                    if (callbackUrlRef.current) {
                        console.info(
                            `Redirecting to: ${callbackUrlRef.current}`
                        );
                        window.location.href = callbackUrlRef.current;
                        callbackUrlRef.current = null;
                    }
                }
            } catch (error: any) {
                const errorMsg = error.message || error.toString();
                console.error(`Wallet connection process failed:`, {
                    address,
                    provider: currentConnection.connector.id,
                    error: errorMsg,
                    chainId,
                    hasSession: !!session?.user,
                });

                processedAddresses.current.delete(address);

                if (errorMsg.includes("ownership conflict")) {
                    toast.error(
                        "This wallet is already connected to another account"
                    );
                } else if (errorMsg.includes("Authentication")) {
                    toast.error("Authentication failed. Please try again");
                } else if (errorMsg.includes("Connection failed after")) {
                    toast.error(
                        "Connection failed. Please check your wallet and try again"
                    );
                } else {
                    toast.error("Failed to connect wallet. Please try again");
                }
            } finally {
                isProcessingConnection.current = false;
                setIsSettingUser(false);

                console.info(
                    `Wallet connection process completed for: ${address}`
                );
            }
        };

        const connectWalletWithRetry = async (
            walletAddress: string,
            provider: string,
            maxRetries = 3
        ) => {
            let lastError: any = null;

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.info(
                        `Attempting wallet connection (${attempt}/${maxRetries}): ${walletAddress} via ${provider}`
                    );

                    const result = await connectWalletAsync({
                        address: walletAddress,
                        network: chainId.toString(),
                        provider: provider,
                    });

                    if (typeof result === "string") {
                        const errorMsg = result.toLowerCase();

                        if (errorMsg.includes("belongs to another user")) {
                            console.error(
                                `Wallet ownership conflict: ${walletAddress} belongs to another user`
                            );
                            throw new Error(
                                `Wallet ownership conflict: ${result}`
                            );
                        }

                        if (errorMsg.includes("not authenticated")) {
                            console.error(
                                `Authentication error during wallet connection: ${result}`
                            );
                            throw new Error(`Authentication error: ${result}`);
                        }

                        lastError = new Error(result);
                        console.warn(
                            `Connection attempt ${attempt} failed: ${result}`
                        );

                        if (attempt === maxRetries) {
                            throw lastError;
                        }
                        continue;
                    }

                    console.info(
                        `Wallet connected successfully (${attempt}/${maxRetries}): ${walletAddress}`
                    );

                    try {
                        await updateSession();
                        console.info("Session updated after wallet connection");
                    } catch (sessionError) {
                        console.warn("Failed to update session:", sessionError);
                    }

                    return result;
                } catch (error: any) {
                    lastError = error;
                    const errorMsg = error.message || error.toString();

                    console.error(
                        `Connection attempt ${attempt}/${maxRetries} failed:`,
                        {
                            walletAddress,
                            provider,
                            error: errorMsg,
                            chainId,
                        }
                    );

                    if (
                        errorMsg.includes("ownership conflict") ||
                        errorMsg.includes("Authentication error") ||
                        errorMsg.includes("Not authenticated")
                    ) {
                        console.error(
                            `Fatal error, stopping retries: ${errorMsg}`
                        );
                        throw error;
                    }

                    if (attempt === maxRetries) {
                        console.error(
                            `Failed to connect wallet after ${maxRetries} attempts. Final error: ${errorMsg}`
                        );
                        throw new Error(
                            `Connection failed after ${maxRetries} attempts. Last error: ${errorMsg}`
                        );
                    }

                    const waitTime = 10;
                    await new Promise((resolve) =>
                        setTimeout(resolve, waitTime)
                    );
                }
            }
        };

        processConnection().catch(console.error);
    }, [
        isConnected,
        address,
        chainId,
        connections,
        connectWalletAsync,
        session?.user,
        toast,
        isSettingUser,
        updateSession,
    ]);

    const handleSwitchChain = useCallback(
        async (targetChainId: number) => {
            try {
                const targetChain = chains.find((c) => c.id === targetChainId);
                if (!targetChain) {
                    toast.error("Unsupported network");
                    return;
                }

                await switchChain({ chainId: targetChainId });
                toast.success(`Switched to ${targetChain.name}`);
            } catch (error) {
                console.error("Failed to switch chain:", error);
                handleWagmiError(error as Error);
            }
        },
        [switchChain, chains, toast, handleWagmiError]
    );

    const handleDisconnect = useCallback(async () => {
        try {
            const prevAddress = address;

            await disconnect();

            if (prevAddress) {
                processedAddresses.current.delete(prevAddress);
            }

            if (prevAddress) {
                await updateWalletAsync({
                    walletAddress: prevAddress,
                    status: WalletStatus.INACTIVE,
                });
            }

            toast.success("Wallet disconnected");
        } catch (error) {
            console.error("Failed to disconnect wallet:", error);
            toast.error("Failed to disconnect wallet");
        }
    }, [disconnect, address, updateWalletAsync, toast]);

    const availableConnectors = connectors.filter(
        (connector) => connector.ready !== false
    );

    return {
        isConnected,
        address,
        chainId,
        chain,

        networks: storyNetworks,
        currentNetwork,
        chains,

        connectors: availableConnectors,
        connections,

        connect: handleConnect,
        disconnect: handleDisconnect,
        switchChain: handleSwitchChain,

        isPendingConnectWallet,
        isSuccessConnectWallet,
        isErrorConnectWallet,

        verifyWalletSignature,
        verifyWalletSignatureAsync,
        isPendingVerifyWalletSignature,
        isSuccessVerifyWalletSignature,
        isErrorVerifyWalletSignature,

        updateWallet,
        isPendingUpdateWallet,
        isSuccessUpdateWallet,
        isErrorUpdateWallet,
    };
}
