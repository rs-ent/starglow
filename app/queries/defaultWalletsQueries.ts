/// app/queries/defaultWalletsQueries.ts

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKeys";
import { prisma } from "@/lib/prisma/client";
import { auth } from "../auth/authSettings";
import { Wallet } from "@prisma/client";

export async function getUserPolygonWallet(): Promise<string | null> {
    const session = await auth();
    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const userId = session.user.id;

    const wallet = await prisma.wallet.findFirst({
        where: {
            userId,
            network: "polygon",
            status: "ACTIVE",
        },
        select: {
            address: true,
        },
    });

    return wallet?.address || null;
}

export function usePolygonWallet() {
    return useQuery({
        queryKey: queryKeys.defaultWallets.polygon,
        queryFn: getUserPolygonWallet,
    });
}
