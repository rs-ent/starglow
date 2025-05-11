/// components\atoms\SocialAuthButton.tsx

"use client";
import Button from "./Button";
import { useLoading } from "@/app/hooks/useLoading";
import { signIn } from "next-auth/react";
import { ProviderType } from "@/app/types/auth";

interface SocialAuthButtonProps {
    providerId: ProviderType;
    providerName: string;
    providerColor: string;
    providerIcon: string;
    callbackUrl?: string;
}

export default function SocialAuthButton({
    providerId,
    providerName,
    providerColor,
    providerIcon,
    callbackUrl = "/",
}: SocialAuthButtonProps) {
    const { startLoading } = useLoading();

    const handleSignIn = async () => {
        startLoading();
        await signIn(providerId, { callbackUrl });
    };

    return (
        <Button
            variant="outline"
            onClick={handleSignIn}
            className={`w-full items-center justify-center ${providerColor}`}
        >
            <img
                src={providerIcon}
                alt={`${providerName} icon`}
                style={{ width: "20px", height: "auto" }}
            />
            <span className="ml-2">
                Sign in with {providerId === "twitter" ? "X" : providerName}
            </span>
        </Button>
    );
}
