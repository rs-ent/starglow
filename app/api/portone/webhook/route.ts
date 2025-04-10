import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { handleWebhook } from "@/app/actions/payment";

const PORTONE_V2_WEBHOOK_SECRET = process.env.PORTONE_V2_WEBHOOK_SECRET;

type PortOnePaymentStatus =
    | "VIRTUAL_ACCOUNT_ISSUED"
    | "PAID"
    | "FAILED"
    | "CANCELLED";

function verifyWebhookSignature(body: string, signature: string): boolean {
    if (!PORTONE_V2_WEBHOOK_SECRET) {
        throw new Error("PORTONE_V2_WEBHOOK_SECRET is not configured");
    }

    const hmac = createHmac("sha256", PORTONE_V2_WEBHOOK_SECRET);
    const calculatedSignature = hmac.update(body).digest("hex");
    return calculatedSignature === signature;
}

function isValidPortOneStatus(status: string): status is PortOnePaymentStatus {
    return ["VIRTUAL_ACCOUNT_ISSUED", "PAID", "FAILED", "CANCELLED"].includes(
        status
    );
}

export async function POST(request: NextRequest) {
    try {
        // Get the raw request body as text for signature verification
        const rawBody = await request.text();
        const signature = request.headers.get("portone-signature");

        // Verify webhook signature
        if (!signature || !verifyWebhookSignature(rawBody, signature)) {
            return NextResponse.json(
                { success: false, error: "Invalid webhook signature" },
                { status: 401 }
            );
        }

        // Parse the body after verification
        const webhookData = JSON.parse(rawBody);
        const { event, data } = webhookData;

        if (event !== "PAYMENT_STATUS_CHANGED") {
            return NextResponse.json(
                { success: false, error: "Unhandled webhook event" },
                { status: 400 }
            );
        }

        const { payment } = data;

        // Validate payment status
        if (!isValidPortOneStatus(payment.status)) {
            return NextResponse.json(
                { success: false, error: "Invalid payment status" },
                { status: 400 }
            );
        }

        const result = await handleWebhook({
            eventType: event,
            paymentId: payment.payment_id,
            status: payment.status, // Now TypeScript knows this is PortOnePaymentStatus
            amount: payment.amount.total,
            currency: payment.currency,
            failureReason: payment.failure_reason,
            virtualAccountInfo: payment.virtual_account,
        });

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data,
        });
    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Internal server error",
            },
            { status: 500 }
        );
    }
}
