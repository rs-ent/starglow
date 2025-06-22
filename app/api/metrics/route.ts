import { NextResponse } from "next/server";

export async function POST() {
    try {
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Metrics error:", error);
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
