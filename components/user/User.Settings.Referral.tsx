/// components/user/User.Settings.Referral.tsx

"use client";

import { useMemo, useState, useEffect } from "react";

import { motion } from "framer-motion";
import {
    Users,
    Link,
    Copy,
    Share,
    QrCode,
    CheckCircle2,
    Gift,
    Calendar,
    ExternalLink,
} from "lucide-react";

import { useToast } from "@/app/hooks/useToast";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import { formatNumber } from "@/lib/utils/format";

import QRCodeModal from "../atoms/QRCode";

import type { Player, ReferralLog } from "@prisma/client";

interface UserSettingsReferralProps {
    player: Player;
    referralLogs: ReferralLog[];
}

export default function UserSettingsReferral({
    player,
    referralLogs,
}: UserSettingsReferralProps) {
    const [isShareSupported, setIsShareSupported] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [showQrCode, setShowQrCode] = useState(false);
    const toast = useToast();

    // 클라이언트 사이드에서 navigator.share 지원 여부 확인
    useEffect(() => {
        setIsShareSupported(typeof navigator.share === "function");
    }, []);

    const refUrl = useMemo(() => {
        const code = player?.referralCode || "";
        if (typeof window !== "undefined") {
            if (isShareSupported) {
                return code
                    ? `${window.location.origin}/invite?ref=${code}&method=webapp`
                    : `${window.location.origin}/invite`;
            } else {
                const telegramBot =
                    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ||
                    "starglow_redslippers_bot";
                return code
                    ? `https://t.me/${telegramBot}?startapp=${code}`
                    : `https://t.me/${telegramBot}?startapp`;
            }
        }
        return "";
    }, [player?.referralCode, isShareSupported]);

    // 레퍼럴 통계 계산
    const stats = useMemo(() => {
        const totalReferrals = referralLogs.length;
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);

        const monthlyReferrals = referralLogs.filter(
            (log) => new Date(log.createdAt) >= thisMonth
        ).length;

        const recentReferral = referralLogs[0]; // 가장 최근 추천

        return {
            totalReferrals,
            monthlyReferrals,
            recentReferral,
        };
    }, [referralLogs]);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(refUrl);
            setCopiedLink(true);
            toast.success("Invite link copied to clipboard!");
            setTimeout(() => setCopiedLink(false), 2000);
        } catch (error) {
            console.error("Failed to copy link", error);
            toast.error("Failed to copy link");
        }
    };

    const handleShare = async () => {
        try {
            if (isShareSupported) {
                await navigator.share({
                    url: refUrl,
                    title: "Join Starglow!",
                    text: "🌟 Join me on Starglow - Web3 K-pop platform!",
                });
            } else {
                const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
                    refUrl
                )}&text=${encodeURIComponent("🔥 Join Starglow!")}`;
                window.open(shareUrl, "_blank");
            }
            toast.success("Share opened!");
        } catch (error) {
            console.warn("Failed to share", error);
        }
    };

    const handleOpenQR = () => {
        setShowQrCode(true);
    };

    return (
        <>
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                    "bg-gradient-to-br from-emerald-900/20 via-teal-900/20 to-cyan-900/20",
                    "backdrop-blur-lg border border-emerald-500/30",
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
                            "rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20",
                            "border border-emerald-500/30 p-3"
                        )}
                    >
                        <Users
                            className={cn(
                                "text-emerald-400",
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
                            Invite Friends
                        </h2>
                        <p
                            className={cn(
                                "text-gray-400",
                                getResponsiveClass(10).textClass
                            )}
                        >
                            Share Starglow and earn rewards together
                        </p>
                    </div>
                </motion.div>

                {/* Statistics */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={cn(
                        "bg-gradient-to-br from-teal-900/30 to-cyan-900/30",
                        "border border-teal-500/20 rounded-xl p-3"
                    )}
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Gift
                            className={cn(
                                "text-teal-400",
                                getResponsiveClass(20).frameClass
                            )}
                        />
                        <h3
                            className={cn(
                                "font-medium text-white",
                                getResponsiveClass(15).textClass
                            )}
                        >
                            Referral Stats
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className={cn(
                                "bg-gradient-to-br from-emerald-500/10 to-teal-500/10",
                                "border border-emerald-500/20 rounded-lg p-3 text-center"
                            )}
                        >
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <Users
                                    className={cn(
                                        "text-emerald-400",
                                        getResponsiveClass(15).frameClass
                                    )}
                                />
                                <p
                                    className={cn(
                                        "text-emerald-300",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    Total
                                </p>
                            </div>
                            <h2
                                className={cn(
                                    "font-bold text-white",
                                    getResponsiveClass(25).textClass
                                )}
                            >
                                {formatNumber(stats.totalReferrals)}
                            </h2>
                        </motion.div>

                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className={cn(
                                "bg-gradient-to-br from-cyan-500/10 to-blue-500/10",
                                "border border-cyan-500/20 rounded-lg p-3 text-center"
                            )}
                        >
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <Calendar
                                    className={cn(
                                        "text-cyan-400",
                                        getResponsiveClass(15).frameClass
                                    )}
                                />
                                <p
                                    className={cn(
                                        "text-cyan-300",
                                        getResponsiveClass(10).textClass
                                    )}
                                >
                                    This Month
                                </p>
                            </div>
                            <h2
                                className={cn(
                                    "font-bold text-white",
                                    getResponsiveClass(25).textClass
                                )}
                            >
                                {formatNumber(stats.monthlyReferrals)}
                            </h2>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Invite Link */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={cn(
                        "bg-gradient-to-br from-blue-900/30 to-indigo-900/30",
                        "border border-blue-500/20 rounded-xl p-3"
                    )}
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Link
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
                            Your Invite Link
                        </h3>
                    </div>

                    {/* Link Display */}
                    <div
                        className={cn(
                            "bg-gradient-to-br from-gray-800/50 to-gray-900/50",
                            "border border-gray-600/50 rounded-lg p-3 mb-3",
                            "flex items-center gap-3"
                        )}
                    >
                        <p
                            className={cn(
                                "text-gray-300 flex-1 truncate",
                                getResponsiveClass(10).textClass
                            )}
                        >
                            {refUrl}
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCopyLink}
                            className={cn(
                                "bg-gradient-to-br from-blue-500/20 to-indigo-500/20",
                                "border border-blue-500/30 rounded-md p-2",
                                "text-blue-400 hover:text-white",
                                "transition-colors duration-300"
                            )}
                        >
                            {copiedLink ? (
                                <CheckCircle2
                                    className={cn(
                                        getResponsiveClass(15).frameClass
                                    )}
                                />
                            ) : (
                                <Copy
                                    className={cn(
                                        getResponsiveClass(15).frameClass
                                    )}
                                />
                            )}
                        </motion.button>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleCopyLink}
                            className={cn(
                                "bg-gradient-to-br from-emerald-500/20 to-teal-500/20",
                                "border border-emerald-500/30 rounded-lg p-3",
                                "text-emerald-400 hover:text-white",
                                "transition-colors duration-300",
                                "flex flex-col items-center gap-1"
                            )}
                        >
                            <Copy
                                className={cn(
                                    getResponsiveClass(20).frameClass
                                )}
                            />
                            <span
                                className={cn(getResponsiveClass(5).textClass)}
                            >
                                Copy
                            </span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleShare}
                            className={cn(
                                "bg-gradient-to-br from-blue-500/20 to-cyan-500/20",
                                "border border-blue-500/30 rounded-lg p-3",
                                "text-blue-400 hover:text-white",
                                "transition-colors duration-300",
                                "flex flex-col items-center gap-1"
                            )}
                        >
                            <Share
                                className={cn(
                                    getResponsiveClass(20).frameClass
                                )}
                            />
                            <span
                                className={cn(getResponsiveClass(5).textClass)}
                            >
                                Share
                            </span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleOpenQR}
                            className={cn(
                                "bg-gradient-to-br from-purple-500/20 to-indigo-500/20",
                                "border border-purple-500/30 rounded-lg p-3",
                                "text-purple-400 hover:text-white",
                                "transition-colors duration-300",
                                "flex flex-col items-center gap-1"
                            )}
                        >
                            <QrCode
                                className={cn(
                                    getResponsiveClass(20).frameClass
                                )}
                            />
                            <span
                                className={cn(getResponsiveClass(5).textClass)}
                            >
                                QR Code
                            </span>
                        </motion.button>
                    </div>
                </motion.div>

                {/* Recent Referrals */}
                {referralLogs.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className={cn(
                            "bg-gradient-to-br from-indigo-900/30 to-purple-900/30",
                            "border border-indigo-500/20 rounded-xl p-3"
                        )}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar
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
                                Recent Invites
                            </h3>
                        </div>

                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {referralLogs.slice(0, 5).map((log, index) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + index * 0.1 }}
                                    className={cn(
                                        "bg-gradient-to-br from-gray-800/50 to-gray-900/50",
                                        "border border-gray-600/30 rounded-lg p-3",
                                        "flex items-center justify-between"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={cn(
                                                "bg-gradient-to-br from-emerald-500/20 to-teal-500/20",
                                                "border border-emerald-500/30 rounded-full p-1"
                                            )}
                                        >
                                            <Users
                                                className={cn(
                                                    "text-emerald-400",
                                                    getResponsiveClass(10)
                                                        .frameClass
                                                )}
                                            />
                                        </div>
                                        <div>
                                            <p
                                                className={cn(
                                                    "text-white font-medium",
                                                    getResponsiveClass(10)
                                                        .textClass
                                                )}
                                            >
                                                New Friend Joined
                                            </p>
                                            <p
                                                className={cn(
                                                    "text-gray-400",
                                                    getResponsiveClass(5)
                                                        .textClass
                                                )}
                                            >
                                                via {log.method}
                                            </p>
                                        </div>
                                    </div>
                                    <p
                                        className={cn(
                                            "text-gray-500",
                                            getResponsiveClass(5).textClass
                                        )}
                                    >
                                        {new Date(
                                            log.createdAt
                                        ).toLocaleDateString()}
                                    </p>
                                </motion.div>
                            ))}
                        </div>

                        {referralLogs.length > 5 && (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                className={cn(
                                    "w-full mt-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20",
                                    "border border-indigo-500/30 rounded-lg p-2",
                                    "text-indigo-400 hover:text-white",
                                    "transition-colors duration-300",
                                    "flex items-center justify-center gap-2",
                                    getResponsiveClass(10).textClass
                                )}
                            >
                                <ExternalLink
                                    className={cn(
                                        getResponsiveClass(15).frameClass
                                    )}
                                />
                                View All ({referralLogs.length})
                            </motion.button>
                        )}
                    </motion.div>
                )}

                {/* Empty State */}
                {referralLogs.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className={cn(
                            "bg-gradient-to-br from-gray-800/30 to-gray-900/30",
                            "border border-gray-600/20 rounded-xl p-6 text-center"
                        )}
                    >
                        <div className="text-6xl mb-4">🌟</div>
                        <h3
                            className={cn(
                                "font-bold text-white mb-2",
                                getResponsiveClass(20).textClass
                            )}
                        >
                            Start Inviting Friends!
                        </h3>
                        <p
                            className={cn(
                                "text-gray-400",
                                getResponsiveClass(10).textClass
                            )}
                        >
                            Share your invite link and earn rewards when friends
                            join
                        </p>
                    </motion.div>
                )}
            </motion.section>

            {/* QR Code Modal */}
            {showQrCode && (
                <QRCodeModal
                    url={refUrl}
                    onClose={() => setShowQrCode(false)}
                />
            )}
        </>
    );
}
