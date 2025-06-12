/// components/atoms/WalletAuthButton.tsx

import { useWagmiConnection } from "@/app/story/userWallet/wagmi-hooks";
import { Connector } from "wagmi";
import Button from "./Button";
import { cn } from "@/lib/utils/tailwind";
import { useMemo } from "react";

interface WalletAuthButtonProps {
    connector: Connector;
    className?: string;
    callbackUrl?: string;
}

const connectorColors: Record<string, string> = {
    MetaMask:
        "bg-[rgba(82,112,255,1.0)] border-[rgba(82,112,255,1.0)] text-[rgba(236,247,252,1.0)]",
};

const connectorIcons: Record<string, string> = {
    MetaMask: "/icons/blockchain/metamask.svg",
};

export default function WalletAuthButton({
    connector,
    className,
    callbackUrl,
}: WalletAuthButtonProps) {
    const { connect, isPendingConnectWallet } = useWagmiConnection();

    const { name, icon, color } = useMemo(() => {
        console.log(connector.id);
        console.log(connectorIcons[connector.name]);
        console.log(connectorColors[connector.name]);
        console.log(connector.name);
        return {
            name: connector.name,
            icon: connectorIcons[connector.name],
            color: connectorColors[connector.name],
        };
    }, [connector]);

    return (
        <Button
            variant="outline"
            onClick={() => connect(connector, callbackUrl)}
            className={cn(
                "w-full items-center justify-center",
                color,
                className
            )}
        >
            {icon && (
                <img
                    src={icon}
                    alt={`${connector.name} icon`}
                    style={{ width: "20px", height: "auto" }}
                />
            )}
            <span className="ml-2">{`Sign in with ${name}`}</span>
        </Button>
    );
}
