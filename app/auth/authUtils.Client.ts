"use client";

import { useRouter } from "next/navigation";
import { useSession, signIn, getSession } from "next-auth/react";

import type { User } from "next-auth";

/**
 * 클라이언트에서 현재 로그인한 사용자의 ID를 가져옵니다.
 * @returns 로그인한 사용자의 ID 또는 null
 */
export function useAuthUserId(): string | null {
    const { data: session } = useSession();
    return session?.user?.id || null;
}

/**
 * 클라이언트에서 현재 로그인한 사용자 정보를 가져옵니다.
 * @returns 로그인한 사용자 정보 또는 null
 */
export function useAuthUser(): User | null {
    const { data: session } = useSession();
    return session?.user || null;
}

/**
 * 클라이언트에서 사용자 인증 여부를 확인합니다.
 * @returns 인증 여부
 */
export function useIsAuthenticated(): boolean {
    const { data: session, status } = useSession();
    return status === "authenticated" && !!session?.user;
}

/**
 * 세션 없이 사용자 ID를 가져오는 함수 (useEffect 내부 등에서 사용)
 * @returns Promise<string | null>
 */
export async function getAuthUserIdClient(): Promise<string | null> {
    try {
        const session = await getSession();
        return session?.user?.id || null;
    } catch (error) {
        console.error("Failed to get auth user ID:", error);
        return null;
    }
}

/**
 * 사용자 정보를 가져오는 함수 (useEffect 내부 등에서 사용)
 * @returns Promise<User | null>
 */
export async function getAuthUserClient(): Promise<User | null> {
    try {
        const session = await getSession();
        return session?.user || null;
    } catch (error) {
        console.error("Failed to get auth user:", error);
        return null;
    }
}

/**
 * 인증이 필요한 페이지에서 사용할 훅
 * @param callbackUrl 인증 후 리다이렉트할 URL
 * @returns { user: User | null, loading: boolean, authenticated: boolean, redirectToSignIn: () => void }
 */
export function useRequireAuth(
    callbackUrl: string = typeof window !== "undefined"
        ? window.location.href
        : ""
) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const loading = status === "loading";
    const authenticated = status === "authenticated" && !!session?.user;

    const redirectToSignIn = () => {
        const encodedCallback = encodeURIComponent(callbackUrl);
        router.push(`/auth/signin?callbackUrl=${encodedCallback}`);
    };

    return {
        user: session?.user || null,
        loading,
        authenticated,
        redirectToSignIn,
    };
}
