/// app/types/portone.ts

// PortOne Browser SDK types
// Based on usage patterns in the codebase and the PortOne v2 API

export type Currency = "USD" | "KRW" | "JPY" | "EUR" | "GBP" | "CNY";

export type PayMethod =
    | "PAYPAL"
    | "CARD"
    | "VIRTUAL_ACCOUNT"
    | "TRANSFER"
    | "MOBILE"
    | "GIFT_CERTIFICATE"
    | "EASY_PAY"
    | "ALIPAY"
    | "CONVENIENCE_STORE";

export interface RequestPaymentParams {
    storeId: string;
    channelKey: string;
    paymentId: string;
    orderName: string;
    totalAmount: number;
    currency: Currency;
    payMethod: PayMethod;
    successUrl?: string;
    failUrl?: string;
    customerName?: string;
    customerEmail?: string;
    [key: string]: any; // For additional parameters
}

export interface RequestPaymentResponse {
    status: "success" | "fail";
    paymentKey?: string;
    orderId?: string;
    orderName?: string;
    totalAmount?: number;
    currency?: Currency;
    payMethod?: PayMethod;
    errorCode?: string;
    errorMessage?: string;
    [key: string]: any; // For additional response fields
}

// Declare PortOne namespace for global use
declare global {
    namespace PortOne {
        function requestPayment(params: any): Promise<any>;
    }
}
