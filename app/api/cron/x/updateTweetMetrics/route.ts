/// app/api/cron/x/updateMetrics/route.ts

import { NextResponse } from "next/server";
import { updateTweetMetrics } from "./updateTweetMetrics";

export async function GET(request: Request) {
    const auth = request.headers.get("Authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response("Unauthorized", { status: 401 });
    }

    const startTime = Date.now();

    try {
        console.log("🚀 Starting combined metrics update...");

        const [tweetMetricsResult] = await Promise.all([updateTweetMetrics()]);

        const totalExecutionTime = Date.now() - startTime;

        console.log("✅ Combined metrics update completed successfully");

        return NextResponse.json({
            ok: true,
            data: {
                tweetMetrics: {
                    totalProcessed: tweetMetricsResult.totalProcessed,
                    metricsUpdated: tweetMetricsResult.metricsUpdated,
                    apiRequestsUsed: tweetMetricsResult.apiRequestsUsed,
                    rateLimitRemaining: tweetMetricsResult.rateLimitRemaining,
                },
                summary: {
                    totalTweetMetricsUpdated: tweetMetricsResult.metricsUpdated,
                    totalApiRequests: tweetMetricsResult.apiRequestsUsed,
                    executionTimeMs: totalExecutionTime,
                    timestamp: new Date().toISOString(),
                },
            },
            rateLimits: {
                tweets: {
                    remaining: tweetMetricsResult.rateLimitRemaining,
                    endpoint: "GET /2/tweets",
                    limit: "15 requests/15min",
                },
            },
        });
    } catch (error) {
        console.error("❌ Combined metrics update failed:", error);

        return NextResponse.json(
            {
                ok: false,
                error: {
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                    timestamp: new Date().toISOString(),
                    executionTimeMs: Date.now() - startTime,
                },
            },
            { status: 500 }
        );
    }
}
