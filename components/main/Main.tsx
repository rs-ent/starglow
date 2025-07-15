/// templates/Main.tsx

"use client";

import { memo, useCallback, useEffect, useState } from "react";

import { useSearchParams, useRouter } from "next/navigation";
import Script from "next/script";
import { useSession } from "next-auth/react";
import Image from "next/image";

import { signIn } from "next-auth/react";

import Footer from "@/components/main/Footer";
import MainFollowUs from "@/components/main/Main.FollowUs";
import MainGitbook from "@/components/main/Main.Gitbook";
import MainPartners from "@/components/main/Main.Partners";
import NotifyInvitationSuccess from "@/components/notifications/Notify.Invitation.Success";
import NotifyInvitationError from "@/components/notifications/Notify.Invitation.Error";

declare global {
    interface Window {
        Telegram?: {
            WebApp?: any;
        };
    }
}

const telegramScriptLink = "https://telegram.org/js/telegram-web-app.js";

// 메모이제이션된 컴포넌트들
const BgImage = memo(function BgImage() {
    return (
        <Image
            src="/bg/gradient-galaxy.svg"
            alt="Background"
            priority
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover object-top -z-10"
        />
    );
});

const LoadingOverlay = memo(function LoadingOverlay() {
    return (
        <div className="fixed inset-0 flex items-center justify-center w-screen h-screen z-50 bg-[rgba(0,0,0,0.6)] transition-all duration-700 backdrop-blur-3xl">
            <Image
                src="/logo/l-gradient.svg"
                alt="Starglow"
                width={96}
                height={96}
                priority
                className="animate-in fade-in-0 duration-1000"
            />
        </div>
    );
});

