/// app\Providers.tsx

"use client";

import { useState } from "react";

import { MetaMaskProvider } from "@metamask/sdk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { metaMask, walletConnect } from "@wagmi/connectors";
import { SessionProvider } from "next-auth/react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia, storyAeneid, berachainBepolia } from "wagmi/chains";


export const defaultConnectors = [
    metaMask({
        dappMetadata: {
            name: "Starglow",
            url: process.env.NEXT_PUBLIC_BASE_URL,
            iconUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/logo/l-gradien-purple.svg`,
        },
        extensionOnly: false,
        enableAnalytics: false,
        useDeeplink: true,
        openDeeplink: (link: string) => {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(
                navigator.userAgent
            );
            if (isMobile) {
                window.location.href = link;
            }
        },
    }),
    walletConnect({
        projectId:
            process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
            "92188784392e4d1c72a9640f2c384ac6",
        metadata: {
            name: "Starglow",
            description: "Starglow Web3 Platform",
            url: process.env.NEXT_PUBLIC_BASE_URL || "https://starglow.io",
            icons: [
                `${process.env.NEXT_PUBLIC_BASE_URL}/logo/l-gradien-purple.svg`,
            ],
        },
    }),
];

export default function Providers({ children }: { children: React.ReactNode }) {
    // Create a client
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5 * 60 * 1000, // 5분
                        refetchOnWindowFocus: false,
                        retry: 1,
                    },
                    mutations: {
                        retry: false,
                    },
                },
            })
    );

    const [wagmiConfig] = useState(() =>
        createConfig({
            chains: [sepolia, storyAeneid, berachainBepolia] as const,
            connectors: defaultConnectors,
            transports: {
                [sepolia.id]: http(),
                [storyAeneid.id]: http(),
                [berachainBepolia.id]: http(),
            },
            syncConnectedChain: true,
            ssr: true,
        })
    );

    return (
        <MetaMaskProvider
            debug={process.env.NODE_ENV === "development"}
            sdkOptions={{
                dappMetadata: {
                    name: "Starglow",
                    url:
                        process.env.NEXT_PUBLIC_BASE_URL ||
                        "https://starglow.io",
                },
                extensionOnly: false,
                useDeeplink: true,
                enableAnalytics: false,
            }}
        >
            <WagmiProvider config={wagmiConfig as any}>
                <QueryClientProvider client={queryClient}>
                    <SessionProvider>{children}</SessionProvider>
                    {process.env.NODE_ENV === "development" && (
                        <ReactQueryDevtools initialIsOpen={false} />
                    )}
                </QueryClientProvider>
            </WagmiProvider>
        </MetaMaskProvider>
    );
}
