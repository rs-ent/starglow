/// components/atoms/ProfileName.tsx

"use client";

import React, { useState, useMemo } from "react";

import { motion } from "framer-motion";

import { getProviderIdentity } from "@/lib/utils/get/provider-identity";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import UserSettingsProfileModal from "../user/User.Settings.Profile.Modal";

import type { ProviderType } from "@/app/types/auth";
import type { Player } from "@prisma/client";
import type { User } from "next-auth";
import Image from "next/image";

interface ProfileNameProps {
    user: User;
    player: Player;
    size?: number;
}

export default React.memo(function ProfileName({
    user,
    player,
    size = 20,
}: ProfileNameProps) {
    const [showUserSettings, setShowUserSettings] = useState(false);

    const { provider, icon, color, nickname } = useMemo(() => {
        const provider = (user as any).provider as ProviderType | undefined;
        const { icon, color } = getProviderIdentity(provider);
        const nickname = player?.nickname || user?.name || user?.email || "";
        return { provider, icon, color, nickname };
    }, [player?.nickname, user]);

    const { textClass, frameClass, iconClass } = useMemo(() => {
        // Ensure all sizes are multiples of 5
        const normalizedSize = Math.round(size / 5) * 5;
        const frameSize = Math.max(5, Math.round((normalizedSize + 5) / 5) * 5);
        const iconSize = Math.max(5, Math.round((normalizedSize - 5) / 5) * 5);

        return {
            textClass: getResponsiveClass(normalizedSize).textClass,
            frameClass: getResponsiveClass(frameSize).frameClass,
            iconClass: getResponsiveClass(iconSize).frameClass,
        };
    }, [size]);

    return (
        <>
            {showUserSettings && (
                <UserSettingsProfileModal
                    player={player}
                    user={user}
                    showNickname={true}
                    showImage={false}
                    onClose={() => setShowUserSettings(false)}
                />
            )}
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                    "flex flex-row gap-[5px] items-center justify-center group cursor-pointer",
                    "bg-gradient-to-br from-white/5 to-white/0",
                    "hover:from-white/10 hover:to-white/5",
                    "border border-white/10 hover:border-white/20",
                    "rounded-xl px-3 py-2",
                    "transition-all duration-300 ease-out",
                    "hover:shadow-lg hover:shadow-white/10"
                )}
                onClick={() => setShowUserSettings(true)}
            >
                {icon && (
                    <>
                        {provider !== "telegram" &&
                        provider !== "io.metamask" &&
                        provider !== "metaMaskSDK" ? (
                            <motion.div
                                whileHover={{ rotate: 5 }}
                                className={cn(
                                    "rounded-full",
                                    "flex items-center justify-center",
                                    color,
                                    frameClass
                                )}
                            >
                                <Image
                                    src={icon}
                                    alt={`${provider} icon`}
                                    className={iconClass}
                                    width={size}
                                    height={size}
                                    priority={false}
                                    unoptimized={false}
                                />
                            </motion.div>
                        ) : (
                            <motion.div whileHover={{ rotate: 5 }}>
                                <Image
                                    src={icon}
                                    alt={`${provider} icon`}
                                    className={iconClass}
                                    width={size}
                                    height={size}
                                    priority={false}
                                    unoptimized={false}
                                />
                            </motion.div>
                        )}
                    </>
                )}
                <p
                    className={cn(
                        "text-white/80 group-hover:text-white",
                        "transition-colors duration-300",
                        textClass
                    )}
                >
                    {nickname}
                </p>
            </motion.div>
        </>
    );
});
