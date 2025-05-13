/// components\atoms\SocialAuthButton.tsx

"use client";
import Button from "./Button";
import { useLoading } from "@/app/hooks/useLoading";
import { signIn } from "next-auth/react";
import { ProviderType } from "@/app/types/auth";
import { useState } from "react";
import FormSignInEmail from "./Form.SignIn.Email";
import { cn } from "@/lib/utils/tailwind";

interface SocialAuthButtonProps {
    providerId: ProviderType;
    providerName: string;
    providerColor: string;
    providerIcon: string;
    callbackUrl?: string;
    className?: string;
}

export default function SocialAuthButton({
    providerId,
    providerName,
    providerColor,
    providerIcon,
    callbackUrl = "/",
    className,
}: SocialAuthButtonProps) {
    const { startLoading } = useLoading();
    const [showEmailVerification, setShowEmailVerification] = useState(false);

    const handleSignIn = async () => {
        if (providerId === "resend") {
            setShowEmailVerification(true);
            return;
        }

        startLoading();
        await signIn(providerId, { callbackUrl });
    };

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
                    providerColor,
                    className
                )}
            >
                <img
                    src={providerIcon}
                    alt={`${providerName} icon`}
                    style={{ width: "20px", height: "auto" }}
                />
                <span className="ml-2">
                    Sign in with{" "}
                    {providerId === "twitter"
                        ? "X"
                        : providerId === "resend"
                        ? "Email"
                        : providerName}
                </span>
            </Button>
        </>
    );
}
