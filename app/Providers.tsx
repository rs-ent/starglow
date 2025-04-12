/// app\Providers.tsx

"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { useState } from "react";

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
            chains: [mainnet, sepolia],
            transports: {
                [mainnet.id]: http(),
                [sepolia.id]: http(),
            },
            syncConnectedChain: true,
            ssr: true,
        })
    );

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
