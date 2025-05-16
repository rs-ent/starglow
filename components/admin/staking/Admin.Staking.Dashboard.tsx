/// components/admin/staking/Admin.Staking.Dashboard.tsx

"use client";

import { useState } from "react";
import AdminStakingRewardList from "./Admin.Staking.Reward.List";
import AdminStakingList from "./Admin.Staking.List";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminStakingDashboard() {
    const [selectedTab, setSelectedTab] = useState("rewards");

    return (
        <div>
            <h1>Staking Dashboard</h1>
            <Tabs
                value={selectedTab}
                onValueChange={setSelectedTab}
                className="w-full"
            >
                <TabsList>
                    <TabsTrigger value="staking">스테이킹 현황</TabsTrigger>
                    <TabsTrigger value="rewards">스테이킹 리워드</TabsTrigger>
                </TabsList>
                <TabsContent value="rewards">
                    <AdminStakingRewardList />
                </TabsContent>
                <TabsContent value="staking">
                    <AdminStakingList />
                </TabsContent>
            </Tabs>
        </div>
    );
}
