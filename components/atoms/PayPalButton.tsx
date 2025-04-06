"use client";

import { useState, useEffect, useRef } from "react";
import * as PortOne from "@portone/browser-sdk/v2";
import { Entity } from "@portone/browser-sdk/v2";
import {
    initPaymentValidation,
    verifyPayment,
    recordPaymentFailure,
} from "@/app/actions/paymentValidation";
import { CurrencyType, PaymentMethodType } from "@/lib/types/payment";
import crypto from "crypto";
import { getSession } from "next-auth/react";
import { useToast } from "@/app/hooks/useToast";
import { useRouter } from "next/navigation";

export interface PayPalButtonProps {
    userId?: string;
    table: string;
    target: string;
    quantity: number;
    currency: "CURRENCY_USD" | "CURRENCY_KRW";
    onSuccess?: (response: any) => void;
    onError?: (error: any) => void;
    paypalOptions?: {
        style?: {
            layout?: "vertical" | "horizontal";
            color?: "gold" | "blue" | "silver" | "white" | "black";
            shape?: "rect" | "pill";
            label?: "paypal" | "checkout" | "buynow" | "pay";
        };
        enableFunding?: string[];
        disableFunding?: string[];
    };
}

// 유틸리티 함수: 고유 컨테이너 ID 생성
const generateContainerId = (userId?: string) => {
    const userPart = userId ? userId.substring(0, 8) : "guest";
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `portone-paypal-${userPart}-${randomPart}`;
};

