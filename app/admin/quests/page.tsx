/// app/admin/quests/page.tsx

import AdminQuestDashboard from "@/components/admin/quests/Admin.Quest.Dashboard";

export default function AdminQuestsPage() {
    return (
        <div className="admin-quests">
            <h1>Quests Management</h1>
            <AdminQuestDashboard />
        </div>
    );
}
