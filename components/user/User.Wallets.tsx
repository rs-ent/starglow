/// components\user\User.Wallets.tsx

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronDown,
    Shield,
    Download,
    Copy,
    Edit3,
    Check,
    X,
} from "lucide-react";
import Image from "next/image";

import { useUserWallet } from "@/app/story/userWallet/hooks";
import { useToast } from "@/app/hooks/useToast";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { WALLET_PROVIDERS } from "@/app/types/auth";
import NotifyWalletsBackup from "@/components/notifications/Notify.Wallets.Backup";
import type { User } from "next-auth";

interface UserWalletsProps {
    user: User;
}

export default function UserWallets({ user }: UserWalletsProps) {
    const toast = useToast();

    const { userWallets, refetchWallets, updateWalletAsync } = useUserWallet({
        getWalletsInput: {
            userId: user.id ?? "",
        },
    });

    const [selectedWalletId, setSelectedWalletId] = useState<string | null>(
        null
    );
    const [isWalletSelectorExpanded, setIsWalletSelectorExpanded] =
        useState(false);
    const [showBackupModal, setShowBackupModal] = useState(false);
    const [isEditingNickname, setIsEditingNickname] = useState(false);
    const [editNickname, setEditNickname] = useState("");
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">(
        "ACTIVE"
    );

    const selectedWallet = useMemo(
        () =>
            Array.isArray(userWallets)
                ? userWallets.find((wallet) => wallet.id === selectedWalletId)
                : null,
        [userWallets, selectedWalletId]
    );

    const formatAddress = useCallback((address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }, []);

    const getProviderInfo = useCallback((provider: string) => {
        const key = provider === "metaMaskSDK" ? "metamask" : provider;
        return (
            WALLET_PROVIDERS[key as keyof typeof WALLET_PROVIDERS] || {
                name: provider,
                icon: "/ui/wallet.svg",
                color: "bg-gray-500",
            }
        );
    }, []);

    const copyToClipboard = useCallback(
        async (text: string, label: string) => {
            try {
                await navigator.clipboard.writeText(text);
                toast.success(`${label} copied to clipboard!`);
            } catch (error) {
                console.error(error);
                toast.error(`Failed to copy ${label}`);
            }
        },
        [toast]
    );

    const handleDataRefresh = useCallback(async () => {
        await refetchWallets();
    }, [refetchWallets]);

    const handleEditNickname = useCallback(() => {
        if (selectedWallet) {
            setEditNickname(selectedWallet.nickname || "");
            setIsEditingNickname(true);
        }
    }, [selectedWallet]);

    const handleSaveNickname = useCallback(async () => {
        if (!selectedWallet || !user.id) return;

        try {
            const result = await updateWalletAsync({
                userId: user.id,
                walletAddress: selectedWallet.address,
                nickname: editNickname || undefined,
            });

            if (typeof result === "string") {
                toast.error(result);
                return;
            }

            toast.success("Nickname updated successfully!");
            setIsEditingNickname(false);
            await refetchWallets();
        } catch (error) {
            toast.error("Failed to update nickname");
            console.error("Update nickname error:", error);
        }
    }, [
        selectedWallet,
        user.id,
        editNickname,
        updateWalletAsync,
        toast,
        refetchWallets,
    ]);

    const handleCancelEdit = useCallback(() => {
        setIsEditingNickname(false);
        setEditNickname("");
    }, []);

    const handleEditStatus = useCallback(() => {
        if (selectedWallet) {
            setEditStatus(selectedWallet.status as "ACTIVE" | "INACTIVE");
            setIsEditingStatus(true);
        }
    }, [selectedWallet]);

    const handleSaveStatus = useCallback(async () => {
        if (!selectedWallet || !user.id) return;

        try {
            const result = await updateWalletAsync({
                userId: user.id,
                walletAddress: selectedWallet.address,
                status: editStatus,
            });

            if (typeof result === "string") {
                toast.error(result);
                return;
            }

            toast.success("Status updated successfully!");
            setIsEditingStatus(false);
            await refetchWallets();
        } catch (error) {
            toast.error("Failed to update status");
            console.error("Update status error:", error);
        }
    }, [
        selectedWallet,
        user.id,
        editStatus,
        updateWalletAsync,
        toast,
        refetchWallets,
    ]);

    const handleCancelStatusEdit = useCallback(() => {
        setIsEditingStatus(false);
        setEditStatus("ACTIVE");
    }, []);

    useEffect(() => {
        if (
            userWallets &&
            Array.isArray(userWallets) &&
            userWallets.length > 0
        ) {
            setSelectedWalletId(userWallets[0].id);
        }
    }, [userWallets]);

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center",
                "w-screen max-w-[1000px] mx-auto mb-[100px]",
                "px-4 sm:px-3 md:px-4 lg:px-6",
                "gap-4 md:gap-6"
            )}
        >
            {/* 지갑 선택 버튼 */}
            <div className={cn("w-full", getResponsiveClass(10).marginYClass)}>
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() =>
                        setIsWalletSelectorExpanded(!isWalletSelectorExpanded)
                    }
                    className={cn(
                        "w-full rounded-lg md:rounded-xl bg-gradient-to-br from-white/5 to-white/10",
                        "border border-white/10 hover:border-white/20",
                        "flex items-center justify-between group transition-all duration-300",
                        isWalletSelectorExpanded &&
                            "bg-white/10 border-white/20",
                        getResponsiveClass(20).paddingClass
                    )}
                >
                    <div
                        className={cn(
                            "flex items-center min-w-0 flex-1",
                            getResponsiveClass(15).gapClass
                        )}
                    >
                        {selectedWallet ? (
                            <>
                                <div
                                    className={cn(
                                        "rounded-full flex items-center justify-center flex-shrink-0",
                                        getProviderInfo(selectedWallet.provider)
                                            .color,
                                        getResponsiveClass(40).frameClass
                                    )}
                                >
                                    <Image
                                        src={
                                            getProviderInfo(
                                                selectedWallet.provider
                                            ).icon
                                        }
                                        alt={
                                            getProviderInfo(
                                                selectedWallet.provider
                                            ).name
                                        }
                                        width={100}
                                        height={100}
                                        className={cn(
                                            getResponsiveClass(25).frameClass
                                        )}
                                    />
                                </div>
                                <div className="text-left min-w-0 flex-1">
                                    <div
                                        className={cn(
                                            "flex items-center",
                                            getResponsiveClass(10).gapClass,
                                            getResponsiveClass(5).marginYClass
                                        )}
                                    >
                                        <h3
                                            className={cn(
                                                "text-white font-bold truncate",
                                                getResponsiveClass(15).textClass
                                            )}
                                        >
                                            {selectedWallet.nickname ||
                                                getProviderInfo(
                                                    selectedWallet.provider
                                                ).name}
                                        </h3>
                                        {selectedWallet.default && (
                                            <span
                                                className={cn(
                                                    "bg-blue-500/20 text-blue-300 rounded-full px-2 py-0.5 font-medium flex-shrink-0",
                                                    getResponsiveClass(10)
                                                        .textClass
                                                )}
                                            >
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <p
                                        className={cn(
                                            "text-white/60 font-mono",
                                            getResponsiveClass(10).textClass
                                        )}
                                    >
                                        {formatAddress(selectedWallet.address)}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="text-left">
                                <h3
                                    className={cn(
                                        "text-white font-bold",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    Select a Wallet
                                </h3>
                                <p
                                    className={cn(
                                        "text-white/60",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    Choose a wallet to manage
                                </p>
                            </div>
                        )}
                    </div>
                    <ChevronDown
                        className={cn(
                            "text-white/60 group-hover:text-white/80 transition-all duration-300 ease-in-out flex-shrink-0",
                            getResponsiveClass(20).frameClass,
                            isWalletSelectorExpanded ? "rotate-180" : ""
                        )}
                    />
                </motion.button>

                {/* 지갑 선택 슬라이드 */}
                <AnimatePresence>
                    {isWalletSelectorExpanded && (
                        <motion.div
                            initial={{
                                opacity: 0,
                                height: 0,
                            }}
                            animate={{
                                opacity: 1,
                                height: "auto",
                            }}
                            exit={{
                                opacity: 0,
                                height: 0,
                            }}
                            transition={{
                                duration: 0.3,
                                ease: "easeInOut",
                            }}
                            className="overflow-hidden w-full"
                        >
                            <div
                                className={cn(
                                    "bg-gradient-to-br from-white/5 to-white/10",
                                    "rounded-b-md",
                                    "p-4",
                                    getResponsiveClass(20).marginXClass
                                )}
                            >
                                <div
                                    className={cn(
                                        "space-y-2 md:space-y-3",
                                        getResponsiveClass(10).gapClass
                                    )}
                                >
                                    {Array.isArray(userWallets) &&
                                        userWallets.map((wallet) => {
                                            const providerInfo =
                                                getProviderInfo(
                                                    wallet.provider
                                                );
                                            const isSelected =
                                                selectedWalletId === wallet.id;

                                            return (
                                                <button
                                                    key={wallet.id}
                                                    onClick={() => {
                                                        setSelectedWalletId(
                                                            wallet.id
                                                        );
                                                        setIsWalletSelectorExpanded(
                                                            false
                                                        );
                                                    }}
                                                    className={cn(
                                                        "w-full rounded-lg md:rounded-xl border text-left transition-all duration-200",
                                                        "bg-gradient-to-br from-white/5 to-white/10 hover:from-white/10 hover:to-white/15",
                                                        isSelected
                                                            ? "border-blue-400/60 bg-blue-500/10 ring-1 ring-blue-400/30"
                                                            : "border-white/10 hover:border-white/20",
                                                        getResponsiveClass(15)
                                                            .paddingClass
                                                    )}
                                                >
                                                    <div
                                                        className={cn(
                                                            "flex items-center min-w-0",
                                                            getResponsiveClass(
                                                                15
                                                            ).gapClass
                                                        )}
                                                    >
                                                        <div
                                                            className={cn(
                                                                "rounded-full flex items-center justify-center flex-shrink-0",
                                                                providerInfo.color,
                                                                getResponsiveClass(
                                                                    35
                                                                ).frameClass
                                                            )}
                                                        >
                                                            <img
                                                                src={
                                                                    providerInfo.icon
                                                                }
                                                                alt={
                                                                    providerInfo.name
                                                                }
                                                                className={cn(
                                                                    getResponsiveClass(
                                                                        20
                                                                    ).frameClass
                                                                )}
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div
                                                                className={cn(
                                                                    "flex items-center",
                                                                    getResponsiveClass(
                                                                        10
                                                                    ).gapClass,
                                                                    getResponsiveClass(
                                                                        5
                                                                    )
                                                                        .marginYClass
                                                                )}
                                                            >
                                                                <h4
                                                                    className={cn(
                                                                        "text-white font-medium truncate",
                                                                        getResponsiveClass(
                                                                            15
                                                                        )
                                                                            .textClass
                                                                    )}
                                                                >
                                                                    {wallet.nickname ||
                                                                        providerInfo.name}
                                                                </h4>
                                                                {wallet.default && (
                                                                    <span
                                                                        className={cn(
                                                                            "bg-blue-500/20 text-blue-300 rounded-full px-2 py-0.5 font-medium flex-shrink-0",
                                                                            getResponsiveClass(
                                                                                10
                                                                            )
                                                                                .textClass
                                                                        )}
                                                                    >
                                                                        Default
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p
                                                                className={cn(
                                                                    "text-white/60 font-mono",
                                                                    getResponsiveClass(
                                                                        10
                                                                    ).textClass
                                                                )}
                                                            >
                                                                {formatAddress(
                                                                    wallet.address
                                                                )}
                                                            </p>
                                                            <div
                                                                className={cn(
                                                                    "flex items-center",
                                                                    getResponsiveClass(
                                                                        5
                                                                    ).gapClass,
                                                                    getResponsiveClass(
                                                                        5
                                                                    )
                                                                        .marginYClass
                                                                )}
                                                            >
                                                                {wallet.privateKey ? (
                                                                    <span
                                                                        className={cn(
                                                                            "text-yellow-400 font-medium",
                                                                            getResponsiveClass(
                                                                                10
                                                                            )
                                                                                .textClass
                                                                        )}
                                                                    >
                                                                        🔒
                                                                        Managed
                                                                    </span>
                                                                ) : (
                                                                    <span
                                                                        className={cn(
                                                                            "text-green-400 font-medium",
                                                                            getResponsiveClass(
                                                                                10
                                                                            )
                                                                                .textClass
                                                                        )}
                                                                    >
                                                                        ✅
                                                                        Self-Custody
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 선택된 지갑 관리 UI */}
            {selectedWallet && (
                <div
                    className={cn(
                        "w-full space-y-6",
                        getResponsiveClass(25).gapClass
                    )}
                >
                    {/* 지갑 정보 카드 */}
                    <div
                        className={cn(
                            "bg-gradient-to-r",
                            selectedWallet.privateKey
                                ? "from-blue-900/20 to-purple-900/20 border-blue-500/30"
                                : "from-green-900/20 to-emerald-900/20 border-green-500/30",
                            "border rounded-xl",
                            getResponsiveClass(25).paddingClass
                        )}
                    >
                        <div
                            className={cn(
                                "flex items-center",
                                getResponsiveClass(20).gapClass,
                                getResponsiveClass(25).marginYClass
                            )}
                        >
                            <div
                                className={cn(
                                    "rounded-full flex items-center justify-center",
                                    getProviderInfo(selectedWallet.provider)
                                        .color,
                                    getResponsiveClass(65).frameClass
                                )}
                            >
                                <img
                                    src={
                                        getProviderInfo(selectedWallet.provider)
                                            .icon
                                    }
                                    alt={
                                        getProviderInfo(selectedWallet.provider)
                                            .name
                                    }
                                    className={cn(
                                        getResponsiveClass(40).frameClass
                                    )}
                                />
                            </div>
                            <div>
                                <div
                                    className={cn(
                                        "flex items-center",
                                        getResponsiveClass(15).gapClass,
                                        getResponsiveClass(10).marginYClass
                                    )}
                                >
                                    {isEditingNickname ? (
                                        <div className="flex items-center gap-2 flex-1">
                                            <input
                                                type="text"
                                                value={editNickname}
                                                onChange={(e) =>
                                                    setEditNickname(
                                                        e.target.value
                                                    )
                                                }
                                                className={cn(
                                                    "bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-1",
                                                    "text-white font-bold focus:outline-none focus:border-blue-400",
                                                    getResponsiveClass(20)
                                                        .textClass
                                                )}
                                                placeholder="Enter wallet nickname"
                                                autoFocus
                                            />
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleSaveNickname}
                                                className="text-green-400 hover:text-green-300 transition-colors"
                                            >
                                                <Check
                                                    className={cn(
                                                        getResponsiveClass(20)
                                                            .frameClass
                                                    )}
                                                />
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleCancelEdit}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                <X
                                                    className={cn(
                                                        getResponsiveClass(20)
                                                            .frameClass
                                                    )}
                                                />
                                            </motion.button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <h2
                                                    className={cn(
                                                        "text-white font-bold",
                                                        getResponsiveClass(25)
                                                            .textClass
                                                    )}
                                                >
                                                    {selectedWallet.nickname ||
                                                        getProviderInfo(
                                                            selectedWallet.provider
                                                        ).name}
                                                </h2>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={handleEditNickname}
                                                    className="text-gray-400 hover:text-white transition-colors"
                                                >
                                                    <Edit3
                                                        className={cn(
                                                            getResponsiveClass(
                                                                16
                                                            ).frameClass
                                                        )}
                                                    />
                                                </motion.button>
                                            </div>
                                            {selectedWallet.default && (
                                                <span
                                                    className={cn(
                                                        "rounded-full font-medium",
                                                        selectedWallet.privateKey
                                                            ? "bg-blue-500/20 text-blue-300"
                                                            : "bg-green-500/20 text-green-300",
                                                        getResponsiveClass(15)
                                                            .paddingClass,
                                                        getResponsiveClass(10)
                                                            .textClass
                                                    )}
                                                >
                                                    Default
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div
                                    className={cn(
                                        "flex items-center",
                                        getResponsiveClass(10).gapClass,
                                        getResponsiveClass(5).marginYClass
                                    )}
                                >
                                    {selectedWallet.privateKey ? (
                                        <>
                                            <Shield
                                                className={cn(
                                                    "text-yellow-400",
                                                    getResponsiveClass(15)
                                                        .frameClass
                                                )}
                                            />
                                            <span
                                                className={cn(
                                                    "text-yellow-400 font-medium",
                                                    getResponsiveClass(10)
                                                        .textClass
                                                )}
                                            >
                                                🔒 Managed by Starglow
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Shield
                                                className={cn(
                                                    "text-green-400",
                                                    getResponsiveClass(15)
                                                        .frameClass
                                                )}
                                            />
                                            <span
                                                className={cn(
                                                    "text-green-400 font-medium",
                                                    getResponsiveClass(10)
                                                        .textClass
                                                )}
                                            >
                                                ✅ Self-Custody
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 지갑 상세 정보 */}
                        <div
                            className={cn(
                                "grid grid-cols-1 md:grid-cols-2",
                                getResponsiveClass(25).gapClass
                            )}
                        >
                            <div>
                                <label
                                    className={cn(
                                        "text-gray-400 font-medium",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    Wallet Address
                                </label>
                                <div
                                    className={cn(
                                        "flex flex-row items-center cursor-pointer",
                                        getResponsiveClass(10).gapClass,
                                        getResponsiveClass(5).marginYClass
                                    )}
                                    onClick={() =>
                                        copyToClipboard(
                                            selectedWallet.address,
                                            "Address"
                                        )
                                    }
                                >
                                    <p
                                        className={cn(
                                            "text-white font-mono bg-gray-700/50 rounded-[4px]",
                                            getResponsiveClass(10).paddingClass,
                                            getResponsiveClass(10).textClass
                                        )}
                                    >
                                        {selectedWallet.address}
                                    </p>

                                    <button
                                        className={cn(
                                            "text-gray-400 font-medium"
                                        )}
                                    >
                                        <Copy
                                            className={cn(
                                                getResponsiveClass(10)
                                                    .frameClass
                                            )}
                                        />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label
                                    className={cn(
                                        "text-gray-400 font-medium",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    Provider
                                </label>
                                <p
                                    className={cn(
                                        "text-white",
                                        getResponsiveClass(5).marginYClass,
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    {
                                        getProviderInfo(selectedWallet.provider)
                                            .name
                                    }
                                </p>
                            </div>

                            <div>
                                <label
                                    className={cn(
                                        "text-gray-400 font-medium",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    Status
                                </label>
                                <div
                                    className={cn(
                                        "flex items-center",
                                        getResponsiveClass(5).marginYClass
                                    )}
                                >
                                    {isEditingStatus ? (
                                        <div className="flex items-center gap-2">
                                            {/* Status 탭들 */}
                                            <div className="flex rounded-lg border border-gray-600 overflow-hidden">
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() =>
                                                        setEditStatus("ACTIVE")
                                                    }
                                                    className={cn(
                                                        "px-3 py-1 text-sm font-medium transition-all duration-200",
                                                        editStatus === "ACTIVE"
                                                            ? "bg-green-500 text-white"
                                                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                                    )}
                                                >
                                                    ACTIVE
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() =>
                                                        setEditStatus(
                                                            "INACTIVE"
                                                        )
                                                    }
                                                    className={cn(
                                                        "px-3 py-1 text-sm font-medium transition-all duration-200",
                                                        editStatus ===
                                                            "INACTIVE"
                                                            ? "bg-red-500 text-white"
                                                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                                    )}
                                                >
                                                    INACTIVE
                                                </motion.button>
                                            </div>

                                            {/* 저장/취소 버튼 */}
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleSaveStatus}
                                                className="text-green-400 hover:text-green-300 transition-colors"
                                            >
                                                <Check
                                                    className={cn(
                                                        getResponsiveClass(20)
                                                            .frameClass
                                                    )}
                                                />
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleCancelStatusEdit}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                <X
                                                    className={cn(
                                                        getResponsiveClass(20)
                                                            .frameClass
                                                    )}
                                                />
                                            </motion.button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            {/* 현재 상태 탭 */}
                                            <div
                                                className={cn(
                                                    "px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-2",
                                                    selectedWallet.status ===
                                                        "ACTIVE"
                                                        ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                                        : "bg-red-500/20 text-red-300 border border-red-500/30"
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        "rounded-full",
                                                        selectedWallet.status ===
                                                            "ACTIVE"
                                                            ? "bg-green-400"
                                                            : "bg-red-400",
                                                        getResponsiveClass(5)
                                                            .frameClass
                                                    )}
                                                />
                                                {selectedWallet.status}
                                            </div>

                                            {/* 편집 버튼 */}
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleEditStatus}
                                                className="text-gray-400 hover:text-white transition-colors"
                                            >
                                                <Edit3
                                                    className={cn(
                                                        getResponsiveClass(15)
                                                            .frameClass
                                                    )}
                                                />
                                            </motion.button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label
                                    className={cn(
                                        "text-gray-400 font-medium",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    Last Access
                                </label>
                                <p
                                    className={cn(
                                        "text-white",
                                        getResponsiveClass(5).marginYClass,
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    {new Date(
                                        selectedWallet.lastAccessedAt
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 백업 버튼 (Starglow 관리 지갑용) */}
                    {selectedWallet.privateKey && (
                        <div
                            className={cn(
                                "space-y-4 mt-6",
                                getResponsiveClass(25).gapClass
                            )}
                        >
                            <motion.button
                                whileHover={{
                                    scale: 1.02,
                                    boxShadow:
                                        "0 0 30px rgba(139, 69, 255, 0.4)",
                                }}
                                whileTap={{ scale: 0.98 }}
                                animate={{
                                    boxShadow: [
                                        "0 0 20px rgba(139, 69, 255, 0.2)",
                                        "0 0 30px rgba(139, 69, 255, 0.3)",
                                        "0 0 20px rgba(139, 69, 255, 0.2)",
                                    ],
                                }}
                                transition={{
                                    boxShadow: {
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    },
                                }}
                                onClick={() => setShowBackupModal(true)}
                                className={cn(
                                    "w-full relative overflow-hidden animate-pulse",
                                    "bg-gradient-to-r from-purple-600 via-blue-500 to-purple-500",
                                    "hover:from-purple-500 hover:via-blue-400 hover:to-purple-400",
                                    "rounded-xl border border-purple-400/50",
                                    "transition-all duration-300",
                                    getResponsiveClass(30).paddingClass
                                )}
                            >
                                {/* 배경 효과 */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />

                                <div
                                    className={cn(
                                        "relative flex items-center justify-center",
                                        getResponsiveClass(20).gapClass
                                    )}
                                >
                                    <Download
                                        className={cn(
                                            getResponsiveClass(30).frameClass,
                                            "text-white"
                                        )}
                                    />
                                    <div className="text-center">
                                        <h4
                                            className={cn(
                                                "text-white font-bold",
                                                getResponsiveClass(20).textClass
                                            )}
                                        >
                                            Backup Your Wallet
                                        </h4>
                                        <p
                                            className={cn(
                                                "text-purple-100 text-sm mt-1",
                                                getResponsiveClass(10).textClass
                                            )}
                                        >
                                            Secure your private key now
                                        </p>
                                    </div>
                                </div>
                            </motion.button>
                        </div>
                    )}
                </div>
            )}

            {/* 백업 모달 */}
            {selectedWallet && (
                <NotifyWalletsBackup
                    isOpen={showBackupModal}
                    onClose={() => setShowBackupModal(false)}
                    onComplete={handleDataRefresh}
                    walletAddress={selectedWallet.address}
                />
            )}
        </div>
    );
}
