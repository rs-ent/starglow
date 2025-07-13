"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    BarChart,
    Activity,
    Shield,
    Users,
    Wallet,
    TrendingUp,
} from "lucide-react";

// 각 탭별 컴포넌트 imports
import { AdminUsersDashboardOverview } from "./Admin.Users.Dashboard.Overview";
import { AdminUsersDashboardWalletAnalysis } from "./Admin.Users.Dashboard.WalletAnalysis";
import AdminUsersDashboardAssetAnalysis from "./Admin.Users.Dashboard.AssetAnalysis";
import AdminUsersDashboardActivityPatterns from "./Admin.Users.Dashboard.ActivityPatterns";
import { AdminUsersDashboardRiskAnalysis } from "./Admin.Users.Dashboard.RiskAnalysis";
import { AdminUsersDashboardUserTable } from "./Admin.Users.Dashboard.UserTable";
import { AdminUsersDashboardAnalytics } from "./Admin.Users.Dashboard.Analytics";

// 🎯 탭 정의 타입
interface DashboardTab {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    badge?: string;
    badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

// 📊 대시보드 탭 구성
const DASHBOARD_TABS: DashboardTab[] = [
    {
        id: "overview",
        label: "개요",
        icon: BarChart,
        description: "핵심 지표 및 전체 현황",
        badge: "LIVE",
        badgeVariant: "default",
    },
    {
        id: "analytics",
        label: "Analytics",
        icon: TrendingUp,
        description: "Executive dashboard for stakeholders and investors",
        badge: "EXECUTIVE",
        badgeVariant: "default",
    },
    {
        id: "wallet-analysis",
        label: "지갑 분석",
        icon: Wallet,
        description: "지갑 중심 상세 분석",
        badge: "WEB3",
        badgeVariant: "secondary",
    },
    {
        id: "asset-analysis",
        label: "자산 분석",
        icon: TrendingUp,
        description: "자산 보유 및 분포 현황",
    },
    {
        id: "activity-patterns",
        label: "활동 패턴",
        icon: Activity,
        description: "DAU/MAU 중심의 사용자 활동 분석",
        badge: "ANALYTICS",
        badgeVariant: "secondary",
    },
    {
        id: "risk-analysis",
        label: "위험 분석",
        icon: Shield,
        description: "보안 및 위험 요소 분석",
        badge: "SECURITY",
        badgeVariant: "destructive",
    },
    {
        id: "user-table",
        label: "사용자 목록",
        icon: Users,
        description: "상세 사용자 데이터 테이블",
    },
];

// 🎯 메인 Dashboard 컴포넌트
export function AdminUsersDashboard() {
    const [activeTab, setActiveTab] = useState<string>("overview");

    const currentTab = DASHBOARD_TABS.find((tab) => tab.id === activeTab);

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <div className="container mx-auto px-4 py-8 space-y-8">
                {/* Header */}
                <div className="border-b border-slate-800 pb-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold tracking-tight text-white">
                                사용자 대시보드
                            </h1>
                            <p className="text-slate-400">
                                종합적인 사용자 및 지갑 활동 분석
                            </p>
                        </div>
                        <Badge
                            variant="outline"
                            className="bg-slate-800 text-slate-200 border-slate-700"
                        >
                            ADMIN PANEL
                        </Badge>
                    </div>
                </div>

                {/* Main Dashboard */}
                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="space-y-8"
                >
                    {/* Tab Navigation */}
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                        <TabsList className="grid w-full grid-cols-7 bg-transparent">
                            {DASHBOARD_TABS.map((tab) => {
                                const IconComponent = tab.icon;
                                const isActive = activeTab === tab.id;

                                return (
                                    <TabsTrigger
                                        key={tab.id}
                                        value={tab.id}
                                        className={`flex items-center gap-2 px-4 py-3 rounded-md transition-all ${
                                            isActive
                                                ? "bg-slate-800 text-white border border-slate-700"
                                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                                        }`}
                                    >
                                        <IconComponent className="h-4 w-4" />
                                        <span className="font-medium">
                                            {tab.label}
                                        </span>
                                        {tab.badge && (
                                            <Badge
                                                variant={
                                                    tab.badgeVariant ||
                                                    "default"
                                                }
                                                className="ml-1 text-xs px-1.5 py-0.5"
                                            >
                                                {tab.badge}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                    </div>

                    {/* Tab Description */}
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                {currentTab && (
                                    <>
                                        <div className="p-2 bg-slate-800 rounded-lg">
                                            <currentTab.icon className="h-5 w-5 text-slate-200" />
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-xl text-white">
                                                {currentTab.label}
                                            </CardTitle>
                                            <CardDescription className="text-slate-400">
                                                {currentTab.description}
                                            </CardDescription>
                                        </div>
                                        {currentTab.badge && (
                                            <Badge
                                                variant={
                                                    currentTab.badgeVariant ||
                                                    "default"
                                                }
                                                className="bg-slate-800 text-slate-200 border-slate-700"
                                            >
                                                {currentTab.badge}
                                            </Badge>
                                        )}
                                    </>
                                )}
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Tab Content */}
                    <div className="space-y-6">
                        <TabsContent value="overview" className="space-y-6">
                            <AdminUsersDashboardOverview />
                        </TabsContent>

                        <TabsContent value="analytics" className="space-y-6">
                            <AdminUsersDashboardAnalytics />
                        </TabsContent>

                        <TabsContent
                            value="wallet-analysis"
                            className="space-y-6"
                        >
                            <AdminUsersDashboardWalletAnalysis />
                        </TabsContent>

                        <TabsContent
                            value="asset-analysis"
                            className="space-y-6"
                        >
                            <AdminUsersDashboardAssetAnalysis />
                        </TabsContent>

                        <TabsContent
                            value="activity-patterns"
                            className="space-y-6"
                        >
                            <AdminUsersDashboardActivityPatterns />
                        </TabsContent>

                        <TabsContent
                            value="risk-analysis"
                            className="space-y-6"
                        >
                            <AdminUsersDashboardRiskAnalysis />
                        </TabsContent>

                        <TabsContent value="user-table" className="space-y-6">
                            <AdminUsersDashboardUserTable />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}

export default AdminUsersDashboard;
