/// app/api/verify/discord/holder/route.ts

import { NextResponse } from "next/server";

import { verifyHolderByDiscordId } from "@/app/actions/discord";

import type { NextRequest} from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const discordId = searchParams.get("discord_id");

        if (!discordId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "discord_id parameter is required",
                    collections: [],
                },
                { status: 400 }
            );
        }

        const result = await verifyHolderByDiscordId({
            input: { discordId },
        });

        return NextResponse.json(result, {
            status: result.success ? 200 : 404,
        });
    } catch (error) {
        console.error("Discord holder verification API error:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Internal server error",
                collections: [],
            },
            { status: 500 }
        );
    }
}
