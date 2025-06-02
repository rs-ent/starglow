/// components\atoms\WarningPopup.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2, Shield } from "lucide-react";
import { getResponsiveClass } from "@/lib/utils/responsiveClass";
import { cn } from "@/lib/utils/tailwind";

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
    critical?: boolean; // 추가: 중요한 작업인지 여부
}

export default React.memo(function WarningPopup({
    title,
    message,
    open,
    onClose,
    loading = false,
    preventClose = false,
    progress,
    critical = false, // 기본값은 false
}: WarningPopupProps) {
    // 브라우저 뒤로가기 방지
    useEffect(() => {
        if (open && critical) {
            // 1. beforeunload 이벤트
            const handleBeforeUnload = (e: BeforeUnloadEvent) => {
                e.preventDefault();
                e.returnValue = message;
                return message;
            };

            // 2. popstate 이벤트 (브라우저 히스토리 조작 방지)
            const handlePopState = (e: PopStateEvent) => {
                e.preventDefault();
                window.history.pushState(null, "", window.location.href);
            };

            // 3. visibilitychange 이벤트 (탭 전환 감지)
            const handleVisibilityChange = () => {
                if (document.visibilityState === "hidden") {
                    // 사용자에게 경고 메시지 표시
                    alert(
                        "Please do not switch tabs while the transfer is in progress!"
                    );
                }
            };

            // 4. 키보드 단축키 방지
            const handleKeyDown = (e: KeyboardEvent) => {
                if (
                    (e.ctrlKey || e.metaKey) && // Ctrl/Cmd +
                    (e.key === "r" || // Refresh
                        e.key === "w" || // Close tab
                        e.key === "n" || // New tab
                        e.key === "t") // New tab
                ) {
                    e.preventDefault();
                    alert(
                        "Please do not use keyboard shortcuts while the transfer is in progress!"
                    );
                }
            };

            // 이벤트 리스너 등록
            window.addEventListener("beforeunload", handleBeforeUnload);
            window.addEventListener("popstate", handlePopState);
            document.addEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
            window.addEventListener("keydown", handleKeyDown);

            // 히스토리 상태 초기화
            window.history.pushState(null, "", window.location.href);

            // 클린업 함수
            return () => {
                window.removeEventListener("beforeunload", handleBeforeUnload);
                window.removeEventListener("popstate", handlePopState);
                document.removeEventListener(
                    "visibilitychange",
                    handleVisibilityChange
                );
                window.removeEventListener("keydown", handleKeyDown);
            };
        }
    }, [open, critical, message]);

    // ESC 키 방지
    useEffect(() => {
        if (open && preventClose) {
            const handleEsc = (e: KeyboardEvent) => {
                if (e.key === "Escape") {
                    e.preventDefault();
                    e.stopPropagation();
                }
            };

            window.addEventListener("keydown", handleEsc, true);
            return () => window.removeEventListener("keydown", handleEsc, true);
        }
    }, [open, preventClose]);

    // 모바일 환경 보호
    useEffect(() => {
        if (open && critical) {
            // 1. 모바일 뒤로가기 제스처 방지
            const handleTouchStart = (e: TouchEvent) => {
                const touch = e.touches[0];
                const startX = touch.clientX;
                const startY = touch.clientY;

                const handleTouchMove = (e: TouchEvent) => {
                    const touch = e.touches[0];
                    const currentX = touch.clientX;
                    const currentY = touch.clientY;

                    // 수평 스와이프 감지 (뒤로가기 제스처)
                    if (
                        Math.abs(currentX - startX) >
                            Math.abs(currentY - startY) &&
                        currentX - startX > 50
                    ) {
                        e.preventDefault();
                        e.stopPropagation();
                        alert(
                            "Please do not use back gesture while the transfer is in progress!"
                        );
                    }
                };

                const handleTouchEnd = () => {
                    document.removeEventListener("touchmove", handleTouchMove);
                    document.removeEventListener("touchend", handleTouchEnd);
                };

                document.addEventListener("touchmove", handleTouchMove, {
                    passive: false,
                });
                document.addEventListener("touchend", handleTouchEnd);
            };

            // 2. 모바일 새로고침 제스처 방지 (아래로 당기기)
            const handlePullToRefresh = (e: TouchEvent) => {
                const touch = e.touches[0];
                const startY = touch.clientY;

                const handlePullMove = (e: TouchEvent) => {
                    const touch = e.touches[0];
                    const currentY = touch.clientY;

                    // 아래로 당기는 제스처 감지
                    if (currentY - startY > 50) {
                        e.preventDefault();
                        e.stopPropagation();
                        alert(
                            "Please do not pull to refresh while the transfer is in progress!"
                        );
                    }
                };

                const handlePullEnd = () => {
                    document.removeEventListener("touchmove", handlePullMove);
                    document.removeEventListener("touchend", handlePullEnd);
                };

                document.addEventListener("touchmove", handlePullMove, {
                    passive: false,
                });
                document.addEventListener("touchend", handlePullEnd);
            };

            // 3. 모바일 브라우저 앱 전환 감지
            const handleAppStateChange = () => {
                if (document.hidden) {
                    alert(
                        "Please do not switch apps while the transfer is in progress!"
                    );
                }
            };

            // 이벤트 리스너 등록
            document.addEventListener("touchstart", handleTouchStart, {
                passive: false,
            });
            document.addEventListener("touchstart", handlePullToRefresh, {
                passive: false,
            });
            document.addEventListener("visibilitychange", handleAppStateChange);

            // 클린업 함수
            return () => {
                document.removeEventListener("touchstart", handleTouchStart);
                document.removeEventListener("touchstart", handlePullToRefresh);
                document.removeEventListener(
                    "visibilitychange",
                    handleAppStateChange
                );
            };
        }
    }, [open, critical]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 flex items-center justify-center"
                    style={{ zIndex: 9999 }}
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 backdrop-blur-md bg-[rgba(0,0,0,0.85)]"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!preventClose && onClose) onClose();
                        }}
                    />

                    {/* Popup Content */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className={cn(
                            "relative max-w-[90%] w-full mx-auto",
                            "bg-gradient-to-br from-[rgba(10,2,28,0.95)] to-[rgba(46,18,108,0.95)]",
                            "rounded-xl border border-white/10 shadow-2xl",
                            getResponsiveClass(25).paddingClass
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div
                            className={cn(
                                "flex items-center gap-4 mb-6",
                                getResponsiveClass(25).gapClass
                            )}
                        >
                            {loading ? (
                                <Loader2
                                    className={cn(
                                        "text-white animate-spin",
                                        getResponsiveClass(25).frameClass
                                    )}
                                />
                            ) : critical ? (
                                <Shield
                                    className={cn(
                                        "text-red-400",
                                        getResponsiveClass(25).frameClass
                                    )}
                                />
                            ) : (
                                <AlertTriangle
                                    className={cn(
                                        "text-white",
                                        getResponsiveClass(25).frameClass
                                    )}
                                />
                            )}
                            <h3
                                className={cn(
                                    "font-semibold text-white",
                                    getResponsiveClass(25).textClass
                                )}
                            >
                                {title}
                            </h3>
                        </div>

                        {/* Message */}
                        <p
                            className={cn(
                                "text-white/90 mb-6",
                                getResponsiveClass(20).textClass
                            )}
                        >
                            {message}
                        </p>

                        {/* Progress UI */}
                        {progress && (
                            <div
                                className={cn(
                                    "mb-8 space-y-4",
                                    getResponsiveClass(20).gapClass
                                )}
                            >
                                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-primary to-primary/80"
                                        initial={{ width: 0 }}
                                        animate={{
                                            width: `${progress.current}%`,
                                        }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>

                                {progress.status && (
                                    <p
                                        className={cn(
                                            "font-medium text-white/90",
                                            getResponsiveClass(20).textClass
                                        )}
                                    >
                                        {progress.status}
                                    </p>
                                )}

                                {progress.details && (
                                    <p
                                        className={cn(
                                            "text-white/80",
                                            getResponsiveClass(20).textClass
                                        )}
                                    >
                                        {progress.details}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Close Button */}
                        {!preventClose && onClose && (
                            <div className="flex justify-end">
                                <button
                                    onClick={onClose}
                                    className={cn(
                                        "px-6 py-3 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors",
                                        getResponsiveClass(20).textClass
                                    )}
                                >
                                    Close
                                </button>
                            </div>
                        )}

                        {/* Critical Warning */}
                        {critical && (
                            <div
                                className={cn(
                                    "mt-8 p-8 bg-gradient-to-br from-red-500/10 to-red-600/5",
                                    "border border-red-500/20 rounded-xl shadow-lg",
                                    "backdrop-blur-sm"
                                )}
                            >
                                {/* Warning Header */}
                                <div className="flex items-center justify-center gap-3 mb-6">
                                    <Shield
                                        className={cn(
                                            "text-red-400",
                                            getResponsiveClass(25).frameClass
                                        )}
                                    />
                                    <h3
                                        className={cn(
                                            "text-red-400 font-semibold",
                                            getResponsiveClass(25).textClass
                                        )}
                                    >
                                        Critical Operation in Progress
                                    </h3>
                                </div>

                                {/* Warning Message */}
                                <p
                                    className={cn(
                                        "text-white/90 text-center mb-8",
                                        getResponsiveClass(20).textClass
                                    )}
                                >
                                    Your payment is currently being processed.
                                    Please maintain this window open until
                                    completion.
                                </p>

                                {/* Warning Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left Column: Restricted Actions */}
                                    <div className="bg-black/20 rounded-lg p-6 border border-red-500/10">
                                        <div className="flex items-center gap-2 mb-4">
                                            <AlertTriangle
                                                className={cn(
                                                    "text-red-400",
                                                    getResponsiveClass(20)
                                                        .frameClass
                                                )}
                                            />
                                            <h4
                                                className={cn(
                                                    "text-red-400 font-medium",
                                                    getResponsiveClass(20)
                                                        .textClass
                                                )}
                                            >
                                                Restricted Actions
                                            </h4>
                                        </div>
                                        <ul
                                            className={cn(
                                                "space-y-3",
                                                getResponsiveClass(20).textClass
                                            )}
                                        >
                                            <li className="flex items-start gap-3">
                                                <span className="text-red-400 mt-1">
                                                    •
                                                </span>
                                                <span>
                                                    Window closure or navigation
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <span className="text-red-400 mt-1">
                                                    •
                                                </span>
                                                <span>
                                                    Browser tab switching
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <span className="text-red-400 mt-1">
                                                    •
                                                </span>
                                                <span>
                                                    Page refresh or reload
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <span className="text-red-400 mt-1">
                                                    •
                                                </span>
                                                <span>
                                                    Browser history navigation
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <span className="text-red-400 mt-1">
                                                    •
                                                </span>
                                                <span>
                                                    Mobile gesture controls
                                                </span>
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Right Column: Potential Risks */}
                                    <div className="bg-black/20 rounded-lg p-6 border border-red-500/10">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Shield
                                                className={cn(
                                                    "text-red-400",
                                                    getResponsiveClass(20)
                                                        .frameClass
                                                )}
                                            />
                                            <h4
                                                className={cn(
                                                    "text-red-400 font-medium",
                                                    getResponsiveClass(20)
                                                        .textClass
                                                )}
                                            >
                                                Potential Risks
                                            </h4>
                                        </div>
                                        <ul
                                            className={cn(
                                                "space-y-3",
                                                getResponsiveClass(20).textClass
                                            )}
                                        >
                                            <li className="flex items-start gap-3">
                                                <span className="text-red-400 mt-1">
                                                    •
                                                </span>
                                                <span>
                                                    Transaction cancellation
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <span className="text-red-400 mt-1">
                                                    •
                                                </span>
                                                <span>
                                                    Failed transfer requiring
                                                    recovery
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <span className="text-red-400 mt-1">
                                                    •
                                                </span>
                                                <span>
                                                    Additional transaction fees
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <span className="text-red-400 mt-1">
                                                    •
                                                </span>
                                                <span>
                                                    Extended processing time
                                                </span>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <span className="text-red-400 mt-1">
                                                    •
                                                </span>
                                                <span>
                                                    Manual intervention required
                                                </span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});
