import { NextResponse } from "next/server";
import { handlePortOneWebhook } from "@/app/actions/payment";
import { prisma } from "@/lib/prisma/client";

const WEBHOOK_SECRET = process.env.PORTONE_WEBHOOK_SECRET;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const signature = request.headers.get("x-portone-signature");
        if (!signature || signature !== WEBHOOK_SECRET) {
            await prisma.webhookEvent.create({
                data: {
                    description: "Invalid signature",
                    payload: body,
                },
            });
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 401 }
            );
        }

        console.log("PortOne webhook body", body);
        await prisma.webhookEvent.create({
            data: {
                description: "PortOne webhook received",
                payload: body,
            },
        });
        await handlePortOneWebhook(body);

        return NextResponse.json(
            { message: "Webhook received" },
            { status: 200 }
        );
    } catch (error) {
        console.error("PortOne webhook error", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