export default function PayPalButton({
    userId,
    table,
    target,
    quantity,
    currency,
    onSuccess,
    onError,
    paypalOptions,
}: PayPalButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [sessionLoaded, setSessionLoaded] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>(userId || "");
    const containerRef = useRef<HTMLDivElement>(null);
    const paymentResponseRef = useRef<any>(null);
    const toast = useToast();
    const router = useRouter();

    // 컨테이너 ID는 컴포넌트 마운트 시 한 번만 생성
    const containerId = useRef(generateContainerId(userId)).current;

    // Entity currency mapping for PortOne SDK
    const entityCurrencyMap = {
        CURRENCY_USD: Entity.Currency.USD,
        CURRENCY_KRW: Entity.Currency.KRW,
    };

    // Map for converting component types to CurrencyType
    const CURRENCY_MAP = {
        CURRENCY_USD: CurrencyType.USD,
        CURRENCY_KRW: CurrencyType.KRW,
    };

    // 세션 로드 및 유저 ID 확인
    useEffect(() => {
        const loadSession = async () => {
            try {
                // 이미 props로 userId가 제공된 경우
                if (userId) {
                    setCurrentUserId(userId);
                    setSessionLoaded(true);
                    return;
                }

                // 세션에서 userId 확인
                const session = await getSession();
                if (session?.user?.id) {
                    setCurrentUserId(session.user.id);
                }
                setSessionLoaded(true);
            } catch (error) {
                console.error("세션 로드 실패:", error);
                setSessionLoaded(true);
            }
        };

        loadSession();
    }, [userId]);

    // 세션 로드 후 PayPal 초기화
    useEffect(() => {
        if (sessionLoaded && currentUserId) {
            initializePayPal();
        }
    }, [sessionLoaded, currentUserId]);

    // 정리 함수 - 컴포넌트 언마운트 시 실행
    useEffect(() => {
        return () => {
            // 컨테이너 정리
            if (containerRef.current) {
                try {
                    containerRef.current.innerHTML = "";
                } catch (e) {
                    console.error("Failed to clean container:", e);
                }
            }

            // 로딩 상태 초기화
            setIsLoading(false);
            setIsInitialized(false);
        };
    }, []);

    // 유저 인증 체크 및 결제 초기화
    const checkUserAndProceed = async (callback: () => Promise<void>) => {
        // 이미 현재 유저 ID가 있는 경우
        if (currentUserId) {
            await callback();
            return;
        }

        try {
            // 세션에서 다시 확인
            const session = await getSession();
            if (session?.user?.id) {
                setCurrentUserId(session.user.id);
                await callback();
            } else {
                // 로그인 필요
                toast.error("Please login to continue");
                const callbackUrl = encodeURIComponent(window.location.href);
                router.push(`/auth/signin?callbackUrl=${callbackUrl}`);
            }
        } catch (error) {
            console.error("Failed to get session:", error);
            toast.error("Authentication error. Please try again.");
        }
    };

    // 페이팔 결제 초기화 함수
    const initializePayPal = async () => {
        // 이미 초기화 중이거나 완료된 경우 건너뜀
        if (isLoading || isInitialized) {
            return;
        }

        setIsLoading(true);

        await checkUserAndProceed(async () => {
            try {
                // 필수 필드 확인
                if (!currentUserId || !table || !target) {
                    toast.error("Missing required information for payment");
                    console.error("Missing required fields:", {
                        currentUserId,
                        table,
                        target,
                    });
                    setIsLoading(false);
                    return;
                }

                // 세션 해시 생성 (클라이언트)
                const sessionHash = crypto
                    .createHash("sha256")
                    .update(`${currentUserId}-${Date.now()}-${Math.random()}`)
                    .digest("hex");

                // 서버에 결제 초기화 요청
                const paymentResponse = await initPaymentValidation({
                    sessionHash,
                    userId: currentUserId,
                    table,
                    target,
                    quantity,
                    currency: CURRENCY_MAP[currency],
                    method: PaymentMethodType.PAYPAL,
                });

                if (!paymentResponse) {
                    throw new Error("결제 초기화에 실패했습니다.");
                }

                paymentResponseRef.current = paymentResponse;
                setIsInitialized(true);

                try {
                    const requestData = {
                        uiType: "PAYPAL_SPB" as const,
                        storeId: paymentResponse.paymentConfig.storeId,
                        channelKey: paymentResponse.paymentConfig.channelKey,
                        paymentId: paymentResponse.paymentId,
                        orderName: paymentResponse.orderName,
                        totalAmount: paymentResponse.totalAmount,
                        currency: entityCurrencyMap[currency],
                    };

                    console.log("PayPal request data:", requestData);

                    // 기존 PayPal UI 요소 제거 (전역 DOM에서)
                    const paypalElements =
                        document.querySelectorAll('[id^="paypal-"]');
                    paypalElements.forEach((el) => {
                        if (
                            el.id !== containerId &&
                            !containerRef.current?.contains(el)
                        ) {
                            try {
                                el.remove();
                            } catch (e) {
                                console.error("Failed to remove element:", e);
                            }
                        }
                    });

                    const response = await PortOne.loadPaymentUI(requestData, {
                        onPaymentSuccess: async (response: any) => {
                            console.log("Payment success:", response);
                            try {
                                const verifyResult = await verifyPayment({
                                    paymentId: paymentResponse.paymentId,
                                    sessionHash: paymentResponse.sessionHash,
                                    paymentKey: paymentResponse.paymentKey,
                                    userId: paymentResponse.userId,
                                    amount: paymentResponse.amount,
                                    quantity: paymentResponse.quantity,
                                    currency: paymentResponse.currency,
                                    table: table,
                                    target: target,
                                });

                                if (!verifyResult || !verifyResult.success) {
                                    throw new Error(
                                        "Payment verification failed"
                                    );
                                }

                                // 성공 콜백 실행
                                if (onSuccess) {
                                    onSuccess({
                                        ...response,
                                        paymentId: paymentResponse.paymentId,
                                        verifyResult,
                                    });
                                }
                            } catch (error) {
                                console.error(
                                    "Payment verification failed:",
                                    error
                                );
                                if (onError) onError(error);
                            } finally {
                                setIsLoading(false);
                            }
                        },
                        onPaymentFail: async (error: any) => {
                            console.error(
                                "Payment failed:",
                                JSON.stringify(error, null, 2)
                            );
                            try {
                                await recordPaymentFailure({
                                    paymentId: paymentResponse.paymentId,
                                    failureReason:
                                        error?.message || "Unknown error",
                                });
                            } catch (recordError) {
                                console.error(
                                    "Payment failure recording error:",
                                    recordError
                                );
                            }

                            if (onError) onError(error);
                            setIsLoading(false);
                        },
                    });
                } catch (loadError) {
                    console.error("PayPal UI load failed:", loadError);
                    setIsInitialized(false);
                    if (onError) onError(loadError);
                    setIsLoading(false);
                }
            } catch (error: any) {
                console.error("PayPal initialization failed:", error);
                setIsInitialized(false);
                if (onError) onError(error);
                setIsLoading(false);
            }
        });
    };

    return (
        <div className="w-full">
            {!sessionLoaded ? (
                <div className="w-full p-3 text-center rounded-lg bg-secondary/20">
                    Loading...
                </div>
            ) : (
                <div
                    ref={containerRef}
                    id={containerId}
                    className="portone-ui-container w-full min-h-[50px] bg-secondary/20 rounded-lg overflow-hidden"
                >
                    {isLoading && (
                        <div className="w-full h-full flex items-center justify-center p-4">
                            <span>Loading PayPal...</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
