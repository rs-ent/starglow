/// app\Providers.tsx

"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { WagmiProvider, createConfig, http } from "wagmi";
import { type Chain } from "viem";
import { useEffect, useState } from "react";
import { useStoryNetwork } from "./story/network/hooks";
import { BlockchainNetwork } from "@prisma/client";

// 기본 체인 정의
const defaultChain = {
    id: 11155111,
    name: "Sepolia",
    network: "sepolia",
    nativeCurrency: {
        name: "Sepolia Ether",
        symbol: "SEP",
        decimals: 18,
    },
    rpcUrls: {
        default: { http: ["https://rpc.sepolia.org"] },
        public: { http: ["https://rpc.sepolia.org"] },
    },
    blockExplorers: {
        default: {
            name: "Sepolia Etherscan",
            url: "https://sepolia.etherscan.io",
        },
    },
    testnet: true,
} as const;

// 타입 정의 추가
type WagmiConfig = ReturnType<typeof createConfig>;

export default function Providers({ children }: { children: React.ReactNode }) {
    const { storyNetworks, isLoadingStoryNetworks } = useStoryNetwork({
        getStoryNetworksInput: {
            isActive: true,
        },
    });

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

    const [wagmiConfig, setWagmiConfig] = useState<WagmiConfig>(() =>
        createConfig({
            chains: [defaultChain],
            transports: {
                11155111: http(),
            },
            syncConnectedChain: true,
            ssr: true,
        })
    );

    useEffect(() => {
        if (
            !isLoadingStoryNetworks &&
            storyNetworks &&
            Array.isArray(storyNetworks) &&
            storyNetworks.length > 0
        ) {
            const mappedChains = storyNetworks.map(
                (network: BlockchainNetwork) => ({
                    id: network.chainId,
                    name: network.name,
                    network: network.symbol.toLowerCase(),
                    nativeCurrency: {
                        name: network.name,
                        symbol: network.symbol,
                        decimals: 18,
                    },
                    rpcUrls: {
                        default: { http: [network.rpcUrl] },
                        public: { http: [network.rpcUrl] },
                    },
                    blockExplorers: {
                        default: {
                            name: network.name,
                            url: network.explorerUrl,
                        },
                    },
                    testnet: network.isTestnet,
                })
            );

            // defaultNetwork가 true인 체인을 찾아 기본 체인으로 사용
            const defaultNetworkIndex = storyNetworks.findIndex(
                (network) => network.defaultNetwork
            );
            const defaultChain =
                defaultNetworkIndex !== -1
                    ? mappedChains[defaultNetworkIndex]
                    : mappedChains[0];
            const remainingChains = mappedChains.filter(
                (_, index) => index !== defaultNetworkIndex
            );

            const newConfig = createConfig({
                chains: [defaultChain, ...remainingChains] as [
                    Chain,
                    ...Chain[]
                ],
                transports: (storyNetworks as BlockchainNetwork[]).reduce<
                    Record<number, ReturnType<typeof http>>
                >(
                    (acc, network) => ({
                        ...acc,
                        [network.chainId]: http(network.rpcUrl),
                    }),
                    {}
                ),
                syncConnectedChain: true,
                ssr: true,
            });

            setWagmiConfig(newConfig);
        }
    }, [storyNetworks, isLoadingStoryNetworks]);

    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <SessionProvider>{children}</SessionProvider>
                {process.env.NODE_ENV === "development" && (
                    <ReactQueryDevtools initialIsOpen={false} />
                )}
            </QueryClientProvider>
        </WagmiProvider>
    );
}
