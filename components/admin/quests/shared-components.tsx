/// components/admin/quests/shared-components.tsx

"use client";

import React from "react";
import type { TabProps } from "./types";

// Section wrapper component
export function Section({
    title,
    children,
    icon,
    bgColor = "bg-slate-800/50",
}: {
    title: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    bgColor?: string;
}) {
    return (
        <div
            className={`rounded-xl border border-slate-700/50 ${bgColor} backdrop-blur-sm mb-6`}
        >
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-700/50">
                {icon}
                <h3 className="text-lg font-semibold text-white">{title}</h3>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

// Divider component
export function Divider() {
    return <div className="border-b border-muted-foreground/20 my-6" />;
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

// Quest type selection component
export function QuestTypeSelection({
    onSelect,
}: {
    onSelect: (type: "URL" | "REFERRAL") => void;
}) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8">
            <h2 className="text-2xl font-bold mb-8">
                퀘스트 타입을 선택해주세요
            </h2>
            <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
                <button
                    onClick={() => onSelect("URL")}
                    className="flex flex-col items-center p-6 border rounded-lg hover:border-primary transition-colors"
                >
                    <img
                        src="/icons/quests/link.svg"
                        alt="URL 퀘스트"
                        className="w-16 h-16 mb-4"
                    />
                    <h3 className="text-lg font-semibold mb-2">URL 퀘스트</h3>
                    <p className="text-sm text-muted-foreground text-center">
                        사용자가 특정 URL을 방문하면 보상을 받는 퀘스트
                    </p>
                </button>

                <button
                    onClick={() => onSelect("REFERRAL")}
                    className="flex flex-col items-center p-6 border rounded-lg hover:border-primary transition-colors"
                >
                    <img
                        src="/icons/quests/social.svg"
                        alt="초대 퀘스트"
                        className="w-16 h-16 mb-4"
                    />
                    <h3 className="text-lg font-semibold mb-2">초대 퀘스트</h3>
                    <p className="text-sm text-muted-foreground text-center">
                        친구를 초대하고 보상을 받는 퀘스트
                    </p>
                </button>
            </div>
        </div>
    );
}
