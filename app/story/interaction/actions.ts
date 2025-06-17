/// app/story/interaction/actions.ts

import { Story_spg, Artist, BlockchainNetwork } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";
import { getOwners } from "../nft/actions";

export interface GetUserVerifiedSPGsInput {
    userId: string;
}

export type VerifiedSPG = Story_spg & {
    artist: Artist | null;
    network: BlockchainNetwork | null;
    verifiedTokens: number[];
};

export async function getUserVerifiedSPGs(
    input?: GetUserVerifiedSPGsInput
): Promise<VerifiedSPG[]> {
    console.log("input", input);
    if (!input || !input.userId) {
        return [];
    }

    try {
        const [wallets, spgs] = await Promise.all([
            prisma.wallet.findMany({
                where: {
                    userId: input.userId,
                },
                select: {
                    address: true,
                },
            }),
            prisma.story_spg.findMany({
                include: {
                    artist: true,
                    network: true,
                },
            }),
        ]);

        const spgsWithTokenOwners = await Promise.all(
            spgs.map(async (spg) => {
                const tokenOwners = await getOwners({
                    spgAddress: spg.address,
                });
                const verifiedTokens = tokenOwners
                    .filter((data) =>
                        wallets.some(
                            (wallet) =>
                                wallet.address.toLowerCase() ===
                                data.owner.toLowerCase()
                        )
                    )
                    .map((data) => Number(data.tokenId));
                return {
                    ...spg,
                    verifiedTokens,
                };
            })
        );

        return spgsWithTokenOwners;
    } catch (error) {
        console.error("Error getting user verified SPGs:", error);
        return [];
    }
}
