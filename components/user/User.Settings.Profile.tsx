/// components\user\User.Settings.Profile.tsx

"use client";

import { useMemo, useState } from "react";

import { motion } from "framer-motion";
import { Settings, User as UserIcon, PencilLineIcon } from "lucide-react";

import { usePlayerGet, usePlayerSet } from "@/app/hooks/usePlayer";
import { useToast } from "@/app/hooks/useToast";
import FileUploader from "@/components/atoms/FileUploader";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { useSession } from "next-auth/react";
import Image from "next/image";

interface UserSettingsProfileProps {
    showNickname?: boolean;
    showImage?: boolean;
}

export default function UserSettingsProfile({
    showNickname = true,
    showImage = true,
}: UserSettingsProfileProps) {
    const toast = useToast();
    const { data: session } = useSession();
    const { updatePlayerSettings, isUpdatePlayerSettingsPending } =
        usePlayerSet();

    const { playerProfile, refetchPlayerProfile } = usePlayerGet({
        getPlayerProfileInput: {
            playerId: session?.player?.id || "",
        },
    });

    const { initialNickname, initialImage } = useMemo(() => {
        return {
            initialNickname:
                playerProfile?.name ||
                session?.user.name ||
                session?.user.email ||
                "",
            initialImage: playerProfile?.image || session?.user.image || "",
        };
    }, [playerProfile, session]);

    const [nickname, setNickname] = useState(initialNickname);
    const [image, setImage] = useState(initialImage);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await updatePlayerSettings({
            playerId: session?.player?.id || "",
            nickname,
            image,
        });
        if (!result) {
            toast.error("Failed to update player settings");
        } else {
            toast.success("Successfully updated!");
            refetchPlayerProfile().catch((error) => {
                console.error("Error refetching player profile:", error);
            });
        }
    };

    const handleImageUpload = (files: { id: string; url: string }[]) => {
        if (files.length > 0) {
            setImage(files[0].url);
        }
    };

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "bg-gradient-to-br from-purple-900/20 via-indigo-900/20 to-blue-900/20",
                "backdrop-blur-lg border border-purple-500/30",
                "rounded-2xl shadow-2xl w-full space-y-3 py-[15px] px-[10px]"
            )}
        >
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-3"
            >
                <div
                    className={cn(
                        "rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20",
                        "border border-purple-500/30 p-3"
                    )}
                >
                    <Settings
                        className={cn(
                            "text-purple-400",
                            getResponsiveClass(25).frameClass
                        )}
                    />
                </div>
                <div>
                    <h2
                        className={cn(
                            "font-bold text-white",
                            getResponsiveClass(25).textClass
                        )}
                    >
                        Edit Profile
                    </h2>
                    <p
                        className={cn(
                            "text-gray-400",
                            getResponsiveClass(10).textClass
                        )}
                    >
                        Update your profile information
                    </p>
                </div>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-3">
                    {showImage && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className={cn(
                                "bg-gradient-to-br from-indigo-900/30 to-purple-900/30",
                                "border border-indigo-500/20 rounded-xl p-3"
                            )}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <UserIcon
                                    className={cn(
                                        "text-indigo-400",
                                        getResponsiveClass(20).frameClass
                                    )}
                                />
                                <h3
                                    className={cn(
                                        "font-medium text-white",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    Profile Image
                                </h3>
                            </div>
                            <div className="flex flex-col md:flex-row items-center gap-3">
                                {image && (
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="flex-shrink-0"
                                    >
                                        <div
                                            className={cn(
                                                "rounded-full ring-4 ring-purple-500/30",
                                                "bg-gradient-to-br from-purple-500/10 to-indigo-500/10",
                                                "p-1"
                                            )}
                                        >
                                            <Image
                                                src={
                                                    image ||
                                                    "/default-avatar.jpg"
                                                }
                                                alt="Profile preview"
                                                width={100}
                                                height={100}
                                                className={cn(
                                                    "rounded-full object-cover",
                                                    getResponsiveClass(80)
                                                        .frameClass
                                                )}
                                                unoptimized={true}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                                <div className="flex-1 w-full">
                                    <FileUploader
                                        purpose="profile"
                                        bucket="profiles"
                                        onComplete={handleImageUpload}
                                        multiple={false}
                                        maxSize={5 * 1024 * 1024}
                                        className={cn(
                                            "bg-gradient-to-br from-gray-800/50 to-gray-900/50",
                                            "border border-gray-600/50 hover:border-purple-500/50",
                                            "rounded-xl transition-all duration-300",
                                            "hover:bg-gradient-to-br hover:from-purple-900/20 hover:to-indigo-900/20"
                                        )}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {showNickname && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className={cn(
                                "bg-gradient-to-br from-blue-900/30 to-cyan-900/30",
                                "border border-blue-500/20 rounded-xl p-3"
                            )}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <PencilLineIcon
                                    className={cn(
                                        "text-blue-400",
                                        getResponsiveClass(20).frameClass
                                    )}
                                />
                                <h3
                                    className={cn(
                                        "font-medium text-white",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    Display Name
                                </h3>
                            </div>
                            <input
                                type="text"
                                id="nickname"
                                value={nickname}
                                placeholder="Enter your display name"
                                onChange={(e) => setNickname(e.target.value)}
                                className={cn(
                                    "w-full bg-gradient-to-br from-gray-800/50 to-gray-900/50",
                                    "border border-gray-600/50 rounded-[8px]",
                                    "text-white placeholder-gray-400",
                                    "focus:outline-none focus:border-blue-500/50",
                                    "focus:bg-gradient-to-br focus:from-blue-900/20 focus:to-cyan-900/20",
                                    "transition-all duration-300",
                                    getResponsiveClass(15).textClass,
                                    getResponsiveClass(15).paddingClass
                                )}
                            />
                        </motion.div>
                    )}

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <motion.button
                            type="submit"
                            disabled={isUpdatePlayerSettingsPending}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                                "w-full bg-gradient-to-r from-purple-500 to-indigo-500",
                                "text-white font-bold rounded-[8px]",
                                "hover:from-purple-600 hover:to-indigo-600",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                "transition-all duration-300 shadow-lg",
                                "hover:shadow-purple-500/25 hover:shadow-2xl",
                                getResponsiveClass(20).textClass,
                                getResponsiveClass(25).paddingClass
                            )}
                        >
                            {isUpdatePlayerSettingsPending
                                ? "Saving..."
                                : "Save Changes"}
                        </motion.button>
                    </motion.div>
                </div>
            </form>
        </motion.section>
    );
}
