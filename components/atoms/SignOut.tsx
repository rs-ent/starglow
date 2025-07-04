/// components/atoms/SignOut.tsx

import { memo, useState } from "react";
import { motion } from "framer-motion";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useWagmiConnection } from "@/app/story/userWallet/wagmi-hooks";
import { useToast } from "@/app/hooks/useToast";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

export default memo(function SignOut() {
    const [isSigningOut, setIsSigningOut] = useState(false);
    const { disconnect, isConnected } = useWagmiConnection();
    const toast = useToast();

    const handleSignOut = async () => {
        if (isSigningOut) return;

        try {
            setIsSigningOut(true);
            if (isConnected) {
                await disconnect();
                toast.success("Wallet Disconnected");
            }

            // NextAuth 세션 종료
            await signOut({ callbackUrl: "/?signedOut=true" });
        } catch (error) {
            console.error("Sign out failed:", error);
            toast.error("Failed to sign out. Please try again.");
        } finally {
            setIsSigningOut(false);
        }
    };

    return (
        <motion.button
            whileHover={{ scale: isSigningOut ? 1 : 1.05 }}
            whileTap={{ scale: isSigningOut ? 1 : 0.95 }}
            onClick={handleSignOut}
            disabled={isSigningOut}
            className={cn(
                "bg-gradient-to-r from-red-500 to-pink-500",
                "text-white font-bold rounded-[6px]",
                "hover:from-red-600 hover:to-pink-600",
                "transition-all duration-300 shadow-lg",
                "hover:shadow-red-500/25 hover:shadow-2xl",
                "flex items-center gap-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                getResponsiveClass(10).textClass,
                getResponsiveClass(20).paddingClass
            )}
        >
            <LogOut className={cn(getResponsiveClass(15).frameClass)} />
            {isSigningOut ? "Wait..." : "Sign Out"}
        </motion.button>
    );
});
