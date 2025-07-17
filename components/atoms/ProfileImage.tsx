/// components/atoms/ProfileImage.tsx

"use client";

import React, { useMemo, useState } from "react";

import { motion } from "framer-motion";

import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import UserSettingsProfileModal from "../user/User.Settings.Profile.Modal";

import Image from "next/image";
import { usePlayerGet } from "@/app/hooks/usePlayer";
import { useSession } from "next-auth/react";

interface ProfileImageProps {
    className?: string;
    size?: number;
}

export default React.memo(function ProfileImage({
    className,
    size = 60,
}: ProfileImageProps) {
    const [showUserSettings, setShowUserSettings] = useState(false);
    const { data: session } = useSession();

    const { playerProfile } = usePlayerGet({
        getPlayerProfileInput: {
            playerId: session?.player?.id || "",
        },
    });

    const { frameSize, cameraSize } = useMemo(() => {
        const normalizedSize = Math.round(size / 5) * 5;
        const cameraSizeRaw = Math.floor(normalizedSize / 2);
        const normalizedCameraSize = Math.max(
            5,
            Math.round(cameraSizeRaw / 5) * 5
        );

        return {
            frameSize: getResponsiveClass(normalizedSize).frameClass,
            cameraSize: getResponsiveClass(normalizedCameraSize).frameClass,
        };
    }, [size]);

    return (
        <>
            {showUserSettings && (
                <UserSettingsProfileModal
                    showNickname={false}
                    showImage={true}
                    onClose={() => setShowUserSettings(false)}
                />
            )}
            <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    "rounded-full overflow-hidden relative cursor-pointer",
                    "ring-2 ring-white/20 hover:ring-purple-500/50",
                    "bg-gradient-to-br from-purple-500/10 to-indigo-500/10",
                    "hover:from-purple-500/20 hover:to-indigo-500/20",
                    "transition-all duration-300 ease-out",
                    "hover:shadow-lg hover:shadow-purple-500/25",
                    frameSize,
                    className
                )}
                onClick={(e) => {
                    e.stopPropagation();
                    setShowUserSettings(true);
                }}
            >
                {/* Hover Overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className={cn(
                        "absolute inset-0 w-full h-full flex items-center justify-center z-10",
                        "bg-gradient-to-br from-black/60 via-purple-900/60 to-indigo-900/60",
                        "transition-opacity duration-300 ease-in-out"
                    )}
                >
                    <motion.div
                        initial={{ scale: 0.8, rotate: -10 }}
                        whileHover={{ scale: 1, rotate: 0 }}
                        className={cn(
                            "bg-gradient-to-br from-purple-500/30 to-indigo-500/30",
                            "border border-purple-500/50 rounded-full p-2",
                            "backdrop-blur-xs"
                        )}
                    >
                        <Image
                            src="/ui/camera.svg"
                            alt="Camera"
                            className={cn("filter brightness-150", cameraSize)}
                            width={size}
                            height={size}
                            priority={false}
                            unoptimized={false}
                        />
                    </motion.div>
                </motion.div>

                {/* Profile Image */}
                {playerProfile?.image ? (
                    <Image
                        src={playerProfile.image}
                        alt="Profile"
                        width={size * 2}
                        height={size * 2}
                        className="w-full h-full object-cover -z-10"
                        priority={false}
                        unoptimized={playerProfile.image.startsWith("http")}
                    />
                ) : (
                    <DefaultProfileImageSvg opacity={0.9} scale={1.1} />
                )}
            </motion.div>
        </>
    );
});

function DefaultProfileImageSvg({
    opacity = 1.0,
    scale = 1.0,
}: {
    opacity?: number;
    scale?: number;
}) {
    return (
        <svg
            width="100%"
            height="100%"
            viewBox="0 0 40 40"
            fill="none"
            opacity={opacity}
            style={{ transform: `scale(${scale})` }}
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient
                    id="profileGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                >
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="50%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
            </defs>
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M26.092 13C26.092 16.3137 23.4058 19 20.092 19C16.7783 19 14.092 16.3137 14.092 13C14.092 9.68629 16.7783 7 20.092 7C23.4058 7 26.092 9.68629 26.092 13ZM24.092 13C24.092 15.2091 22.3012 17 20.092 17C17.8829 17 16.092 15.2091 16.092 13C16.092 10.7909 17.8829 9 20.092 9C22.3012 9 24.092 10.7909 24.092 13Z"
                fill="url(#profileGradient)"
            />
            <path
                d="M20.092 22C13.6177 22 8.10132 25.8284 6 31.192C6.5119 31.7004 7.05114 32.1812 7.61533 32.6321C9.18007 27.7077 14.0888 24 20.092 24C26.0953 24 31.004 27.7077 32.5688 32.6321C33.133 32.1812 33.6722 31.7004 34.1841 31.1921C32.0828 25.8284 26.5664 22 20.092 22Z"
                fill="url(#profileGradient)"
            />
        </svg>
    );
}
