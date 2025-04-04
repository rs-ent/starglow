"use client";

import { useState, useCallback } from "react";
import Button from "./Button";
import * as PortOne from "@portone/browser-sdk/v2";
import { usePaymentReady } from "@/hooks/usePayment";
import { useToast } from "@/hooks/useToast";

interface PaymentButtonProps {
    userId: string;
    table: string; // 'events', 'products' 등
    target: string; // 상품/이벤트 ID
    quantity: number;
    currency?: string;
    method?: string;
    buttonText?: string;
    disabled?: boolean;
    onSuccess?: (response: any) => void;
    onError?: (error: Error) => void;
}

export default function PaymentButton({
    userId,
    table,
    target,
    quantity,
    currency = "USD",
    method = "PAYPAL",
    buttonText = "결제하기",
    disabled = false,
    onSuccess,
    onError,
}: PaymentButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    // 결제 준비 mutation 훅 사용
    const paymentReadyMutation = usePaymentReady({
        onSuccess: (paymentData) => {
            // 포트원 결제 요청
            processPortOnePayment(paymentData);
        },
        onError: (error: Error) => {
            setIsLoading(false);
            toast.error(error.message);
            onError?.(error);
        },
    });

    // 포트원 결제 처리
    const processPortOnePayment = useCallback(
        async (paymentData: any) => {
            try {
                const response = await PortOne.requestPayment({
                    storeId: paymentData.storeId,
                    channelKey: paymentData.channelKey,
                    paymentId: paymentData.paymentId,
                    orderName: paymentData.orderName,
                    totalAmount: paymentData.totalAmount,
                    currency: paymentData.currency,
                    payMethod: paymentData.method,
                });

                setIsLoading(false);
                toast.success("결제가 성공적으로 완료되었습니다.");
                onSuccess?.(response);
            } catch (error: unknown) {
                console.error("포트원 결제 오류:", error);
                setIsLoading(false);

                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "결제 처리 중 오류가 발생했습니다.";
                toast.error(errorMessage);

                if (error instanceof Error) {
                    onError?.(error);
                }
            }
        },
        [onSuccess, onError, toast]
    );

    // 결제 시작
    const handlePayment = useCallback(async () => {
        try {
            setIsLoading(true);

            // 세션 해시 생성
            const sessionHash = `session-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 15)}`;

            // 결제 준비 요청
            paymentReadyMutation.mutate({
                sessionHash,
                userId,
                table,
                target,
                quantity,
                currency,
                method,
            });
        } catch (error: unknown) {
            setIsLoading(false);
            console.error("결제 초기화 오류:", error);

            if (error instanceof Error) {
                onError?.(error);
            }
        }
    }, [
        userId,
        table,
        target,
        quantity,
        currency,
        method,
        paymentReadyMutation,
        onError,
    ]);

    return (
        <Button
            onClick={handlePayment}
            disabled={disabled || isLoading || paymentReadyMutation.isPending}
        >
            {isLoading || paymentReadyMutation.isPending
                ? "처리 중..."
                : buttonText}
        </Button>
    );
}
