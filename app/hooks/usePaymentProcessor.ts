import {
    PaymentExecutorProps,
    PaymentError,
    METHOD_MAP,
    CURRENCY_MAP,
    EASY_PAY_PROVIDER_MAP,
} from "@/lib/types/payments";
import { PortOneService } from "@/app/services/portoneService";
import { usePayments } from "./usePaymentValidation";

export const usePaymentProcessor = (props: PaymentExecutorProps) => {
    const {
        initializePayment,
        completePayment,
        failedPayment,
        isInitializing,
        isProcessing,
    } = usePayments();
    const portoneService = PortOneService.getInstance();

    const processPayment = async () => {
        if (isInitializing || isProcessing) return;

        try {
            if (
                !props.userId ||
                !props.table ||
                !props.target ||
                !props.quantity
            ) {
                const missingFields = [];
                if (!props.userId) missingFields.push("userId");
                if (!props.table) missingFields.push("table");
                if (!props.target) missingFields.push("target");
                if (!props.quantity) missingFields.push("quantity");

                throw new PaymentError(
                    `Missing required fields: ${missingFields.join(", ")}`,
                    "INVALID_REQUEST"
                );
            }

            const initResponse = await initializePayment({
                sessionHash: `session-${Date.now()}-${Math.random()
                    .toString(36)
                    .substring(2, 15)}`,
                userId: props.userId,
                table: props.table,
                target: props.target,
                quantity: props.quantity,
                currency: CURRENCY_MAP[props.currency],
                method: METHOD_MAP[props.method],
                easyPayProvider: props.easyPayProvider
                    ? EASY_PAY_PROVIDER_MAP[
                          props.easyPayProvider as keyof typeof EASY_PAY_PROVIDER_MAP
                      ]
                    : undefined,
                cardProvider: props.cardProvider,
            });

            const response = await portoneService.requestPayment(props, {
                storeId: initResponse.paymentConfig.storeId,
                channelKey: initResponse.paymentConfig.channelKey,
                paymentId: initResponse.paymentId,
                orderName: initResponse.orderName,
                totalAmount: initResponse.totalAmount,
            });

            if (response.success) {
                await completePayment(initResponse);
                props.onSuccess?.(response);
            } else {
                await failedPayment(
                    initResponse.paymentId,
                    response.message || "Payment failed"
                );
                props.onError?.(
                    new PaymentError(
                        response.message || "Payment failed",
                        "PAYMENT_FAILED"
                    )
                );
            }
        } catch (error) {
            props.onError?.(
                new PaymentError(
                    error instanceof Error
                        ? error.message
                        : "An unknown error occurred",
                    "UNKNOWN_ERROR",
                    error
                )
            );
        }
    };

    return {
        isLoading: isInitializing || isProcessing,
        processPayment,
    };
};
