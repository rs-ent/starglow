"use client";

import { Suspense, useEffect, useState, useCallback } from "react";

import { useSearchParams, useRouter } from "next/navigation";
import { getProviders, signIn } from "next-auth/react";

import { useToast } from "@/app/hooks/useToast";
import { useSessionRecovery } from "@/app/hooks/useSessionRecovery";
import { WALLET_PROVIDERS } from "@/app/types/auth";
import PartialLoading from "@/components/atoms/PartialLoading";
import SocialAuthButton from "@/components/atoms/SocialAuthButton";
import TelegramLoginButton from "@/components/atoms/TelegramLoginButton";
import WalletAuthButton from "@/components/atoms/WalletAuthButton";

import type { Provider } from "@/app/types/auth";

function SignInButtons() {
    const toast = useToast();
    const router = useRouter();
    const [providers, setProviders] = useState<Record<string, Provider> | null>(
        null
    );
    const params = useSearchParams();
    const callbackUrl = params.get("callbackUrl") || "/";
    const error = params.get("error");

    const { isSessionHealthy, isRecovering } = useSessionRecovery();

    useEffect(() => {
        if (isSessionHealthy && !isRecovering) {
            router.push(callbackUrl || "/");
        }
    }, [isSessionHealthy, isRecovering, callbackUrl, router]);

    useEffect(() => {
        if (error) {
            if (error === "OAuthAccountNotLinked") {
                toast.info(
                    "The email is already linked to another account. Please sign in using your original provider."
                );
            } else if (error === "SessionRequired") {
                toast.error("Session expired. Please sign in again.");
            } else if (error === "AccessDenied") {
                toast.error("Access denied.");
            } else {
                toast.error("An error occurred while signing in");
            }
        }
    }, [error, toast]);

    const fetchProviders = useCallback(async () => {
        try {
            const result = await getProviders();
            setProviders(result as Record<string, Provider>);
        } catch (error: any) {
            console.error("Failed to fetch providers:", error);
            setProviders({});
        }
    }, []);

    useEffect(() => {
        fetchProviders().catch((error: any) => {
            console.error("Failed to fetch providers:", error);
        });
    }, [fetchProviders]);

    async function handleTelegramAuth(user: any) {
        if (user) {
            await signIn("telegram", {
                telegramId: user.id?.toString(),
                firstName: user.first_name,
                lastName: user.last_name,
                username: user.username,
                photoUrl: user.photo_url,
                languageCode: user.language_code,
                isPremium: user.is_premium?.toString(),
                redirect: false,
            });

            window.location.href = callbackUrl;
        }
    }

    if (!providers || isRecovering) {
        return (
            <PartialLoading
                text={isRecovering ? "Session recovery..." : "Loading..."}
            />
        );
    }

    const DONOT_SHOW_PROVIDERS = [
        "spotify",
        "coinbase",
        "discord",
        "kakao",
        "wallet",
        "telegram",
        "starglow",
    ];
    const DONOT_SHOW_WALLET_PROVIDERS = ["starglow"];

    return (
        <div className="w-full flex flex-col gap-4 items-center justify-center">
            <div className="w-full grid grid-cols-1 gap-4">
                {Object.values(providers).map((provider) => {
                    if (DONOT_SHOW_PROVIDERS.includes(provider.id)) {
                        return null;
                    }
                    return (
                        <SocialAuthButton
                            key={provider.id}
                            provider={provider}
                            callbackUrl={callbackUrl}
                        />
                    );
                })}
                <div className="w-full border-t border-gray-600 h-[1px] my-1"></div>
                {Object.values(WALLET_PROVIDERS).map((provider) => {
                    if (DONOT_SHOW_WALLET_PROVIDERS.includes(provider.id)) {
                        return null;
                    }
                    return (
                        <WalletAuthButton
                            key={provider.id}
                            provider={provider}
                            callbackUrl={callbackUrl}
                        />
                    );
                })}
            </div>
            <div className="my-2 flex flex-row items-center justify-around">
                <div className="w-full border-t border-gray-600 h-[1px]"></div>
                <span className="px-1 text-sm text-gray-400">or</span>
                <div className="w-full border-t border-gray-600 h-[1px]"></div>
            </div>
            <TelegramLoginButton onAuth={handleTelegramAuth} size="large" />
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
