/// components/atoms/Reward.Button.tsx

"use client";

import { motion } from "framer-motion";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import Image from "next/image";
import { useState } from "react";

interface RewardButtonProps {
    index: number;
    balance: number;
    icon: string;
    name: string;
    className?: string;
    frameSize?: number;
    textSize?: number;
    gapSize?: number;
    paddingSize?: number;
    balanceSize?: number;
    onClick?: () => void;
}

export default function RewardButton({
    index,
    balance,
    icon,
    name,
    className,
    frameSize = 60,
    textSize = 25,
    gapSize = 35,
    paddingSize = 65,
    balanceSize = 20,
    onClick,
}: RewardButtonProps) {
    const [showBalance, setShowBalance] = useState(false);

    const frameClass = getResponsiveClass(frameSize).frameClass;
    const textClass = getResponsiveClass(textSize).textClass;
    const gapClass = getResponsiveClass(gapSize).gapClass;
    const paddingClass = getResponsiveClass(paddingSize).paddingClass;
    const balanceClass = getResponsiveClass(balanceSize).textClass;

    const handleClick = () => {
        if (onClick) {
            onClick();
        }
    };

    return (
        <div className="relative w-full h-full">
            {/* 메인 리워드 버튼 */}
            <motion.div
                initial={{
                    opacity: 0,
                    filter: "blur(36px)",
                    scale: 0.95,
                }}
                animate={{
                    opacity: 1,
                    filter: "blur(0px)",
                    scale: 1,
                }}
                transition={{
                    duration: 0.5,
                    ease: "easeIn",
                    delay: index * 0.1,
                }}
                style={{
                    willChange: "filter, opacity, scale",
                }}
                className={cn(
                    "w-full h-full aspect-square",
                    "flex flex-col items-center justify-center",
                    "morp-glass-4",
                    "bg-gradient-to-br from-[rgba(255,255,255,0.2)] to-[rgba(255,255,255,0.05)]",
                    "shadow-lg",
                    gapClass,
                    className
                )}
                onClick={handleClick}
            >
                <Image
                    src={icon}
                    alt={name}
                    width={frameSize * 2}
                    height={frameSize * 2}
                    className={cn(
                        "object-contain w-full h-full z-10",
                        frameClass
                    )}
                />
                <h2
                    className={cn(
                        "text-center truncate z-10 hidden md:block",
                        textClass
                    )}
                >
                    {name}
                </h2>
            </motion.div>
        </div>
    );
}
