/// app/story/client.ts

import { StoryClient } from "@story-protocol/core-sdk";
import * as Client from "@web3-storage/w3up-client";
import { Signer } from "@web3-storage/w3up-client/principal/ed25519";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { prisma } from "@/lib/prisma/client";

import { fetchEscrowWalletPrivateKey } from "./escrowWallet/actions";

import type { BlockchainNetwork, EscrowWallet } from "@prisma/client";
import type { StoryConfig, SupportedChainIds } from "@story-protocol/core-sdk";
import type { Chain, PublicClient, WalletClient } from "viem";
import type { Account } from "viem/accounts";

const ADMIN_KEY = process.env.WEB3STORAGE_ADMIN_KEY;

// 캐시 TTL 설정 (5분)
const CACHE_TTL = 5 * 60 * 1000;

// 캐시 항목 인터페이스
interface CacheItem<T> {
    value: T;
    timestamp: number;
}

// 향상된 캐시 클래스
class EnhancedCache<T> {
    private cache = new Map<string, CacheItem<T>>();
    private ttl: number;

    constructor(ttl: number = CACHE_TTL) {
        this.ttl = ttl;
    }

    set(key: string, value: T): void {
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
        });
    }

    get(key: string): T | null {
        const item = this.cache.get(key);
        if (!item) return null;

        // TTL 체크
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    has(key: string): boolean {
        return this.get(key) !== null;
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    // 만료된 항목들 정리
    cleanup(): void {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > this.ttl) {
                this.cache.delete(key);
            }
        }
    }

    // 현재 캐시 크기
    size(): number {
        return this.cache.size;
    }
}

// 캐시 키 생성 유틸리티
function createCacheKey(...parts: (string | number)[]): string {
    return parts.filter(Boolean).join(":");
}

// 향상된 캐시 인스턴스들
export const StoryClientCache = new EnhancedCache<StoryClient>();
export const Web3StorageClientCache = new EnhancedCache<Client.Client>();
export const PublicClientCache = new EnhancedCache<PublicClient>();
export const WalletClientCache = new EnhancedCache<WalletClient>();

// 주기적 캐시 정리 (10분마다)
setInterval(() => {
    StoryClientCache.cleanup();
    Web3StorageClientCache.cleanup();
    PublicClientCache.cleanup();
    WalletClientCache.cleanup();
}, 10 * 60 * 1000);

// 캐시 무효화 함수들
export function invalidateStoryClientCache(
    networkId?: string,
    walletAddress?: string
): void {
    if (networkId && walletAddress) {
        const key = createCacheKey(networkId, walletAddress);
        StoryClientCache.delete(key);
    } else {
        StoryClientCache.clear();
    }
}

export function invalidatePublicClientCache(networkId?: string): void {
    if (networkId) {
        PublicClientCache.delete(networkId);
    } else {
        PublicClientCache.clear();
    }
}

export function invalidateWalletClientCache(
    networkId?: string,
    walletAddress?: string
): void {
    if (networkId && walletAddress) {
        const key = createCacheKey(networkId, walletAddress);
        WalletClientCache.delete(key);
    } else {
        WalletClientCache.clear();
    }
}

export function invalidateAllCaches(): void {
    StoryClientCache.clear();
    Web3StorageClientCache.clear();
    PublicClientCache.clear();
    WalletClientCache.clear();
}

export interface fetchStoryClientInput {
    networkId?: string;
    network?: BlockchainNetwork;
    wallet?: EscrowWallet;
    walletId?: string;
    walletAddress?: string;
}

export async function fetchStoryClient(
    input: fetchStoryClientInput
): Promise<StoryClient> {
    let network: BlockchainNetwork | null = null;

    if (input.network) {
        network = input.network;
    } else if (input.networkId) {
        const foundNetwork = await prisma.blockchainNetwork.findUnique({
            where: {
                id: input.networkId,
            },
        });

        if (!foundNetwork) {
            throw new Error("Network not found");
        }

        network = foundNetwork;
    } else {
        throw new Error("Network not found");
    }

    if (!network) {
        throw new Error("Network not found");
    }

    let wallet: EscrowWallet | null = null;
    if (input.wallet) {
        wallet = input.wallet;
    } else if (input.walletAddress) {
        const foundWallet = await prisma.escrowWallet.findUnique({
            where: {
                address: input.walletAddress,
            },
        });

        if (!foundWallet) {
            throw new Error("Wallet not found");
        }

        wallet = foundWallet;
    } else if (input.walletId) {
        const foundWallet = await prisma.escrowWallet.findUnique({
            where: {
                id: input.walletId,
            },
        });

        if (!foundWallet) {
            throw new Error("Wallet not found");
        }

        wallet = foundWallet;
    } else {
        throw new Error("Wallet not found");
    }

    if (!wallet) {
        throw new Error("Wallet not found");
    }

    const cacheKey = createCacheKey(network.id, wallet.address);
    const cachedClient = StoryClientCache.get(cacheKey);
    if (cachedClient) {
        return cachedClient;
    }

    try {
        const privateKey = await fetchEscrowWalletPrivateKey({
            address: wallet.address,
        });

        if (!privateKey) {
            throw new Error("Private key not found");
        }

        const account: Account = privateKeyToAccount(
            privateKey as `0x${string}`
        );

        // Story Protocol 체인 매핑
        const getStoryChainId = (networkName: string): SupportedChainIds => {
            const chainMapping: Record<string, SupportedChainIds> = {
                aeneid: "aeneid" as SupportedChainIds,
                iliad: "iliad" as SupportedChainIds,
                odyssey: "odyssey" as SupportedChainIds,
                "story-testnet": "aeneid" as SupportedChainIds,
                "story-mainnet": "iliad" as SupportedChainIds,
            };

            const normalized = networkName.toLowerCase();
            return (
                chainMapping[normalized] || (normalized as SupportedChainIds)
            );
        };

        const config: StoryConfig = {
            account: account,
            transport: http(network.rpcUrl as `http${string}`),
            chainId: getStoryChainId(network.name.toLowerCase()),
        };

        const storyClient = StoryClient.newClient(config);
        StoryClientCache.set(cacheKey, storyClient);
        return storyClient;
    } catch (error) {
        // 에러 발생시 캐시에서 제거
        StoryClientCache.delete(cacheKey);
        console.error("Failed to create Story client:", error);
        throw new Error(
            `Story client initialization failed: ${
                error instanceof Error ? error.message : "Unknown error"
            }`
        );
    }
}

