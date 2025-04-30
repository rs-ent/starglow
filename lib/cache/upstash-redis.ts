/// lib\cache\upstash-redis.ts

import { Redis } from "@upstash/redis";

const kvUrl = process.env.UPSTASH_KV_URL;
const kvToken = process.env.UPSTASH_KV_REST_API_READ_ONLY_TOKEN;
const redisUrl = process.env.UPSTASH_REDIS_URL;
const restApiUrl = process.env.UPSTASH_KV_REST_API_URL;
const restApiToken = process.env.UPSTASH_KV_REST_API_TOKEN;

const redis = new Redis({
    url: redisUrl!,
    token: restApiToken!,
});

/**
 * @description 캐시 옵션
 * @param ttl 캐시 만료 시간 (초)
 * @param forceRefresh 강제 새로고침 여부
 * @param tags 캐시 태그
 * @param staleWhileRevalidate 데이터가 만료되기 전에 사용 가능한 시간 (초)
 */
interface CacheOptions {
    ttl?: number;
    forceRefresh?: boolean;
    tags?: string[];
    staleWhileRevalidate?: number;
}

const DEFAULT_CACHE_OPTIONS: CacheOptions = {
    ttl: 3600,
    forceRefresh: false,
    tags: [],
    staleWhileRevalidate: 300,
};

// 캐시 키 생성
function generateCacheKey(prefix: string, ...args: any[]): string {
    return `${prefix}:${args.join(":")}`;
}

// 캐시 태그 추가
async function addTagsToKey(key: string, tags: string[]): Promise<void> {
    const tagKeys = tags.map((tag) => `tag:${tag}`);
    const saddPromises = tagKeys.map((tagKey) => redis.sadd(tagKey, key));
    await Promise.all(saddPromises);
}

// 캐시 태그 제거
async function removeTagsFromKey(key: string, tags: string[]): Promise<void> {
    const tagKeys = tags.map((tag) => `tag:${tag}`);
    const sremPromises = tagKeys.map((tagKey) => redis.srem(tagKey, key));
    await Promise.all(sremPromises);
}

// 캐시 태그 무효화
async function invalidateByTags(tags: string[]): Promise<void> {
    for (const tag of tags) {
        const keys = await redis.smembers(`tag:${tag}`);
        const delPromises = keys.map((key) => redis.del(key));
        await Promise.all(delPromises);

        await redis.del(`tag:${tag}`);
    }
}

// 캐시 데이터 가져오기
async function getCachedData(
    key: string,
    fallback: () => Promise<any>,
    options: CacheOptions = {}
): Promise<any> {
    const {
        ttl = DEFAULT_CACHE_OPTIONS.ttl,
        forceRefresh = DEFAULT_CACHE_OPTIONS.forceRefresh,
        tags = DEFAULT_CACHE_OPTIONS.tags,
        staleWhileRevalidate = DEFAULT_CACHE_OPTIONS.staleWhileRevalidate,
    } = options;

    if (!forceRefresh) {
        const cachedData = await redis.get(key);
        if (cachedData) {
            if (staleWhileRevalidate) {
                fallback()
                    .then(async (newData) => {
                        await redis.set(
                            key,
                            JSON.stringify(newData),
                            ttl ? { ex: ttl } : undefined
                        );
                    })
                    .catch((error) => {
                        console.error(
                            `Background update failed for key ${key}:`,
                            error
                        );
                    });
            }
            return JSON.parse(cachedData as string);
        }
    }

    const data = await fallback();
    await redis.set(key, JSON.stringify(data), ttl ? { ex: ttl } : undefined);

    if (tags && tags.length > 0) {
        await addTagsToKey(key, tags);
    }

    return data;
}
