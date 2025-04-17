import { NextResponse } from "next/server";
import { handlePortOneWebhook } from "@/app/actions/webhook";

// 웹훅 시크릿 키
const WEBHOOK_SECRET = process.env.PORTONE_WEBHOOK_SECRET;

export async function POST(request: Request) {
    try {
        // 1. 웹훅 시크릿 검증
        const signature = request.headers.get("x-portone-signature");
        if (!signature || signature !== WEBHOOK_SECRET) {
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 401 }
            );
        }

        // 2. 웹훅 데이터 파싱
        const body = await request.json();

        // 3. 웹훅 처리
        await handlePortOneWebhook(body);

        // 4. 응답
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Webhook processing failed:", error);
        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 }
        );
    }
}
