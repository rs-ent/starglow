/// app/actions/user.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import { Prisma, Player, User } from "@prisma/client";
import { setPlayer, invitePlayer } from "./player";
import { createPolygonWallet } from "./defaultWallets";
import { cookies } from "next/headers";
import crypto from "crypto";

export interface GetUsersInput {
    ids?: string[];
    active?: boolean;
    role?: string;
    names?: string[];
    providers?: string[];
    telegramIds?: string[];
    emails?: string[];
}

export async function getUsers(input?: GetUsersInput): Promise<User[]> {
    if (!input) {
        const users = await prisma.user.findMany();
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
            createPolygonWallet(user.id),
        ]);

        if (!player || !wallet) {
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

        if (input.withoutSessionRefresh) {
            return { user, player };
        }

        const sessionToken = crypto.randomUUID();
        const expires = new Date();
        expires.setDate(expires.getDate() + 30);

        await prisma.session.create({
            data: {
                sessionToken,
                userId: user.id,
                expires,
            },
        });

        (await cookies()).set("next-auth.session-token", sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            expires,
            path: "/",
            sameSite: "lax",
        });

        return { user, player };
    } catch (error) {
        console.error("Failed to set user with telegram", error);
        throw error;
    }
}
