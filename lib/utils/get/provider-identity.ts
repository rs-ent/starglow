/// lib/utils/get/provider-brands.ts

import type { ProviderType } from "@/app/types/auth";

const providerIcons: Record<ProviderType, string> = {
    google: "/icons/providers/google.svg",
    twitter: "/icons/providers/x.svg",
    discord: "/icons/providers/discord.svg",
    kakao: "/icons/providers/kakao.svg",
    spotify: "/icons/providers/spotify.svg",
    coinbase: "/icons/providers/coinbase.svg",
    resend: "/icons/providers/resend.svg",
    telegram: "/icons/providers/telegram.svg",
    "io.metamask": "/icons/blockchain/metamask.svg",
    metaMaskSDK: "/icons/blockchain/metamask.svg",
    walletConnect: "/icons/blockchain/walletconnect.svg",
};

const providerColors: Record<ProviderType, string> = {
    google: "bg-[rgba(255,255,255,1)] text-[rgba(0,0,0,1)] hover:bg-[rgba(255,255,255,1)] hover:text-[rgba(0,0,0,1)] hover:scale-105",
    twitter:
        "bg-[rgba(1,1,1,1)] text-[rgba(255,255,255,1)] hover:bg-[rgba(1,1,1,1)] hover:text-[rgba(255,255,255,1)] hover:scale-105",
    kakao: "bg-[rgba(254,230,8,1)] text-[rgba(0,0,0,1)] hover:bg-[rgba(254,230,8,1)] hover:text-[rgba(0,0,0,1)] hover:scale-105",
    discord:
        "border border-[rgba(93,105,242,1)] bg-[rgba(93,105,242,1)] text-[rgba(255,255,255,1)] hover:bg-[rgba(93,105,242,1)] hover:text-[rgba(255,255,255,1)] hover:scale-105",
    spotify:
        "bg-[rgba(0,0,0,1)] text-[rgba(30,215,96,1)] hover:bg-[rgba(0,0,0,1)] hover:text-[rgba(30,215,96,1)] hover:scale-105",
    coinbase:
        "bg-[rgba(255,255,255,1)] text-[rgba(0,82,255,1)] hover:bg-[rgba(255,255,255,1)] hover:text-[rgba(0,82,255,1)] hover:scale-105",
    resend: "border border-[rgba(0,0,0,0)] bg-[rgba(0,0,0,0)] text-[rgba(255,255,255,1)] hover:bg-[rgba(0,0,0,0)] hover:text-[rgba(255,255,255,1)] hover:scale-105",
    telegram:
        "bg-[rgba(27,146,209,1)] text-[rgba(255,255,255,1)] hover:bg-[rgba(27,146,209,1)] hover:text-[rgba(255,255,255,1)] hover:scale-105",
    "io.metamask":
        "bg-[rgba(255,255,255,1)] text-[rgba(0,0,0,1)] hover:bg-[rgba(255,255,255,1)] hover:text-[rgba(0,0,0,1)] hover:scale-105",
    metaMaskSDK:
        "bg-[rgba(255,255,255,1)] text-[rgba(0,0,0,1)] hover:bg-[rgba(255,255,255,1)] hover:text-[rgba(0,0,0,1)] hover:scale-105",
    walletConnect:
        "bg-[#ffffff] text-[#3B99FC] hover:bg-[#ffffff] hover:text-[#3B99FC] hover:scale-105",
};

export function getProviderIdentity(providerId?: ProviderType) {
    if (!providerId) {
        return {
            icon: null,
            color: null,
        };
    }

    return {
        icon: providerIcons[providerId],
        color: providerColors[providerId],
    };
}
