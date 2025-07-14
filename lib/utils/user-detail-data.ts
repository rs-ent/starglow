import { headers } from "next/headers";

/**
 * 사용자 상세 정보 타입 정의 (Prisma 스키마와 일치)
 */
export interface UserDetailData {
    ipAddress: string | null;
    locale: string | null;
    os: string | null;
    device: string | null;
    browser: string | null;
    country: string | null;
    state: string | null;
    city: string | null;
}

/**
 * 기본 사용자 정보 (즉시 수집 가능한 정보)
 */
export interface BasicUserDetailData {
    locale: string | null;
    os: string | null;
    device: string | null;
    browser: string | null;
}

/**
 * 확장 사용자 정보 (외부 API 필요)
 */
export interface ExtendedUserDetailData extends BasicUserDetailData {
    ipAddress: string | null;
    country: string | null;
    state: string | null;
    city: string | null;
}

// 캐시 키
const CACHE_KEYS = {
    IP_DATA: "user_ip_data",
    LOCATION_DATA: "user_location_data",
} as const;

// 캐시 만료 시간 (5분)
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * 서버사이드에서 사용자의 IP 주소를 가져오는 함수 (초고속)
 */
export function getServerSideUserIP(request: Request): string | null {
    const headersList = request.headers;

    // 가장 일반적인 헤더부터 빠르게 확인
    const commonHeaders = ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"];

    for (const header of commonHeaders) {
        const value = headersList.get(header);
        if (value) {
            const ip = value.split(",")[0].trim();
            if (isValidIP(ip)) return ip;
        }
    }

    return null;
}

/**
 * 서버사이드에서 사용자의 기본 정보를 즉시 가져오는 함수
 */
export function getServerSideUserDetails(
    request: Request
): Partial<UserDetailData> {
    const headersList = request.headers;
    const userAgent = headersList.get("user-agent") || "";
    const acceptLanguage = headersList.get("accept-language") || "";

    return {
        ipAddress: getServerSideUserIP(request),
        locale: parseLocaleFromAcceptLanguage(acceptLanguage),
        os: parseOSFromUserAgent(userAgent),
        device: parseDeviceFromUserAgent(userAgent),
        browser: parseBrowserFromUserAgent(userAgent),
        // 서버에서는 지역 정보 null로 설정 (속도 우선)
        country: null,
        state: null,
        city: null,
    };
}

/**
 * 클라이언트사이드에서 기본 정보를 즉시 가져오는 함수 (0ms)
 */
export function getBasicUserDetails(): BasicUserDetailData {
    if (typeof window === "undefined") {
        return { locale: null, os: null, device: null, browser: null };
    }

    const userAgent = navigator.userAgent;
    const locale = navigator.language || navigator.languages?.[0] || null;

    return {
        locale: locale,
        os: parseOSFromUserAgent(userAgent),
        device: parseDeviceFromUserAgent(userAgent),
        browser: parseBrowserFromUserAgent(userAgent),
    };
}

/**
 * 캐시된 데이터 가져오기
 */
function getCachedData<T>(key: string): T | null {
    if (typeof window === "undefined") return null;

    try {
        const cached = sessionStorage.getItem(key);
        if (!cached) return null;

        const data = JSON.parse(cached);
        const now = Date.now();

        if (now - data.timestamp > CACHE_DURATION) {
            sessionStorage.removeItem(key);
            return null;
        }

        return data.value;
    } catch {
        return null;
    }
}

/**
 * 데이터 캐시하기
 */
function setCachedData<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;

    try {
        const data = {
            value,
            timestamp: Date.now(),
        };
        sessionStorage.setItem(key, JSON.stringify(data));
    } catch {
        // 캐시 실패해도 무시 (기능 동작에 영향 없음)
    }
}

/**
 * 빠른 IP 주소 가져오기 (캐시 우선, 타임아웃 적용, 대체 서비스 지원)
 */
