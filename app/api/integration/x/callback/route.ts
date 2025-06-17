// app/api/integration/x/callback/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // 모바일 환경 감지
    const userAgent = request.headers.get("user-agent") || "";
    const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            userAgent
        );

    if (error) {
        if (isMobile) {
            // 모바일: 에러와 함께 원래 페이지로 redirect
            const redirectUrl =
                request.nextUrl.origin +
                "/user?x_auth_error=" +
                encodeURIComponent(error);
            return NextResponse.redirect(redirectUrl);
        } else {
            // 데스크톱: 기존 postMessage 방식
            return new NextResponse(
                `
                <script>
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'X_AUTH_ERROR',
                            error: '${error}'
                        }, '*');
                        window.close();
                    } else {
                        // fallback for mobile
                        window.location.href = '${request.nextUrl.origin}/user?x_auth_error=' + encodeURIComponent('${error}');
                    }
                </script>
            `,
                { headers: { "Content-Type": "text/html" } }
            );
        }
    }

    if (!code || !state) {
        const errorMsg = "Missing authorization parameters";

        if (isMobile) {
            // 모바일: 에러와 함께 원래 페이지로 redirect
            const redirectUrl =
                request.nextUrl.origin +
                "/user?x_auth_error=" +
                encodeURIComponent(errorMsg);
            return NextResponse.redirect(redirectUrl);
        } else {
            // 데스크톱: 기존 postMessage 방식
            return new NextResponse(
                `
                <script>
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'X_AUTH_ERROR',
                            error: '${errorMsg}'
                        }, '*');
                        window.close();
                    } else {
                        // fallback for mobile
                        window.location.href = '${request.nextUrl.origin}/user?x_auth_error=' + encodeURIComponent('${errorMsg}');
                    }
                </script>
            `,
                { headers: { "Content-Type": "text/html" } }
            );
        }
    }

    if (isMobile) {
        // 모바일: 성공 파라미터와 함께 원래 페이지로 redirect
        const redirectUrl =
            request.nextUrl.origin +
            "/user?x_auth_code=" +
            encodeURIComponent(code) +
            "&x_auth_state=" +
            encodeURIComponent(state);
        return NextResponse.redirect(redirectUrl);
    } else {
        // 데스크톱: 기존 postMessage 방식
        return new NextResponse(
            `
            <script>
                if (window.opener) {
                    window.opener.postMessage({
                        type: 'X_AUTH_SUCCESS',
                        code: '${code}',
                        state: '${state}'
                    }, '*');
                    window.close();
                } else {
                    // fallback for mobile
                    window.location.href = '${request.nextUrl.origin}/user?x_auth_code=' + encodeURIComponent('${code}') + '&x_auth_state=' + encodeURIComponent('${state}');
                }
            </script>
        `,
            { headers: { "Content-Type": "text/html" } }
        );
    }
}
