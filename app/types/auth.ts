export type ProviderType =
    | "google"
    | "twitter"
    | "discord"
    | "spotify"
    | "coinbase"
    | "kakao"
    | "resend"
    | "telegram";

export type Provider = {
    id: ProviderType;
    name: string;
    type: string;
    signinUrl: string;
    callbackUrl: string;
};

export type WalletProviderType = "metamask" | "walletconnect";

export type WalletProvider = {
    id: WalletProviderType;
    name: string;
    icon: string;
    color: string;
    installUrl: {
        desktop: string;
        ios: string;
        android: string;
        default: string;
    };
    detectFunction: () => boolean;
};

export const WALLET_PROVIDERS: Record<WalletProviderType, WalletProvider> = {
    metamask: {
        id: "metamask",
        name: "MetaMask",
        icon: "/icons/blockchain/metamask.svg",
        color: "bg-[rgba(82,112,255,1.0)] border-[rgba(82,112,255,1.0)] text-[rgba(236,247,252,1.0)]",
        installUrl: {
            desktop: "https://metamask.io/download/",
            ios: "https://apps.apple.com/app/metamask/id1438144202",
            android:
                "https://play.google.com/store/apps/details?id=io.metamask",
            default: "https://metamask.io/download/",
        },
        detectFunction: () => {
            if (typeof window === "undefined") return false;

            const isMetaMaskMobile = /MetaMaskMobile/.test(navigator.userAgent);

            const isMetaMaskBrowser = !!(
                window.ethereum && window.ethereum.isMetaMask
            );

            const isMetaMaskDeepLink = /metamask/.test(
                navigator.userAgent.toLowerCase()
            );

            return isMetaMaskMobile || isMetaMaskBrowser || isMetaMaskDeepLink;
        },
    },
    walletconnect: {
        id: "walletconnect",
        name: "WalletConnect",
        icon: "/icons/blockchain/walletconnect.svg",
        color: "bg-[rgba(255,255,255,1.0)] border-[rgba(8,136,240,1.0)] text-[rgba(8,136,240,1.0)]",
        installUrl: {
            desktop: "https://walletconnect.com/",
            ios: "https://walletconnect.com/",
            android: "https://walletconnect.com/",
            default: "https://walletconnect.com/",
        },
        detectFunction: () => true,
    },
};

export function getDeviceType(): "ios" | "android" | "desktop" {
    if (typeof window === "undefined") return "desktop";

    const userAgent = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(userAgent)) return "ios";
    if (/Android/.test(userAgent)) return "android";
    return "desktop";
}

export function getInstallUrl(provider: WalletProvider): string {
    const deviceType = getDeviceType();
    return provider.installUrl[deviceType] || provider.installUrl.default;
}
