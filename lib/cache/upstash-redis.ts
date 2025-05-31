/// lib\cache\upstash-redis.ts

import {Redis} from "@upstash/redis";

// 환경 변수 확인 - 접두사 없는 변수명 사용
const kvUrl = process.env.KV_URL;
const kvToken = process.env.KV_REST_API_READ_ONLY_TOKEN;
const redisUrl = process.env.REDIS_URL;
const restApiUrl = process.env.KV_REST_API_URL;
const restApiToken = process.env.KV_REST_API_TOKEN;

// Upstash Redis 클라이언트 초기화 - REST API URL과 토큰 사용
const redis = new Redis({
    url: restApiUrl!,
    token: restApiToken!,
});

/**
 * @description 캐시 옵션
 * @param ttl 캐시 만료 시간 (초)
 * @param forceRefresh 강제 새로고침 여부
 * @param tags 캐시 태그
 * @param staleWhileRevalidate 데이터가 만료되기 전에 사용 가능한 시간 (초)
 */
export interface CacheOptions {
    ttl?: number;
    forceRefresh?: boolean;
    tags?: string[];
    staleWhileRevalidate?: number;
}

export interface InvalidateCacheOptions {
    keys?: string[];
    tags?: string[];
}

const DEFAULT_CACHE_OPTIONS: CacheOptions = {
    ttl: 3600,
    forceRefresh: false,
    tags: [],
    staleWhileRevalidate: 300,
};

/**
 * 캐시 키 생성
 * @param prefix 키 접두사
 * @param args 키 구성 요소
 * @returns 생성된 캐시 키
 */
export function generateCacheKey(prefix: string, ...args: any[]): string {
    return `${prefix}:${args.join(":")}`;
}

/**
 * 캐시 태그 추가
 * @param key 캐시 키
 * @param tags 태그 배열
 */
async function addTagsToKey(key: string, tags: string[]): Promise<void> {
    if (!tags || tags.length === 0) return;
    
    const tagKeys = tags.map((tag) => `tag:${tag}`);
    const saddPromises = tagKeys.map((tagKey) => redis.sadd(tagKey, key));
    await Promise.all(saddPromises);
}

/**
 * 캐시 태그 제거
 * @param key 캐시 키
 * @param tags 태그 배열
 */
async function removeTagsFromKey(key: string, tags: string[]): Promise<void> {
    if (!tags || tags.length === 0) return;
    
    const tagKeys = tags.map((tag) => `tag:${tag}`);
    const sremPromises = tagKeys.map((tagKey) => redis.srem(tagKey, key));
    await Promise.all(sremPromises);
}

/**
 * 캐시 태그로 무효화
 * @param tags 무효화할 태그 배열
 */
async function invalidateByTags(tags: string[]): Promise<void> {
    if (!tags || tags.length === 0) return;
    
    for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        const keys = await redis.smembers(tagKey);
        
        if (keys && keys.length > 0) {
            const delPromises = keys.map((key) => redis.del(key));
            await Promise.all(delPromises);
        }
        
        await redis.del(tagKey);
    }
}

/**
 * 캐시 키로 무효화
 * @param keys 무효화할 키 배열
 */
async function invalidateByKeys(keys: string[]): Promise<void> {
    if (!keys || keys.length === 0) return;
    
    const delPromises = keys.map((key) => redis.del(key));
    await Promise.all(delPromises);
}

/**
 * 캐시 무효화
 * @param options 무효화 옵션 (키 또는 태그)
 */
export async function invalidateCache(options: InvalidateCacheOptions = {}): Promise<void> {
    const { keys, tags } = options;
    
    const promises: Promise<void>[] = [];
    
    if (keys && keys.length > 0) {
        promises.push(invalidateByKeys(keys));
    }
    
    if (tags && tags.length > 0) {
        promises.push(invalidateByTags(tags));
    }
    
    await Promise.all(promises);
}

/**
 * 캐시된 데이터 가져오기
 * @param key 캐시 키
 * @param fallback 캐시 미스 시 실행할 함수
 * @param options 캐시 옵션
 * @returns 캐시된 데이터 또는 fallback 함수의 결과
 */
