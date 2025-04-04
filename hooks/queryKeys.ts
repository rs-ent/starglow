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
        byPurposeAndBucket: (purpose: string, bucket: string) =>
            ["files", purpose, bucket] as const,
    },
    payments: {
        all: ["payments"] as const,
        byId: (id: string) => ["payments", id] as const,
        byUser: (userId: string) => ["payments", "user", userId] as const,
        byStatus: (status: string) => ["payments", "status", status] as const,
        ready: (userId: string, table: string, target: string) =>
            ["payments", "ready", userId, table, target] as const,
    },
};
