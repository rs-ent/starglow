"use client";

import { getWalletsCount } from "@/app/actions/userDashboard/actions";
import { useState, useEffect } from "react";

interface AdminUsersDashboardAnalyticsProps {
    className?: string;
}

export default function AdminUsersDashboardAnalytics({
    className = "",
}: AdminUsersDashboardAnalyticsProps) {
    const [walletsCount, setWalletsCount] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const count = await getWalletsCount();
                setWalletsCount(count);
            } catch (err) {
                console.error("Failed to fetch wallets count:", err);
                setError("데이터를 불러오는데 실패했습니다.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData().catch((err) => {
            console.error("Failed to fetch wallets count:", err);
            setError("데이터를 불러오는데 실패했습니다.");
        });
    }, []);

    if (isLoading) {
        return (
            <div className={`p-4 ${className}`}>
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-700 rounded w-48"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`p-4 ${className}`}>
                <div className="text-red-400">{error}</div>
            </div>
        );
    }

    return (
        <div className={`p-4 ${className}`}>
            <h1 className="text-2xl font-bold text-white">
                활성 지갑 수: {walletsCount?.toLocaleString() || 0}
            </h1>
        </div>
    );
}
