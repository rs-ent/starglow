// components/admin/polls/Admin.Polls.Dashboard.tsx

"use client";

import { useState } from "react";

import { usePollsGet } from "@/app/hooks/usePolls";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import PollCreateModal from "./Admin.Polls.CreateModal";
import AdminPollsList from "./Admin.Polls.List";

export default function AdminPollsDashboard() {
    const { pollsList, isLoading, error } = usePollsGet({});
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [viewType, setViewType] = useState<"table" | "card">("table");

    if (isLoading) return <div>로딩 중...</div>;
    if (error) return <div>오류 발생: {error.message}</div>;

    return (
        <>
            {showCreateModal && (
                <PollCreateModal
                    open={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                />
            )}
            <Card className="border-none shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 py-4 border-b">
                    <Button onClick={() => setShowCreateModal(true)}>
                        + 새 Poll 만들기
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            variant={
                                viewType === "table" ? "default" : "outline"
                            }
                            onClick={() => setViewType("table")}
                        >
                            Table
                        </Button>
                        <Button
                            variant={
                                viewType === "card" ? "default" : "outline"
                            }
                            onClick={() => setViewType("card")}
                        >
                            Card
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <AdminPollsList viewType={viewType} />
                </CardContent>
            </Card>
        </>
    );
}
