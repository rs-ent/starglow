/// components\invite\Invite.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/app/hooks/useToast";
import { useRequireAuth } from "@/app/auth/authUtils.Client";
import { usePlayerSet } from "@/app/hooks/usePlayer";

export default function InvitePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToast();
    const { invitePlayer } = usePlayerSet();
    const [isProcessing, setIsProcessing] = useState(false);

    const ref = searchParams.get("ref");
    const method = searchParams.get("method");
    const tgId = searchParams.get("tgId");

    // 현재 URL을 callbackUrl로 전달
    const currentUrl = `/invite?ref=${ref}&method=${method}${
        tgId ? `&tgId=${tgId}` : ""
    }`;
    const {
        user,
        loading: isAuthLoading,
        authenticated,
    } = useRequireAuth(currentUrl);

    useEffect(() => {
        // 인증 로딩이 끝났을 때 처리
        if (!isAuthLoading) {
            handleInvite();
        }
    }, [isAuthLoading, authenticated]);

    const handleInvite = async () => {
        // 이미 처리 중이면 중복 실행 방지
        if (isProcessing) return;

        // 1. 필수 파라미터 검증
        if (!ref || ref.trim().length === 0) {
            router.push(
                `/error?message=${encodeURIComponent(
                    "Invalid referral code"
                )}&returnUrl=/`
            );
            return;
        }

        if (!method || method.trim().length === 0) {
            router.push(
                `/error?message=${encodeURIComponent(
                    "Invalid invitation method"
                )}&returnUrl=/`
            );
            return;
        }

        // 2. 인증 체크
        if (!authenticated || !user) {
            // useRequireAuth가 자동으로 리다이렉트 처리를 해주지만
            // 명시적으로 리다이렉트하려면:
            router.push(
                `/auth/signin?callbackUrl=${encodeURIComponent(currentUrl)}`
            );
            return;
        }

        // 3. 초대 처리
        setIsProcessing(true);

        try {
            await invitePlayer({
                referredUser: user,
                referrerCode: ref,
                method: method,
                telegramId: tgId && tgId.trim().length > 0 ? tgId : undefined,
            });

            // 성공 시 퀘스트 페이지로 이동
            toast.success("Successfully joined through invitation!");
            router.push("/quests");
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

            // 에러 페이지로 리다이렉트
            const returnUrl = `/invite?ref=${ref}&method=${method}`;
            router.push(
                `/error?message=${encodeURIComponent(
                    errorMessage
                )}&returnUrl=${encodeURIComponent(returnUrl)}`
            );
        } finally {
            setIsProcessing(false);
        }
    };

    // 로딩 중이거나 처리 중일 때 로딩 UI 표시
    if (isAuthLoading || isProcessing) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">
                        {isAuthLoading
                            ? "Checking authentication..."
                            : "Processing invitation..."}
                    </p>
                </div>
            </div>
        );
    }

    // 정상적인 경우 자동으로 처리되므로 빈 화면
    return null;
}
