/// components\atoms\SocialAuthButton.tsx

"use client";
import Image from "next/image";
import Button from "./Button";
import { signIn } from "next-auth/react";
import { ProviderType } from "@/types/auth";

interface SocialAuthButtonProps {
    providerId: ProviderType;
    providerName: string;
}

const providerIcons: Record<ProviderType, string> = {
    google: "/icons/providers/google.svg",
    twitter: "/icons/providers/x.svg",
    kakao: "/icons/providers/kakao.svg",
}

const providerColors: Record<ProviderType, string> = {
    google: "bg-[rgba(255,255,255,1)] text-[rgba(0,0,0,1)] hover:bg-[rgba(255,255,255,1)] hover:text-[rgba(0,0,0,1)] hover:scale-105",
    twitter: "bg-[rgba(1,1,1,1)] text-[rgba(255,255,255,1)] hover:bg-[rgba(1,1,1,1)] hover:text-[rgba(255,255,255,1)] hover:scale-105",
    kakao: "bg-[rgba(254,230,8,1)] text-[rgba(0,0,0,1)] hover:bg-[rgba(254,230,8,1)] hover:text-[rgba(0,0,0,1)] hover:scale-105",
}

export default function SocialAuthButton({ providerId, providerName }: SocialAuthButtonProps) {
    return (
        <Button
            variant="outline"
            onClick={() => signIn(providerId)}
            className={`w-full items-center justify-center ${providerColors[providerId]}`}
        >
            <Image
                src={providerIcons[providerId]}
                width={20}
                height={20}
                alt={`${providerName} icon`}
            />
            <span className="ml-2">
                Sign in with {providerId === "twitter" ? "X" : providerName}
            </span>
        </Button>
    )
}