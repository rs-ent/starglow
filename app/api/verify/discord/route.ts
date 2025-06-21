import { NextResponse } from "next/server";

import { verify } from "@/app/actions/discord";

import type { NextRequest} from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");
        const wallet = searchParams.get("wallet");
        const discordId = searchParams.get("discord_id");

        // 입력값 검증
        if (!discordId) {
            return NextResponse.json(
                { error: "Discord ID is required" },
                { status: 400 }
            );
        }

        let type: "code" | "wallet";
        let target: string;

        if (code) {
            // 코드 형식 검증 (8자리 대문자+숫자)
            if (!/^[A-Z0-9]{8}$/.test(code)) {
                return NextResponse.json(
                    { error: "Invalid code format" },
                    { status: 400 }
                );
            }
            type = "code";
            target = code;
        } else if (wallet) {
            // 지갑 주소 형식 검증
            if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
                return NextResponse.json(
                    { error: "Invalid wallet address format" },
                    { status: 400 }
                );
            }
            type = "wallet";
            target = wallet;
        } else {
            return NextResponse.json(
                { error: "Code or wallet address is required" },
                { status: 400 }
            );
        }

        // 검증 실행
        const result = await verify({
            input: { type, target, discordId },
        });

        // 결과에 따른 HTTP 상태 코드 매핑
        if (result.success) {
            // Discord 봇이 len(data)와 배열 요소에 접근하므로 배열 직접 반환
            return NextResponse.json(result.collections, { status: 200 });
        } else {
            // 실패 케이스별 상태 코드 매핑
            switch (result.message) {
                case "Invalid or expired verification code":
                    return NextResponse.json(
                        { error: result.message },
                        { status: 404 }
                    );
                case "Code expired":
                    return NextResponse.json(
                        { error: result.message },
                        { status: 410 }
                    );
                case "No NFT ownership found":
                    // 200 + success: false → Discord 봇이 API 메시지 표시
                    return NextResponse.json(
                        { success: false, message: result.message },
                        { status: 200 }
                    );
                default:
                    return NextResponse.json(
                        { error: "Verification failed" },
                        { status: 500 }
                    );
            }
        }
    } catch (error) {
        console.error("Discord verify API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
