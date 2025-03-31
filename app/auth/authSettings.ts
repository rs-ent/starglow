/// app\auth\authSettings.ts

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import TwitterProvider from "next-auth/providers/twitter";
import KakaoProvider from "next-auth/providers/kakao";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma/client";
import { env } from "@/lib/config/env";
import { createSolanaWallet } from "@/lib/solana/createWallet";

export const { handlers, auth, signIn, signOut } = NextAuth({
    secret: env.NEXTAUTH_SECRET,
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID!,
            clientSecret: env.GOOGLE_CLIENT_SECRET!,
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
    session: { strategy: "database" },
    callbacks: {
        async redirect({ url, baseUrl }) {
            return url.startsWith(baseUrl) ? url : baseUrl;
        },

        async signIn({ user }) {
            const existingPlayer = await prisma.player.findUnique({
                where: { userId: user.id },
            });

            if (!existingPlayer) {
                if (!user.id) {
                    throw new Error("User ID is undefined");
                }

                await prisma.player.create({
                    data: {
                        userId: user.id,
                        createdAt: new Date(),
                    },
                });

                console.info("[Player][Create] User:", user.email);
            } else {
                console.info("[Player][Exists] User:", user.email);
            }

            return true;
        },

        async session({ session, user }) {
            session.user.id = user.id;

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

            return session;
        },
    },

    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
    },
});
