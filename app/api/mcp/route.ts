import { NextResponse } from "next/server";
import mcpApi from "@/lib/mcp";

export async function GET() {
    try {
        const data = await mcpApi.getData();
        return NextResponse.json(data);
    } catch (error) {
        console.error("MCP API Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch data from MCP server" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const data = await mcpApi.postData(body);
        return NextResponse.json(data);
    } catch (error) {
        console.error("MCP API Error:", error);
        return NextResponse.json(
            { error: "Failed to post data to MCP server" },
            { status: 500 }
        );
    }
}
