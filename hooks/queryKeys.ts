/// hooks/queryKeys.ts

export const queryKeys = {
    quests: {
        all: ["quests"] as const,
        byId: (id: string) => ["quests", id] as const,
        byPlayer: (playerId: string) => ["quests", "player", playerId] as const,
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
    },
};
