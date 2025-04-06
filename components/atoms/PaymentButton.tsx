"use client";

import { useState, useEffect } from "react";
import Button from "./Button";
import { initPaymentValidation } from "@/app/actions/paymentValidation";
import { CurrencyType, PaymentMethodType } from "@/lib/types/payment";
import { getSession } from "next-auth/react";
import { useToast } from "@/app/hooks/useToast";
import { useRouter } from "next/navigation";
import PayPalButton from "./PayPalButton";

// Map component types to payment validation types
export type Currency = "CURRENCY_USD" | "CURRENCY_KRW";
export type PayMethod = "PAYPAL" | "CARD" | "WALLET" | "TOSS_PAY" | "KAKAO_PAY";

// Map for converting component types to PaymentMethodType
const METHOD_MAP: Record<PayMethod, PaymentMethodType> = {
    PAYPAL: PaymentMethodType.PAYPAL,
    CARD: PaymentMethodType.CARD,
    WALLET: PaymentMethodType.TOSS_PAY,
    TOSS_PAY: PaymentMethodType.TOSS_PAY,
    KAKAO_PAY: PaymentMethodType.KAKAO_PAY,
};

// Map for converting component types to CurrencyType
const CURRENCY_MAP: Record<Currency, CurrencyType> = {
    CURRENCY_USD: CurrencyType.USD,
    CURRENCY_KRW: CurrencyType.KRW,
};

export interface PaymentButtonProps {
    userId?: string;
    table: string;
    target: string;
    quantity: number;
    currency: Currency;
    method: PayMethod;
    buttonText?: string;
    onSuccess?: (response: any) => void;
    onError?: (error: any) => void;
    // 페이팔 전용 옵션
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

export default function PaymentButton({
    userId,
    table,
    target,
    quantity,
    currency,
    method,
    buttonText = "Pay Now",
    onSuccess,
    onError,
    paypalOptions,
}: PaymentButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [sessionLoaded, setSessionLoaded] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>(userId || "");
    const toast = useToast();
    const router = useRouter();

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

    // 결제 버튼 클릭 처리 (PayPal 외 다른 결제 방법)
    const handlePaymentClick = async () => {
        if (isLoading) return;

        setIsLoading(true);
        await checkUserAndProceed(async () => {
            try {
                // 결제 로직은 나중에 구현할 예정이므로 현재는 검증 시스템만 구현
                alert(`${method} 결제는 아직 구현되지 않았습니다.`);
            } catch (error) {
                console.error("결제 초기화 실패:", error);
                if (onError) onError(error);
            } finally {
                setIsLoading(false);
            }
        });
    };

    // PayPal 결제 버튼의 경우 별도의 컴포넌트 사용
    if (method === "PAYPAL") {
        return (
            <PayPalButton
                userId={userId}
                table={table}
                target={target}
                quantity={quantity}
                currency={currency}
                onSuccess={onSuccess}
                onError={onError}
                paypalOptions={paypalOptions}
            />
        );
    }

    // 다른 결제 방식은 일반 버튼 사용
    return (
        <Button
            onClick={handlePaymentClick}
            disabled={isLoading || !sessionLoaded}
            className="w-full"
        >
            {!sessionLoaded
                ? "Loading..."
                : isLoading
                ? "Processing..."
                : buttonText}
        </Button>
    );
}
