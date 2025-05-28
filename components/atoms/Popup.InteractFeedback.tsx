/// components/atoms/Popup.InteractFeedback.tsx

"use client";

import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Portal from "./Portal";
import Lottie from "lottie-react";
import { TextAnimate } from "@/components/magicui/text-animate";
import { Confetti, type ConfettiRef } from "@/components/magicui/confetti";

interface InteractFeedbackProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    type?: "success" | "error" | "warning" | "info";
    autoCloseMs?: number;
}

export default function InteractFeedback({
    open,
    onClose,
    title,
    description,
    type = "success",
    autoCloseMs = 3000,
}: InteractFeedbackProps) {
    const [successLottie, setSuccessLottie] = useState<any>(null);
    const confettiRef = useRef<ConfettiRef>(null);
    const [confettiVisible, setConfettiVisible] = useState(false);

    // 자동 닫힘
    useEffect(() => {
        if (open && autoCloseMs) {
            const timer = setTimeout(onClose, autoCloseMs);
            return () => clearTimeout(timer);
        }
    }, [open, autoCloseMs, onClose]);

    // Lottie fetch
    useEffect(() => {
        if (type === "success") {
            fetch("/lottie/success.json")
                .then((res) => res.json())
                .then(setSuccessLottie);
        }
    }, [type]);

    // 팝업이 열릴 때 confetti 실행
    useEffect(() => {
        if (open && type === "success") {
            setConfettiVisible(true);
            confettiRef.current?.fire({
                particleCount: 100,
                ticks: autoCloseMs,
            });
        }
        // 팝업이 닫힐 때 confetti를 잠시 더 유지
        if (!open && confettiVisible) {
            const timer = setTimeout(() => setConfettiVisible(false), 800); // 0.8초 후 confetti 숨김
            return () => clearTimeout(timer);
        }
    }, [open, type, autoCloseMs, confettiVisible]);

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
                        {/* Confetti는 카드 위에 겹치도록 배치 */}
                        {confettiVisible && (
                            <Confetti
                                ref={confettiRef}
                                className="absolute left-0 top-0 z-[1100] w-full h-full pointer-events-none"
                            />
                        )}
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
                                className="text-xl font-main text-center text-white"
                            >
                                {title}
                            </TextAnimate>
                            {description && (
                                <TextAnimate
                                    animation="slideLeft"
                                    by="word"
                                    duration={0.9}
                                    delay={0.2}
                                    once
                                    className="text-base text-center text-[rgba(255,255,255,0.85)]"
                                >
                                    {description}
                                </TextAnimate>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Portal>
    );
}
