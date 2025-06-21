/// components\atoms\SocialAuthButton.tsx

"use client";
import { useState } from "react";

import { signIn } from "next-auth/react";

import { useLoading } from "@/app/hooks/useLoading";
import { getProviderIdentity } from "@/lib/utils/get/provider-identity";
import { cn } from "@/lib/utils/tailwind";

import Button from "./Button";
import FormSignInEmail from "./Form.SignIn.Email";

import type { Provider } from "@/app/types/auth";
interface SocialAuthButtonProps {
    provider: Provider;
    callbackUrl?: string;
    className?: string;
}

export default function SocialAuthButton({
    provider,
    callbackUrl = "/",
    className,
}: SocialAuthButtonProps) {
    const { startLoading } = useLoading();
    const [showEmailVerification, setShowEmailVerification] = useState(false);

    const handleSignIn = async () => {
        if (provider.id === "resend") {
            setShowEmailVerification(true);
            return;
        }

        startLoading();
        await signIn(provider.id, { callbackUrl });
    };

    const { icon, color } = getProviderIdentity(provider.id);

    return (
        <>
            {showEmailVerification && (
                <div
                    className="fixed inset-0 flex items-center justify-center bg-black/50"
                    onClick={() => setShowEmailVerification(false)}
                >
                    <div className="bg-background p-6 rounded-lg shadow-lg w-full max-w-md">
                        <p className="text-sm font-medium text-center mb-4">
                            Please enter your email to sign in
                        </p>
                        <FormSignInEmail />
                    </div>
                </div>
            )}
            <Button
                variant="outline"
                onClick={handleSignIn}
                className={cn(
                    "w-full items-center justify-center",
                    color,
                    className
                )}
            >
                {icon && (
                    <img
                        src={icon}
                        alt={`${provider.name} icon`}
                        style={{ width: "20px", height: "auto" }}
                    />
                )}
                <span className="ml-2">
                    Sign in with{" "}
                    {provider.id === "twitter"
                        ? "X"
                        : provider.id === "resend"
                        ? "Email"
                        : provider.name}
                </span>
            </Button>
        </>
    );
}
