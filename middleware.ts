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

export async function middleware(request: NextRequest) {
    const hostname = request.headers.get("host") || request.nextUrl.hostname;
    const hostnameRedirect = redirects.find(({ hostnames }) =>
        hostnames.includes(hostname)
    );

    if (hostnameRedirect) {
        return NextResponse.redirect(hostnameRedirect.destination, 301);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
