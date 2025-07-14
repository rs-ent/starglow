/// components\invite\InvitePage.tsx

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRequireAuth } from "@/app/auth/authUtils.Client";
import { usePlayerSet } from "@/app/hooks/usePlayer";

export default function InvitePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { invitePlayer } = usePlayerSet();
    const [isProcessing, setIsProcessing] = useState(false);
    const processedRef = useRef(false);

    // URL 파라미터 추출
    const ref = searchParams.get("ref");
    const method = searchParams.get("method") || "Unknown";
    const tgId = searchParams.get("tgId");

    // 현재 URL을 callbackUrl로 사용
    const currentUrl = `/invite?${searchParams.toString()}`;

    const {
        user,
        loading: isAuthLoading,
        authenticated,
    } = useRequireAuth(currentUrl);

    useEffect(() => {
        // 이미 처리했거나 로딩 중이면 무시
        if (processedRef.current || isAuthLoading || isProcessing) return;

        // 필수 파라미터 검증
        if (!ref) {
            router.push("/?inviteError=INVALID_CODE");
            return;
        }

        // 인증 체크
        if (!authenticated || !user?.id) {
            router.push(
                `/auth/signin?callbackUrl=${encodeURIComponent(currentUrl)}`
            );
            return;
        }

        // 초대 처리 시작
        processedRef.current = true;
        setIsProcessing(true);

        const processInvite = async () => {
            try {
                const result = await invitePlayer({
                    referredUser: user,
                    referrerCode: ref,
                    method: method,
                    telegramId: tgId || undefined,
                });

                const referrerName =
                    result?.referrerPlayer?.nickname ||
                    result?.referrerPlayer?.name ||
                    result?.referrerPlayer?.email ||
                    ref;

                router.push(
                    `/?inviteSuccess=true&referrer=${encodeURIComponent(
                        referrerName
                    )}&method=${encodeURIComponent(method)}`
                );
            } catch (error: any) {
                console.error("Invitation error:", {
                    error: error?.message || error,
                    referrerCode: ref,
                    method: method,
                    telegramId: tgId,
                    userId: user?.id,
                    userEmail: user?.email,
                });

                const errorType = error?.message || "UNKNOWN_ERROR";
                router.push(
                    `/?inviteError=${errorType}&referrer=${encodeURIComponent(
                        ref
                    )}&method=${encodeURIComponent(method)}`
                );
            } finally {
                setIsProcessing(false);
            }
        };

        processInvite().catch((error) => {
            console.error("Invitation error:", {
                error: error?.message || error,
                referrerCode: ref,
                method: method,
                telegramId: tgId,
            });
        });
    }, [
        isAuthLoading,
        authenticated,
        user,
        ref,
        method,
        tgId,
        router,
        invitePlayer,
        currentUrl,
        isProcessing,
    ]);

    // 로딩 UI
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
