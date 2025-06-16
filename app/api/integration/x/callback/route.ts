// app/api/auth/x/callback/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
        return new NextResponse(
            `
            <script>
                window.opener.postMessage({
                    type: 'X_AUTH_ERROR',
                    error: 'Missing authorization parameters'
                }, '*');
                window.close();
            </script>
        `,
            { headers: { "Content-Type": "text/html" } }
        );
    }

    // 단순히 코드와 state를 클라이언트로 전달
    return new NextResponse(
        `
        <script>
            window.opener.postMessage({
                type: 'X_AUTH_SUCCESS',
                code: '${code}',
                state: '${state}'
            }, '*');
            window.close();
        </script>
    `,
        { headers: { "Content-Type": "text/html" } }
    );
}