async function getFastUserIP(): Promise<string | null> {
    // 1. 캐시 확인 (즉시 반환)
    const cached = getCachedData<string>(CACHE_KEYS.IP_DATA);
    if (cached) return cached;

    // 대체 서비스 목록 (우선순위 순)
    const ipServices = [
        "https://api.ipify.org?format=json",
        "https://ipapi.co/json/",
        "https://api.ip.sb/ip",
    ];

    for (let i = 0; i < ipServices.length; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(
                () => controller.abort(),
                2000 + i * 1000
            ); // 점진적 타임아웃 증가

            const response = await fetch(ipServices[i], {
                method: "GET",
                headers: { Accept: "application/json" },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                const ip = data.ip || data.query; // 서비스별 응답 형식 대응

                if (ip && isValidIP(ip)) {
                    setCachedData(CACHE_KEYS.IP_DATA, ip);
                    return ip;
                }
            }
        } catch (error) {
            console.warn(
                `[IP_WARN] Failed ${i + 1}th service:`,
                error instanceof Error ? error.message : "Unknown error"
            );
            // 다음 서비스로 계속 진행
        }
    }

    console.error("[IP_ERROR] All IP services failed");
    return null;
}

/**
 * 빠른 지역 정보 가져오기 (비동기, 논블로킹, 대체 서비스 지원)
 */
