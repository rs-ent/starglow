/// lib\prisma\user.ts

import { prisma } from "./client";

export async function getUserById(id: string) {
    return prisma.user.findUnique({
        where: { id },
        include: {
            accounts: true,
            sessions: true,
        },
    });
}