/// components/admin/polls/shared-components.tsx

"use client";

import React from "react";
import type { SectionProps, TabProps, PollTypeSelectionProps } from "./types";

// Section wrapper component
export function Section({
    title,
    children,
    icon,
    bgColor = "bg-slate-800/50",
}: SectionProps) {
    return (
        <div
            className={`rounded-xl border border-slate-700/50 ${bgColor} backdrop-blur-sm`}
        >
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-700/50">
                {icon}
                <h3 className="text-lg font-semibold text-white">{title}</h3>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

// Tab navigation component
export function TabNavigation({ tabs, activeTab, onTabChange }: TabProps) {
    return (
        <div className="flex space-x-1 bg-slate-800/60 p-1 rounded-lg backdrop-blur-sm border border-slate-700/50">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        activeTab === tab.id
                            ? "bg-slate-700 text-white shadow-lg"
                            : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                    }`}
                >
                    {tab.icon}
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

// Poll type selection component
export function PollTypeSelection({ onSelect }: PollTypeSelectionProps) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8">
            <h2 className="text-2xl font-bold mb-8 text-white">
                폴 타입을 선택해주세요
            </h2>
            <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
                <button
                    onClick={() => onSelect("REGULAR")}
                    className="flex flex-col items-center p-8 border border-slate-600 rounded-lg hover:border-purple-500 transition-colors bg-slate-800/50 backdrop-blur-sm"
                >
                    <div className="w-16 h-16 mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <span className="text-3xl">📊</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-white">
                        일반 폴
                    </h3>
                    <p className="text-sm text-slate-400 text-center">
                        사용자들이 선택지에 투표하는 일반적인 폴
                    </p>
                </button>

                <button
                    onClick={() => onSelect("BETTING")}
                    className="flex flex-col items-center p-8 border border-slate-600 rounded-lg hover:border-orange-500 transition-colors bg-slate-800/50 backdrop-blur-sm"
                >
                    <div className="w-16 h-16 mb-4 bg-orange-500/20 rounded-full flex items-center justify-center">
                        <span className="text-3xl">💰</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-white">
                        베팅 폴
                    </h3>
                    <p className="text-sm text-slate-400 text-center">
                        사용자들이 에셋을 베팅하여 참여하는 폴
                    </p>
                </button>
            </div>
        </div>
    );
} 