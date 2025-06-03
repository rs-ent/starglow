/// app/story/client.ts

import {
    StoryClient,
    StoryConfig,
    SupportedChainIds,
} from "@story-protocol/core-sdk";
import { prisma } from "@/lib/prisma/client";
import { BlockchainNetwork, EscrowWallet } from "@prisma/client";
import { privateKeyToAccount, Account } from "viem/accounts";
import { fetchEscrowWalletPrivateKey } from "./escrowWallet/actions";
import * as Client from "@web3-storage/w3up-client";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";
import { Signer } from "@web3-storage/w3up-client/principal/ed25519";
import { Chain, createPublicClient, http, PublicClient } from "viem";

const ADMIN_KEY = process.env.WEB3STORAGE_ADMIN_KEY;

export const StoryClientCache = new Map<string, StoryClient>();

export interface fetchStoryClientInput {
    userId: string;
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

    const cacheKey = `${network.id}-${wallet.address}`;
    if (StoryClientCache.has(cacheKey)) {
        return StoryClientCache.get(cacheKey)!;
    }

    const privateKey = await fetchEscrowWalletPrivateKey({
        userId: input.userId,
        address: wallet.address,
    });

    if (!privateKey) {
        throw new Error("Private key not found");
    }

    const account: Account = privateKeyToAccount(privateKey as `0x${string}`);

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
        return chainMapping[normalized] || (normalized as SupportedChainIds);
    };

    const config: StoryConfig = {
        account: account,
        transport: http(network.rpcUrl as `http${string}`),
        chainId: getStoryChainId(network.name.toLowerCase()),
    };

    try {
        const storyClient = StoryClient.newClient(config);
        StoryClientCache.set(cacheKey, storyClient);
        return storyClient;
    } catch (error) {
        console.error("Failed to create Story client:", error);
        throw new Error(
            `Story client initialization failed: ${
                error instanceof Error ? error.message : "Unknown error"
            }`
        );
    }
}

export const Web3StorageClientCache = new Map<string, Client.Client>();

export async function fetchWeb3StorageClient(): Promise<Client.Client> {
    if (!ADMIN_KEY) {
        throw new Error("ADMIN_KEY is not set");
    }

    const cacheKey = "web3storage-client";
    if (Web3StorageClientCache.has(cacheKey)) {
        return Web3StorageClientCache.get(cacheKey)!;
    }

    const principal = Signer.parse(ADMIN_KEY as string);
    const store = new StoreMemory();
    const client = await Client.create({ principal, store });

    Web3StorageClientCache.set(cacheKey, client);

    return client;
}

export const PublicClientCache = new Map<string, PublicClient>();

export interface fetchPublicClientInput {
    networkId?: string;
    network?: BlockchainNetwork;
}

export async function fetchPublicClient(input: fetchPublicClientInput) {
    let network: BlockchainNetwork | null = null;

    if (!input.networkId && !input.network) {
        throw new Error("Network not found");
    }

    let cacheKey = "public";
    if (input.networkId) {
        cacheKey = input.networkId;
    } else if (input.network) {
        cacheKey = input.network.id;
    }

    if (PublicClientCache.has(cacheKey)) {
        return PublicClientCache.get(cacheKey)!;
    }

    if (input.network) {
        network = input.network;
    } else if (input.networkId) {
        network = await prisma.blockchainNetwork.findUnique({
            where: {
                id: input.networkId,
            },
        });
    } else {
        throw new Error("Network not found");
    }

    if (!network) {
        throw new Error("Network not found");
    }

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
}
