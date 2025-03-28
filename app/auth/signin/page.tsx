/// app\auth\signin\page.tsx
"use client";

import { useEffect, useState } from "react";
import { getProviders } from "next-auth/react";
import SignInSocialButton from "@/components/atoms/SignInSocialButton";

export default function SignInPage() {
    const [providers, setProviders] = useState<Record<string, any> | null>(null);

    useEffect(() => {
        getProviders().then(setProviders);
    }, []);

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-background"
        >
            <div
                className="w-full max-w-md space-y-4 p-6 bg-background rounded-lg shadow-lg"
            >
                <h1 className="text-xl font-bold text-center">
                    Sign In
                </h1>

                {providers && Object.values(providers).map((provider) => (
                    <SignInSocialButton
                        key={provider.id}
                        providerId={provider.id}
                        providerName={provider.name}
                    />
                ))}
            </div>
        </div>
    )
}