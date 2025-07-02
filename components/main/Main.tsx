/// templates/Main.tsx

"use client";

import { memo, useCallback, useEffect, useState } from "react";

import { useSearchParams, useRouter } from "next/navigation";
import Script from "next/script";
import { useSession } from "next-auth/react";
import Image from "next/image";

import { useUserSet } from "@/app/hooks/useUser";
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
    const { setUserWithTelegram } = useUserSet();

    const [isLoading, setIsLoading] = useState(true);
    const [telegram, setTelegram] = useState<any>(null);
    const [authProcessed, setAuthProcessed] = useState(false);

    // 초대 알림 관련 상태
    const [inviteSuccessModal, setInviteSuccessModal] = useState(false);
    const [inviteErrorModal, setInviteErrorModal] = useState(false);
    const [inviteNotification, setInviteNotification] = useState<any>(null);

    // 초대 관련 URL params 체크
    const inviteSuccess = searchParams.get("inviteSuccess");
    const inviteError = searchParams.get("inviteError");
    const referrer = searchParams.get("referrer");
    const method = searchParams.get("method");

    // URL 정리 함수
    const cleanUrl = useCallback(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("inviteSuccess");
        url.searchParams.delete("inviteError");
        url.searchParams.delete("referrer");
        url.searchParams.delete("method");
        router.replace(url.pathname + (url.search || ""));
    }, [router]);

    // 초대 성공 모달 처리
    useEffect(() => {
        if (
            inviteSuccess === "true" &&
            referrer &&
            method &&
            !inviteSuccessModal
        ) {
            const notification = {
                id: "invite-success",
                type: "invite_success",
                title: "Invitation Success",
                message:
                    "You have successfully joined Starglow through an invitation!",
                entityData: {
                    referrerName: decodeURIComponent(referrer),
                    method: decodeURIComponent(method),
                },
                createdAt: new Date(),
            };
            setInviteNotification(notification);
            setInviteSuccessModal(true);
        }
    }, [inviteSuccess, referrer, method, inviteSuccessModal]);

    // 초대 에러 모달 처리
    useEffect(() => {
        if (inviteError && !inviteErrorModal) {
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
                UNKNOWN_ERROR: "An error occurred during invitation",
            };

            const notification = {
                id: "invite-error",
                type: "invite_error",
                title: "Invitation Error",
                message:
                    errorMessages[inviteError] || errorMessages.UNKNOWN_ERROR,
                entityData: {
                    errorType: inviteError,
                    referrerName: referrer
                        ? decodeURIComponent(referrer)
                        : "Unknown",
                    method: method ? decodeURIComponent(method) : "unknown",
                },
                createdAt: new Date(),
            };
            setInviteNotification(notification);
            setInviteErrorModal(true);
        }
    }, [inviteError, referrer, method, inviteErrorModal]);

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

                await setUserWithTelegram({
                    user,
                    referrerCode: refParam,
                });

                setAuthProcessed(true);
            }
        } catch (error) {
            console.error("Telegram Auth Error: ", error);
        } finally {
            setIsLoading(false);
        }
    }, [telegram, authProcessed, session, signedOut, setUserWithTelegram]);

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

            {/* 초대 성공 모달 */}
            {inviteNotification && (
                <NotifyInvitationSuccess
                    isOpen={inviteSuccessModal}
                    onClose={handleCloseInviteModals}
                    onComplete={handleCloseInviteModals}
                    notification={inviteNotification}
                />
            )}

            {/* 초대 에러 모달 */}
            {inviteNotification && (
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
