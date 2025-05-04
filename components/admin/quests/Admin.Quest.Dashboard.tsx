/// components/admin/quests/Admin.Quest.Dashboard.tsx

"use client";

import AdminQuestList from "./Admin.Quest.List";

export default function AdminQuestDashboard() {
    return (
        <div className="flex flex-col gap-4">
            <AdminQuestList />
        </div>
    );
}
