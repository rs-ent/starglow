"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    return (
        <div className="w-full max-w-md space-y-4 p-6 bg-background rounded-lg shadow-lg">
            <h1 className="text-xl font-bold text-center text-destructive">
                Authentication Error
            </h1>
            <p className="text-center text-muted-foreground">
                {error === "Configuration"
                    ? "There was a problem with the server configuration."
                    : "An error occurred during authentication."}
            </p>
            <div className="flex justify-center">
                <Link
                    href="/auth/signin"
                    className="text-primary hover:text-accent transition-colors"
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
            <Suspense fallback={<div>Loading...</div>}>
                <ErrorContent />
            </Suspense>
        </div>
    );
}
