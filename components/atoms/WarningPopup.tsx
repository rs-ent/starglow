/// components\atoms\WarningPopup.tsx

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ProgressData {
    current: number; // 현재 진행도
    status?: string; // 현재 진행 상황
    details?: string; // 상세 정보
}

interface WarningPopupProps {
    title: string;
    message: string;
    open: boolean;
    onClose?: () => void;
    loading?: boolean;
    preventClose?: boolean;
    progress?: ProgressData;
}

export default function WarningPopup({
    title,
    message,
    open,
    onClose,
    loading = false,
    preventClose = false,
    progress,
}: WarningPopupProps) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 backdrop-blur-xs bg-[rgba(0,0,0,0.7)]"
                        onClick={!preventClose ? onClose : undefined}
                    />

                    {/* Popup Content without background or effect */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="relative max-w-[90%] w-full mx-auto"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            {loading ? (
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            ) : (
                                <AlertTriangle className="w-6 h-6 text-white" />
                            )}
                            <h3 className="text-lg font-semibold text-white">
                                {title}
                            </h3>
                        </div>

                        <p className="text-white/80 mb-4">{message}</p>

                        {/* Progress UI with modern style */}
                        {progress && (
                            <div className="mb-6 space-y-3">
                                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-primary"
                                        initial={{ width: 0 }}
                                        animate={{
                                            width: `${progress.current}%`,
                                        }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>

                                {progress.status && (
                                    <p className="text-sm font-medium text-white/90">
                                        {progress.status}
                                    </p>
                                )}

                                {progress.details && (
                                    <p className="text-xs text-white/70">
                                        {progress.details}
                                    </p>
                                )}
                            </div>
                        )}

                        {!preventClose && onClose && (
                            <div className="flex justify-end">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
