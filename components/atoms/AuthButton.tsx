/// components/atoms/AuthButton.tsx

"use client";

import { memo, useCallback } from "react";

import { LogIn } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

import { useLoading } from "@/app/hooks/useLoading";
import { cn } from "@/lib/utils/tailwind";

import Button from "./Button";

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
    const { startLoading, endLoading } = useLoading();
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
            endLoading();
            router.push("/auth/error");
        }
    }, [pathname, router, startLoading, endLoading]);

    // 로그인되지 않은 경우에만 로그인 버튼 표시
    return (
        (!session || !session.user) && (
            <Button
                onClick={handleSignIn}
                variant={variant}
                className={cn(
                    status === "loading" ? "hidden" : "block",
                    "flex flex-row",
                    className
                )}
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
