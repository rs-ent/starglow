import { NextResponse } from "next/server";

import type { NextRequest} from "next/server";

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        // 서버 콘솔에 웹 바이탈 데이터 출력
        console.log("[Web Vitals]", data);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Invalid JSON" },
            { status: 400 }
        );
    }
}

export function GET() {
    // GET 요청은 허용하지 않음
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
