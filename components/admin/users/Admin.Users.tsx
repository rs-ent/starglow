"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BarChart3, List } from "lucide-react";
import AdminUsersDashboardAnalytics from "./Admin.Users.Dashboard.Analytics";
import AdminUsersList from "./Admin.Users.List";

type ViewType = "analytics" | "list";

export default function AdminUsers() {
    const [currentView, setCurrentView] = useState<ViewType>("analytics");

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="h-6 w-6" />
                            사용자 관리
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant={
                                    currentView === "analytics"
                                        ? "default"
                                        : "outline"
                                }
                                size="sm"
                                onClick={() => setCurrentView("analytics")}
                                className="flex items-center gap-2"
                            >
                                <BarChart3 className="h-4 w-4" />
                                분석
                            </Button>
                            <Button
                                variant={
                                    currentView === "list"
                                        ? "default"
                                        : "outline"
                                }
                                size="sm"
                                onClick={() => setCurrentView("list")}
                                className="flex items-center gap-2"
                            >
                                <List className="h-4 w-4" />
                                목록
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
            </Card>

            {currentView === "analytics" && <AdminUsersDashboardAnalytics />}
            {currentView === "list" && <AdminUsersList />}
        </div>
    );
}
