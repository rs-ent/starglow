/// components/atoms/Popup.InteractFeedback.tsx

"use client"; // 클라이언트 컴포넌트로 표시

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Portal from "./Portal";
import dynamic from "next/dynamic"; // 동적 임포트 사용
import { TextAnimate } from "@/components/magicui/text-animate";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { Asset } from "@prisma/client";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { Canvas } from "@react-three/fiber";
import NFTsCollectionsCardR3FAcqusition from "../nfts/NFTs.Collections.Card.R3F.Acqusition";
import { Collection } from "@/app/actions/factoryContracts";
import { XIcon } from "lucide-react";
import confetti from "canvas-confetti";

// 브라우저 전용 모듈을 동적으로 임포트
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

interface InteractFeedbackProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    type?: "success" | "error" | "warning" | "info" | "purchaseNFT";
    autoCloseMs?: number;
    showConfetti?: boolean;
    showReward?: boolean;
    reward?: Asset | null;
    rewardAmount?: number | null;
    collection?: Collection | null;
}

export default function InteractFeedback({
    open,
    onClose,
    title,
    description,
    type = "success",
    autoCloseMs,
    showConfetti = true,
    showReward = true,
    reward,
    rewardAmount,
    collection,
}: InteractFeedbackProps) {
    const [successLottie, setSuccessLottie] = useState<any>(null);

    // 자동 닫힘
    useEffect(() => {
        if (open) {
            if (autoCloseMs) {
                const timer = setTimeout(onClose, autoCloseMs);
                return () => clearTimeout(timer);
            }
        }
    }, [open, autoCloseMs, onClose]);

    useEffect(() => {
        if (showConfetti && open) {
            handleConfetti();
        }
    }, [showConfetti, open]);

    useEffect(() => {
        if (type === "success") {
            fetch("/lottie/success.json")
                .then((res) => res.json())
                .then(setSuccessLottie);
        }
    }, [type]);

    const handleConfetti = () => {
        const defaults = {
            particleCount: type === "purchaseNFT" ? 300 : 100,
            spread: type === "purchaseNFT" ? 360 : 120,
            ticks: autoCloseMs ? autoCloseMs : 800,
            decay: 0.96,
            startVelocity: 20,
            scalar: 1,
            zIndex: type === "purchaseNFT" ? 20 : 1000,
        };

        const shoot = () => {
            confetti({
                ...defaults,
            });
        };

        shoot();
    };

    return (
        <Portal>
            <AnimatePresence>
                {open && (
                    <motion.div
                        className="fixed inset-0 z-[1000] flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7 }}
                        style={{ pointerEvents: "auto" }}
                    >
                        {/* 배경 블러/그라데이션 */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-b from-[rgba(10,10,11,0.3)] to-[rgba(12,12,13,0.1)]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.7 }}
                            onClick={onClose}
                        />
                        {/* 카드 */}
                        <motion.div
                            className="relative flex flex-col items-center justify-center min-w-[260px] max-w-[90vw] p-8 gap-4 rounded-2xl shadow-2xl backdrop-blur-sm"
                            initial={{
                                opacity: 0,
                                y: 60,
                                scale: 0.92,
                                filter: "blur(8px)",
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                scale: 1,
                                filter: "blur(0px)",
                            }}
                            exit={{
                                opacity: 0,
                                y: 40,
                                scale: 0.96,
                                filter: "blur(8px)",
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 420,
                                damping: 32,
                                bounce: 0.22,
                                mass: 0.9,
                            }}
                            style={{
                                background:
                                    "linear-gradient(135deg, rgba(30,30,40,0.95) 60%, rgba(60,60,80,0.85) 100%)",
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute top-0 right-0 p-2">
                                <button
                                    onClick={(e) => {
                                        console.log("close");
                                        onClose();
                                    }}
                                >
                                    <XIcon className="w-4 h-4 text-white" />
                                </button>
                            </div>
                            {type === "success" && successLottie && (
                                <Lottie
                                    animationData={successLottie}
                                    loop={false}
                                    style={{ width: 80, height: 80 }}
                                />
                            )}
                            <TextAnimate
                                animation="slideLeft"
                                by="character"
                                duration={0.9}
                                once
                                className={cn(
                                    "text-xl font-main text-center text-white",
                                    getResponsiveClass(30).textClass
                                )}
                            >
                                {title}
                            </TextAnimate>
                            {type === "purchaseNFT" && collection && (
                                <div className="w-[600px] h-[400px] mb-4">
                                    <Canvas
                                        camera={{
                                            position: [0, 0, 42],
                                            fov: 45,
                                        }}
                                        style={{ background: "transparent" }}
                                    >
                                        <ambientLight intensity={0.5} />
                                        <pointLight
                                            position={[10, 10, 10]}
                                            intensity={1}
                                        />
                                        <NFTsCollectionsCardR3FAcqusition
                                            collection={collection}
                                        />
                                    </Canvas>
                                </div>
                            )}
                            {description && (
                                <TextAnimate
                                    animation="slideLeft"
                                    by="word"
                                    duration={0.9}
                                    delay={0.2}
                                    once
                                    className={cn(
                                        "text-base text-center text-[rgba(255,255,255,0.85)]",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    {description}
                                </TextAnimate>
                            )}
                            {showReward && rewardAmount != null && (
                                <div className="flex flex-col items-center w-full">
                                    <div className="h-[1px] w-full bg-white/10 my-3" />
                                    <div className="flex flex-row items-center gap-2 mb-2">
                                        <span
                                            className={cn(
                                                "text-sm text-[rgba(255,255,255,0.7)] font-medium",
                                                getResponsiveClass(10).textClass
                                            )}
                                        >
                                            You earned:
                                        </span>
                                        <div className="flex items-center gap-[5px]">
                                            {reward?.iconUrl && (
                                                <img
                                                    src={reward.iconUrl}
                                                    alt={reward.symbol}
                                                    className={cn(
                                                        "w-8 h-8 rounded-full border border-white/30 bg-white/10",
                                                        getResponsiveClass(10)
                                                            .frameClass
                                                    )}
                                                />
                                            )}
                                            <NumberTicker
                                                value={rewardAmount}
                                                startValue={parseInt(
                                                    (rewardAmount / 2).toFixed(
                                                        0
                                                    ),
                                                    10
                                                )}
                                                className={cn(
                                                    "font-digital text-[rgba(255,255,150,0.85)]",
                                                    getResponsiveClass(15)
                                                        .textClass
                                                )}
                                            />
                                            {reward?.symbol && (
                                                <span
                                                    className={cn(
                                                        "text-[rgba(255,255,150,0.85)]",
                                                        getResponsiveClass(10)
                                                            .textClass
                                                    )}
                                                >
                                                    {reward.symbol}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Portal>
    );
}
