export function formatAmount(amount: number): string {
    if (amount === 0) return "0";

    const isNegative = amount < 0;
    const absoluteAmount = Math.abs(amount);

    if (absoluteAmount >= 1000000) {
        const millions = absoluteAmount / 1000000;
        return `${isNegative ? "-" : ""}${millions.toFixed(1)}M`;
    } else if (absoluteAmount >= 1000) {
        const thousands = absoluteAmount / 1000;
        return `${isNegative ? "-" : ""}${thousands.toFixed(1)}K`;
    } else {
        return `${isNegative ? "-" : ""}${absoluteAmount.toLocaleString()}`;
    }
}

export const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
};

export const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}시간 ${minutes % 60}분`;
    } else if (minutes > 0) {
        return `${minutes}분 ${seconds % 60}초`;
    } else {
        return `${seconds}초`;
    }
};

export function formatPlayerName(playerId: string, nickname: string): string {
    return nickname || `Player-${playerId.slice(-6)}`;
}

export const safeParseNumber = (
    value: any,
    defaultValue: number = 0
): number => {
    const parsed = typeof value === "number" ? value : Number(value);
    return isNaN(parsed) ? defaultValue : parsed;
};

export const truncateText = (text: string, maxLength: number): string => {
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

interface PollSettlementCache {
    pollId: string;
    pollTotalBetAmount: number;
    totalWinningBetAmount: number;
    totalPayoutPool: number;
    winningOptionIds: string[];
    poll: any;
    calculatedAt: number;
    expiresAt: number;
}

class SettlementCacheManager {
    private cache = new Map<string, PollSettlementCache>();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5분

    async getCommonData(
        pollId: string,
        winningOptionIds: string[],
        calculateFn: () => Promise<{
            poll: any;
            pollTotalBetAmount: number;
            totalWinningBetAmount: number;
            totalPayoutPool: number;
        }>
    ): Promise<PollSettlementCache> {
        const cacheKey = `${pollId}:${winningOptionIds.sort().join(",")}`;
        const now = Date.now();

        // 캐시 확인
        const cached = this.cache.get(cacheKey);
        if (cached && cached.expiresAt > now) {
            return cached;
        }

        // 캐시 미스 - 새로 계산
        const result = await calculateFn();

        const cacheData: PollSettlementCache = {
            pollId,
            winningOptionIds,
            calculatedAt: now,
            expiresAt: now + this.CACHE_TTL,
            ...result,
        };

        this.cache.set(cacheKey, cacheData);

        // 만료된 캐시 정리
        this.cleanExpiredCache();

        return cacheData;
    }

    private cleanExpiredCache(): void {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (value.expiresAt <= now) {
                this.cache.delete(key);
            }
        }
    }

    clearCache(pollId?: string): void {
        if (pollId) {
            // 특정 폴 관련 캐시만 삭제
            for (const [key] of this.cache.entries()) {
                if (key.startsWith(pollId)) {
                    this.cache.delete(key);
                }
            }
        } else {
            // 전체 캐시 삭제
            this.cache.clear();
        }
    }

    getCacheStats(): {
        totalEntries: number;
        expiredEntries: number;
        validEntries: number;
        memoryUsage: string;
    } {
        const now = Date.now();
        let expired = 0;
        let valid = 0;

        for (const value of this.cache.values()) {
            if (value.expiresAt <= now) {
                expired++;
            } else {
                valid++;
            }
        }

        const memoryUsage = `${(
            (JSON.stringify([...this.cache.values()]).length * 2) /
            1024
        ).toFixed(1)}KB`;

        return {
            totalEntries: this.cache.size,
            expiredEntries: expired,
            validEntries: valid,
            memoryUsage,
        };
    }
}

export const settlementCacheManager = new SettlementCacheManager();
