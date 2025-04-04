/// components/atoms/PortOneButton.tsx

"use client";

import Button from "./Button";
import * as PortOne from "@portone/browser-sdk/v2";
import {
    PaymentReadyRequest,
    PaymentReadyResponse,
} from "@/app/actions/payment";

export default function PortOneButton({
    paymentReadyRequest,
}: {
    paymentReadyRequest: PaymentReadyRequest;
}) {
    const handlePayment = async () => {
        //const response = await PortOne.requestPayment(paymentReadyRequest);
        //console.log(response);
    };

    return <Button onClick={handlePayment}>Purchase</Button>;
}
