/**
 * Prisma Accelerate Cache Strategies for Starglow Platform
 *
 * TTL: Time-to-Live (신선한 데이터 보장 시간)
 * SWR: Stale-While-Revalidate (백그라운드 갱신 허용 시간)
 */

export const PrismaCacheStrategies = {
    /** 실시간 데이터 (가격, 투표 결과 등) */
    realtime: {
        ttl: 1, // 1초
        swr: 3, // 3초
    },
    /** 매우 자주 업데이트되는 데이터 (사용자 활동 등) */
    tenSeconds: {
        ttl: 10, // 10초
        swr: 30, // 30초
    },
    /** 자주 업데이트되는 데이터 (래플 참여 현황) */
    thirtySeconds: {
        ttl: 30, // 30초
        swr: 60, // 60초
    },
    /** 중간 빈도 업데이트 (래플 참여 기록, NFT 상태) */
    oneMinute: {
        ttl: 60, // 1분
        swr: 120, // 2분
    },
    /** 일반적인 사용자 데이터 */
    twoMinutes: {
        ttl: 120, // 2분
        swr: 240, // 4분
    },
    /** 아티스트 피드, 게시판 내용 */
    fiveMinutes: {
        ttl: 300, // 5분
        swr: 600, // 10분
    },
    /** 설정 데이터, 메타데이터 */
    tenMinutes: {
        ttl: 600, // 10분
        swr: 1200, // 20분
    },
    /** 아티스트 정보, 자산 정보 */
    thirtyMinutes: {
        ttl: 1800, // 30분
        swr: 3600, // 1시간
    },
    /** 통계 데이터, 랭킹 */
    oneHour: {
        ttl: 3600, // 1시간
        swr: 7200, // 2시간
    },
    /** 일별 집계 데이터 */
    twoHours: {
        ttl: 7200, // 2시간
        swr: 14400, // 4시간
    },
    /** 레포트, 분석 데이터 */
    fourHours: {
        ttl: 14400, // 4시간
        swr: 28800, // 8시간
    },
    /** 주기적 배치 데이터 */
    eightHours: {
        ttl: 28800, // 8시간
        swr: 57600, // 16시간
    },
    /** 일별 요약 데이터 */
    oneDay: {
        ttl: 86400, // 1일
        swr: 172800, // 2일
    },
    /** 주간 데이터 */
    twoDays: {
        ttl: 172800, // 2일
        swr: 345600, // 4일
    },
    /** 월별 요약, 역사적 데이터 */
    sevenDays: {
        ttl: 604800, // 7일
        swr: 1209600, // 14일
    },
    /** 월별 통계 */
    oneMonth: {
        ttl: 2592000, // 30일
        swr: 5184000, // 60일
    },
    /** 분기별 데이터 */
    twoMonths: {
        ttl: 5184000, // 60일
        swr: 10368000, // 120일
    },
    /** 분기별 리포트 */
    threeMonths: {
        ttl: 7776000, // 90일
        swr: 15552000, // 180일
    },
    /** 반기별 데이터 */
    sixMonths: {
        ttl: 15552000, // 180일
        swr: 31104000, // 360일
    },
    /** 연간 데이터 */
    oneYear: {
        ttl: 31104000, // 360일
        swr: 62208000, // 720일
    },
    /** 거의 변경되지 않는 정적 데이터 (설정, 상수) */
    forever: {
        ttl: 60 * 60 * 24 * 30 * 12 * 10, // 10년
        swr: 60 * 60 * 24 * 30 * 12 * 20, // 20년
    },
} as const;

export type CacheStrategyKey = keyof typeof PrismaCacheStrategies;
export type CacheStrategy = (typeof PrismaCacheStrategies)[CacheStrategyKey];

/**
 * 타입 안전하게 캐시 전략을 가져오는 함수
 */
export function getCacheStrategy(key: CacheStrategyKey): CacheStrategy {
    return PrismaCacheStrategies[key];
}
