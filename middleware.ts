/// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma/client";
import { env } from "@/lib/config/env";

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
    const token = await getToken({
        req: request,
        secret: env.NEXTAUTH_SECRET,
    });
    const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

    if (isAdminRoute) {
        if (!token) {
            const loginUrl = new URL("/auth/signin", request.url);
            loginUrl.searchParams.set("callbackUrl", request.url);
            return NextResponse.redirect(loginUrl);
        }

        const user = await prisma.user.findUnique({
            where: { id: token.sub },
        });

        if (!user || user.role !== "admin") {
            return new NextResponse("Unauthorized", { status: 403 });
        }
    }

    const hostnameRedirect = redirects.find(({ hostnames }) =>
        hostnames.includes(request.nextUrl.hostname)
    );

    if (hostnameRedirect) {
        return NextResponse.redirect(hostnameRedirect.destination, 301);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/:path*", "/admin/:path*"],
};
