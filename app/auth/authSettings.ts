// app/auth/authSettings.ts

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import TwitterProvider from "next-auth/providers/twitter";
import KakaoProvider from "next-auth/providers/kakao";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma/client";
import { env } from "@/lib/config/env";
import type { NextAuthConfig } from "next-auth";

const isProd = process.env.NODE_ENV === "production";
const isVercelPreview = process.env.VERCEL_ENV === "preview";

const getCookieDomain = () => {
    if (!isProd || isVercelPreview) return undefined;
    if (process.env.VERCEL_URL) {
        const domain = process.env.VERCEL_URL.replace(/^https?:\/\//, "").split(
            ":"
        )[0];
        return domain.endsWith("vercel.app") ? undefined : `.${domain}`;
    }
    return ".starglow.io";
};

const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    domain: getCookieDomain(),
    secure: isProd,
};

const authOptions: NextAuthConfig = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID!,
            clientSecret: env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),
        TwitterProvider({
            clientId: env.TWITTER_CLIENT_ID!,
            clientSecret: env.TWITTER_CLIENT_SECRET!,
        }),
        KakaoProvider({
            clientId: env.KAKAO_CLIENT_ID!,
            clientSecret: env.KAKAO_CLIENT_SECRET!,
        }),
    ],
    session: {
        strategy: "database" as const,
        maxAge: 7 * 24 * 60 * 60, // 7 days
        updateAge: 24 * 60 * 60, // 24 hours
    },
    cookies: {
        sessionToken: {
            name: "next-auth.session-token",
            options: cookieOptions,
        },
        callbackUrl: {
            name: "next-auth.callback-url",
            options: cookieOptions,
        },
        csrfToken: {
            name: "next-auth.csrf-token",
            options: cookieOptions,
        },
        pkceCodeVerifier: {
            name: "next-auth.pkce.code_verifier",
            options: cookieOptions,
        },
    },
    callbacks: {
        async session({ session, user }: { session: any; user: any }) {
            if (session.user) {
                session.user.id = user.id;
            }
            return session;
        },
        async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            else if (new URL(url).origin === baseUrl) return url;
            return baseUrl;
        },
    },
    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
    },
    debug: false,
    trustHost: true,
    useSecureCookies: isProd,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
