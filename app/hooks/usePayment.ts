/// app/hooks/usePayment.ts

"use client";

import { PaymentStatus } from "@prisma/client";
import {
    usePaymentLog,
    usePaymentLogs,
    usePaymentLogsByStatus,
    usePortOneEnv,
} from "@/app/queries/paymentQueries";
import {
    useCreatePayment,
    useVerifyPaymentMutation,
    useCancelPaymentMutation,
    useUpdatePaymentStatusMutation,
} from "@/app/mutations/paymentMutations";
import * as PortOne from "@portone/browser-sdk/v2";
export function usePayment() {
    // Queries
    const getPaymentLog = (id: string) => usePaymentLog(id);
    const getPaymentLogs = (userId: string) => usePaymentLogs(userId);
    const getPaymentLogsByStatus = (status: PaymentStatus) =>
        usePaymentLogsByStatus(status);
    const getPortOneEnv = (
        payMethod: PortOne.Entity.PayMethod,
        easyPayProvider?: PortOne.Entity.EasyPayProvider,
        cardProvider?: PortOne.Entity.Country
    ) => usePortOneEnv(payMethod, easyPayProvider, cardProvider);

    // Mutations
    const createPaymentMutation = useCreatePayment();
    const verifyPaymentMutation = useVerifyPaymentMutation();
    const cancelPaymentMutation = useCancelPaymentMutation();
    const updatePaymentStatusMutation = useUpdatePaymentStatusMutation();

    return {
        // Queries
        getPaymentLog,
        getPaymentLogs,
        getPaymentLogsByStatus,
        getPortOneEnv,

        // Mutations
        createPayment: createPaymentMutation,
        verifyPayment: verifyPaymentMutation,
        cancelPayment: cancelPaymentMutation,
        updatePaymentStatus: updatePaymentStatusMutation,

        // Loading States
        isCreating: createPaymentMutation.isPending,
        isVerifying: verifyPaymentMutation.isPending,
        isCancelling: cancelPaymentMutation.isPending,
        isUpdating: updatePaymentStatusMutation.isPending,

        // Error States
        createError: createPaymentMutation.error,
        verifyError: verifyPaymentMutation.error,
        cancelError: cancelPaymentMutation.error,
        updateError: updatePaymentStatusMutation.error,
    };
}