export async function getCachedData<T>(
    key: string,
    fallback: () => Promise<T>,
    options: CacheOptions = {}
): Promise<T> {
    const {
        ttl = DEFAULT_CACHE_OPTIONS.ttl,
        forceRefresh = DEFAULT_CACHE_OPTIONS.forceRefresh,
        tags = DEFAULT_CACHE_OPTIONS.tags,
        staleWhileRevalidate = DEFAULT_CACHE_OPTIONS.staleWhileRevalidate,
    } = options;

    try {
        // 강제 새로고침이 아니면 캐시 확인
        if (!forceRefresh) {
            const cachedData = await redis.get(key);
            
            if (cachedData !== null && cachedData !== undefined) {
                // 백그라운드에서 데이터 갱신 (staleWhileRevalidate가 설정된 경우)
                if (staleWhileRevalidate) {
                    fallback()
                        .then(async (newData) => {
                            try {
                                // 데이터 직렬화 처리
                                const serializedData = typeof newData === 'string' 
                                    ? newData 
                                    : JSON.stringify(newData);
                                
                                await redis.set(
                                    key,
                                    serializedData,
                                    ttl ? { ex: ttl } : undefined
                                );
                                
                                // 태그가 있으면 추가
                                if (tags && tags.length > 0) {
                                    await addTagsToKey(key, tags);
                                }
                            } catch (error) {
                                console.error(`Background update serialization error for key ${key}:`, error);
                            }
                        })
                        .catch((error) => {
                            console.error(
                                `Background update failed for key ${key}:`,
                                error
                            );
                        });
                }
                
                // 데이터 역직렬화 처리
                try {
                    // 이미 객체인 경우 그대로 반환, 문자열인 경우 파싱 시도
                    if (typeof cachedData === 'object' && cachedData !== null) {
                        return cachedData as T;
                    } else if (typeof cachedData === 'string') {
                        try {
                            return JSON.parse(cachedData) as T;
                        } catch (e) {
                            // JSON 파싱 실패 시 원본 문자열 반환
                            return cachedData as unknown as T;
                        }
                    } else {
                        return cachedData as unknown as T;
                    }
                } catch (error) {
                    console.error(`Cache data parsing error for key ${key}:`, error);
                    // 파싱 오류 시 원본 데이터 반환
                    return cachedData as unknown as T;
                }
            }
        }

        // 캐시 미스 또는 강제 새로고침인 경우 데이터 가져오기
        const data = await fallback();
        
        try {
            // 데이터 직렬화 처리
            const serializedData = typeof data === 'string' 
                ? data 
                : JSON.stringify(data);
            
            // 데이터 캐싱
            await redis.set(key, serializedData, ttl ? { ex: ttl } : undefined);
            
            // 태그가 있으면 추가
            if (tags && tags.length > 0) {
                await addTagsToKey(key, tags);
            }
        } catch (error) {
            console.error(`Cache serialization error for key ${key}:`, error);
        }

        return data;
    } catch (error) {
        console.error(`Cache error for key ${key}:`, error);
        // 오류 발생 시 fallback 함수 실행
        return fallback();
    }
}

/**
 * 시계열 데이터 추가
 * @param key 시계열 키
 * @param value 값
 * @param timestamp 타임스탬프 (기본값: 현재 시간)
 */
export async function addTimeSeriesData(
    key: string,
    value: number,
    timestamp: number = Date.now()
): Promise<void> {
    try {
        // 시계열이 존재하지 않으면 생성
        await redis.call("TS.CREATE", key, "RETENTION", 86400000 * 30); // 30일 보관
    } catch (error) {
        // 이미 존재하는 경우 무시
    }
    
    // 데이터 추가
    await redis.call("TS.ADD", key, timestamp, value);
}

/**
 * 시계열 데이터 조회
 * @param key 시계열 키
 * @param fromTime 시작 시간
 * @param toTime 종료 시간 (기본값: 현재 시간)
 */
export async function getTimeSeriesData(
    key: string,
    fromTime: number,
    toTime: number = Date.now()
): Promise<[number, number][]> {
    try {
        const result = await redis.call("TS.RANGE", key, fromTime, toTime);
        return result as [number, number][];
    } catch (error) {
        console.error(`Error getting time series data for key ${key}:`, error);
        return [];
    }
}

/**
 * Top-K 데이터 구조 생성
 * @param key Top-K 키
 * @param k 추적할 상위 항목 수
 */
export async function createTopK(key: string, k: number = 50): Promise<void> {
    try {
        await redis.call("TOPK.RESERVE", key, k);
    } catch (error) {
        // 이미 존재하는 경우 무시
    }
}

/**
 * Top-K 데이터 추가
 * @param key Top-K 키
 * @param items 추가할 항목들
 */
export async function addToTopK(key: string, ...items: string[]): Promise<void> {
    if (!items || items.length === 0) return;
    
    try {
        await redis.call("TOPK.ADD", key, ...items);
    } catch (error) {
        console.error(`Error adding to TopK ${key}:`, error);
    }
}

/**
 * Top-K 데이터 조회
 * @param key Top-K 키
 * @returns 상위 항목 목록
 */
export async function getTopK(key: string): Promise<string[]> {
    try {
        return await redis.call("TOPK.LIST", key) as string[];
    } catch (error) {
        console.error(`Error getting TopK for key ${key}:`, error);
        return [];
    }
}

/**
 * T-Digest 데이터 구조 생성 (백분위수 계산용)
 * @param key T-Digest 키
 * @param compression 압축 계수 (기본값: 100)
 */
export async function createTDigest(key: string, compression: number = 100): Promise<void> {
    try {
        await redis.call("TDIGEST.CREATE", key, "COMPRESSION", compression);
    } catch (error) {
        // 이미 존재하는 경우 무시
    }
}

/**
 * T-Digest에 데이터 추가
 * @param key T-Digest 키
 * @param values 추가할 값들
 */
export async function addToTDigest(key: string, ...values: number[]): Promise<void> {
    if (!values || values.length === 0) return;
    
    try {
        await redis.call("TDIGEST.ADD", key, ...values);
    } catch (error) {
        console.error(`Error adding to TDigest ${key}:`, error);
    }
}

/**
 * T-Digest에서 백분위수 조회
 * @param key T-Digest 키
 * @param percentiles 조회할 백분위수 배열
 * @returns 백분위수 값 배열
 */
export async function getTDigestPercentiles(key: string, ...percentiles: number[]): Promise<number[]> {
    if (!percentiles || percentiles.length === 0) return [];
    
    try {
        return await redis.call("TDIGEST.QUANTILE", key, ...percentiles) as number[];
    } catch (error) {
        console.error(`Error getting TDigest percentiles for key ${key}:`, error);
        return [];
    }
}

export default redis;