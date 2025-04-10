/// app/hooks/usePayment.ts

"use client";

import { PaymentStatus } from "@prisma/client";
import {
    usePaymentLog,
    usePaymentLogs,
    usePaymentLogsByStatus,
} from "@/app/queries/paymentQueries";
import {
    useCreatePayment,
    useVerifyPaymentMutation,
    useCancelPaymentMutation,
    useUpdatePaymentStatusMutation,
} from "@/app/mutations/paymentMutations";

export function usePayment() {
    // Queries
    const getPaymentLog = (id: string) => usePaymentLog(id);
    const getPaymentLogs = (userId: string) => usePaymentLogs(userId);
    const getPaymentLogsByStatus = (status: PaymentStatus) =>
        usePaymentLogsByStatus(status);

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
