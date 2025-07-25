/// app/actions/user.ts

"use server";

import { prisma } from "@/lib/prisma/client";

import { setPlayer, invitePlayer } from "./player";
import { createWallet } from "../story/userWallet/actions";
import { getCacheStrategy } from "@/lib/prisma/cacheStrategies";

import type { Prisma, Player, User } from "@prisma/client";
import type { ProviderType } from "../types/auth";

export interface GetUsersInput {
    ids?: string[];
    active?: boolean;
    role?: string;
    names?: string[];
    providers?: string[];
    telegramIds?: string[];
    emails?: string[];
}

export type UserWithPlayer = User & { player: Player | null };

export async function getUsers(
    input?: GetUsersInput
): Promise<UserWithPlayer[]> {
    if (!input) {
        const users = await prisma.user.findMany({
            cacheStrategy: getCacheStrategy("tenMinutes"),
            include: {
                player: true,
            },
        });
        return users;
    }

    try {
        const where: Prisma.UserWhereInput = {};

        if (input.ids) {
            where.id = { in: input.ids };
        }

        if (input.active) {
            where.active = input.active;
        }

        if (input.role) {
            where.role = input.role;
        }

        if (input.names) {
            where.name = { in: input.names };
        }

        if (input.providers) {
            where.provider = { in: input.providers };
        }

        if (input.telegramIds) {
            where.telegramId = { in: input.telegramIds };
        }

        if (input.emails) {
            where.email = { in: input.emails };
        }

        const users = await prisma.user.findMany({
            cacheStrategy: getCacheStrategy("oneDay"),
            where,
            include: {
                player: true,
            },
        });
        return users;
    } catch (error) {
        console.error("Failed to get users", error);
        return [];
    }
}

export interface GetUserByEmailInput {
    email: string;
}

export async function getUserByEmail(
    input?: GetUserByEmailInput
): Promise<User | null> {
    try {
        if (!input) {
            return null;
        }

        const user = await prisma.user.findUnique({
            cacheStrategy: getCacheStrategy("tenMinutes"),
            where: { email: input.email },
        });
        return user;
    } catch (error) {
        console.error("Failed to get user by email", error);
        throw error;
    }
}

export interface setUserWithTelegramInput {
    user?: {
        id: number;
        first_name: string;
        last_name?: string;
        username?: string;
        language_code?: string;
        is_premium?: boolean;
        photo_url?: string;
    };
    referrerCode?: string;
    withoutSessionRefresh?: boolean;
}

export async function setUserWithTelegram(
    input: setUserWithTelegramInput
): Promise<{ user: User; player: Player }> {
    try {
        if (!input || !input.user) {
            throw new Error("Invalid input");
        }

        const telegramId = input.user.id.toString();

        let user = await prisma.user.findUnique({
            cacheStrategy: getCacheStrategy("oneDay"),
            where: {
                telegramId,
            },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    telegramId,
                    name: input.user.username || input.user.first_name,
                    image: input.user.photo_url,
                    lastLoginAt: new Date(),
                    provider: "telegram",
                },
            });
        } else {
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    lastLoginAt: new Date(),
                },
            });
        }

        const [player, wallet] = await Promise.all([
            setPlayer({ user }),
            createWallet(user.id, "telegram"),
        ]);

        if (!player.player || !wallet) {
            throw new Error("Failed to create player or wallet");
        }

        if (input.referrerCode) {
            await invitePlayer({
                referredUser: user,
                referrerCode: input.referrerCode,
                method: "telegram",
                telegramId,
            });
        }

        return { user, player: player.player };
    } catch (error) {
        console.error("Failed to set user with telegram", error);
        throw error;
    }
}

export interface setUserWithWalletInput {
    walletAddress: string;
    provider: string;
    referrerCode?: string;
}

export async function setUserWithWallet(
    input: setUserWithWalletInput
): Promise<{ user: User; player: Player }> {
    try {
        if (!input || !input.walletAddress) {
            throw new Error("Invalid input");
        }

        const result = await prisma.$transaction(async (tx) => {
            const existingWallet = await tx.wallet.findUnique({
                where: {
                    address: input.walletAddress,
                },
                select: {
                    userId: true,
                    user: true,
                    provider: true,
                },
            });

            let user = existingWallet?.user || null;

            if (user) {
                user = await tx.user.update({
                    where: { id: user.id },
                    data: {
                        lastLoginAt: new Date(),
                    },
                });

                if (
                    existingWallet &&
                    existingWallet.provider !== input.provider
                ) {
                    await tx.wallet.update({
                        where: {
                            address: input.walletAddress,
                        },
                        data: {
                            provider: input.provider,
                            lastAccessedAt: new Date(),
                        },
                    });
                }
            } else {
                user = await tx.user.create({
                    data: {
                        name: input.walletAddress,
                        lastLoginAt: new Date(),
                        provider: input.provider,
                    },
                });
            }

            return user;
        });

        const [player] = await Promise.all([setPlayer({ user: result })]);

        if (!player.player) {
            throw new Error("Failed to create player");
        }

        if (input.referrerCode) {
            await invitePlayer({
                referredUser: result,
                referrerCode: input.referrerCode,
                method: "webapp",
            });
        }

        return { user: result, player: player.player };
    } catch (error) {
        console.error("Failed to set user with wallet", error);
        throw error;
    }
}

export interface getUserProviderInput {
    userId: string;
}

export interface getUserProviderOutput {
    provider: ProviderType | null;
    walletProvider: ProviderType | null;
}

export async function getUserProvider(
    input?: getUserProviderInput
): Promise<getUserProviderOutput> {
    if (!input) {
        return {
            provider: null,
            walletProvider: null,
        };
    }

    const user = await prisma.user.findUnique({
        cacheStrategy: getCacheStrategy("oneDay"),
        where: { id: input.userId },
        select: {
            provider: true,
            wallets: {
                where: {
                    default: true,
                },
                select: {
                    provider: true,
                },
            },
        },
    });

    return {
        provider: user?.provider as ProviderType | null,
        walletProvider: user?.wallets[0]?.provider as ProviderType | null,
    };
}
