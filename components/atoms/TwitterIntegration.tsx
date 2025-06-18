// components/atoms/TwitterIntegration.tsx

import { useState, useEffect, useCallback } from "react";
import { startXAuth, exchangeXToken } from "@/app/actions/x/actions";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import PartialLoading from "./PartialLoading";

interface TwitterIntegrationProps {
    onSuccess?: (tweetAuthorId: string, userData: any) => void;
    onError?: (error: string) => void;
    isConnected?: boolean;
}

// 모바일 환경 감지 함수
const isMobileDevice = () => {
    return (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        ) || window.innerWidth <= 768
    );
};

export default function TwitterIntegration({
    onSuccess,
    onError,
    playerId,
    isConnected,
}: TwitterIntegrationProps & { playerId: string }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleMobileAuthCallback = useCallback(
        async (code: string, state: string) => {
            setIsLoading(true);
            try {
                const result = await exchangeXToken({ code, state });

                if (result.success) {
                    // 모바일에서도 tweets 탭으로 전환
                    window.location.hash = "tweets";
                    onSuccess?.(result.authorId!, result.userData);
                } else {
                    onError?.(result.message || "Authentication failed");
                }
            } catch (error) {
                console.error("Mobile auth callback error:", error);
                onError?.("Authentication failed");
            } finally {
                setIsLoading(false);
                // URL 정리 - 처리 완료 후 즉시 정리
                window.history.replaceState(
                    {},
                    document.title,
                    window.location.pathname
                );
            }
        },
        [onSuccess, onError]
    );

    // 페이지 로드 시 URL에서 인증 결과 확인 (모바일 redirect 처리)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("x_auth_code");
        const state = urlParams.get("x_auth_state");
        const error = urlParams.get("x_auth_error");

        // URL 파라미터가 있는 경우에만 처리하고 즉시 정리
        if (error) {
            onError?.(decodeURIComponent(error));
            // URL 즉시 정리
            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );
        } else if (code && state) {
            handleMobileAuthCallback(code, state);
            // handleMobileAuthCallback 내부에서 URL 정리하므로 여기서는 불필요
        }
    }, []); // 🔑 의존성 배열을 비워서 마운트 시 한 번만 실행

    const handleXConnect = async () => {
        setIsLoading(true);

        try {
            const authData = await startXAuth({ playerId });
            const isMobile = isMobileDevice();

            if (isMobile) {
                // 모바일: 현재 창에서 직접 이동
                // X 인증 페이지로 직접 이동
                window.location.href = authData.authUrl;
            } else {
                // 데스크톱: 기존 팝업 방식
                const popup = window.open(
                    authData.authUrl,
                    "x-auth",
                    "width=500,height=600,scrollbars=yes,resizable=yes"
                );

                if (!popup || popup.closed) {
                    onError?.("Popup blocked. Please allow popups.");
                    setIsLoading(false);
                    return;
                }

                const checkInterval = setInterval(() => {
                    if (popup.closed) {
                        clearInterval(checkInterval);
                        window.removeEventListener("message", messageListener);
                        setIsLoading(false);
                    }
                }, 1000);

                const messageListener = async (event: MessageEvent) => {
                    if (event.origin !== window.location.origin) return;

                    if (event.data.type === "X_AUTH_SUCCESS") {
                        popup?.close();

                        const result = await exchangeXToken({
                            code: event.data.code,
                            state: event.data.state,
                        });

                        if (result.success) {
                            // 데스크톱에서도 tweets 탭으로 전환
                            window.location.hash = "tweets";
                            onSuccess?.(result.authorId!, result.userData);
                        } else {
                            onError?.(
                                result.message || "Authentication failed"
                            );
                        }

                        window.removeEventListener("message", messageListener);
                    } else if (event.data.type === "X_AUTH_ERROR") {
                        popup?.close();
                        onError?.(event.data.error);
                        window.removeEventListener("message", messageListener);
                    }
                };

                window.addEventListener("message", messageListener);
            }
        } catch (error) {
            console.error("X connection error:", error);
            onError?.("X account connection error");
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="w-full flex justify-center items-center p-[10px]">
                <PartialLoading
                    text="Connecting..."
                    loadingSize={30}
                    textSize={15}
                />
            </div>
        );
    }

    return (
        <button
            onClick={handleXConnect}
            disabled={isLoading}
            className={cn(
                "bg-black text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50",
                getResponsiveClass(25).textClass
            )}
        >
            {isConnected ? (
                <>
                    <svg
                        className={cn(getResponsiveClass(30).frameClass)}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Connected
                </>
            ) : (
                <>
                    <svg
                        className={cn(getResponsiveClass(20).frameClass)}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <h2 className={cn(getResponsiveClass(15).textClass)}>
                        Connect Account
                    </h2>
                </>
            )}
        </button>
    );
}
