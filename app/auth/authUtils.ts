import { auth } from "@/app/auth/authSettings";

/**
 * 인증된 사용자인지 확인하는 유틸리티 함수
 * @returns 인증된 사용자의 세션 정보
 * @throws 인증되지 않은 경우 에러 발생
 */
export async function requireAuth() {
    const session = await auth();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }
    return session;
}

/**
 * 인증된 사용자의 ID를 반환하는 유틸리티 함수
 * @returns 인증된 사용자의 ID
 * @throws 인증되지 않은 경우 에러 발생
 */
export async function getAuthUserId() {
    const session = await requireAuth();
    return session.user.id;
}
