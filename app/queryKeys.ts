/// app/queryKeys.ts
import * as PortOne from "@portone/browser-sdk/v2";

export const queryKeys = {
    quests: {
        all: ["quests"] as const,
        byId: (id: string) => ["quests", id] as const,
        completed: (playerId: string) =>
            ["quests", "completed", playerId] as const,
        daily: () => ["quests", "daily"] as const,
        missions: () => ["quests", "missions"] as const,
    },
    player: {
        all: ["player"] as const,
        byId: (id: string) => ["player", id] as const,
        currency: (playerId: string, currencyType: string) =>
            ["player", playerId, "currency", currencyType] as const,
    },
    currency: ["currency"] as const,
    rewards: ["rewards"] as const,
    banners: () => ["banners"] as const,
    files: {
        all: ["files"] as const,
        byPurpose: (purpose: string) => ["files", purpose] as const,
        byBucket: (bucket: string) => ["files", bucket] as const,
        byId: (id: string) => ["files", id] as const,
        byPurposeAndBucket: (purpose: string, bucket: string) =>
            ["files", purpose, bucket] as const,
    },
    exchangeRate: {
        info: ["exchangeRate", "info"] as const,
        convert: (amount: number, fromCurrency: string, toCurrency: string) =>
            [
                "exchangeRate",
                "convert",
                amount,
                fromCurrency,
                toCurrency,
            ] as const,
    },
    defaultWallets: {
        all: ["defaultWallets"] as const,
        polygon: ["defaultWallets", "polygon"] as const,
        byId: (address: string) => ["defaultWallets", address] as const,
        byNetwork: (network: string) =>
            ["defaultWallets", "network", network] as const,
    },
    payment: {
        all: ["payment"] as const,
        byId: (id: string) => ["payment", id] as const,
        list: (userId: string) => ["payment", "user", userId] as const,
        byStatus: (status: string) => ["payment", "status", status] as const,
        portOneEnv: (
            payMethod: PortOne.Entity.PayMethod,
            easyPayProvider?: PortOne.Entity.EasyPayProvider | undefined,
            cardProvider?: PortOne.Entity.Country | undefined
        ) =>
            [
                "payment",
                "portOneEnv",
                payMethod,
                easyPayProvider ?? "none",
                cardProvider ?? "none",
            ] as const,
    },
    contracts: {
        factory: {
            collections: ["contracts", "factory", "collections"] as const,
            collectionByName: (name: string) =>
                ["contracts", "factory", "collectionByName", name] as const,
        },
    },
    ipfs: {
        all: ["ipfs"] as const,
        files: {
            all: ["ipfs", "files"] as const,
            byId: (id: string) => ["ipfs", "files", id] as const,
            byGroup: (groupId: string) =>
                ["ipfs", "files", "group", groupId] as const,
        },
        metadata: {
            all: ["ipfs", "metadata"] as const,
            byId: (id: string) => ["ipfs", "metadata", id] as const,
            byCollection: (collectionId: string) =>
                ["ipfs", "metadata", "collection", collectionId] as const,
            linkable: ["ipfs", "metadata", "linkable"] as const,
            byCid: (cid: string) => ["ipfs", "metadata", "cid", cid] as const,
        },
        groups: {
            all: ["ipfs", "groups"] as const,
            byId: (id: string) => ["ipfs", "groups", id] as const,
            byName: (name: string) => ["ipfs", "groups", "name", name] as const,
        },
    },
};

export const QUERY_KEYS = {
    BLOCKCHAIN_NETWORKS: "blockchain-networks",
    FACTORY_CONTRACTS: "factory-contracts",
    ESCROW_WALLETS: "escrow-wallets",
    ACTIVE_ESCROW_WALLET: "active-escrow-wallet",
    COLLECTION_CONTRACTS: "collection-contracts",
} as const;

// Collection query keys
export const collectionKeys = {
    all: ["collections"] as const,
    lists: () => [...collectionKeys.all, "list"] as const,
    detail: (id: string) => [...collectionKeys.all, "detail", id] as const,
    status: (address: string) =>
        [...collectionKeys.all, "status", address] as const,
};
