import { getSession } from "next-auth/react";

export async function requireAuth() {
    const session = await getSession();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }
    return session;
}

export async function getAuthUserId() {
    try {
        const session = await getSession();
        return session?.user?.id || null;
    } catch (error) {
        return null;
    }
}

export async function isAuthenticated() {
    const session = await getSession();
    return !!session?.user;
}
