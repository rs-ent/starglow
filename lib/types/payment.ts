export enum PaymentMethodType {
    PAYPAL = "PAYPAL",
    CARD = "CARD",
    KAKAO_PAY = "KAKAO_PAY",
    TOSS_PAY = "TOSS_PAY",
}

export enum CurrencyType {
    USD = "USD",
    KRW = "KRW",
}

// 결제 초기화/검증 관련 에러 클래스
export class PaymentError extends Error {
    code: string;

    constructor(message: string, code: string = "PAYMENT_ERROR") {
        super(message);
        this.name = "PaymentError";
        this.code = code;
    }
}

interface BasePaymentRequest {
    userId: string;
    table: string;
    target: string;
    quantity: number;
    currency: CurrencyType;
    method: PaymentMethodType;
}

export type PaymentInitRequest = BasePaymentRequest & {
    sessionHash: string;
};

export type PaymentVerifyRequest = {
    paymentId: string;
    sessionHash: string;
    paymentKey: string;
    userId: string;
    amount: number;
    quantity: number;
    currency: string;
    table: string;
    target: string;
    additionalData?: Record<string, any>;
};

export type PaymentInitResponse = {
    paymentId: string;
    sessionHash: string;
    paymentKey: string;
    userId: string;
    amount: number;
    quantity: number;
    totalAmount: number;
    orderName: string;
    orderId: string;
    method: PaymentMethodType;
    currency: CurrencyType;
    paymentConfig: {
        storeId: string;
        channelKey: string;
    };
};
