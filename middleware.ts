/// middleware.ts
import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

interface RedirectRule {
    hostnames: string[];
    destination: string;
}

// 점검 모드 관련 설정
const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === "true";
const MAINTENANCE_BYPASS_IPS =
    process.env.MAINTENANCE_BYPASS_IPS?.split(",") || [];
const MAINTENANCE_BYPASS_SECRET = process.env.MAINTENANCE_BYPASS_SECRET;

const redirects: RedirectRule[] = [
    {
        hostnames: ["docs.starglow.io"],
        destination: "https://starglow.io/docs",
    },
    {
        hostnames: ["miniapp.starglow.io", "mapp.starglow.io"],
        destination: "https://starglow.io/start",
    },
    {
        hostnames: ["introduction.starglow.io", "tutorial.starglow.io"],
        destination: "https://starglow.io/introduction",
    },
];

const PERFORMANCE_THRESHOLD = 1000;

export async function middleware(request: NextRequest) {
    const start = Date.now();

    // 점검 모드 체크 (가장 먼저 처리)
    if (MAINTENANCE_MODE && shouldShowMaintenancePage(request)) {
        return NextResponse.redirect(new URL("/maintenance", request.url));
    }

    const hostname = request.headers.get("host") || request.nextUrl.hostname;
    const hostnameRedirect = redirects.find(({ hostnames }) =>
        hostnames.includes(hostname)
    );

    if (hostnameRedirect) {
        return NextResponse.redirect(hostnameRedirect.destination, 301);
    }

    if (request.nextUrl.pathname === "/user") {
        return NextResponse.redirect(new URL("/user/rewards", request.url));
    }

    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store, must-revalidate");

    const duration = Date.now() - start;
    if (duration > PERFORMANCE_THRESHOLD) {
        console.warn(`[SLOW] ${request.url} took ${duration}ms`);
    }
    return response;
}

function shouldShowMaintenancePage(request: NextRequest): boolean {
    // 점검 페이지 자체는 제외
    if (request.nextUrl.pathname === "/maintenance") {
        return false;
    }

    // 관리자 페이지는 항상 접근 가능
    if (request.nextUrl.pathname.startsWith("/admin")) {
        return false;
    }

    // API 라우트는 제외 (필요시 조정)
    if (request.nextUrl.pathname.startsWith("/api")) {
        return false;
    }

    // 정적 파일들은 제외
    if (request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|js|css|woff|woff2|ttf|eot)$/)) {
        return false;
    }

    // 바이패스 시크릿 쿼리 파라미터 체크
    if (MAINTENANCE_BYPASS_SECRET && request.nextUrl.searchParams.get("bypass") === MAINTENANCE_BYPASS_SECRET) {
        return false;
    }

    // IP 바이패스 체크
    const clientIP = request.headers.get("x-forwarded-for") || 
                    request.headers.get("x-real-ip") || 
                    request.ip;
    
    if (clientIP && MAINTENANCE_BYPASS_IPS.includes(clientIP)) {
        return false;
    }

    return true;
}

export const config = {
    matcher: [
        "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
        "/api/actions/:path*",
        "/user",
    ],
};
