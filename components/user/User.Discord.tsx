/// components\user\User.Discord.tsx

"use client";

import { useCallback, useState } from "react";

import { motion } from "framer-motion";
import {
    Copy,
    CheckCircle2,
    Shield,
    Sparkles,
    RefreshCcw,
    ExternalLink,
    Link,
} from "lucide-react";

import { useDiscord } from "@/app/hooks/useDiscord";
import { useToast } from "@/app/hooks/useToast";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import type { User } from "next-auth";

interface UserDiscordProps {
    user: User;
}

export default function UserDiscord({ user }: UserDiscordProps) {
    const [discordCode, setDiscordCode] = useState<string>("");
    const [copiedCode, setCopiedCode] = useState(false);

    const toast = useToast();
    const { createDiscordCodeAsync, createDiscordCodePending } = useDiscord();

    const handleGenerateCode = async () => {
        try {
            const result = await createDiscordCodeAsync({ input: { user } });
            setDiscordCode(result.code);
            toast.success("Discord verification code generated! 🎉");
        } catch (error) {
            console.error("Error generating Discord code:", error);
            toast.error("Failed to generate code. Please try again.");
        }
    };

    const handleCopy = useCallback(
        async (value: string) => {
            await navigator.clipboard.writeText(value);
            setCopiedCode(true);
            toast.success("Copied to clipboard");
            setTimeout(() => setCopiedCode(false), 2000);
        },
        [toast]
    );

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center",
                "w-full max-w-[500px] mx-auto",
                getResponsiveClass(20).paddingClass
            )}
        >
            {!discordCode ? (
                // 코드 발급 화면
                <div
                    className={cn(
                        "bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/20",
                        "backdrop-blur-lg border border-indigo-500/30",
                        "rounded-2xl p-8 text-center shadow-2xl w-full"
                    )}
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="mb-6"
                    >
                        <img
                            src="/icons/providers/discord.svg"
                            alt="Discord"
                            className={cn(
                                "mx-auto text-indigo-400",
                                getResponsiveClass(60).frameClass
                            )}
                        />
                    </motion.div>

                    <h3
                        className={cn(
                            "font-bold text-white mb-2",
                            getResponsiveClass(25).textClass
                        )}
                    >
                        🔗 Discord Verification
                    </h3>
                    <p
                        className={cn(
                            "text-gray-400 mb-8",
                            getResponsiveClass(15).textClass
                        )}
                    >
                        Generate a code to verify your NFT ownership in Discord
                    </p>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleGenerateCode}
                        disabled={createDiscordCodePending}
                        className={cn(
                            "bg-gradient-to-r from-indigo-500 to-purple-500",
                            "text-white font-bold rounded-full",
                            "hover:from-indigo-600 hover:to-purple-600",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            "transition-all duration-300 shadow-lg",
                            "flex items-center gap-2 mx-auto",
                            getResponsiveClass(20).paddingClass,
                            getResponsiveClass(20).textClass
                        )}
                    >
                        {createDiscordCodePending ? (
                            <>
                                <RefreshCcw
                                    className={cn(
                                        "animate-spin",
                                        getResponsiveClass(25).frameClass
                                    )}
                                />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Shield
                                    className={cn(
                                        getResponsiveClass(25).frameClass
                                    )}
                                />
                                Generate Code
                            </>
                        )}
                    </motion.button>
                </div>
            ) : (
                // 코드 표시 화면
                <div
                    className={cn(
                        "bg-gradient-to-br from-emerald-900/20 via-cyan-900/20 to-blue-900/20",
                        "backdrop-blur-lg border border-emerald-500/30",
                        "rounded-2xl p-8 text-center shadow-2xl w-full"
                    )}
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="mb-6"
                    >
                        <Sparkles
                            className={cn(
                                "mx-auto text-emerald-400",
                                getResponsiveClass(60).frameClass
                            )}
                        />
                    </motion.div>

                    <h3
                        className={cn(
                            "font-bold text-white mb-2",
                            getResponsiveClass(25).textClass
                        )}
                    >
                        Verification Code
                    </h3>
                    <p
                        className={cn(
                            "text-gray-400 mb-6",
                            getResponsiveClass(15).textClass
                        )}
                    >
                        Use this code in our Discord server to get verified!
                    </p>

                    {/* Code Display */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className={cn(
                            "bg-black/40 border-2 border-dashed border-emerald-400/50",
                            "rounded-2xl p-6 mb-6 relative overflow-hidden"
                        )}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-cyan-400/10 animate-pulse" />
                        <p
                            className={cn(
                                "text-emerald-300 font-mono font-bold tracking-[0.5em] relative z-10",
                                getResponsiveClass(35).textClass
                            )}
                        >
                            {discordCode}
                        </p>
                    </motion.div>

                    {/* Copy Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCopy(discordCode)}
                        className={cn(
                            "bg-gradient-to-r from-emerald-500 to-cyan-500",
                            "text-white font-bold rounded-full mb-6",
                            "hover:from-emerald-600 hover:to-cyan-600",
                            "transition-all duration-300 shadow-lg",
                            "flex items-center gap-2 mx-auto",
                            getResponsiveClass(20).paddingClass,
                            getResponsiveClass(20).textClass
                        )}
                    >
                        {copiedCode ? (
                            <>
                                <CheckCircle2
                                    className={cn(
                                        getResponsiveClass(25).frameClass
                                    )}
                                />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy
                                    className={cn(
                                        getResponsiveClass(25).frameClass
                                    )}
                                />
                                Copy Code
                            </>
                        )}
                    </motion.button>

                    {/* Instructions */}
                    <div
                        className={cn(
                            "bg-gradient-to-r from-blue-900/30 to-indigo-900/30 p-4 rounded-xl border border-blue-500/20 mb-6"
                        )}
                    >
                        <h4
                            className={cn(
                                "font-bold text-blue-300 mb-2",
                                getResponsiveClass(25).textClass
                            )}
                        >
                            📋 How to Use:
                        </h4>
                        <div
                            className={cn(
                                "text-left space-y-2",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            <Link
                                href="https://discord.gg/starglow"
                                target="_blank"
                                className="text-gray-400 underline"
                            >
                                1. Join our Discord server
                            </Link>
                            <p className="text-gray-400">
                                2. Type:{" "}
                                <code
                                    className="bg-black/30 px-2 py-1 rounded text-cyan-300 cursor-pointer"
                                    onClick={() => {
                                        handleCopy(
                                            `/verify ${discordCode}`
                                        ).catch((error) => {
                                            console.error(
                                                "Failed to copy code:",
                                                error
                                            );
                                        });
                                    }}
                                >
                                    /verify {discordCode}
                                </code>
                            </p>
                            <p className="text-gray-400">
                                3. Get your NFT Holder role! 🎉
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                                window.open(
                                    "https://discord.gg/starglow",
                                    "_blank"
                                )
                            }
                            className={cn(
                                "flex-1 bg-indigo-600 text-white font-bold rounded-full",
                                "hover:bg-indigo-700 transition-all duration-300",
                                "flex items-center justify-center gap-2",
                                getResponsiveClass(20).paddingClass,
                                getResponsiveClass(20).textClass
                            )}
                        >
                            <ExternalLink
                                className={cn(
                                    getResponsiveClass(25).frameClass
                                )}
                            />
                            Join Discord
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setDiscordCode("")}
                            className={cn(
                                "flex-1 bg-gradient-to-r from-purple-500 to-pink-500",
                                "text-white font-bold rounded-full",
                                "hover:from-purple-600 hover:to-pink-600",
                                "transition-all duration-300",
                                "flex items-center justify-center gap-2",
                                getResponsiveClass(20).paddingClass,
                                getResponsiveClass(20).textClass
                            )}
                        >
                            <RefreshCcw
                                className={cn(
                                    getResponsiveClass(25).frameClass
                                )}
                            />
                            New Code
                        </motion.button>
                    </div>
                </div>
            )}
        </div>
    );
}
