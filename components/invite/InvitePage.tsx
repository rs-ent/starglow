/// components\invite\InvitePage.tsx

"use client";

import { useEffect, useState, useCallback } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { useRequireAuth } from "@/app/auth/authUtils.Client";
import { usePlayerSet } from "@/app/hooks/usePlayer";

export default function InvitePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { invitePlayer } = usePlayerSet();
    const [isProcessing, setIsProcessing] = useState(false);
    const [hasProcessed, setHasProcessed] = useState(false);

    const ref = searchParams.get("ref");
    const method = searchParams.get("method") || "Unknown";
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

    const handleInvite = useCallback(async () => {
        // 이미 처리했거나 처리 중이면 중복 실행 방지
        if (isProcessing || hasProcessed) return;

        // 1. 필수 파라미터 검증
        if (!ref || ref.trim().length === 0) {
            router.push(`/?inviteError=INVALID_CODE`);
            return;
        }

        // 2. 인증 체크
        if (!authenticated || !user) {
            router.push(
                `/auth/signin?callbackUrl=${encodeURIComponent(currentUrl)}`
            );
            return;
        }

        // 3. 초대 처리
        setIsProcessing(true);
        setHasProcessed(true);

        try {
            const result = await invitePlayer({
                referredUser: user,
                referrerCode: ref,
                method: method,
                telegramId: tgId && tgId.trim().length > 0 ? tgId : undefined,
            });

            const referrerName =
                result?.referrerPlayer.nickname ||
                result?.referrerPlayer.name ||
                result?.referrerPlayer.email ||
                ref;

            router.push(
                `/?inviteSuccess=true&referrer=${encodeURIComponent(
                    referrerName
                )}&method=${encodeURIComponent(method)}`
            );
        } catch (error: any) {
            console.error("Invitation error:", error);

            // 에러 타입에 따라 메인 페이지로 리다이렉트하면서 에러 params 전달
            const errorType = error.message || "UNKNOWN_ERROR";
            router.push(
                `/?inviteError=${errorType}&referrer=${encodeURIComponent(
                    ref
                )}&method=${encodeURIComponent(method)}`
            );
        } finally {
            setIsProcessing(false);
        }
    }, [
        isProcessing,
        hasProcessed,
        ref,
        method,
        router,
        authenticated,
        user,
        currentUrl,
        invitePlayer,
        tgId,
    ]);

    useEffect(() => {
        if (!isAuthLoading && !hasProcessed) {
            handleInvite().catch((error) => {
                console.error("Failed to handle invite:", error);
            });
        }
    }, [isAuthLoading, hasProcessed, handleInvite]);

    // 로딩 중이거나 처리 중일 때 로딩 UI 표시
    if (isAuthLoading || isProcessing) {
        return (
            <div className="relative flex flex-col w-full h-screen overflow-hidden items-center justify-center">
                <div className="fixed inset-0 bg-gradient-to-b from-[#09021B] to-[#311473] -z-20" />
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-white font-medium text-lg mb-2">
                        {isAuthLoading
                            ? "Checking authentication..."
                            : "Processing your invitation..."}
                    </p>
                    <p className="text-gray-300 text-sm">
                        {isAuthLoading
                            ? "Please wait while we verify your login"
                            : "Connecting you with your referrer"}
                    </p>
                </div>
            </div>
        );
    }

    return null;
}
