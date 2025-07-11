/// components/atoms/Popup.tsx

import { useEffect } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils/tailwind";

import EnhancedPortal from "./Portal.Enhanced";

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
    withoutBackgroundImage?: boolean;
    withoutBorder?: boolean;
    onClose: () => void;
}

export default function Popup({
    children,
    width = "320px",
    height = "auto",
    fullScreen = false,
    className = "",
    closeButton = true,
    closeButtonColor = "text-muted-foreground",
    open,
    backgroundImage,
    withoutBackgroundImage = false,
    withoutBorder = false,
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
        <EnhancedPortal layer="popup">
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.45)] backdrop-blur-sm z-30"
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
                                width: fullScreen ? "100vw" : "auto",
                                height: fullScreen ? "100vh" : "auto",
                                maxWidth: fullScreen ? "100vw" : width,
                                maxHeight: fullScreen ? "100vh" : height,
                            }}
                            className={cn(
                                "shadow-lg relative overflow-hidden bg-gradient-to-br from-[rgba(0,0,0,0.3)] to-[rgba(0,0,0,0.8)] backdrop-blur-lg",
                                "flex items-center justify-center",
                                fullScreen
                                    ? "rounded-none m-0"
                                    : withoutBorder
                                    ? "rounded-3xl m-2"
                                    : "rounded-3xl gradient-border m-2",
                                className
                            )}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {!withoutBackgroundImage && (
                                <Image
                                    src={backgroundImage || "/bg/popup.svg"}
                                    alt="Popup Background"
                                    width={100}
                                    height={100}
                                    className="absolute inset-0 w-full h-full object-cover opacity-70 bg-blend-overlay -z-50"
                                    style={{ filter: "blur(5px)" }}
                                />
                            )}
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
        </EnhancedPortal>
    );
}
