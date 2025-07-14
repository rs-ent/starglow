/// app/queryKeys.ts
import type {
    GetArtistInput,
    GetArtistMessagesInput,
    GetArtistsInput,
    TokenGatingInput as ArtistTokenGatingInput,
    GetPlayersInput,
} from "./actions/artists";
import type { TokenGateInput } from "./actions/blockchain";
import type { GetDBUserFromPlayerInput } from "./actions/player";
import type { GetPlayerAssetsFilter } from "@/app/actions/playerAssets/actions";
import type {
    GetPlayerPollLogsInput,
    GetPollLogsInput,
    GetPollsInput,
    PaginationInput,
    TokenGatingPollInput,
} from "./actions/polls";
import type {
    CompleteQuestInput,
    GetClaimableQuestLogsInput,
    GetClaimedQuestLogsInput,
    GetPlayerQuestLogsInput,
    GetQuestInput,
    GetQuestLogsInput,
    GetQuestsInput,
    TokenGatingQuestInput,
} from "./actions/quests";
import type { GetReferralLogsInput } from "./actions/referral";
import type { GetRewardsLogsInput } from "./actions/rewardsLogs";
import type {
    GetStakeRewardInput,
    GetUserStakeRewardLogsInput,
    GetUserStakingTokensInput,
} from "./actions/staking";
import type { GetUsersInput } from "./actions/user";
import type { CollectionParticipantType } from "@prisma/client";
import type * as PortOne from "@portone/browser-sdk/v2";

