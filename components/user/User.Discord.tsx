/// components\user\User.Discord.tsx

"use client";

import { useCallback } from "react";

import { motion } from "framer-motion";
import { ExternalLink, ArrowRight, Copy } from "lucide-react";

import { useToast } from "@/app/hooks/useToast";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

import type { User } from "next-auth";
import { useUserWallet } from "@/app/story/userWallet/hooks";

interface UserDiscordProps {
    user: User;
}

export default function UserDiscord({ user }: UserDiscordProps) {
    const toast = useToast();
    const { defaultUserWallet } = useUserWallet({
        getDefaultUserWalletInput: {
            userId: user.id ?? "",
        },
    });

    const handleOpenCollab = useCallback(() => {
        window.open("https://discord.gg/starglow", "_blank");
        toast.success(
            "Opening Discord server - Follow the verification steps! 🎉"
        );
    }, [toast]);

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center",
                "w-full max-w-[500px] mx-auto",
                "px-4 sm:px-3 md:px-4 lg:px-6"
            )}
        >
            <div
                className={cn(
                    "bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/20",
                    "backdrop-blur-lg border border-indigo-500/30",
                    "rounded-2xl text-center shadow-2xl w-full",
                    getResponsiveClass(35).paddingClass
                )}
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className={cn(getResponsiveClass(25).marginYClass)}
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
                        "font-bold text-white",
                        getResponsiveClass(10).marginYClass,
                        getResponsiveClass(25).textClass
                    )}
                >
                    HOW TO VERIFY YOUR NFTs
                </h3>
                <p
                    className={cn(
                        "text-gray-400",
                        getResponsiveClass(35).marginYClass,
                        getResponsiveClass(15).textClass
                    )}
                >
                    Follow these steps to verify your NFT ownership and get the
                    HOLDER role
                </p>

                {/* Verification Steps */}
                <div
                    className={cn(
                        "bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-xl border border-blue-500/20",
                        getResponsiveClass(25).paddingClass,
                        getResponsiveClass(35).marginYClass
                    )}
                >
                    <div
                        className={cn(
                            "text-left space-y-4",
                            getResponsiveClass(15).textClass
                        )}
                    >
                        <div
                            className={cn(
                                "flex items-start",
                                getResponsiveClass(15).gapClass
                            )}
                        >
                            <div
                                className={cn(
                                    "flex-shrink-0 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold",
                                    getResponsiveClass(25).frameClass,
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                1
                            </div>
                            <p className="text-gray-300">
                                Join the{" "}
                                <span className="text-blue-300 font-semibold">
                                    Starglow Discord Server
                                </span>
                            </p>
                        </div>
                        <div
                            className={cn(
                                "flex items-start",
                                getResponsiveClass(15).gapClass
                            )}
                        >
                            <div
                                className={cn(
                                    "flex-shrink-0 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold",
                                    getResponsiveClass(25).frameClass,
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                2
                            </div>
                            <p className="text-gray-300">
                                Go to the channel{" "}
                                <span
                                    className={cn(
                                        "text-indigo-300 font-bold bg-gray-800/30 rounded-[4px]",
                                        getResponsiveClass(5).paddingClass
                                    )}
                                >
                                    🔒ㅣnft-verify
                                </span>
                            </p>
                        </div>
                        <div
                            className={cn(
                                "flex items-start",
                                getResponsiveClass(15).gapClass
                            )}
                        >
                            <div
                                className={cn(
                                    "flex-shrink-0 bg-purple-700 rounded-full flex items-center justify-center text-white font-bold",
                                    getResponsiveClass(25).frameClass,
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                3
                            </div>
                            <p className="text-gray-300">
                                Click{" "}
                                <span className="text-purple-300 font-semibold">
                                    {`"Let's Go"`}
                                </span>
                            </p>
                        </div>

                        <div
                            className={cn(
                                "flex items-start",
                                getResponsiveClass(15).gapClass
                            )}
                        >
                            <div
                                className={cn(
                                    "flex-shrink-0 bg-violet-500 rounded-full flex items-center justify-center text-white font-bold",
                                    getResponsiveClass(25).frameClass,
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                4
                            </div>
                            <p className="text-gray-300">
                                Click{" "}
                                <span className="text-violet-300 font-semibold">
                                    {`"Connect Wallet"`}
                                </span>
                            </p>
                        </div>

                        <div
                            className={cn(
                                "flex flex-col items-start",
                                getResponsiveClass(15).gapClass
                            )}
                        >
                            <div className="flex items-start gap-2">
                                <div
                                    className={cn(
                                        "flex-shrink-0 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold",
                                        getResponsiveClass(25).frameClass,
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    5
                                </div>
                                <p className="text-gray-300">
                                    Visit{" "}
                                    <span className="text-cyan-300 font-semibold">
                                        Collab.Land
                                    </span>{" "}
                                    and link your wallet
                                </p>
                            </div>

                            {defaultUserWallet &&
                                typeof defaultUserWallet === "object" && (
                                    <div
                                        className={cn(
                                            "flex items-center gap-2 w-full truncate",
                                            "cursor-pointer",
                                            "bg-gray-800/30 rounded-[4px] p-1",
                                            "transition-all duration-300",
                                            getResponsiveClass(5).textClass
                                        )}
                                        onClick={async () => {
                                            await navigator.clipboard
                                                .writeText(
                                                    defaultUserWallet.address
                                                )
                                                .catch((error) => {
                                                    console.error(error);
                                                });
                                            toast.success(
                                                "Copied to clipboard"
                                            );
                                        }}
                                    >
                                        <p className="text-gray-300">
                                            {defaultUserWallet.address}
                                        </p>{" "}
                                        <Copy
                                            className={cn(
                                                getResponsiveClass(10)
                                                    .frameClass
                                            )}
                                        />
                                    </div>
                                )}
                        </div>

                        <div
                            className={cn(
                                "flex items-start",
                                getResponsiveClass(15).gapClass
                            )}
                        >
                            <div
                                className={cn(
                                    "flex-shrink-0 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold",
                                    getResponsiveClass(25).frameClass,
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                6
                            </div>
                            <p className="text-gray-300">
                                Click{" "}
                                <span className="text-emerald-300 font-semibold">
                                    {`"Use Connected Wallets"`}
                                </span>
                            </p>
                        </div>

                        <div
                            className={cn(
                                "flex items-start",
                                getResponsiveClass(15).gapClass
                            )}
                        >
                            <div
                                className={cn(
                                    "flex-shrink-0 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold",
                                    getResponsiveClass(25).frameClass,
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                7
                            </div>
                            <p className="text-gray-300">
                                {`Once your NFT ownership is verified, you'll
                                automatically receive the `}
                                <span className="text-pink-300 font-semibold">
                                    HOLDER role
                                </span>{" "}
                                🎉
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div
                    className={cn(
                        "flex flex-col",
                        getResponsiveClass(20).gapClass
                    )}
                >
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleOpenCollab}
                        className={cn(
                            "bg-gradient-to-r from-indigo-500 to-purple-500",
                            "text-white font-bold rounded-full",
                            "hover:from-indigo-600 hover:to-purple-600",
                            "transition-all duration-300 shadow-lg",
                            "flex items-center justify-center",
                            getResponsiveClass(10).gapClass,
                            getResponsiveClass(20).paddingClass,
                            getResponsiveClass(20).textClass
                        )}
                    >
                        <ExternalLink
                            className={cn(getResponsiveClass(25).frameClass)}
                        />
                        Join Discord Server
                        <ArrowRight
                            className={cn(getResponsiveClass(20).frameClass)}
                        />
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
