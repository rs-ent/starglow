// app/auth/authSettings.ts

import crypto from "crypto";

import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Coinbase from "next-auth/providers/coinbase";
import Credentials from "next-auth/providers/credentials";
import Discord from "next-auth/providers/discord";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import Resend from "next-auth/providers/resend";
import Spotify from "next-auth/providers/spotify";
import Twitter from "next-auth/providers/twitter";

import { prisma } from "@/lib/prisma/client";

import { sendVerificationRequest } from "./authSendRequest";
import { getPlayerByUserIdForSession, setPlayer } from "../actions/player";
import { fetchAuthorMetricsFromX } from "../actions/x/actions";
import { createWallet } from "../story/userWallet/actions";
import { setUserWithWallet, setUserWithTelegram } from "../actions/user";

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

const getAuthSecret = () => {
    return (
        process.env.AUTH_SECRET ||
        process.env.NEXTAUTH_SECRET ||
        (isProd ? undefined : "dev-secret-key-for-local-development")
    );
};

if (!getAuthSecret()) {
    throw new Error(
        "AUTH_SECRET or NEXTAUTH_SECRET environment variable is required"
    );
}

const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    domain: getCookieDomain(),
    secure: isProd,
};

const authOptions: NextAuthConfig = {
    adapter: PrismaAdapter(prisma),
    secret: getAuthSecret(),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),
        Twitter({
            clientId: process.env.TWITTER_CLIENT_ID!,
            clientSecret: process.env.TWITTER_CLIENT_SECRET!,
        }),
        Discord({
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
        }),
        Kakao({
            clientId: process.env.KAKAO_CLIENT_ID!,
            clientSecret: process.env.KAKAO_CLIENT_SECRET!,
        }),
        Spotify({
            clientId: process.env.SPOTIFY_CLIENT_ID!,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
        }),
        Coinbase({
            clientId: process.env.COINBASE_CLIENT_ID!,
            clientSecret: process.env.COINBASE_CLIENT_SECRET!,
        }),
        Resend({
            from: "no-reply@starglow.io",
            apiKey: process.env.RESEND_API!,
            maxAge: 24 * 60 * 60,
            async generateVerificationToken() {
                return crypto.randomUUID();
            },
            sendVerificationRequest: async (params) => {
                try {
                    await sendVerificationRequest(params);
                } catch (error) {
                    console.error("Failed to send verification email:", error);
                    throw new Error("Failed to send verification email");
                }
            },
        }),
        Credentials({
            id: "wallet",
            name: "Wallet",
            credentials: {
                walletAddress: {},
                provider: {},
            },
            async authorize(credentials) {
                if (!credentials?.walletAddress || !credentials?.provider) {
                    return null;
                }

                try {
                    const result = await setUserWithWallet({
                        walletAddress: credentials.walletAddress as string,
                        provider: credentials.provider as string,
                    });

                    return {
                        id: result.user.id,
                        name: result.user.name || result.user.id,
                        email: result.user.email,
                        image: result.user.image,
                    };
                } catch (error) {
                    console.error("Wallet authorization failed:", error);
                    return null;
                }
            },
        }),
        Credentials({
            id: "telegram",
            name: "Telegram",
            credentials: {
                telegramId: {},
                firstName: {},
                lastName: {},
                username: {},
                photoUrl: {},
                languageCode: {},
                isPremium: {},
                referrerCode: {},
            },
            async authorize(credentials) {
                if (!credentials?.telegramId || !credentials?.firstName) {
                    return null;
                }

                try {
                    const telegramUser = {
                        id: parseInt(credentials.telegramId as string),
                        first_name: credentials.firstName as string,
                        last_name: credentials.lastName as string,
                        username: credentials.username as string,
                        language_code: credentials.languageCode as string,
                        is_premium: credentials.isPremium === "true",
                        photo_url: credentials.photoUrl as string,
                    };

                    const result = await setUserWithTelegram({
                        user: telegramUser,
                        referrerCode: credentials.referrerCode as string,
                        withoutSessionRefresh: true,
                    });

                    return {
                        id: result.user.id,
                        name: result.user.name || result.user.id,
                        email: result.user.email,
                        image: result.user.image,
                    };
                } catch (error) {
                    console.error("Telegram authorization failed:", error);
                    return null;
                }
            },
        }),
    ],
    session: {
        strategy: "jwt" as const,
        maxAge: 7 * 24 * 60 * 60,
        updateAge: 24 * 60 * 60,
        generateSessionToken: () => crypto.randomUUID(),
    },
    jwt: {
        maxAge: 7 * 24 * 60 * 60,
    },
    cookies: {
        sessionToken: {
            name: isProd
                ? "__Secure-next-auth.session-token"
                : "next-auth.session-token",
            options: {
                ...cookieOptions,
                secure: isProd,
            },
        },
        callbackUrl: {
            name: isProd
                ? "__Secure-next-auth.callback-url"
                : "next-auth.callback-url",
            options: {
                ...cookieOptions,
                secure: isProd,
            },
        },
        csrfToken: {
            name: isProd
                ? "__Secure-next-auth.csrf-token"
                : "next-auth.csrf-token",
            options: {
                ...cookieOptions,
                secure: isProd,
            },
        },
        pkceCodeVerifier: {
            name: isProd
                ? "__Secure-next-auth.pkce.code_verifier"
                : "next-auth.pkce.code_verifier",
            options: {
                ...cookieOptions,
                secure: isProd,
            },
        },
    },
    callbacks: {
        async jwt({
            token,
            user,
            trigger,
        }: {
            token: any;
            user?: any;
            trigger?: any;
        }) {
            if (user) {
                token.id = user.id;

                try {
                    const player = await getPlayerByUserIdForSession(user.id);
                    if (player) {
                        token.player = player;
                    }
                } catch (error) {
                    console.error(
                        "Failed to get player in JWT callback:",
                        error
                    );
                }
            }

            if (trigger === "update" && token.id) {
                try {
                    const player = await getPlayerByUserIdForSession(token.id);
                    if (player) {
                        token.player = player;
                    }
                } catch (error) {
                    console.error(
                        "Failed to update player in JWT callback:",
                        error
                    );
                }
            }

            return token;
        },
        async session({ session, token }: { session: any; token: any }) {
            if (token) {
                session.user.id = token.id;
                session.player = token.player;
            }
            return session;
        },
        async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            else if (new URL(url).origin === baseUrl) return url;
            return baseUrl;
        },
    },
    events: {
        async signIn({ user, account, profile }) {
            try {
                if (user.id) {
                    const updateData: any = { lastLoginAt: new Date() };

                    if (user.email === null && profile?.email) {
                        updateData.email = profile.email;
                    }

                    if (account?.provider) {
                        updateData.provider = account.provider;
                    }

                    let tweetAuthorId: string | undefined;
                    const backgroundTasks: Promise<any>[] = [];

                    if (
                        account?.provider === "twitter" &&
                        account.providerAccountId
                    ) {
                        tweetAuthorId = account.providerAccountId;

                        backgroundTasks.push(
                            fetchAuthorMetricsFromX({
                                authorId: account.providerAccountId,
                            }).catch((error) => {
                                console.error(
                                    "Failed to fetch Twitter metrics:",
                                    error
                                );
                                return null;
                            })
                        );
                    }

                    const corePromises = [
                        prisma.user
                            .update({
                                where: { id: user.id },
                                data: updateData,
                            })
                            .catch((error) => {
                                console.error("Failed to update user:", error);
                                return null;
                            }),

                        setPlayer({
                            user: user,
                            tweetAuthorId: tweetAuthorId,
                        }).catch((error) => {
                            console.error("Failed to set player:", error);
                            return null;
                        }),

                        createWallet(user.id).catch((error) => {
                            console.error("Failed to create wallet:", error);
                            return null;
                        }),
                    ];

                    await Promise.allSettled(corePromises);

                    if (backgroundTasks.length > 0) {
                        Promise.allSettled(backgroundTasks).catch(() => {});
                    }
                }
            } catch (error) {
                console.error("Error in signIn callback:", error);
            }
        },
    },
    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
    },
    debug: false,
    trustHost: true,
    useSecureCookies: isProd,
    experimental: {
        enableWebAuthn: false,
    },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
