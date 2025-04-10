// Payment Method Types
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

// Component Types
export type Currency = "CURRENCY_USD" | "CURRENCY_KRW";
export type PayMethod = "CARD" | "PAYPAL" | "EASY_PAY";
export type EasyPayProvider =
    | "EASY_PAY_PROVIDER_KAKAOPAY"
    | "EASY_PAY_PROVIDER_TOSSPAY";

// Component Props
export interface PaymentExecutorProps {
    userId: string;
    table: string;
    target: string;
    quantity: number;
    amount: number;
    currency: Currency;
    method: PayMethod;
    easyPayProvider?: string;
    cardProvider?: CardProvider;
    buttonText?: string;
    onSuccess?: (response: PaymentResponse) => void;
    onError?: (error: PaymentError) => void;
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

// Response Types
export interface PaymentResponse {
    success: boolean;
    message?: string;
    paymentId: string;
    orderName: string;
    totalAmount: number;
    currency: CurrencyType;
    method: PaymentMethodType;
    provider?: EasyPayProviderType | CardProvider;
    timestamp: number;
}

export interface PortOneResponse extends PaymentResponse {
    storeId: string;
    channelKey: string;
}

export interface PayPalResponse extends PaymentResponse {
    payerId: string;
    paymentToken: string;
}

// Error Types
export class PaymentError extends Error {
    code: string;
    details?: unknown;

    constructor(
        message: string,
        code: string = "PAYMENT_ERROR",
        details?: unknown
    ) {
        super(message);
        this.name = "PaymentError";
        this.code = code;
        this.details = details;
    }
}

// Type Conversion Maps
export const METHOD_MAP: Record<PayMethod, PaymentMethodType> = {
    PAYPAL: PaymentMethodType.PAYPAL,
    CARD: PaymentMethodType.CARD,
    EASY_PAY: PaymentMethodType.EASY_PAY,
};

export const CURRENCY_MAP: Record<Currency, CurrencyType> = {
    CURRENCY_USD: CurrencyType.USD,
    CURRENCY_KRW: CurrencyType.KRW,
};

export const EASY_PAY_PROVIDER_MAP: Record<
    EasyPayProvider,
    EasyPayProviderType
> = {
    EASY_PAY_PROVIDER_KAKAOPAY: EasyPayProviderType.KAKAOPAY,
    EASY_PAY_PROVIDER_TOSSPAY: EasyPayProviderType.TOSSPAY,
};

export interface PaymentInitRequest {
    sessionHash: string;
    userId: string;
    table: string;
    target: string;
    quantity: number;
    currency: CurrencyType;
    method: PaymentMethodType;
    easyPayProvider?: EasyPayProviderType;
    cardProvider?: CardProvider;
}

export interface PaymentInitResponse {
    paymentId: string;
    sessionHash: string;
    userId: string;
    amount: number;
    quantity: number;
    totalAmount: number;
    table: string;
    target: string;
    orderName: string;
    orderId: string;
    method: PaymentMethodType;
    easyPayProvider?: EasyPayProviderType;
    cardProvider?: CardProvider;
    currency: CurrencyType;
    paymentConfig: {
        storeId: string;
        channelKey: string;
    };
}
