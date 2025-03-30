/// app/api/telegram/integrate/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma/client";
import { auth } from "@/app/auth/authSettings";
import { env } from "@/lib/config/env";

export async function GET(req: NextRequest) {
    const telegramData = Object.fromEntries(req.nextUrl.searchParams.entries());

    const telegramBotToken = env.TELEGRAM_BOT_TOKEN;
    if (!telegramBotToken) {
        return NextResponse.json({ error: "Telegram bot token is not set" }, { status: 500 });
    }

    const { hash, ...dataWithoutHash } = telegramData;
    const dataCheckString = Object.entries(dataWithoutHash)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");

    const secretKey = crypto.createHash('sha256').update(telegramBotToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash !== hash) {
        return NextResponse.json({ error: "Invalid hash" }, { status: 403 });
    }

    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.redirect('/auth/signin', { status: 302 });
    }

    const existingTelegramUser = await prisma.player.findUnique({
        where: { telegramId: dataWithoutHash.id },
    });

    if (existingTelegramUser && existingTelegramUser.userId !== session.user.id) {
        return NextResponse.redirect(new URL('/user?integration=telegram_exists', req.url), { status: 302 });
    }

    await prisma.player.update({
        where: { userId: session.user.id },
        data: {
            telegramId: dataWithoutHash.id,
            name: dataWithoutHash.username,
            lastConnectedAt: new Date(),
        },
    });

    return NextResponse.redirect(new URL('/user?integration=telegram_success', req.url), { status: 302 });
}