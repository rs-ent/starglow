/// components/user/User.Settings.tsx

"use client";

import { motion } from "framer-motion";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import UserSettingsProfile from "./User.Settings.Profile";
import UserSettingsReferral from "./User.Settings.Referral";

import type { Player, ReferralLog } from "@prisma/client";
import type { User } from "next-auth";

interface UserSettingsProps {
    user: User;
    player: Player;
    referralLogs: ReferralLog[];
}

export default function UserSettings({
    user,
    player,
    referralLogs,
}: UserSettingsProps) {
    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/?signedOut=true" });
    };

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center",
                "w-screen max-w-[1000px] mx-auto mb-[100px]",
                "px-4 sm:px-3 md:px-4 lg:px-6",
                "gap-4 md:gap-6"
            )}
        >
            {/* Profile Settings */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="w-full"
            >
                <UserSettingsProfile player={player} user={user} />
            </motion.div>

            {/* Referral Settings */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="w-full"
            >
                <UserSettingsReferral
                    player={player}
                    referralLogs={referralLogs}
                />
            </motion.div>

            {/* Sign Out Section */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className={cn(
                    "w-full bg-gradient-to-br from-red-900/20 via-pink-900/20 to-orange-900/20",
                    "backdrop-blur-lg border border-red-500/30",
                    "rounded-2xl p-3 shadow-2xl"
                )}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                "rounded-[8px] bg-gradient-to-br from-red-500/20 to-pink-500/20",
                                "border border-red-500/30 p-2"
                            )}
                        >
                            <LogOut
                                className={cn(
                                    "text-red-400",
                                    getResponsiveClass(20).frameClass
                                )}
                            />
                        </div>
                        <div>
                            <h3
                                className={cn(
                                    "font-bold text-white",
                                    getResponsiveClass(20).textClass
                                )}
                            >
                                Sign Out
                            </h3>
                            <p
                                className={cn(
                                    "text-gray-400",
                                    getResponsiveClass(5).textClass
                                )}
                            >
                                End your current session
                            </p>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSignOut}
                        className={cn(
                            "bg-gradient-to-r from-red-500 to-pink-500",
                            "text-white font-bold rounded-[6px]",
                            "hover:from-red-600 hover:to-pink-600",
                            "transition-all duration-300 shadow-lg",
                            "hover:shadow-red-500/25 hover:shadow-2xl",
                            "flex items-center gap-2",
                            getResponsiveClass(10).textClass,
                            getResponsiveClass(20).paddingClass
                        )}
                    >
                        <LogOut
                            className={cn(getResponsiveClass(15).frameClass)}
                        />
                        Sign Out
                    </motion.button>
                </div>
            </motion.section>
        </div>
    );
}
