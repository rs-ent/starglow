"use client";

import { Suspense, useMemo } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
    Configuration: "There was a problem with the server configuration.",
    AccessDenied: "You do not have permission to sign in.",
    Verification: "The verification link is no longer valid.",
    Default: "An error occurred during authentication.",
};

function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error") || "Default";

    const errorMessage = useMemo(
        () => ERROR_MESSAGES[error] || ERROR_MESSAGES.Default,
        [error]
    );

    return (
        <div className="w-full max-w-md space-y-4 p-6 bg-background rounded-lg shadow-lg">
            <h1 className="text-xl font-bold text-center text-destructive">
                Authentication Error
            </h1>
            <p className="text-center text-muted-foreground">{errorMessage}</p>
            <div className="flex justify-center">
                <Link
                    href="/auth/signin"
                    className="text-primary hover:text-accent transition-colors"
                    prefetch={false}
                >
                    Try again
                </Link>
            </div>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Suspense
                fallback={<div className="animate-pulse">Loading...</div>}
            >
                <ErrorContent />
            </Suspense>
        </div>
    );
}
