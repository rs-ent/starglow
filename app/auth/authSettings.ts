// app/auth/authSettings.ts

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import TwitterProvider from "next-auth/providers/twitter";
import KakaoProvider from "next-auth/providers/kakao";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma/client";
import { env } from "@/lib/config/env";
import { createSolanaWallet } from "@/lib/solana/createWallet";

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

export const { handlers, auth, signIn, signOut } = NextAuth({
    secret: env.NEXTAUTH_SECRET,
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
        strategy: "database",
        maxAge: 30 * 24 * 60 * 60,
        updateAge: 3 * 24 * 60 * 60,
    },
    cookies: {
        sessionToken: {
            name: "next-auth.session-token",
            options: cookieOptions,
        },
        callbackUrl: { name: "next-auth.callback-url", options: cookieOptions },
        csrfToken: { name: "next-auth.csrf-token", options: cookieOptions },
        pkceCodeVerifier: {
            name: "next-auth.pkce.code_verifier",
            options: cookieOptions,
        },
    },
    callbacks: {
        async redirect({ url, baseUrl }) {
            if (url.startsWith("/")) return isProd ? `${baseUrl}${url}` : url;
            return baseUrl;
        },

        async signIn() {
            return true;
        },

        async session({ session, user }) {
            if (!user?.id) {
                console.error("[Session] User ID not found");
                return session;
            }

            session.user.id = user.id;

            try {
                const player = await prisma.player.upsert({
                    where: { userId: user.id },
                    create: { userId: user.id, createdAt: new Date() },
                    update: {},
                });

                const wallet = await prisma.wallet.findFirst({
                    where: { userId: user.id, network: "solana" },
                });

                if (!wallet) {
                    const { publicKey, privateKey } = createSolanaWallet();
                    await prisma.wallet.create({
                        data: {
                            userId: user.id,
                            network: "solana",
                            address: publicKey,
                            privateKey,
                            default: true,
                            primary: 0,
                            createdAt: new Date(),
                        },
                    });
                    console.info("[Wallet][Created]", publicKey);
                } else {
                    console.info("[Wallet][Exists]", wallet.address);
                }
            } catch (error) {
                console.error("[Session][Error]", error);
            }

            return session;
        },
    },
    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
    },
    debug: !isProd,
    trustHost: true,
    useSecureCookies: isProd,
});
