/// app\auth\settings.ts

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import TwitterProvider from "next-auth/providers/twitter";
import KakaoProvider from "next-auth/providers/kakao";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma/client";
import { env } from "@/lib/config/env";
import { createSolanaWallet } from "@/lib/solana/createWallet";

export const { handlers, auth, signIn, signOut} = NextAuth({
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

        async signIn({ user, account }) {
            const now = new Date();
            const existingUser = await prisma.user.findUnique({
                where: { email: user.email as string },
            });

            if (!existingUser) {
                await prisma.user.create({
                    data: {
                        email: user.email,
                        name: user.name,
                        image: user.image,
                        role: "USER",
                        active: true,
                        providerId: account?.id as string || "",
                        createdAt: now,
                        lastLoginAt: now,
                    },
                });

                console.info("[User][Create] ", user.email);
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
})