/// app/story/userWallet/wagmi-hooks.ts

import {
    useAccount,
    useConnect,
    useDisconnect,
    useChainId,
    useSwitchChain,
    useChains,
    Connector,
} from "wagmi";
import { useUserWallet } from "./hooks";
import { useCallback, useEffect, useState } from "react";
import { WalletStatus, BlockchainNetwork } from "@prisma/client";
import { useStoryNetwork } from "../network/hooks";
import { setUserWithWallet } from "@/app/actions/user";
import { useSession } from "next-auth/react";

export function useWagmiConnection() {
    const { storyNetworks } = useStoryNetwork({
        getStoryNetworksInput: {
            isActive: true,
        },
    });

    const { data: session } = useSession();
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();

    const [selectedConnector, setSelectedConnector] =
        useState<Connector | null>(null);
    const [callbackUrl, setCallbackUrl] = useState<string | null>(null);

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

    const handleConnect = useCallback(
        async (selectedConnector: Connector, callbackUrl?: string) => {
            try {
                setSelectedConnector(selectedConnector);
                setCallbackUrl(callbackUrl || null);
                connect({ connector: selectedConnector });
            } catch (error) {
                console.error("Failed to connect wallet:", error);
                throw error;
            }
        },
        [connect, connectors, setSelectedConnector, setCallbackUrl]
    );

    useEffect(() => {
        const setUser = async () => {
            if (isConnected && address && selectedConnector) {
                let user = null;
                if (session?.user) {
                    user = session.user;
                } else {
                    const { user: newUser, player } = await setUserWithWallet({
                        walletAddress: address,
                        provider: selectedConnector.id,
                    });
                    user = newUser;
                }

                await connectWalletAsync({
                    address,
                    network: chainId.toString(),
                    provider: selectedConnector.id,
                    userId: user.id,
                });

                if (callbackUrl) {
                    window.location.href = callbackUrl;
                }
            }
        };

        setUser();
    }, [isConnected, address, chainId, selectedConnector, callbackUrl]);

    const handleSwitchChain = useCallback(
        async (targetChainId: number) => {
            try {
                switchChain({ chainId: targetChainId as any });
            } catch (error) {
                console.error("Failed to switch chain:", error);
                throw error;
            }
        },
        [switchChain]
    );

    const handleDisconnect = useCallback(async () => {
        try {
            const prevAddress = address;
            disconnect();

            if (prevAddress && session?.user?.id) {
                await updateWalletAsync({
                    userId: session.user.id,
                    walletAddress: prevAddress,
                    status: WalletStatus.INACTIVE,
                });
            }
        } catch (error) {
            console.error("Failed to disconnect wallet:", error);
            throw error;
        }
    }, [disconnect, address, updateWalletAsync, session]);

    return {
        isConnected,
        address,
        chainId,
        networks: storyNetworks,
        currentNetwork,

        connect: handleConnect,
        disconnect: handleDisconnect,
        switchChain: handleSwitchChain,

        isPendingConnectWallet,
        isSuccessConnectWallet,
        isErrorConnectWallet,
        isPendingVerifyWalletSignature,
        isSuccessVerifyWalletSignature,
        isErrorVerifyWalletSignature,
        isPendingUpdateWallet,
        isSuccessUpdateWallet,
        isErrorUpdateWallet,
    };
}