export async function fetchWeb3StorageClient(): Promise<Client.Client> {
    if (!ADMIN_KEY) {
        throw new Error("ADMIN_KEY is not set");
    }

    const cacheKey = "web3storage-client";
    const cachedClient = Web3StorageClientCache.get(cacheKey);
    if (cachedClient) {
        return cachedClient;
    }

    try {
        const principal = Signer.parse(ADMIN_KEY as string);
        const store = new StoreMemory();
        const client = await Client.create({ principal, store });

        Web3StorageClientCache.set(cacheKey, client);
        return client;
    } catch (error) {
        // 에러 발생시 캐시에서 제거
        Web3StorageClientCache.delete(cacheKey);
        throw error;
    }
}

export type Network = Pick<
    BlockchainNetwork,
    "id" | "name" | "chainId" | "symbol" | "rpcUrl" | "explorerUrl"
>;

export interface fetchPublicClientInput {
    networkId?: string;
    network?: Network;
}

export async function fetchPublicClient(input: fetchPublicClientInput) {
    let network: Network | null = null;

    if (!input.networkId && !input.network) {
        throw new Error("Network not found");
    }

    let cacheKey = "public";
    if (input.networkId) {
        cacheKey = input.networkId;
        network = await prisma.blockchainNetwork.findUnique({
            where: {
                id: input.networkId,
            },
            select: {
                id: true,
                name: true,
                chainId: true,
                symbol: true,
                rpcUrl: true,
                explorerUrl: true,
            },
        });
    } else if (input.network) {
        cacheKey = input.network.id;
        network = input.network;
    } else {
        throw new Error("Network not found");
    }

    if (!network) {
        throw new Error("Network not found");
    }

    const cachedClient = PublicClientCache.get(cacheKey);
    if (cachedClient) {
        return cachedClient;
    }

    try {
        const chain: Chain = {
            id: network.chainId,
            name: network.name,
            nativeCurrency: {
                name: network.symbol,
                symbol: network.symbol,
                decimals: 18,
            },
            rpcUrls: {
                default: { http: [network.rpcUrl] },
                public: { http: [network.rpcUrl] },
            },
            blockExplorers: {
                default: { name: "Explorer", url: network.explorerUrl },
            },
        };

        const publicClient = createPublicClient({
            chain,
            transport: http(network.rpcUrl as `http${string}`),
        });

        PublicClientCache.set(cacheKey, publicClient);
        return publicClient;
    } catch (error) {
        // 에러 발생시 캐시에서 제거
        PublicClientCache.delete(cacheKey);
        throw error;
    }
}

export interface fetchWalletClientInput {
    networkId?: string;
    network?: Network;
    wallet?: EscrowWallet;
    walletAddress?: string;
}

export async function fetchWalletClient(input: fetchWalletClientInput) {
    let network: Network | null = null;
    let wallet: EscrowWallet | null = null;

    if (input.network) {
        network = input.network;
    } else if (input.networkId) {
        network = await prisma.blockchainNetwork.findUnique({
            where: { id: input.networkId },
            select: {
                id: true,
                name: true,
                chainId: true,
                symbol: true,
                rpcUrl: true,
                explorerUrl: true,
            },
        });
    }
    if (!network) throw new Error("Network not found");

    if (input.wallet) {
        wallet = input.wallet;
    } else if (input.walletAddress) {
        wallet = await prisma.escrowWallet.findUnique({
            where: { address: input.walletAddress },
        });
    }
    if (!wallet) throw new Error("Wallet not found");

    const cacheKey = createCacheKey(network.id, wallet.address);
    const cachedClient = WalletClientCache.get(cacheKey);
    if (cachedClient) {
        return cachedClient;
    }

    try {
        const privateKey = await fetchEscrowWalletPrivateKey({
            address: wallet.address,
        });
        if (!privateKey) throw new Error("Private key not found");
        const account = privateKeyToAccount(privateKey as `0x${string}`);

        const chain: Chain = {
            id: network.chainId,
            name: network.name,
            nativeCurrency: {
                name: network.symbol,
                symbol: network.symbol,
                decimals: 18,
            },
            rpcUrls: {
                default: { http: [network.rpcUrl] },
                public: { http: [network.rpcUrl] },
            },
            blockExplorers: {
                default: { name: "Explorer", url: network.explorerUrl },
            },
        };

        const walletClient = createWalletClient({
            account,
            chain,
            transport: http(network.rpcUrl as `http${string}`),
        });

        WalletClientCache.set(cacheKey, walletClient);
        return walletClient;
    } catch (error) {
        // 에러 발생시 캐시에서 제거
        WalletClientCache.delete(cacheKey);
        throw error;
    }
}
