// components/admin/polls/Admin.Polls.Dashboard.tsx

"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

import PollCreateModal from "./Admin.Polls.CreateModal";
import AdminPollsList from "./Admin.Polls.List";

export default function AdminPollsDashboard() {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [viewType, setViewType] = useState<"table" | "card">("table");

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
