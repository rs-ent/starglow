/// app\Providers.tsx

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
    metaMask,
    walletConnect,
    injected,
    coinbaseWallet,
} from "@wagmi/connectors";
import { SessionProvider } from "next-auth/react";
import { WagmiProvider, createConfig, http, createStorage } from "wagmi";
import { sepolia, storyAeneid } from "wagmi/chains";
import { defineChain } from "viem";

import { ModalProvider } from "@/app/hooks/useModalStack";
import { WalletDisconnectWatcher } from "@/components/atoms/WalletDisconnectWatcher";
import SessionMonitor from "@/components/atoms/SessionMonitor";

const berachain = defineChain({
    id: 80094,
    name: "Berachain",
    nativeCurrency: {
        name: "BERA",
        symbol: "BERA",
        decimals: 18,
    },
    rpcUrls: {
        default: { http: ["https://rpc.berachain.com/"] },
        public: { http: ["https://rpc.berachain.com/"] },
    },
    blockExplorers: {
        default: { name: "Berascan", url: "https://berascan.com/" },
    },
});

export const chains = [sepolia, storyAeneid, berachain] as const;

// SSR 안전한 storage 생성
const storage = createStorage({
    storage:
        typeof window !== "undefined" && window.localStorage
            ? window.localStorage
            : ({
                  getItem: () => null,
                  setItem: () => {},
                  removeItem: () => {},
              } as any),
});

// 커넥터를 함수로 래핑하여 클라이언트에서만 생성
const getConnectors = () => {
    if (typeof window === "undefined") {
        return [];
    }

    return [
        // 모든 주입된 지갑 지원
        injected({
            shimDisconnect: true,
        }),
        // MetaMask 전용 커넥터
        metaMask({
            dappMetadata: {
                name: "Starglow",
                url: process.env.NEXT_PUBLIC_BASE_URL || "https://starglow.io",
                iconUrl: `${
                    process.env.NEXT_PUBLIC_BASE_URL || "https://starglow.io"
                }/favicon.svg`,
            },
        }),
        // WalletConnect
        walletConnect({
            projectId:
                process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
                "92188784392e4d1c72a9640f2c384ac6",
            metadata: {
                name: "Starglow",
                description:
                    "Starglow Web3 Platform - Connect K-pop with blockchain",
                url: process.env.NEXT_PUBLIC_BASE_URL || "https://starglow.io",
                icons: [
                    `${
                        process.env.NEXT_PUBLIC_BASE_URL ||
                        "https://starglow.io"
                    }/favicon.svg`,
                ],
            },
            showQrModal: true,
        }),
        // Coinbase Wallet
        coinbaseWallet({
            appName: "Starglow",
            appLogoUrl: `${
                process.env.NEXT_PUBLIC_BASE_URL || "https://starglow.io"
            }/favicon.svg`,
        }),
    ];
};

// Wagmi 설정
export const wagmiConfig = createConfig({
    chains,
    connectors: getConnectors(),
    storage,
    transports: {
        [sepolia.id]: http(
            process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
                "https://eth-sepolia.g.alchemy.com/v2/demo"
        ),
        [storyAeneid.id]: http(
            process.env.NEXT_PUBLIC_STORY_RPC_URL ||
                "https://testnet.storyrpc.io"
        ),
        [berachain.id]: http(
            process.env.NEXT_PUBLIC_BERACHAIN_RPC_URL ||
                "https://rpc.berachain.com/"
        ),
    },
    syncConnectedChain: true,
    ssr: true,
});

// QueryClient 설정
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5분
            gcTime: 10 * 60 * 1000, // 10분
            refetchOnWindowFocus: false,
            retry: (failureCount, error: any) => {
                if (error?.status === 404) return false;
                return failureCount < 2;
            },
        },
        mutations: {
            retry: false,
        },
    },
});

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={wagmiConfig} reconnectOnMount>
            <QueryClientProvider client={queryClient}>
                <SessionProvider refetchInterval={2 * 60 * 60}>
                    <ModalProvider>
                        <WalletDisconnectWatcher />
                        <SessionMonitor />
                        {children}
                        {process.env.NODE_ENV === "development" && (
                            <ReactQueryDevtools initialIsOpen={false} />
                        )}
                    </ModalProvider>
                </SessionProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
