"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { getProviders } from "next-auth/react";
import SocialAuthButton from "@/components/atoms/SocialAuthButton";
import { Provider, ProviderType } from "@/app/types/auth";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/app/hooks/useToast";

const providerIcons: Record<ProviderType, string> = {
    google: "/icons/providers/google.svg",
    twitter: "/icons/providers/x.svg",
    kakao: "/icons/providers/kakao.svg",
    spotify: "/icons/providers/spotify.svg",
    coinbase: "/icons/providers/coinbase.svg",
};

const providerColors: Record<ProviderType, string> = {
    google: "bg-[rgba(255,255,255,1)] text-[rgba(0,0,0,1)] hover:bg-[rgba(255,255,255,1)] hover:text-[rgba(0,0,0,1)] hover:scale-105",
    twitter:
        "bg-[rgba(1,1,1,1)] text-[rgba(255,255,255,1)] hover:bg-[rgba(1,1,1,1)] hover:text-[rgba(255,255,255,1)] hover:scale-105",
    kakao: "bg-[rgba(254,230,8,1)] text-[rgba(0,0,0,1)] hover:bg-[rgba(254,230,8,1)] hover:text-[rgba(0,0,0,1)] hover:scale-105",
    spotify:
        "bg-[rgba(0,0,0,1)] text-[rgba(30,215,96,1)] hover:bg-[rgba(0,0,0,1)] hover:text-[rgba(30,215,96,1)] hover:scale-105",
    coinbase:
        "bg-[rgba(255,255,255,1)] text-[rgba(0,82,255,1)] hover:bg-[rgba(255,255,255,1)] hover:text-[rgba(0,82,255,1)] hover:scale-105",
};

function SignInButtons() {
    const toast = useToast();
    const [providers, setProviders] = useState<Record<string, Provider> | null>(
        null
    );
    const params = useSearchParams();
    const callbackUrl = params.get("callbackUrl") || "/";
    const error = params.get("error");

    useEffect(() => {
        if (error) {
            if (error === "OAuthAccountNotLinked") {
                toast.info(
                    "The email is already linked to another account. Please sign in using your original provider."
                );
            } else {
                toast.error("An error occurred while signing in");
            }
        }
    }, [error]);

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

    const DONOT_SHOW_PROVIDERS = ["kakao", "twitter", "spotify", "coinbase"];

    return (
        <div className="space-y-3">
            {Object.values(providers).map((provider) => {
                if (DONOT_SHOW_PROVIDERS.includes(provider.id)) {
                    return null;
                }
                return (
                    <SocialAuthButton
                        key={provider.id}
                        providerId={provider.id}
                        providerName={provider.name}
                        providerIcon={providerIcons[provider.id]}
                        providerColor={providerColors[provider.id]}
                        callbackUrl={callbackUrl}
                    />
                );
            })}
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
