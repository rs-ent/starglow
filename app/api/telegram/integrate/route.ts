/// app/api/telegram/integrate/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { auth } from "@/app/auth/authSettings";

export async function DELETE() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.redirect('/auth/signin', { status: 302 });
    }

    await prisma.player.update({
        where: { userId: session.user.id },
        data: {
            telegramId: null,
            name: null,
        },
    });

    return NextResponse.json({ message: "Telegram integration successfully unlinked." }, { status: 200 });
}