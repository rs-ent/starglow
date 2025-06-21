// app/auth/authSettings.ts

import crypto from "crypto";

import { PrismaAdapter } from "@auth/prisma-adapter";
import { Player } from "@prisma/client";
import NextAuth from "next-auth";
import Coinbase from "next-auth/providers/coinbase";
import Discord from "next-auth/providers/discord";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import Resend from "next-auth/providers/resend";
import Spotify from "next-auth/providers/spotify";
import Twitter from "next-auth/providers/twitter";

import { prisma } from "@/lib/prisma/client";

import { sendVerificationRequest } from "./authSendRequest";
import { getPlayerByUserId, setPlayer } from "../actions/player";
import { fetchAuthorMetricsFromX } from "../actions/x/actions";
import { createWallet } from "../story/userWallet/actions";

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
            maxAge: 24 * 60 * 60, // 24 hours
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
                session.player = await getPlayerByUserId(session.user.id);
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
                    if (
                        account?.provider === "twitter" &&
                        account.providerAccountId
                    ) {
                        tweetAuthorId = account.providerAccountId;

                        await fetchAuthorMetricsFromX({
                            authorId: account.providerAccountId,
                        }).catch((error) => {
                            console.error(
                                "Failed to fetch Twitter metrics:",
                                error
                            );
                        });
                    }

                    const promises = [
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

                    const results = await Promise.allSettled(promises);

                    results.forEach((result, index) => {
                        if (result.status === "rejected") {
                            const operations = [
                                "user update",
                                "player setup",
                                "wallet creation",
                            ];
                            console.error(
                                `SignIn ${operations[index]} failed:`,
                                result.reason
                            );
                        }
                    });
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
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
