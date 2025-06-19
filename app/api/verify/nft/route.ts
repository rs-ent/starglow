/// app/api/verify/nft/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getWalletAddressVerifiedSPGs } from "@/app/story/interaction/actions";

export async function GET(req: NextRequest) {
    const address = req.nextUrl.searchParams.get("address");
    if (!address) {
        return NextResponse.json(
            { error: "No address provided" },
            { status: 400 }
        );
    }
    try {
        const result = await getWalletAddressVerifiedSPGs(address);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
