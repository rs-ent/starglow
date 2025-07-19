import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { distributePrize } from "@/app/actions/raffles/onchain/actions-write";

const BATCH_SIZE = 50; // 한 번에 처리할 레코드 수
const MAX_RETRY_COUNT = 3;
const TIMEOUT_MINUTES = 30; // 30분 후 타임아웃

export async function GET(request: NextRequest) {
    try {
        // 🔐 cron 인증 체크
        const authHeader = request.headers.get("authorization");
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // 📊 처리 대상 레코드 조회 (PENDING 또는 재시도 대상)
        const pendingDistributions =
            await prisma.onchainRafflePrizeDistribution.findMany({
                where: {
                    OR: [
                        { status: "PENDING" },
                        {
                            status: "FAILED",
                            retryCount: { lt: MAX_RETRY_COUNT },
                            OR: [
                                { lastRetryAt: null },
                                {
                                    lastRetryAt: {
                                        lt: new Date(
                                            Date.now() -
                                                TIMEOUT_MINUTES * 60 * 1000
                                        ),
                                    },
                                },
                            ],
                        },
                    ],
                },
                orderBy: [
                    { status: "asc" }, // PENDING 먼저 처리
                    { createdAt: "asc" }, // 오래된 것부터
                ],
                take: BATCH_SIZE,
            });

        if (pendingDistributions.length === 0) {
            return NextResponse.json({
                message: "No pending distributions to process",
                processed: 0,
                success: 0,
                failed: 0,
            });
        }

        // 🔄 배치 단위로 처리
        const results = await Promise.allSettled(
            pendingDistributions.map(async (distribution) => {
                return await processDistribution(distribution);
            })
        );

        // 📈 결과 집계
        let successCount = 0;
        let failedCount = 0;

        results.forEach((result, index) => {
            if (result.status === "fulfilled" && result.value.success) {
                successCount++;
            } else {
                failedCount++;
                console.error(
                    `❌ Distribution ${pendingDistributions[index].id} failed:`,
                    result.status === "rejected"
                        ? result.reason
                        : result.value.error
                );
            }
        });

        return NextResponse.json({
            message: "Distribution processing completed",
            processed: pendingDistributions.length,
            success: successCount,
            failed: failedCount,
            batchSize: BATCH_SIZE,
        });
    } catch (error) {
        console.error("❌ Distribution cron job error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// 🎯 개별 분배 처리 함수
async function processDistribution(
    distribution: any
): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.onchainRafflePrizeDistribution.update({
            where: { id: distribution.id },
            data: {
                status: "PROCESSING",
                processedAt: new Date(),
            },
        });

        // 🎁 실제 상금 분배 실행
        const prize = {
            prizeType: distribution.prizeType,
            title: distribution.prizeTitle,
            assetId: distribution.assetId,
            collectionAddress: distribution.spgAddress,
            tokenAddress: distribution.tokenAddress,
            prizeQuantity: distribution.amount,
        };

        const distributionResult = await distributePrize({
            playerId: distribution.playerId,
            prize,
            prizeTitle: distribution.prizeTitle,
            playerWalletAddress: distribution.playerAddress,
        });

        if (distributionResult.success) {
            // ✅ 성공: DELIVERED 상태로 업데이트
            await prisma.onchainRafflePrizeDistribution.update({
                where: { id: distribution.id },
                data: {
                    distributedAt: new Date(),
                    transactionHash: distributionResult.txHash || null,
                    failureReason: null,
                },
            });

            return { success: true };
        } else {
            // ❌ 실패: 재시도 카운트 증가
            const newRetryCount = distribution.retryCount + 1;
            const shouldExpire = newRetryCount >= MAX_RETRY_COUNT;

            await prisma.onchainRafflePrizeDistribution.update({
                where: { id: distribution.id },
                data: {
                    status: shouldExpire ? "EXPIRED" : "FAILED",
                    retryCount: newRetryCount,
                    lastRetryAt: new Date(),
                    failureReason: distributionResult.error || "Unknown error",
                },
            });

            return {
                success: false,
                error: `Retry ${newRetryCount}/${MAX_RETRY_COUNT}: ${distributionResult.error}`,
            };
        }
    } catch (error) {
        console.error(
            `❌ Error processing distribution ${distribution.id}:`,
            error
        );

        // DB 업데이트 실패 시에도 상태 업데이트 시도
        try {
            await prisma.onchainRafflePrizeDistribution.update({
                where: { id: distribution.id },
                data: {
                    status: "FAILED",
                    retryCount: distribution.retryCount + 1,
                    lastRetryAt: new Date(),
                    failureReason:
                        error instanceof Error
                            ? error.message
                            : "Processing error",
                },
            });
        } catch (updateError) {
            console.error(
                `❌ Failed to update distribution status:`,
                updateError
            );
        }

        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown processing error",
        };
    }
}
