/// app\auth\authSettings.ts

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import TwitterProvider from "next-auth/providers/twitter";
import KakaoProvider from "next-auth/providers/kakao";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma/client";
import { env } from "@/lib/config/env";
import { createSolanaWallet } from "@/lib/solana/createWallet";

// Helper function to determine the cookie domain
function getCookieDomain() {
    // In development, explicitly set to undefined to allow all subdomains to work
    if (process.env.NODE_ENV !== "production") {
        return undefined;
    }

    // For Vercel preview deployments
    if (process.env.VERCEL_URL?.includes("vercel.app")) {
        return ".vercel.app";
    }

    // For production starglow.io
    return ".starglow.io";
}

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
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    cookies: {
        sessionToken: {
            name: `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                domain: getCookieDomain(),
                secure: process.env.NODE_ENV === "production",
            },
        },
        callbackUrl: {
            name: `next-auth.callback-url`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                domain: getCookieDomain(),
                secure: process.env.NODE_ENV === "production",
            },
        },
        csrfToken: {
            name: `next-auth.csrf-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                domain: getCookieDomain(),
                secure: process.env.NODE_ENV === "production",
            },
        },
        pkceCodeVerifier: {
            name: "next-auth.pkce.code_verifier",
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                domain: getCookieDomain(),
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
    callbacks: {
        async redirect({ url, baseUrl }) {
            // Allow both internal and cross-domain redirects
            if (url.startsWith("/")) {
                // Handles relative URLs
                return `${baseUrl}${url}`;
            } else if (
                url.includes("starglow.io") ||
                url.includes("localhost") ||
                url.includes("vercel.app")
            ) {
                // Allow redirects to trusted domains
                return url;
            }
            // Default to base URL
            return baseUrl;
        },

        async signIn({ user, account }) {
            return true;
        },

        async session({ session, user }) {
            if (!user || !user.id) {
                console.error("[Session] User ID not found");
                return session;
            }

            session.user.id = user.id;

            try {
                const existingPlayer = await prisma.player.findUnique({
                    where: { userId: user.id },
                });

                if (!existingPlayer) {
                    console.log("[Player][Create] User ID:", user.id);
                    await prisma.player.create({
                        data: {
                            userId: user.id,
                            createdAt: new Date(),
                        },
                    });
                    console.info("[Player][Create] User ID:", session.user.id);
                }

                const existingWallet = await prisma.wallet.findFirst({
                    where: {
                        userId: user.id,
                        network: "solana",
                    },
                });

                if (!existingWallet) {
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

                    console.info("[Wallet][Create] ", publicKey);
                } else {
                    console.info("[Wallet][Exists] ", existingWallet.address);
                }
            } catch (error) {
                console.error("[Session][Error] ", error);
            }

            return session;
        },
    },

    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
    },
});
