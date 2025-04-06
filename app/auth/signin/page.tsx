"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { getProviders } from "next-auth/react";
import SocialAuthButton from "@/components/atoms/SocialAuthButton";
import { Provider } from "@/app/types/auth";
import { useSearchParams } from "next/navigation";

function SignInButtons() {
    const [providers, setProviders] = useState<Record<string, Provider> | null>(
        null
    );
    const params = useSearchParams();
    const callbackUrl = params.get("callbackUrl") || "/";

    const fetchProviders = useCallback(async () => {
        try {
            const result = await getProviders();
            setProviders(result as Record<string, Provider>);
        } catch (error) {
            console.error("Failed to fetch providers:", error);
            setProviders({});
        }
    }, []);

    useEffect(() => {
        fetchProviders();
    }, [fetchProviders]);

    if (!providers) {
        return <div className="animate-pulse">Loading providers...</div>;
    }

    return (
        <div className="space-y-3">
            {Object.values(providers).map((provider) => (
                <SocialAuthButton
                    key={provider.id}
                    providerId={provider.id}
                    providerName={provider.name}
                    callbackUrl={callbackUrl}
                />
            ))}
        </div>
    );
}

export default function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="w-full max-w-md space-y-4 p-6 bg-background rounded-lg shadow-lg">
                <h1 className="text-xl font-bold text-center">Sign In</h1>
                <Suspense
                    fallback={<div className="animate-pulse">Loading...</div>}
                >
                    <SignInButtons />
                </Suspense>
            </div>
        </div>
    );
}
