/// app/actions/user.ts

"use server";

import { prisma } from "@/lib/prisma/client";
import { User } from "@prisma/client";

export interface GetUserByEmailInput {
    email: string;
}

export async function getUserByEmail(
    input?: GetUserByEmailInput
): Promise<User | null> {
    try {
        if (!input) {
            return null;
        }

        const user = await prisma.user.findUnique({
            where: { email: input.email },
        });
        return user;
    } catch (error) {
        console.error("Failed to get user by email", error);
        throw error;
    }
}


