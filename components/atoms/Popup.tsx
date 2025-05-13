/// components/atoms/Popup.tsx

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/tailwind";
import Image from "next/image";

interface PopupProps {
    children: React.ReactNode;
    width?: string;
    height?: string;
    fullScreen?: boolean;
    className?: string;
    open: boolean;
    closeButton?: boolean;
    closeButtonColor?: string;
    backgroundImage?: string;
    onClose: () => void;
}

export default function Popup({
    children,
    width = "400px",
    height = "auto",
    fullScreen = false,
    className = "",
    closeButton = true,
    closeButtonColor = "text-muted-foreground",
    open,
    backgroundImage,
    onClose,
}: PopupProps) {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 items-center justify-center bg-[rgba(0,0,0,0.45)] backdrop-blur-sm z-50"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 1, y: -70, filter: "blur(10px)" }}
                        animate={{ scale: 1, y: 0, filter: "blur(0)" }}
                        exit={{
                            scale: 1,
                            y: 70,
                            opacity: 0,
                            filter: "blur(20px)",
                        }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        style={{
                            width: fullScreen ? "100vw" : width,
                            height: fullScreen ? "100vh" : height,
                        }}
                        className={cn(
                            "shadow-lg relative overflow-hidden bg-gradient-to-br from-[rgba(0,0,0,0.3)] to-[rgba(0,0,0,0.8)] backdrop-blur-lg",
                            "flex items-center justify-center",
                            fullScreen
                                ? "rounded-none m-0"
                                : "rounded-3xl gradient-border m-2",
                            className
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={backgroundImage || "/bg/popup.svg"}
                            alt="Popup Background"
                            width={100}
                            height={100}
                            className="absolute inset-0 w-full h-full object-cover opacity-80 bg-blend-overlay -z-50"
                        />
                        {closeButton && (
                            <button
                                className={cn(
                                    "absolute top-2 right-2 text-muted-foreground hover:text-foreground",
                                    closeButtonColor
                                )}
                                onClick={onClose}
                            >
                                <X size={30} />
                            </button>
                        )}
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
