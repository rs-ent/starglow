/// components\user\User.Settings.Profile.Modal.tsx

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils/tailwind";

import UserSettingsProfile from "./User.Settings.Profile";
import EnhancedPortal from "../atoms/Portal.Enhanced";

import type { Player } from "@prisma/client";
import type { User } from "next-auth";

interface UserSettingsProfileModalProps {
    player: Player;
    user: User;
    showNickname?: boolean;
    showImage?: boolean;
    onClose: () => void;
}

export default function UserSettingsProfileModal({
    player,
    user,
    showNickname = true,
    showImage = true,
    onClose,
}: UserSettingsProfileModalProps) {
    return (
        <EnhancedPortal layer="modal">
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                        "fixed inset-0 z-50 flex items-center justify-center",
                        "bg-black/60 backdrop-blur-sm",
                        "px-4 py-6 overflow-y-auto"
                    )}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{
                            duration: 0.3,
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                        }}
                        className={cn(
                            "relative w-full max-w-[800px] mx-auto",
                            "bg-gradient-to-br from-gray-900/95 via-purple-900/95 to-indigo-900/95",
                            "backdrop-blur-xl border border-purple-500/30",
                            "rounded-2xl shadow-2xl overflow-hidden"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            className={cn(
                                "absolute top-4 right-4 z-10",
                                "bg-gradient-to-br from-red-500/20 to-pink-500/20",
                                "border border-red-500/30 rounded-full p-2",
                                "text-red-300 hover:text-white",
                                "hover:bg-gradient-to-br hover:from-red-500/30 hover:to-pink-500/30",
                                "transition-all duration-300"
                            )}
                        >
                            <XIcon className="w-5 h-5" />
                        </motion.button>

                        {/* Modal Content */}
                        <div className="p-6">
                            <UserSettingsProfile
                                player={player}
                                user={user}
                                showNickname={showNickname}
                                showImage={showImage}
                            />
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </EnhancedPortal>
    );
}
