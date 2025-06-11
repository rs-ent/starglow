/// components/atoms/WalletAuthButton.tsx

import { useWagmiConnection } from "@/app/story/userWallet/wagmi-hooks";
import { Connector } from "wagmi";
import Button from "./Button";

interface WalletAuthButtonProps {
    connector: Connector;
    className?: string;
    callbackUrl?: string;
}

const connectorIcons: Record<string, string> = {
    metamask: "/icons/blockchain/metamask.svg",
    // walletConnect: "/icons/blockchain/walletconnect.svg", // 예시, 실제 파일 필요
    // 추가 connector는 여기에...
};

export default function WalletAuthButton({
    connector,
    className,
    callbackUrl,
}: WalletAuthButtonProps) {
    const { connect, isPendingConnectWallet } = useWagmiConnection();

    const icon = connectorIcons[connector.id] || undefined;

    return (
        <Button
            onClick={() => connect(connector, callbackUrl)}
            img={icon}
            imgLeft
            frameSize={24}
            textSize={18}
            paddingSize={20}
            gapSize={16}
            disabled={isPendingConnectWallet}
            variant="outline"
            className={className}
        >
            {`Sign in with ${connector.name}`}
        </Button>
    );
}
