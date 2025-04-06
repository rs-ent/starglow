/// components\atoms\SocialAuthButton.tsx

"use client";
import Button from "./Button";
import { useLoading } from "@/app/hooks/useLoading";
import { signIn } from "next-auth/react";
import { ProviderType } from "@/app/types/auth";

interface SocialAuthButtonProps {
    providerId: ProviderType;
    providerName: string;
    callbackUrl?: string;
}

const providerIcons: Record<ProviderType, string> = {
    google: "/icons/providers/google.svg",
    twitter: "/icons/providers/x.svg",
    kakao: "/icons/providers/kakao.svg",
};

const providerColors: Record<ProviderType, string> = {
    google: "bg-[rgba(255,255,255,1)] text-[rgba(0,0,0,1)] hover:bg-[rgba(255,255,255,1)] hover:text-[rgba(0,0,0,1)] hover:scale-105",
    twitter:
        "bg-[rgba(1,1,1,1)] text-[rgba(255,255,255,1)] hover:bg-[rgba(1,1,1,1)] hover:text-[rgba(255,255,255,1)] hover:scale-105",
    kakao: "bg-[rgba(254,230,8,1)] text-[rgba(0,0,0,1)] hover:bg-[rgba(254,230,8,1)] hover:text-[rgba(0,0,0,1)] hover:scale-105",
};

export default function SocialAuthButton({
    providerId,
    providerName,
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
            className={`w-full items-center justify-center ${providerColors[providerId]}`}
        >
            <img
                src={providerIcons[providerId]}
                alt={`${providerName} icon`}
                style={{ width: "20px", height: "auto" }}
            />
            <span className="ml-2">
                Sign in with {providerId === "twitter" ? "X" : providerName}
            </span>
        </Button>
    );
}
