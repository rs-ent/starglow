/// app/actions/polls-bettingMode.ts

"use server";

import { prisma } from "@/lib/prisma/client";

export async function getBettingModePolls() {
    const polls = await prisma.poll.findMany({
        where: {
            bettingMode: true,
        },
    });

    return polls;
}
