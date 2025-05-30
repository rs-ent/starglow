/// components/atoms/AuthButton.tsx

"use client";

import {signIn, useSession} from "next-auth/react";
import {LoaderCircle, LogIn} from "lucide-react";
import Button from "./Button";
import {useLoading} from "@/app/hooks/useLoading";
import {usePathname, useRouter} from "next/navigation";
import {memo, useCallback} from "react";

interface AuthButtonProps {
    frameSize?: number;
    textSize?: number;
    paddingSize?: number;
    gapSize?: number;
    className?: string;
    variant?:
        | "default"
        | "space"
        | "destructive"
        | "outline"
        | "secondary"
        | "ghost"
        | "link";
}

/**
 * 로그인 버튼을 표시하는 컴포넌트
 * 사용자가 이미 로그인한 경우 아무것도 표시하지 않음
 */
const AuthButton = memo(function AuthButton({
    frameSize = 20,
    textSize = 20,
    paddingSize = 20,
    gapSize = 20,
    className = "",
    variant = "default",
}: AuthButtonProps) {
    const { data: session, status } = useSession();
    const { startLoading, stopLoading } = useLoading();
    const pathname = usePathname();
    const router = useRouter();

    // 로그인 핸들러
    const handleSignIn = useCallback(async () => {
        try {
            startLoading();
            await signIn(undefined, {
                callbackUrl: pathname,
            });
        } catch (error) {
            console.error("Sign in error:", error);
            stopLoading();
            router.push("/auth/error");
        }
    }, [pathname, router, startLoading, stopLoading]);

    // 로딩 상태 처리
    if (status === "loading") {
        return (
            <Button
                disabled={true}
                variant={variant}
                className={className}
                frameSize={frameSize}
                textSize={textSize}
                paddingSize={paddingSize}
                gapSize={gapSize}
                icon={LoaderCircle}
                iconSpinning={true}
                aria-label="Authentication in progress"
            >
                Loading
            </Button>
        );
    }

    // 로그인되지 않은 경우에만 로그인 버튼 표시
    return (
        (!session || !session.user) && (
            <Button
                onClick={handleSignIn}
                variant={variant}
                className={className}
                frameSize={frameSize}
                textSize={textSize}
                paddingSize={paddingSize}
                gapSize={gapSize}
                icon={LogIn}
                aria-label="Sign in to your account"
            >
                Sign In
            </Button>
        )
    );
});

export default AuthButton;