/// app/story/queryKeys.ts

export const queryKeys = {
    storyNetwork: {
        all: ["storyNetwork"] as const,
        list: () => [...queryKeys.storyNetwork.all, "list"] as const,
        network: (id: string) =>
            [...queryKeys.storyNetwork.all, "network", id] as const,
    },
    escrowWallet: {
        all: ["escrowWallet"] as const,
        list: () => [...queryKeys.escrowWallet.all, "list"] as const,
        wallet: (address: string) =>
            [...queryKeys.escrowWallet.all, "wallet", address] as const,
        registeredWallets: (spgAddress: string) =>
            [
                ...queryKeys.escrowWallet.all,
                "registeredWallets",
                spgAddress,
            ] as const,
        balance: (address: string) =>
            [...queryKeys.escrowWallet.all, "balance", address] as const,
        balances: (addresses: string[]) =>
            [...queryKeys.escrowWallet.all, "balances", addresses] as const,
    },
    metadata: {
        all: ["metadata"] as const,
        list: (filter?: object) =>
            [...queryKeys.metadata.all, "list", filter] as const,
        ipfs: (target: string) =>
            [...queryKeys.metadata.all, "ipfs", target] as const,
    },
    spg: {
        all: ["spg"] as const,
        contract: (address: string) =>
            [...queryKeys.spg.all, "contract", address] as const,
        contracts: () => [...queryKeys.spg.all, "contracts"] as const,
        list: () => [...queryKeys.spg.all, "list"] as const,
        collection: (filter?: object) =>
            [...queryKeys.spg.all, "nft", filter] as const,
    },
    nft: {
        all: ["nft"] as const,
        list: (filter?: object) =>
            [...queryKeys.nft.all, "list", filter] as const,
        unregistered: (id: string) =>
            [...queryKeys.nft.all, "unregistered", id] as const,
        owners: (tokenIds: string[]) =>
            [...queryKeys.nft.all, "owners", tokenIds] as const,
        circulation: (address: string) =>
            [...queryKeys.nft.all, "circulation", address] as const,
    },
    tba: {
        all: ["tba"] as const,
        list: (filter?: object) =>
            [...queryKeys.tba.all, "list", filter] as const,
        contract: (id: string) =>
            [...queryKeys.tba.all, "contract", id] as const,
        contracts: (filter?: object) =>
            [...queryKeys.tba.all, "contracts", filter] as const,
        addresses: (networkId: string) =>
            [...queryKeys.tba.all, "addresses", networkId] as const,
    },
} as const;