export const queryKeys = {
    user: {
        all: ["user"] as const,
        list: (input?: GetUsersInput) =>
            [...queryKeys.user.all, "list", input] as const,
        byId: (id: string) => ["user", id] as const,
        byPlayerId: (input?: GetDBUserFromPlayerInput) =>
            ["user", "player", input?.playerId] as const,
        byEmail: (email: string) => ["user", "email", email] as const,
        byTelegramId: (telegramId: string) =>
            ["user", "telegram", telegramId] as const,
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
        metadataByUrls: (urls: string[]) =>
            ["files", "metadata", "urls", urls] as const,
        allWithFilters: (params?: any) =>
            ["files", "all-with-filters", params] as const,
        allBlob: ["files", "all-blob"] as const,
        comparison: ["files", "comparison"] as const,
    },
    exchangeRate: {
        info: (
            fromCurrency: PortOne.Entity.Currency,
            toCurrency: PortOne.Entity.Currency
        ) => ["exchangeRate", "info", fromCurrency, toCurrency] as const,
        convert: (
            amount: number,
            fromCurrency: PortOne.Entity.Currency,
            toCurrency: PortOne.Entity.Currency
        ) =>
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
    nft: {
        all: ["nft"] as const,
        byId: (id: string) => ["nft", id] as const,
        byCollection: (collectionId: string) =>
            ["nft", "collection", collectionId] as const,
        byOwner: (ownerAddress: string) =>
            ["nft", "owner", ownerAddress] as const,
        byWallets: (walletAddresses: string[]) =>
            ["nft", "owners", walletAddresses] as const,
        events: (nftId: string) => ["nft", "events", nftId] as const,
        statistics: {
            collection: (collectionId: string) =>
                ["nft", "statistics", "collection", collectionId] as const,
            network: (networkId: string) =>
                ["nft", "statistics", "network", networkId] as const,
        },
        filters: (params: Record<string, any>) =>
            ["nft", "filters", params] as const,
        owner: (
            contractAddress: string,
            tokenIds: string[],
            networkId: string
        ) => ["nft", "owner", contractAddress, tokenIds, networkId] as const,
        ownership: (
            contractAddress: string,
            tokenIds: string[],
            ownerAddress: string,
            networkId: string
        ) =>
            [
                "nft",
                "ownership",
                contractAddress,
                tokenIds,
                ownerAddress,
                networkId,
            ] as const,
    },
};

export const playerKeys = {
    all: ["player"] as const,
    byId: (id: string) => ["player", id] as const,
    byUserId: (userId: string) => ["player", "user", userId] as const,
    referralLogs: (input?: GetReferralLogsInput) =>
        ["player", "referral-logs", input?.playerId] as const,
    pollLogs: (input?: GetPlayerPollLogsInput) =>
        ["player", "poll-logs", input?.playerId] as const,
    profile: (id: string) => ["player", "profile", id] as const,
};

export const assetKeys = {
    all: ["assets"] as const,
    byId: (id: string) => ["assets", id] as const,
    byName: (name: string) => ["assets", "name", name] as const,
    bySymbol: (symbol: string) => ["assets", "symbol", symbol] as const,
    byContractAddress: (contractAddress: string) =>
        ["assets", "contractAddress", contractAddress] as const,
    contracts: (filters?: any) =>
        [...assetKeys.all, "contracts", filters] as const,
    contract: (address: string) =>
        [...assetKeys.all, "contract", address] as const,
    instances: (filters?: any) =>
        [...assetKeys.all, "instances", filters] as const,
    instance: (id: string) => [...assetKeys.all, "instance", id] as const,
    tutorial: (id: string) => [...assetKeys.all, "tutorial", id] as const,
    tutorials: () => [...assetKeys.all, "tutorials"] as const,
    hasTutorial: (assetId: string) =>
        [...assetKeys.all, "has-tutorial", assetId] as const,
    analytics: (id: string) => [...assetKeys.all, "analytics", id] as const,
    customizationPresets: () =>
        [...assetKeys.all, "customization-presets"] as const,
    stepTemplates: () => [...assetKeys.all, "step-templates"] as const,
};

export const playerAssetsKeys = {
    all: ["playerAssets"] as const,
    balance: (playerId: string, assetId: string) =>
        [...playerAssetsKeys.all, "balance", playerId, assetId] as const,
    balances: (playerId: string, assetIds?: string[]) =>
        assetIds
            ? ([
                  ...playerAssetsKeys.all,
                  "balances",
                  playerId,
                  assetIds,
              ] as const)
            : ([...playerAssetsKeys.all, "balances", playerId] as const),
    lists: () => [...playerAssetsKeys.all, "list"] as const,
    list: (filters: GetPlayerAssetsFilter) =>
        [...playerAssetsKeys.lists(), filters] as const,
    details: () => [...playerAssetsKeys.all, "detail"] as const,
    detail: (playerId: string, assetId: string) =>
        [...playerAssetsKeys.details(), playerId, assetId] as const,
    instances: (filters?: any) =>
        [...playerAssetsKeys.all, "instances", filters] as const,
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

// Factory query keys 기본 배열 정의
const FACTORY_BASE_KEY = ["factories"] as const;

// Factory query keys 타입 정의
type FactoryKeysType = {
    all: readonly ["factories"];
    lists: () => readonly ["factories", "list"];
    byNetwork: (networkId: string) => readonly ["factories", "network", string];
    byId: (id: string) => readonly ["factories", "detail", string];
    status: {
        active: (
            networkId: string
        ) => readonly ["factories", "status", "active", string];
        inactive: (
            networkId: string
        ) => readonly ["factories", "status", "inactive", string];
    };
    collections: {
        all: (
            factoryId: string
        ) => readonly ["factories", "collections", string];
        byAddress: (
            factoryId: string,
            address: string
        ) => readonly ["factories", "collections", string, string];
        byNetwork: (
            networkId: string
        ) => readonly ["factories", "collections", "network", string];
        global: readonly ["factories", "collections", "all"];
    };
    deployment: {
        pending: (
            networkId: string
        ) => readonly ["factories", "deployment", "pending", string];
        completed: (
            networkId: string
        ) => readonly ["factories", "deployment", "completed", string];
    };
};

// Factory query keys
export const factoryKeys: FactoryKeysType = {
    all: FACTORY_BASE_KEY,
    lists: () => [...FACTORY_BASE_KEY, "list"] as const,
    byNetwork: (networkId: string) =>
        [...FACTORY_BASE_KEY, "network", networkId] as const,
    byId: (id: string) => [...FACTORY_BASE_KEY, "detail", id] as const,

    // Factory 상태 관련
    status: {
        active: (networkId: string) =>
            [...FACTORY_BASE_KEY, "status", "active", networkId] as const,
        inactive: (networkId: string) =>
            [...FACTORY_BASE_KEY, "status", "inactive", networkId] as const,
    },

    // Factory가 생성한 컬렉션 관련
    collections: {
        all: (factoryId: string) =>
            [...FACTORY_BASE_KEY, "collections", factoryId] as const,
        byAddress: (factoryId: string, address: string) =>
            [...FACTORY_BASE_KEY, "collections", factoryId, address] as const,
        // 네트워크별 모든 컬렉션
        byNetwork: (networkId: string) =>
            [...FACTORY_BASE_KEY, "collections", "network", networkId] as const,
        // 전체 컬렉션 (필터 없음)
        global: [...FACTORY_BASE_KEY, "collections", "all"] as const,
    },

    // 배포 관련
    deployment: {
        pending: (networkId: string) =>
            [...FACTORY_BASE_KEY, "deployment", "pending", networkId] as const,
        completed: (networkId: string) =>
            [
                ...FACTORY_BASE_KEY,
                "deployment",
                "completed",
                networkId,
            ] as const,
    },
} as const;

// Collection query keys
export const collectionKeys = {
    all: ["collections"] as const,
    byAddress: (address: string) =>
        [...collectionKeys.all, "address", address] as const,
    lists: () => [...collectionKeys.all, "list"] as const,
    detail: (address: string) =>
        [...collectionKeys.all, "detail", address] as const,
    userVerified: (userId?: string) =>
        userId
            ? [...collectionKeys.all, "user-verified", userId]
            : ([...collectionKeys.all, "user-verified"] as const),

    deployment: {
        pending: (networkId: string) =>
            [
                ...collectionKeys.all,
                "deployment",
                "pending",
                networkId,
            ] as const,
        completed: (networkId: string) =>
            [
                ...collectionKeys.all,
                "deployment",
                "completed",
                networkId,
            ] as const,
        byNetwork: (networkId: string) =>
            [
                ...collectionKeys.all,
                "deployment",
                "network",
                networkId,
            ] as const,
    },

    // 컬렉션 상태 관련
    status: {
        paused: (address: string) =>
            [...collectionKeys.all, "status", "paused", address] as const,
        mintingEnabled: (address: string) =>
            [
                ...collectionKeys.all,
                "status",
                "minting-enabled",
                address,
            ] as const,
    },

    // 토큰(NFT) 관련
    tokens: {
        all: (address: string) =>
            [...collectionKeys.all, "tokens", address] as const,
        byOwner: (address: string, owner: string) =>
            [...collectionKeys.all, "tokens", address, "owner", owner] as const,
        byIds: (address: string, tokenIds: number[]) =>
            [
                ...collectionKeys.all,
                "tokens",
                address,
                "ids",
                tokenIds,
            ] as const,
        locked: (address: string) =>
            [...collectionKeys.all, "tokens", "locked", address] as const,
        burned: (address: string) =>
            [...collectionKeys.all, "tokens", "burned", address] as const,
        staked: (address: string) =>
            [...collectionKeys.all, "tokens", "staked", address] as const,
        filtered: (
            address: string,
            options?: {
                tokenIds?: number[];
                ownerAddress?: string;
                isBurned?: boolean;
                isLocked?: boolean;
                isStaked?: boolean;
            }
        ) =>
            [
                ...collectionKeys.all,
                "tokens",
                "filtered",
                address,
                options,
            ] as const,
        owners: (address: string, tokenIds: number[]) =>
            [
                ...collectionKeys.all,
                "tokens",
                "owners",
                address,
                tokenIds,
            ] as const,
        nonce: (address: string) =>
            [...collectionKeys.all, "tokens", "nonce", address] as const,
        stock: (address: string) =>
            [...collectionKeys.all, "tokens", "stock", address] as const,
    },

    participants: {
        all: (collectionAddress: string, type: CollectionParticipantType) =>
            [
                ...collectionKeys.all,
                "participants",
                collectionAddress,
                type,
            ] as const,
    },

    // 이벤트 관련
    events: {
        all: (address: string) =>
            [...collectionKeys.all, "events", address] as const,
        byType: (address: string, eventType: string) =>
            [...collectionKeys.all, "events", address, eventType] as const,
        byToken: (address: string, tokenId: number) =>
            [
                ...collectionKeys.all,
                "events",
                address,
                "token",
                tokenId,
            ] as const,
    },

    // 에스크로 지갑 관련
    escrowWallets: {
        all: (address: string) =>
            [...collectionKeys.all, "escrow-wallets", address] as const,
        isEscrow: (address: string, wallet: string) =>
            [
                ...collectionKeys.all,
                "escrow-wallets",
                "is-escrow",
                address,
                wallet,
            ] as const,
    },

    // URI 관련
    uri: {
        base: (address: string) =>
            [...collectionKeys.all, "uri", "base", address] as const,
        contract: (address: string) =>
            [...collectionKeys.all, "uri", "contract", address] as const,
    },

    // 가스 예측 관련
    gas: {
        mint: (address: string, quantity: number) =>
            [...collectionKeys.all, "gas", "mint", address, quantity] as const,
        burn: (address: string, tokenIds: number[]) =>
            [...collectionKeys.all, "gas", "burn", address, tokenIds] as const,
        transfer: (address: string, tokenIds: number[]) =>
            [
                ...collectionKeys.all,
                "gas",
                "transfer",
                address,
                tokenIds,
            ] as const,
        lock: (address: string, tokenIds: number[]) =>
            [...collectionKeys.all, "gas", "lock", address, tokenIds] as const,
        unlock: (address: string, tokenIds: number[]) =>
            [
                ...collectionKeys.all,
                "gas",
                "unlock",
                address,
                tokenIds,
            ] as const,
    },

    // 메타데이터 관련
    metadata: {
        token: (address: string, tokenId: number) =>
            [...collectionKeys.all, "metadata", address, tokenId] as const,
        batch: (address: string, tokenIds: number[]) =>
            [
                ...collectionKeys.all,
                "metadata",
                "batch",
                address,
                tokenIds,
            ] as const,
    },

    settings: {
        all: (address: string) =>
            [...collectionKeys.all, "settings", address] as const,
        byAddress: (address: string) =>
            [...collectionKeys.all, "settings", address] as const,
    },
} as const;

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
    recovery: {
        nft: (collectionAddress: string, tokenId: number) =>
            [
                ...metadataKeys.all,
                "recovery",
                "nft",
                collectionAddress,
                tokenId,
            ] as const,
    },
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

export const pollKeys = {
    all: ["polls"] as const,
    lists: () => [...pollKeys.all, "list"] as const,
    list: (input?: GetPollsInput, pagination?: PaginationInput) =>
        [...pollKeys.all, "list", input, pagination] as const,
    detail: (id: string) => [...pollKeys.all, "detail", id] as const,
    byId: (id: string) => ["polls", id] as const,
    byStatus: (status: string) => ["polls", "status", status] as const,
    byCategory: (category: string) => ["polls", "category", category] as const,
    tokenGating: (input?: TokenGatingPollInput) =>
        [
            ...pollKeys.all,
            "token-gating",
            input?.pollId,
            input?.userId,
        ] as const,
    logs: (input?: GetPollLogsInput) =>
        [...pollKeys.all, "logs", input] as const,
    log: (pollLogId: string) => [...pollKeys.all, "log", pollLogId] as const,
    logByUser: (pollId: string, playerId: string) =>
        [...pollKeys.all, "logs", pollId, playerId] as const,
    playerLogs: (playerId: string) =>
        [...pollKeys.all, "player-logs", playerId] as const,
    result: (pollId: string) => [...pollKeys.all, "result", pollId] as const,
    results: (pollIds: string[]) =>
        [...pollKeys.all, "results", pollIds] as const,
    selection: (pollId: string) =>
        [...pollKeys.all, "selection", pollId] as const,
} as const;

export const questKeys = {
    all: ["quests"] as const,

    // 리스트 조회 키
    list: (input?: GetQuestsInput, pagination?: PaginationInput) =>
        [...questKeys.all, "list", { input, pagination }] as const,

    // 상세 조회 키
    detail: (input?: GetQuestInput) =>
        [...questKeys.all, "detail", input?.id] as const,

    // 토큰 게이팅 키 - 구조 단순화
    tokenGating: (input?: TokenGatingQuestInput) =>
        [
            ...questKeys.all,
            "token-gating",
            input?.questId,
            input?.userId,
        ] as const,

    // 퀘스트 완료 키 - 구조 단순화
    complete: (input?: CompleteQuestInput) =>
        [
            ...questKeys.all,
            "complete",
            input?.quest?.id,
            input?.player?.id,
        ] as const,

    // 로그 관련 키 - 구조 단순화 및 일관성 유지
    logs: (input?: GetQuestLogsInput, pagination?: PaginationInput) =>
        [...questKeys.all, "logs", { input, pagination }] as const,

    playerLogs: (input?: GetPlayerQuestLogsInput) =>
        [...questKeys.all, "player-logs", input?.playerId] as const,

    claimableLogs: (input?: GetClaimableQuestLogsInput) =>
        [...questKeys.all, "claimable-logs", input?.playerId] as const,

    claimedLogs: (input?: GetClaimedQuestLogsInput) =>
        [...questKeys.all, "claimed-logs", input?.playerId] as const,
} as const;

export const artistKeys = {
    all: ["artists"] as const,
    list: (input?: GetArtistsInput) =>
        [...artistKeys.all, "list", input] as const,
    detail: (input?: GetArtistInput) =>
        [...artistKeys.all, "detail", input] as const,
    metadata: (input?: GetArtistInput) =>
        [...artistKeys.all, "metadata", input] as const,
    star: (input?: GetArtistInput) =>
        [...artistKeys.all, "star", input] as const,
    messages: (input?: GetArtistMessagesInput) =>
        [...artistKeys.all, "messages", input] as const,
    tokenGating: (input?: ArtistTokenGatingInput) =>
        [...artistKeys.all, "token-gating", input] as const,
    players: (input?: GetPlayersInput) =>
        [...artistKeys.all, "players", input] as const,
};

export const stakingKeys = {
    all: ["staking"] as const,
    userStakingTokens: (input?: GetUserStakingTokensInput) =>
        [...stakingKeys.all, "user-staking-tokens", input?.userId] as const,
    stakeRewards: (input?: GetStakeRewardInput) =>
        [...stakingKeys.all, "stake-rewards", input?.assetId] as const,
    userStakeRewardLogs: (input?: GetUserStakeRewardLogsInput) =>
        [...stakingKeys.all, "user-stake-reward-logs", input?.userId] as const,
};

export const blockchainKeys = {
    all: ["blockchain"] as const,
    tokenGate: (input?: TokenGateInput) =>
        [
            ...blockchainKeys.all,
            "token-gate",
            input?.tokenAddress,
            input?.userId,
        ] as const,
};

export const rewardLogsKeys = {
    all: ["reward-logs"] as const,
    list: (input?: GetRewardsLogsInput) =>
        ["reward-logs", "list", input] as const,
    infinite: (input?: GetRewardsLogsInput) =>
        ["reward-logs", "infinite", input] as const,
};

export const artistFeedKeys = {
    all: ["artist-feeds"] as const,
    list: (params: { artistId: string; cursor?: string; limit?: number }) =>
        [...artistFeedKeys.all, "list", params] as const,
    infiniteList: (params: { artistId: string; limit?: number }) =>
        [...artistFeedKeys.all, "infinite-list", params] as const,
    byId: (id: string) => [...artistFeedKeys.all, "detail", id] as const,
    reactions: (params: {
        artistFeedId?: string;
        playerId?: string;
        cursor?: string;
        limit?: number;
    }) => [...artistFeedKeys.all, "reactions", params] as const,
};

export const tweetKeys = {
    all: ["tweets"] as const,
    latestSyncData: () => [...tweetKeys.all, "latest-sync-data"] as const,
    tweets: () => [...tweetKeys.all, "tweets"] as const,
    authors: () => [...tweetKeys.all, "authors"] as const,
    tweetMetricsHistory: (input: object) =>
        [...tweetKeys.all, "tweet-metrics-history", input] as const,
    authorMetricsHistory: (input: object) =>
        [...tweetKeys.all, "author-metrics-history", input] as const,
    authorByPlayerId: (key: string) =>
        [...tweetKeys.all, "author-by-player-id", key] as const,
    validateRegisterXAuthor: (input: object) =>
        [...tweetKeys.all, "validate-register-x-author", input] as const,
    checkIsActiveXAuthor: (input: object) =>
        [...tweetKeys.all, "check-is-active-x-author", input] as const,
    confirmRegisterXAuthor: (input: object) =>
        [...tweetKeys.all, "confirm-register-x-author", input] as const,
};

// Raffle query keys 기본 배열 정의
const RAFFLE_BASE_KEY = ["raffles"] as const;

// Raffle query keys 타입 정의
type RaffleKeysType = {
    all: readonly ["raffles"];
    lists: () => readonly ["raffles", "list"];
    list: (input?: any) => readonly ["raffles", "list", any];
    detail: (raffleId: string) => readonly ["raffles", "detail", string];
    byArtist: (artistId: string) => readonly ["raffles", "artist", string];
    byCategory: (category: string) => readonly ["raffles", "category", string];
    byStatus: (status: string) => readonly ["raffles", "status", string];
    byPlayer: (playerId: string) => readonly ["raffles", "player", string];
    participants: {
        all: (raffleId: string) => readonly ["raffles", "participants", string];
        byRaffle: (
            raffleId: string
        ) => readonly ["raffles", "participants", "raffle", string];
        byPlayer: (
            playerId: string
        ) => readonly ["raffles", "participants", "player", string];
    };
    winners: {
        all: (raffleId: string) => readonly ["raffles", "winners", string];
        byRaffle: (
            raffleId: string
        ) => readonly ["raffles", "winners", "raffle", string];
        byPlayer: (
            playerId: string
        ) => readonly ["raffles", "winners", "player", string];
    };
    // 다중 참여 지원 키들
    playerParticipations: (
        raffleId: string,
        playerId: string
    ) => readonly ["raffles", "player-participations", string, string];
    unrevealedCount: (
        raffleId: string,
        playerId: string
    ) => readonly ["raffles", "unrevealed-count", string, string];
    userParticipation: (
        raffleId: string,
        playerId: string
    ) => readonly ["raffles", "user-participation", string, string];
    analytics: {
        all: readonly ["raffles", "analytics"];
        general: (
            input?: any
        ) => readonly ["raffles", "analytics", "general", any];
        byArtist: (
            artistId: string
        ) => readonly ["raffles", "analytics", "artist", string];
        byCategory: (
            category: string
        ) => readonly ["raffles", "analytics", "category", string];
        probability: (
            raffleIds?: string[]
        ) => readonly [
            "raffles",
            "analytics",
            "probability",
            string[] | undefined
        ];
        revenue: (
            raffleIds?: string[]
        ) => readonly ["raffles", "analytics", "revenue", string[] | undefined];
        participants: (
            playerIds?: string[]
        ) => readonly [
            "raffles",
            "analytics",
            "participants",
            string[] | undefined
        ];
        verification: (
            raffleId: string
        ) => readonly ["raffles", "analytics", "verification", string];
    };
    advancedSettings: {
        all: readonly ["raffles", "advanced"];
        probability: (
            raffleId: string
        ) => readonly ["raffles", "advanced", "probability", string];
        weighting: (
            raffleId: string
        ) => readonly ["raffles", "advanced", "weighting", string];
        cooldowns: (
            playerId: string
        ) => readonly ["raffles", "advanced", "cooldowns", string];
    };
};

// Raffle query keys
export const raffleKeys: RaffleKeysType = {
    all: RAFFLE_BASE_KEY,
    lists: () => [...RAFFLE_BASE_KEY, "list"] as const,
    list: (input?: any) => [...RAFFLE_BASE_KEY, "list", input] as const,
    detail: (raffleId: string) =>
        [...RAFFLE_BASE_KEY, "detail", raffleId] as const,
    byArtist: (artistId: string) =>
        [...RAFFLE_BASE_KEY, "artist", artistId] as const,
    byCategory: (category: string) =>
        [...RAFFLE_BASE_KEY, "category", category] as const,
    byStatus: (status: string) =>
        [...RAFFLE_BASE_KEY, "status", status] as const,
    byPlayer: (playerId: string) =>
        [...RAFFLE_BASE_KEY, "player", playerId] as const,

    // Raffle participants
    participants: {
        all: (raffleId: string) =>
            [...RAFFLE_BASE_KEY, "participants", raffleId] as const,
        byRaffle: (raffleId: string) =>
            [...RAFFLE_BASE_KEY, "participants", "raffle", raffleId] as const,
        byPlayer: (playerId: string) =>
            [...RAFFLE_BASE_KEY, "participants", "player", playerId] as const,
    },

    // Raffle winners
    winners: {
        all: (raffleId: string) =>
            [...RAFFLE_BASE_KEY, "winners", raffleId] as const,
        byRaffle: (raffleId: string) =>
            [...RAFFLE_BASE_KEY, "winners", "raffle", raffleId] as const,
        byPlayer: (playerId: string) =>
            [...RAFFLE_BASE_KEY, "winners", "player", playerId] as const,
    },

    // 다중 참여 지원 키들
    playerParticipations: (raffleId: string, playerId: string) =>
        [
            ...RAFFLE_BASE_KEY,
            "player-participations",
            raffleId,
            playerId,
        ] as const,
    unrevealedCount: (raffleId: string, playerId: string) =>
        [...RAFFLE_BASE_KEY, "unrevealed-count", raffleId, playerId] as const,
    userParticipation: (raffleId: string, playerId: string) =>
        [...RAFFLE_BASE_KEY, "user-participation", raffleId, playerId] as const,

    // Raffle analytics
    analytics: {
        all: [...RAFFLE_BASE_KEY, "analytics"] as const,
        general: (input?: any) =>
            [...RAFFLE_BASE_KEY, "analytics", "general", input] as const,
        byArtist: (artistId: string) =>
            [...RAFFLE_BASE_KEY, "analytics", "artist", artistId] as const,
        byCategory: (category: string) =>
            [...RAFFLE_BASE_KEY, "analytics", "category", category] as const,
        probability: (raffleIds?: string[]) =>
            [
                ...RAFFLE_BASE_KEY,
                "analytics",
                "probability",
                raffleIds,
            ] as const,
        revenue: (raffleIds?: string[]) =>
            [...RAFFLE_BASE_KEY, "analytics", "revenue", raffleIds] as const,
        participants: (playerIds?: string[]) =>
            [
                ...RAFFLE_BASE_KEY,
                "analytics",
                "participants",
                playerIds,
            ] as const,
        verification: (raffleId: string) =>
            [
                ...RAFFLE_BASE_KEY,
                "analytics",
                "verification",
                raffleId,
            ] as const,
    },

    // Raffle advanced settings
    advancedSettings: {
        all: [...RAFFLE_BASE_KEY, "advanced"] as const,
        probability: (raffleId: string) =>
            [...RAFFLE_BASE_KEY, "advanced", "probability", raffleId] as const,
        weighting: (raffleId: string) =>
            [...RAFFLE_BASE_KEY, "advanced", "weighting", raffleId] as const,
        cooldowns: (playerId: string) =>
            [...RAFFLE_BASE_KEY, "advanced", "cooldowns", playerId] as const,
    },
} as const;

export const discordKeys = {
    all: ["discord"] as const,
    discordCode: (code: string) =>
        [...discordKeys.all, "discord-code", code] as const,
};

// Board query keys 기본 배열 정의
const BOARD_BASE_KEY = ["boards"] as const;

// Board query keys 타입 정의
type BoardKeysType = {
    all: readonly ["boards"];
    lists: () => readonly ["boards", "list"];
    list: (
        input?: any,
        pagination?: any
    ) => readonly ["boards", "list", any, any];
    detail: (boardId: string) => readonly ["boards", "detail", string];
    byArtist: (artistId: string) => readonly ["boards", "artist", string];
    posts: {
        all: (
            boardId?: string
        ) =>
            | readonly ["boards", "posts", string]
            | readonly ["boards", "posts"];
        list: (
            input?: any,
            pagination?: any
        ) => readonly ["boards", "posts", "list", any, any];
        infinite: (
            input?: any
        ) => readonly ["boards", "posts", "infinite", any];
        detail: (
            postId: string
        ) => readonly ["boards", "posts", "detail", string];
        byAuthor: (
            authorId: string
        ) => readonly ["boards", "posts", "author", string];
        byBoard: (
            boardId: string
        ) => readonly ["boards", "posts", "board", string];
    };
    comments: {
        all: (
            postId?: string
        ) =>
            | readonly ["boards", "comments", string]
            | readonly ["boards", "comments"];
        byPost: (
            postId: string
        ) => readonly ["boards", "comments", "post", string];
        byAuthor: (
            authorId: string
        ) => readonly ["boards", "comments", "author", string];
    };
    reactions: {
        all: readonly ["boards", "reactions"];
        byPost: (
            postId: string
        ) => readonly ["boards", "reactions", "post", string];
        byComment: (
            commentId: string
        ) => readonly ["boards", "reactions", "comment", string];
        byPlayer: (
            playerId: string
        ) => readonly ["boards", "reactions", "player", string];
    };
    rewards: {
        all: readonly ["boards", "rewards"];
        list: (input?: any) => readonly ["boards", "rewards", "list", any];
        byPost: (
            postId: string
        ) => readonly ["boards", "rewards", "post", string];
        byPlayer: (
            playerId: string
        ) => readonly ["boards", "rewards", "player", string];
        byReason: (
            reason: string
        ) => readonly ["boards", "rewards", "reason", string];
    };
};

// Board query keys
export const boardKeys: BoardKeysType = {
    all: BOARD_BASE_KEY,
    lists: () => [...BOARD_BASE_KEY, "list"] as const,
    list: (input?: any, pagination?: any) =>
        [...BOARD_BASE_KEY, "list", input, pagination] as const,
    detail: (boardId: string) =>
        [...BOARD_BASE_KEY, "detail", boardId] as const,
    byArtist: (artistId: string) =>
        [...BOARD_BASE_KEY, "artist", artistId] as const,

    // Board posts
    posts: {
        all: (boardId?: string) =>
            boardId
                ? ([...BOARD_BASE_KEY, "posts", boardId] as const)
                : ([...BOARD_BASE_KEY, "posts"] as const),
        list: (input?: any, pagination?: any) =>
            [...BOARD_BASE_KEY, "posts", "list", input, pagination] as const,
        infinite: (input?: any) =>
            [...BOARD_BASE_KEY, "posts", "infinite", input] as const,
        detail: (postId: string) =>
            [...BOARD_BASE_KEY, "posts", "detail", postId] as const,
        byAuthor: (authorId: string) =>
            [...BOARD_BASE_KEY, "posts", "author", authorId] as const,
        byBoard: (boardId: string) =>
            [...BOARD_BASE_KEY, "posts", "board", boardId] as const,
    },

    // Board comments
    comments: {
        all: (postId?: string) =>
            postId
                ? ([...BOARD_BASE_KEY, "comments", postId] as const)
                : ([...BOARD_BASE_KEY, "comments"] as const),
        byPost: (postId: string) =>
            [...BOARD_BASE_KEY, "comments", "post", postId] as const,
        byAuthor: (authorId: string) =>
            [...BOARD_BASE_KEY, "comments", "author", authorId] as const,
    },

    // Board reactions
    reactions: {
        all: [...BOARD_BASE_KEY, "reactions"] as const,
        byPost: (postId: string) =>
            [...BOARD_BASE_KEY, "reactions", "post", postId] as const,
        byComment: (commentId: string) =>
            [...BOARD_BASE_KEY, "reactions", "comment", commentId] as const,
        byPlayer: (playerId: string) =>
            [...BOARD_BASE_KEY, "reactions", "player", playerId] as const,
    },

    // Board post rewards
    rewards: {
        all: [...BOARD_BASE_KEY, "rewards"] as const,
        list: (input?: any) =>
            [...BOARD_BASE_KEY, "rewards", "list", input] as const,
        byPost: (postId: string) =>
            [...BOARD_BASE_KEY, "rewards", "post", postId] as const,
        byPlayer: (playerId: string) =>
            [...BOARD_BASE_KEY, "rewards", "player", playerId] as const,
        byReason: (reason: string) =>
            [...BOARD_BASE_KEY, "rewards", "reason", reason] as const,
    },
} as const;

// Notification query keys 기본 배열 정의
const NOTIFICATION_BASE_KEY = ["notifications"] as const;

// Notification query keys 타입 정의
type NotificationKeysType = {
    all: readonly ["notifications"];
    lists: () => readonly ["notifications", "list"];
    list: (input?: any) => readonly ["notifications", "list", any];
    detail: (
        notificationId: string
    ) => readonly ["notifications", "detail", string];
    byPlayer: (
        playerId: string
    ) => readonly ["notifications", "player", string];
    byType: (type: string) => readonly ["notifications", "type", string];
    byCategory: (
        category: string
    ) => readonly ["notifications", "category", string];
    byEntity: (
        entityType: string,
        entityId: string
    ) => readonly ["notifications", "entity", string, string];
    byStatus: (status: string) => readonly ["notifications", "status", string];
    unreadCount: (
        playerId: string,
        category?: string
    ) => readonly ["notifications", "unread-count", string, string?];
    settings: {
        all: (
            playerId: string
        ) => readonly ["notifications", "settings", string];
        byPlayer: (
            playerId: string
        ) => readonly ["notifications", "settings", "player", string];
    };
    stats: {
        all: readonly ["notifications", "stats"];
        daily: (
            date: string
        ) => readonly ["notifications", "stats", "daily", string];
        byPlayer: (
            playerId: string
        ) => readonly ["notifications", "stats", "player", string];
    };
};

// Notification query keys
export const notificationKeys: NotificationKeysType = {
    all: NOTIFICATION_BASE_KEY,
    lists: () => [...NOTIFICATION_BASE_KEY, "list"] as const,
    list: (input?: any) => [...NOTIFICATION_BASE_KEY, "list", input] as const,
    detail: (notificationId: string) =>
        [...NOTIFICATION_BASE_KEY, "detail", notificationId] as const,
    byPlayer: (playerId: string) =>
        [...NOTIFICATION_BASE_KEY, "player", playerId] as const,
    byType: (type: string) => [...NOTIFICATION_BASE_KEY, "type", type] as const,
    byCategory: (category: string) =>
        [...NOTIFICATION_BASE_KEY, "category", category] as const,
    byEntity: (entityType: string, entityId: string) =>
        [...NOTIFICATION_BASE_KEY, "entity", entityType, entityId] as const,
    byStatus: (status: string) =>
        [...NOTIFICATION_BASE_KEY, "status", status] as const,
    unreadCount: (playerId: string, category?: string) =>
        category
            ? ([
                  ...NOTIFICATION_BASE_KEY,
                  "unread-count",
                  playerId,
                  category,
              ] as const)
            : ([...NOTIFICATION_BASE_KEY, "unread-count", playerId] as const),

    // Notification settings
    settings: {
        all: (playerId: string) =>
            [...NOTIFICATION_BASE_KEY, "settings", playerId] as const,
        byPlayer: (playerId: string) =>
            [...NOTIFICATION_BASE_KEY, "settings", "player", playerId] as const,
    },

    // Notification stats
    stats: {
        all: [...NOTIFICATION_BASE_KEY, "stats"] as const,
        daily: (date: string) =>
            [...NOTIFICATION_BASE_KEY, "stats", "daily", date] as const,
        byPlayer: (playerId: string) =>
            [...NOTIFICATION_BASE_KEY, "stats", "player", playerId] as const,
    },
} as const;
