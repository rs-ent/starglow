/// app/api/cron/staking/route.ts

import { NextResponse } from "next/server";

import { findRewardableStakeTokens } from "@/app/actions/staking";

export async function GET(request: Request) {
    const auth = request.headers.get("Authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response("Unauthorized", { status: 401 });
    }

    const result = await findRewardableStakeTokens();
    return NextResponse.json({
        ok: true,
        result,
        count: result.length,
    });
}
