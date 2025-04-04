"use server";

import { prisma } from "@/lib/prisma/client";
import { PaymentStatus } from "@prisma/client";
import { env } from "@/lib/config/env";
import { encrypt, decrypt } from "@/lib/utils/encryption";

export interface PaymentReadyRequest {
    sessionHash: string;
    userId: string;
    table: string;
    target: string;
    quantity: number;
    currency: string;
    method: string;
}

export interface PaymentReadyResponse {
    paymentId: string; // 결제 로그 ID
    sessionHash: string; // 부모 컴포넌트에서 받아오는 세션 해시 (주문 페이지 생성 -> 서버로 전달 -> 버튼으로 전달 -> 서버 & 클라이언트에서 결제 키 검증)
    paymentKey: string; // 서버에서 생성된 결제 키 (서버에서 생성 -> 버튼으로 전달 -> 서버에서 결제 키 검증)
    storeId: string; // 포트원 스토어 ID
    channelKey: string; // 포트원 채널 키
    userId: string; // 유저 ID
    amount: number; // 이벤트 가격
    quantity: number; // 구매 수량
    totalAmount: number; // 총 결제 금액
    orderName: string; // 상품명
    orderId: string; // 주문 ID
    currency: string; // 화폐 단위
    method: string; // 결제 방법
}

export async function getReadyPayment({
    userId,
    table,
    target,
    quantity,
    sessionHash,
    currency,
    method,
}: PaymentReadyRequest) {
    const storeId = env.PORTONE_MID;
    const channelKey = env.PORTONE_PAYPAL_CHANNEL_KEY;

    if (table === "events") {
        const event = await prisma.events.findUnique({
            where: {
                id: target,
            },
            select: {
                title: true,
                price: true,
            },
        });

        if (!event) {
            throw new Error("Event not found");
        }

        const amount = event.price || 0;
        const totalAmount = amount * quantity;
        const orderName = `${event.title} - ${quantity}`;

        const orderId = `event-${target}-${userId}-${Date.now()}`;
        const paymentKey = encrypt(orderId);
        const log = await prisma.payment.create({
            data: {
                sessionHash,
                userId,
                orderId,
                orderName,
                amount,
                currency,
                method,
                paymentKey,
                status: PaymentStatus.CREATED,
            },
        });

        const response: PaymentReadyResponse = {
            paymentId: log.id,
            sessionHash,
            paymentKey,
            storeId,
            channelKey,
            userId,
            amount,
            quantity,
            totalAmount,
            orderName,
            orderId,
            currency,
            method,
        };

        return response;
    }
}
