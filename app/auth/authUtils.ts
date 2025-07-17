import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma/client";

import { auth } from "./authSettings";

import type { User } from "next-auth";

export async function requireAuth() {
    const session = await auth();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }
    return session;
}

export async function getAuthUserAndPlayer() {
    const session = await auth();
    return { user: session?.user, player: session?.player };
}

export async function getAuthUserId() {
    try {
        const session = await auth();
        return session?.user?.id || null;
    } catch (error) {
        console.error("Failed to get auth user id:", error);
        return null;
    }
}

export async function isAuthenticated() {
    const session = await auth();
    return !!session?.user;
}

export async function requireAuthUser(callbackUrl: string): Promise<User> {
    const session = await auth();

    if (!session?.user) {
        const encodedCallback = encodeURIComponent(callbackUrl);
        redirect(`/auth/signin?callbackUrl=${encodedCallback}`);
    }

    return session.user;
}

export async function requireAuthUserAndPlayer(redirectTo: string = "/") {
    const session = await auth();

    if (!session?.user || !session?.player) {
        const encodedCallback = encodeURIComponent(redirectTo);
        redirect(`/auth/signin?callbackUrl=${encodedCallback}`);
    }

    return {
        user: session.user,
        player: session.player,
    };
}

export async function requireAdmin() {
    if (process.env.NODE_ENV === "development") {
        return {
            success: true,
            user: { id: "1", role: "admin" },
        };
    }

    const sessionUser = await requireAuthUser("/admin");
    const user = await prisma.user.findUnique({
        where: {
            id: sessionUser.id,
        },
        select: {
            role: true,
        },
    });

    if (!user) {
        return {
            success: false,
            error: "User not found",
        };
    }

    if (
        user.role !== "admin" &&
        user.role !== "superadmin" &&
        user.role !== "administrator"
    ) {
        return {
            success: false,
            error: "Unauthorized",
        };
    }

    return {
        success: true,
        user: user,
    };
}
