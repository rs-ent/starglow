/// components/notifications/Notify.Invitation.Success.tsx

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Users, ArrowRight, Sparkles, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";
import type { NotificationWithEntity } from "@/app/actions/notification/actions";

interface NotifyInvitationSuccessProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
    notification: NotificationWithEntity;
}

export default function NotifyInvitationSuccess({
    isOpen,
    onClose,
    onComplete,
    notification,
}: NotifyInvitationSuccessProps) {

    // 초대 관련 데이터 추출
    const invitationData = useMemo(() => {
        const entityData = notification.entityData as any;
        return {
            referrerName: entityData?.referrerName || "A friend",
            method: entityData?.method || "webapp",
        };
    }, [notification]);

    const handleContinue = () => {
        onComplete?.();
        onClose();
        window.location.href = "/quests";
    };

    const handleExplore = () => {
        onClose();
        window.location.href = "/";
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogTitle> </DialogTitle>
            <DialogContent className="sm:max-w-[500px] bg-gray-900/95 border-purple-500/30 p-0 overflow-hidden backdrop-blur-xl [&>button]:z-20">
                <div className="relative">
                    {/* 배경 그라데이션 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-indigo-900/20 to-purple-800/20 pointer-events-none" />

                    {/* 별 배경 효과 */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {[...Array(12)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{
                                    duration: 3 + Math.random() * 2,
                                    repeat: Infinity,
                                    delay: Math.random() * 2,
                                }}
                                className="absolute w-1 h-1 bg-purple-300 rounded-full"
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
                            {/* 성공 아이콘 */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 20,
                                    delay: 0.3,
                                }}
                                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 mb-4"
                            >
                                <CheckCircle className="w-8 h-8 text-white" />
                            </motion.div>

                            {/* 제목 */}
                            <motion.h2
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className={cn(
                                    "font-bold bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent",
                                    getResponsiveClass(30).textClass
                                )}
                            >
                                Welcome to Starglow
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
                                {`You've successfully joined through an invitation`}
                            </motion.p>
                        </motion.div>

                        {/* 초대 정보 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="bg-purple-900/30 rounded-xl p-6 border border-purple-500/20 backdrop-blur-sm"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <Users className="w-5 h-5 text-purple-400" />
                                <h3
                                    className={cn(
                                        "font-semibold text-purple-300",
                                        getResponsiveClass(20).textClass
                                    )}
                                >
                                    Invitation Details
                                </h3>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span
                                        className={cn(
                                            "text-gray-400",
                                            getResponsiveClass(15).textClass
                                        )}
                                    >
                                        Invited by:
                                    </span>
                                    <span
                                        className={cn(
                                            "text-white font-medium",
                                            getResponsiveClass(15).textClass
                                        )}
                                    >
                                        {invitationData.referrerName}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span
                                        className={cn(
                                            "text-gray-400",
                                            getResponsiveClass(15).textClass
                                        )}
                                    >
                                        Method:
                                    </span>
                                    <span
                                        className={cn(
                                            "text-purple-300 font-medium capitalize",
                                            getResponsiveClass(15).textClass
                                        )}
                                    >
                                        {invitationData.method === "webapp"
                                            ? "Web App"
                                            : invitationData.method}
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {/* 액션 버튼 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.0 }}
                            className="space-y-3"
                        >
                            {/* 메인 버튼 */}
                            <motion.button
                                onClick={handleContinue}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                    "w-full font-semibold text-white rounded-xl relative overflow-hidden",
                                    "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500",
                                    "transition-all duration-200 shadow-lg shadow-purple-900/50",
                                    getResponsiveClass(15).paddingClass,
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    Start Your Journey
                                    <ArrowRight className="w-5 h-5" />
                                </span>
                            </motion.button>

                            {/* 보조 버튼 */}
                            <motion.button
                                onClick={handleExplore}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className={cn(
                                    "w-full bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 rounded-xl",
                                    "font-medium transition-colors border border-gray-600/30",
                                    "flex items-center justify-center gap-2",
                                    getResponsiveClass(15).paddingClass,
                                    getResponsiveClass(15).textClass
                                )}
                            >
                                <Sparkles className="w-4 h-4" />
                                Explore First
                            </motion.button>
                        </motion.div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
