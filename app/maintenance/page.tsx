"use client";

import React, { useState, useEffect } from "react";

export default function MaintenancePage() {
    const [currentTime, setCurrentTime] = useState<string>("");

    // 환경변수에서 점검 시작 시간 가져오기, 없거나 빈값이면 현재 시간
    const maintenanceStart =
        process.env.NEXT_PUBLIC_MAINTENANCE_START &&
        process.env.NEXT_PUBLIC_MAINTENANCE_START.trim()
            ? new Date(process.env.NEXT_PUBLIC_MAINTENANCE_START)
            : new Date();

    // 환경변수에서 점검 시간(시간 단위) 가져오기, 기본값 1시간
    const maintenanceDurationHours = process.env
        .NEXT_PUBLIC_MAINTENANCE_DURATION_HOUR
        ? parseFloat(process.env.NEXT_PUBLIC_MAINTENANCE_DURATION_HOUR)
        : 1;

    // 예상 완료 시간 (시작 시간 + 설정된 시간)
    const expectedEnd = new Date(
        maintenanceStart.getTime() + maintenanceDurationHours * 60 * 60 * 1000
    );

    useEffect(() => {
        const updateTime = () => {
            setCurrentTime(new Date().toISOString().slice(0, 19) + " UTC");
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);

        return () => clearInterval(interval);
    }, []);

    const formatUTCTime = (date: Date) => {
        return date.toISOString().slice(0, 19) + " UTC";
    };
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20">
                <div className="mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Server Maintenance
                    </h1>
                    <p className="text-white/80 text-lg">
                        System Under Maintenance
                    </p>
                </div>

                <div className="space-y-4 text-white/90">
                    <p className="text-base leading-relaxed">
                        We are currently performing system maintenance
                        <br />
                        to provide you with better service.
                    </p>

                    <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-white/70">
                                Started At
                            </span>
                            <span className="text-sm font-semibold font-mono">
                                {formatUTCTime(maintenanceStart)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-white/70">
                                Expected Completion
                            </span>
                            <span className="text-sm font-semibold font-mono">
                                {formatUTCTime(expectedEnd)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-white/70">
                                Current Time
                            </span>
                            <span className="text-sm font-semibold font-mono">
                                {currentTime}
                            </span>
                        </div>
                    </div>

                    <div className="pt-4">
                        <p className="text-sm text-white/60 mb-3">
                            Service will resume automatically after maintenance
                            is complete.
                        </p>

                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors text-sm"
                            >
                                <svg
                                    className="w-4 h-4 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
