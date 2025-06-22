/// app/api/cron/x/updateMetrics/route.ts

import { NextResponse } from "next/server";

import { updateAuthorMetrics } from "../updateAuthorMetrics/updateTweetAuthorMetrics";

export async function GET(request: Request) {
    const auth = request.headers.get("Authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response("Unauthorized", { status: 401 });
    }

    const startTime = Date.now();

    try {
        const [authorMetricsResult] = await Promise.all([
            updateAuthorMetrics(),
        ]);

        const totalExecutionTime = Date.now() - startTime;

        return NextResponse.json({
            ok: true,
            data: {
                authorMetrics: {
                    totalProcessed: authorMetricsResult.totalProcessed,
                    metricsUpdated: authorMetricsResult.metricsUpdated,
                    apiRequestsUsed: authorMetricsResult.apiRequestsUsed,
                    rateLimitRemaining: authorMetricsResult.rateLimitRemaining,
                },
                summary: {
                    totalAuthorMetricsUpdated:
                        authorMetricsResult.metricsUpdated,
                    totalApiRequests: authorMetricsResult.apiRequestsUsed,
                    executionTimeMs: totalExecutionTime,
                    timestamp: new Date().toISOString(),
                },
            },
            rateLimits: {
                users: {
                    remaining: authorMetricsResult.rateLimitRemaining,
                    endpoint: "GET /2/users",
                    limit: "500 requests/24h",
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
