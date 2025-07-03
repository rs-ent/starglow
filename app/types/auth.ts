export type ProviderType =
    | "google"
    | "twitter"
    | "discord"
    | "spotify"
    | "coinbase"
    | "kakao"
    | "resend"
    | "telegram"
    | "io.metamask"
    | "metaMaskSDK"
    | "walletConnect";

export type Provider = {
    id: ProviderType;
    name: string;
    type: string;
    signinUrl: string;
    callbackUrl: string;
};

export type WalletProviderType = "metamask" | "walletconnect" | "starglow";

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
    detectFunction: () => Promise<boolean>;
};

// 이더리움 프로바이더 타입 정의 추가
interface EthereumProvider {
    isMetaMask?: boolean;
    providers?: EthereumProvider[];
    request?: (args: { method: string; params?: any[] }) => Promise<any>;
}

// EIP-6963 프로바이더 정보 타입
interface EIP6963ProviderInfo {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
}

interface EIP6963ProviderDetail {
    info: EIP6963ProviderInfo;
    provider: EthereumProvider;
}

declare global {
    interface Window {
        ethereum?: any;
    }
}

// MetaMask 감지를 위한 유틸리티 함수들
function detectMetaMaskEIP6963(): Promise<boolean> {
    return new Promise((resolve) => {
        let providerFound = false;

        // EIP-6963 이벤트 리스너
        const handleAnnouncement = (
            event: CustomEvent<EIP6963ProviderDetail>
        ) => {
            if (event.detail.info.rdns === "io.metamask") {
                providerFound = true;
                resolve(true);
            }
        };

        window.addEventListener(
            "eip6963:announceProvider",
            handleAnnouncement as EventListener
        );

        // 프로바이더 요청
        window.dispatchEvent(new Event("eip6963:requestProvider"));

        // 200ms 후 타임아웃 (EIP-6963 감지 시간)
        setTimeout(() => {
            window.removeEventListener(
                "eip6963:announceProvider",
                handleAnnouncement as EventListener
            );
            if (!providerFound) {
                resolve(false);
            }
        }, 200);
    });
}

function detectMetaMaskLegacy(): boolean {
    if (typeof window === "undefined") return false;

    return !!(
        window.ethereum?.isMetaMask ||
        window.ethereum?.providers?.some(
            (provider: EthereumProvider) => provider.isMetaMask
        )
    );
}

function isMobileDevice(): boolean {
    if (typeof window === "undefined") return false;
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export const WALLET_PROVIDERS: Record<WalletProviderType, WalletProvider> = {
    starglow: {
        id: "starglow",
        name: "Starglow",
        icon: "/logo/l-white.svg",
        color: "bg-[rgba(132,78,216,1.0)] border-[rgba(255,255,255,1.0)] text-[rgba(255,255,255,1.0)]",
        installUrl: {
            desktop: "https://starglow.io/",
            ios: "https://starglow.io/",
            android: "https://starglow.io/",
            default: "https://starglow.io/",
        },
        detectFunction: async () => {
            return true;
        },
    },
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
        detectFunction: async () => {
            if (typeof window === "undefined") return false;

            const isMobile = isMobileDevice();

            if (isMobile) {
                return true;
            }

            try {
                const eip6963Result = await detectMetaMaskEIP6963();
                return eip6963Result || detectMetaMaskLegacy();
            } catch {
                return detectMetaMaskLegacy();
            }
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
        detectFunction: async () => {
            return true;
        },
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