async function getFastLocationData(ip: string): Promise<{
    country?: string;
    state?: string;
    city?: string;
} | null> {
    // 1. 캐시 확인
    const cached = getCachedData<any>(CACHE_KEYS.LOCATION_DATA);
    if (cached) return cached;

    // 대체 지역 정보 서비스 목록
    const locationServices = [
        {
            url: `https://ipapi.co/${ip}/json/`,
            parser: (data: any) => ({
                country: data.country_name || null,
                state: data.region || null,
                city: data.city || null,
            }),
        },
        {
            url: `https://api.ipgeolocation.io/ipgeo?apiKey=free&ip=${ip}`,
            parser: (data: any) => ({
                country: data.country_name || null,
                state: data.state_prov || null,
                city: data.city || null,
            }),
        },
    ];

    for (let i = 0; i < locationServices.length; i++) {
        try {
            const service = locationServices[i];
            const controller = new AbortController();
            const timeoutId = setTimeout(
                () => controller.abort(),
                2000 + i * 500
            );

            const response = await fetch(service.url, {
                method: "GET",
                headers: { Accept: "application/json" },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                const locationData = service.parser(data);

                if (locationData.country) {
                    setCachedData(CACHE_KEYS.LOCATION_DATA, locationData);
                    return locationData;
                }
            }
        } catch (error) {
            console.warn(
                `[LOCATION_WARN] Failed ${i + 1}th service:`,
                error instanceof Error ? error.message : "Unknown error"
            );
            // 다음 서비스로 계속 진행
        }
    }

    console.error("[LOCATION_ERROR] All location services failed");
    return null;
}

/**
 * 클라이언트사이드에서 전체 정보를 가져오는 함수 (기본 정보는 즉시, 확장 정보는 비동기)
 */
export async function getClientSideUserDetails(): Promise<UserDetailData> {
    // 1. 기본 정보는 즉시 가져오기 (0ms)
    const basicInfo = getBasicUserDetails();

    // 2. IP 정보 가져오기 (캐시되어 있으면 즉시)
    const ip = await getFastUserIP();

    // 3. 지역 정보는 논블로킹으로 가져오기
    let locationData = null;
    if (ip) {
        try {
            locationData = await getFastLocationData(ip);
        } catch {
            // 실패해도 무시 (기본 정보는 이미 있음)
        }
    }

    return {
        ipAddress: ip,
        locale: basicInfo.locale,
        os: basicInfo.os,
        device: basicInfo.device,
        browser: basicInfo.browser,
        country: locationData?.country || null,
        state: locationData?.state || null,
        city: locationData?.city || null,
    };
}

/**
 * Accept-Language 헤더에서 로케일 파싱 (최적화)
 */
function parseLocaleFromAcceptLanguage(acceptLanguage: string): string | null {
    if (!acceptLanguage) return null;

    // 첫 번째 값만 빠르게 추출
    const firstLanguage = acceptLanguage.split(",")[0];
    return firstLanguage?.trim() || null;
}

/**
 * User-Agent에서 운영체제 파싱 (최적화)
 */
function parseOSFromUserAgent(userAgent: string): string | null {
    if (!userAgent) return null;

    // 가장 일반적인 OS부터 빠르게 확인
    if (userAgent.includes("Windows NT 10.0")) return "Windows 10";
    if (userAgent.includes("Mac OS X")) return "macOS";
    if (userAgent.includes("Android")) return "Android";
    if (userAgent.includes("iPhone OS")) return "iOS";
    if (userAgent.includes("iPad")) return "iPadOS";
    if (userAgent.includes("Linux")) return "Linux";
    if (userAgent.includes("Windows NT")) return "Windows";

    return null;
}

/**
 * User-Agent에서 기기 유형 파싱 (최적화)
 */
function parseDeviceFromUserAgent(userAgent: string): string | null {
    if (!userAgent) return null;

    // 빠른 패턴 매칭
    if (userAgent.includes("iPad")) return "Tablet";
    if (
        userAgent.includes("iPhone") ||
        (userAgent.includes("Android") && userAgent.includes("Mobile"))
    )
        return "Mobile";
    if (userAgent.includes("Mobile")) return "Mobile";

    return "Desktop";
}

/**
 * User-Agent에서 브라우저 파싱 (최적화)
 */
function parseBrowserFromUserAgent(userAgent: string): string | null {
    if (!userAgent) return null;

    // 가장 일반적인 브라우저부터 빠르게 확인
    if (userAgent.includes("Edg/")) return "Microsoft Edge";
    if (userAgent.includes("Chrome/")) return "Chrome";
    if (userAgent.includes("Firefox/")) return "Firefox";
    if (userAgent.includes("Safari/")) return "Safari";

    return null;
}

/**
 * IP 주소 유효성 검사 함수 (IPv4 + IPv6 지원)
 */
function isValidIP(ip: string): boolean {
    if (!ip || typeof ip !== "string") return false;

    // 로컬 주소 빠른 확인
    if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") return false;
    if (
        ip.startsWith("127.") ||
        ip.startsWith("192.168.") ||
        ip.startsWith("10.")
    )
        return false;

    // IPv4 패턴 확인
    const ipv4Parts = ip.split(".");
    if (ipv4Parts.length === 4) {
        return ipv4Parts.every((part) => {
            const num = parseInt(part, 10);
            return !isNaN(num) && num >= 0 && num <= 255;
        });
    }

    // IPv6 패턴 확인 (기본적인 검증)
    if (ip.includes(":")) {
        // 기본적인 IPv6 형식 확인
        const ipv6Regex = /^([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}$/;
        const isValidV6 =
            ipv6Regex.test(ip) && ip !== "::" && !ip.startsWith("::1");
        return isValidV6;
    }

    return false;
}

/**
 * Server Actions에서 사용하는 사용자 정보 가져오기 함수
 * headers() 함수를 사용하여 정보 수집 (초고속)
 */
export async function getUserDetailDataForServerAction(): Promise<
    Partial<UserDetailData>
> {
    try {
        const headersList = await headers();

        // Vercel/클라우드 환경에 최적화된 헤더 순서로 확인
        const getIP = (): { ip: string | null; source?: string } => {
            const headerSources = [
                { header: "x-forwarded-for", name: "X-Forwarded-For" },
                { header: "x-real-ip", name: "X-Real-IP" },
                { header: "cf-connecting-ip", name: "CloudFlare" },
                { header: "x-vercel-forwarded-for", name: "Vercel" },
                { header: "x-forwarded-host", name: "X-Forwarded-Host" },
                { header: "forwarded-for", name: "Forwarded-For" },
                { header: "forwarded", name: "Forwarded" },
                { header: "client-ip", name: "Client-IP" },
            ];

            for (const { header, name } of headerSources) {
                const value = headersList.get(header);
                if (value) {
                    const ip = value.split(",")[0].trim();
                    if (isValidIP(ip)) {
                        return { ip, source: name };
                    }
                }
            }
            console.warn("[SERVER_IP_WARN] No valid IP header found");
            return { ip: null };
        };

        const userAgent = headersList.get("user-agent") || "";
        const acceptLanguage = headersList.get("accept-language") || "";

        const ipResult = getIP();
        const result = {
            ipAddress: ipResult.ip,
            locale: parseLocaleFromAcceptLanguage(acceptLanguage),
            os: parseOSFromUserAgent(userAgent),
            device: parseDeviceFromUserAgent(userAgent),
            browser: parseBrowserFromUserAgent(userAgent),
            // 서버에서는 지역 정보 null (속도 우선)
            country: null,
            state: null,
            city: null,
        };

        return result;
    } catch (error) {
        console.error(
            "[SERVER_DETAILS_ERROR] Failed to collect user details in Server Action:",
            error
        );
        return {};
    }
}

/**
 * 통합 사용자 정보 가져오기 함수 (초고속 버전)
 * 기본 정보는 즉시 반환, 확장 정보는 백그라운드에서 처리
 */
export async function getUserDetailData(
    request?: Request
): Promise<UserDetailData> {
    // 서버사이드: 즉시 반환
    if (typeof window === "undefined" && request) {
        const serverData = getServerSideUserDetails(request);
        return {
            ipAddress: serverData.ipAddress || null,
            locale: serverData.locale || null,
            os: serverData.os || null,
            device: serverData.device || null,
            browser: serverData.browser || null,
            country: null, // 서버에서는 null (속도 우선)
            state: null,
            city: null,
        };
    }

    // 클라이언트사이드: 기본 정보 즉시, 확장 정보 비동기
    return await getClientSideUserDetails();
}

/**
 * 기본 정보만 즉시 가져오기 (0ms 응답)
 */
export function getUserDetailDataSync(
    request?: Request
): Partial<UserDetailData> {
    if (typeof window === "undefined" && request) {
        return getServerSideUserDetails(request);
    }

    return getBasicUserDetails();
}

/**
 * 지역 정보를 백그라운드에서 업데이트 (논블로킹)
 */
export function updateLocationDataInBackground(): void {
    if (typeof window === "undefined") return;

    // 백그라운드에서 실행 (UI 블로킹하지 않음)
    setTimeout(async () => {
        try {
            const ip = await getFastUserIP();
            if (ip) {
                await getFastLocationData(ip);
            }
        } catch {
            // 실패해도 무시
        }
    }, 0);
}

/**
 * 데이터 수집 현황 모니터링 (디버깅용)
 */
export function getDataCollectionStatus(): {
    hasCache: boolean;
    cacheAge: number | null;
    isClientSide: boolean;
    support: {
        localStorage: boolean;
        sessionStorage: boolean;
        fetch: boolean;
    };
} {
    const isClientSide = typeof window !== "undefined";

    if (!isClientSide) {
        return {
            hasCache: false,
            cacheAge: null,
            isClientSide: false,
            support: {
                localStorage: false,
                sessionStorage: false,
                fetch: false,
            },
        };
    }

    // 캐시 상태 확인
    let hasCache = false;
    let cacheAge: number | null = null;

    try {
        const cached = sessionStorage.getItem(CACHE_KEYS.IP_DATA);
        if (cached) {
            const data = JSON.parse(cached);
            hasCache = true;
            cacheAge = Date.now() - data.timestamp;
        }
    } catch {}

    return {
        hasCache,
        cacheAge,
        isClientSide,
        support: {
            localStorage: typeof localStorage !== "undefined",
            sessionStorage: typeof sessionStorage !== "undefined",
            fetch: typeof fetch !== "undefined",
        },
    };
}

/**
 * 현재 환경에서 IP 감지 가능성 테스트 (디버깅용)
 */
export function testIPDetectionCapability(): Promise<{
    success: boolean;
    method: "server" | "client";
    source?: string;
    error?: string;
}> {
    return new Promise(async (resolve) => {
        // 서버사이드 테스트
        if (typeof window === "undefined") {
            try {
                const headersList = await headers();
                const headerSources = [
                    "x-forwarded-for",
                    "x-real-ip",
                    "cf-connecting-ip",
                    "x-vercel-forwarded-for",
                ];

                for (const header of headerSources) {
                    const value = headersList.get(header);
                    if (value) {
                        const ip = value.split(",")[0].trim();
                        if (isValidIP(ip)) {
                            resolve({
                                success: true,
                                method: "server",
                                source: header,
                            });
                            return;
                        }
                    }
                }

                resolve({
                    success: false,
                    method: "server",
                    error: "No valid IP headers found",
                });
            } catch (error) {
                resolve({
                    success: false,
                    method: "server",
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                });
            }
            return;
        }

        // 클라이언트사이드 테스트
        try {
            const ip = await getFastUserIP();
            resolve({
                success: !!ip,
                method: "client",
                source: ip ? "external-api" : undefined,
                error: ip ? undefined : "All external services failed",
            });
        } catch (error) {
            resolve({
                success: false,
                method: "client",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });
}
