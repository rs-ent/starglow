/// app/story/userWallet/wagmi-hooks.ts

import {
    useAccount,
    useConnect,
    useDisconnect,
    useChainId,
    useSwitchChain,
    useChains,
} from "wagmi";
import { useUserWallet } from "./hooks";
import { useCallback } from "react";
import { WalletStatus, BlockchainNetwork } from "@prisma/client";
import { useStoryNetwork } from "../network/hooks";

export function useWagmiUserWallet() {
    const { storyNetworks } = useStoryNetwork({
        getStoryNetworksInput: {
            isActive: true,
        },
    });

    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();
    const chains = useChains();

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
        async (userId: string) => {
            try {
                connect({ connector: connectors[0] });

                if (address) {
                    await connectWalletAsync({
                        address,
                        network: chainId.toString(),
                        provider: connectors[0].id,
                        userId,
                    });
                }
            } catch (error) {
                console.error("Failed to connect wallet:", error);
                throw error;
            }
        },
        [connect, connectors, address, chainId, connectWalletAsync]
    );

    const handleSwitchChain = useCallback(
        async (targetChainId: number) => {
            try {
                await switchChain({ chainId: targetChainId });
            } catch (error) {
                console.error("Failed to switch chain:", error);
                throw error;
            }
        },
        [switchChain]
    );

    const handleDisconnect = useCallback(
        async (userId: string) => {
            try {
                disconnect();

                if (address) {
                    await updateWalletAsync({
                        userId,
                        walletAddress: address,
                        status: WalletStatus.INACTIVE,
                    });
                }
            } catch (error) {
                console.error("Failed to disconnect wallet:", error);
                throw error;
            }
        },
        [disconnect, address, updateWalletAsync]
    );

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
