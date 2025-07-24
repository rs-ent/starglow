/// components/atoms/Popup.InteractFeedback.tsx

"use client";

import React, { useCallback, useEffect } from "react";

import { Canvas } from "@react-three/fiber";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { XIcon, ExternalLink, Copy, Check } from "lucide-react";

import { NumberTicker } from "@/components/magicui/number-ticker";
import { TextAnimate } from "@/components/magicui/text-animate";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { useModalStack } from "@/app/hooks/useModalStack";

import EnhancedPortal from "@/components/atoms/Portal.Enhanced";
import NFTsCollectionsCardR3FAcqusition from "../nfts/NFTs.Collections.Card.R3F.Acqusition";

import type { SPG } from "@/app/story/spg/actions";
import Image from "next/image";

interface PopupInteractFeedbackProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    type?: "success" | "error" | "warning" | "info" | "purchaseNFT";
    autoCloseMs?: number;
    showConfetti?: boolean;
    showReward?: boolean;
    reward?: {
        id: string;
        name: string;
        symbol: string;
        iconUrl: string;
        imageUrl: string;
    } | null;
    rewardAmount?: number | null;
    spg?: SPG | null;
    hasTxHash?: boolean;
    txHash?: string;
}

export default function PopupInteractFeedback({
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
    spg,
    hasTxHash,
    txHash,
}: PopupInteractFeedbackProps) {
    const { pushModal, popModal, setInteracting } = useModalStack();
    const popupId = "interact-feedback-popup";
    const [copied, setCopied] = React.useState(false);

    // 베라체인 블록 익스플로러 URL 생성
    const getBeratrailUrl = (hash: string) => {
        return `https://beratrail.io/tx/${hash}`;
    };

    // 트랜잭션 해시 복사
    const handleCopyTxHash = async () => {
        if (txHash) {
            try {
                await navigator.clipboard.writeText(txHash);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (error) {
                console.error("Failed to copy transaction hash:", error);
            }
        }
    };

    // 트랜잭션 해시를 축약된 형태로 표시
    const formatTxHash = (hash: string) => {
        if (hash.length <= 12) return hash;
        return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
    };

    const handleConfetti = useCallback(() => {
        const defaults = {
            particleCount: type === "purchaseNFT" ? 300 : 100,
            spread: type === "purchaseNFT" ? 360 : 120,
            ticks: autoCloseMs ? autoCloseMs : 800,
            decay: 0.96,
            startVelocity: 20,
            scalar: 1,
            zIndex: 1500,
        };

        const shoot = () => {
            try {
                confetti({
                    ...defaults,
                })?.catch((error) => {
                    console.error("Failed to shoot confetti:", error);
                });
            } catch (error) {
                console.error("Failed to shoot confetti:", error);
            }
        };

        shoot();
    }, [autoCloseMs, type]);

    // 모달 스택 관리
    useEffect(() => {
        if (open) {
            pushModal(popupId);
            setInteracting(popupId, true);
        } else {
            popModal(popupId);
            setInteracting(popupId, false);
        }
    }, [open, pushModal, popModal, setInteracting, popupId]);

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
    }, [showConfetti, open, handleConfetti]);

    return (
        <EnhancedPortal layer="popup">
            <AnimatePresence>
                {open && (
                    <motion.div
                        className="fixed inset-0 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7 }}
                        style={{ zIndex: 2000 }}
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
                                        e.stopPropagation();
                                        onClose();
                                    }}
                                >
                                    <XIcon className="w-4 h-4 text-white" />
                                </button>
                            </div>
                            {reward ? (
                                <div
                                    className={cn(
                                        "group relative flex flex-col items-center justify-center gap-1 cursor-pointer",
                                        "bg-gradient-to-br from-white/10 to-white/5",
                                        "border border-white/20 backdrop-blur-sm",
                                        "rounded-[12px] transition-all duration-300 ease-out",
                                        "overflow-hidden",
                                        "morp-glass-1",
                                        "p-3"
                                    )}
                                >
                                    {/* Compact shimmer effect */}
                                    <div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12"
                                        style={{
                                            animation: "shimmer 2s infinite",
                                            background:
                                                "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                                            transform:
                                                "translateX(-100%) skewX(-12deg)",
                                        }}
                                    />
                                    {reward?.iconUrl ? (
                                        <Image
                                            src={
                                                reward?.iconUrl ||
                                                "/images/reward.png"
                                            }
                                            alt={reward?.symbol || "reward"}
                                            width={100}
                                            height={100}
                                            className={cn(
                                                "object-contain",
                                                getResponsiveClass(80)
                                                    .frameClass
                                            )}
                                            priority={true}
                                            unoptimized={false}
                                        />
                                    ) : (
                                        <p
                                            className={cn(
                                                "text-xl font-main text-center text-white",
                                                getResponsiveClass(70).textClass
                                            )}
                                        >
                                            🎉
                                        </p>
                                    )}
                                    {reward?.name && (
                                        <TextAnimate
                                            animation="slideRight"
                                            by="character"
                                            duration={0.6}
                                            once
                                            className={cn(
                                                "text-xl font-main text-center rainbow-text",
                                                getResponsiveClass(25).textClass
                                            )}
                                        >
                                            {reward.name}
                                        </TextAnimate>
                                    )}
                                </div>
                            ) : (
                                <p
                                    className={cn(
                                        "text-xl font-main text-center text-white",
                                        getResponsiveClass(70).textClass
                                    )}
                                >
                                    🎉
                                </p>
                            )}
                            <TextAnimate
                                animation="slideLeft"
                                by="character"
                                duration={0.9}
                                once
                                className={cn(
                                    "text-xl font-main text-center text-white",
                                    getResponsiveClass(40).textClass
                                )}
                            >
                                {title}
                            </TextAnimate>
                            {type === "purchaseNFT" && spg && (
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
                                            spg={spg}
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
                                        getResponsiveClass(25).textClass
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
                                                getResponsiveClass(20).textClass
                                            )}
                                        >
                                            You earned:
                                        </span>
                                        <div className="flex items-center gap-[5px]">
                                            {reward?.iconUrl && (
                                                <Image
                                                    src={reward.iconUrl}
                                                    alt={reward.symbol}
                                                    width={100}
                                                    height={100}
                                                    className={cn(
                                                        "rounded-full border border-white/30 bg-white/10",
                                                        "object-contain",
                                                        getResponsiveClass(20)
                                                            .frameClass
                                                    )}
                                                    priority={false}
                                                    unoptimized={false}
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
                                                    getResponsiveClass(25)
                                                        .textClass
                                                )}
                                            />
                                            {reward?.symbol && (
                                                <span
                                                    className={cn(
                                                        "text-[rgba(255,255,150,0.85)]",
                                                        getResponsiveClass(20)
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
                            {hasTxHash && txHash && (
                                <div className="flex flex-col items-center w-full">
                                    <div className="h-[1px] w-full bg-white/10 my-3" />
                                    <div className="flex flex-col items-center gap-3 w-full max-w-[400px]">
                                        <span
                                            className={cn(
                                                "text-sm text-[rgba(255,255,255,0.7)] font-medium",
                                                getResponsiveClass(20).textClass
                                            )}
                                        >
                                            Transaction Hash
                                        </span>
                                        <div className="flex items-center gap-2 w-full">
                                            <div
                                                className={cn(
                                                    "flex-1 px-3 py-2 rounded-lg",
                                                    "bg-white/5 border border-white/20",
                                                    "text-sm font-mono text-[rgba(255,255,255,0.9)]",
                                                    "break-all"
                                                )}
                                            >
                                                {formatTxHash(txHash)}
                                            </div>
                                            <button
                                                onClick={handleCopyTxHash}
                                                className={cn(
                                                    "p-2 rounded-lg transition-all duration-200",
                                                    "bg-white/10 border border-white/20",
                                                    "hover:bg-white/20 hover:border-white/30",
                                                    "active:scale-95"
                                                )}
                                                title="Copy transaction hash"
                                            >
                                                {copied ? (
                                                    <Check className="w-4 h-4 text-green-400" />
                                                ) : (
                                                    <Copy className="w-4 h-4 text-white" />
                                                )}
                                            </button>
                                            <a
                                                href={getBeratrailUrl(txHash)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={cn(
                                                    "p-2 rounded-lg transition-all duration-200",
                                                    "bg-white/10 border border-white/20",
                                                    "hover:bg-white/20 hover:border-white/30",
                                                    "active:scale-95"
                                                )}
                                                title="View on Explorer"
                                            >
                                                <ExternalLink className="w-4 h-4 text-white" />
                                            </a>
                                        </div>
                                        <span
                                            className={cn(
                                                "text-xs text-[rgba(255,255,255,0.5)] text-center",
                                                getResponsiveClass(15).textClass
                                            )}
                                        >
                                            Click the link icon to view on
                                            Beratrail
                                        </span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </EnhancedPortal>
    );
}
