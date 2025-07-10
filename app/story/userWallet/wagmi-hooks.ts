/// app/story/userWallet/wagmi-hooks.ts

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { WalletStatus } from "@prisma/client";
import { useSession } from "next-auth/react";
import {
    useAccount,
    useConnect,
    useDisconnect,
    useChainId,
    useSwitchChain,
    useConnections,
} from "wagmi";
import { BaseError } from "wagmi";

import { setUserWithWallet } from "@/app/actions/user";
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

    const { data: session } = useSession();
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
                return;
            }

            const currentConnection = connections.find((conn) =>
                conn.accounts.includes(address)
            );

            if (!currentConnection) return;

            try {
                isProcessingConnection.current = true;
                processedAddresses.current.add(address);

                let user = session?.user;
                if (!user && !isSettingUser) {
                    setIsSettingUser(true);
                    const { user: newUser } = await setUserWithWallet({
                        walletAddress: address,
                        provider: currentConnection.connector.id,
                    });
                    user = newUser;
                }

                if (user) {
                    await connectWalletAsync({
                        address,
                        network: chainId.toString(),
                        provider: currentConnection.connector.id,
                        userId: user.id,
                    });

                    // 콜백 URL로 리다이렉트
                    if (callbackUrlRef.current) {
                        window.location.href = callbackUrlRef.current;
                        callbackUrlRef.current = null;
                    }
                }
            } catch (error) {
                console.error("Failed to process wallet connection:", error);
                processedAddresses.current.delete(address);
            } finally {
                isProcessingConnection.current = false;
                setIsSettingUser(false);
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
    ]);

    // 체인 전환
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

    // 지갑 연결 해제
    const handleDisconnect = useCallback(async () => {
        try {
            const prevAddress = address;

            // 먼저 지갑 연결 해제
            await disconnect();

            // 처리된 주소 목록에서 제거
            if (prevAddress) {
                processedAddresses.current.delete(prevAddress);
            }

            // DB 업데이트
            if (prevAddress && session?.user?.id) {
                await updateWalletAsync({
                    userId: session.user.id,
                    walletAddress: prevAddress,
                    status: WalletStatus.INACTIVE,
                });
            }

            toast.success("Wallet disconnected");
        } catch (error) {
            console.error("Failed to disconnect wallet:", error);
            toast.error("Failed to disconnect wallet");
        }
    }, [disconnect, address, updateWalletAsync, session, toast]);

    // 지원되는 커넥터 필터링
    const availableConnectors = connectors.filter(
        (connector) => connector.ready !== false
    );

    return {
        // 연결 상태
        isConnected,
        address,
        chainId,
        chain,

        // 네트워크 정보
        networks: storyNetworks,
        currentNetwork,
        chains,

        // 커넥터
        connectors: availableConnectors,
        connections,

        // 액션
        connect: handleConnect,
        disconnect: handleDisconnect,
        switchChain: handleSwitchChain,

        // 상태 플래그
        isPendingConnectWallet,
        isSuccessConnectWallet,
        isErrorConnectWallet,

        // 서명 검증
        verifyWalletSignature,
        verifyWalletSignatureAsync,
        isPendingVerifyWalletSignature,
        isSuccessVerifyWalletSignature,
        isErrorVerifyWalletSignature,

        // 지갑 업데이트
        updateWallet,
        isPendingUpdateWallet,
        isSuccessUpdateWallet,
        isErrorUpdateWallet,
    };
}
