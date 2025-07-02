/// components/notifications/Notify.Invitation.Error.tsx

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
    AlertCircle,
    ArrowRight,
    RefreshCw,
    Users,
    Search,
    Link,
    Shield,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import type { NotificationWithEntity } from "@/app/actions/notification/actions";

interface NotifyInvitationErrorProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
    notification: NotificationWithEntity;
}

export default function NotifyInvitationError({
    isOpen,
    onClose,
    onComplete,
    notification,
}: NotifyInvitationErrorProps) {
    // 에러 타입 추출
    const errorType = useMemo(() => {
        const entityData = notification.entityData as any;
        return entityData?.errorType || "UNKNOWN_ERROR";
    }, [notification]);

    // 에러 타입별 설정
    const errorConfig = useMemo(() => {
        const configs = {
            SELF_INVITE_NOT_ALLOWED: {
                icon: <Users className="w-8 h-8 text-white" />,
                title: "That's Your Own Code",
                subtitle: "You can't invite yourself to join",
                mainColor: "from-blue-500 to-cyan-500",
                bgGradient: "from-blue-900/30 to-cyan-900/30",
                borderColor: "border-blue-500/30",
                actionText: "Explore Starglow",
                secondaryText: "Find Friends",
                suggestion: "Share your code with friends to grow together!",
            },
            ALREADY_INVITED: {
                icon: <Shield className="w-8 h-8 text-white" />,
                title: "Already Part of the Family",
                subtitle: "Someone has already welcomed you aboard",
                mainColor: "from-emerald-500 to-green-500",
                bgGradient: "from-emerald-900/30 to-green-900/30",
                borderColor: "border-emerald-500/30",
                actionText: "Continue Journey",
                secondaryText: "View Quests",
                suggestion: "Ready for more adventures on Starglow?",
            },
            REFERRER_NOT_FOUND: {
                icon: <Search className="w-8 h-8 text-white" />,
                title: "Invitation Code Not Found",
                subtitle: "This code doesn't exist or has expired",
                mainColor: "from-orange-500 to-amber-500",
                bgGradient: "from-orange-900/30 to-amber-900/30",
                borderColor: "border-orange-500/30",
                actionText: "Try Another Code",
                secondaryText: "Explore Anyway",
                suggestion: "Ask your friend for the correct invitation code",
            },
            TELEGRAM_ID_ALREADY_USED: {
                icon: <Link className="w-8 h-8 text-white" />,
                title: "Account Already Linked",
                subtitle: "This Telegram account is already connected",
                mainColor: "from-violet-500 to-purple-500",
                bgGradient: "from-violet-900/30 to-purple-900/30",
                borderColor: "border-violet-500/30",
                actionText: "Use Different Account",
                secondaryText: "Get Help",
                suggestion: "Try connecting a different Telegram account",
            },
            INVALID_CODE: {
                icon: <AlertCircle className="w-8 h-8 text-white" />,
                title: "Invalid Invitation Code",
                subtitle: "The provided code is not valid",
                mainColor: "from-red-500 to-rose-500",
                bgGradient: "from-red-900/30 to-rose-900/30",
                borderColor: "border-red-500/30",
                actionText: "Try Again",
                secondaryText: "Explore Anyway",
                suggestion: "Please check the invitation code and try again",
            },
            INVALID_METHOD: {
                icon: <RefreshCw className="w-8 h-8 text-white" />,
                title: "Invalid Method",
                subtitle: "The invitation method is not recognized",
                mainColor: "from-yellow-500 to-orange-500",
                bgGradient: "from-yellow-900/30 to-orange-900/30",
                borderColor: "border-yellow-500/30",
                actionText: "Try Again",
                secondaryText: "Get Help",
                suggestion: "Please use a valid invitation link",
            },
            UNKNOWN_ERROR: {
                icon: <AlertCircle className="w-8 h-8 text-white" />,
                title: "Something Went Wrong",
                subtitle: "We encountered an unexpected issue",
                mainColor: "from-gray-500 to-slate-500",
                bgGradient: "from-gray-900/30 to-slate-900/30",
                borderColor: "border-gray-500/30",
                actionText: "Try Again",
                secondaryText: "Get Support",
                suggestion: "Don't worry, let's try again",
            },
        };
        return (
            configs[errorType as keyof typeof configs] || configs.UNKNOWN_ERROR
        );
    }, [errorType]);

    const handlePrimaryAction = () => {
        onComplete?.();
        onClose();
        if (
            errorType === "SELF_INVITE_NOT_ALLOWED" ||
            errorType === "ALREADY_INVITED"
        ) {
            window.location.href = "/";
        } else if (errorType === "REFERRER_NOT_FOUND") {
            window.location.href = "/";
        }
    };

    const handleSecondaryAction = () => {
        onClose();
        if (errorType === "ALREADY_INVITED") {
            window.location.href = "/quests";
        } else {
            window.location.href = "/";
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogTitle> </DialogTitle>
            <DialogContent className="sm:max-w-[500px] bg-gray-900/95 border-red-500/30 p-0 overflow-hidden backdrop-blur-xl [&>button]:z-20">
                <div className="relative">
                    {/* 배경 그라데이션 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 via-gray-900/20 to-slate-900/10 pointer-events-none" />

                    {/* 별 배경 효과 */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {[...Array(8)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 0.6, 0] }}
                                transition={{
                                    duration: 4 + Math.random() * 2,
                                    repeat: Infinity,
                                    delay: Math.random() * 3,
                                }}
                                className="absolute w-1 h-1 bg-red-300 rounded-full"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                }}
                            />
                        ))}
                    </div>

                    {/* 메인 콘텐츠 */}
                    <div className="relative z-10 p-8 space-y-6">
                        {/* 헤더 */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-center space-y-4"
                        >
                            {/* 에러 아이콘 */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 20,
                                    delay: 0.3,
                                }}
                                className={cn(
                                    "inline-flex items-center justify-center w-16 h-16 rounded-full mb-4",
                                    `bg-gradient-to-r ${errorConfig.mainColor}`
                                )}
                            >
                                {errorConfig.icon}
                            </motion.div>

                            {/* 제목 */}
                            <motion.h2
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className={cn(
                                    "font-bold bg-gradient-to-r bg-clip-text text-transparent",
                                    errorConfig.mainColor,
                                    getResponsiveClass(30).textClass
                                )}
                            >
                                {errorConfig.title}
                            </motion.h2>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className={cn(
                                    "text-gray-300",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                {errorConfig.subtitle}
                            </motion.p>
                        </motion.div>

                        {/* 에러 메시지 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className={cn(
                                "rounded-xl border p-6 backdrop-blur-sm",
                                `bg-gradient-to-r ${errorConfig.bgGradient}`,
                                errorConfig.borderColor
                            )}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <AlertCircle className="w-5 h-5 text-red-400" />
                                <h3
                                    className={cn(
                                        "font-semibold text-red-300",
                                        getResponsiveClass(20).textClass
                                    )}
                                >
                                    What happened?
                                </h3>
                            </div>

                            <p
                                className={cn(
                                    "text-white font-medium mb-4",
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                {notification.message}
                            </p>

                            <div className="bg-black/20 rounded-lg p-4">
                                <p
                                    className={cn(
                                        "text-gray-300",
                                        getResponsiveClass(15).textClass
                                    )}
                                >
                                    {errorConfig.suggestion}
                                </p>
                            </div>
                        </motion.div>

                        {/* 액션 버튼 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2 }}
                            className="space-y-3"
                        >
                            {/* 메인 버튼 */}
                            <motion.button
                                onClick={handlePrimaryAction}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                    "w-full font-semibold text-white rounded-xl relative overflow-hidden",
                                    `bg-gradient-to-r ${errorConfig.mainColor}`,
                                    "transition-all duration-200 shadow-lg shadow-red-900/50",
                                    getResponsiveClass(15).paddingClass,
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    {errorConfig.actionText}
                                    <ArrowRight className="w-5 h-5" />
                                </span>
                            </motion.button>

                            {/* 보조 버튼 */}
                            <motion.button
                                onClick={handleSecondaryAction}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className={cn(
                                    "w-full bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 rounded-xl",
                                    "font-medium transition-colors border border-gray-600/30",
                                    getResponsiveClass(15).paddingClass,
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                {errorConfig.secondaryText}
                            </motion.button>
                        </motion.div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
