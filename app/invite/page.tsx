/// app\invite\page.tsx

import AuthGuard from "../auth/authGuard";
import { prisma } from "@/lib/prisma/client";
import { auth } from "../auth/authSettings";
import { redirect } from "next/navigation";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function InviteAuthPage({
    searchParams,
}: {
    searchParams: SearchParams;
}) {
    const { referral, method } = await searchParams;
    console.log("Ref: ", referral, "Method: ", method);

    if (!referral || typeof referral !== "string") {
        return <div>Invalid Ref</div>;
    }

    if (!method || typeof method !== "string") {
        return <div>Invalid Method</div>;
    }

    return (
        <AuthGuard callbackUrl={`/invite?ref=${referral}`}>
            <InvitePage referral={referral} method={method} />
        </AuthGuard>
    );
}

async function InvitePage({
    referral,
    method,
}: {
    referral: string;
    method: string;
}) {
    const session = await auth();

    try {
        let referrer;
        let currentPlayer = await prisma.player.findUnique({
            where: {
                userId: session!.user?.id,
            },
            select: {
                id: true,
                userId: true,
                telegramId: true,
                recommenderId: true,
                recommenderMethod: true,
                recommenderName: true,
            },
        });

        if (!currentPlayer) {
            currentPlayer = await prisma.player.create({
                data: {
                    userId: session!.user!.id,
                    name: session!.user!.name || "",
                },
                select: {
                    id: true,
                    userId: true,
                    telegramId: true,
                    recommenderId: true,
                    recommenderMethod: true,
                    recommenderName: true,
                },
            });
        }

        if (currentPlayer.recommenderId) {
            return (
                <div>
                    You are already invited by {currentPlayer?.recommenderName}
                </div>
            );
        }

        if (method === "Telegram") {
            referrer = await prisma.player.findUnique({
                where: {
                    telegramId: referral,
                },
                select: {
                    id: true,
                    userId: true,
                    telegramId: true,
                    recommendedCount: true,
                    name: true,
                },
            });
        } else if (method === "Web App") {
            referrer = await prisma.player.findUnique({
                where: {
                    id: referral,
                },
                select: {
                    id: true,
                    userId: true,
                    telegramId: true,
                    recommendedCount: true,
                    name: true,
                },
            });
        } else {
            return <div>Invalid method</div>;
        }

        if (!referrer) {
            return <div>Referrer not found</div>;
        }

        if (
            referrer?.userId === currentPlayer?.userId ||
            referrer?.telegramId === currentPlayer?.telegramId
        ) {
            return <div>You cannot invite yourself</div>;
        }

        await prisma.$transaction([
            prisma.player.update({
                where: { userId: currentPlayer.userId! },
                data: {
                    recommenderId: referrer.id,
                    recommenderMethod: method,
                    recommenderName: referrer.name || "",
                },
            }),
            prisma.player.update({
                where: { id: referrer.id },
                data: {
                    recommendedCount: { increment: 1 },
                },
            }),
        ]);

        redirect("/quests");
    } catch (error: any) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <div>
            <h1>Invite</h1>
            <p>Ref: {referral}</p>
            <p>Method: {method}</p>
        </div>
    );
}
