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
    payment: {
        all: ["payments"] as const,
        byId: (id: string) => ["payments", id] as const,
        byUserId: (userId: string) => ["payments", "user", userId] as const,
        byStatus: (status: string) => ["payments", "status", status] as const,
        byProductTable: (productTable: string) =>
            ["payments", "productTable", productTable] as const,
        byProductId: (productTable: string, productId: string) =>
            ["payments", "product", productTable, productId] as const,
    },
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
    contracts: {
        factory: {
            collections: ["contracts", "factory", "collections"] as const,
            collectionByName: (name: string) =>
                ["contracts", "factory", "collectionByName", name] as const,
        },
    },
    /*ipfs: {
        files: {
            all: ["ipfs", "files"] as const,
            byGroup: (groupId: string) =>
                ["ipfs", "files", "group", groupId] as const,
            byId: (id: string) => ["ipfs", "files", id] as const,
        },
        metadata: {
            all: ["ipfs", "metadata"] as const,
            byId: (id: string) => ["ipfs", "metadata", id] as const,
            linkable: ["ipfs", "metadata", "linkable"] as const,
            byCollection: (collectionId: string) =>
                ["ipfs", "metadata", "collection", collectionId] as const,
            folder: (metadataId: string) =>
                [...queryKeys.ipfs.metadata.all, "folder", metadataId] as const,
        },
        groups: {
            all: ["ipfs", "groups"] as const,
            byId: (id: string) => ["ipfs", "groups", id] as const,
            byName: (name: string) => ["ipfs", "groups", "name", name] as const,
        },
    },*/
    nft: {
        all: ["nft"] as const,
        byId: (id: string) => ["nft", id] as const,
        byCollection: (collectionId: string) =>
            ["nft", "collection", collectionId] as const,
        byOwner: (ownerAddress: string) =>
            ["nft", "owner", ownerAddress] as const,
        events: (nftId: string) => ["nft", "events", nftId] as const,
        statistics: {
            collection: (collectionId: string) =>
                ["nft", "statistics", "collection", collectionId] as const,
            network: (networkId: string) =>
                ["nft", "statistics", "network", networkId] as const,
        },
        filters: (params: Record<string, any>) =>
            ["nft", "filters", params] as const,
    },
    collection: {
        all: ["collection"] as const,
        byId: (id: string) => ["collection", id] as const,
        byAddress: (address: string) =>
            ["collection", "address", address] as const,
    },
};

export const QUERY_KEYS = {
    BLOCKCHAIN_NETWORKS: "blockchain-networks",
    FACTORY_CONTRACTS: "factory-contracts",
    ESCROW_WALLETS: "escrow-wallets",
    ACTIVE_ESCROW_WALLET: "active-escrow-wallet",
    COLLECTION_CONTRACTS: "collection-contracts",
    NFTS: "nfts",
    NFT_EVENTS: "nft-events",
} as const;

// Collection query keys
export const collectionKeys = {
    all: ["collections"] as const,
    lists: () => [...collectionKeys.all, "list"] as const,
    detail: (id: string) => [...collectionKeys.all, "detail", id] as const,
    settings: (id: string) => [...collectionKeys.all, "settings", id] as const,
    status: (address: string) =>
        [...collectionKeys.all, "status", address] as const,
    estimateMintGas: (address: string, to: string, quantity: number) =>
        [
            ...collectionKeys.all,
            "estimateMintGas",
            address,
            to,
            quantity,
        ] as const,
    listed: () => [...collectionKeys.all, "listed"] as const,
};

export const metadataKeys = {
    all: ["metadata"] as const,
    lists: () => [...metadataKeys.all, "list"] as const,
    list: (filters: string) => [...metadataKeys.lists(), { filters }] as const,
    details: () => [...metadataKeys.all, "detail"] as const,
    detail: (id: string) => [...metadataKeys.details(), id] as const,
    collection: (address: string) =>
        [...metadataKeys.all, "collection", address] as const,
    nfts: (collectionAddress: string) =>
        [...metadataKeys.all, "nfts", collectionAddress] as const,
} as const;

export const walletKeys = {
    all: ["wallets"] as const,
    byUserId: (userId: string) => ["wallets", "user", userId] as const,
} as const;

export const paymentPostProcessorKeys = {
    all: ["payment-post-processor"] as const,
    status: (paymentId: string) =>
        [...paymentPostProcessorKeys.all, "status", paymentId] as const,
    result: (paymentId: string) =>
        [...paymentPostProcessorKeys.all, "result", paymentId] as const,
    nft: {
        transfer: (paymentId: string) =>
            [
                ...paymentPostProcessorKeys.all,
                "nft",
                "transfer",
                paymentId,
            ] as const,
        escrowTransfer: (paymentId: string) =>
            [
                ...paymentPostProcessorKeys.all,
                "nft",
                "escrow-transfer",
                paymentId,
            ] as const,
    },
    events: {
        process: (paymentId: string) =>
            [
                ...paymentPostProcessorKeys.all,
                "events",
                "process",
                paymentId,
            ] as const,
    },
} as const;