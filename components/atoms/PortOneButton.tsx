/// components/atoms/PortOneButton.tsx

"use client";

import Button from "./Button";
import * as PortOne from "@portone/browser-sdk/v2";

export default function PortOneButton() {
    const PORTONE_MID = "store-d938db66-d1c5-406d-aff4-bd5f2121584d";
    const PORTONE_PAYPAL_CHANNEL_KEY =
        "channel-key-bd021f62-52fc-466d-94db-b8bf7821e56f";

    const storeId = PORTONE_MID;
    const channelKey = PORTONE_PAYPAL_CHANNEL_KEY;

    const paymentId = "payment-id-1234567890";
    const orderName = "order-name-1234567890";
    const totalAmount = 10000;
    const currency = "CURRENCY_USD";
    const payMethod = "PAYPAL";

    const handlePayment = async () => {
        const response = await PortOne.requestPayment({
            storeId,
            channelKey,
            paymentId,
            orderName,
            totalAmount,
            currency,
            payMethod,
        });
        console.log(response);
    };

    return <Button onClick={handlePayment}>Purchase</Button>;
}
