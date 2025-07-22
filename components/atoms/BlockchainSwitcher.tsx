/// components/atoms/BlockchainSwitcher.tsx

import { memo, useState } from "react";
import { motion } from "framer-motion";
import { Network } from "lucide-react";
import { useStoryNetwork } from "@/app/story/network/hooks";
import { useWagmiConnection } from "@/app/story/userWallet/wagmi-hooks";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import PartialLoading from "./PartialLoading";
import Image from "next/image";

export default memo(function BlockchainSwitcher() {
    const [isSwitching, setIsSwitching] = useState(false);
    const { defaultStoryNetwork, isLoadingDefaultStoryNetwork } =
        useStoryNetwork();

    console.log("Default Story Network", defaultStoryNetwork);

    const { chainId, switchChain, isConnected } = useWagmiConnection();

    if (isLoadingDefaultStoryNetwork) {
        return <PartialLoading loadingSize={20} />;
    }

    const isOnDefaultNetwork = chainId === defaultStoryNetwork?.chainId;

    if (!isConnected || isOnDefaultNetwork) {
        return null;
    }

    const handleSwitchNetwork = async () => {
        if (isSwitching || !isConnected || isOnDefaultNetwork) return;

        try {
            setIsSwitching(true);
            await switchChain(defaultStoryNetwork?.chainId ?? 80094);
        } catch (error) {
            console.error("Failed to switch to network:", error);
        } finally {
            setIsSwitching(false);
        }
    };

    return (
        <motion.button
            whileHover={{ scale: isSwitching ? 1 : 1.05 }}
            whileTap={{ scale: isSwitching ? 1 : 0.95 }}
            onClick={handleSwitchNetwork}
            disabled={isSwitching}
            className={cn(
                "bg-gradient-to-r from-[#814625] to-[#f2772d]",
                "text-white font-bold rounded-[6px]",
                "hover:from-[#572e17] hover:to-[#b6571c]",
                "transition-all duration-300 shadow-lg",
                "hover:shadow-blue-500/25 hover:shadow-2xl",
                "flex items-center gap-1",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                getResponsiveClass(10).textClass,
                getResponsiveClass(20).paddingClass
            )}
        >
            <Image
                src={"/logo/partners/berachain2.png"}
                alt="Network Logo"
                width={40}
                height={40}
                className={cn(getResponsiveClass(20).frameClass)}
            />
            {isSwitching ? "..." : `SWITCH`}
        </motion.button>
    );
});
