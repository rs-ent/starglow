/// app/api/cron/x/route.ts

import { NextResponse } from "next/server";

import { fetchTaggedTweets } from "./fetchTaggedTweets";

export async function GET(request: Request) {
    const auth = request.headers.get("Authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const result = await fetchTaggedTweets();
        return NextResponse.json({
            ok: true,
            data: {
                newTweets: result.new,
                totalFound: result.total,
                timeRange: result.timeRange,
                lastTweetId: result.lastTweetId,
            },
            sync: {
                id: result.syncDataId,
                timestamp: result.timestamp,
                apiRequestsUsed: result.apiRequestsUsed,
                rateLimitRemaining: result.rateLimitRemaining,
            },
        });
    } catch (error) {
        console.error("Cron job failed:", error);
        return NextResponse.json(
            {
                ok: false,
                error: {
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                    timestamp: new Date().toISOString(),
                },
            },
            { status: 500 }
        );
    }
}
