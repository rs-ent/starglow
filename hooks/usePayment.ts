"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import { getReadyPayment } from "@/app/actions/payment";
import type {
    PaymentReadyRequest,
    PaymentReadyResponse,
} from "@/app/actions/payment";

interface UsePaymentReadyOptions {
    onSuccess?: (data: PaymentReadyResponse) => void;
    onError?: (error: Error) => void;
}

/**
 * 결제 준비를 위한 훅
 */
export function usePaymentReady(options?: UsePaymentReadyOptions) {
    const mutation = useMutation({
        mutationFn: async (request: PaymentReadyRequest) => {
            const response = await getReadyPayment(request);
            if (!response) {
                throw new Error("결제 준비에 실패했습니다. 응답이 없습니다.");
            }
            return response;
        },
        onSuccess: (data) => {
            options?.onSuccess?.(data);
        },
        onError: (error: Error) => {
            console.error("결제 준비 오류:", error);
            options?.onError?.(error);
        },
    });

    return mutation;
}

/**
 * 사용자별 결제 기록 조회 훅 (구현 예정)
 */
export function useUserPayments(userId: string) {
    return useQuery({
        queryKey: queryKeys.payments.byUser(userId),
        queryFn: async () => {
            // 실제 데이터 가져오는 로직 구현 필요
            // const payments = await getPaymentsByUser(userId);
            // return payments;
            return [];
        },
        enabled: !!userId,
    });
}

/**
 * 결제 상세 정보 조회 훅 (구현 예정)
 */
export function usePaymentDetails(paymentId: string) {
    return useQuery({
        queryKey: queryKeys.payments.byId(paymentId),
        queryFn: async () => {
            // 실제 데이터 가져오는 로직 구현 필요
            // const payment = await getPaymentById(paymentId);
            // return payment;
            return null;
        },
        enabled: !!paymentId,
    });
}
