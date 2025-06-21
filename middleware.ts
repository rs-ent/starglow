/// middleware.ts
import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

interface RedirectRule {
    hostnames: string[];
    destination: string;
}

const redirects: RedirectRule[] = [
    {
        hostnames: ["docs.starglow.io"],
        destination: "https://starglow.io/docs",
    },
    {
        hostnames: ["miniapp.starglow.io", "mapp.starglow.io"],
        destination: "https://starglow.io/start",
    },
];

const PERFORMANCE_THRESHOLD = 1000;

export async function middleware(request: NextRequest) {
    const start = Date.now();

    const hostname = request.headers.get("host") || request.nextUrl.hostname;
    const hostnameRedirect = redirects.find(({ hostnames }) =>
        hostnames.includes(hostname)
    );

    if (hostnameRedirect) {
        return NextResponse.redirect(hostnameRedirect.destination, 301);
    }

    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store, must-revalidate");

    const duration = Date.now() - start;
    if (duration > PERFORMANCE_THRESHOLD) {
        console.warn(`[SLOW] ${request.url} took ${duration}ms`);
    }
    return response;
}

export const config = {
    matcher: [
        "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
        "/api/actions/:path*",
    ],
};
