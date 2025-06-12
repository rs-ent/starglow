/// components/atoms/WalletAuthButton.tsx

import { useWagmiConnection } from "@/app/story/userWallet/wagmi-hooks";
import { Connector, useConnect } from "wagmi";
import Button from "./Button";
import { cn } from "@/lib/utils/tailwind";
import { useMemo, useState, useEffect } from "react";
import {
    WALLET_PROVIDERS,
    WalletProvider,
    WalletProviderType,
    getInstallUrl,
} from "@/app/types/auth";

interface WalletAuthButtonProps {
    provider: WalletProvider;
    className?: string;
    callbackUrl?: string;
}

export default function WalletAuthButton({
    provider,
    className,
    callbackUrl,
}: WalletAuthButtonProps) {
    const { connect, isPendingConnectWallet } = useWagmiConnection();
    const { connectors } = useConnect();
    const [isInstalled, setIsInstalled] = useState<boolean | null>(null);

    const walletInfo = useMemo(() => {
        const connectorId = provider.id.toLowerCase();
        let walletType: WalletProviderType;
        if (connectorId.includes("metamask")) {
            walletType = "metamask";
        } else if (connectorId.includes("walletconnect")) {
            walletType = "walletconnect";
        } else {
            walletType = "metamask";
        }

        return WALLET_PROVIDERS[walletType];
    }, [provider.id]);

    useEffect(() => {
        const checkInstallation = async () => {
            try {
                const installed = await walletInfo.detectFunction();
                setIsInstalled(installed);
            } catch (error) {
                console.error("Error checking wallet installation:", error);
                setIsInstalled(false);
            }
        };

        checkInstallation();
    }, [walletInfo]);

    const handleClick = () => {
        if (isInstalled) {
            const connector = connectors.find((connector) => {
                const connectorId = connector.id.toLowerCase();
                const providerId = provider.id.toLowerCase();

                return (
                    connectorId.includes(providerId) ||
                    (providerId === "metamask" &&
                        connectorId.includes("metamask")) ||
                    (providerId === "walletconnect" &&
                        connectorId.includes("walletconnect"))
                );
            });

            if (!connector) {
                console.error(`Connector for ${provider.id} not found`);
                if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                    window.location.href =
                        "https://metamask.app.link/dapp/" +
                        window.location.origin;
                    return;
                }
                const installUrl = getInstallUrl(provider);
                window.open(installUrl, "_blank");
                return;
            }

            connect(connector, callbackUrl);
        } else {
            const installUrl = getInstallUrl(walletInfo);
            window.open(installUrl, "_blank");
        }
    };

    const buttonText = useMemo(() => {
        if (isPendingConnectWallet) return "Connecting...";
        if (isInstalled === null) return "Checking...";
        if (isInstalled) return `Sign in with ${walletInfo.name}`;
        return `Install ${walletInfo.name}`;
    }, [isPendingConnectWallet, isInstalled, walletInfo.name]);

    return (
        <Button
            variant="outline"
            onClick={handleClick}
            className={cn(
                "w-full items-center justify-center",
                walletInfo.color,
                className
            )}
        >
            {walletInfo.icon && (
                <img
                    src={walletInfo.icon}
                    alt={`${walletInfo.name} icon`}
                    style={{ width: "20px", height: "auto" }}
                />
            )}
            <span className="ml-2">{buttonText}</span>
        </Button>
    );
}
