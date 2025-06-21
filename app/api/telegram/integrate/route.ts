/// app/api/telegram/integrate/route.ts

import { NextResponse } from "next/server";

import { auth } from "@/app/auth/authSettings";
import { prisma } from "@/lib/prisma/client";

import type { NextRequest} from "next/server";

export async function GET(req: NextRequest) {
    const baseUrl = req.nextUrl.origin;

    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.redirect(`${baseUrl}/auth/signin`, { status: 302 });
    }

    const player = await prisma.player.findFirst({
        where: {
            userId: session.user.id,
            telegramId: { not: null },
        },
    });

    if (!player) {
        return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ user: player }, { status: 200 });
}

export async function DELETE(req: NextRequest) {
    const baseUrl = req.nextUrl.origin;
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.redirect(`${baseUrl}/auth/signin`, { status: 302 });
    }

    await prisma.player.update({
        where: { userId: session.user.id },
        data: {
            telegramId: null,
        },
    });

    return NextResponse.json({ success: true }, { status: 200 });
}