export default function Main() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const signedOut = searchParams.get("signedOut");
    const { data: session } = useSession();

    const [isLoading, setIsLoading] = useState(true);
    const [telegram, setTelegram] = useState<any>(null);
    const [authProcessed, setAuthProcessed] = useState(false);

    // 초대 알림 관련 상태
    const [inviteSuccessModal, setInviteSuccessModal] = useState(false);
    const [inviteErrorModal, setInviteErrorModal] = useState(false);
    const [inviteNotification, setInviteNotification] = useState<any>(null);

    // 초대 관련 URL params 체크 - 안전한 파라미터 추출
    const inviteSuccess = searchParams.get("inviteSuccess");
    const inviteError = searchParams.get("inviteError");
    const referrer = searchParams.get("referrer");
    const method = searchParams.get("method");

    // 안전한 파라미터 디코딩 함수
    const safeDecodeURIComponent = useCallback(
        (value: string | null, fallback: string = "unknown") => {
            if (!value) return fallback;
            try {
                return decodeURIComponent(value);
            } catch (error) {
                console.error("Failed to decode URI component:", error);
                return fallback;
            }
        },
        []
    );

    // URL 정리 함수
    const cleanUrl = useCallback(() => {
        try {
            const url = new URL(window.location.href);
            url.searchParams.delete("inviteSuccess");
            url.searchParams.delete("inviteError");
            url.searchParams.delete("referrer");
            url.searchParams.delete("method");
            router.replace(url.pathname + (url.search || ""));
        } catch (error) {
            console.error("Failed to clean URL:", error);
            // 최후의 수단으로 현재 path만 유지
            router.replace(window.location.pathname);
        }
    }, [router]);

    // 초대 알림 통합 처리 - 우선순위: 성공 > 에러
    useEffect(() => {
        // 이미 모달이 열려있으면 무시
        if (inviteSuccessModal || inviteErrorModal) return;

        // 성공 케이스 우선 처리
        if (inviteSuccess === "true") {
            const safeReferrer = safeDecodeURIComponent(referrer, "A friend");
            const safeMethod = safeDecodeURIComponent(method, "webapp");

            const notification = {
                id: "invite-success",
                type: "invite_success",
                title: "Invitation Success",
                message:
                    "You have successfully joined Starglow through an invitation!",
                entityData: {
                    referrerName: safeReferrer,
                    method: safeMethod,
                },
                createdAt: new Date(),
            };

            setInviteNotification(notification);
            setInviteSuccessModal(true);
            return; // 성공 시 에러 처리 무시
        }

        // 에러 케이스 처리 (성공이 없을 때만)
        if (inviteError) {
            const errorMessages: Record<string, string> = {
                ALREADY_INVITED:
                    "You have already been invited by someone else",
                REFERRER_NOT_FOUND:
                    "Invalid referral code. Please check the code and try again",
                SELF_INVITE_NOT_ALLOWED:
                    "You cannot use your own referral code. Please ask a friend to share their code with you",
                TELEGRAM_ID_ALREADY_USED:
                    "This Telegram ID is already linked to another account",
                INVALID_CODE: "Invalid referral code",
                INVALID_METHOD: "Invalid invitation method",
                PROCESSING_ERROR:
                    "An error occurred while processing your invitation",
                UNKNOWN_ERROR: "An error occurred during invitation",
            };

            const errorMessage =
                errorMessages[inviteError] || errorMessages.UNKNOWN_ERROR;

            const safeReferrer = safeDecodeURIComponent(referrer, "Unknown");
            const safeMethod = safeDecodeURIComponent(method, "unknown");

            const notification = {
                id: "invite-error",
                type: "invite_error",
                title: "Invitation Error",
                message: errorMessage,
                entityData: {
                    errorType: inviteError,
                    referrerName: safeReferrer,
                    method: safeMethod,
                },
                createdAt: new Date(),
            };

            setInviteNotification(notification);
            setInviteErrorModal(true);
        }
    }, [
        inviteSuccess,
        inviteError,
        referrer,
        method,
        inviteSuccessModal,
        inviteErrorModal,
        safeDecodeURIComponent,
    ]);

    // 모달 닫기 핸들러
    const handleCloseInviteModals = useCallback(() => {
        setInviteSuccessModal(false);
        setInviteErrorModal(false);
        setInviteNotification(null);
        cleanUrl();
    }, [cleanUrl]);

    // 텔레그램 인증 핸들러를 useCallback으로 메모이제이션
    const handleTelegramAuth = useCallback(async () => {
        if (!telegram || authProcessed || session?.user || signedOut) {
            setIsLoading(false);
            return;
        }

        try {
            const user = telegram.initDataUnsafe?.user;

            if (user) {
                const refParam = telegram.initDataUnsafe?.start_param;

                await signIn("telegram", {
                    telegramId: user.id?.toString(),
                    firstName: user.first_name,
                    lastName: user.last_name,
                    username: user.username,
                    photoUrl: user.photo_url,
                    languageCode: user.language_code,
                    isPremium: user.is_premium?.toString(),
                    referrerCode: refParam,
                    redirect: false,
                });

                setAuthProcessed(true);
            }
        } catch (error) {
            console.error("Telegram Auth Error: ", error);
        } finally {
            setIsLoading(false);
        }
    }, [telegram, authProcessed, session, signedOut]);

    // 스크립트 로드 핸들러
    const handleScriptLoad = useCallback(() => {
        if (window.Telegram?.WebApp) {
            setTelegram(window.Telegram.WebApp);
        } else {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void handleTelegramAuth();
    }, [handleTelegramAuth]);

    return (
        <>
            <Script
                src={telegramScriptLink}
                strategy="afterInteractive"
                onLoad={handleScriptLoad}
            />

            {isLoading && <LoadingOverlay />}

            <div className="relative flex flex-col w-full">
                <BgImage />

                <main className="flex flex-col flex-1">
                    <MainGitbook />
                    <MainPartners />
                    <MainFollowUs />
                </main>
                <Footer followUsVisible={false} />
            </div>

            {/* 초대 성공 모달 - 더 안전한 조건 */}
            {inviteNotification && inviteSuccessModal && (
                <NotifyInvitationSuccess
                    isOpen={inviteSuccessModal}
                    onClose={handleCloseInviteModals}
                    onComplete={handleCloseInviteModals}
                    notification={inviteNotification}
                />
            )}

            {/* 초대 에러 모달 - 더 안전한 조건 */}
            {inviteNotification && inviteErrorModal && (
                <NotifyInvitationError
                    isOpen={inviteErrorModal}
                    onClose={handleCloseInviteModals}
                    onComplete={handleCloseInviteModals}
                    notification={inviteNotification}
                />
            )}
        </>
    );
}
