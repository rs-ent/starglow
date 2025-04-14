/// app/api/telegram/integrate/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma/client";
import { auth } from "@/app/auth/authSettings";

export async function GET(req: NextRequest) {
    const baseUrl = req.nextUrl.origin;
    const telegramData = Object.fromEntries(req.nextUrl.searchParams.entries());

    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!telegramBotToken) {
        return NextResponse.json(
            { error: "Telegram bot token is not set" },
            { status: 500 }
        );
    }

    const { hash, ...dataWithoutHash } = telegramData;
    const dataCheckString = Object.entries(dataWithoutHash)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");

    const secretKey = crypto
        .createHash("sha256")
        .update(telegramBotToken)
        .digest();
    const calculatedHash = crypto
        .createHmac("sha256", secretKey)
        .update(dataCheckString)
        .digest("hex");

    if (calculatedHash !== hash) {
        return NextResponse.json({ error: "Invalid hash" }, { status: 403 });
    }

    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.redirect(`${baseUrl}/auth/signin`, { status: 302 });
    }

    const existingTelegramUser = await prisma.player.findUnique({
        where: { telegramId: dataWithoutHash.id },
    });

    const currentUserPlayer = await prisma.player.findUnique({
        where: { userId: session.user.id },
    });

    // 텔레그램 ID로 만들어진 Player가 있는 경우
    if (existingTelegramUser) {
        // 텔레그램 ID로 만들어진 Player가 현재 사용자가 아닌 경우
        if (
            existingTelegramUser.userId &&
            existingTelegramUser.userId !== session.user.id
        ) {
            return NextResponse.redirect(
                `${baseUrl}/user?integration=telegram_exists`,
                {
                    status: 302,
                }
            );
        }

        // 현재 사용자의 Player가 있는 경우
        if (currentUserPlayer) {
            // 텔레그램 ID로 만들어진 Player와
            // 현재 사용자의 Player가 같은 경우
            if (existingTelegramUser.userId === currentUserPlayer.userId) {
                return NextResponse.redirect(
                    `${baseUrl}/user?integration=telegram_success`,
                    {
                        status: 302,
                    }
                );
            }

            // 텔레그램 ID로 만들어진 Player에
            // 현재 사용자의 Player 정보를 업데이트
            await prisma.$transaction(async (tx) => {
                await tx.player.update({
                    where: { telegramId: dataWithoutHash.id },
                    data: {
                        userId: session.user.id,
                        name:
                            dataWithoutHash.username ||
                            `${dataWithoutHash.first_name || ""} ${
                                dataWithoutHash.last_name || ""
                            }`.trim(),
                        points: { increment: currentUserPlayer.points },
                        SGP: { increment: currentUserPlayer.SGP },
                        SGT: { increment: currentUserPlayer.SGT },
                        recommendedCount: {
                            increment: currentUserPlayer.recommendedCount,
                        },
                        lastConnectedAt: new Date(),
                    },
                });

                // 현재 사용자의 questLogs 이동
                await tx.questLog.updateMany({
                    where: { playerId: currentUserPlayer.id },
                    data: { playerId: dataWithoutHash.id },
                });

                await tx.rewardsLog.updateMany({
                    where: { playerId: currentUserPlayer.id },
                    data: { playerId: dataWithoutHash.id },
                });

                await tx.pollLog.updateMany({
                    where: { playerId: currentUserPlayer.id },
                    data: { playerId: dataWithoutHash.id },
                });

                await tx.player.delete({
                    where: { id: currentUserPlayer.id },
                });
            });

            return NextResponse.redirect(
                `${baseUrl}/user?integration=telegram_success`,
                {
                    status: 302,
                }
            );
        }

        // 현재 사용자에게 Player가 없는 경우
        await prisma.player.update({
            where: { telegramId: dataWithoutHash.id },
            data: {
                userId: session.user.id,
                lastConnectedAt: new Date(),
            },
        });

        return NextResponse.redirect(
            `${baseUrl}/user?integration=telegram_success`,
            {
                status: 302,
            }
        );
    }

    // 텔레그램 ID로 만들어진 Player가 없고,
    // 현재 사용자의 Player가 있는 경우
    if (currentUserPlayer) {
        await prisma.player.update({
            where: { id: currentUserPlayer.id },
            data: {
                telegramId: dataWithoutHash.id,
                name:
                    dataWithoutHash.username ||
                    `${dataWithoutHash.first_name || ""} ${
                        dataWithoutHash.last_name || ""
                    }`.trim(),
                lastConnectedAt: new Date(),
            },
        });

        return NextResponse.redirect(
            `${baseUrl}/user?integration=telegram_success`,
            {
                status: 302,
            }
        );
    }

    // 텔레그램 ID로 만들어진 Player가 없고,
    // 현재 사용자의 Player도 없는 경우
    // 새로운 Player 생성
    await prisma.player.create({
        data: {
            userId: session.user.id,
            telegramId: dataWithoutHash.id,
            lastConnectedAt: new Date(),
        },
    });

    return NextResponse.redirect(
        `${baseUrl}/user?integration=telegram_success`,
        {
            status: 302,
        }
    );
}
