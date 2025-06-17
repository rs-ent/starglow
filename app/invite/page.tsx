/// app\invite\page.tsx

import { redirect } from "next/navigation";
import { requireAuthUser } from "@/app/auth/authUtils";
import { invitePlayer } from "../actions/player";

// 타입 정의 추가
type InviteResult =
    | { success: true; data: any }
    | { success: false; error: string };

export default async function InviteAuthPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { ref, method, tgId } = await searchParams;

    // 1. 필수 파라미터 검증
    if (!ref || !isValidParam(ref)) {
        redirect(
            `/error?message=${encodeURIComponent(
                "Invalid referral code"
            )}&returnUrl=/`
        );
    }

    if (!isValidParam(method)) {
        redirect(
            `/error?message=${encodeURIComponent(
                "Invalid invitation method"
            )}&returnUrl=/`
        );
    }

    // 2. 인증 체크 (로그인 안 되어있으면 로그인 페이지로)
    const user = await requireAuthUser(`/invite?ref=${ref}&method=${method}`);

    // 3. 초대 처리
    let result: InviteResult;

    try {
        const inviteResult = await invitePlayer({
            referredUser: user,
            referrerCode: ref,
            method: method,
            telegramId: isValidParam(tgId) ? tgId : undefined, // ✅ 안전한 처리
        });

        result = { success: true, data: inviteResult };
    } catch (error: any) {
        // 에러 메시지 매핑
        const errorMessages: Record<string, string> = {
            ALREADY_INVITED: "You have already been invited by someone",
            REFERRER_NOT_FOUND: "The inviter was not found",
            SELF_INVITE_NOT_ALLOWED: "You cannot invite yourself",
            TELEGRAM_ID_ALREADY_USED: "This Telegram ID is already used",
        };

        const errorMessage =
            errorMessages[error.message] ||
            "An error occurred during invitation";
        result = { success: false, error: errorMessage };
    }

    // 4. 결과에 따른 redirect
    if (!result.success) {
        const returnUrl = `/invite?ref=${ref}&method=${method}`;
        redirect(
            `/error?message=${encodeURIComponent(
                result.error
            )}&returnUrl=${encodeURIComponent(returnUrl)}`
        );
    }

    // 5. 성공 시 redirect
    redirect("/quests");
}

function isValidParam(param: unknown): param is string {
    return typeof param === "string" && param.trim().length > 0;
}
