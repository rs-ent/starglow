/// components\atoms\SignInSocialButton.tsx

"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

interface SignInSocialButtonProps {
    providerId: string;
    providerName: string;
}

const providerIcons: { [key: string]: string } = {
    google: "/icons/providers/google.svg",
    twitter: "/icons/providers/x.svg",
    kakao: "/icons/providers/kakao.svg",
}

const providerColors: { [key: string]: string } = {
    google: "bg-[rgba(255,255,255,1)] text-[rgba(0,0,0,1)] hover:bg-[rgba(255,255,255,1)] hover:text-[rgba(0,0,0,1)] hover:scale-105",
    twitter: "bg-[rgba(1,1,1,1)] text-[rgba(255,255,255,1)] hover:bg-[rgba(1,1,1,1)] hover:text-[rgba(255,255,255,1)] hover:scale-105",
    kakao: "bg-[rgba(254,230,8,1)] text-[rgba(0,0,0,1)] hover:bg-[rgba(254,230,8,1)] hover:text-[rgba(0,0,0,1)] hover:scale-105",
}

export default function SignInSocialButton({ providerId, providerName }: SignInSocialButtonProps) {
    return (
        <Button
            variant="outline"
            onClick={() => {
                try {
                    signIn(providerId);
                } catch (error) {
                    console.error(`[SignIn][Error][${providerId}] `, error);
                }
            }}
            className={`w-full items-center justify-center gap-2 ${providerColors[providerId]}`}
        >
            <div className="flex gap-2">
                <Image
                    src={providerIcons[providerId]}
                    width={20}
                    height={20}
                    alt={`${providerName} icon`}
                />
                Sign in with {providerId === "twitter" ? "X" : providerName}
            </div>
        </Button>
    )
}