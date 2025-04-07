export enum PaymentMethodType {
    PAYPAL = "PAYPAL",
    CARD = "CARD",
    EASY_PAY = "EASY_PAY",
}

export enum EasyPayProviderType {
    KAKAOPAY = "EASY_PAY_PROVIDER_KAKAOPAY",
    TOSSPAY = "EASY_PAY_PROVIDER_TOSSPAY",
}

export enum CardProvider {
    DOMESTIC = "CARD_PROVIDER_DOMESTIC",
    INTERNATIONAL = "CARD_PROVIDER_INTERNATIONAL",
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
    easyPayProvider?: EasyPayProviderType;
    cardProvider?: CardProvider;
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
    easyPayProvider: EasyPayProviderType;
    cardProvider: CardProvider;
    currency: CurrencyType;
    paymentConfig: {
        storeId: string;
        channelKey: string;
    };
};
