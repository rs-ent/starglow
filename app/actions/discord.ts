/// app/actions/discord.ts

"use server";

import { prisma } from "@/lib/prisma/client";

import {
    getWalletAddressVerifiedSPGs,
    getUserVerifiedSPGs,
} from "../story/interaction/actions";

import type { VerifiedSPG } from "../story/interaction/actions";
import type { User } from "next-auth";

export interface CreateDiscordCodeInput {
    user: User;
}

export async function createDiscordCode({
    input,
}: {
    input: CreateDiscordCodeInput;
}): Promise<{ id: string; code: string; expiresAt: Date; userId: string }> {
    const { user } = input;

    // user.id가 없으면 에러 발생
    if (!user.id) {
        throw new Error("User ID is required");
    }

    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    let existingDiscordCode = null;

    // do-while로 최소 한 번은 실행되도록 보장
    do {
        // 코드 초기화 후 새로 생성
        code = "";
        for (let i = 0; i < 8; i++) {
            code += characters.charAt(
                Math.floor(Math.random() * characters.length)
            );
        }

        // 중복 검사
        existingDiscordCode = await prisma.discordCode.findFirst({
            where: { code },
        });
    } while (existingDiscordCode);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const discordCode = await prisma.discordCode.create({
        data: {
            code,
            expiresAt,
            userId: user.id,
        },
    });

    return discordCode;
}

export interface VerifyInput {
    type: "wallet" | "code";
    discordId: string;
    target: string;
}

export async function verify({ input }: { input: VerifyInput }): Promise<{
    success: boolean;
    message?: string;
    collections?: Array<{
        name: string;
        symbol: string;
        verifiedTokens: number[];
        artist: string | null;
        network: string | null;
    }>;
}> {
    const { type, target, discordId } = input;

    try {
        const result = await prisma.$transaction(async (tx) => {
            let verifiedSPGs: VerifiedSPG[] = [];

            if (type === "wallet") {
                const walletAddress = target;

                const wallet = await tx.wallet.findUnique({
                    where: {
                        address: walletAddress,
                    },
                    select: {
                        userId: true,
                    },
                });

                if (wallet) {
                    await tx.user.update({
                        where: {
                            id: wallet.userId,
                        },
                        data: {
                            discordId,
                        },
                    });
                }

                verifiedSPGs = await getWalletAddressVerifiedSPGs(
                    walletAddress
                );
            } else if (type === "code") {
                const code = target;
                const discordCode = await tx.discordCode.findUnique({
                    where: { code },
                    select: {
                        userId: true,
                        expiresAt: true,
                    },
                });

                if (!discordCode) {
                    return {
                        success: false,
                        message: "Invalid or expired verification code",
                    };
                }

                const now = new Date();
                if (discordCode.expiresAt < now) {
                    return {
                        success: false,
                        message: "Code expired",
                    };
                }

                await tx.user.update({
                    where: { id: discordCode.userId },
                    data: {
                        discordId,
                    },
                });

                // 사용된 코드 삭제 (일회성 사용)
                await tx.discordCode.delete({
                    where: { code },
                });

                verifiedSPGs = await getUserVerifiedSPGs({
                    userId: discordCode.userId,
                });
            }

            // NFT가 없는 경우
            const hasNFTs = verifiedSPGs.some(
                (spg) => spg.verifiedTokens.length > 0
            );
            if (!hasNFTs) {
                return {
                    success: false,
                    message: "No NFT ownership found",
                };
            }

            // Discord 봇이 기대하는 형식으로 변환
            const collections = verifiedSPGs
                .filter((spg) => spg.verifiedTokens.length > 0)
                .map((spg) => ({
                    name: spg.name,
                    symbol: spg.symbol,
                    verifiedTokens: spg.verifiedTokens,
                    artist: spg.artist?.name || null,
                    network: spg.network?.name || null,
                }));

            return {
                success: true,
                collections,
            };
        });

        return result;
    } catch (error) {
        console.error("Verify error:", error);
        return {
            success: false,
            message: "Verification failed",
        };
    }
}

export interface VerifyHolderByDiscordIdInput {
    discordId: string;
}

export async function verifyHolderByDiscordId({
    input,
}: {
    input: VerifyHolderByDiscordIdInput;
}): Promise<{
    success: boolean;
    message: string;
    collections: Array<{
        name: string;
        symbol: string;
        verifiedTokens: number[];
        artist: string | null;
        network: string | null;
    }>;
}> {
    const { discordId } = input;

    try {
        // Discord ID로 사용자 찾기
        const user = await prisma.user.findFirst({
            where: {
                discordId,
            },
            select: {
                id: true,
            },
        });

        if (!user) {
            return {
                success: false,
                message: "User not found with this Discord ID",
                collections: [],
            };
        }

        // 사용자의 검증된 SPG NFT 가져오기
        const verifiedSPGs = await getUserVerifiedSPGs({
            userId: user.id,
        });

        // NFT가 없는 경우
        const hasNFTs = verifiedSPGs.some(
            (spg) => spg.verifiedTokens.length > 0
        );

        if (!hasNFTs) {
            return {
                success: false,
                message: "No NFT ownership found",
                collections: [],
            };
        }

        const collections = verifiedSPGs
            .filter((spg) => spg.verifiedTokens.length > 0)
            .map((spg) => ({
                name: spg.name,
                symbol: spg.symbol,
                verifiedTokens: spg.verifiedTokens,
                artist: spg.artist?.name || null,
                network: spg.network?.name || null,
            }));

        return {
            success: true,
            message: "Verification successful",
            collections,
        };
    } catch (error) {
        console.error("VerifyHolderByDiscordId error:", error);
        return {
            success: false,
            message: "Verification failed",
            collections: [],
        };
    }
}
