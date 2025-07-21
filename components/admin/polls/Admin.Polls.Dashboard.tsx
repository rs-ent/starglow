// components/admin/polls/Admin.Polls.Dashboard.tsx

"use client";

import { useState } from "react";
import { BarChart3, List, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import PollCreateModal from "./Admin.Polls.CreateModal";
import AdminPollsList from "./Admin.Polls.List";
import AdminPollsBettingMode from "./Admin.Polls.BettingMode";
import { AdminPollsOnchainDeploy } from "./Admin.Polls.Onchain.Deploy";

export default function AdminPollsDashboard() {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [viewType, setViewType] = useState<"table" | "card">("table");
    const [activeTab, setActiveTab] = useState<
        "general" | "betting" | "onchain"
    >("general");

    return (
        <>
            {showCreateModal && (
                <PollCreateModal
                    open={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                />
            )}

            <div className="space-y-6">
                {/* 메인 탭 네비게이션 */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-foreground">
                            Polls Management
                        </h1>
                        <Badge variant="outline" className="text-sm">
                            Admin Dashboard
                        </Badge>
                    </div>
                    <Button onClick={() => setShowCreateModal(true)}>
                        <Settings className="w-4 h-4 mr-2" />+ 새 Poll 만들기
                    </Button>
                </div>

                <Tabs
                    value={activeTab}
                    onValueChange={(value) =>
                        setActiveTab(value as "general" | "betting" | "onchain")
                    }
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-3 bg-muted">
                        <TabsTrigger
                            value="general"
                            className="flex items-center gap-2"
                        >
                            <List className="w-4 h-4" />
                            일반 폴 관리
                        </TabsTrigger>
                        <TabsTrigger
                            value="betting"
                            className="flex items-center gap-2"
                        >
                            <BarChart3 className="w-4 h-4" />
                            베팅 모드 관리
                            <Badge variant="secondary" className="ml-1 text-xs">
                                Live
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger
                            value="onchain"
                            className="flex items-center gap-2"
                        >
                            <Settings className="w-4 h-4" />
                            온체인 관리
                            <Badge variant="default" className="ml-1 text-xs">
                                Contract
                            </Badge>
                        </TabsTrigger>
                    </TabsList>

                    {/* 일반 폴 관리 탭 */}
                    <TabsContent value="general" className="space-y-6">
                        <Card className="border-none shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-4 border-b">
                                <div className="flex items-center gap-3">
                                    <List className="w-5 h-5 text-muted-foreground" />
                                    <h2 className="text-lg font-semibold">
                                        전체 폴 목록
                                    </h2>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant={
                                            viewType === "table"
                                                ? "default"
                                                : "outline"
                                        }
                                        onClick={() => setViewType("table")}
                                        size="sm"
                                    >
                                        Table
                                    </Button>
                                    <Button
                                        variant={
                                            viewType === "card"
                                                ? "default"
                                                : "outline"
                                        }
                                        onClick={() => setViewType("card")}
                                        size="sm"
                                    >
                                        Card
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <AdminPollsList viewType={viewType} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 베팅 모드 관리 탭 */}
                    <TabsContent value="betting" className="space-y-6">
                        <AdminPollsBettingMode />
                    </TabsContent>

                    {/* 온체인 관리 탭 */}
                    <TabsContent value="onchain" className="space-y-6">
                        <AdminPollsOnchainDeploy />
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}
