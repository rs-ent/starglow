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
    {
        hostnames: ["intro.starglow.io"],
        destination: "https://starglow.io/introduction/s",
    },
];

const PERFORMANCE_THRESHOLD = 1000;

export async function middleware(request: NextRequest) {
    const start = Date.now();

    const bypassParam = request.nextUrl.searchParams.get("bypass");
    if (MAINTENANCE_MODE && bypassParam === MAINTENANCE_BYPASS_SECRET) {
        const url = new URL(request.url);
        url.searchParams.delete("bypass");

        const response = NextResponse.redirect(url);
        response.cookies.set("maintenance-bypass", MAINTENANCE_BYPASS_SECRET, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24,
        });
        return response;
    }

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
    if (request.nextUrl.pathname === "/maintenance") {
        return false;
    }

    if (request.nextUrl.pathname.startsWith("/admin")) {
        return false;
    }

    if (request.nextUrl.pathname.startsWith("/api")) {
        return false;
    }

    if (
        request.nextUrl.pathname.match(
            /\.(ico|png|jpg|jpeg|gif|svg|js|css|woff|woff2|ttf|eot)$/
        )
    ) {
        return false;
    }

    const clientIP =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";

    if (MAINTENANCE_BYPASS_IPS.includes(clientIP)) {
        return false;
    }

    const bypassCookie = request.cookies.get("maintenance-bypass");
    if (bypassCookie && bypassCookie.value === MAINTENANCE_BYPASS_SECRET) {
        return false;
    }

    const bypassParam = request.nextUrl.searchParams.get("bypass");

    if (MAINTENANCE_BYPASS_SECRET && bypassParam) {

        if (bypassParam === MAINTENANCE_BYPASS_SECRET) {
            return false;
        }
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
