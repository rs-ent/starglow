/// middleware.ts
import { NextResponse, type NextRequest } from "next/server";

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

export async function middleware(req: NextRequest) {
    const hostnameRedirect = redirects.find(({ hostnames }) =>
        hostnames.includes(req.nextUrl.hostname),
    );

    if (hostnameRedirect) {
        return NextResponse.redirect(hostnameRedirect.destination, 301);
    }

    return NextResponse.next();
};

export const config = {
    matcher: [
        "/:path*",
    ],
};