"use client";

import { Suspense, useEffect, useState } from "react";
import { getProviders } from "next-auth/react";
import SocialAuthButton from "@/components/atoms/SocialAuthButton";
import { Provider } from "@/types/auth";
import { useSearchParams } from "next/navigation";

function SignInButtons() {
    const [providers, setProviders] = useState<Record<string, Provider> | null>(null);
    const params = useSearchParams();
    const callbackUrl = params.get("callbackUrl") || "/";

    useEffect(() => {
        getProviders().then((result) => {
            setProviders(result as Record<string, Provider>);
        });
    }, []);

    return providers ? (
        <>
            {Object.values(providers).map((provider) => (
                <SocialAuthButton
                    key={provider.id}
                    providerId={provider.id}
                    providerName={provider.name}
                    callbackUrl={callbackUrl}
                />
            ))}
        </>
    ) : (
        <div>Loading providers...</div>
    );
}

export default function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="w-full max-w-md space-y-4 p-6 bg-background rounded-lg shadow-lg">
                <h1 className="text-xl font-bold text-center">Sign In</h1>
                <Suspense fallback={<div>Loading...</div>}>
                    <SignInButtons />
                </Suspense>
            </div>
        </div>
    );
}
