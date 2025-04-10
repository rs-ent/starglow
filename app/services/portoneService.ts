import {
    PaymentExecutorProps,
    PayPalResponse,
    PortOneResponse,
    PaymentError,
} from "@/lib/types/payments";

export class PortOneService {
    private static instance: PortOneService;
    private isInitialized = false;

    private constructor() {}

    public static getInstance(): PortOneService {
        if (!PortOneService.instance) {
            PortOneService.instance = new PortOneService();
        }
        return PortOneService.instance;
    }

    public async initialize(): Promise<void> {
        if (this.isInitialized) return;

        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://cdn.portone.io/v2/browser-sdk.js";
            script.async = true;
            script.onload = () => {
                this.isInitialized = true;
                resolve();
            };
            document.body.appendChild(script);
        });
    }

    public async requestPayment(
        props: PaymentExecutorProps,
        paymentConfig: {
            storeId: string;
            channelKey: string;
            paymentId: string;
            orderName: string;
            totalAmount: number;
        }
    ): Promise<PortOneResponse | PayPalResponse> {
        await this.initialize();

        if (props.method === "PAYPAL") {
            // PayPal 결제 처리
            return PortOne.requestPayment({
                storeId: paymentConfig.storeId,
                channelKey: paymentConfig.channelKey,
                paymentId: paymentConfig.paymentId,
                orderName: paymentConfig.orderName,
                totalAmount: Math.round(paymentConfig.totalAmount),
                currency: "USD",
                payMethod: "PAYPAL",
                onSuccess: (response: any) => {
                    return {
                        success: true,
                        ...response,
                        currency: "USD",
                        method: "PAYPAL",
                        timestamp: Date.now(),
                        payerId: response.payerId,
                        paymentToken: response.paymentToken,
                    } as PayPalResponse;
                },
                onError: (error: any) => {
                    throw new PaymentError(
                        error.message || "PayPal payment failed",
                        "PAYPAL_ERROR",
                        error
                    );
                },
            });
        } else {
            // 일반 결제 처리 (카드, 간편결제)
            return PortOne.requestPayment({
                storeId: paymentConfig.storeId,
                channelKey: paymentConfig.channelKey,
                paymentId: paymentConfig.paymentId,
                orderName: paymentConfig.orderName,
                totalAmount: Math.round(paymentConfig.totalAmount),
                currency: "KRW",
                payMethod: props.method === "CARD" ? "CARD" : "EASY_PAY",
                cardProvider: props.cardProvider,
                onSuccess: (response: any) => {
                    return {
                        success: true,
                        ...response,
                        currency: "KRW",
                        method: props.method === "CARD" ? "CARD" : "EASY_PAY",
                        timestamp: Date.now(),
                    } as PortOneResponse;
                },
                onError: (error: any) => {
                    throw new PaymentError(
                        error.message || "Payment failed",
                        "PAYMENT_ERROR",
                        error
                    );
                },
            });
        }
    }
}
