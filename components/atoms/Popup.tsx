/// components/atoms/Popup.tsx

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/tailwind";

interface PopupProps {
    children: React.ReactNode;
    width?: string;
    height?: string;
    className?: string;
    open: boolean;
    onClose: () => void;
}

export default function Popup({ children, width = "400px", height = "auto", className = "", open, onClose }: PopupProps) {

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
                    className="fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.4)] backdrop-blur-sm z-50"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 1, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 1, y: 50, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        style={{ width, height }}
                        className={cn("m-2 rounded-xl shadow-lg relative overflow-hidden bg-[rgba(0,0,0,0.6)]", className)}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                            onClick={onClose}
                        >
                            <X size={20} />
                        </button>
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
