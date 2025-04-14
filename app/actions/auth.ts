"use server";

import { redirect } from "next/navigation";
import type { User } from "next-auth";
import { auth } from "@/app/auth/authSettings";

export async function getUserId() {
    const session = await auth();
    return session?.user?.id || null;
}

export async function requireAuth() {
    const session = await auth();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }
    return session;
}

export async function getAuthUserId() {
    try {
        const session = await auth();
        return session?.user?.id || null;
    } catch (error) {
        return null;
    }
}

export async function isAuthenticated() {
    const session = await auth();
    return !!session?.user;
}

export async function requireAuthUser(callbackUrl: string): Promise<User> {
    try {
        const session = await auth();
        if (!session?.user) {
            const encodedCallback = encodeURIComponent(callbackUrl);
            redirect(`/auth/signin?callbackUrl=${encodedCallback}`);
        }
        return session.user;
    } catch (error) {
        console.error("Authentication error:", error);
        const encodedCallback = encodeURIComponent(callbackUrl);
        redirect(`/auth/signin?callbackUrl=${encodedCallback}`);
    }
}
